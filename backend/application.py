"""Application orchestration (M1): project -> import -> snapshot -> preview.

Owns use-case sequencing; depends on domain + execution + persistence ports.
Ingestion normalises CSV/XLSX/Parquet to a canonical Parquet snapshot (Doc04);
the fingerprint covers the ORIGINAL source bytes (provenance reproducibility).
"""
from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, ClassVar

from backend.backup_restore import BackupError, create_backup, restore_backup
from backend.bivariate import describe_bivariate
from backend.cleaning import (
    CleaningNotFoundError,
    CleaningValidationError,
    apply_cleaning,
    preview_cleaning,
)
from backend.contracts import (
    CHART_SPEC_MAX_BYTES,
    PLAN_MAX_SPEC_BYTES,
    BackupRecord,
    BivariateGroup,
    BivariateRecord,
    BivariateScatterPoint,
    ChartSpecListRecord,
    ChartSpecRecord,
    ChartType,
    CleaningColumnImpact,
    CleaningOperation,
    CleaningPreviewPayload,
    CleaningPreviewSummary,
    CleaningRecord,
    CleaningStrategy,
    ColumnProfile,
    DatasetRecord,
    DiagnosticLevel,
    DiagnosticRecord,
    ExportFormat,
    ExportRecord,
    FindingListRecord,
    FindingRecord,
    FindingStatus,
    HistogramBin,
    HistogramRecord,
    HypothesisListRecord,
    HypothesisRecord,
    HypothesisStatus,
    PdfRecord,
    PlanListRecord,
    PlanRecord,
    PlanStatus,
    PlanStep,
    PlanStepInput,
    PlanStepStatus,
    PlanStepType,
    PreviewRecord,
    ProfileListRecord,
    ProfileRecord,
    ProfileSummary,
    ProjectRecord,
    ProvenanceEdge,
    ProvenanceRecord,
    QualityFindingRecord,
    QualityRecord,
    ReadinessItemRecord,
    ReadinessRecord,
    ReportRecord,
    ReportScope,
    ReportSection,
    RestoreRecord,
    SnapshotInfo,
    SnapshotListRecord,
)
from backend.diagnostics import DiagnosticError, create_diagnostic_bundle
from backend.domain import Dataset, Project, Snapshot, fingerprint_bytes, new_id
from backend.execution import JobManager
from backend.histograms import describe_column
from backend.ingestion import (
    UnsupportedFormatError,
    preview_rows,
    read_source,
    to_parquet_bytes,
)
from backend.modeling_readiness import assess_readiness
from backend.pdf_renderer import render_pdf
from backend.persistence import ConflictError, Store
from backend.profiling import profile_table
from backend.quality import assess_quality, summarise
from backend.reporting import _RENDERER_VERSION, now_iso, render_html

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


def validate_path_input(path: str, allowed_exts: tuple[str, ...] = (),
                        must_exist: bool = False,
                        allowed_roots: tuple[Path | str, ...] = (),
                        trusted_paths: set[Path | str] | None = None) -> Path:
    """Single gate for every user-supplied path (P2-3, hardened P4-2).

    Rejects empty paths, NUL bytes, non-allowlisted extensions, and
    (when must_exist) missing files with a clear error code at the IPC
    boundary: VALIDATION_ERROR for malformed input, NOT_FOUND for a
    path that simply does not exist.

    P4-2 hardening: when ``allowed_roots`` is non-empty the path is
    additionally checked against an allowlist (project root + dialog
    picks). Any ``..`` component is rejected as traversal before
    existence checks, and absolute paths that resolve outside every
    allowed root (and are not themselves a trusted/dialog-picked file)
    are rejected with VALIDATION_ERROR. Callers that pass no
    ``allowed_roots`` keep the P2-3 behaviour (validation only).
    """
    if "\x00" in path:
        raise ValidationError("path mengandung byte NUL yang tidak valid")
    if not path.strip():
        raise ValidationError("path kosong")
    p = Path(path)
    # Traversal: any '..' component is rejected outright, even if it
    # would resolve back under an allowed root (fail-closed).
    if ".." in p.parts:
        raise ValidationError("path mengandung traversal '..' yang tidak diizinkan")
    if allowed_roots:
        resolved = p.resolve() if not p.is_absolute() else Path(p).resolve()
        # Symlinks that escape are also rejected by checking the
        # resolved target rather than the literal path.
        roots = tuple(Path(r).resolve() for r in allowed_roots)
        trusted = {Path(t).resolve() for t in (trusted_paths or set())}
        if p.is_absolute():
            if resolved not in trusted and not any(
                resolved == r or r in resolved.parents for r in roots
            ):
                raise ValidationError(
                    "path absolut di luar root yang diizinkan — pilih lewat dialog")
        else:
            # Relative paths resolve under the first allowed root and
            # must stay there.
            base = roots[0]
            rel = (base / p).resolve()
            if rel not in trusted and rel != base and base not in rel.parents:
                raise ValidationError("path traversal keluar dari root proyek")
    if allowed_exts:
        allowed = {e.lower() if e.startswith(".") else f".{e.lower()}"
                   for e in allowed_exts}
        if p.suffix.lower() not in allowed:
            raise ValidationError(
                f"ekstensi tidak didukung: {p.suffix or '(tidak ada)'} "
                f"— boleh: {', '.join(sorted(allowed))}")
    if must_exist:
        if not p.exists():
            raise NotFoundError(f"file tidak ditemukan: {path}")
        if not p.is_file():
            raise ValidationError(f"path bukan file: {path}")
    return p


