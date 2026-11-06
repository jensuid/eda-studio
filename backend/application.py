"""Application orchestration (M1): project -> import -> snapshot -> preview.

Owns use-case sequencing; depends on domain + execution + persistence ports.
Ingestion normalises CSV/XLSX/Parquet to a canonical Parquet snapshot (Doc04);
the fingerprint covers the ORIGINAL source bytes (provenance reproducibility).
"""
from __future__ import annotations

from datetime import timezone
from typing import Any

UTC = timezone.utc  # noqa: UP017 -- runtime venv is Python 3.9 (datetime.UTC needs 3.11+)

from backend.cleaning import (
    CleaningNotFoundError,
    CleaningValidationError,
    apply_cleaning,
    preview_cleaning,
)
from backend.contracts import (
    CleaningColumnImpact,
    CleaningOperation,
    CleaningPreviewPayload,
    CleaningPreviewSummary,
    CleaningRecord,
    CleaningStrategy,
    ColumnProfile,
    DatasetRecord,
    HistogramBin,
    HistogramRecord,
    PreviewRecord,
    ProfileListRecord,
    ProfileRecord,
    ProfileSummary,
    ProjectRecord,
    QualityFindingRecord,
    QualityRecord,
    SnapshotInfo,
    SnapshotListRecord,
)
from backend.domain import Dataset, Project, Snapshot, fingerprint_bytes, new_id
from backend.execution import JobManager
from backend.histograms import describe_column
from backend.ingestion import (
    UnsupportedFormatError,
    preview_rows,
    read_source,
    to_parquet_bytes,
)
from backend.persistence import Store
from backend.profiling import profile_table
from backend.quality import assess_quality, summarise

__all__ = ["ConflictError", "NotFoundError", "UnsupportedFormatError",
           "ValidationError", "WorkbenchService"]


class NotFoundError(LookupError):
    pass


def _cleaning_row(record: CleaningRecord) -> dict:
    return {
        "id": record.id,
        "project_id": record.project_id,
        "dataset_id": record.dataset_id,
        "created_at": record.created_at.isoformat(),
        "job_id": record.job_id,
        "parent_snapshot_id": record.parent_snapshot_id,
        "parent_fingerprint": record.parent_fingerprint,
        "child_snapshot_id": record.child_snapshot_id,
        "child_fingerprint": record.child_fingerprint,
        "operation": record.operation.value,
        "columns": list(record.columns),
        "strategy": record.strategy.value if record.strategy else None,
        "constant_value": record.constant_value,
        "row_count_before": record.row_count_before,
        "row_count_after": record.row_count_after,
        "affected_rows": record.affected_rows,
        "filled_rows": record.filled_rows,
    }


class ValidationError(ValueError):
    """Operation invalid for this snapshot (FLOW-CLEAN-001 F2/F4)."""


class ConflictError(ValueError):
    """Optimistic-concurrency failure (expected_parent_fingerprint stale)."""


