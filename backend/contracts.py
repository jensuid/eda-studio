"""IPC contracts — single source of truth (SYS-016, IPC-001..005).

Python/Pydantic models here generate the TypeScript types via
`tools/generate_types.py`. Never hand-edit generated TS.

Envelope (IPC §8/ES-8.3): every bridge response is a `Response` carrying
either `data` or `error`, plus protocol/job correlation fields. `request_id`
is per-call; `idempotency_key` dedupes command retries; `correlation_id`
ties a command to its job and durable events.
"""
from __future__ import annotations

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


class Kind(str, Enum):
    COMMAND = "command"
    QUERY = "query"


# Re-export for callers that only need the literal kind.
RequestKind = Literal["command", "query"]
