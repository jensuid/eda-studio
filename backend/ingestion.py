"""Ingestion adapters (M1-next): CSV / XLSX / Parquet -> canonical Parquet.

Doc04: Parquet is the immutable snapshot format; every source is normalised to
a Parquet table at ingestion. The SHA-256 fingerprint is always computed over
the ORIGINAL source bytes (provenance), so any snapshot is reproducible from
source + fingerprint. Column typing stays string in M1; M2 profiling refines.
"""
from __future__ import annotations

import io
from pathlib import Path

import pyarrow as pa
import pyarrow.csv as pacsv
import pyarrow.parquet as pq

SUPPORTED_SUFFIXES = {".csv", ".xlsx", ".parquet"}


class UnsupportedFormatError(ValueError):
    pass


def read_source(path: str | Path) -> tuple[pa.Table, bytes]:
    """Return (table, original_source_bytes) for a supported file."""
    p = Path(path)
    suffix = p.suffix.lower()
    if suffix not in SUPPORTED_SUFFIXES:
        raise UnsupportedFormatError(
            f"unsupported format '{suffix or '(none)'}'; supported: "
            + ", ".join(sorted(SUPPORTED_SUFFIXES))
        )
    data = p.read_bytes()
    if suffix == ".csv":
        table = pacsv.read_csv(io.BytesIO(data))
        # Normalise to string columns for M1 (typing refined by profiling later).
        schema = pa.schema([(f.name, pa.string()) for f in table.schema])
        return table.cast(schema), data
    if suffix == ".parquet":
        return pq.read_table(io.BytesIO(data)), data
    return _read_xlsx(data), data


def _read_xlsx(data: bytes) -> pa.Table:
    import openpyxl  # local import: only needed for Excel sources

    wb = openpyxl.load_workbook(io.BytesIO(data), read_only=True, data_only=True)
    ws = wb.active  # first sheet only in M1-next; sheet picker is M2
    rows = ws.iter_rows(values_only=True)
    header = next(rows, None)
    if header is None:
        return pa.table({})
    columns = [str(c) for c in header]
    records = [
        {columns[i]: (None if v is None else str(v)) for i, v in enumerate(row)}
        for row in rows
    ]
    return pa.Table.from_pylist(records, schema=pa.schema([(c, pa.string()) for c in columns]))


def to_parquet_bytes(table: pa.Table) -> bytes:
    sink = io.BytesIO()
    pq.write_table(table, sink)
    return sink.getvalue()


def preview_rows(parquet_bytes: bytes, limit: int) -> tuple[list[str], list[dict[str, str]], int]:
    table = pq.read_table(io.BytesIO(parquet_bytes))
    total = table.num_rows
    sliced = table.slice(0, limit)
    rows = [
        {k: ("" if v is None else str(v)) for k, v in row.items()}
        for row in sliced.to_pylist()
    ]
    return list(table.column_names), rows, total
