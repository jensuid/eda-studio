"""G5 bivariate slice: dataset.bivariate.run (SCREEN-BIVAR-001, JOB-BIVAR-001)."""
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


def _bivar(bridge, project_id, ds, col_a, col_b):
    return bridge.execute_command({
        "request_id": "b1", "command": "dataset.bivariate.run",
        "payload": {"project_id": project_id, "dataset_id": ds,
                    "column_a": col_a, "column_b": col_b},
    })


def test_num_num_correlation(bridge, project_id):
    ds = _import(bridge, project_id)
    res = _bivar(bridge, project_id, ds, "id", "sales")
    assert res["ok"], res
    d = res["data"]
    assert d["mode"] == "num-num"
    assert d["type_a"] == "numeric" and d["type_b"] == "numeric"
    assert d["n_pairs"] == 5 and d["missing_pairs"] == 0
    assert d["pearson_r"] is not None and d["spearman_rho"] is not None
    assert len(d["scatter_points"]) == 5
    assert d["sampled"] is False and d["sample_size"] == 5
    assert d["snapshot_id"] and d["fingerprint"]


def test_cat_num_groups(bridge, project_id):
    ds = _import(bridge, project_id)
    res = _bivar(bridge, project_id, ds, "region", "sales")
    assert res["ok"], res
    d = res["data"]
    assert d["mode"] == "cat-num"
    assert d["group_column"] == "region" and d["value_column"] == "sales"
    assert sum(g["count"] for g in d["groups"]) == 5
    jac = next(g for g in d["groups"] if g["label"] == "Jakarta")
    assert jac["count"] == 2
    assert jac["mean_value"] == 1090.0


def test_same_column_rejected(bridge, project_id):
    ds = _import(bridge, project_id)
    res = _bivar(bridge, project_id, ds, "sales", "sales")
    assert res["ok"] is False
    assert "VALIDATION" in res["error"]["code"]


def test_unknown_column_not_found(bridge, project_id):
    ds = _import(bridge, project_id)
    res = _bivar(bridge, project_id, ds, "sales", "nope")
    assert res["ok"] is False
    assert res["error"]["code"] == "NOT_FOUND"


def test_cat_cat_with_second_fixture(bridge, project_id):
    from pathlib import Path as _P

    fixture = _P(__file__).parent / "fixtures" / "bivariate-cc.csv"
    res = bridge.execute_command({
        "request_id": "i2", "command": "dataset.import",
        "payload": {"project_id": project_id, "source_path": str(fixture),
                    "dataset_name": "city-channel"},
    })
    assert res["ok"], res
    ds = res["data"]["dataset_id"]
    res = _bivar(bridge, project_id, ds, "city", "channel")
    assert res["ok"], res
    d = res["data"]
    assert d["mode"] == "cat-cat"
    assert sum(sum(row) for row in d["cells"]) == d["n_pairs"] == 10


def test_payload_shape_small(bridge, project_id):
    """V6/A2: JSON payload stays small (no whole-DataFrame)."""
    import json
    ds = _import(bridge, project_id)
    res = _bivar(bridge, project_id, ds, "id", "sales")
    assert res["ok"], res
    assert len(json.dumps(res["data"])) < 10000
    assert len(res["data"]["scatter_points"]) <= 2000
