"""G5 PDF slice: dataset.pdf.generate (SCREEN-PDF-001, JOB-PDF-001)."""
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


def _pdf(bridge, project_id, ds, scope="all"):
    return bridge.execute_command({
        "request_id": "r1", "command": "dataset.pdf.generate",
        "payload": {"project_id": project_id, "dataset_id": ds, "scope": scope},
    })


def test_pdf_generates_pdf_artifact(bridge, project_id):
    ds = _import(bridge, project_id)
    res = _pdf(bridge, project_id, ds)
    assert res["ok"], res
    d = res["data"]
    assert d["sections"]
    assert d["page_count"] >= 1
    assert d["file_path"] and d["file_size_bytes"] > 0
    assert d["renderer_version"]
    assert d["pdf_fingerprint"]
    assert d["source_html_fingerprint"]
    assert d["report_id"] == d["source_html_fingerprint"]
    assert isinstance(d["is_final"], bool)
    assert "validation_summary" in d
    p = Path(d["file_path"])
    assert p.exists()
    assert p.stat().st_size == d["file_size_bytes"]
    assert p.read_bytes()[:5] == b"%PDF-"
    # payload stays small (PDF bytes live on disk, never over IPC)
    assert len(json.dumps(res["data"])) < 10000


def test_pdf_stale_flag(bridge, project_id):
    ds = _import(bridge, project_id)
    res = _pdf(bridge, project_id, ds, "profile-quality")
    assert res["ok"], res
    d = res["data"]
    assert isinstance(d["is_final"], bool)


def test_pdf_unknown_dataset_not_found(bridge, project_id):
    res = _pdf(bridge, project_id, "missing-dataset-id")
    assert res["ok"] is False
    assert res["error"]["code"] == "NOT_FOUND"
