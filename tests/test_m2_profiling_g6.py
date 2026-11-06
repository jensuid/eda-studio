"""G6: job-wrapped profiling + persisted history + snapshots list."""
from pathlib import Path

FIXTURE = Path(__file__).parent / "fixtures" / "sample.csv"


def _import(bridge, project_id) -> str:
    res = bridge.execute_command({
        "request_id": "i1", "command": "dataset.import",
        "payload": {"project_id": project_id, "source_path": str(FIXTURE),
                    "dataset_name": "sample"},
    })
    assert res["ok"], res
    return res["data"]["dataset_id"]


def test_run_profile_job_persisted_and_reopened(bridge, project_id):
    ds = _import(bridge, project_id)
    res = bridge.execute_command({
        "request_id": "r1", "command": "dataset.profile.run",
        "payload": {"project_id": project_id, "dataset_id": ds},
    })
    assert res["ok"], res
    prof = res["data"]
    assert prof["profile_id"]
    assert prof["row_count"] == 5
    # job lifecycle events are durable
    events = bridge.get_events(0)
    assert any(e["state"] == "Completed" or getattr(e["state"], "name", "") == "COMPLETED" for e in events)
    # history list contains the run
    lst = bridge.execute_query({
        "request_id": "l1", "command": "dataset.profiles.list",
        "payload": {"project_id": project_id, "dataset_id": ds},
    })
    assert lst["ok"], lst
    assert [p["profile_id"] for p in lst["data"]["profiles"]] == [prof["profile_id"]]
    # reopen by id without recompute
    got = bridge.execute_query({
        "request_id": "g1", "command": "dataset.profile.get",
        "payload": {"project_id": project_id, "profile_id": prof["profile_id"]},
    })
    assert got["ok"], got
    assert got["data"]["fingerprint"] == prof["fingerprint"]
    # snapshots list
    snaps = bridge.execute_query({
        "request_id": "s1", "command": "dataset.snapshots.list",
        "payload": {"project_id": project_id},
    })
    assert snaps["ok"], snaps
    assert len(snaps["data"]["snapshots"]) == 1
    s = snaps["data"]["snapshots"][0]
    assert s["dataset_id"] == ds and s["row_count"] == 5


def test_run_profile_unknown_dataset_maps_not_found(bridge, project_id):
    res = bridge.execute_command({
        "request_id": "r9", "command": "dataset.profile.run",
        "payload": {"project_id": project_id, "dataset_id": "nope"},
    })
    assert res["ok"] is False
    assert res["error"]["code"] == "NOT_FOUND"
