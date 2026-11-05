"""Application orchestration (M1): project -> import -> snapshot -> preview.

Owns use-case sequencing; depends on domain + execution + persistence ports.
Ingestion normalises CSV/XLSX/Parquet to a canonical Parquet snapshot (Doc04);
the fingerprint covers the ORIGINAL source bytes (provenance reproducibility).
"""
from __future__ import annotations

from backend.contracts import (
    ColumnProfile,
    DatasetRecord,
    PreviewRecord,
    ProfileRecord,
    ProjectRecord,
)
from backend.domain import Dataset, Project, Snapshot, fingerprint_bytes, new_id
from backend.execution import JobManager
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

    def get_profile(self, project_id: str, dataset_id: str) -> ProfileRecord:
        """M2 slice: univariate descriptives from the immutable snapshot.

        Slice simplification: runs synchronously as a query; wrapping in a
        JobManager job (Created->...->Completed) is a G6 follow-up, recorded
        in the QA/profiling contracts.
        """
        dataset = self.store.get_dataset(dataset_id)
        if dataset is None or dataset.project_id != project_id:
            raise NotFoundError(f"dataset not found: {dataset_id}")
        row_count, cols = profile_table(
            self.store.read_snapshot(dataset.snapshot.snapshot_id))
        return ProfileRecord(
            dataset_id=dataset_id,
            snapshot_id=dataset.snapshot.snapshot_id,
            fingerprint=dataset.snapshot.fingerprint,
            row_count=row_count,
            column_count=len(cols),
            columns=[ColumnProfile(**c) for c in cols],
        )
