"""G6-1 crash recovery: runtime marker, startup autosave, query + restore."""

from pathlib import Path

from backend.persistence import Store
from tests.conftest import FIXTURE_CSV


def _import(bridge, project_id):
    res = bridge.execute_command({"request_id": "r-g6i", "command": "dataset.import",
                                  "payload": {"project_id": project_id,
                                              "source_path": str(FIXTURE_CSV),
                                              "dataset_name": "sample"}})
    assert res["ok"], res
    return res["data"]["dataset_id"]


def test_store_marks_running_then_clean_and_next_store_sees_clean(tmp_path):
    root = tmp_path / "proj"
    store = Store(str(root))
    marker = (root / "runtime-state.json").read_text(encoding="utf-8")
    assert '"state": "running"' in marker
    assert store.unclean_previous is False
    store.mark_clean_exit()
    assert '"state": "clean"' in (root / "runtime-state.json").read_text(encoding="utf-8")

    # A subsequent Store sees a clean previous state and writes a new
    # running marker.
    store2 = Store(str(root))
    assert store2.unclean_previous is False
    assert '"state": "running"' in (root / "runtime-state.json").read_text(encoding="utf-8")


def test_startup_autosave_created_when_project_exists(bridge, project_id):
    _import(bridge, project_id)
    root = bridge.service.store.root
    assert bridge.service.maybe_autosave_on_startup() is True
    autosaves = list((root / "autosaves").glob("*.edaworkspace"))
    assert len(autosaves) == 1
    status = bridge.service.recovery_status()
    assert status.has_autosave is True
    assert status.autosave_path == str(autosaves[0])
    assert status.autosave_project_db_sha256


def test_clean_startup_with_no_projects_skips_autosave(tmp_path):
    from backend.ipc import make_bridge

    bridge = make_bridge(str(tmp_path / "empty"))
    bridge.service.authorize_root(str(tmp_path))
    assert bridge.service.maybe_autosave_on_startup() is False
    assert not (bridge.service.store.root / "autosaves").exists()


def test_recovery_restore_new_root_and_original_untouched(tmp_path, bridge, project_id):
    dataset_id = _import(bridge, project_id)
    assert bridge.service.maybe_autosave_on_startup() is True

    # IPC query sees the autosave.
    res = bridge.execute_query({"request_id": "r-gs", "command": "project.recovery.status",
                                 "payload": {}})
    assert res["ok"], res
    assert res["data"]["has_autosave"] is True

    before_db = (bridge.service.store.root / "project.db").read_bytes()
    res = bridge.execute_command({"request_id": "r-gr", "command": "project.recovery.restore",
                                  "payload": {}})
    assert res["ok"], res
    d = res["data"]
    assert d["project_id"] == project_id
    dest = Path(d["dest_root"])
    assert dest.name.startswith("recovered-")
    assert (dest / "project.db").exists()
    assert (dest / "snapshots").is_dir()
    # Original project DB bytes are unchanged.
    assert (bridge.service.store.root / "project.db").read_bytes() == before_db

    # Restored copy imports/previews normally.
    from backend.ipc import make_bridge

    b2 = make_bridge(str(dest))
    b2.service.authorize_root(str(tmp_path))
    res = b2.execute_query({"request_id": "r-go", "command": "project.open",
                            "payload": {"project_id": project_id}})
    assert res["ok"], res
    res = b2.execute_query({"request_id": "r-gp", "command": "dataset.preview",
                            "payload": {"project_id": project_id, "dataset_id": dataset_id}})
    assert res["ok"], res


def test_recovery_restore_without_autosave_is_validation_error(bridge):
    res = bridge.execute_command({"request_id": "r-gn", "command": "project.recovery.restore",
                                  "payload": {}})
    assert res["ok"] is False
    assert res["error"]["code"] == "VALIDATION_ERROR"
