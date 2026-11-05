"""G5 histogram slice: dataset.histogram.run (SCREEN-HIST-001)."""
from pathlib import Path

FIXTURE = Path(__file__).parent / "fixtures" / "sample.csv"


def _import(bridge, project_id) -> str:
    res = bridge.execute_command({
        "request_id": "i1", "command": "dataset.import",
        "payload": {"project_id": project_id, "source_path": str(FIXTURE),
                    "dataset_name": "sample"},
    })
    assert res["ok"], res
    return res["data"]["dataset_id"]


def _hist(bridge, project_id, ds, col):
    return bridge.execute_command({
        "request_id": "h1", "command": "dataset.histogram.run",
        "payload": {"project_id": project_id, "dataset_id": ds, "column_name": col},
    })


def test_numeric_histogram(bridge, project_id):
    ds = _import(bridge, project_id)
    res = _hist(bridge, project_id, ds, "sales")
    assert res["ok"], res
    d = res["data"]
    assert d["kind"] == "histogram"
    assert d["inferred_type"] == "numeric"
    assert d["min_value"] == 430.0 and d["max_value"] == 1200.0
    assert d["value_count"] == 5
    assert 1 <= len(d["bins"]) <= 30
    assert sum(b["count"] for b in d["bins"]) == 5
    assert d["snapshot_id"] and d["fingerprint"]
    # job lifecycle durable
    events = bridge.get_events(0)
    assert any(getattr(e["state"], "name", str(e["state"])) == "COMPLETED" for e in events)


def test_categorical_frequency_bar(bridge, project_id):
    ds = _import(bridge, project_id)
    res = _hist(bridge, project_id, ds, "region")
    assert res["ok"], res
    d = res["data"]
    assert d["kind"] == "frequency"
    assert d["inferred_type"] == "categorical"
    # region has repeats (Jakarta x2), 4 distinct
    assert d["top_bin"] is not None
    assert sum(b["count"] for b in d["bins"]) == 5
    assert len(d["bins"]) <= 11  # top10 + Lainnya


def test_unknown_column_not_found(bridge, project_id):
    ds = _import(bridge, project_id)
    res = _hist(bridge, project_id, ds, "nope")
    assert res["ok"] is False
    assert res["error"]["code"] == "NOT_FOUND"


def test_histogram_payload_shape(bridge, project_id):
    """T5: small JSON payload, <= 30 bins (no whole-DataFrame over IPC)."""
    ds = _import(bridge, project_id)
    res = _hist(bridge, project_id, ds, "sales")
    assert res["ok"], res
    import json
    assert len(json.dumps(res["data"])) < 10000
    assert len(res["data"]["bins"]) <= 30