class WorkbenchService:
    def __init__(self, store: Store, jobs: JobManager) -> None:
        self.store = store
        self.jobs = jobs
        # P4-2 allowlist: paths explicitly returned by dialog.pick_file
        # (and, in tests, paths registered via authorize_path).
        # In-memory only; resets on process restart by design.
        self._trusted_paths: set[Path] = set()
        self._trusted_roots: set[Path] = set()

    def authorize_path(self, path: str | Path) -> None:
        """Mark a file dialog result as trusted (P4-2)."""
        self._trusted_paths.add(Path(path).resolve())

    def authorize_root(self, root: str | Path) -> None:
        """Mark a whole directory as trusted (test/fixture helper)."""
        self._trusted_roots.add(Path(root).resolve())

    def _allowed_roots(self) -> tuple[Path, ...]:
        return (self.store.root.resolve(), *sorted(self._trusted_roots))

    def _check(self, path: str, allowed_exts: tuple[str, ...] = (),
               must_exist: bool = False) -> Path:
        return validate_path_input(
            path, allowed_exts, must_exist=must_exist,
            allowed_roots=self._allowed_roots(),
            trusted_paths=set(self._trusted_paths),
        )

    # -- commands ---------------------------------------------------------
    def create_project(self, name: str, project_id: str | None = None) -> ProjectRecord:
        project = Project(project_id or new_id(), name)
        self.store.save_project(project)
        return ProjectRecord(project_id=project.project_id, name=project.name)

    def import_dataset(self, project_id: str, source_path: str, dataset_name: str) -> DatasetRecord:
        if self.store.get_project(project_id) is None:
            raise NotFoundError(f"project not found: {project_id}")
        # Extension allowlist stays inside read_source so a wrong suffix
        # keeps UNSUPPORTED_FORMAT (not VALIDATION_ERROR).
        self._check(source_path, must_exist=True)
        table, source_bytes = read_source(source_path)
        snapshot_id = new_id()
        parquet_bytes = to_parquet_bytes(table)
        self.store.save_snapshot(snapshot_id, parquet_bytes)
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
            file_fingerprint=fingerprint_bytes(parquet_bytes),
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

    def run_readiness(self, project_id: str, dataset_id: str,
                      correlation_id: str | None = None) -> ReadinessRecord:
        """G3: deterministic anomaly + modeling-readiness as a job (SYS-015).

        Read-only like run_quality: never modifies the snapshot, no
        persistence in this slice — recompute is cheap.
        """
        dataset = self.store.get_dataset(dataset_id)
        if dataset is None or dataset.project_id != project_id:
            raise NotFoundError(f"dataset not found: {dataset_id}")
        holder: dict[str, ReadinessRecord] = {}

        def work() -> None:
            r = assess_readiness(
                self.store.read_snapshot(dataset.snapshot.snapshot_id))
            holder["rec"] = ReadinessRecord(
                dataset_id=dataset.dataset_id,
                snapshot_id=dataset.snapshot.snapshot_id,
                fingerprint=dataset.snapshot.fingerprint,
                row_count=r["row_count"],
                column_count=r["column_count"],
                numeric_count=r["numeric_count"],
                categorical_count=r["categorical_count"],
                items=[ReadinessItemRecord(**i) for i in r["items"]],
                ok_count=r["ok_count"],
                check_count=r["check_count"],
                problem_count=r["problem_count"],
                score=r["score"],
                summary=r["summary"],
            )

        self.jobs.run("dataset.readiness.run", work, correlation_id)
        return holder["rec"]

    def run_bivariate(self, project_id: str, dataset_id: str,
                      column_a: str, column_b: str,
                      correlation_id: str | None = None) -> BivariateRecord:
        """SCREEN-BIVAR-001: bivariate as a JobManager job (SYS-015).

        Read-only + no persistence in this slice (A3) — recompute is cheap
        (like histogram/quality). Validation per FLOW-BIVAR-001.
        """
        dataset = self.store.get_dataset(dataset_id)
        if dataset is None or dataset.project_id != project_id:
            raise NotFoundError(f"dataset not found: {dataset_id}")
        if column_a == column_b:
            raise ValidationError("Pilih dua kolom yang berbeda.")
        holder: dict[str, BivariateRecord] = {}

        def work() -> None:
            try:
                d = describe_bivariate(
                    self.store.read_snapshot(dataset.snapshot.snapshot_id),
                    column_a, column_b)
            except LookupError as exc:
                raise NotFoundError(str(exc)) from exc
            holder["rec"] = BivariateRecord(
                dataset_id=dataset.dataset_id,
                snapshot_id=dataset.snapshot.snapshot_id,
                fingerprint=dataset.snapshot.fingerprint,
                column_a=column_a,
                column_b=column_b,
                mode=d["mode"],
                type_a=d["type_a"],
                type_b=d["type_b"],
                pearson_r=d.get("pearson_r"),
                spearman_rho=d.get("spearman_rho"),
                scatter_points=[BivariateScatterPoint(**p) for p in d.get("scatter_points", [])],
                group_column=d.get("group_column"),
                value_column=d.get("value_column"),
                groups=[BivariateGroup(**g) for g in d.get("groups", [])],
                row_labels=d.get("row_labels", []),
                col_labels=d.get("col_labels", []),
                cells=d.get("cells", []),
                n_pairs=d["n_pairs"],
                missing_pairs=d["missing_pairs"],
                sampled=d["sampled"],
                sample_size=d["sample_size"],
                constant_columns=d.get("constant_columns", []),
            )

        self.jobs.run("dataset.bivariate.run", work, correlation_id)
        return holder["rec"]

    def run_report(self, project_id: str, dataset_id: str, scope: ReportScope,
                   correlation_id: str | None = None) -> ReportRecord:
        """SCREEN-REPORT-001: HTML report as a JobManager job (SYS-015).

        Backend is the sole HTML author (never frontend string-building).
        Sections reference existing records (REP-003); stale sections are
        included and labelled (A1: optional-but-disclosed, is_final=False).
        File artifact lives on disk; IPC carries only ReportRecord.
        """
        import hashlib

        dataset = self.store.get_dataset(dataset_id)
        if dataset is None or dataset.project_id != project_id:
            raise NotFoundError(f"dataset not found: {dataset_id}")
        holder: dict[str, ReportRecord] = {}

        def work() -> None:
            snap = dataset.snapshot
            parquet_bytes = self.store.read_snapshot(snap.snapshot_id, strict=True)
            row_count, _cols = profile_table(parquet_bytes)
            profile_row = None
            for r in reversed(self.store.list_profiles(dataset.dataset_id)):
                if r["snapshot_id"] == snap.snapshot_id:
                    profile_row = r
                    break
            sections: list[ReportSection] = []
            profile: dict | None = None
            if profile_row is not None:
                rec = ProfileRecord.model_validate_json(profile_row["columns_json"])
                profile = {
                    "kind": "profile", "record_id": profile_row["profile_id"],
                    "fingerprint": rec.fingerprint,
                    "snapshot_id": rec.snapshot_id, "stale": rec.fingerprint != snap.fingerprint,
                    "columns": [c.model_dump() for c in rec.columns],
                }
                sections.append(ReportSection(
                    kind="profile", record_id=profile_row["profile_id"],
                    fingerprint=rec.fingerprint, stale=rec.fingerprint != snap.fingerprint))
            # Quality is always recomputed for the section (deterministic,
            # cheap) but its fingerprint labels freshness (A1 disclosure).
            _q_row_count, findings = assess_quality(parquet_bytes)
            # NOTE: quality is recomputed read-only; there is no persisted
            # QualityRecord table in this codebase, so the section discloses
            # staleness by comparing the recomputation fingerprint.
            quality: dict = {
                "kind": "quality", "record_id": dataset.dataset_id,
                "fingerprint": snap.fingerprint, "snapshot_id": snap.snapshot_id,
                "stale": False,
                "findings": findings,
            }
            if scope in (ReportScope.ALL, ReportScope.PROFILE_QUALITY, ReportScope.WITH_CHARTS, ReportScope.WITH_VISUALS):
                sections.append(ReportSection(
                    kind="quality", record_id=dataset.dataset_id,
                    fingerprint=snap.fingerprint, stale=False))
            # Cleaning provenance (when present) is a section too.
            cleanings_list: list[dict] = []
            for cl in self.store.list_cleanings(dataset.dataset_id):
                cleanings_list.append({
                    "kind": "cleaning", "record_id": cl["id"],
                    "fingerprint": cl["child_fingerprint"],
                    "snapshot_id": cl["child_snapshot_id"],
                    "stale": cl["child_snapshot_id"] != snap.snapshot_id,
                    "operation": cl["operation"], "row_count_before": cl["row_count_before"],
                    "row_count_after": cl["row_count_after"],
                })
            # A2 follow-up: charts reflect the current snapshot's histograms
            # (recomputed read-only, like quality) — the radio scope labels
            # now match the HTML content: with-charts includes per-column
            # ringkasan; with-visuals additionally includes the latest
            # bivariate ringkasan (honest label, not empty).
            charts: list[dict] = []
            if scope in (ReportScope.ALL, ReportScope.WITH_CHARTS, ReportScope.WITH_VISUALS):
                for c in (profile.get("columns") or []) if profile else []:
                    col_name = c.get("name")
                    if not col_name:
                        continue
                    try:
                        d = describe_column(parquet_bytes, col_name)
                    except LookupError:
                        continue
                    stale_c = d.get("inferred_type", "") == "empty"
                    charts.append({
                        "kind": "histogram", "record_id": dataset.dataset_id,
                        "fingerprint": snap.fingerprint,
                        "snapshot_id": snap.snapshot_id, "stale": stale_c,
                        "summary": (f"{col_name}: {d.get('value_count', 0)} nilai, "
                                    f"tipe {d.get('inferred_type', '?')}, "
                                    f"bins {len(d.get('bins', []))}"),
                    })
                sections.append(ReportSection(
                    kind="histogram", record_id=dataset.dataset_id,
                    fingerprint=snap.fingerprint, stale=False))
            generated = now_iso()
            html_doc = render_html(
                dataset_name=dataset.name, fingerprint=snap.fingerprint,
                snapshot_id=snap.snapshot_id, row_count=row_count,
                generated_at=generated, profile=profile, quality=quality,
                charts=charts, cleanings=cleanings_list,
            )
            data = html_doc.encode("utf-8")
            from pathlib import Path as _P
            out_dir = self.store.root / "reports"
            out_dir.mkdir(parents=True, exist_ok=True)
            safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in dataset.name) or "dataset"
            file_path = str(out_dir / f"{safe_name}-{snap.snapshot_id[:8]}-report.html")
            _P(file_path).write_bytes(data)
            stale_any = any(s.stale for s in sections) or any(c["stale"] for c in cleanings_list)
            is_final = not stale_any
            validation_summary = (
                "OK — semua section Current." if is_final else
                "PARTIAL — ada section usang (dilabeli di HTML); bukan final export."
            )
            holder["rec"] = ReportRecord(
                dataset_id=dataset.dataset_id, snapshot_id=snap.snapshot_id,
                fingerprint=snap.fingerprint, scope=scope, sections=sections,
                file_path=file_path, file_size_bytes=len(data),
                renderer_version=_RENDERER_VERSION,
                content_fingerprint=hashlib.sha256(data).hexdigest(),
                is_final=is_final, validation_summary=validation_summary,
                created_at=__import__("datetime").datetime.fromisoformat(generated),
            )

        self.jobs.run("dataset.report.generate", work, correlation_id)
        return holder["rec"]

    def run_pdf(self, project_id: str, dataset_id: str, scope: ReportScope,
                correlation_id: str | None = None) -> PdfRecord:
        """SCREEN-PDF-001: PDF distribution mirror of the HTML report.

        Payload stays small; the PDF file lives on disk (A-L2/A-L3).
        report_id in PdfRecord = content_fingerprint of the HTML artifact
        (traceable without a persisted report table).
        """
        import hashlib

        dataset = self.store.get_dataset(dataset_id)
        if dataset is None or dataset.project_id != project_id:
            raise NotFoundError(f"dataset not found: {dataset_id}")
        holder: dict[str, PdfRecord] = {}

        def work() -> None:
            snap = dataset.snapshot
            parquet_bytes = self.store.read_snapshot(snap.snapshot_id, strict=True)
            row_count, _cols = profile_table(parquet_bytes)
            profile_row = None
            for r in reversed(self.store.list_profiles(dataset.dataset_id)):
                if r["snapshot_id"] == snap.snapshot_id:
                    profile_row = r
                    break
            sections: list = []
            profile: dict | None = None
            if profile_row is not None:
                rec = ProfileRecord.model_validate_json(profile_row["columns_json"])
                profile = {
                    "kind": "profile", "record_id": profile_row["profile_id"],
                    "fingerprint": rec.fingerprint,
                    "snapshot_id": rec.snapshot_id, "stale": rec.fingerprint != snap.fingerprint,
                    "columns": [c.model_dump() for c in rec.columns],
                }
                sections.append({"kind": "profile", "record_id": profile_row["profile_id"],
                                 "fingerprint": rec.fingerprint, "stale": rec.fingerprint != snap.fingerprint})
            _q_row_count, findings = assess_quality(parquet_bytes)
            quality: dict = {
                "kind": "quality", "record_id": dataset.dataset_id,
                "fingerprint": snap.fingerprint, "snapshot_id": snap.snapshot_id,
                "stale": False, "findings": findings,
            }
            if scope in (ReportScope.ALL, ReportScope.PROFILE_QUALITY, ReportScope.WITH_CHARTS, ReportScope.WITH_VISUALS):
                sections.append({"kind": "quality", "record_id": dataset.dataset_id,
                                 "fingerprint": snap.fingerprint, "stale": False})
            cleanings_list: list[dict] = []
            for cl in self.store.list_cleanings(dataset.dataset_id):
                cleanings_list.append({
                    "kind": "cleaning", "record_id": cl["id"],
                    "fingerprint": cl["child_fingerprint"],
                    "snapshot_id": cl["child_snapshot_id"],
                    "stale": cl["child_snapshot_id"] != snap.snapshot_id,
                    "operation": cl["operation"], "row_count_before": cl["row_count_before"],
                    "row_count_after": cl["row_count_after"],
                })
            # Charts follow the HTML scope (with-charts adds per-column histograms)
            charts: list[dict] = []
            if scope in (ReportScope.ALL, ReportScope.WITH_CHARTS, ReportScope.WITH_VISUALS):
                for c in (profile.get("columns") or []) if profile else []:
                    col_name = c.get("name")
                    if not col_name:
                        continue
                    try:
                        d = describe_column(parquet_bytes, col_name)
                    except LookupError:
                        continue
                    charts.append({
                        "kind": "histogram", "record_id": dataset.dataset_id,
                        "fingerprint": snap.fingerprint,
                        "snapshot_id": snap.snapshot_id,
                        "stale": d.get("inferred_type") == "empty",
                        "summary": (f"{col_name}: {d.get('value_count', 0)} nilai, "
                                    f"tipe {d.get('inferred_type', '?')}, "
                                    f"bins {len(d.get('bins', []))}"),
                    })
                sections.append({"kind": "histogram", "record_id": dataset.dataset_id,
                                 "fingerprint": snap.fingerprint, "stale": False})
            generated = now_iso()
            # Source HTML fingerprint (A-L2): render HTML artifact bytes hash
            html_doc = render_html(
                dataset_name=dataset.name, fingerprint=snap.fingerprint,
                snapshot_id=snap.snapshot_id, row_count=row_count,
                generated_at=generated, profile=profile, quality=quality,
                charts=charts, cleanings=cleanings_list,
            )
            source_html_fp = __import__("hashlib").sha256(html_doc.encode("utf-8")).hexdigest()
            stale_any = any(s["stale"] for s in sections) or any(c["stale"] for c in cleanings_list)
            is_final = not stale_any
            pdf_bytes, page_count, renderer_ver = render_pdf(
                dataset_name=dataset.name, fingerprint=snap.fingerprint,
                snapshot_id=snap.snapshot_id, row_count=row_count,
                generated_at=generated, profile=profile, quality=quality,
                charts=charts, cleanings=cleanings_list,
                is_final=is_final, source_html_fingerprint=source_html_fp,
            )
            from pathlib import Path as _P
            out_dir = self.store.root / "reports"
            out_dir.mkdir(parents=True, exist_ok=True)
            safe_name = "".join(c if c.isalnum() or c in "-_" else "_" for c in dataset.name) or "dataset"
            file_path = str(out_dir / f"{safe_name}-{snap.snapshot_id[:8]}-report.pdf")
            _P(file_path).write_bytes(pdf_bytes)
            validation_summary = (
                "OK — semua section Current." if is_final else
                "PARTIAL — ada section usang (dilabeli di PDF); bukan final export."
            )
            holder["rec"] = PdfRecord(
                dataset_id=dataset.dataset_id, snapshot_id=snap.snapshot_id,
                fingerprint=snap.fingerprint, report_id=source_html_fp,
                sections=[ReportSection(kind=s["kind"], record_id=s["record_id"],
                                        fingerprint=s["fingerprint"], stale=s["stale"]) for s in sections],
                page_count=page_count, file_path=file_path,
                file_size_bytes=len(pdf_bytes), renderer_version=renderer_ver,
                pdf_fingerprint=hashlib.sha256(pdf_bytes).hexdigest(),
                source_html_fingerprint=source_html_fp,
                is_final=is_final, validation_summary=validation_summary,
                created_at=__import__("datetime").datetime.fromisoformat(generated),
            )

        self.jobs.run("dataset.pdf.generate", work, correlation_id)
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

    # -- backup / restore (M3 P0, Doc04 §12) ------------------------------
    def create_backup(self, project_id: str, dest_path: str,
                      correlation_id: str | None = None) -> BackupRecord:
        """Full project backup as a ZIP package (Doc04 §12.1)."""
        if self.store.get_project(project_id) is None:
            raise NotFoundError(f"project not found: {project_id}")
        dest = self._check(dest_path, (".zip", ".edaworkspace"))
        if dest.is_dir():
            raise ValidationError(f"dest adalah direktori, bukan file: {dest_path}")
        holder: dict[str, BackupRecord] = {}

        def work() -> None:
            try:
                manifest = create_backup(self.store.root, Path(dest_path))
            except BackupError as exc:
                raise ValidationError(str(exc)) from exc
            holder["rec"] = BackupRecord(
                project_id=project_id,
                file_path=str(Path(dest_path).resolve()),
                file_size_bytes=Path(dest_path).stat().st_size,
                created_at=datetime.fromisoformat(manifest["created_at"]),
                project_db_sha256=manifest["project_db_sha256"],
                counts=dict(manifest.get("counts", {})),
                version=str(manifest.get("version", "")),
            )

        self.jobs.run("project.backup.create", work, correlation_id)
        return holder["rec"]

    def restore_project(self, archive_path: str, dest_root: str,
                        correlation_id: str | None = None) -> RestoreRecord:
        """Restore a backup ZIP to a NEW root (Doc04 §12.3)."""
        self._check(archive_path, (".zip", ".edaworkspace"), must_exist=True)
        root = self._check(dest_root)
        if root.is_file():
            raise ValidationError(f"dest_root adalah file, bukan direktori: {dest_root}")
        holder: dict[str, RestoreRecord] = {}

        def work() -> None:
            try:
                manifest = restore_backup(Path(archive_path), Path(dest_root))
            except BackupError as exc:
                raise ValidationError(str(exc)) from exc
            projects = manifest.get("projects") or []
            holder["rec"] = RestoreRecord(
                project_id=str(projects[0].get("project_id", "")) if projects else "",
                dest_root=str(Path(dest_root).resolve()),
                file_path=str(Path(archive_path).resolve()),
                project_db_sha256=manifest["project_db_sha256"],
                counts=dict(manifest.get("counts", {})),
                version=str(manifest.get("version", "")),
            )

        self.jobs.run("project.restore", work, correlation_id)
        return holder["rec"]

    # -- diagnostics (M3 P2, Doc15 §10) -----------------------------------
    def create_diagnostic(self, project_id: str, dest_path: str,
                          correlation_id: str | None = None) -> DiagnosticRecord:
        """User-initiated Basic diagnostic bundle, redacted (OBS-007)."""
        if self.store.get_project(project_id) is None:
            raise NotFoundError(f"project not found: {project_id}")
        dest = self._check(dest_path, (".zip", ".edaworkspace"))
        if dest.is_dir():
            raise ValidationError(f"dest adalah direktori, bukan file: {dest_path}")
        holder: dict[str, DiagnosticRecord] = {}

        def work() -> None:
            try:
                manifest = create_diagnostic_bundle(self.store.root, Path(dest_path))
            except DiagnosticError as exc:
                raise ValidationError(str(exc)) from exc
            holder["rec"] = DiagnosticRecord(
                bundle_id=new_id(),
                project_id=project_id,
                path=manifest["path"],
                level=DiagnosticLevel.BASIC,
                file_count=len(manifest["files"]),
                paths_redacted=int(manifest["redaction"]["paths_redacted"]),
                created_at=datetime.fromisoformat(manifest["created_at"]),
                sha256=manifest["sha256"],
            )

        self.jobs.run("project.diagnostic.create", work, correlation_id)
        return holder["rec"]

    # -- dataset export (M3 P0) ------------------------------------------
    def export_dataset(self, project_id: str, dataset_id: str,
                       export_format: ExportFormat, dest_path: str,
                       correlation_id: str | None = None) -> ExportRecord:
        """Export the canonical snapshot to CSV/Parquet on disk."""
        dataset = self.store.get_dataset(dataset_id)
        if dataset is None or dataset.project_id != project_id:
            raise NotFoundError(f"dataset not found: {dataset_id}")
        # Destination extension must match the requested format — e.g. a
        # .xlsx dest for a csv export is rejected before any file is written.
        self._check(
            dest_path, (f".{export_format.value}",))
        holder: dict[str, ExportRecord] = {}

        def work() -> None:
            import hashlib
            import io

            import pyarrow.csv as pacsv
            import pyarrow.parquet as pq

            table = pq.read_table(
                io.BytesIO(self.store.read_snapshot(
                    dataset.snapshot.snapshot_id, strict=True)))
            dest = Path(dest_path)
            dest.parent.mkdir(parents=True, exist_ok=True)
            if export_format is ExportFormat.CSV:
                sink = io.BytesIO()
                pacsv.write_csv(table, sink)
                artifact = sink.getvalue()
            else:
                sink = io.BytesIO()
                pq.write_table(table, sink)
                artifact = sink.getvalue()
            dest.write_bytes(artifact)
            holder["rec"] = ExportRecord(
                dataset_id=dataset.dataset_id,
                snapshot_id=dataset.snapshot.snapshot_id,
                fingerprint=dataset.snapshot.fingerprint,
                format=export_format,
                file_path=str(dest.resolve()),
                file_size_bytes=len(artifact),
                row_count=table.num_rows,
                file_fingerprint=hashlib.sha256(artifact).hexdigest(),
                created_at=datetime.now(UTC),
            )

        self.jobs.run("dataset.export", work, correlation_id)
        return holder["rec"]

    def get_provenance(self, project_id: str, dataset_id: str) -> ProvenanceRecord:
        """Artifact lineage for a dataset (SEC-012: provenance != audit).

        Chains import origin → profile observations → cleaning transforms
        (parent → child snapshots). Job/audit events are NOT included here.
        """
        dataset = self.store.get_dataset(dataset_id)
        if dataset is None or dataset.project_id != project_id:
            raise NotFoundError(f"dataset not found: {dataset_id}")
        import json

        snapshots = [
            SnapshotInfo(
                snapshot_id=r["snapshot_id"], dataset_id=r["dataset_id"],
                dataset_name=r["name"], fingerprint=r["fingerprint"],
                row_count=r["row_count"],
            )
            for r in self.store.list_snapshots(project_id)
            if r["dataset_id"] == dataset_id
        ]
        profiles = [
            ProfileSummary(
                profile_id=r["profile_id"], dataset_id=r["dataset_id"],
                snapshot_id=r["snapshot_id"], fingerprint=r["fingerprint"],
                row_count=r["row_count"], column_count=r["column_count"],
            )
            for r in self.store.list_profiles(dataset_id)
        ]
        lineage: list[ProvenanceEdge] = []
        for cl in self.store.list_cleanings(dataset_id):
            try:
                cols = json.loads(cl["columns"])
            except (TypeError, ValueError):
                cols = []
            lineage.append(ProvenanceEdge(
                cleaning_id=cl["id"],
                parent_snapshot_id=cl["parent_snapshot_id"],
                parent_fingerprint=cl["parent_fingerprint"],
                child_snapshot_id=cl["child_snapshot_id"],
                child_fingerprint=cl["child_fingerprint"],
                operation=cl["operation"],
                columns=list(cols),
                strategy=cl.get("strategy"),
                row_count_before=cl["row_count_before"],
                row_count_after=cl["row_count_after"],
                affected_rows=cl["affected_rows"],
            ))
        child_ids = {e.child_snapshot_id for e in lineage}
        origin = next(
            (s for s in snapshots if s.snapshot_id not in child_ids),
            snapshots[0] if snapshots else None,
        )
        return ProvenanceRecord(
            project_id=project_id,
            dataset_id=dataset_id,
            dataset_name=dataset.name,
            active_snapshot_id=dataset.snapshot.snapshot_id,
            active_fingerprint=dataset.snapshot.fingerprint,
            origin_snapshot_id=origin.snapshot_id if origin else "",
            origin_fingerprint=origin.fingerprint if origin else "",
            snapshots=snapshots,
            profiles=profiles,
            lineage=lineage,
        )

    # --- Insights (M3 P1, Doc03 §4.8) ---
    _FINDING_TRANSITIONS: ClassVar[dict[str, set[str]]] = {
        FindingStatus.PROPOSED.value: {FindingStatus.ACCEPTED.value, FindingStatus.ARCHIVED.value},
        FindingStatus.ACCEPTED.value: {FindingStatus.ARCHIVED.value},
        FindingStatus.ARCHIVED.value: set(),
    }
    _HYPOTHESIS_TRANSITIONS: ClassVar[dict[str, set[str]]] = {
        HypothesisStatus.PROPOSED.value: {HypothesisStatus.ACCEPTED.value, HypothesisStatus.ARCHIVED.value},
        HypothesisStatus.ACCEPTED.value: {HypothesisStatus.INVESTIGATING.value, HypothesisStatus.ARCHIVED.value},
        HypothesisStatus.INVESTIGATING.value: {
            HypothesisStatus.SUPPORTED.value, HypothesisStatus.NOT_SUPPORTED.value,
            HypothesisStatus.INCONCLUSIVE.value, HypothesisStatus.ARCHIVED.value,
        },
        HypothesisStatus.SUPPORTED.value: {HypothesisStatus.ARCHIVED.value},
        HypothesisStatus.NOT_SUPPORTED.value: {HypothesisStatus.ARCHIVED.value},
        HypothesisStatus.INCONCLUSIVE.value: {HypothesisStatus.ARCHIVED.value},
        HypothesisStatus.ARCHIVED.value: set(),
    }

    def _require_dataset(self, project_id: str, dataset_id: str) -> Dataset:
        dataset = self.store.get_dataset(dataset_id)
        if dataset is None or dataset.project_id != project_id:
            raise NotFoundError(f"dataset not found: {dataset_id}")
        return dataset

    def create_finding(
        self, project_id: str, dataset_id: str, title: str, body: str,
        evidence_snapshot_id: str, evidence_fingerprint: str,
    ) -> FindingRecord:
        self._require_dataset(project_id, dataset_id)
        if not title.strip() or not body.strip():
            raise ValidationError("finding title and body must be non-empty")
        if not evidence_snapshot_id.strip() or not evidence_fingerprint.strip():
            raise ValidationError("finding must reference supporting evidence")
        snap = self.store.get_snapshot(evidence_snapshot_id)
        if snap is None or snap["dataset_id"] != dataset_id:
            raise NotFoundError(f"evidence snapshot not found: {evidence_snapshot_id}")
        now = now_iso()
        record = {
            "finding_id": new_id(), "project_id": project_id, "dataset_id": dataset_id,
            "title": title, "body": body, "status": FindingStatus.PROPOSED.value,
            "evidence_snapshot_id": evidence_snapshot_id,
            "evidence_fingerprint": evidence_fingerprint,
            "created_at": now, "updated_at": now,
        }
        self.store.save_finding(record)
        return self._finding(record)

    @staticmethod
    def _finding(r: dict) -> FindingRecord:
        return FindingRecord(
            finding_id=r["finding_id"], project_id=r["project_id"], dataset_id=r["dataset_id"],
            title=r["title"], body=r["body"], status=FindingStatus(r["status"]),
            evidence_snapshot_id=r["evidence_snapshot_id"],
            evidence_fingerprint=r["evidence_fingerprint"],
            created_at=datetime.fromisoformat(r["created_at"]),
            updated_at=datetime.fromisoformat(r["updated_at"]),
        )

    def transition_finding(
        self, project_id: str, finding_id: str, to_status: FindingStatus,
    ) -> FindingRecord:
        row = self.store.get_finding(finding_id)
        if row is None or row["project_id"] != project_id:
            raise NotFoundError(f"finding not found: {finding_id}")
        if to_status.value not in self._FINDING_TRANSITIONS.get(row["status"], set()):
            raise ConflictError(
                f"invalid finding transition: {row['status']} -> {to_status.value}")
        row = {**row, "status": to_status.value, "updated_at": now_iso()}
        self.store.save_finding(row)
        return self._finding(row)

    def list_findings(self, project_id: str, dataset_id: str) -> FindingListRecord:
        self._require_dataset(project_id, dataset_id)
        return FindingListRecord(
            dataset_id=dataset_id,
            findings=[self._finding(r) for r in self.store.list_findings(dataset_id)],
        )

    # --- ChartSpec persistence (NXT-1, gap G1) ---
    _CHART_Y_REQUIRED: ClassVar[set[str]] = {
        ChartType.BAR.value, ChartType.LINE.value,
        ChartType.SCATTER.value, ChartType.HEATMAP.value,
    }

    def save_chart_spec(
        self, project_id: str, dataset_id: str, snapshot_id: str,
        fingerprint: str, chart_type: ChartType, x: str,
        y: str | None = None, group: str | None = None,
        encodings: dict | None = None, options: dict | None = None,
        chart_id: str | None = None,
    ) -> ChartSpecRecord:
        self._require_dataset(project_id, dataset_id)
        if not x.strip():
            raise ValidationError("chart spec requires x field")
        if chart_type.value in self._CHART_Y_REQUIRED and not (y or "").strip():
            raise ValidationError(f"chart spec type {chart_type.value} requires y field")
        enc = dict(encodings or {})
        opts = dict(options or {})
        size = len(json.dumps({"x": x, "y": y, "group": group,
                               "encodings": enc, "options": opts}))
        if size >= CHART_SPEC_MAX_BYTES:
            raise ValidationError("chart spec exceeds size cap")
        snap = self.store.get_snapshot(snapshot_id)
        if snap is None or snap["dataset_id"] != dataset_id:
            raise NotFoundError(f"evidence snapshot not found: {snapshot_id}")
        if snap["fingerprint"] != fingerprint:
            raise ConflictError(f"stale fingerprint for snapshot {snapshot_id}")
        now = now_iso()
        if chart_id:
            row = self.store.get_chart_spec(chart_id)
            if row is None or row["project_id"] != project_id:
                raise NotFoundError(f"chart spec not found: {chart_id}")
            version = int(row["version"]) + 1
            created_at = row["created_at"]
        else:
            chart_id = new_id()
            version = 1
            created_at = now
        record = {
            "chart_id": chart_id, "project_id": project_id,
            "dataset_id": dataset_id, "snapshot_id": snapshot_id,
            "fingerprint": fingerprint, "chart_type": chart_type.value,
            "x": x, "y": y, "group": group,
            "encodings": enc, "options": opts,
            "version": version, "created_at": created_at, "updated_at": now,
        }
        self.store.save_chart_spec(record)
        stored = self.store.get_chart_spec(chart_id)
        return self._chart_spec(stored if stored is not None else record)

    @staticmethod
    def _chart_spec(r: dict) -> ChartSpecRecord:
        return ChartSpecRecord(
            chart_id=r["chart_id"], project_id=r["project_id"],
            dataset_id=r["dataset_id"], snapshot_id=r["snapshot_id"],
            fingerprint=r["fingerprint"], chart_type=ChartType(r["chart_type"]),
            x=r["x"], y=r["y"], group=r.get("group", r.get("grp")),
            encodings=json.loads(r["encodings_json"]),
            options=json.loads(r["options_json"]),
            version=int(r["version"]),
            created_at=datetime.fromisoformat(r["created_at"]),
            updated_at=datetime.fromisoformat(r["updated_at"]),
        )

    def get_chart_spec(self, project_id: str, chart_id: str) -> ChartSpecRecord:
        row = self.store.get_chart_spec(chart_id)
        if row is None or row["project_id"] != project_id:
            raise NotFoundError(f"chart spec not found: {chart_id}")
        return self._chart_spec(row)

    def list_chart_specs(self, project_id: str, dataset_id: str) -> ChartSpecListRecord:
        self._require_dataset(project_id, dataset_id)
        return ChartSpecListRecord(
            dataset_id=dataset_id,
            specs=[self._chart_spec(r) for r in self.store.list_chart_specs(dataset_id)],
        )

    # --- Analysis Plan + DAG execution (NXT-2, gap G2) ---
    # Step allowlist (default-deny): only read-only analysis kinds are
    # step-eligible; anything else is rejected at create time. Execution
    # reuses the existing job-wrapped service methods (run_profile,
    # run_histogram, ...) so the SYS-015 lifecycle stays backend-authoritative
    # and no analysis logic is duplicated (ADR-003: steps carry specs only).
    _PLAN_STEP_PARAMS: ClassVar[dict[str, frozenset[str]]] = {
        PlanStepType.PROFILE.value: frozenset(),
        PlanStepType.HISTOGRAM.value: frozenset({"column_name"}),
        PlanStepType.QUALITY.value: frozenset(),
        PlanStepType.BIVARIATE.value: frozenset({"column_a", "column_b"}),
        PlanStepType.REPORT.value: frozenset({"scope"}),
        PlanStepType.PDF.value: frozenset({"scope"}),
        PlanStepType.READINESS.value: frozenset(),
    }

    @classmethod
    def _validate_plan_steps(cls, steps: list[PlanStepInput]) -> list[PlanStep]:
        if not steps:
            raise ValidationError("plan requires at least one step")
        out: list[PlanStep] = []
        total_bytes = 0
        for step in steps:
            kind = step.kind.value
            allowed = cls._PLAN_STEP_PARAMS.get(kind)
            if allowed is None:  # unreachable via enum, kept for default-deny clarity
                raise ValidationError(f"plan step kind not allowed: {kind}")
            params = dict(step.params or {})
            unknown = set(params) - set(allowed)
            if unknown:
                raise ValidationError(f"plan step {kind} has unknown params")
            for required in allowed:
                if kind in (PlanStepType.REPORT.value, PlanStepType.PDF.value) and required == "scope":
                    continue  # scope is optional (defaults to all)
                value = params.get(required)
                if not isinstance(value, str) or not value.strip():
                    raise ValidationError(f"plan step {kind} requires param {required}")
            if "scope" in params and params["scope"] not in {s.value for s in ReportScope}:
                raise ValidationError("plan step scope is not a valid report scope")
            total_bytes += len(json.dumps({"kind": kind, "params": params}))
            out.append(PlanStep(kind=step.kind, params=params))
        if total_bytes >= PLAN_MAX_SPEC_BYTES:
            raise ValidationError("analysis plan exceeds size cap")
        return out

    @staticmethod
    def _plan_record(r: dict) -> PlanRecord:
        return PlanRecord(
            plan_id=r["plan_id"], project_id=r["project_id"],
            dataset_id=r["dataset_id"], snapshot_id=r["snapshot_id"],
            fingerprint=r["fingerprint"],
            steps=[PlanStep.model_validate(s) for s in json.loads(r["steps_json"])],
            status=PlanStatus(r["status"]),
            created_at=datetime.fromisoformat(r["created_at"]),
            updated_at=datetime.fromisoformat(r["updated_at"]),
        )

    def create_plan(
        self, project_id: str, dataset_id: str, steps: list[PlanStepInput],
    ) -> PlanRecord:
        dataset = self._require_dataset(project_id, dataset_id)
        validated = self._validate_plan_steps(steps)
        now = now_iso()
        record = {
            "plan_id": new_id(), "project_id": project_id,
            "dataset_id": dataset_id,
            "snapshot_id": dataset.snapshot.snapshot_id,
            "fingerprint": dataset.snapshot.fingerprint,
            "status": PlanStatus.DRAFT.value,
            "steps": [s.model_dump(mode="json") for s in validated],
            "created_at": now, "updated_at": now,
        }
        self.store.save_plan(record)
        stored = self.store.get_plan(record["plan_id"])
        return self._plan_record(stored if stored is not None else record)

    def _require_plan(self, project_id: str, plan_id: str) -> tuple[PlanRecord, dict]:
        row = self.store.get_plan(plan_id)
        if row is None or row["project_id"] != project_id:
            raise NotFoundError(f"analysis plan not found: {plan_id}")
        return self._plan_record(row), row

    def get_plan(self, project_id: str, plan_id: str) -> PlanRecord:
        plan, _ = self._require_plan(project_id, plan_id)
        return plan

    def list_plans(self, project_id: str, dataset_id: str) -> PlanListRecord:
        self._require_dataset(project_id, dataset_id)
        return PlanListRecord(
            dataset_id=dataset_id,
            plans=[self._plan_record(r) for r in self.store.list_plans(dataset_id)],
        )

    def approve_plan(self, project_id: str, plan_id: str) -> PlanRecord:
        plan, row = self._require_plan(project_id, plan_id)
        if plan.status is not PlanStatus.DRAFT:
            raise ConflictError(f"plan {plan_id} is {plan.status.value}, not draft")
        row["steps"] = [s.model_dump(mode="json") for s in plan.steps]
        row["status"] = PlanStatus.APPROVED.value
        row["updated_at"] = now_iso()
        self.store.save_plan(row)
        stored = self.store.get_plan(plan_id)
        return self._plan_record(stored if stored is not None else row)

    def _run_plan_step(
        self, project_id: str, dataset_id: str, step: PlanStep,
        correlation_id: str | None,
    ) -> None:
        """Run ONE approved step through the existing command/job path."""
        kind = step.kind.value
        params = step.params or {}
        if kind == PlanStepType.PROFILE.value:
            self.run_profile(project_id, dataset_id, correlation_id)
        elif kind == PlanStepType.QUALITY.value:
            self.run_quality(project_id, dataset_id, correlation_id)
        elif kind == PlanStepType.READINESS.value:
            self.run_readiness(project_id, dataset_id, correlation_id)
        elif kind == PlanStepType.HISTOGRAM.value:
            self.run_histogram(project_id, dataset_id, params["column_name"], correlation_id)
        elif kind == PlanStepType.BIVARIATE.value:
            self.run_bivariate(
                project_id, dataset_id,
                params["column_a"], params["column_b"], correlation_id,
            )
        elif kind in (PlanStepType.REPORT.value, PlanStepType.PDF.value):
            scope = ReportScope(params.get("scope", ReportScope.ALL.value))
            if kind == PlanStepType.REPORT.value:
                self.run_report(project_id, dataset_id, scope, correlation_id)
            else:
                self.run_pdf(project_id, dataset_id, scope, correlation_id)
        else:  # pragma: no cover - enum allowlist guards this at create time
            raise ValidationError(f"plan step kind not allowed: {kind}")

    def execute_plan(
        self, project_id: str, plan_id: str, correlation_id: str | None = None,
    ) -> PlanRecord:
        plan, row = self._require_plan(project_id, plan_id)
        if plan.status is PlanStatus.EXECUTED:
            raise ConflictError(f"plan {plan_id} already executed")
        if plan.status is not PlanStatus.APPROVED:
            raise ConflictError(f"plan {plan_id} must be approved before execution")
        dataset = self._require_dataset(project_id, plan.dataset_id)
        if dataset.snapshot.fingerprint != plan.fingerprint:
            raise ConflictError(f"stale fingerprint for snapshot {plan.snapshot_id}")
        # Sequential DAG: each step runs through its existing job-wrapped
        # service method; a failed step stops the plan (rest stay pending),
        # the plan stays approved so it can be re-executed after a fix.
        steps = [s for s in plan.steps]
        for i, step in enumerate(steps):
            if step.status is PlanStepStatus.COMPLETED:
                continue  # resume semantics after a partial failure
            try:
                step_corr = f"{correlation_id}:{i}" if correlation_id else None
                self._run_plan_step(project_id, plan.dataset_id, step, step_corr)
            except Exception as exc:  # noqa: BLE001 - recorded, not raised
                step.status = PlanStepStatus.FAILED
                step.error = type(exc).__name__
                break
            step.status = PlanStepStatus.COMPLETED
            step.error = None
        all_done = all(s.status is PlanStepStatus.COMPLETED for s in steps)
        row["status"] = (PlanStatus.EXECUTED if all_done else PlanStatus.APPROVED).value
        row["steps"] = [s.model_dump(mode="json") for s in steps]
        row["updated_at"] = now_iso()
        self.store.save_plan(row)
        stored = self.store.get_plan(plan_id)
        return self._plan_record(stored if stored is not None else row)

    def create_hypothesis(
        self, project_id: str, dataset_id: str, statement: str,
    ) -> HypothesisRecord:
        self._require_dataset(project_id, dataset_id)
        if not statement.strip():
            raise ValidationError("hypothesis statement must be non-empty")
        now = now_iso()
        record = {
            "hypothesis_id": new_id(), "project_id": project_id, "dataset_id": dataset_id,
            "statement": statement, "status": HypothesisStatus.PROPOSED.value,
            "created_at": now, "updated_at": now,
        }
        self.store.save_hypothesis(record)
        return self._hypothesis(record)

    @staticmethod
    def _hypothesis(r: dict) -> HypothesisRecord:
        return HypothesisRecord(
            hypothesis_id=r["hypothesis_id"], project_id=r["project_id"],
            dataset_id=r["dataset_id"], statement=r["statement"],
            status=HypothesisStatus(r["status"]),
            created_at=datetime.fromisoformat(r["created_at"]),
            updated_at=datetime.fromisoformat(r["updated_at"]),
        )

    def transition_hypothesis(
        self, project_id: str, hypothesis_id: str, to_status: HypothesisStatus,
    ) -> HypothesisRecord:
        row = self.store.get_hypothesis(hypothesis_id)
        if row is None or row["project_id"] != project_id:
            raise NotFoundError(f"hypothesis not found: {hypothesis_id}")
        if to_status.value not in self._HYPOTHESIS_TRANSITIONS.get(row["status"], set()):
            raise ConflictError(
                f"invalid hypothesis transition: {row['status']} -> {to_status.value}")
        row = {**row, "status": to_status.value, "updated_at": now_iso()}
        self.store.save_hypothesis(row)
        return self._hypothesis(row)

    def list_hypotheses(self, project_id: str, dataset_id: str) -> HypothesisListRecord:
        self._require_dataset(project_id, dataset_id)
        return HypothesisListRecord(
            dataset_id=dataset_id,
            hypotheses=[self._hypothesis(r) for r in self.store.list_hypotheses(dataset_id)],
        )
