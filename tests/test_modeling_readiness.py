"""G3: anomaly + modeling-readiness (deterministic, read-only, no persistence).

Mirrors the quality/plan test patterns: snapshot is never mutated, reruns
are deterministic, unknown command denied (default-deny), readiness is
plan-step eligible (create -> approve -> execute round-trip).
"""
import io
import json

import pyarrow as pa
import pyarrow.parquet as pq

from backend.modeling_readiness import _skewness, assess_readiness

# ---------- pure module: deterministic unit checks ----------


def _parquet(columns: dict[str, list]) -> bytes:
    buf = io.BytesIO()
    pq.write_table(pa.table(columns), buf)
    return buf.getvalue()


def test_skewness_known_values():
    assert _skewness([1.0, 1.0, 1.0, 1.0]) == 0.0  # constant -> undefined -> 0
    assert _skewness([1.0, 2.0]) == 0.0  # n < 3 -> 0
    assert _skewness([1, 2, 3, 4, 5]) == 0.0 or abs(_skewness([1, 2, 3, 4, 5])) < 1e-9
    # heavy right tail -> positive skew
    assert _skewness([1, 1, 1, 1, 1, 1, 1, 1, 100]) > 1


def test_clean_numeric_dataset_is_mostly_ok():
    r = assess_readiness(_parquet({"a": list(range(200)), "b": list(range(200))}))
    assert r["row_count"] == 200
    assert r["numeric_count"] == 2
    assert r["categorical_count"] == 0
    by_id = {i["check_id"]: i for i in r["items"] if i["column_name"] is None}
    assert by_id["row_count_sufficiency"]["status"] == "ok"
    assert by_id["numeric_target_candidate"]["status"] == "ok"
    assert by_id["missingness"]["status"] == "ok"
    assert by_id["duplicate_rows"]["status"] == "ok"
    assert r["score"] >= 90


def test_outlier_and_small_sample_flagged():
    # one huge value among small ones -> IQR outlier check fires
    data = {"x": [10, 11, 9, 10, 11, 9, 10, 11, 9, 10000]}
    r = assess_readiness(_parquet(data))
    outliers = [i for i in r["items"] if i["check_id"] == "iqr_outliers"]
    assert outliers and outliers[0]["evidence_count"] >= 1
    assert outliers[0]["example_row_indexes"] == [9]
    assert outliers[0]["status"] in ("check", "problem")
    by_id = {i["check_id"]: i for i in r["items"] if i["column_name"] is None}
    assert by_id["row_count_sufficiency"]["status"] == "problem"  # 10 rows < 30


def test_constant_and_high_cardinality_flagged():
    r = assess_readiness(_parquet({
        "const": list("z" * 12),
        "ids": [f"id-{i}" for i in range(12)],
        "note": list("abc" * 4),
    }))
    const = [i for i in r["items"] if i["check_id"] == "constant_column" and i["column_name"] == "const"]
    assert const[0]["status"] == "check"
    hc = [i for i in r["items"] if i["check_id"] == "high_cardinality" and i["column_name"] == "ids"]
    assert hc[0]["status"] == "check"
    by_id = {i["check_id"]: i for i in r["items"] if i["column_name"] is None}
    assert by_id["numeric_target_candidate"]["status"] == "problem"  # no numeric cols


def test_example_indexes_capped():
    # many outliers -> example indexes never exceed the cap
    data = {"x": [0] * 50 + list(range(5000, 5100))}
    r = assess_readiness(_parquet(data))
    for item in r["items"]:
        assert len(item["example_row_indexes"]) <= 20


def test_deterministic_rerun():
    p = _parquet({"a": [1, 2, 3, 100, 5, 6, 7, 8]})
    assert assess_readiness(p) == assess_readiness(p)


# ---------- service + IPC: command, plan eligibility, trust boundaries ----------


from pathlib import Path

FIXTURE = Path(__file__).parent / "fixtures" / "sample.csv"


def _import(bridge, project_id):
    res = bridge.execute_command({
        "request_id": "r-import", "command": "dataset.import",
        "payload": {"project_id": project_id, "source_path": str(FIXTURE),
                    "dataset_name": "sample"},
    })
    assert res["ok"], res
    return res["data"]


