"""Job lifecycle state machine (Doc05 §8.2, SYS-015)."""
import pytest

from backend.contracts import JobState
from backend.execution import JobManager
from backend.persistence import Store


def test_happy_path(tmp_path):
    jobs = JobManager(Store(tmp_path / "p"))
    status = jobs.run("test.cmd", lambda: 42)
    assert status.state == JobState.COMPLETED


def test_failure_is_captured(tmp_path):
    jobs = JobManager(Store(tmp_path / "p"))

    def boom():
        raise RuntimeError("boom")

    with pytest.raises(RuntimeError):
        jobs.run("test.cmd", boom)
    events = jobs.events_since(0)
    assert events[-1].state == JobState.FAILED


def test_illegal_transition_rejected(tmp_path):
    jobs = JobManager(Store(tmp_path / "p"))
    from backend.contracts import JobStatus
    job = JobStatus(job_id="j1", command="c", state=JobState.CREATED)
    with pytest.raises(ValueError):
        jobs._transition(job, JobState.COMPLETED)  # CREATED -> COMPLETED illegal
