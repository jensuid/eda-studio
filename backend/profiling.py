"""Univariate profiling for M2 slice (SCREEN-PROF-001).

Reads a canonical Parquet snapshot and computes per-column descriptives.
Columns are string-typed at ingestion (M1); type is inferred here: a column
is numeric iff every non-missing value parses as float, else categorical.
Status thresholds are PROPOSED for this slice (see contracts.py).
"""
from __future__ import annotations

import io
from collections import Counter

import pyarrow.parquet as pq

_MISSING = {"", "null", "none", "nan"}


def _is_missing(v) -> bool:
    return v is None or (isinstance(v, str) and v.strip().lower() in _MISSING)


def profile_table(parquet_bytes: bytes) -> tuple[int, list[dict]]:
    table = pq.read_table(io.BytesIO(parquet_bytes))
    n = table.num_rows
    out: list[dict] = []
    for name in table.column_names:
        values = table.column(name).to_pylist()
        present = [v for v in values if not _is_missing(v)]
        missing = n - len(present)
        missing_pct = round((missing / n * 100) if n else 0.0, 2)
        raw = [str(v) for v in present]
        distinct = len(set(raw))
        inferred = "empty" if not present else "categorical"
        min_v = max_v = mean_v = None
        top_v = None
        numeric: list[float] = []
        if present:
            all_num = True
            for v in present:
                try:
                    numeric.append(float(str(v)))
                except (TypeError, ValueError):
                    all_num = False
                    break
            if all_num:
                inferred = "numeric"
                min_v, max_v = min(numeric), max(numeric)
                mean_v = round(sum(numeric) / len(numeric), 4)
            else:
                top_v = Counter(raw).most_common(1)[0][0]
        if inferred == "empty" or missing_pct > 30:
            status = "problem"
        elif missing > 0 or distinct == 1:
            status = "check"
        else:
            status = "ok"
        out.append({
            "name": name, "inferred_type": inferred,
            "missing_count": missing, "missing_pct": missing_pct,
            "distinct_count": distinct, "min_value": min_v,
            "max_value": max_v, "mean_value": mean_v,
            "top_value": top_v, "status": status,
        })
    return n, out