def _cmd(bridge, command, payload, rid="c1"):
    return bridge.execute_command({
        "request_id": rid, "command": command, "payload": payload})


def test_readiness_run_via_ipc(bridge, project_id):
    ds = _import(bridge, project_id)
    res = _cmd(bridge, "dataset.readiness.run",
               {"project_id": project_id, "dataset_id": ds["dataset_id"]})
    assert res["ok"], res
    rec = res["data"]
    assert rec["dataset_id"] == ds["dataset_id"]
    assert rec["snapshot_id"] == ds["snapshot_id"]
    assert rec["fingerprint"] == ds["fingerprint"]
    assert rec["row_count"] == 5  # sample.csv has 5 rows
    assert rec["column_count"] == 3
    assert rec["numeric_count"] == 2  # id, sales
    assert rec["categorical_count"] == 1  # region
    statuses = {i["status"] for i in rec["items"]}
    assert statuses <= {"ok", "check", "problem"}
    total = rec["ok_count"] + rec["check_count"] + rec["problem_count"]
    assert total == len(rec["items"])
    assert 0 <= rec["score"] <= 100
    row_check = [i for i in rec["items"] if i["check_id"] == "row_count_sufficiency"]
    assert row_check[0]["status"] == "problem"  # 5 rows < 30
    # payload stays small (ADR-003): aggregates only, capped indexes
    assert len(json.dumps(rec)) < 20 * 1024


def test_readiness_rerun_deterministic_via_ipc(bridge, project_id):
    ds = _import(bridge, project_id)
    p = {"project_id": project_id, "dataset_id": ds["dataset_id"]}
    r1 = _cmd(bridge, "dataset.readiness.run", p, rid="r1")
    r2 = _cmd(bridge, "dataset.readiness.run", p, rid="r2")
    assert r1["ok"] and r2["ok"]
    assert r1["data"] == r2["data"]


def test_readiness_unknown_dataset_not_found(bridge, project_id):
    res = _cmd(bridge, "dataset.readiness.run",
               {"project_id": project_id, "dataset_id": "nope"})
    assert not res["ok"] and res["error"]["code"] == "NOT_FOUND"


def test_readiness_other_project_not_found(bridge, project_id):
    ds = _import(bridge, project_id)
    other = bridge.execute_command({
        "request_id": "r-other", "command": "project.create",
        "payload": {"name": "Other"},
    })
    assert other["ok"]
    other_id = other["data"]["project_id"]
    res = _cmd(bridge, "dataset.readiness.run",
               {"project_id": other_id, "dataset_id": ds["dataset_id"]})
    assert not res["ok"] and res["error"]["code"] == "NOT_FOUND"


def test_readiness_plan_step_roundtrip(bridge, project_id):
    ds = _import(bridge, project_id)
    created = _cmd(bridge, "plan.create", {
        "project_id": project_id, "dataset_id": ds["dataset_id"],
        "steps": [{"kind": "readiness", "params": {}}],
    })
    assert created["ok"], created
    plan_id = created["data"]["plan_id"]
    approved = _cmd(bridge, "plan.approve",
                    {"project_id": project_id, "plan_id": plan_id})
    assert approved["ok"] and approved["data"]["status"] == "approved"
    executed = _cmd(bridge, "plan.execute",
                    {"project_id": project_id, "plan_id": plan_id})
    assert executed["ok"], executed
    assert executed["data"]["status"] == "executed"
    assert executed["data"]["steps"][0]["status"] == "completed"


def test_readiness_step_rejects_unknown_params(bridge, project_id):
    ds = _import(bridge, project_id)
    res = _cmd(bridge, "plan.create", {
        "project_id": project_id, "dataset_id": ds["dataset_id"],
        "steps": [{"kind": "readiness", "params": {"column_name": "sales"}}],
    })
    assert not res["ok"] and res["error"]["code"] == "VALIDATION_ERROR"


def test_unknown_command_still_denied(bridge, project_id):
    res = _cmd(bridge, "dataset.readiness.delete",
               {"project_id": project_id, "dataset_id": "x"})
    assert not res["ok"] and res["error"]["code"] == "PERMISSION_DENIED"
