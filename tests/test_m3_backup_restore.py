"""M3 backup/restore (Doc04 §12): full backup + restore to new location."""
import json
import zipfile
from pathlib import Path

import pytest

from backend.backup_restore import BackupError, create_backup, restore_backup
from backend.ipc import make_bridge
from tests.conftest import FIXTURE_CSV

ROOT = Path(__file__).resolve().parents[1]


def _import(bridge, project_id):
    res = bridge.execute_command({"request_id": "r-i", "command": "dataset.import",
                                  "payload": {"project_id": project_id,
                                              "source_path": str(FIXTURE_CSV),
                                              "dataset_name": "sample"}})
    assert res["ok"], res
    return res["data"]["dataset_id"]


def test_backup_restore_roundtrip(tmp_path, bridge, project_id):
    dataset_id = _import(bridge, project_id)
    root = tmp_path / "proj"
    dest_zip = tmp_path / "backup.edaworkspace"

    manifest = create_backup(root, dest_zip)
    assert manifest["version"] == "1"
    assert manifest["counts"].get("projects") == 1
    assert manifest["counts"].get("datasets") == 1
    assert dest_zip.exists()
    with zipfile.ZipFile(dest_zip) as zf:
        assert "manifest.json" in zf.namelist()
        assert "project.db" in zf.namelist()
        m = json.loads(zf.read("manifest.json"))
        assert m["project_db_sha256"] == manifest["project_db_sha256"]

    restored = tmp_path / "restored"
    manifest2 = restore_backup(dest_zip, restored)
    assert manifest2["project_db_sha256"] == manifest["project_db_sha256"]
    assert (restored / "project.db").exists()
    assert (restored / "snapshots").is_dir()
    assert list((restored / "snapshots").iterdir()), "snapshots restored"

    # Restored project opens and previews (integrity + refs reconciled).
    bridge2 = make_bridge(str(restored))
    res = bridge2.execute_query({"request_id": "r-o", "command": "project.open",
                                 "payload": {"project_id": project_id}})
    assert res["ok"], res
    res = bridge2.execute_query({"request_id": "r-p", "command": "dataset.preview",
                                 "payload": {"project_id": project_id,
                                             "dataset_id": dataset_id}})
    assert res["ok"], res


def test_restore_refuses_nonempty_dest(tmp_path, bridge, project_id):
    _import(bridge, project_id)
    dest_zip = tmp_path / "b.zip"
    create_backup(tmp_path / "proj", dest_zip)
    busy = tmp_path / "busy"
    busy.mkdir()
    (busy / "x.txt").write_text("x")
    with pytest.raises(BackupError):
        restore_backup(dest_zip, busy)


def test_restore_rejects_corrupt_checksum(tmp_path, bridge, project_id):
    _import(bridge, project_id)
    dest_zip = tmp_path / "b.zip"
    create_backup(tmp_path / "proj", dest_zip)
    # Tamper: rewrite archive with corrupted project.db bytes.
    with zipfile.ZipFile(dest_zip) as zf:
        files = {n: zf.read(n) for n in zf.namelist()}
    files["project.db"] = b"corrupt"
    with zipfile.ZipFile(tmp_path / "bad.zip", "w") as zf:
        for n, data in files.items():
            zf.writestr(n, data)
    with pytest.raises(BackupError):
        restore_backup(tmp_path / "bad.zip", tmp_path / "out")
