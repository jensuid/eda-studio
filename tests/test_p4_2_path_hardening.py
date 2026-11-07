"""P4-2: K7 path hardening — traversal & absolute-outside-root rejected."""
from pathlib import Path

from backend.ipc import make_bridge

FIXTURE = Path(__file__).parent / "fixtures" / "sample.csv"


def _project(bridge):
    res = bridge.execute_command({"request_id": "r-1", "command": "project.create",
                                  "payload": {"name": "Demo"}})
    assert res["ok"], res
    return res["data"]["project_id"]


def _cmd(bridge, cmd, payload):
    return bridge.execute_command({"request_id": "r1", "command": cmd, "payload": payload})


def _raw_bridge(tmp_path):
    """Bridge WITHOUT test-harness trusted roots (strict P4-2 posture)."""
    return make_bridge(str(tmp_path / "proj"))


def test_traversal_rejected_in_import(tmp_path):
    bridge = _raw_bridge(tmp_path)
    project_id = _project(bridge)
    res = _cmd(bridge, "dataset.import",
               {"project_id": project_id,
                "source_path": str(tmp_path / "proj" / "sub" / ".." / ".." / "evil.csv"),
                "dataset_name": "x"})
    assert res["ok"] is False
    assert res["error"]["code"] == "VALIDATION_ERROR"


def test_absolute_outside_root_rejected_without_dialog(tmp_path):
    outside = tmp_path / "outside.csv"
    outside.write_bytes(FIXTURE.read_bytes())
    bridge = _raw_bridge(tmp_path)
    project_id = _project(bridge)
    res = _cmd(bridge, "dataset.import",
               {"project_id": project_id, "source_path": str(outside),
                "dataset_name": "x"})
    assert res["ok"] is False
    assert res["error"]["code"] == "VALIDATION_ERROR"


def test_dialog_picked_absolute_path_allowed(tmp_path):
    outside = tmp_path / "picked.csv"
    outside.write_bytes(FIXTURE.read_bytes())
    bridge = _raw_bridge(tmp_path)
    from backend.contracts import DialogPickFileRecord
    bridge.file_dialog = lambda payload: DialogPickFileRecord(
        path=str(outside), available=True)
    pick = _cmd(bridge, "dialog.pick_file",
                {"mode": "open", "file_types": ["csv"]})
    assert pick["ok"], pick
    project_id = _project(bridge)
    res = _cmd(bridge, "dataset.import",
               {"project_id": project_id, "source_path": str(outside),
                "dataset_name": "x"})
    assert res["ok"], res


def test_backup_dest_traversal_rejected(tmp_path):
    bridge = _raw_bridge(tmp_path)
    project_id = _project(bridge)
    res = _cmd(bridge, "project.backup.create",
               {"project_id": project_id,
                "dest_path": str(tmp_path / "proj" / ".." / "evil.zip")})
    assert res["ok"] is False
    assert res["error"]["code"] == "VALIDATION_ERROR"


def test_backup_dest_outside_root_rejected(tmp_path):
    bridge = _raw_bridge(tmp_path)
    project_id = _project(bridge)
    res = _cmd(bridge, "project.backup.create",
               {"project_id": project_id,
                "dest_path": str(tmp_path / "outside.zip")})
    assert res["ok"] is False
    assert res["error"]["code"] == "VALIDATION_ERROR"
    assert not (tmp_path / "outside.zip").exists()


def test_inside_root_still_works(tmp_path):
    bridge = _raw_bridge(tmp_path)
    project_id = _project(bridge)
    inside = tmp_path / "proj" / "data.csv"
    inside.parent.mkdir(parents=True, exist_ok=True)
    inside.write_bytes(FIXTURE.read_bytes())
    res = _cmd(bridge, "dataset.import",
               {"project_id": project_id, "source_path": str(inside),
                "dataset_name": "x"})
    assert res["ok"], res
    dest = tmp_path / "proj" / "backup.zip"
    res = _cmd(bridge, "project.backup.create",
               {"project_id": project_id, "dest_path": str(dest)})
    assert res["ok"], res
