"""Domain model (M1 subset of Doc03).

Invariants enforced here, not at the IPC edge:
- A snapshot is immutable: its fingerprint is computed once, at ingestion.
- A dataset belongs to exactly one project (project isolation, ES-9.11).
- Preview never mutates the snapshot.
"""
from __future__ import annotations

import hashlib
import uuid
from dataclasses import dataclass, field


def new_id() -> str:
    """UUID v7-style stable id (OD-11 delegation, Baseline Freeze v1.0).

    Falls back to uuid4-based v7 layout on interpreters without uuid7.
    """
    try:
        return str(uuid.uuid7())  # type: ignore[attr-defined]
    except AttributeError:
        # Manual v7 layout (time-ordered) for interpreters without uuid7.
        import os
        import time

        ms = int(time.time() * 1000)
        rand = os.urandom(10)
        b = bytearray(16)
        b[0:6] = ms.to_bytes(6, "big")
        b[6] = (rand[0] & 0x0F) | 0x70
        b[7] = rand[1]
        b[8] = (rand[2] & 0x3F) | 0x80
        b[9:16] = rand[3:10]
        return str(uuid.UUID(bytes=bytes(b)))


def fingerprint_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


@dataclass(frozen=True)
class Project:
    project_id: str
    name: str

    def __post_init__(self) -> None:
        if not self.name.strip():
            raise ValueError("project name must not be empty")


@dataclass(frozen=True)
class Snapshot:
    snapshot_id: str
    fingerprint: str  # SHA-256 hex of immutable source bytes
    row_count: int
    columns: tuple[str, ...]


@dataclass
class Dataset:
    dataset_id: str
    project_id: str
    name: str
    snapshot: Snapshot
    _rows: tuple[dict[str, str], ...] = field(default=(), repr=False)

    @property
    def rows(self) -> tuple[dict[str, str], ...]:
        return self._rows
