"""P0-2 regression tests: K2 error leak, K1 idempotency dedup."""
from backend.ipc import make_bridge


def _cmd(bridge, command, payload, request_id="r1", idempotency_key=None):
    return bridge.execute_command({
        "request_id": request_id,
        "idempotency_key": idempotency_key,
        "command": command,
        "payload": payload,
    })


def test_internal_error_does_not_leak(tmp_path):
    bridge = make_bridge(str(tmp_path))

    def boom(*a, **k):
        raise RuntimeError("sqlite disk path /secret/internal.db exploded")

    bridge.service.create_project = boom  # type: ignore[method-assign]
    resp = _cmd(bridge, "project.create", {"name": "X"})
    assert resp["ok"] is False
    assert resp["error"]["code"] == "INTERNAL_ERROR"
    assert "/secret" not in resp["error"]["message"]
    assert "exploded" not in resp["error"]["message"]


def test_idempotent_project_create_deduped(tmp_path):
    bridge = make_bridge(str(tmp_path))
    r1 = _cmd(bridge, "project.create", {"name": "P"},
              request_id="r1", idempotency_key="key-1")
    r2 = _cmd(bridge, "project.create", {"name": "P"},
              request_id="r2", idempotency_key="key-1")
    assert r1["ok"] is True and r2["ok"] is True
    assert r1["data"] == r2["data"], "replay must return stored result, not re-dispatch"
    # Only one project row despite two calls.
    projects = bridge.service.store.db.execute("SELECT COUNT(*) c FROM projects").fetchone()
    assert projects["c"] == 1


def test_distinct_idempotency_keys_create_distinct_projects(tmp_path):
    bridge = make_bridge(str(tmp_path))
    _cmd(bridge, "project.create", {"name": "A"}, request_id="r1", idempotency_key="k-a")
    _cmd(bridge, "project.create", {"name": "B"}, request_id="r2", idempotency_key="k-b")
    projects = bridge.service.store.db.execute("SELECT COUNT(*) c FROM projects").fetchone()
    assert projects["c"] == 2


def test_malformed_envelope_rejected_generically(tmp_path):
    bridge = make_bridge(str(tmp_path))
    resp = bridge.execute_command({"command": "project.create"})  # no request_id
    assert resp["ok"] is False
    assert resp["error"]["code"] == "VALIDATION_ERROR"
