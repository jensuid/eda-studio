"""artifact.open (FLOW-SHELL-001 §2.7, PO ratified 2026-11-09).

The frontend never sends a filesystem path: identity is (snapshot_id,
fingerprint). Security contract (fail-closed, SEC-004): traversal in
snapshot_id, unknown kind, missing artifacts, and fingerprint mismatch are
all rejected; the host opener is injectable so tests never launch a browser.
"""
import json
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


def _pdf(bridge, project_id, ds):
    res = bridge.execute_command({
        "request_id": "p1", "command": "dataset.pdf.generate",
        "payload": {"project_id": project_id, "dataset_id": ds, "scope": "all"},
    })
    assert res["ok"], res
    return res["data"]


def _report(bridge, project_id, ds):
    res = bridge.execute_command({
        "request_id": "r1", "command": "dataset.report.generate",
        "payload": {"project_id": project_id, "dataset_id": ds, "scope": "all"},
    })
    assert res["ok"], res
    return res["data"]


def _open(bridge, project_id, ds, kind, snapshot_id, fingerprint):
    return bridge.execute_command({
        "request_id": "o1", "command": "artifact.open",
        "payload": {"project_id": project_id, "dataset_id": ds, "kind": kind,
                    "snapshot_id": snapshot_id, "fingerprint": fingerprint},
    })


def test_open_pdf_success(bridge, project_id):
    ds = _import(bridge, project_id)
    pdf = _pdf(bridge, project_id, ds)
    opened: list[Path] = []
    bridge.service.artifact_opener = lambda p: opened.append(p) or True
    res = _open(bridge, project_id, ds, "pdf",
                pdf["snapshot_id"], pdf["pdf_fingerprint"])
    assert res["ok"], res
    assert res["data"] == {"opened": True, "kind": "pdf"}
    # opener got the real artifact on disk, payload carries no bytes/path
    assert opened and opened[0].name.endswith(".pdf")
    assert len(json.dumps(res["data"])) < 10000


def test_open_html_success(bridge, project_id):
    ds = _import(bridge, project_id)
    report = _report(bridge, project_id, ds)
    opened: list[Path] = []
    bridge.service.artifact_opener = lambda p: opened.append(p) or True
    res = _open(bridge, project_id, ds, "html",
                report["snapshot_id"], report["content_fingerprint"])
    assert res["ok"], res
    assert res["data"] == {"opened": True, "kind": "html"}
    assert opened and opened[0].name.endswith(".html")


def test_open_rejects_traversal_snapshot(bridge, project_id):
    ds = _import(bridge, project_id)
    pdf = _pdf(bridge, project_id, ds)
    res = _open(bridge, project_id, ds, "pdf",
                "../../etc/passwd", pdf["pdf_fingerprint"])
    assert res["ok"] is False
    assert res["error"]["code"] in ("VALIDATION_ERROR", "NOT_FOUND")


def test_open_rejects_absolute_path_snapshot(bridge, project_id, tmp_path):
    ds = _import(bridge, project_id)
    pdf = _pdf(bridge, project_id, ds)
    res = _open(bridge, project_id, ds, "pdf",
                str(tmp_path / "x.pdf"), pdf["pdf_fingerprint"])
    assert res["ok"] is False
    assert res["error"]["code"] in ("VALIDATION_ERROR", "NOT_FOUND")


def test_open_rejects_unknown_kind(bridge, project_id):
    ds = _import(bridge, project_id)
    res = _open(bridge, project_id, ds, "exe", "snap1234", "f" * 64)
    assert res["ok"] is False
    assert res["error"]["code"] == "VALIDATION_ERROR"


def test_open_rejects_missing_artifact(bridge, project_id):
    ds = _import(bridge, project_id)
    res = _open(bridge, project_id, ds, "pdf", "deadbeef00", "f" * 64)
    assert res["ok"] is False
    assert res["error"]["code"] == "NOT_FOUND"


def test_open_rejects_fingerprint_mismatch(bridge, project_id):
    ds = _import(bridge, project_id)
    pdf = _pdf(bridge, project_id, ds)
    res = _open(bridge, project_id, ds, "pdf",
                pdf["snapshot_id"], "0" * 64)
    assert res["ok"] is False
    assert res["error"]["code"] == "VALIDATION_ERROR"


def test_open_rejects_wrong_kind_for_artifact(bridge, project_id):
    ds = _import(bridge, project_id)
    pdf = _pdf(bridge, project_id, ds)
    res = _open(bridge, project_id, ds, "html",
                pdf["snapshot_id"], pdf["pdf_fingerprint"])
    assert res["ok"] is False
    assert res["error"]["code"] in ("NOT_FOUND", "VALIDATION_ERROR")


def test_open_rejects_unknown_dataset(bridge, project_id):
    res = _open(bridge, project_id, "missing-dataset", "pdf",
                "snap1234", "f" * 64)
    assert res["ok"] is False
    assert res["error"]["code"] == "NOT_FOUND"


def test_open_rejects_unknown_project(bridge, project_id):
    ds = _import(bridge, project_id)
    res = _open(bridge, "missing-project", ds, "pdf", "snap1234", "f" * 64)
    assert res["ok"] is False
    assert res["error"]["code"] == "NOT_FOUND"


def test_open_opener_failure_is_error(bridge, project_id):
    ds = _import(bridge, project_id)
    pdf = _pdf(bridge, project_id, ds)
    bridge.service.artifact_opener = lambda p: False
    res = _open(bridge, project_id, ds, "pdf",
                pdf["snapshot_id"], pdf["pdf_fingerprint"])
    assert res["ok"] is False
    assert res["error"]["code"] == "VALIDATION_ERROR"
