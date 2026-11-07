"""P2-3: dialog.pick_file + validate_path_input gate.

- Native dialog is an injectable callable — tests inject a fake and assert
  it receives the extension filter; the default returns unavailable without
  a webview window (headless).
- Every user-supplied path (import/backup/restore/export/diagnostic) is
  validated before job dispatch: empty/NUL/wrong-extension -> VALIDATION_ERROR,
  missing required file -> NOT_FOUND, wrong import suffix keeps
  UNSUPPORTED_FORMAT.
"""
from pathlib import Path

from backend.application import NotFoundError, ValidationError, validate_path_input
from backend.contracts import DialogPickFilePayload

FIXTURE = Path(__file__).parent / "fixtures" / "sample.csv"


def _import(bridge, project_id) -> str:
    res = bridge.execute_command({
        "request_id": "i1", "command": "dataset.import",
        "payload": {"project_id": project_id, "source_path": str(FIXTURE),
                    "dataset_name": "sample"},
    })
    assert res["ok"], res
    return res["data"]["dataset_id"]


def _cmd(bridge, command, payload):
    return bridge.execute_command({"request_id": "r1", "command": command, "payload": payload})


# -- validate_path_input unit tests -----------------------------------------

def test_validate_path_input_rejects_empty_and_nul():
    for bad in ("", "   ", "a\x00b"):
        try:
            validate_path_input(bad)
        except ValidationError:
            pass
        else:
            raise AssertionError(f"expected ValidationError for {bad!r}")


def test_validate_path_input_extension_allowlist(tmp_path):
    ok = tmp_path / "data.CSV"
    ok.write_text("x")
    assert validate_path_input(str(ok), (".csv",), must_exist=True) == ok
    try:
        validate_path_input(str(tmp_path / "x.txt"), (".csv", ".xlsx"))
    except ValidationError as exc:
        assert ".csv" in str(exc)
    else:
        raise AssertionError("expected ValidationError for wrong extension")


def test_validate_path_input_missing_file_is_not_found(tmp_path):
    try:
        validate_path_input(str(tmp_path / "nope.csv"), must_exist=True)
    except NotFoundError:
        pass
    else:
        raise AssertionError("expected NotFoundError")


# -- dialog.pick_file --------------------------------------------------------

def test_dialog_pick_file_registered_and_injected(bridge):
    seen = {}

    def fake_dialog(payload):
        seen["mode"] = payload.mode
        seen["file_types"] = list(payload.file_types)
        from backend.contracts import DialogPickFileRecord
        return DialogPickFileRecord(path="/tmp/picked.csv", available=True)

    bridge.file_dialog = fake_dialog
    res = _cmd(bridge, "dialog.pick_file",
               {"mode": "open", "file_types": ["csv", "xlsx", "parquet"]})
    assert res["ok"], res
    assert res["data"] == {"path": "/tmp/picked.csv", "available": True}
    assert seen == {"mode": "open", "file_types": ["csv", "xlsx", "parquet"]}


def test_dialog_pick_file_cancelled_returns_none(bridge):
    from backend.contracts import DialogPickFileRecord
    bridge.file_dialog = lambda payload: DialogPickFileRecord(path=None, available=True)
    res = _cmd(bridge, "dialog.pick_file", {"mode": "save", "file_types": ["zip"]})
    assert res["ok"], res
    assert res["data"]["path"] is None


def test_dialog_pick_file_default_unavailable_without_window(bridge):
    from backend.ipc import default_file_dialog
    rec = default_file_dialog(DialogPickFilePayload(mode="open", file_types=["csv"]))
    assert rec.available is False
    assert rec.path is None


# -- path validation through the bridge -------------------------------------

def test_import_missing_file_is_not_found(bridge, project_id, tmp_path):
    res = _cmd(bridge, "dataset.import",
               {"project_id": project_id, "source_path": str(tmp_path / "nope.csv"),
                "dataset_name": "x"})
    assert res["ok"] is False
    assert res["error"]["code"] == "NOT_FOUND"


def test_import_empty_path_is_validation_error(bridge, project_id):
    res = _cmd(bridge, "dataset.import",
               {"project_id": project_id, "source_path": "", "dataset_name": "x"})
    assert res["ok"] is False
    assert res["error"]["code"] == "VALIDATION_ERROR"


def test_import_wrong_suffix_keeps_unsupported_format(bridge, project_id, tmp_path):
    bad = tmp_path / "x.json"
    bad.write_text("{}")
    res = _cmd(bridge, "dataset.import",
               {"project_id": project_id, "source_path": str(bad), "dataset_name": "x"})
    assert res["ok"] is False
    assert res["error"]["code"] == "UNSUPPORTED_FORMAT"


def test_backup_wrong_extension_is_validation_error(bridge, project_id, tmp_path):
    res = _cmd(bridge, "project.backup.create",
               {"project_id": project_id, "dest_path": str(tmp_path / "b.txt")})
    assert res["ok"] is False
    assert res["error"]["code"] == "VALIDATION_ERROR"


def test_backup_edaworkspace_extension_accepted(bridge, project_id, tmp_path):
    res = _cmd(bridge, "project.backup.create",
               {"project_id": project_id,
                "dest_path": str(tmp_path / "backup.edaworkspace")})
    assert res["ok"], res


def test_diagnostic_wrong_extension_is_validation_error(bridge, project_id, tmp_path):
    res = _cmd(bridge, "project.diagnostic.create",
               {"project_id": project_id, "dest_path": str(tmp_path / "d.txt")})
    assert res["ok"] is False
    assert res["error"]["code"] == "VALIDATION_ERROR"


def test_restore_missing_archive_is_not_found(bridge, tmp_path):
    res = _cmd(bridge, "project.restore",
               {"archive_path": str(tmp_path / "nope.zip"),
                "dest_root": str(tmp_path / "out")})
    assert res["ok"] is False
    assert res["error"]["code"] == "NOT_FOUND"


def test_restore_wrong_extension_is_validation_error(bridge, tmp_path):
    archive = tmp_path / "a.txt"
    archive.write_text("x")
    res = _cmd(bridge, "project.restore",
               {"archive_path": str(archive), "dest_root": str(tmp_path / "out")})
    assert res["ok"] is False
    assert res["error"]["code"] == "VALIDATION_ERROR"


def test_export_dest_extension_must_match_format(bridge, project_id, tmp_path):
    ds = _import(bridge, project_id)
    res = _cmd(bridge, "dataset.export",
               {"project_id": project_id, "dataset_id": ds, "format": "csv",
                "dest_path": str(tmp_path / "out.xlsx")})
    assert res["ok"] is False
    assert res["error"]["code"] == "VALIDATION_ERROR"
    assert not (tmp_path / "out.xlsx").exists()
