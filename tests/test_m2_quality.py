"""G5 quality slice: dataset.quality.run (SCREEN-QUAL-001, Q1-Q5)."""
import json
from pathlib import Path

FIXTURE = Path(__file__).parent / "fixtures" / "sample.csv"


def _import(bridge, project_id, path=FIXTURE, name="sample") -> str:
    res = bridge.execute_command({
        "request_id": "i1", "command": "dataset.import",
        "payload": {"project_id": project_id, "source_path": str(path),
                    "dataset_name": name},
    })
    assert res["ok"], res
    return res["data"]["dataset_id"]


def _quality(bridge, project_id, ds):
    return bridge.execute_command({
        "request_id": "q1", "command": "dataset.quality.run",
        "payload": {"project_id": project_id, "dataset_id": ds},
    })


def _find(d, rule_id, column):
    return [f for f in d["findings"]
            if f["rule_id"] == rule_id and f.get("column_name") == column]


def test_quality_clean_sample(bridge, project_id):
    ds = _import(bridge, project_id)
    res = _quality(bridge, project_id, ds)
    assert res["ok"], res
    d = res["data"]
    assert d["dataset_id"] == ds
    assert d["snapshot_id"] and d["fingerprint"]
    assert d["row_count"] == 5
    # 1 duplicates + 3 rules x 3 columns = 10 findings, sample is clean
    assert len(d["findings"]) == 10
    assert d["problem_count"] == 0 and d["check_count"] == 0
    assert d["ok_count"] == 10
    assert "10 OK" in d["summary"]
    assert _find(d, "duplicates", None)[0]["severity"] == "ok"
    assert _find(d, "outliers", "sales")[0]["evidence_count"] == 0
    # categorical column: outliers rule skipped with explanation, not error
    assert "dilewati" in _find(d, "outliers", "region")[0]["evidence_detail"]
    # every finding carries evidence (Doc03 §4.3 invariant)
    for f in d["findings"]:
        assert f["message"] and f["evidence_detail"]
    events = bridge.get_events(0)
    assert any(getattr(e["state"], "name", str(e["state"])) == "COMPLETED"
               for e in events)


def test_quality_detects_issues(bridge, project_id, tmp_path):
    messy = tmp_path / "messy.csv"
    messy.write_text(
        "id,cat,score\n"
        "1,a,10\n"
        "2,a,20\n"
        "3,a,30\n"
        "4,a,40\n"
        "5,a,10000\n"
        ",a,50\n"
        "1,a,10\n",
    )
    ds = _import(bridge, project_id, messy, "messy")
    res = _quality(bridge, project_id, ds)
    assert res["ok"], res
    d = res["data"]
    assert d["row_count"] == 7
    # completeness: id missing 1/7 (~14.29%) -> check
    f = _find(d, "completeness", "id")[0]
    assert f["severity"] == "check" and f["evidence_count"] == 1
    assert f["evidence_pct"] == round(1 / 7 * 100, 2)
    # constant: cat always 'a' -> check
    f = _find(d, "constant", "cat")[0]
    assert f["severity"] == "check"
    assert "a" in f["evidence_detail"]
    # duplicates: last row repeats row 1 exactly -> 1 duplicate row
    f = _find(d, "duplicates", None)[0]
    assert f["severity"] == "check" and f["evidence_count"] == 1
    # outliers: score 10000 outside 1.5xIQR -> check
    f = _find(d, "outliers", "score")[0]
    assert f["severity"] == "check" and f["evidence_count"] == 1
    assert "IQR" in f["evidence_detail"]
    assert d["check_count"] >= 4


def test_quality_high_missing_is_problem(bridge, project_id, tmp_path):
    sparse = tmp_path / "sparse.csv"
    sparse.write_text(
        "id,gap\n"
        "1,\n"
        "2,\n"
        "3,\n"
        "4,9\n",
    )
    ds = _import(bridge, project_id, sparse, "sparse")
    res = _quality(bridge, project_id, ds)
    assert res["ok"], res
    d = res["data"]
    # gap missing 3/4 = 75% > 30% -> problem (Q2, aligns with profiling)
    f = _find(d, "completeness", "gap")[0]
    assert f["severity"] == "problem" and f["evidence_pct"] == 75.0
    assert d["problem_count"] >= 1


def test_quality_unknown_dataset_not_found(bridge, project_id):
    res = _quality(bridge, project_id, "nope")
    assert res["ok"] is False
    assert res["error"]["code"] == "NOT_FOUND"


def test_quality_payload_shape(bridge, project_id):
    """Q5: small JSON payload, findings <= 4*n_kolom + 1 (no whole-DataFrame)."""
    ds = _import(bridge, project_id)
    res = _quality(bridge, project_id, ds)
    assert res["ok"], res
    assert len(json.dumps(res["data"])) < 10000
    assert len(res["data"]["findings"]) <= 4 * 3 + 1
