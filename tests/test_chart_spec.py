"""NXT-1 chart-spec persistence (gap G1).

Round-trip save/get/list, overwrite increments version, stale fingerprint
rejected with CONFLICT, snapshot of another dataset rejected with
NOT_FOUND, unknown command still denied (SEC-004), payload cap < 50 KB.
"""
from __future__ import annotations

import json
from pathlib import Path

FIXTURE = Path(__file__).parent / "fixtures" / "sample.csv"


def _import(bridge, project_id, name="sample") -> dict:
    res = bridge.execute_command({
        "request_id": "i1", "command": "dataset.import",
        "payload": {"project_id": project_id, "source_path": str(FIXTURE),
                    "dataset_name": name},
    })
    assert res["ok"], res
    return res["data"]


def _cmd(bridge, command, payload, rid="c1"):
    return bridge.execute_command({
        "request_id": rid, "command": command, "payload": payload})


def _query(bridge, command, payload, rid="q1"):
    return bridge.execute_query({
        "request_id": rid, "command": command, "payload": payload})


def _save_payload(ds, **over):
    p = {
        "project_id": ds["_pid"], "dataset_id": ds["dataset_id"],
        "snapshot_id": ds["snapshot_id"], "fingerprint": ds["fingerprint"],
        "chart_type": "scatter", "x": "income", "y": "age",
        "group": None, "encodings": {"color": "age"},
        "options": {"title": "Income vs Age"},
    }
    p.update(over)
    return p


def test_roundtrip_save_get_list(bridge, project_id):
    ds = _import(bridge, project_id)
    ds["_pid"] = project_id

    res = _cmd(bridge, "chart.spec.save", _save_payload(ds))
    assert res["ok"], res
    spec = res["data"]
    assert spec["chart_type"] == "scatter"
    assert spec["version"] == 1
    assert spec["x"] == "income" and spec["y"] == "age"
    # small spec only — no data rows over IPC
    assert len(json.dumps(spec)) < 50 * 1024

    res = _query(bridge, "chart.spec.get", {
        "project_id": project_id, "chart_id": spec["chart_id"]})
    assert res["ok"], res
    assert res["data"]["fingerprint"] == ds["fingerprint"]

    res = _query(bridge, "chart.spec.list", {
        "project_id": project_id, "dataset_id": ds["dataset_id"]})
    assert res["ok"] and len(res["data"]["specs"]) == 1, res


def test_overwrite_increments_version(bridge, project_id):
    ds = _import(bridge, project_id)
    ds["_pid"] = project_id
    res = _cmd(bridge, "chart.spec.save", _save_payload(ds))
    assert res["ok"], res
    cid = res["data"]["chart_id"]

    res = _cmd(bridge, "chart.spec.save",
               _save_payload(ds, chart_id=cid, y="debt"), "c2")
    assert res["ok"], res
    assert res["data"]["chart_id"] == cid
    assert res["data"]["version"] == 2
    assert res["data"]["y"] == "debt"


def test_stale_fingerprint_conflict(bridge, project_id):
    ds = _import(bridge, project_id)
    ds["_pid"] = project_id
    res = _cmd(bridge, "chart.spec.save",
               _save_payload(ds, fingerprint="0" * 64))
    assert not res["ok"] and res["error"]["code"] == "CONFLICT", res


def test_snapshot_of_other_dataset_not_found(bridge, project_id):
    ds1 = _import(bridge, project_id, "one")
    ds2 = _import(bridge, project_id, "two")
    payload = {
        "project_id": project_id, "dataset_id": ds2["dataset_id"],
        "snapshot_id": ds1["snapshot_id"], "fingerprint": ds1["fingerprint"],
        "chart_type": "bar", "x": "income", "y": "age",
    }
    res = _cmd(bridge, "chart.spec.save", payload)
    assert not res["ok"] and res["error"]["code"] == "NOT_FOUND", res


def test_unknown_command_still_denied(bridge):
    res = bridge.execute_command({
        "request_id": "r-x", "command": "chart.spec.unknown", "payload": {}})
    assert res["ok"] is False
    assert res["error"]["code"] == "PERMISSION_DENIED"


def test_payload_cap_rejects_oversized_spec(bridge, project_id):
    ds = _import(bridge, project_id)
    ds["_pid"] = project_id
    big = {"blob": "x" * (51 * 1024)}
    res = _cmd(bridge, "chart.spec.save",
               _save_payload(ds, options=big))
    assert not res["ok"] and res["error"]["code"] == "VALIDATION_ERROR", res


def test_required_fields_per_type(bridge, project_id):
    ds = _import(bridge, project_id)
    ds["_pid"] = project_id
    # scatter requires y
    res = _cmd(bridge, "chart.spec.save",
               _save_payload(ds, chart_type="scatter", y=None))
    assert not res["ok"] and res["error"]["code"] == "VALIDATION_ERROR", res
    # hist does not require y
    res = _cmd(bridge, "chart.spec.save",
               _save_payload(ds, chart_type="hist", y=None), "c2")
    assert res["ok"], res
