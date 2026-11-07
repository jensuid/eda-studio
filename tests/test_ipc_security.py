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
        "chart.spec.save",
        "dataset.bivariate.run", "dataset.cleaning.run", "dataset.export", "dataset.histogram.run", "dataset.import",
        "dataset.pdf.generate", "dataset.profile.run", "dataset.quality.run", "dataset.report.generate",
        "dataset.snapshot.activate", "dialog.pick_file", "insight.finding.create", "insight.finding.transition",
        "insight.hypothesis.create", "insight.hypothesis.transition",
        "plan.approve", "plan.create", "plan.execute", "project.backup.create",
        "project.create", "project.diagnostic.create", "project.restore"]
    assert info["queries"] == [
        "chart.spec.get", "chart.spec.list",
        "dataset.cleaning.preview", "dataset.preview", "dataset.profile",
        "dataset.profile.get", "dataset.profiles.list",
        "dataset.provenance", "dataset.snapshots.list", "insight.findings.list",
        "insight.hypotheses.list", "plan.get", "plan.list", "project.open"]
