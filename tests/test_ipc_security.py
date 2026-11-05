"""SEC-004 default-deny + ErrorContract translation (ES-13.2)."""


def test_unknown_command_is_denied(bridge):
    res = bridge.execute_command({"request_id": "r-x", "command": "[...]",
                                  "payload": {}})
    assert res["ok"] is False
    assert res["error"]["code"] == "PERMISSION_DENIED"


def test_unknown_query_is_denied(bridge):
    res = bridge.execute_query({"request_id": "r-x", "command": "dataset.delete",
                                "payload": {}})
    assert res["ok"] is False
    assert res["error"]["code"] == "PERMISSION_DENIED"


def test_validation_error_shape(bridge):
    res = bridge.execute_command({"request_id": "r-x", "command": "project.create",
                                  "payload": {"name": ""}})
    assert res["ok"] is False
    assert res["error"]["code"] == "VALIDATION_ERROR"


def test_unsupported_format(bridge, project_id, tmp_path):
    bad = tmp_path / "x.json"
    bad.write_text("{}")
    res = bridge.execute_command({
        "request_id": "r-x", "command": "dataset.import",
        "payload": {"project_id": project_id, "source_path": str(bad), "dataset_name": "x"},
    })
    assert res["ok"] is False
    assert res["error"]["code"] == "UNSUPPORTED_FORMAT"


def test_protocol_info_lists_only_registered(bridge):
    info = bridge.get_protocol_info()
    assert info["commands"] == [
        "dataset.histogram.run", "dataset.import",
        "dataset.profile.run", "dataset.quality.run", "project.create"]
    assert info["queries"] == [
        "dataset.preview", "dataset.profile", "dataset.profile.get",
        "dataset.profiles.list", "dataset.snapshots.list", "project.open"]
