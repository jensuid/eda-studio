"""G5 reporting slice: dataset.report.generate (SCREEN-REPORT-001, JOB-REPORT-001)."""
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


def _report(bridge, project_id, ds, scope="all"):
    return bridge.execute_command({
        "request_id": "r1", "command": "dataset.report.generate",
        "payload": {"project_id": project_id, "dataset_id": ds, "scope": scope},
    })


def test_report_generates_html(bridge, project_id):
    ds = _import(bridge, project_id)
    res = _report(bridge, project_id, ds)
    assert res["ok"], res
    d = res["data"]
    assert d["sections"]
    assert d["file_path"] and d["file_size_bytes"] > 0
    assert d["renderer_version"]
    assert d["content_fingerprint"]
    assert "validation_summary" in d
    # file exists on disk and is self-contained HTML without scripts
    p = Path(d["file_path"])
    assert p.exists()
    html = p.read_text()
    assert "<style>" in html
    assert "<script" not in html.lower()
    assert "Fingerprint" in html or "fingerprint" in html


def test_report_stale_flag(bridge, project_id):
    ds = _import(bridge, project_id)
    res = _report(bridge, project_id, ds, "profile-quality")
    assert res["ok"], res
    d = res["data"]
    assert d["scope"] == "profile-quality"
    assert isinstance(d["is_final"], bool)


def test_report_payload_shape(bridge, project_id):
    import json
    ds = _import(bridge, project_id)
    res = _report(bridge, project_id, ds)
    assert res["ok"], res
    assert len(json.dumps(res["data"])) < 10000
    assert "file_path" in res["data"]
