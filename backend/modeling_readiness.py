"""Deterministic anomaly + modeling-readiness assessment (G3, Phase 4 slice 1).

Pure functions over Parquet bytes (same pattern as backend/quality.py):
never mutates the source snapshot, fully deterministic (no randomness,
no sampling, no wall-clock). Two categories of checks:

Anomaly (distribution / row-shape risks):
- iqr_outliers (per numeric column): values outside 1.5xIQR fences.
  problem if those rows exceed 5% of the column, check if any, else ok.
- skewness (per numeric column): moment skewness g1. problem if |g1| > 2,
  check if |g1| > 1, else ok. Skipped (ok, with explanation) for constant
  or too-short columns.
- duplicate_rows (snapshot level): exact duplicate rows (all cols equal).
  problem if > 5% of rows, check if any, else ok.

Modeling-readiness (is this snapshot usable for modeling at all):
- row_count_sufficiency: problem < 30 rows, check < 100, else ok.
- numeric_target_candidate (snapshot level): numeric columns with
  variance > 0 (a plausible regression target). problem if none,
  check if exactly one, else ok.
- missingness (snapshot level, worst column): problem if the worst
  column is missing > 30%, check if > 0, else ok.
- constant_column (per column): distinct == 1 among non-missing values.
  Always check when triggered (mirrors the quality rule).
- high_cardinality (per categorical column): distinct / non-missing
  values > 0.9 with >= 10 values — ID-like, overfitting risk.
  check when triggered, else ok.

All thresholds are PROPOSED (same ratification status as the quality
thresholds) and documented here; changing them is a one-place edit.

Payload discipline (ADR-003): per-cell evidence is aggregate only.
Outlier/offending row indexes are capped at _MAX_EXAMPLE_INDEXES so a
wide dataset can never blow the JSON cap. The readiness score is a
simple deterministic projection: score = round(100 * (ok + 0.5 * check)
/ total) where total counts every emitted item.
"""
from __future__ import annotations

import io

import pyarrow.parquet as pq

from backend.histograms import _quantile
from backend.profiling import _is_missing

_MAX_EXAMPLE_INDEXES = 20


def _pct(part: int, total: int) -> float:
    return round((part / total * 100) if total else 0.0, 2)


def _numeric_values(values: list) -> list[float] | None:
    """Return float values if every non-missing value parses, else None."""
    present = [v for v in values if not _is_missing(v)]
    if not present:
        return None
    out: list[float] = []
    for v in present:
        try:
            out.append(float(str(v)))
        except (TypeError, ValueError):
            return None
    return out


def _skewness(values: list[float]) -> float:
    """Moment skewness g1 (population form); 0.0 when undefined."""
    n = len(values)
    if n < 3:
        return 0.0
    mean = sum(values) / n
    m2 = sum((v - mean) ** 2 for v in values) / n
    if m2 == 0:
        return 0.0
    m3 = sum((v - mean) ** 3 for v in values) / n
    return m3 / (m2 ** 1.5)


def _item(check_id: str, category: str, column_name, status: str,
          message: str, evidence_count: int, evidence_pct: float,
          evidence_detail: str, example_row_indexes: list[int] | None = None) -> dict:
    return {
        "check_id": check_id,
        "category": category,
        "column_name": column_name,
        "status": status,
        "message": message,
        "evidence_count": evidence_count,
        "evidence_pct": evidence_pct,
        "evidence_detail": evidence_detail,
        "example_row_indexes": list(example_row_indexes or [])[:_MAX_EXAMPLE_INDEXES],
    }


