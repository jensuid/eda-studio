"""M1 vertical slice: create -> import -> snapshot -> preview (TST-002/005)."""
from tests.conftest import FIXTURE_CSV


def test_full_slice(bridge, project_id):
    imp = bridge.execute_command({
        "request_id": "r-2", "command": "dataset.import",
        "payload": {"project_id": project_id, "source_path": str(FIXTURE_CSV),
                    "dataset_name": "sample"},
    })
    assert imp["ok"], imp
    ds = imp["data"]
    assert ds["row_count"] == 5
    assert ds["columns"] == ["id", "region", "sales"]
    assert len(ds["fingerprint"]) == 64  # SHA-256

    prev = bridge.execute_query({
        "request_id": "r-3", "command": "dataset.preview",
        "payload": {"project_id": project_id, "dataset_id": ds["dataset_id"], "limit": 2},
    })
    assert prev["ok"], prev
    assert prev["data"]["total_rows"] == 5
    assert prev["data"]["truncated"] is True
    assert prev["data"]["rows"][0]["region"] == "Jakarta"


def test_import_emits_durable_job_events(bridge, project_id):
    bridge.execute_command({
        "request_id": "r-2", "command": "dataset.import",
        "payload": {"project_id": project_id, "source_path": str(FIXTURE_CSV),
                    "dataset_name": "sample"},
    })
    events = bridge.get_events(0)
    states = [e["state"] for e in events]
    assert states == ["Queued", "Preparing", "Running", "Completed"]
    assert [e["seq"] for e in events] == sorted(e["seq"] for e in events)


def test_reopen_project(bridge, project_id):
    res = bridge.execute_query({"request_id": "r-4", "command": "project.open",
                                "payload": {"project_id": project_id}})
    assert res["ok"] and res["data"]["name"] == "Demo"
