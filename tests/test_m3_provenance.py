"""M3 P1 provenance view (SEC-012: provenance != audit).

`dataset.provenance` chains import origin → profile observations →
cleaning transforms (parent → child snapshots). It is NOT the audit
trail (job_events); no job_id/event fields appear in the record.
"""
from __future__ import annotations

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


def _run_profile(bridge, project_id, ds) -> dict:
    res = bridge.execute_command({
        "request_id": "pr1", "command": "dataset.profile.run",
        "payload": {"project_id": project_id, "dataset_id": ds},
    })
    assert res["ok"], res
    return res["data"]


def _run_cleaning(bridge, project_id, ds, fingerprint, operation, columns, **kw):
    payload = {"project_id": project_id, "dataset_id": ds,
               "operation": operation, "columns": columns,
               "expected_parent_fingerprint": fingerprint}
    payload.update(kw)
    res = bridge.execute_command({
        "request_id": "c1", "command": "dataset.cleaning.run",
        "payload": payload,
    })
    assert res["ok"], res
    return res["data"]


def _provenance(bridge, project_id, ds):
    return bridge.execute_query({
        "request_id": "prov1", "command": "dataset.provenance",
        "payload": {"project_id": project_id, "dataset_id": ds},
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


def test_provenance_import_only(bridge, project_id):
    ds = _import(bridge, project_id)
    res = _provenance(bridge, project_id, ds)
    assert res["ok"], res
    d = res["data"]
    assert d["dataset_id"] == ds
    assert d["active_snapshot_id"] == d["origin_snapshot_id"]
    assert d["active_fingerprint"] == d["origin_fingerprint"]
    assert len(d["snapshots"]) == 1
    assert d["profiles"] == []
    assert d["lineage"] == []
    # Provenance is not audit: no job/event fields.
    assert "job_id" not in d and "events" not in d


def test_provenance_with_profile_and_cleaning(bridge, project_id, tmp_path):
    ds = _import(bridge, project_id, _messy(tmp_path), "messy")
    prof = _run_profile(bridge, project_id, ds)
    res = _provenance(bridge, project_id, ds)
    assert res["ok"], res
    d = res["data"]
    assert len(d["profiles"]) == 1
    assert d["profiles"][0]["profile_id"] == prof["profile_id"]
    assert d["profiles"][0]["snapshot_id"] == d["origin_snapshot_id"]
    assert d["profiles"][0]["fingerprint"] == d["origin_fingerprint"]

    clean = _run_cleaning(bridge, project_id, ds, prof["fingerprint"],
                          "drop_duplicates", [])
    res = _provenance(bridge, project_id, ds)
    assert res["ok"], res
    d = res["data"]
    assert len(d["snapshots"]) == 2
    assert len(d["lineage"]) == 1
    edge = d["lineage"][0]
    assert edge["cleaning_id"] == clean["id"]
    assert edge["parent_snapshot_id"] == d["origin_snapshot_id"]
    assert edge["child_snapshot_id"] == clean["child_snapshot_id"]
    assert edge["operation"] == "drop_duplicates"
    # Origin stays the import snapshot; run_cleaning alone does not activate child.
    assert d["origin_snapshot_id"] != clean["child_snapshot_id"]
    assert d["active_snapshot_id"] == d["origin_snapshot_id"]


def test_provenance_unknown_dataset_not_found(bridge, project_id):
    res = _provenance(bridge, project_id, "nope")
    assert res["ok"] is False
    assert res["error"]["code"] == "NOT_FOUND"
