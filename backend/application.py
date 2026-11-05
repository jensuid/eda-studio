"""Application orchestration (M1): project -> import -> snapshot -> preview.

Owns use-case sequencing; depends on domain + execution + persistence ports.
Ingestion normalises CSV/XLSX/Parquet to a canonical Parquet snapshot (Doc04);
the fingerprint covers the ORIGINAL source bytes (provenance reproducibility).
"""
from __future__ import annotations

from backend.contracts import (
    ColumnProfile,
    DatasetRecord,
    HistogramBin,
    HistogramRecord,
    PreviewRecord,
    ProfileListRecord,
    ProfileRecord,
    ProfileSummary,
    ProjectRecord,
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

__all__ = ["NotFoundError", "UnsupportedFormatError", "WorkbenchService"]


class NotFoundError(LookupError):
    pass


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