class WorkbenchService:
    def __init__(self, store: Store, jobs: JobManager) -> None:
        self.store = store
        self.jobs = jobs

    # -- commands ---------------------------------------------------------
    def create_project(self, name: str, project_id: str | None = None) -> ProjectRecord:
        project = Project(project_id or new_id(), name)
        self.store.save_project(project)
        return ProjectRecord(project_id=project.project_id, name=project.name)

    def import_dataset(self, project_id: str, source_path: str, dataset_name: str) -> DatasetRecord:
        if self.store.get_project(project_id) is None:
            raise NotFoundError(f"project not found: {project_id}")
        table, source_bytes = read_source(source_path)
        snapshot_id = new_id()
        self.store.save_snapshot(snapshot_id, to_parquet_bytes(table))
        columns = tuple(table.column_names)
        dataset = Dataset(
            dataset_id=new_id(),
            project_id=project_id,
            name=dataset_name,
            snapshot=Snapshot(
                snapshot_id, fingerprint_bytes(source_bytes),
                table.num_rows, columns,
            ),
        )
        self.store.save_dataset(dataset)
        self.store.register_snapshot(
            snapshot_id, dataset.dataset_id,
            dataset.snapshot.fingerprint, dataset.snapshot.row_count,
            dataset.snapshot.columns,
        )
        return DatasetRecord(
            dataset_id=dataset.dataset_id, project_id=project_id, name=dataset_name,
            snapshot_id=snapshot_id, fingerprint=dataset.snapshot.fingerprint,
            row_count=table.num_rows, columns=list(columns),
        )

    # -- queries ----------------------------------------------------------
    def open_project(self, project_id: str) -> ProjectRecord:
        project = self.store.get_project(project_id)
        if project is None:
            raise NotFoundError(f"project not found: {project_id}")
        return ProjectRecord(project_id=project.project_id, name=project.name)

    def get_preview(self, project_id: str, dataset_id: str, limit: int = 20) -> PreviewRecord:
        dataset = self.store.get_dataset(dataset_id)
        if dataset is None or dataset.project_id != project_id:
            raise NotFoundError(f"dataset not found: {dataset_id}")
        columns, rows, total = preview_rows(
            self.store.read_snapshot(dataset.snapshot.snapshot_id), limit)
        return PreviewRecord(
            dataset_id=dataset_id, columns=columns, rows=rows,
            total_rows=total, truncated=total > len(rows),
        )

    def _compute_profile(self, dataset: Dataset) -> ProfileRecord:
        row_count, cols = profile_table(
            self.store.read_snapshot(dataset.snapshot.snapshot_id))
        return ProfileRecord(
            dataset_id=dataset.dataset_id,
            snapshot_id=dataset.snapshot.snapshot_id,
            fingerprint=dataset.snapshot.fingerprint,
            row_count=row_count,
            column_count=len(cols),
            columns=[ColumnProfile(**c) for c in cols],
        )

    def get_profile(self, project_id: str, dataset_id: str) -> ProfileRecord:
        """M2 slice: read-only compute (kept for backward compat + notes).
        G6 canonical path is `run_profile` (job-wrapped + persisted)."""
        dataset = self.store.get_dataset(dataset_id)
        if dataset is None or dataset.project_id != project_id:
            raise NotFoundError(f"dataset not found: {dataset_id}")
        return self._compute_profile(dataset)

    def run_profile(self, project_id: str, dataset_id: str,
                    correlation_id: str | None = None) -> ProfileRecord:
        """G6: profiling as a JobManager job (SYS-015), result persisted."""
        dataset = self.store.get_dataset(dataset_id)
        if dataset is None or dataset.project_id != project_id:
            raise NotFoundError(f"dataset not found: {dataset_id}")
        holder: dict[str, ProfileRecord] = {}

        def work() -> None:
            rec = self._compute_profile(dataset)
            profile_id = new_id()
            self.store.save_profile(
                profile_id, rec.dataset_id, rec.snapshot_id, rec.fingerprint,
                rec.row_count, rec.column_count,
                rec.model_dump_json(),
            )
            rec.profile_id = profile_id
            holder["rec"] = rec

        self.jobs.run("dataset.profile.run", work, correlation_id)
        return holder["rec"]

    def get_profile_by_id(self, project_id: str, profile_id: str) -> ProfileRecord:
        row = self.store.get_profile(profile_id)
        if row is None:
            raise NotFoundError(f"profile not found: {profile_id}")
        dataset = self.store.get_dataset(row["dataset_id"])
        if dataset is None or dataset.project_id != project_id:
            raise NotFoundError(f"profile not found: {profile_id}")
        rec = ProfileRecord.model_validate_json(row["columns_json"])
        rec.profile_id = row["profile_id"]
        return rec

    def list_profiles(self, project_id: str, dataset_id: str) -> ProfileListRecord:
        dataset = self.store.get_dataset(dataset_id)
        if dataset is None or dataset.project_id != project_id:
            raise NotFoundError(f"dataset not found: {dataset_id}")
        rows = self.store.list_profiles(dataset_id)
        return ProfileListRecord(profiles=[
            ProfileSummary(
                profile_id=r["profile_id"], dataset_id=r["dataset_id"],
                snapshot_id=r["snapshot_id"], fingerprint=r["fingerprint"],
                row_count=r["row_count"], column_count=r["column_count"],
            )
            for r in rows
        ])

    def run_histogram(self, project_id: str, dataset_id: str,
                      column_name: str, correlation_id: str | None = None) -> HistogramRecord:
        """SCREEN-HIST-001: descriptive histogram as a JobManager job (SYS-015)."""
        dataset = self.store.get_dataset(dataset_id)
        if dataset is None or dataset.project_id != project_id:
            raise NotFoundError(f"dataset not found: {dataset_id}")
        holder: dict[str, HistogramRecord] = {}

        def work() -> None:
            try:
                d = describe_column(
                    self.store.read_snapshot(dataset.snapshot.snapshot_id),
                    column_name)
            except LookupError as exc:
                raise NotFoundError(str(exc)) from exc
            holder["rec"] = HistogramRecord(
                dataset_id=dataset.dataset_id,
                snapshot_id=dataset.snapshot.snapshot_id,
                fingerprint=dataset.snapshot.fingerprint,
                column_name=column_name,
                inferred_type=d["inferred_type"],
                kind=d["kind"],
                bins=[HistogramBin(**b) for b in d["bins"]],
                bin_method=d["bin_method"],
                missing_pct=d["missing_pct"],
                min_value=d["min_value"],
                max_value=d["max_value"],
                mean_value=d["mean_value"],
                top_bin=d["top_bin"],
                value_count=d["value_count"],
            )

        self.jobs.run("dataset.histogram.run", work, correlation_id)
        return holder["rec"]

    def run_quality(self, project_id: str, dataset_id: str,
                    correlation_id: str | None = None) -> QualityRecord:
        """SCREEN-QUAL-001: deterministic quality assessment as a job (SYS-015).

        Read-only: assessment never modifies the snapshot (Doc03 §4.3).
        No persistence in this slice (Q5) — recompute is cheap.
        """
        dataset = self.store.get_dataset(dataset_id)
        if dataset is None or dataset.project_id != project_id:
            raise NotFoundError(f"dataset not found: {dataset_id}")
        holder: dict[str, QualityRecord] = {}

        def work() -> None:
            row_count, findings = assess_quality(
                self.store.read_snapshot(dataset.snapshot.snapshot_id))
            ok, check, problem, summary = summarise(findings)
            holder["rec"] = QualityRecord(
                dataset_id=dataset.dataset_id,
                snapshot_id=dataset.snapshot.snapshot_id,
                fingerprint=dataset.snapshot.fingerprint,
                row_count=row_count,
                findings=[QualityFindingRecord(**f) for f in findings],
                ok_count=ok,
                check_count=check,
                problem_count=problem,
                summary=summary,
            )

        self.jobs.run("dataset.quality.run", work, correlation_id)
        return holder["rec"]

    # -- cleaning commands/queries ----------------------------------------------------

    def cleaning_preview(self, payload: CleaningPreviewPayload) -> CleaningPreviewSummary:
        """M3 Cleaning G2: read-only impact preview (no snapshot/record/job)."""
        dataset = self.store.get_dataset(payload.dataset_id)
        if dataset is None or dataset.project_id != payload.project_id:
            raise NotFoundError(f"dataset not found: {payload.dataset_id}")
        try:
            summary = preview_cleaning(
                self.store.read_snapshot(dataset.snapshot.snapshot_id),
                payload.operation, payload.columns,
                payload.strategy, payload.constant_value,
            )
        except CleaningNotFoundError as exc:
            raise NotFoundError(str(exc)) from exc
        except CleaningValidationError as exc:
            raise ValidationError(str(exc)) from exc
        per_column = summary.get("per_column_affected")
        return CleaningPreviewSummary(
            operation=payload.operation,
            columns=payload.columns,
            parent_fingerprint=dataset.snapshot.fingerprint,
            row_count_before=summary["row_count_before"],
            row_count_after=summary["row_count_after"],
            affected_rows=summary["affected_rows"],
            affected_pct=summary["affected_pct"],
            per_column_affected=(
                [CleaningColumnImpact(**c) for c in per_column]
                if per_column is not None else None
            ),
            filled_rows=summary.get("filled_rows"),
        )

    def run_cleaning(self, project_id: str, dataset_id: str,
                     operation: CleaningOperation, columns: list[str],
                     strategy: CleaningStrategy | None = None,
                     constant_value: str | None = None,
                     expected_parent_fingerprint: str = "",
                     correlation_id: str | None = None) -> CleaningRecord:
        """M3 Cleaning G4: job-wrapped cleaning creating a child snapshot.

        Parent snapshot bytes are never mutated. The cleaning computation
        runs inside the JobManager lifecycle; the child snapshot registry
        row and the CleaningRecord (with the real job_id) are then written
        in a single DB transaction. A failure anywhere fails the job and
        no completed cleaning is recorded.
        """
        from datetime import datetime

        dataset = self.store.get_dataset(dataset_id)
        if dataset is None or dataset.project_id != project_id:
            raise NotFoundError(f"dataset not found: {dataset_id}")
        holder: dict[str, Any] = {}

        def work() -> None:
            # Optimistic concurrency: reject a stale parent (TOCTOU guard).
            if (expected_parent_fingerprint
                    != dataset.snapshot.fingerprint):
                raise ConflictError(
                    "Snapshot telah berubah. Hitung ulang dampak.")
            try:
                new_bytes, summary = apply_cleaning(
                    self.store.read_snapshot(dataset.snapshot.snapshot_id),
                    operation, columns, strategy, constant_value,
                )
            except CleaningNotFoundError as exc:
                raise NotFoundError(str(exc)) from exc
            except CleaningValidationError as exc:
                raise ValidationError(str(exc)) from exc
            if summary["row_count_after"] == 0:
                raise ValidationError(
                    "Hasil cleaning akan kosong (0 baris). Pilih kolom lain "
                    "atau batalkan.")
            holder["bytes"] = new_bytes
            holder["summary"] = summary
            holder["child_snapshot_id"] = new_id()
            holder["child_fingerprint"] = fingerprint_bytes(new_bytes)

        status = self.jobs.run("dataset.cleaning.run", work, correlation_id)
        summary = holder["summary"]
        rec = CleaningRecord(
            id=new_id(),
            project_id=project_id,
            dataset_id=dataset.dataset_id,
            created_at=datetime.now(UTC),
            job_id=status.job_id,
            parent_snapshot_id=dataset.snapshot.snapshot_id,
            parent_fingerprint=dataset.snapshot.fingerprint,
            child_snapshot_id=holder["child_snapshot_id"],
            child_fingerprint=holder["child_fingerprint"],
            operation=operation,
            columns=list(columns),
            strategy=strategy,
            constant_value=constant_value,
            row_count_before=summary["row_count_before"],
            row_count_after=summary["row_count_after"],
            affected_rows=summary["affected_rows"],
            filled_rows=summary.get("filled_rows"),
        )
        # Child snapshot + record in one DB transaction, inserted once.
        self.store.save_child_snapshot_with_cleaning(
            rec.child_snapshot_id, holder["bytes"], dataset.dataset_id,
            rec.child_fingerprint, summary["row_count_after"],
            dataset.snapshot.columns, _cleaning_row(rec),
        )
        return rec

    def activate_snapshot(self, project_id: str, dataset_id: str,
                          snapshot_id: str) -> DatasetRecord:
        """M3 Cleaning G4: make any snapshot of this dataset the active one."""
        dataset = self.store.get_dataset(dataset_id)
        if dataset is None or dataset.project_id != project_id:
            raise NotFoundError(f"dataset not found: {dataset_id}")
        snapshot = self.store.get_snapshot(snapshot_id)
        if snapshot is None or snapshot["dataset_id"] != dataset_id:
            raise NotFoundError(f"snapshot not found: {snapshot_id}")
        columns = snapshot["columns"]
        if isinstance(columns, str):
            import json as _json
            columns = tuple(_json.loads(columns))
        else:
            columns = tuple(columns)
        dataset.snapshot = Snapshot(
            snapshot["snapshot_id"], snapshot["fingerprint"],
            snapshot["row_count"], columns,
        )
        self.store.save_dataset(dataset)
        return DatasetRecord(
            dataset_id=dataset.dataset_id,
            project_id=dataset.project_id,
            name=dataset.name,
            snapshot_id=dataset.snapshot.snapshot_id,
            fingerprint=dataset.snapshot.fingerprint,
            row_count=dataset.snapshot.row_count,
            columns=list(dataset.snapshot.columns),
        )

    def list_snapshots(self, project_id: str) -> SnapshotListRecord:
        if self.store.get_project(project_id) is None:
            raise NotFoundError(f"project not found: {project_id}")
        rows = self.store.list_snapshots(project_id)
        return SnapshotListRecord(snapshots=[
            SnapshotInfo(
                snapshot_id=r["snapshot_id"], dataset_id=r["dataset_id"],
                dataset_name=r["name"], fingerprint=r["fingerprint"],
                row_count=r["row_count"],
            )
            for r in rows
        ])
