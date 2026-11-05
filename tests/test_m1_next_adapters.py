"""M1-next adapters: Parquet + Excel -> canonical Parquet snapshot.

Fingerprint must equal SHA-256 of the ORIGINAL source bytes (provenance),
regardless of the ingest format.
"""
import hashlib
import io

import openpyxl
import pyarrow as pa
import pyarrow.parquet as pq

from tests.conftest import FIXTURE_CSV


def _import(bridge, project_id, path, name="ds"):
    res = bridge.execute_command({
        "request_id": "r-i", "command": "dataset.import",
        "payload": {"project_id": project_id, "source_path": str(path), "dataset_name": name},
    })
    assert res["ok"], res
    return res["data"]


def _preview(bridge, project_id, dataset_id):
    res = bridge.execute_query({
        "request_id": "r-p", "command": "dataset.preview",
        "payload": {"project_id": project_id, "dataset_id": dataset_id, "limit": 20},
    })
    assert res["ok"], res
    return res["data"]


def test_csv_fingerprint_is_source_sha256(bridge, project_id):
    ds = _import(bridge, project_id, FIXTURE_CSV)
    expected = hashlib.sha256(FIXTURE_CSV.read_bytes()).hexdigest()
    assert ds["fingerprint"] == expected
    assert _preview(bridge, project_id, ds["dataset_id"])["rows"][0]["region"] == "Jakarta"


def test_parquet_source(bridge, project_id, tmp_path):
    table = pa.table({"city": ["Jakarta", "Bandung"], "pop": [100, 50]})
    src = tmp_path / "cities.parquet"
    pq.write_table(table, src)
    ds = _import(bridge, project_id, src)
    assert ds["row_count"] == 2
    assert ds["columns"] == ["city", "pop"]
    assert ds["fingerprint"] == hashlib.sha256(src.read_bytes()).hexdigest()
    prev = _preview(bridge, project_id, ds["dataset_id"])
    assert prev["rows"][1]["city"] == "Bandung"


def test_xlsx_source_first_sheet(bridge, project_id, tmp_path):
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.append(["id", "name"])
    ws.append([1, "alpha"])
    ws.append([2, "beta"])
    src = tmp_path / "book.xlsx"
    wb.save(src)
    ds = _import(bridge, project_id, src)
    assert ds["row_count"] == 2
    assert ds["columns"] == ["id", "name"]
    prev = _preview(bridge, project_id, ds["dataset_id"])
    assert prev["rows"][0]["name"] == "alpha"


def test_snapshot_stored_as_parquet_bytes(bridge, project_id):
    ds = _import(bridge, project_id, FIXTURE_CSV)
    raw = bridge.service.store.read_snapshot(ds["snapshot_id"])
    table = pq.read_table(io.BytesIO(raw))  # must parse as Parquet
    assert table.num_rows == 5


def test_unsupported_format_rejected(bridge, project_id, tmp_path):
    bad = tmp_path / "x.json"
    bad.write_text("{}")
    res = bridge.execute_command({
        "request_id": "r-b", "command": "dataset.import",
        "payload": {"project_id": project_id, "source_path": str(bad), "dataset_name": "x"},
    })
    assert res["ok"] is False
    assert res["error"]["code"] == "UNSUPPORTED_FORMAT"
