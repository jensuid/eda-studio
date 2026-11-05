"""Job Manager — backend-authoritative lifecycle (SYS-015, Doc05 §8.2).

State machine: Created -> Queued -> Preparing -> Running ->
Completed | Failed | Cancelling -> Cancelled. Interrupted is reserved for
crash recovery evaluation (OBS-009). Every transition emits a durable
lifecycle event (IPC-007); frame-level progress is ephemeral and NOT
persisted here.
"""
from __future__ import annotations

from collections.abc import Callable
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


class JobManager:
    def __init__(self, store: Store) -> None:
        self.store = store
        self._seq = 0

    def _transition(self, job: JobStatus, to: JobState, message: str = "") -> None:
        allowed = _TRANSITIONS[job.state]
        if to not in allowed:
            raise ValueError(f"illegal job transition {job.state.value} -> {to.value}")
        job.state = to
        self._seq += 1
        event = JobEvent(
            event_id=new_id(),
            job_id=job.job_id,
            correlation_id=job.correlation_id,
            state=to,
            seq=self._seq,
            message=message,
        )
        self.store.save_event(
            event.event_id, event.job_id, event.correlation_id,
            event.state.value, event.seq, event.message,
        )
        self.store.save_job(job.job_id, job.command, to.value, job.correlation_id)

    def run(self, command: str, fn: Callable[[], Any],
            correlation_id: str | None = None) -> JobStatus:
        """Run `fn` through the canonical lifecycle and return final status.

        Any exception from `fn` is captured as Failed (never re-raised across
        the IPC boundary; translation to ErrorContract happens in `ipc.py`).
        """
        job = JobStatus(
            job_id=new_id(), command=command,
            state=JobState.CREATED, correlation_id=correlation_id,
        )
        self.store.save_job(job.job_id, command, job.state.value, correlation_id)
        try:
            self._transition(job, JobState.QUEUED)
            self._transition(job, JobState.PREPARING)
            self._transition(job, JobState.RUNNING)
            fn()
            self._transition(job, JobState.COMPLETED)
        except Exception:
            if job.state in _TRANSITIONS and JobState.FAILED in _TRANSITIONS[job.state]:
                self._transition(job, JobState.FAILED)
            raise
        return job

    def events_since(self, seq: int) -> list[JobEvent]:
        return [
            JobEvent(
                event_id=r["event_id"], job_id=r["job_id"],
                correlation_id=r["correlation_id"],
                state=JobState(r["state"]), seq=r["seq"], message=r["message"],
            )
            for r in self.store.events_since(seq)
        ]
