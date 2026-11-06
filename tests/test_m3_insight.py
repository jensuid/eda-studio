"""M3 P1 insight lifecycle: Finding & Hypothesis state machines (Doc03 §4.8).

Finding lifecycle:      proposed -> accepted -> archived (also proposed -> archived)
Hypothesis lifecycle:   proposed -> accepted -> investigating
                        -> supported / not_supported / inconclusive -> archived

Findings MUST reference supporting evidence (snapshot_id + fingerprint).
"""
from __future__ import annotations

from pathlib import Path

FIXTURE = Path(__file__).parent / "fixtures" / "sample.csv"


def _import(bridge, project_id, path=FIXTURE, name="sample") -> dict:
    res = bridge.execute_command({
        "request_id": "i1", "command": "dataset.import",
        "payload": {"project_id": project_id, "source_path": str(path),
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


def test_finding_lifecycle(bridge, project_id):
    ds = _import(bridge, project_id)
    snap_id = ds["snapshot_id"]
    snap_fp = ds["fingerprint"]

    res = _cmd(bridge, "insight.finding.create", {
        "project_id": project_id, "dataset_id": ds["dataset_id"],
        "title": "Skewed income", "body": "income column is right-skewed.",
        "evidence_snapshot_id": snap_id, "evidence_fingerprint": snap_fp})
    assert res["ok"], res
    fid = res["data"]["finding_id"]
    assert res["data"]["status"] == "proposed"

    res = _cmd(bridge, "insight.finding.transition", {
        "project_id": project_id, "finding_id": fid, "to_status": "accepted"}, "c2")
    assert res["ok"], res
    assert res["data"]["status"] == "accepted"

    # Invalid: accepted -> proposed
    res = _cmd(bridge, "insight.finding.transition", {
        "project_id": project_id, "finding_id": fid, "to_status": "proposed"}, "c3")
    assert not res["ok"] and res["error"]["code"] == "CONFLICT", res

    res = _cmd(bridge, "insight.finding.transition", {
        "project_id": project_id, "finding_id": fid, "to_status": "archived"}, "c4")
    assert res["ok"], res

    # Archived is terminal
    res = _cmd(bridge, "insight.finding.transition", {
        "project_id": project_id, "finding_id": fid, "to_status": "accepted"}, "c5")
    assert not res["ok"] and res["error"]["code"] == "CONFLICT", res

    res = _query(bridge, "insight.findings.list", {
        "project_id": project_id, "dataset_id": ds["dataset_id"]})
    assert res["ok"], res
    assert len(res["data"]["findings"]) == 1


def test_hypothesis_lifecycle(bridge, project_id):
    ds = _import(bridge, project_id)
    res = _cmd(bridge, "insight.hypothesis.create", {
        "project_id": project_id, "dataset_id": ds["dataset_id"],
        "statement": "Age correlates with income."})
    assert res["ok"], res
    hid = res["data"]["hypothesis_id"]
    assert res["data"]["status"] == "proposed"

    # Cannot jump proposed -> supported
    res = _cmd(bridge, "insight.hypothesis.transition", {
        "project_id": project_id, "hypothesis_id": hid, "to_status": "supported"}, "c2")
    assert not res["ok"] and res["error"]["code"] == "CONFLICT", res

    for i, target in enumerate(["accepted", "investigating", "supported", "archived"]):
        res = _cmd(bridge, "insight.hypothesis.transition", {
            "project_id": project_id, "hypothesis_id": hid,
            "to_status": target}, f"c3{i}")
        assert res["ok"], res
        assert res["data"]["status"] == target

    res = _query(bridge, "insight.hypotheses.list", {
        "project_id": project_id, "dataset_id": ds["dataset_id"]})
    assert res["ok"] and len(res["data"]["hypotheses"]) == 1, res


def test_insight_rejections(bridge, project_id):
    ds = _import(bridge, project_id)

    # Unknown dataset -> NOT_FOUND
    res = _cmd(bridge, "insight.hypothesis.create", {
        "project_id": project_id, "dataset_id": "nope",
        "statement": "x"})
    assert not res["ok"] and res["error"]["code"] == "NOT_FOUND", res

    # Evidence snapshot must belong to dataset -> NOT_FOUND
    res = _cmd(bridge, "insight.finding.create", {
        "project_id": project_id, "dataset_id": ds["dataset_id"],
        "title": "t", "body": "b",
        "evidence_snapshot_id": "bogus", "evidence_fingerprint": "abc"})
    assert not res["ok"] and res["error"]["code"] == "NOT_FOUND", res

    # Unknown finding transition -> NOT_FOUND
    res = _cmd(bridge, "insight.finding.transition", {
        "project_id": project_id, "finding_id": "nope", "to_status": "accepted"}, "c9")
    assert not res["ok"] and res["error"]["code"] == "NOT_FOUND", res
