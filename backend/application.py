"""Application orchestration (M1): project -> import -> snapshot -> preview.

This layer owns use-case sequencing and depends on domain + execution +
persistence ports. It knows nothing about IPC envelopes or the UI.
"""
from __future__ import annotations

import csv
import io
from pathlib import Path

from backend.contracts import DatasetRecord, PreviewRecord, ProjectRecord
from backend.domain import Dataset, Project, Snapshot, fingerprint_bytes, new_id
from backend.execution import JobManager
from backend.persistence import Store


class NotFoundError(LookupError):
    pass


class UnsupportedFormatError(ValueError):
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
        """Import CSV into an immutable snapshot. Parquet/Excel adapters plug
        in here in M1-next; the storage port does not change."""
        if self.store.get_project(project_id) is None:
            raise NotFoundError(f"project not found: {project_id}")
        path = Path(source_path)
        if path.suffix.lower() != ".csv":
            raise UnsupportedFormatError(
                "M1 supports .csv only; .parquet/.xlsx adapters are M1-next"
            )
        data = path.read_bytes()
        text = data.decode("utf-8-sig")
        rows = list(csv.DictReader(io.StringIO(text)))
        columns = list(rows[0].keys()) if rows else []
        snapshot_id = new_id()
        self.store.save_snapshot(snapshot_id, data)
        dataset = Dataset(
            dataset_id=new_id(),
            project_id=project_id,
            name=dataset_name,
            snapshot=Snapshot(snapshot_id, fingerprint_bytes(data), len(rows), tuple(columns)),
            _rows=tuple(rows),
        )
        self.store.save_dataset(dataset)
        return DatasetRecord(
            dataset_id=dataset.dataset_id, project_id=project_id, name=dataset_name,
            snapshot_id=snapshot_id, fingerprint=dataset.snapshot.fingerprint,
            row_count=len(rows), columns=columns,
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
        raw = self.store.read_snapshot(dataset.snapshot.snapshot_id)
        rows = list(csv.DictReader(io.StringIO(raw.decode("utf-8-sig"))))
        preview = rows[:limit]
        return PreviewRecord(
            dataset_id=dataset_id,
            columns=list(dataset.snapshot.columns),
            rows=preview,
            total_rows=len(rows),
            truncated=len(rows) > len(preview),
        )
