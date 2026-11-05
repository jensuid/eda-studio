"""Descriptive histograms / frequency bars (SCREEN-HIST-001, JOB-HIST-001).

Reads a canonical Parquet snapshot and computes a descriptive distribution
for one column. Strategy (T1, PO-ratified 2026-11-05):
  - numeric column    -> histogram (binning per T2)
  - categorical/string -> frequency bar, top 10 + "Lainnya" (T3)
  - constant          -> single-bar
  - all missing       -> empty kind (no chart)

Binning (T2): Freedman-Diaconis (IQR-based) with max 30 bins; fallback to
equal-width when IQR == 0. The rule is surfaced to the UI so it cannot
mislead. Payload is small (<= 30 bins) so JSON IPC is safe (T5).
"""
from __future__ import annotations

import io
import math
from collections import Counter

import pyarrow.parquet as pq

_MAX_BINS = 30
_TOP_N = 10


def _quantile(sorted_vals: list[float], q: float) -> float:
    if not sorted_vals:
        return 0.0
    pos = (len(sorted_vals) - 1) * q
    lo = math.floor(pos)
    hi = math.ceil(pos)
    if lo == hi:
        return sorted_vals[int(pos)]
    return sorted_vals[lo] + (sorted_vals[hi] - sorted_vals[lo]) * (pos - lo)


def _numeric_bins(values: list[float], n: int) -> tuple[list[dict], str]:
    """Return (bins, method) where each bin is {label, count}."""
    if not values:
        return [], "empty"
    lo, hi = min(values), max(values)
    if lo == hi:
        return [{"label": f"{lo:.4g}", "count": n}], "constant"
    sorted_v = sorted(values)
    iqr = _quantile(sorted_v, 0.75) - _quantile(sorted_v, 0.25)
    if iqr > 0:
        width = 2 * iqr / (len(values) ** (1 / 3))
        n_bins = math.ceil((hi - lo) / width) if width > 0 else 1
        method = "freedman-diaconis"
    else:
        n_bins = 10
        method = "equal-width"
    n_bins = max(1, min(_MAX_BINS, n_bins))
    step = (hi - lo) / n_bins
    counts = [0] * n_bins
    for v in values:
        idx = int((v - lo) / step) if step > 0 else 0
        counts[min(idx, n_bins - 1)] += 1
    bins = [{"label": f"{lo + i * step:.4g}–{lo + (i + 1) * step:.4g}",
             "count": c} for i, c in enumerate(counts)]
    return bins, method


def describe_column(parquet_bytes: bytes, column: str) -> dict:
    """Compute the distribution record for one column (SCREEN-HIST-001)."""
    table = pq.read_table(io.BytesIO(parquet_bytes))
    if column not in table.column_names:
        raise LookupError(f"column not found: {column}")
    values = table.column(column).to_pylist()
    n = len(values)
    from backend.profiling import _is_missing  # reuse missing definition
    non_missing = [v for v in values if not _is_missing(v)]
    missing_count = n - len(non_missing)
    missing_pct = round((missing_count / n * 100) if n else 0.0, 2)
    if not non_missing:
        return {"inferred_type": "empty", "kind": "empty", "bins": [],
                "bin_method": "empty", "missing_pct": missing_pct,
                "min_value": None, "max_value": None, "mean_value": None,
                "top_bin": None, "value_count": 0}
    raw = [str(v) for v in non_missing]
    numeric: list[float] = []
    all_num = True
    for r in raw:
        try:
            numeric.append(float(r))
        except (TypeError, ValueError):
            all_num = False
            break
    if all_num:
        bins, method = _numeric_bins(numeric, len(numeric))
        kind = "frequency" if method == "constant" else "histogram"
        top = max(bins, key=lambda b: b["count"])["label"] if bins else None
        mean = round(sum(numeric) / len(numeric), 4)
        return {"inferred_type": "numeric", "kind": kind, "bins": bins,
                "bin_method": method, "missing_pct": missing_pct,
                "min_value": min(numeric), "max_value": max(numeric),
                "mean_value": mean, "top_bin": top, "value_count": len(numeric)}
    counter = Counter(raw)
    distinct = len(counter)
    if distinct == 1:
        only = next(iter(counter))
        return {"inferred_type": "categorical", "kind": "frequency",
                "bins": [{"label": only, "count": counter[only]}],
                "bin_method": "constant", "missing_pct": missing_pct,
                "min_value": None, "max_value": None, "mean_value": None,
                "top_bin": only, "value_count": len(non_missing)}
    top_items = counter.most_common(_TOP_N)
    bins = [{"label": label, "count": c} for label, c in top_items]
    rest = sum(c for _, c in counter.most_common()[_TOP_N:])
    if rest:
        bins.append({"label": "Lainnya", "count": rest})
    return {"inferred_type": "categorical", "kind": "frequency",
            "bins": bins, "bin_method": "top-n",
            "missing_pct": missing_pct, "min_value": None,
            "max_value": None, "mean_value": None,
            "top_bin": top_items[0][0], "value_count": len(non_missing)}
