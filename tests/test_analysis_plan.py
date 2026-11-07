"""NXT-2 Analysis Plan + DAG Execution (gap G2).

create -> approve -> execute round-trip, unregistered step rejected at create,
execute without approve rejected, per-step statuses persisted, small spec
payloads only (ADR-003), unknown command still denied (SEC-004).
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


def _steps():
    return [
        {"kind": "profile", "params": {}},
        {"kind": "histogram", "params": {"column_name": "sales"}},
        {"kind": "quality", "params": {}},
    ]


def _create_plan(bridge, project_id, dataset_id, steps=None):
    return _cmd(bridge, "plan.create", {
        "project_id": project_id, "dataset_id": dataset_id,
        "steps": steps if steps is not None else _steps(),
    })


def test_roundtrip_create_approve_execute(bridge, project_id):
    ds = _import(bridge, project_id)

    res = _create_plan(bridge, project_id, ds["dataset_id"])
    assert res["ok"], res
    plan = res["data"]
    assert plan["status"] == "draft"
    assert [s["kind"] for s in plan["steps"]] == ["profile", "histogram", "quality"]
    assert [s["status"] for s in plan["steps"]] == ["pending"] * 3
    assert plan["snapshot_id"] == ds["snapshot_id"]
    assert plan["fingerprint"] == ds["fingerprint"]
    # plan payloads are small specs only — no data rows over IPC
    assert len(json.dumps(plan)) < 50 * 1024

    res = _cmd(bridge, "plan.approve", {
        "project_id": project_id, "plan_id": plan["plan_id"]})
    assert res["ok"], res
    assert res["data"]["status"] == "approved"

    res = _cmd(bridge, "plan.execute", {
        "project_id": project_id, "plan_id": plan["plan_id"]})
    assert res["ok"], res
    executed = res["data"]
    assert executed["status"] == "executed"
    # per-step statuses persisted
    assert [s["status"] for s in executed["steps"]] == ["completed"] * 3

    res = _query(bridge, "plan.get", {
        "project_id": project_id, "plan_id": plan["plan_id"]})
    assert res["ok"], res
    assert res["data"]["status"] == "executed"

    res = _query(bridge, "plan.list", {
        "project_id": project_id, "dataset_id": ds["dataset_id"]})
    assert res["ok"], res
    assert [p["plan_id"] for p in res["data"]["plans"]] == [plan["plan_id"]]


def test_execute_without_approve_rejected(bridge, project_id):
    ds = _import(bridge, project_id)
    plan = _create_plan(bridge, project_id, ds["dataset_id"])["data"]

    res = _cmd(bridge, "plan.execute", {
        "project_id": project_id, "plan_id": plan["plan_id"]})
    assert res["ok"] is False
    assert res["error"]["code"] == "CONFLICT"

    # still draft, nothing ran
    got = _query(bridge, "plan.get", {
        "project_id": project_id, "plan_id": plan["plan_id"]})["data"]
    assert got["status"] == "draft"
    assert [s["status"] for s in got["steps"]] == ["pending"] * 3


def test_unregistered_step_rejected_at_create(bridge, project_id):
    ds = _import(bridge, project_id)
    # "cleaning" is a real command but NOT step-eligible (mutating) —
    # the PlanStepType enum rejects it at payload validation.
    res = _create_plan(bridge, project_id, ds["dataset_id"], steps=[
        {"kind": "cleaning", "params": {}},
    ])
    assert res["ok"] is False
    assert res["error"]["code"] == "VALIDATION_ERROR"

    res = _create_plan(bridge, project_id, ds["dataset_id"], steps=[
        {"kind": "histogram", "params": {}},
    ])
    assert res["ok"] is False
    assert res["error"]["code"] == "VALIDATION_ERROR"


def test_failed_step_stops_plan_and_stays_approved(bridge, project_id):
    ds = _import(bridge, project_id)
    plan = _create_plan(bridge, project_id, ds["dataset_id"], steps=[
        {"kind": "profile", "params": {}},
        {"kind": "histogram", "params": {"column_name": "nope"}},
        {"kind": "quality", "params": {}},
    ])["data"]
    _cmd(bridge, "plan.approve", {
        "project_id": project_id, "plan_id": plan["plan_id"]})

    res = _cmd(bridge, "plan.execute", {
        "project_id": project_id, "plan_id": plan["plan_id"]})
    assert res["ok"], res
    out = res["data"]
    assert out["status"] == "approved"  # not executed: one step failed
    assert [s["status"] for s in out["steps"]] == ["completed", "failed", "pending"]
    assert out["steps"][1]["error"] is not None

    # re-execute: completed steps are skipped (resume), failing step fails again
    res = _cmd(bridge, "plan.execute", {
        "project_id": project_id, "plan_id": plan["plan_id"]})
    assert res["ok"], res
    assert res["data"]["status"] == "approved"
    assert [s["status"] for s in res["data"]["steps"]] == ["completed", "failed", "pending"]


def test_approve_twice_and_execute_twice_conflict(bridge, project_id):
    ds = _import(bridge, project_id)
    plan = _create_plan(bridge, project_id, ds["dataset_id"])["data"]
    approve = {"project_id": project_id, "plan_id": plan["plan_id"]}
    assert _cmd(bridge, "plan.approve", approve)["ok"]
    res = _cmd(bridge, "plan.approve", approve)
    assert res["ok"] is False
    assert res["error"]["code"] == "CONFLICT"

    assert _cmd(bridge, "plan.execute", approve)["ok"]
    res = _cmd(bridge, "plan.execute", approve)
    assert res["ok"] is False
    assert res["error"]["code"] == "CONFLICT"


def test_oversized_plan_spec_rejected(bridge, project_id):
    ds = _import(bridge, project_id)
    res = _create_plan(bridge, project_id, ds["dataset_id"], steps=[
        {"kind": "histogram", "params": {"column_name": "x" * 60_000}},
    ])
    assert res["ok"] is False
    assert res["error"]["code"] == "VALIDATION_ERROR"


def test_unknown_command_still_denied(bridge, project_id):
    res = _cmd(bridge, "plan.delete", {
        "project_id": project_id, "plan_id": "x"})
    assert res["ok"] is False
    assert res["error"]["code"] == "PERMISSION_DENIED"


def test_plan_of_other_project_not_found(bridge, project_id):
    ds = _import(bridge, project_id)
    plan = _create_plan(bridge, project_id, ds["dataset_id"])["data"]
    other = _cmd(bridge, "project.create", {"name": "Other"})["data"]["project_id"]
    res = _query(bridge, "plan.get", {
        "project_id": other, "plan_id": plan["plan_id"]})
    assert res["ok"] is False
    assert res["error"]["code"] == "NOT_FOUND"
