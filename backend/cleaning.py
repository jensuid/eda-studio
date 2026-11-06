"""Deterministic cleaning operations (M3, FLOW-CLEAN-001 / JOB-CLEAN-001).

Three ratified operations (C1), all producing a NEW snapshot — the source
snapshot is immutable and never mutated:

- drop_duplicates: snapshot-wide exact duplicate rows (same definition as
  quality.py: full-row equality, keep first occurrence).
- drop_missing: rows with a missing value in ANY of the selected columns
  (union, F3) + per-column breakdown.
- impute: fill missing cells of exactly ONE column with mean / median /
  mode / constant (F2 eligibility per column type; F4 constant validation).

`preview_cleaning` is a read-only dry run (no snapshot/record/job created);
`apply_cleaning` returns the cleaned Parquet bytes plus the same summary
numbers so preview and apply can never disagree.
"""
from __future__ import annotations

import io
from collections import Counter

import pyarrow as pa
import pyarrow.parquet as pq

from backend.contracts import CleaningOperation, CleaningStrategy
from backend.histograms import _quantile
from backend.ingestion import to_parquet_bytes
from backend.profiling import _is_missing


class CleaningValidationError(ValueError):
    """Operation/strategy/columns invalid for this snapshot (F2/F4)."""


class CleaningNotFoundError(LookupError):
    """Referenced column does not exist."""


def _pct(part: int, total: int) -> float:
    return round((part / total * 100) if total else 0.0, 2)


def _numeric_or_none(raw: list[str]) -> list[float] | None:
    """Parse all values as float; None when the column is not numeric."""
    out: list[float] = []
    for v in raw:
        try:
            out.append(float(v))
        except (TypeError, ValueError):
            return None
    return out


def _validate(
    table: pa.Table,
    operation: CleaningOperation,
    columns: list[str],
    strategy: CleaningStrategy | None,
    constant_value: str | None,
) -> None:
    """Eligibility rules F2/F4 + operation shape. Raises on violation."""
    available = set(table.column_names)
    unknown = [c for c in columns if c not in available]
    if unknown:
        raise CleaningNotFoundError(f"column not found: {unknown[0]}")
    if operation == CleaningOperation.DROP_MISSING:
        if not columns:
            raise CleaningValidationError(
                "drop_missing requires at least one column")
    elif operation == CleaningOperation.IMPUTE:
        if len(columns) != 1:
            raise CleaningValidationError(
                "impute requires exactly one column")
        if strategy is None:
            raise CleaningValidationError("impute requires a strategy")
        if strategy == CleaningStrategy.CONSTANT and constant_value is None:
            raise CleaningValidationError(
                "constant strategy requires constant_value")
        col = columns[0]
        present = [v for v in table.column(col).to_pylist()
                   if not _is_missing(v)]
        raw = [str(v) for v in present]
        numeric = _numeric_or_none(raw) if present else None
        if not present:  # empty column: only constant is eligible (F2)
            if strategy != CleaningStrategy.CONSTANT:
                raise CleaningValidationError(
                    f"strategy '{strategy.value}' is not available for an "
                    "empty column; only constant is eligible")
        elif strategy in (CleaningStrategy.MEAN, CleaningStrategy.MEDIAN):
            if numeric is None:
                raise CleaningValidationError(
                    f"strategy '{strategy.value}' requires a numeric column; "
                    f"'{col}' is categorical")
        elif strategy == CleaningStrategy.CONSTANT:
            # F4: constant must match the target column type.
            if numeric is not None:
                try:
                    float(str(constant_value))
                except (TypeError, ValueError):
                    raise CleaningValidationError(
                        f"constant '{constant_value}' is not a number for "
                        f"numeric column '{col}'") from None
            elif constant_value is None or not str(constant_value).strip():
                raise CleaningValidationError(
                    f"constant for categorical column '{col}' must be "
                    "non-empty")


def _load(parquet_bytes: bytes) -> tuple[pa.Table, dict[str, list]]:
    table = pq.read_table(io.BytesIO(parquet_bytes))
    columns: dict[str, list] = {
        name: table.column(name).to_pylist() for name in table.column_names
    }
    return table, columns


