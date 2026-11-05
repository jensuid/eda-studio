"""M2 profiling slice (SCREEN-PROF-001): univariate descriptives via IPC."""
import csv
from pathlib import Path

FIXTURE = Path(__file__).parent / "fixtures" / "sample.csv"


def _import(bridge, project_id, path: Path) -> str:
    res = bridge.execute_command({"request_id": "i1", "command": "dataset.import",
                                  "payload": {"project_id": project_id,
                                              "source_path": str(path),
                                              "dataset_name": path.stem}})
    assert res["ok"], res
    return res["data"]["dataset_id"]


def _profile(bridge, project_id, dataset_id):
    res = bridge.execute_query({"request_id": "p1", "command": "dataset.profile",
                                "payload": {"project_id": project_id,
                                            "dataset_id": dataset_id}})
    assert res["ok"], res
    return res["data"]


def test_profile_numeric_and_categorical(bridge, project_id):
    ds = _import(bridge, project_id, FIXTURE)
    prof = _profile(bridge, project_id, ds)
    assert prof["row_count"] == 5
    assert prof["column_count"] == 3
    assert prof["fingerprint"] and len(prof["fingerprint"]) == 64
    by_name = {c["name"]: c for c in prof["columns"]}
    sales = by_name["sales"]
    assert sales["inferred_type"] == "numeric"
    assert sales["missing_count"] == 0
    assert sales["min_value"] == 430.0
    assert sales["max_value"] == 1200.0
    assert sales["status"] == "ok"
    region = by_name["region"]
    assert region["inferred_type"] == "categorical"
    assert region["distinct_count"] == 4  # Jakarta repeats once


def test_profile_missing_flags_problem(tmp_path, bridge, project_id):
    csv_path = tmp_path / "sparse.csv"
    with open(csv_path, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["a", "b"])
        w.writerow(["1", "x"])
        w.writerow(["", ""])
        w.writerow(["", ""])
        w.writerow(["", ""])
        w.writerow(["", ""])
    ds = _import(bridge, project_id, csv_path)
    prof = _profile(bridge, project_id, ds)
    by_name = {c["name"]: c for c in prof["columns"]}
    assert by_name["a"]["missing_pct"] == 80.0
    assert by_name["a"]["status"] == "problem"


def test_profile_unknown_dataset_denied(bridge, project_id):
    res = bridge.execute_query({"request_id": "p9", "command": "dataset.profile",
                                "payload": {"project_id": project_id,
                                            "dataset_id": "nope"}})
    assert res["ok"] is False
    assert res["error"]["code"] == "NOT_FOUND"