def assess_readiness(parquet_bytes: bytes) -> dict:
    """Return a dict suitable for ReadinessRecord. Source never mutated."""
    table = pq.read_table(io.BytesIO(parquet_bytes))
    n = table.num_rows
    columns: dict[str, list] = {
        name: table.column(name).to_pylist() for name in table.column_names
    }
    items: list[dict] = []

    # --- anomaly: exact duplicate rows (snapshot level) ---
    rows = list(zip(*[columns[name] for name in table.column_names])) if n else []
    seen: set[tuple] = set()
    dup_indexes: list[int] = []
    for idx, row in enumerate(rows):
        key = tuple(str(v) if v is not None else "" for v in row)
        if key in seen:
            dup_indexes.append(idx)
        else:
            seen.add(key)
    dup_pct = _pct(len(dup_indexes), n)
    dup_status = "problem" if dup_pct > 5 else ("check" if dup_indexes else "ok")
    items.append(_item(
        "duplicate_rows", "anomaly", None, dup_status,
        (f"{len(dup_indexes)} baris duplikat eksak." if dup_indexes
         else "Tidak ada baris duplikat eksak."),
        len(dup_indexes), dup_pct,
        f"{len(dup_indexes)} dari {n} baris (seluruh kolom sama)",
        dup_indexes,
    ))

    # --- per-column checks ---
    numeric_count = 0
    categorical_count = 0
    numeric_with_variance = 0
    worst_missing_pct = 0.0
    worst_missing_col = None

    for name in table.column_names:
        values = columns[name]
        present = [v for v in values if not _is_missing(v)]
        missing = n - len(present)
        missing_pct = _pct(missing, n)
        if missing_pct > worst_missing_pct:
            worst_missing_pct, worst_missing_col = missing_pct, name
        raw = [str(v) for v in present]
        distinct = len(set(raw))

        # constant column
        if distinct == 1 and present:
            items.append(_item(
                "constant_column", "modeling", name, "check",
                f"Kolom '{name}' hanya memiliki satu nilai: '{raw[0]}'.",
                len(present), _pct(len(present), n),
                f"1 nilai unik ('{raw[0]}') pada {len(present)} baris",
            ))
        else:
            items.append(_item(
                "constant_column", "modeling", name, "ok",
                f"Kolom '{name}': {distinct} nilai unik.",
                0, 0.0, f"{distinct} nilai unik",
            ))

        numeric = _numeric_values(values)
        if numeric is None:
            categorical_count += 1
            # high-cardinality (categorical only): ID-like columns
            ratio = (distinct / len(present)) if present else 0.0
            if len(present) >= 10 and ratio > 0.9:
                items.append(_item(
                    "high_cardinality", "modeling", name, "check",
                    f"Kolom '{name}': {distinct} nilai unik pada {len(present)} baris — berisiko ID-like.",
                    distinct, _pct(distinct, len(present)),
                    f"rasio unik {round(ratio, 2)}",
                ))
            else:
                items.append(_item(
                    "high_cardinality", "modeling", name, "ok",
                    f"Kolom '{name}': kardinalitas wajar ({distinct} nilai unik).",
                    0, 0.0, f"{distinct} nilai unik dari {len(present)} baris",
                ))
            continue

        numeric_count += 1
        mean = sum(numeric) / len(numeric) if numeric else 0.0
        variance = (sum((v - mean) ** 2 for v in numeric) / len(numeric)) if numeric else 0.0
        if variance > 0:
            numeric_with_variance += 1

        # anomaly: IQR outliers
        sorted_v = sorted(numeric)
        q1 = _quantile(sorted_v, 0.25)
        q3 = _quantile(sorted_v, 0.75)
        iqr = q3 - q1
        low = q1 - 1.5 * iqr
        high = q3 + 1.5 * iqr
        # row indexes across the whole column (missing values never numeric)
        out_indexes = [
            i for i, v in enumerate(values)
            if not _is_missing(v) and (float(str(v)) < low or float(str(v)) > high)
        ]
        out_pct = _pct(len(out_indexes), len(numeric))
        out_status = "problem" if out_pct > 5 else ("check" if out_indexes else "ok")
        items.append(_item(
            "iqr_outliers", "anomaly", name, out_status,
            (f"Kolom '{name}': {len(out_indexes)} outlier di luar 1.5xIQR."
             if out_indexes else f"Kolom '{name}': tidak ada outlier."),
            len(out_indexes), out_pct,
            f"IQR {q1:.4g}–{q3:.4g}, pagar {low:.4g}–{high:.4g} "
            f"({len(out_indexes)} dari {len(numeric)} nilai)",
            out_indexes,
        ))

        # anomaly: skewness
        g1 = _skewness(numeric)
        abs_g1 = abs(g1)
        if variance == 0 or len(numeric) < 3:
            items.append(_item(
                "skewness", "anomaly", name, "ok",
                f"Kolom '{name}': skewness dilewati (konstan atau terlalu sedikit nilai).",
                0, 0.0, "dilewati: variansi nol atau n < 3",
            ))
        else:
            skew_status = "problem" if abs_g1 > 2 else ("check" if abs_g1 > 1 else "ok")
            items.append(_item(
                "skewness", "anomaly", name, skew_status,
                (f"Kolom '{name}': skewness {round(g1, 2)} — distribusi miring."
                 if skew_status != "ok" else f"Kolom '{name}': skewness {round(g1, 2)}."),
                0, 0.0, f"g1 = {round(g1, 4)}",
            ))

    # --- modeling: row sufficiency (snapshot level) ---
    if n < 30:
        row_status = "problem"
    elif n < 100:
        row_status = "check"
    else:
        row_status = "ok"
    items.append(_item(
        "row_count_sufficiency", "modeling", None, row_status,
        (f"Hanya {n} baris — terlalu sedikit untuk modeling yang andal."
         if row_status == "problem"
         else f"{n} baris — jumlah terbatas untuk modeling."
         if row_status == "check" else f"{n} baris — jumlah cukup untuk modeling."),
        n, 0.0, "ambang: <30 problem, <100 check",
    ))

    # --- modeling: plausible numeric target candidate ---
    if numeric_with_variance == 0:
        target_status = "problem"
    elif numeric_with_variance == 1:
        target_status = "check"
    else:
        target_status = "ok"
    items.append(_item(
        "numeric_target_candidate", "modeling", None, target_status,
        ("Tidak ada kolom numerik bervariasi sebagai kandidat target."
         if target_status == "problem"
         else "Hanya 1 kolom numerik bervariasi sebagai kandidat target."
         if target_status == "check"
         else f"{numeric_with_variance} kolom numerik bervariasi sebagai kandidat target."),
        numeric_with_variance, 0.0,
        f"{numeric_with_variance} dari {numeric_count} kolom numerik",
    ))

    # --- modeling: worst-column missingness (snapshot level) ---
    miss_status = "problem" if worst_missing_pct > 30 else ("check" if worst_missing_pct > 0 else "ok")
    worst_detail = (f"kolom terburuk '{worst_missing_col}' {worst_missing_pct}%"
                    if worst_missing_col is not None else "tidak ada kolom")
    items.append(_item(
        "missingness", "modeling", worst_missing_col, miss_status,
        (f"Kolom '{worst_missing_col}' hilang {worst_missing_pct}%."
         if worst_missing_col is not None and worst_missing_pct > 0
         else "Tidak ada nilai hilang."),
        0, worst_missing_pct, worst_detail,
    ))

    total = len(items)
    ok = sum(1 for i in items if i["status"] == "ok")
    check = sum(1 for i in items if i["status"] == "check")
    problem = sum(1 for i in items if i["status"] == "problem")
    score = round(100 * (ok + 0.5 * check) / total) if total else 100
    summary = f"{problem} Masalah, {check} Perlu perhatian, {ok} OK — skor kesiapan {score}/100"
    return {
        "row_count": n,
        "column_count": len(table.column_names),
        "numeric_count": numeric_count,
        "categorical_count": categorical_count,
        "items": items,
        "ok_count": ok,
        "check_count": check,
        "problem_count": problem,
        "score": score,
        "summary": summary,
    }
