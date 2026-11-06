"""M3 P0 dataset export: dataset.export (CSV/Parquet, Doc16 §4.2)."""
import csv
import hashlib
import io
import json
from pathlib import Path

import pyarrow.parquet as pq

FIXTURE = Path(__file__).parent / "fixtures" / "sample.csv"


def _import(bridge, project_id) -> str:
    res = bridge.execute_command({
        "request_id": "i1", "command": "dataset.import",
        "payload": {"project_id": project_id, "source_path": str(FIXTURE),
                    "dataset_name": "sample"},
    })
    assert res["ok"], res
    return res["data"]["dataset_id"]


def _export(bridge, project_id, ds, fmt, dest):
    return bridge.execute_command({
        "request_id": "r1", "command": "dataset.export",
        "payload": {"project_id": project_id, "dataset_id": ds,
                    "format": fmt, "dest_path": str(dest)},
    })


def test_export_csv_roundtrip(bridge, project_id, tmp_path):
    ds = _import(bridge, project_id)
    dest = tmp_path / "out.csv"
    res = _export(bridge, project_id, ds, "csv", dest)
    assert res["ok"], res
    d = res["data"]
    assert d["dataset_id"] == ds
    assert d["format"] == "csv"
    assert d["file_size_bytes"] == dest.stat().st_size
    assert d["row_count"] > 0
    assert d["file_fingerprint"] == hashlib.sha256(dest.read_bytes()).hexdigest()
    assert d["snapshot_id"] and d["fingerprint"]
    assert d["file_path"] == str(dest.resolve())
    assert len(json.dumps(d)) < 10000  # artifact on disk, never over IPC
    with open(dest, newline="") as f:
        rows = list(csv.reader(f))
    assert rows[0]  # header
    assert len(rows) - 1 == d["row_count"]


def test_export_parquet_roundtrip(bridge, project_id, tmp_path):
    ds = _import(bridge, project_id)
    dest = tmp_path / "out.parquet"
    res = _export(bridge, project_id, ds, "parquet", dest)
    assert res["ok"], res
    d = res["data"]
    assert d["format"] == "parquet"
    table = pq.read_table(io.BytesIO(dest.read_bytes()))
    assert table.num_rows == d["row_count"]
    assert d["file_fingerprint"] == hashlib.sha256(dest.read_bytes()).hexdigest()


def test_export_unknown_dataset_not_found(bridge, project_id, tmp_path):
    res = _export(bridge, project_id, "missing", "csv", tmp_path / "x.csv")
    assert res["ok"] is False
    assert res["error"]["code"] == "NOT_FOUND"
