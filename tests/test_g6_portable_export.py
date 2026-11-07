"""G6-2 portable export: ZIP + manifest, restore-compatible."""

from __future__ import annotations

import json
import zipfile
from pathlib import Path

from backend.backup_restore import restore_backup
from tests.conftest import FIXTURE_CSV


def _import(bridge, project_id):
    res = bridge.execute_command({"request_id": "r-pxi", "command": "dataset.import",
                                  "payload": {"project_id": project_id,
                                              "source_path": str(FIXTURE_CSV),
                                              "dataset_name": "sample"}})
    assert res["ok"], res
    return res["data"]["dataset_id"]


def test_export_portable_via_ipc_manifest_kind(tmp_path, bridge, project_id):
    dataset_id = _import(bridge, project_id)
    dest = tmp_path / "export.zip"
    res = bridge.execute_command({
        "request_id": "r-px", "command": "project.export_portable",
        "payload": {"project_id": project_id, "dest_path": str(dest)},
    })
    assert res["ok"], res
    d = res["data"]
    assert d["project_id"] == project_id
    assert d["kind"] == "portable_export"
    assert d["version"] == "1"
    assert d["counts"].get("projects") == 1 and d["counts"].get("datasets") == 1
    assert Path(d["file_path"]).exists() and d["file_size_bytes"] > 0

    with zipfile.ZipFile(dest) as zf:
        assert "project.db" in zf.namelist()
        assert "manifest.json" in zf.namelist()
        m = json.loads(zf.read("manifest.json"))
        assert m["kind"] == "portable_export"
        assert m["project_db_sha256"] == d["project_db_sha256"]

    # Portable export is restore-compatible with the ordinary restore path.
    dest_root = tmp_path / "restored-export"
    manifest = restore_backup(dest, dest_root)
    assert manifest["project_db_sha256"] == d["project_db_sha256"]
    assert (dest_root / "project.db").exists()

    from backend.ipc import make_bridge

    b2 = make_bridge(str(dest_root))
    res = b2.execute_query({"request_id": "r-po", "command": "project.open",
                            "payload": {"project_id": project_id}})
    assert res["ok"], res
    res = b2.execute_query({"request_id": "r-pp", "command": "dataset.preview",
                            "payload": {"project_id": project_id, "dataset_id": dataset_id}})
    assert res["ok"], res


def test_export_portable_unknown_project_not_found(tmp_path, bridge):
    res = bridge.execute_command({
        "request_id": "r-pxnf", "command": "project.export_portable",
        "payload": {"project_id": "missing", "dest_path": str(tmp_path / "x.zip")},
    })
    assert res["ok"] is False
    assert res["error"]["code"] == "NOT_FOUND"


def test_export_portable_rejects_directory_dest(tmp_path, bridge, project_id):
    _import(bridge, project_id)
    res = bridge.execute_command({
        "request_id": "r-pxd", "command": "project.export_portable",
        "payload": {"project_id": project_id, "dest_path": str(tmp_path)},
    })
    assert res["ok"] is False
    assert res["error"]["code"] == "VALIDATION_ERROR"
