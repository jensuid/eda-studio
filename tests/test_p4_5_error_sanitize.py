"""P4-5: K2 sisa — pesan error domain disanitasi di batas IPC.

Semua jalur VALIDATION/NOT_FOUND/CONFLICT/UNSUPPORTED_FORMAT + PERMISSION
tidak boleh menggemakan detail internal (path absolut, nilai input Pydantic,
nama command) ke respons klien; original exception hanya di log server-side.
"""
from backend.application import ConflictError
from backend.application import ValidationError as ServiceValidationError
from backend.ipc import make_bridge


def _cmd(bridge, command, payload, request_id="r1"):
    return bridge.execute_command({
        "request_id": request_id,
        "command": command,
        "payload": payload,
    })


def test_not_found_does_not_leak_path(bridge, project_id, tmp_path):
    missing = tmp_path / "secret" / "missing-file.csv"
    resp = _cmd(bridge, "dataset.import", {
        "project_id": project_id,
        "source_path": str(missing),
        "dataset_name": "X",
    })
    assert resp["ok"] is False
    assert resp["error"]["code"] == "NOT_FOUND"
    assert resp["error"]["message"] == "not found"
    assert str(missing) not in resp["error"]["message"]
    assert "secret" not in resp["error"]["message"]


def test_invalid_payload_is_generic(bridge):
    resp = _cmd(bridge, "project.create", {})  # field wajib "name" hilang
    assert resp["ok"] is False
    assert resp["error"]["code"] == "VALIDATION_ERROR"
    assert resp["error"]["message"] == "invalid payload"
    assert "name" not in resp["error"]["message"]


def test_service_validation_does_not_leak_path(tmp_path):
    bridge = make_bridge(str(tmp_path))

    def boom(*a, **k):
        raise ServiceValidationError("dest adalah direktori, bukan file: /secret/internal.db")

    bridge.service.create_project = boom  # type: ignore[method-assign]
    resp = _cmd(bridge, "project.create", {"name": "X"})
    assert resp["ok"] is False
    assert resp["error"]["code"] == "VALIDATION_ERROR"
    assert resp["error"]["message"] == "invalid payload"
    assert "/secret" not in resp["error"]["message"]


def test_conflict_does_not_leak_detail(tmp_path):
    bridge = make_bridge(str(tmp_path))

    def boom(*a, **k):
        raise ConflictError("snapshot fingerprint mismatch: /secret/snap-1")

    bridge.service.create_project = boom  # type: ignore[method-assign]
    resp = _cmd(bridge, "project.create", {"name": "X"})
    assert resp["ok"] is False
    assert resp["error"]["code"] == "CONFLICT"
    assert resp["error"]["message"] == "conflict"
    assert "/secret" not in resp["error"]["message"]


def test_permission_denied_does_not_echo_command(bridge):
    resp = _cmd(bridge, "evil.command", {})
    assert resp["ok"] is False
    assert resp["error"]["code"] == "PERMISSION_DENIED"
    assert "evil.command" not in resp["error"]["message"]
