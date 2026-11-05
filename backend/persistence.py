"""Persistence — SQLite metadata + filesystem snapshots (Doc04).

One SQLite file per project root (`project.db`) with WAL + FK enforced
(OD-5 ratified). Snapshot payloads are plain files under `snapshots/`
(immutable, fingerprinted). M1 stores CSV bytes verbatim; Parquet storage
arrives with the pyarrow adapter without changing this port.
"""
from __future__ import annotations

import json
import sqlite3
import threading
from pathlib import Path

from backend.domain import Dataset, Project, Snapshot

SCHEMA = """
CREATE TABLE IF NOT EXISTS projects (
    project_id TEXT PRIMARY KEY,
    name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS datasets (
    dataset_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(project_id),
    name TEXT NOT NULL,
    snapshot_id TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    row_count INTEGER NOT NULL,
    columns TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS jobs (
    job_id TEXT PRIMARY KEY,
    command TEXT NOT NULL,
    state TEXT NOT NULL,
    correlation_id TEXT
);
CREATE TABLE IF NOT EXISTS job_events (
    event_id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    correlation_id TEXT,
    state TEXT NOT NULL,
    seq INTEGER NOT NULL,
    message TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS profiles (
    profile_id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL,
    snapshot_id TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    row_count INTEGER NOT NULL,
    column_count INTEGER NOT NULL,
    columns_json TEXT NOT NULL
);
"""


class Store:
    def __init__(self, root: Path) -> None:
        self.root = Path(root)
        self.root.mkdir(parents=True, exist_ok=True)
        (self.root / "snapshots").mkdir(exist_ok=True)
        # PyWebView dispatches js_api calls on worker threads; the connection
        # is created in the main thread. check_same_thread=False + an RLock
        # makes the Store safe for concurrent calls (SQLite serialized).
        self._lock = threading.RLock()
        self.db = sqlite3.connect(self.root / "project.db", check_same_thread=False)
        self.db.row_factory = sqlite3.Row
        self.db.execute("PRAGMA journal_mode=WAL")
        self.db.execute("PRAGMA foreign_keys=ON")
        self.db.executescript(SCHEMA)
        self.db.commit()

    # -- projects ---------------------------------------------------------
    def save_project(self, project: Project) -> None:
        with self._lock:
            self.db.execute(
                "INSERT OR REPLACE INTO projects(project_id, name) VALUES (?, ?)",
                (project.project_id, project.name),
            )
            self.db.commit()

    def get_project(self, project_id: str) -> Project | None:
        with self._lock:
            row = self.db.execute(
                "SELECT * FROM projects WHERE project_id = ?", (project_id,)
            ).fetchone()
        return Project(row["project_id"], row["name"]) if row else None

    # -- snapshots + datasets --------------------------------------------
    def save_snapshot(self, snapshot_id: str, data: bytes) -> Path:
        path = self.root / "snapshots" / f"{snapshot_id}.parquet"
        if not path.exists():  # immutable: never overwrite
            tmp = path.with_suffix(".tmp")
            tmp.write_bytes(data)
            tmp.replace(path)
        return path

    def save_dataset(self, dataset: Dataset) -> None:
        with self._lock:
            self.db.execute(
                "INSERT OR REPLACE INTO datasets VALUES (?,?,?,?,?,?,?)",
                (
                    dataset.dataset_id,
                    dataset.project_id,
                    dataset.name,
                    dataset.snapshot.snapshot_id,
                    dataset.snapshot.fingerprint,
                    dataset.snapshot.row_count,
                    json.dumps(list(dataset.snapshot.columns)),
                ),
            )
            self.db.commit()

    def get_dataset(self, dataset_id: str) -> Dataset | None:
        with self._lock:
            row = self.db.execute(
                "SELECT * FROM datasets WHERE dataset_id = ?", (dataset_id,)
            ).fetchone()
        if not row:
            return None
        columns = tuple(json.loads(row["columns"]))
        return Dataset(
            dataset_id=row["dataset_id"],
            project_id=row["project_id"],
            name=row["name"],
            snapshot=Snapshot(
                row["snapshot_id"],
                row["fingerprint"],
                row["row_count"],
                columns,
            ),
        )

    def read_snapshot(self, snapshot_id: str) -> bytes:
        return (self.root / "snapshots" / f"{snapshot_id}.parquet").read_bytes()

    # -- jobs (durable lifecycle, OBS-009) --------------------------------
    def save_job(self, job_id: str, command: str, state: str, correlation_id: str | None) -> None:
        with self._lock:
            self.db.execute(
                "INSERT OR REPLACE INTO jobs VALUES (?,?,?,?)",
                (job_id, command, state, correlation_id),
            )
            self.db.commit()

    def save_event(self, event_id: str, job_id: str, correlation_id: str | None,
                   state: str, seq: int, message: str) -> None:
        with self._lock:
            self.db.execute(
                "INSERT INTO job_events VALUES (?,?,?,?,?,?)",
                (event_id, job_id, correlation_id, state, seq, message),
            )
            self.db.commit()

    def events_since(self, seq: int) -> list[dict]:
        with self._lock:
            rows = self.db.execute(
                "SELECT * FROM job_events WHERE seq > ? ORDER BY seq", (seq,)
            ).fetchall()
        return [dict(r) for r in rows]

    # -- profiles (G6) ----------------------------------------------------
    def save_profile(self, profile_id: str, dataset_id: str, snapshot_id: str,
                     fingerprint: str, row_count: int, column_count: int,
                     columns_json: str) -> None:
        with self._lock:
            self.db.execute(
                "INSERT OR REPLACE INTO profiles VALUES (?,?,?,?,?,?,?)",
                (profile_id, dataset_id, snapshot_id, fingerprint,
                 row_count, column_count, columns_json),
            )
            self.db.commit()

    def get_profile(self, profile_id: str) -> dict | None:
        with self._lock:
            row = self.db.execute(
                "SELECT * FROM profiles WHERE profile_id = ?", (profile_id,)
            ).fetchone()
        return dict(row) if row else None

    def list_profiles(self, dataset_id: str) -> list[dict]:
        with self._lock:
            rows = self.db.execute(
                "SELECT * FROM profiles WHERE dataset_id = ? ORDER BY rowid", (dataset_id,)
            ).fetchall()
        return [dict(r) for r in rows]

    def list_snapshots(self, project_id: str) -> list[dict]:
        with self._lock:
            rows = self.db.execute(
                "SELECT * FROM datasets WHERE project_id = ? ORDER BY rowid", (project_id,)
            ).fetchall()
        return [dict(r) for r in rows]

    def close(self) -> None:
        with self._lock:
            self.db.close()
