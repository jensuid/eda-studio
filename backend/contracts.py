"""IPC contracts — single source of truth (SYS-016, IPC-001..005).

Python/Pydantic models here generate the TypeScript types via
`tools/generate_types.py`. Never hand-edit generated TS.

Envelope (IPC §8/ES-8.3): every bridge response is a `Response` carrying
either `data` or `error`, plus protocol/job correlation fields. `request_id`
is per-call; `idempotency_key` dedupes command retries; `correlation_id`
ties a command to its job and durable events.
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any, Generic, Literal, TypeVar

from pydantic import BaseModel, Field

PROTOCOL_VERSION = "1.0.0"
PROTOCOL_REVISION = 1

T = TypeVar("T")


class JobState(str, Enum):
    """Canonical job lifecycle (Doc05 §8.2, SYS-015)."""

    CREATED = "Created"
    QUEUED = "Queued"
    PREPARING = "Preparing"
    RUNNING = "Running"
    COMPLETED = "Completed"
    FAILED = "Failed"
    CANCELLING = "Cancelling"
    CANCELLED = "Cancelled"
    INTERRUPTED = "Interrupted"


class ErrorCode(str, Enum):
    VALIDATION = "VALIDATION_ERROR"
    NOT_FOUND = "NOT_FOUND"
    PERMISSION_DENIED = "PERMISSION_DENIED"  # SEC-004 default-deny surface
    CONFLICT = "CONFLICT"
    UNSUPPORTED_FORMAT = "UNSUPPORTED_FORMAT"
    INTERNAL = "INTERNAL_ERROR"


class ErrorContract(BaseModel):
    """ErrorContract (IPC-004/005, ES-13.2). Domain errors are translated to
    this shape at the IPC boundary; internal detail never leaks."""

    code: ErrorCode
    message: str
    correlation_id: str | None = None
    details: dict[str, Any] = Field(default_factory=dict)


class Request(BaseModel):
    """Command/Query request envelope."""

    request_id: str
    idempotency_key: str | None = None
    correlation_id: str | None = None
    command: str
    payload: dict[str, Any] = Field(default_factory=dict)


class Response(BaseModel, Generic[T]):
    ok: bool
    data: T | None = None
    error: ErrorContract | None = None
    protocol_version: str = PROTOCOL_VERSION
    correlation_id: str | None = None


class ProtocolInfo(BaseModel):
    protocol_version: str = PROTOCOL_VERSION
    protocol_revision: int = PROTOCOL_REVISION
    commands: list[str] = Field(default_factory=list)
    queries: list[str] = Field(default_factory=list)


class JobEvent(BaseModel):
    """Durable lifecycle event (IPC-007). Progress is ephemeral and separate."""

    event_id: str
    job_id: str
    correlation_id: str | None = None
    state: JobState
    seq: int
    message: str = ""


class JobStatus(BaseModel):
    job_id: str
    command: str
    state: JobState
    correlation_id: str | None = None
    error: ErrorContract | None = None


# ---- Command payloads (M1) ----

class CreateProjectPayload(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    project_id: str | None = None  # server-generated (UUID v7) when absent


class ImportDatasetPayload(BaseModel):
    project_id: str
    source_path: str
    dataset_name: str = Field(min_length=1, max_length=120)


class GetDatasetPreviewPayload(BaseModel):
    project_id: str
    dataset_id: str
    limit: int = Field(default=20, ge=1, le=200)


class OpenProjectPayload(BaseModel):
    project_id: str


class GetDatasetProfilePayload(BaseModel):
    project_id: str
    dataset_id: str


# ---- G6: job-wrapped profiling + history ----
class RunProfilePayload(BaseModel):
    project_id: str
    dataset_id: str


class ListProfilesPayload(BaseModel):
    project_id: str
    dataset_id: str


class GetProfileByIdPayload(BaseModel):
    project_id: str
    profile_id: str


class ListSnapshotsPayload(BaseModel):
    project_id: str


# ---- Command/Query results (M1) ----

class ProjectRecord(BaseModel):
    project_id: str
    name: str


class DatasetRecord(BaseModel):
    dataset_id: str
    project_id: str
    name: str
    snapshot_id: str
    fingerprint: str  # SHA-256 of immutable source bytes
    row_count: int
    columns: list[str]


class PreviewRecord(BaseModel):
    dataset_id: str
    columns: list[str]
    rows: list[dict[str, str]]
    total_rows: int
    truncated: bool


# ---- Profiling (M2 slice, SCREEN-PROF-001) ----
# Status thresholds (missing>30% -> problem; any missing or single distinct
# -> check) are PROPOSED for this slice, pending PO ratification.
class ColumnProfile(BaseModel):
    name: str
    inferred_type: str  # "numeric" | "categorical" | "empty"
    missing_count: int
    missing_pct: float
    distinct_count: int
    min_value: float | None = None
    max_value: float | None = None
    mean_value: float | None = None
    top_value: str | None = None
    status: str  # "ok" | "check" | "problem"


class ProfileRecord(BaseModel):
    profile_id: str | None = None  # set when persisted (G6)
    dataset_id: str
    snapshot_id: str
    fingerprint: str
    row_count: int
    column_count: int
    columns: list[ColumnProfile]


class ProfileSummary(BaseModel):
    profile_id: str
    dataset_id: str
    snapshot_id: str
    fingerprint: str
    row_count: int
    column_count: int


class ProfileListRecord(BaseModel):
    profiles: list[ProfileSummary]


class SnapshotInfo(BaseModel):
    snapshot_id: str
    dataset_id: str
    dataset_name: str
    fingerprint: str
    row_count: int


class SnapshotListRecord(BaseModel):
    snapshots: list[SnapshotInfo]


# ---- Quality Rules Engine (M2, SCREEN-QUAL-001) ----
class RunQualityPayload(BaseModel):
    project_id: str
    dataset_id: str


class QualityFindingRecord(BaseModel):
    rule_id: str  # "completeness" | "duplicates" | "constant" | "outliers"
    column_name: str | None = None  # null for snapshot-level rules
    severity: str  # "ok" | "check" | "problem"
    message: str
    evidence_count: int
    evidence_pct: float
    evidence_detail: str


class QualityRecord(BaseModel):
    dataset_id: str
    snapshot_id: str
    fingerprint: str
    row_count: int
    findings: list[QualityFindingRecord]
    ok_count: int
    check_count: int
    problem_count: int
    summary: str


# ---- Desriptive histogram (M2, SCREEN-HIST-001) ----
class RunHistogramPayload(BaseModel):
    project_id: str
    dataset_id: str
    column_name: str = Field(min_length=1)


class HistogramBin(BaseModel):
    label: str  # numeric: "min–max" range label; categorical: category
    count: int


class HistogramRecord(BaseModel):
    dataset_id: str
    snapshot_id: str
    fingerprint: str
    column_name: str
    inferred_type: str  # "numeric" | "categorical" | "empty"
    kind: str  # "histogram" | "frequency" | "empty"
    bins: list[HistogramBin]
    bin_method: str  # "freedman-diaconis" | "equal-width" | "top-n" | "constant" | "empty"
    missing_pct: float
    min_value: float | None = None
    max_value: float | None = None
    mean_value: float | None = None
    top_bin: str | None = None
    value_count: int


# ---- Bivariate descriptive analysis (M2, SCREEN-BIVAR-001) ----
# A2 locked: scatter/sample payload capped at _BIVAR_SAMPLE_MAX points; the
# full DataFrame is never stored in the record (only ringkasan + sampel).
# A3 locked: no persistence in this slice — recompute is cheap (like
# histogram/quality, not cleaning). Results live in job history only.
_BIVAR_SAMPLE_MAX = 2000


class RunBivariatePayload(BaseModel):
    project_id: str
    dataset_id: str
    column_a: str = Field(min_length=1)
    column_b: str = Field(min_length=1)


class BivariateScatterPoint(BaseModel):
    x: float
    y: float


class BivariateGroup(BaseModel):
    label: str  # category label ("Lainnya" for merged tail)
    count: int
    mean_value: float
    median_value: float
    min_value: float
    max_value: float


class BivariateRecord(BaseModel):
    dataset_id: str
    snapshot_id: str
    fingerprint: str
    column_a: str
    column_b: str
    mode: str  # "num-num" | "cat-num" | "cat-cat" | "empty"
    type_a: str  # "numeric" | "categorical" | "empty"
    type_b: str
    # B1 (num-num)
    pearson_r: float | None = None
    spearman_rho: float | None = None
    scatter_points: list[BivariateScatterPoint] = []
    # B2 (cat-num): group side + value side recorded explicitly
    group_column: str | None = None
    value_column: str | None = None
    groups: list[BivariateGroup] = []
    # B3 (cat-cat)
    row_labels: list[str] = []
    col_labels: list[str] = []
    cells: list[list[int]] = []  # row-major counts: len(rows) x len(cols)
    # shared
    n_pairs: int
    missing_pairs: int
    sampled: bool
    sample_size: int  # == len(scatter_points); <= _BIVAR_SAMPLE_MAX
    constant_columns: list[str] = []


# ---- HTML Reporting (M3, SCREEN-REPORT-001) ----
# A1 locked: every section is OPTIONAL-but-disclosed — stale sections are
# included and explicitly labelled, never silently dropped. A report whose
# sections include stale records is still a valid partial report (NOT a
# "final export"); it carries is_final=False + validation_summary so no
# stale report can be mistaken for final. The UI partial banner IS the
# explicit user confirmation (Doc12 §10.2 / §18.3) and the report_execute_
# id makes that confirmation traceable in provenance.
# A3 locked: renderer_version + content_fingerprint (SHA-256 of the HTML
# artifact bytes) + validation_summary + job history correlation.
# File artifact lives on disk; IPC payload stays small (ReportRecord only).
# Single source of truth for the renderer version (A1 follow-up).
REPORT_RENDERER_VERSION = "report-html/1.0"
_REPORT_RENDERER_VERSION = REPORT_RENDERER_VERSION  # alias, do not add new consts


class ReportScope(str, Enum):
    ALL = "all"
    PROFILE_QUALITY = "profile-quality"
    WITH_CHARTS = "with-charts"
    WITH_VISUALS = "with-visuals"


class RunReportPayload(BaseModel):
    project_id: str
    dataset_id: str
    scope: ReportScope = ReportScope.ALL


class ReportSection(BaseModel):
    kind: str  # "profile" | "quality" | "histogram" | "bivariate" | "cleaning"
    record_id: str
    fingerprint: str
    stale: bool
    required: bool = False  # A1: all sections optional-but-disclosed


class ReportRecord(BaseModel):
    dataset_id: str
    snapshot_id: str
    fingerprint: str
    scope: ReportScope
    sections: list[ReportSection]
    file_path: str
    file_size_bytes: int
    renderer_version: str
    content_fingerprint: str  # SHA-256 of HTML artifact bytes
    is_final: bool  # A1: False iff any section is stale
    validation_summary: str
    created_at: datetime


# ---- PDF Report (M3, SCREEN-PDF-001) ----
# A-L1 locked: reportlab is the SOLE primary renderer; the stdlib fallback
# (tables-only, no images) carries a DIFFERENT renderer_version and is
# labelled in PdfSummary + PDF metadata (never silently).
# A-L2 locked: payload is {project_id, dataset_id, scope} (ReportRecord is
# NOT persisted in store — run_report returns only), so PDF sections are
# recomputed deterministically from the same scope and the SAME fingerprint
# algorithm as HTML; report_id in PdfRecord = the HTML artifact's
# content_fingerprint, which makes PDF<->HTML provenance traceable without
# inventing a persisted report table.
# A-L3 locked: tables paginate across pages — header rows repeat on every
# page (Table repeatRows=1); charts in fallback are tables only.
_PDF_RENDERER_PRIMARY = "reportlab/1.0"
_PDF_RENDERER_FALLBACK = "stdlib-tables/1.0"


class RunPdfPayload(BaseModel):
    project_id: str
    dataset_id: str
    scope: ReportScope = ReportScope.ALL


class PdfRecord(BaseModel):
    dataset_id: str
    snapshot_id: str
    fingerprint: str
    report_id: str  # content_fingerprint of source HTML artifact (A-L2)
    sections: list[ReportSection]
    page_count: int
    file_path: str
    file_size_bytes: int
    renderer_version: str  # A-L1: primary vs fallback are distinct
    pdf_fingerprint: str  # SHA-256 of PDF artifact bytes
    source_html_fingerprint: str  # == report_id (kept for clarity)
    is_final: bool
    validation_summary: str
    created_at: datetime


class CleaningOperation(str, Enum):
    DROP_DUPLICATES = "drop_duplicates"
    DROP_MISSING = "drop_missing"
    IMPUTE = "impute"


class CleaningStrategy(str, Enum):
    MEAN = "mean"
    MEDIAN = "median"
    MODE = "mode"
    CONSTANT = "constant"


class CleaningPreviewPayload(BaseModel):
    project_id: str
    dataset_id: str
    operation: CleaningOperation
    columns: list[str]
    strategy: CleaningStrategy | None = None
    constant_value: str | None = None


class CleaningColumnImpact(BaseModel):
    column: str
    affected_rows: int


class CleaningPreviewSummary(BaseModel):
    operation: CleaningOperation
    columns: list[str]
    parent_fingerprint: str
    row_count_before: int
    row_count_after: int
    affected_rows: int
    affected_pct: float
    per_column_affected: list[CleaningColumnImpact] | None = None
    filled_rows: int | None = None


class CleaningRunPayload(BaseModel):
    project_id: str
    dataset_id: str
    operation: CleaningOperation
    columns: list[str]
    strategy: CleaningStrategy | None = None
    constant_value: str | None = None
    expected_parent_fingerprint: str


class DatasetActivatePayload(BaseModel):
    project_id: str
    dataset_id: str
    snapshot_id: str


class CleaningRecord(BaseModel):
    id: str
    project_id: str
    dataset_id: str
    created_at: datetime
    job_id: str | None = None
    parent_snapshot_id: str
    parent_fingerprint: str
    child_snapshot_id: str
    child_fingerprint: str
    operation: CleaningOperation
    columns: list[str]
    strategy: CleaningStrategy | None = None
    constant_value: str | None = None
    row_count_before: int
    row_count_after: int
    affected_rows: int
    filled_rows: int | None = None


# ---- Backup / Restore (M3 P0, Doc04 §12) ----
# A backup is a full `.edaworkspace`-shaped ZIP (project.db + snapshots/ +
# manifest.json, per-file SHA-256). A restore targets a NEW root and never
# touches the current project. The artifact lives on disk; IPC payload
# stays small (BackupRecord/RestoreRecord only).

class BackupCreatePayload(BaseModel):
    project_id: str
    dest_path: str = Field(min_length=1)


class BackupRestorePayload(BaseModel):
    archive_path: str = Field(min_length=1)
    dest_root: str = Field(min_length=1)


class BackupRecord(BaseModel):
    project_id: str
    file_path: str
    file_size_bytes: int
    created_at: datetime
    project_db_sha256: str
    counts: dict[str, int] = Field(default_factory=dict)
    version: str


class RestoreRecord(BaseModel):
    project_id: str  # first project in the restored manifest
    dest_root: str
    file_path: str  # source archive path
    project_db_sha256: str
    counts: dict[str, int] = Field(default_factory=dict)
    version: str


# ---- Dataset Export (M3 P0, Doc04/Doc16 §4.2) ----
# Canonical-snapshot export to an explicit on-disk CSV/Parquet artifact.
# The artifact lives on disk; IPC payload stays small (ExportRecord).

class ExportFormat(str, Enum):
    CSV = "csv"
    PARQUET = "parquet"


class ExportDatasetPayload(BaseModel):
    project_id: str
    dataset_id: str
    format: ExportFormat
    dest_path: str = Field(min_length=1)


class ExportRecord(BaseModel):
    dataset_id: str
    snapshot_id: str
    fingerprint: str  # snapshot fingerprint (provenance)
    format: ExportFormat
    file_path: str
    file_size_bytes: int
    row_count: int
    file_fingerprint: str  # SHA-256 of artifact bytes
    created_at: datetime


class Kind(str, Enum):
    COMMAND = "command"
    QUERY = "query"


# Re-export for callers that only need the literal kind.
RequestKind = Literal["command", "query"]
