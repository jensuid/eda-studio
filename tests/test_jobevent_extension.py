"""D-F5 — JobEvent extension: command, progress, started_at, finished_at.

Backend-first: Pydantic contract is the source of truth; TS is generated.
All new fields are optional (nullable) so legacy events stay valid.
"""
import json
from datetime import UTC, datetime

import pytest
from pydantic import ValidationError

from backend.contracts import JobEvent, JobState
from backend.execution import JobManager
from backend.persistence import Store


def _manager(tmp_path):
    return JobManager(Store(tmp_path / "p"))


def test_new_fields_serialize(tmp_path):
    jobs = _manager(tmp_path)
    jobs.run("profiling.run", lambda: 42)
    events = jobs.events_since(0)
    assert events, "expected lifecycle events"
    for e in events:
        assert e.command == "profiling.run"
        assert e.started_at is not None
        dumped = e.model_dump(mode="json")
        assert dumped["command"] == "profiling.run"
        assert dumped["started_at"] is not None
        # JSON-roundtrip preserves the new fields
        assert JobEvent(**json.loads(json.dumps(dumped))) == e


def test_defaults_are_nullable_for_legacy_events():
    legacy = JobEvent(event_id="e1", job_id="j1", state=JobState.RUNNING, seq=1)
    assert legacy.command is None
    assert legacy.progress is None
    assert legacy.started_at is None
    assert legacy.finished_at is None
    dumped = legacy.model_dump(mode="json")
    assert dumped["command"] is None
    assert dumped["progress"] is None


def test_terminal_event_has_finished_at_and_progress_one(tmp_path):
    jobs = _manager(tmp_path)
    jobs.run("history.run", lambda: None)
    events = jobs.events_since(0)
    terminal = events[-1]
    assert terminal.state == JobState.COMPLETED
    assert terminal.finished_at is not None
    assert terminal.finished_at >= terminal.started_at
    assert terminal.progress == 1.0


def test_progress_is_null_when_not_available(tmp_path):
    jobs = _manager(tmp_path)
    jobs.run("quiet.run", lambda: None)
    non_terminal = [e for e in jobs.events_since(0) if e.state != JobState.COMPLETED]
    # No progress_fn supplied -> honest null, never fabricated.
    assert all(e.progress is None for e in non_terminal)


def test_progress_fn_supplies_real_values(tmp_path):
    jobs = _manager(tmp_path)
    jobs.run("tracked.run", lambda: None, progress_fn=lambda: 0.42)
    events = [e for e in jobs.events_since(0) if e.progress is not None and e.state != JobState.COMPLETED]
    assert events and all(e.progress == 0.42 for e in events)


def test_progress_bounds_validated():
    with pytest.raises(ValidationError):
        JobEvent(event_id="e", job_id="j", state=JobState.RUNNING, seq=1, progress=1.5)
    with pytest.raises(ValidationError):
        JobEvent(event_id="e", job_id="j", state=JobState.RUNNING, seq=1, progress=-0.1)


def test_failed_event_has_no_fake_progress(tmp_path):
    jobs = _manager(tmp_path)

    def boom():
        raise RuntimeError("boom")

    with pytest.raises(RuntimeError):
        jobs.run("doomed.run", boom)
    failed = jobs.events_since(0)[-1]
    assert failed.state == JobState.FAILED
    assert failed.command == "doomed.run"
    assert failed.finished_at is not None
    assert failed.progress is None  # unknown how far it got — honest null


def test_report_progress_validates_and_stores(tmp_path):
    jobs = _manager(tmp_path)
    from backend.contracts import JobStatus

    job = JobStatus(job_id="j-x", command="manual.run", state=JobState.RUNNING)
    ev = jobs.report_progress(job, 0.25, started_at=datetime(2026, 11, 8, 4, 0, tzinfo=UTC))
    assert ev.progress == 0.25
    assert ev.command == "manual.run"
    # persisted round-trip
    stored = jobs.events_since(0)[-1]
    assert stored.progress == 0.25
    assert stored.command == "manual.run"
    with pytest.raises(ValueError):
        jobs.report_progress(job, 2.0)
