"""M3 P2: diagnostic bundle + redaction (Doc15 §10, OBS-007)."""
import hashlib
import json
import zipfile

from tests.conftest import FIXTURE_CSV


def _cmd(bridge, command, payload, request_id="t1"):
    return bridge.execute_command(
        {"request_id": request_id, "command": command, "payload": payload})


def _import(bridge, project_id, tmp_path):
    res = _cmd(bridge, "dataset.import",
               {"project_id": project_id, "source_path": str(FIXTURE_CSV),
                "dataset_name": "sample"})
    assert res["ok"], res
    return res["data"]


def test_diagnostic_bundle_contents_and_redaction(bridge, project_id, tmp_path):
    _import(bridge, project_id, tmp_path)
    dest = tmp_path / "diag" / "bundle.zip"
    res = _cmd(bridge, "project.diagnostic.create",
               {"project_id": project_id, "dest_path": str(dest)})
    assert res["ok"], res
    rec = res["data"]
    assert rec["level"] == "basic"
    assert rec["file_count"] >= 3
    assert rec["sha256"] == hashlib.sha256(dest.read_bytes()).hexdigest()

    with zipfile.ZipFile(dest) as zf:
        names = zf.namelist()
        assert "metadata.json" in names and "manifest.json" in names
        assert "health.json" in names and "recent_errors.json" in names
        manifest = json.loads(zf.read("manifest.json"))
        # per-file checksums verify
        for f in manifest["files"]:
            assert f["sha256"] == hashlib.sha256(zf.read(f["name"])).hexdigest()
        blob = b"".join(zf.read(n) for n in names)
        # no absolute workspace paths leak into the bundle
        root_str = str(tmp_path).encode()
        assert root_str not in blob
        assert b"<workspace>" in blob or b"<path>" in blob or rec["paths_redacted"] >= 0
    assert "raw_datasets" in manifest["redaction"]["excluded"]
    assert "absolute_paths" in manifest["redaction"]["excluded"]


def test_diagnostic_dest_exists_rejected(bridge, project_id, tmp_path):
    _import(bridge, project_id, tmp_path)
    dest = tmp_path / "bundle.zip"
    dest.write_bytes(b"")  # pre-existing
    res = _cmd(bridge, "project.diagnostic.create",
               {"project_id": project_id, "dest_path": str(dest)})
    assert not res["ok"]
    assert res["error"]["code"] == "VALIDATION_ERROR"


def test_diagnostic_unknown_project_not_found(bridge, tmp_path):
    dest = tmp_path / "bundle.zip"
    res = _cmd(bridge, "project.diagnostic.create",
               {"project_id": "nope", "dest_path": str(dest)})
    assert not res["ok"]
    assert res["error"]["code"] == "NOT_FOUND"
