"""D-F3: IPC dataset.get — full DatasetRecord for resume rehydration.

Columns come from registered snapshot metadata (DB registry), never from
loading snapshot bytes / whole-DataFrame JSON. Unknown project or dataset
must fail closed (NOT_FOUND), same as other queries.
"""
from tests.conftest import FIXTURE_CSV


def _import(bridge, project_id):
    imp = bridge.execute_command({
        "request_id": "r-2", "command": "dataset.import",
        "payload": {"project_id": project_id, "source_path": str(FIXTURE_CSV),
                    "dataset_name": "sample"},
    })
    assert imp["ok"], imp
    return imp["data"]


def test_dataset_get_returns_columns_from_snapshot_metadata(bridge, project_id):
    ds = _import(bridge, project_id)
    res = bridge.execute_query({
        "request_id": "r-3", "command": "dataset.get",
        "payload": {"project_id": project_id, "dataset_id": ds["dataset_id"]},
    })
    assert res["ok"], res
    assert res["data"]["dataset_id"] == ds["dataset_id"]
    assert res["data"]["snapshot_id"] == ds["snapshot_id"]
    assert res["data"]["fingerprint"] == ds["fingerprint"]
    assert res["data"]["row_count"] == 5
    assert res["data"]["columns"] == ["id", "region", "sales"]


def test_dataset_get_unknown_dataset_not_found(bridge, project_id):
    _import(bridge, project_id)
    res = bridge.execute_query({
        "request_id": "r-4", "command": "dataset.get",
        "payload": {"project_id": project_id, "dataset_id": "ds_missing"},
    })
    assert not res["ok"]
    assert res["error"]["code"] == "NOT_FOUND"


def test_dataset_get_project_mismatch_not_found(bridge, project_id):
    ds = _import(bridge, project_id)
    res = bridge.execute_query({
        "request_id": "r-5", "command": "dataset.get",
        "payload": {"project_id": "proj_missing", "dataset_id": ds["dataset_id"]},
    })
    assert not res["ok"]
    assert res["error"]["code"] == "NOT_FOUND"