def _rows(table: pa.Table, columns: dict[str, list]) -> list[tuple]:
    if table.num_rows == 0:
        return []
    return list(zip(*[columns[name] for name in table.column_names]))


def _dup_key(row: tuple) -> tuple:
    return tuple(str(v) if v is not None else "" for v in row)


def _compute(
    table: pa.Table,
    columns_data: dict[str, list],
    operation: CleaningOperation,
    columns: list[str],
    strategy: CleaningStrategy | None,
    constant_value: str | None,
) -> tuple[dict, pa.Table | None]:
    """Return (summary, cleaned_table|None). None table = dry run only."""
    n = table.num_rows
    per_column: list[dict] | None = None
    filled: int | None = None

    if operation == CleaningOperation.DROP_DUPLICATES:
        rows = _rows(table, columns_data)
        seen: set[tuple] = set()
        keep = []
        for idx, row in enumerate(rows):
            key = _dup_key(row)
            if key not in seen:
                seen.add(key)
                keep.append(idx)
        affected = n - len(keep)
        cleaned = table.take(pa.array(keep)) if keep else table.slice(0, 0)
        summary = {"affected_rows": affected, "row_count_after": len(keep)}

    elif operation == CleaningOperation.DROP_MISSING:
        per_column = []
        doomed: set[int] = set()
        for col in columns:
            idxs = {i for i, v in enumerate(columns_data[col])
                    if _is_missing(v)}
            per_column.append({"column": col, "affected_rows": len(idxs)})
            doomed |= idxs
        keep = [i for i in range(n) if i not in doomed]
        affected = len(doomed)
        cleaned = table.take(pa.array(keep)) if keep else table.slice(0, 0)
        summary = {"affected_rows": affected, "row_count_after": len(keep),
                       "per_column_affected": per_column}

    else:  # IMPUTE
        col = columns[0]
        values = list(columns_data[col])
        present = [v for v in values if not _is_missing(v)]
        raw = [str(v) for v in present]
        numeric = _numeric_or_none(raw) if present else None
        if strategy == CleaningStrategy.MEAN:
            assert numeric is not None
            fill = str(round(sum(numeric) / len(numeric), 4))
        elif strategy == CleaningStrategy.MEDIAN:
            assert numeric is not None
            fill = str(round(_quantile(sorted(numeric), 0.5), 4))
        elif strategy == CleaningStrategy.MODE:
            fill = Counter(raw).most_common(1)[0][0]
        else:  # CONSTANT
            fill = str(constant_value)
        new_col = [fill if _is_missing(v) else v for v in values]
        filled = sum(1 for v in values if _is_missing(v))
        new_data = dict(columns_data)
        new_data[col] = new_col
        cleaned = pa.table(
            {name: pa.array(new_data[name]) for name in table.column_names},
            schema=pa.schema([(name, pa.string())
                              for name in table.column_names]),
        )
        summary = {"affected_rows": filled, "row_count_after": n,
                       "filled_rows": filled}

    summary.update(
        row_count_before=n,
        affected_pct=_pct(summary["affected_rows"], n),
    )
    return summary, cleaned


def preview_cleaning(
    parquet_bytes: bytes,
    operation: CleaningOperation,
    columns: list[str],
    strategy: CleaningStrategy | None = None,
    constant_value: str | None = None,
) -> dict:
    """Read-only impact summary; never builds or persists a snapshot."""
    table, columns_data = _load(parquet_bytes)
    _validate(table, operation, columns, strategy, constant_value)
    summary, _ = _compute(table, columns_data, operation, columns,
                          strategy, constant_value)
    return summary


def apply_cleaning(
    parquet_bytes: bytes,
    operation: CleaningOperation,
    columns: list[str],
    strategy: CleaningStrategy | None = None,
    constant_value: str | None = None,
) -> tuple[bytes, dict]:
    """Return (new Parquet bytes, summary). Source bytes are untouched."""
    table, columns_data = _load(parquet_bytes)
    _validate(table, operation, columns, strategy, constant_value)
    summary, cleaned = _compute(table, columns_data, operation, columns,
                                strategy, constant_value)
    assert cleaned is not None
    return to_parquet_bytes(cleaned), summary
