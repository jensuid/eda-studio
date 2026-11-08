"""D-F4: project.open (command) + project.list_recent (query), Beta/Phase 1.

Single active project model (like D-F3): recent is a read-only list
newest-first; open validates existence and returns the project plus the
active dataset when stored (Beta: most recently imported dataset).
Default-deny is preserved (see test_ipc_security).
"""
from pathlib import Path

FIXTURE_CSV = Path(__file__).parent / "fixtures" / "sample.csv"


def _create(bridge, name, rid="r-1"):
    res = bridge.execute_command(
        {"request_id": rid, "command": "project.create", "payload": {"name": name}})
    assert res["ok"], res
    return res["data"]["project_id"]


def _import(bridge, project_id, name="sample.csv"):
    res = bridge.execute_command({
        "request_id": "r-import",
        "command": "dataset.import",
        "payload": {"project_id": project_id,
                    "source_path": str(FIXTURE_CSV), "dataset_name": name},
    })
    assert res["ok"], res
    return res["data"]


def test_open_command_returns_project_without_dataset(bridge):
    pid = _create(bridge, "Empty Project")
    res = bridge.execute_command(
        {"request_id": "r-open", "command": "project.open",
         "payload": {"project_id": pid}})
    assert res["ok"], res
    assert res["data"]["project_id"] == pid
    assert res["data"]["name"] == "Empty Project"
    assert res["data"]["dataset"] is None


def test_open_command_returns_active_dataset_with_columns(bridge):
    pid = _create(bridge, "With Data")
    ds = _import(bridge, pid)
    res = bridge.execute_command(
        {"request_id": "r-open", "command": "project.open",
         "payload": {"project_id": pid}})
    assert res["ok"], res
    assert res["data"]["dataset"]["dataset_id"] == ds["dataset_id"]
    assert res["data"]["dataset"]["columns"], "columns rehydrated like dataset.get"
    assert res["data"]["dataset"]["project_id"] == pid


def test_open_command_unknown_project_is_not_found(bridge):
    res = bridge.execute_command(
        {"request_id": "r-open", "command": "project.open",
         "payload": {"project_id": "proj_does_not_exist"}})
    assert res["ok"] is False
    assert res["error"]["code"] == "NOT_FOUND"


def test_open_query_compat_still_returns_project_record(bridge):
    pid = _create(bridge, "Compat Project")
    res = bridge.execute_query(
        {"request_id": "r-open-q", "command": "project.open",
         "payload": {"project_id": pid}})
    assert res["ok"], res
    assert res["data"] == {"project_id": pid, "name": "Compat Project"}


def test_list_recent_newest_first_and_dataset_count(bridge):
    p1 = _create(bridge, "First", rid="r-1")
    p2 = _create(bridge, "Second", rid="r-2")
    _import(bridge, p1)
    res = bridge.execute_query(
        {"request_id": "r-recent", "command": "project.list_recent",
         "payload": {}})
    assert res["ok"], res
    projects = res["data"]["projects"]
    assert [p["project_id"] for p in projects] == [p2, p1]
    assert projects[1]["dataset_count"] == 1
    assert projects[0]["dataset_count"] == 0


def test_list_recent_limit_is_respected(bridge):
    _create(bridge, "A", rid="r-1")
    _create(bridge, "B", rid="r-2")
    _create(bridge, "C", rid="r-3")
    res = bridge.execute_query(
        {"request_id": "r-recent", "command": "project.list_recent",
         "payload": {"limit": 2}})
    assert res["ok"], res
    assert len(res["data"]["projects"]) == 2
    assert res["data"]["projects"][0]["name"] == "C"


def test_list_recent_empty_when_no_projects(bridge):
    res = bridge.execute_query(
        {"request_id": "r-recent", "command": "project.list_recent",
         "payload": {}})
    assert res["ok"], res
    assert res["data"]["projects"] == []
