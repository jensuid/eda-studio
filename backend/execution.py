"""Job Manager — backend-authoritative lifecycle (SYS-015, Doc05 §8.2).

State machine: Created -> Queued -> Preparing -> Running ->
Completed | Failed | Cancelling -> Cancelled. Interrupted is reserved for
crash recovery evaluation (OBS-009). Every transition emits a durable
lifecycle event (IPC-007); frame-level progress is ephemeral and NOT
persisted here.

D-F5: events now also carry `command` (the IPC command name), `progress`
(real 0..1 value when the caller supplies one — otherwise null, never
fabricated), and `started_at`/`finished_at` timestamps of the job.
"""
from __future__ import annotations

from collections.abc import Callable
from datetime import UTC, datetime
from typing import Any

from backend.contracts import JobEvent, JobState, JobStatus
from backend.domain import new_id
from backend.persistence import Store

_TRANSITIONS: dict[JobState, set[JobState]] = {
    JobState.CREATED: {JobState.QUEUED, JobState.FAILED},
    JobState.QUEUED: {JobState.PREPARING, JobState.CANCELLED},
    JobState.PREPARING: {JobState.RUNNING, JobState.FAILED, JobState.CANCELLING},
    JobState.RUNNING: {JobState.COMPLETED, JobState.FAILED, JobState.CANCELLING},
    JobState.CANCELLING: {JobState.CANCELLED, JobState.FAILED},
    JobState.COMPLETED: set(),
    JobState.FAILED: set(),
    JobState.CANCELLED: set(),
    JobState.INTERRUPTED: {JobState.QUEUED, JobState.FAILED},
}

_TERMINAL = {JobState.COMPLETED, JobState.FAILED, JobState.CANCELLED, JobState.INTERRUPTED}


class JobManager:
    def __init__(self, store: Store) -> None:
        self.store = store
        # K4: durable seq — seed from the persisted max so a restarted
        # manager never reuses a seq already in job_events.
        self._seq = store.max_event_seq()

    def _transition(
        self,
        job: JobStatus,
        to: JobState,
        message: str = "",
        progress: float | None = None,
        started_at: datetime | None = None,
        finished_at: datetime | None = None,
    ) -> JobEvent:
        allowed = _TRANSITIONS[job.state]
        if to not in allowed:
            raise ValueError(f"illegal job transition {job.state.value} -> {to.value}")
        job.state = to
        now = datetime.now(UTC)
        if started_at is None:
            started_at = now
        if to in _TERMINAL and finished_at is None:
            finished_at = now
        if to == JobState.COMPLETED and progress is None:
            # Completion is a real measurement, not a fabrication.
            progress = 1.0
        if progress is not None and not 0.0 <= progress <= 1.0:
            raise ValueError(f"progress out of range [0,1]: {progress}")
        # Never regress below the persisted max (covers a second manager
        # instance writing through the same Store).
        self._seq = max(self._seq, self.store.max_event_seq()) + 1
        event = JobEvent(
            event_id=new_id(),
            job_id=job.job_id,
            correlation_id=job.correlation_id,
            state=to,
            seq=self._seq,
            message=message,
            command=job.command,
            progress=progress,
            started_at=started_at,
            finished_at=finished_at,
        )
        self.store.save_event(
            event.event_id, event.job_id, event.correlation_id,
            event.state.value, event.seq, event.message,
            command=event.command,
            progress=event.progress,
            started_at=event.started_at.isoformat() if event.started_at else None,
            finished_at=event.finished_at.isoformat() if event.finished_at else None,
        )
        self.store.save_job(job.job_id, job.command, to.value, job.correlation_id)
        return event

    def run(
        self,
        command: str,
        fn: Callable[[], Any],
        correlation_id: str | None = None,
        progress_fn: Callable[[], float | None] | None = None,
    ) -> JobStatus:
        """Run `fn` through the canonical lifecycle and return final status.

        Any exception from `fn` is captured as Failed (never re-raised across
        the IPC boundary; translation to ErrorContract happens in `ipc.py`).

        `progress_fn` (optional): called between lifecycle steps to supply a
        real 0..1 progress value. When absent, progress stays null — the
        frontend renders indeterminate rather than a fabricated number.
        """
        job = JobStatus(
            job_id=new_id(), command=command,
            state=JobState.CREATED, correlation_id=correlation_id,
        )
        self.store.save_job(job.job_id, command, job.state.value, correlation_id)
        started_at = datetime.now(UTC)

        def _prog() -> float | None:
            return progress_fn() if progress_fn is not None else None

        try:
            self._transition(job, JobState.QUEUED, started_at=started_at)
            self._transition(job, JobState.PREPARING, started_at=started_at, progress=_prog())
            self._transition(job, JobState.RUNNING, started_at=started_at, progress=_prog())
            fn()
            self._transition(job, JobState.COMPLETED, started_at=started_at, progress=_prog())
        except Exception:
            if job.state in _TRANSITIONS and JobState.FAILED in _TRANSITIONS[job.state]:
                self._transition(job, JobState.FAILED, started_at=started_at, progress=_prog())
            raise
        return job

    def report_progress(
        self,
        job: JobStatus,
        progress: float,
        message: str = "",
        started_at: datetime | None = None,
    ) -> JobEvent:
        """Emit an ephemeral in-lifecycle progress update without a state change.

        Not used by `run` today (progress there comes from `progress_fn` at
        lifecycle steps); provided so future long-running jobs can publish
        real intermediate progress. Validates the 0..1 range.
        """
        if not 0.0 <= progress <= 1.0:
            raise ValueError(f"progress out of range [0,1]: {progress}")
        self._seq = max(self._seq, self.store.max_event_seq()) + 1
        event = JobEvent(
            event_id=new_id(),
            job_id=job.job_id,
            correlation_id=job.correlation_id,
            state=job.state,
            seq=self._seq,
            message=message,
            command=job.command,
            progress=progress,
            started_at=started_at or datetime.now(UTC),
            finished_at=None,
        )
        self.store.save_event(
            event.event_id, event.job_id, event.correlation_id,
            event.state.value, event.seq, event.message,
            command=event.command,
            progress=event.progress,
            started_at=event.started_at.isoformat() if event.started_at else None,
            finished_at=None,
        )
        return event

    def events_since(self, seq: int) -> list[JobEvent]:
        out: list[JobEvent] = []
        for r in self.store.events_since(seq):
            started_at = datetime.fromisoformat(r["started_at"]) if r.get("started_at") else None
            finished_at = datetime.fromisoformat(r["finished_at"]) if r.get("finished_at") else None
            out.append(
                JobEvent(
                    event_id=r["event_id"], job_id=r["job_id"],
                    correlation_id=r["correlation_id"],
                    state=JobState(r["state"]), seq=r["seq"], message=r["message"] or "",
                    command=r.get("command"),
                    progress=r.get("progress"),
                    started_at=started_at,
                    finished_at=finished_at,
                )
            )
        return out
