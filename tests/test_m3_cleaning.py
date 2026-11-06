"""M3 Cleaning G5: dataset.cleaning.preview / run + snapshot activate (JOB-CLEAN-001)."""
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


def _preview(bridge, project_id, ds, operation, columns, **kw):
    payload = {"project_id": project_id, "dataset_id": ds,
               "operation": operation, "columns": columns}
    payload.update(kw)
    return bridge.execute_query({
        "request_id": "p1", "command": "dataset.cleaning.preview",
        "payload": payload,
    })


def _run(bridge, project_id, ds, fingerprint, operation, columns, **kw):
    payload = {"project_id": project_id, "dataset_id": ds,
               "operation": operation, "columns": columns,
               "expected_parent_fingerprint": fingerprint}
    payload.update(kw)
    return bridge.execute_command({
        "request_id": "c1", "command": "dataset.cleaning.run",
        "payload": payload,
    })


def _messy(tmp_path):
    path = tmp_path / "messy.csv"
    path.write_text(
        "id,cat,score\n"
        "1,a,10\n"
        "2,a,20\n"
        "3,b,30\n"
        "4,b,40\n"
        "1,a,10\n"
        "6,a,\n"
        "7,,50\n",
    )
    return path


def test_preview_drop_duplicates(bridge, project_id, tmp_path):
    ds = _import(bridge, project_id, _messy(tmp_path), "messy")
    res = _preview(bridge, project_id, ds, "drop_duplicates", [])
    assert res["ok"], res
    d = res["data"]
    assert d["row_count_before"] == 7
    assert d["affected_rows"] == 1  # last-but-one row repeats row 1
    assert d["row_count_after"] == 6
    assert d["parent_fingerprint"]


def test_preview_drop_missing_multi_column(bridge, project_id, tmp_path):
    ds = _import(bridge, project_id, _messy(tmp_path), "messy")
    res = _preview(bridge, project_id, ds, "drop_missing", ["score", "cat"])
    assert res["ok"], res
    d = res["data"]
    # union of rows missing score or cat = 2 rows (rows 6 and 7, 1-indexed)
    assert d["affected_rows"] == 2
    assert d["row_count_after"] == 5
    per_col = {c["column"]: c["affected_rows"] for c in d["per_column_affected"]}
    assert per_col == {"score": 1, "cat": 1}


def test_preview_impute_mean(bridge, project_id, tmp_path):
    ds = _import(bridge, project_id, _messy(tmp_path), "messy")
    res = _preview(bridge, project_id, ds, "impute", ["score"], strategy="mean")
    assert res["ok"], res
    d = res["data"]
    assert d["filled_rows"] == 1 and d["affected_rows"] == 1
    assert d["row_count_after"] == d["row_count_before"]


def test_impute_mean_on_categorical_rejected(bridge, project_id, tmp_path):
    """F2: mean/median numeric-only -> VALIDATION on categorical column."""
    ds = _import(bridge, project_id, _messy(tmp_path), "messy")
    res = _preview(bridge, project_id, ds, "impute", ["cat"], strategy="mean")
    assert res["ok"] is False
    assert res["error"]["code"] == "VALIDATION_ERROR"


def test_impute_constant_type_mismatch_rejected(bridge, project_id, tmp_path):
    """F4: constant must match column type."""
    ds = _import(bridge, project_id, _messy(tmp_path), "messy")
    res = _preview(bridge, project_id, ds, "impute", ["score"],
                   strategy="constant", constant_value="abc")
    assert res["ok"] is False
    assert res["error"]["code"] == "VALIDATION_ERROR"


def test_preview_is_dry_run(bridge, project_id, tmp_path):
    """Preview must not create a cleaning record or a new snapshot."""
    ds = _import(bridge, project_id, _messy(tmp_path), "messy")
    before = bridge.execute_query({
        "request_id": "s1", "command": "dataset.snapshots.list",
        "payload": {"project_id": project_id},
    })
    assert before["ok"], before
    n_before = len(before["data"]["snapshots"])
    _preview(bridge, project_id, ds, "drop_duplicates", [])
    after = bridge.execute_query({
        "request_id": "s2", "command": "dataset.snapshots.list",
        "payload": {"project_id": project_id},
    })
    assert len(after["data"]["snapshots"]) == n_before


def test_cleaning_run_and_activate(bridge, project_id, tmp_path):
    ds = _import(bridge, project_id, _messy(tmp_path), "messy")
    prev = _preview(bridge, project_id, ds, "impute", ["score"], strategy="mean")
    fp = prev["data"]["parent_fingerprint"]
    res = _run(bridge, project_id, ds, fp, "impute", ["score"], strategy="mean")
    assert res["ok"], res
    rec = res["data"]
    assert rec["child_snapshot_id"] and rec["child_snapshot_id"] != rec["parent_snapshot_id"]
    assert rec["child_fingerprint"] != rec["parent_fingerprint"]
    assert rec["filled_rows"] == 1
    # parent untouched: re-preview still sees the original missing value
    prev2 = _preview(bridge, project_id, ds, "impute", ["score"], strategy="mean")
    assert prev2["data"]["filled_rows"] == 1
    # activate child snapshot -> dataset fingerprint changes
    act = bridge.execute_command({
        "request_id": "a1", "command": "dataset.snapshot.activate",
        "payload": {"project_id": project_id, "dataset_id": ds,
                    "snapshot_id": rec["child_snapshot_id"]},
    })
    assert act["ok"], act
    assert act["data"]["fingerprint"] == rec["child_fingerprint"]


def test_cleaning_stale_fingerprint_conflict(bridge, project_id, tmp_path):
    ds = _import(bridge, project_id, _messy(tmp_path), "messy")
    res = _run(bridge, project_id, ds, "stale-fingerprint",
               "drop_duplicates", [])
    assert res["ok"] is False
    assert res["error"]["code"] == "CONFLICT"


def test_cleaning_unknown_dataset_not_found(bridge, project_id):
    res = _preview(bridge, project_id, "nope", "drop_duplicates", [])
    assert res["ok"] is False
    assert res["error"]["code"] == "NOT_FOUND"
