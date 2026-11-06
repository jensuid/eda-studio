"""Descriptive bivariate analysis (SCREEN-BIVAR-001, JOB-BIVAR-001).

Reads a canonical Parquet snapshot and computes a descriptive comparison
for exactly two columns (Ratified V1-V7, 2026-11-06):
  - B1 numeric x numeric   -> Pearson + Spearman + capped scatter (V2, V3)
  - B2 categorical x numeric -> per-group count/mean/median/min-max (V5)
  - B3 categorical x categorical -> cross-tab counts top-10 + "Lainnya" (V4)

Rules: pairwise-complete pairs only, deterministic first-n sampling capped
at 2000 points (V3, no silent downgrade), no causal claims, no full
DataFrame in the record (V6/A2). Types reuse profiling's inference
(numeric iff every non-missing value parses as float).
"""
from __future__ import annotations

import io
import math
from collections import Counter

import pyarrow.parquet as pq

from backend.profiling import _is_missing

_SAMPLE_MAX = 2000
_TOP_N = 10


def _infer_type(values: list) -> str:
    present = [v for v in values if not _is_missing(v)]
    if not present:
        return "empty"
    for v in present:
        try:
            float(str(v))
        except (TypeError, ValueError):
            return "categorical"
    return "numeric"


def _pearson(xs: list[float], ys: list[float]) -> float | None:
    n = len(xs)
    if n < 2:
        return None
    mx = sum(xs) / n
    my = sum(ys) / n
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    sxx = sum((x - mx) ** 2 for x in xs)
    syy = sum((y - my) ** 2 for y in ys)
    denom = math.sqrt(sxx * syy)
    if denom == 0:
        return None
    return sxy / denom


def _ranks(vals: list[float]) -> list[float]:
    """Average ranks (1-based), ties share the mean rank."""
    indexed = sorted(enumerate(vals), key=lambda p: p[1])
    ranks = [0.0] * len(vals)
    i = 0
    while i < len(indexed):
        j = i
        while j + 1 < len(indexed) and indexed[j + 1][1] == indexed[i][1]:
            j += 1
        avg = (i + j) / 2 + 1
        for k in range(i, j + 1):
            ranks[indexed[k][0]] = avg
        i = j + 1
    return ranks


def _median(sorted_vals: list[float]) -> float:
    n = len(sorted_vals)
    if n == 0:
        return 0.0
    mid = n // 2
    if n % 2:
        return sorted_vals[mid]
    return (sorted_vals[mid - 1] + sorted_vals[mid]) / 2


def _group_rows(cat_vals: list[str], num_vals: list[float]) -> list[dict]:
    """Per-category mean/median/etc., top-10 by count + 'Lainnya' (V4/V5)."""
    by_label: dict[str, list[float]] = {}
    for c, v in zip(cat_vals, num_vals):
        by_label.setdefault(c, []).append(v)
    ordered = sorted(by_label.items(), key=lambda kv: (-len(kv[1]), kv[0]))
    groups: list[dict] = []
    tail_vals: list[float] = []
    kept = {lbl for lbl, _ in ordered[:_TOP_N]}
    for label, vals in ordered:
        if label in kept:
            groups.append(_summarise(label, vals))
        else:
            tail_vals.extend(vals)
    if tail_vals:
        groups.append(_summarise("Lainnya", tail_vals))
    return groups


def _summarise(label: str, vals: list[float]) -> dict:
    sv = sorted(vals)
    return {
        "label": label,
        "count": len(vals),
        "mean_value": round(sum(vals) / len(vals), 4) if vals else 0.0,
        "median_value": round(_median(sv), 4) if sv else 0.0,
        "min_value": min(sv) if sv else 0.0,
        "max_value": max(sv) if sv else 0.0,
    }


def _top_labels(labels: list[str]) -> tuple[list[str], dict[str, str]]:
    """Top-10 + "Lainnya" mapping for one axis."""
    counts = Counter(labels)
    ordered = [lbl for lbl, _ in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))]
    top = ordered[:_TOP_N]
    mapping = {lbl: (lbl if lbl in top else "Lainnya") for lbl in ordered}
    return top, mapping


def describe_bivariate(parquet_bytes: bytes, column_a: str, column_b: str) -> dict:
    """Compute the bivariate descriptor for two columns (SCREEN-BIVAR-001)."""
    table = pq.read_table(io.BytesIO(parquet_bytes))
    for col in (column_a, column_b):
        if col not in table.column_names:
            raise LookupError(f"column not found: {col}")
    vals_a = table.column(column_a).to_pylist()
    vals_b = table.column(column_b).to_pylist()
    n_rows = len(vals_a)
    type_a = _infer_type(vals_a)
    type_b = _infer_type(vals_b)

    pairs = [
        (a, b) for a, b in zip(vals_a, vals_b)
        if not _is_missing(a) and not _is_missing(b)
    ]
    n_pairs = len(pairs)
    missing_pairs = n_rows - n_pairs

    def base(mode: str) -> dict:
        return {
            "mode": mode, "type_a": type_a, "type_b": type_b,
            "n_pairs": n_pairs, "missing_pairs": missing_pairs,
            "sampled": False, "sample_size": 0, "constant_columns": [],
        }

    if n_pairs == 0 or type_a == "empty" or type_b == "empty":
        return base("empty")

    if type_a == "numeric" and type_b == "numeric":
        xs = [float(str(a)) for a, _ in pairs]
        ys = [float(str(b)) for _, b in pairs]
        pearson = _pearson(xs, ys)
        spearman = _pearson(_ranks(xs), _ranks(ys))
        pts = pairs[:_SAMPLE_MAX]
        d = base("num-num")
        d.update({
            "pearson_r": round(pearson, 4) if pearson is not None else None,
            "spearman_rho": round(spearman, 4) if spearman is not None else None,
            "scatter_points": [{"x": float(str(a)), "y": float(str(b))} for a, b in pts],
            "sample_size": len(pts),
            "sampled": n_pairs > _SAMPLE_MAX,
            "constant_columns": [
                c for c, xs_ in ((column_a, xs), (column_b, ys))
                if len(set(xs_)) == 1
            ],
        })
        return d

    if {type_a, type_b} == {"numeric", "categorical"}:
        if type_a == "categorical":
            cat_raw, num_raw = [str(a) for a, _ in pairs], [float(str(b)) for _, b in pairs]
            group_col, value_col = column_a, column_b
        else:
            cat_raw, num_raw = [str(b) for _, b in pairs], [float(str(a)) for a, _ in pairs]
            group_col, value_col = column_b, column_a
        d = base("cat-num")
        d.update({
            "group_column": group_col, "value_column": value_col,
            "groups": _group_rows(cat_raw, num_raw),
        })
        return d

    # categorical x categorical
    a_labels = [str(a) for a, _ in pairs]
    b_labels = [str(b) for _, b in pairs]
    top_a, map_a = _top_labels(a_labels)
    top_b, map_b = _top_labels(b_labels)
    row_labels = top_a + (["Lainnya"] if len(set(a_labels)) > _TOP_N else [])
    col_labels = top_b + (["Lainnya"] if len(set(b_labels)) > _TOP_N else [])
    cells = [[0] * len(col_labels) for _ in row_labels]
    for a, b in pairs:
        ma, mb = map_a[str(a)], map_b[str(b)]
        cells[row_labels.index(ma)][col_labels.index(mb)] += 1
    d = base("cat-cat")
    d.update({"row_labels": row_labels, "col_labels": col_labels, "cells": cells})
    return d
