"""Deterministic Quality Rules Engine (M2, JOB-QUAL-001 / SCREEN-QUAL-001).

Four rules, evidence-backed, never modifies source data (Doc03 §4.3):

- completeness (per column): missing % per column.
- duplicates (per snapshot): exact duplicate rows (all columns equal).
- constant (per column): distinct == 1 among non-missing values.
- outliers (per numeric column): outside 1.5xIQR.

Severity (Q2, PO-ratified 2026-11-05; 30% aligns with the profiling
threshold which itself remains PROPOSED):
  completeness: missing_pct > 30 -> problem, > 0 -> check, 0 -> ok
  duplicates:   count > 0 -> check, 0 -> ok
  constant:     -> check always (when triggered)
  outliers:     count > 0 -> check, 0 -> ok

Non-numeric columns skip the outliers rule with an explanation instead of
erroring (FLOW-QUAL-001 partial branch).
"""
from __future__ import annotations

import io

import pyarrow.parquet as pq

from backend.histograms import _quantile
from backend.profiling import _is_missing


def _pct(part: int, total: int) -> float:
    return round((part / total * 100) if total else 0.0, 2)


def assess_quality(parquet_bytes: bytes) -> tuple[int, list[dict]]:
    """Return (row_count, findings) where each finding is a dict suitable
    for QualityFindingRecord. Source snapshot is never mutated."""
    table = pq.read_table(io.BytesIO(parquet_bytes))
    n = table.num_rows
    columns: dict[str, list] = {
        name: table.column(name).to_pylist() for name in table.column_names
    }
    findings: list[dict] = []

    # duplicates (snapshot level)
    rows = list(zip(*[columns[name] for name in table.column_names])) if n else []
    seen: set[tuple] = set()
    dup_count = 0
    for row in rows:
        key = tuple(str(v) if v is not None else "" for v in row)
        if key in seen:
            dup_count += 1
        else:
            seen.add(key)
    findings.append({
        "rule_id": "duplicates",
        "column_name": None,
        "severity": "check" if dup_count > 0 else "ok",
        "message": (
            f"{dup_count} baris duplikat eksak."
            if dup_count > 0 else "Tidak ada baris duplikat eksak."
        ),
        "evidence_count": dup_count,
        "evidence_pct": _pct(dup_count, n),
        "evidence_detail": f"{dup_count} dari {n} baris (seluruh kolom sama)",
    })

    for name in table.column_names:
        values = columns[name]
        present = [v for v in values if not _is_missing(v)]
        missing = n - len(present)
        missing_pct = _pct(missing, n)
        raw = [str(v) for v in present]
        distinct = len(set(raw))

        # completeness
        severity = "problem" if missing_pct > 30 else ("check" if missing > 0 else "ok")
        findings.append({
            "rule_id": "completeness",
            "column_name": name,
            "severity": severity,
            "message": (
                f"Kolom '{name}': {missing_pct}% nilai hilang ({missing} dari {n} baris)."
            ),
            "evidence_count": missing,
            "evidence_pct": missing_pct,
            "evidence_detail": f"missing {missing}/{n} baris",
        })

        # constant
        if distinct == 1 and present:
            only = raw[0]
            findings.append({
                "rule_id": "constant",
                "column_name": name,
                "severity": "check",
                "message": f"Kolom '{name}' hanya memiliki satu nilai: '{only}'.",
                "evidence_count": len(present),
                "evidence_pct": _pct(len(present), n),
                "evidence_detail": f"1 nilai unik ('{only}') pada {len(present)} baris",
            })
        else:
            findings.append({
                "rule_id": "constant",
                "column_name": name,
                "severity": "ok",
                "message": f"Kolom '{name}': {distinct} nilai unik.",
                "evidence_count": 0,
                "evidence_pct": _pct(0, n),
                "evidence_detail": f"{distinct} nilai unik",
            })

        # outliers (numeric only; otherwise skipped with explanation)
        numeric: list[float] = []
        all_num = bool(present)
        for v in present:
            try:
                numeric.append(float(str(v)))
            except (TypeError, ValueError):
                all_num = False
                break
        if not all_num:
            findings.append({
                "rule_id": "outliers",
                "column_name": name,
                "severity": "ok",
                "message": f"Kolom '{name}': aturan outliers dilewati (non-numerik).",
                "evidence_count": 0,
                "evidence_pct": 0.0,
                "evidence_detail": "dilewati: kolom non-numerik",
            })
            continue
        sorted_v = sorted(numeric)
        q1 = _quantile(sorted_v, 0.25)
        q3 = _quantile(sorted_v, 0.75)
        iqr = q3 - q1
        low = q1 - 1.5 * iqr
        high = q3 + 1.5 * iqr
        out_count = sum(1 for v in numeric if v < low or v > high)
        findings.append({
            "rule_id": "outliers",
            "column_name": name,
            "severity": "check" if out_count > 0 else "ok",
            "message": (
                f"Kolom '{name}': {out_count} outlier di luar 1.5xIQR."
                if out_count > 0 else f"Kolom '{name}': tidak ada outlier."
            ),
            "evidence_count": out_count,
            "evidence_pct": _pct(out_count, len(numeric)),
            "evidence_detail": (
                f"IQR {q1:.4g}–{q3:.4g}, pagar {low:.4g}–{high:.4g} "
                f"({out_count} dari {len(numeric)} nilai)"
            ),
        })

    return n, findings


def summarise(findings: list[dict]) -> tuple[int, int, int, str]:
    """(ok, check, problem, summary text) — summary is plain text (DS-QUAL-001)."""
    ok = sum(1 for f in findings if f["severity"] == "ok")
    check = sum(1 for f in findings if f["severity"] == "check")
    problem = sum(1 for f in findings if f["severity"] == "problem")
    summary = f"{problem} Masalah, {check} Perlu perhatian, {ok} OK"
    return ok, check, problem, summary
