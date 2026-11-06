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
CREATE TABLE IF NOT EXISTS snapshots (
    snapshot_id TEXT PRIMARY KEY,
    dataset_id TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    row_count INTEGER NOT NULL,
    columns TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS cleanings (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    dataset_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    job_id TEXT,
    parent_snapshot_id TEXT NOT NULL,
    parent_fingerprint TEXT NOT NULL,
    child_snapshot_id TEXT NOT NULL,
    child_fingerprint TEXT NOT NULL,
    operation TEXT NOT NULL,
    columns TEXT NOT NULL,
    strategy TEXT,
    constant_value TEXT,
    row_count_before INTEGER NOT NULL,
    row_count_after INTEGER NOT NULL,
    affected_rows INTEGER NOT NULL,
    filled_rows INTEGER
);
CREATE TABLE IF NOT EXISTS findings (
    finding_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    dataset_id TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT NOT NULL,
    evidence_snapshot_id TEXT NOT NULL,
    evidence_fingerprint TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS hypotheses (
    hypothesis_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    dataset_id TEXT NOT NULL,
    statement TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
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
        self._backfill_snapshots()

    def _backfill_snapshots(self) -> None:
        """Register pre-M3 dataset snapshots in the registry (idempotent)."""
        with self._lock:
            rows = self.db.execute(
                "SELECT * FROM datasets"
            ).fetchall()
            for row in rows:
                self.db.execute(
                    "INSERT OR IGNORE INTO snapshots VALUES (?,?,?,?,?)",
                    (row["snapshot_id"], row["dataset_id"],
                     row["fingerprint"], row["row_count"], row["columns"]),
                )
            self.db.commit()

    def _insert_snapshot_no_commit(self, snapshot_id: str, dataset_id: str,
                                   fingerprint: str, row_count: int,
                                   columns: list | tuple[str, ...]) -> None:
        self.db.execute(
            "INSERT OR IGNORE INTO snapshots VALUES (?,?,?,?,?)",
            (snapshot_id, dataset_id, fingerprint, row_count,
             json.dumps(list(columns))),
        )

    def register_snapshot(self, snapshot_id: str, dataset_id: str,
                          fingerprint: str, row_count: int,
                          columns: list | tuple[str, ...]) -> None:
        with self._lock:
            self._insert_snapshot_no_commit(
                snapshot_id, dataset_id, fingerprint, row_count, columns)
            self.db.commit()

    def get_snapshot(self, snapshot_id: str) -> dict | None:
        with self._lock:
            row = self.db.execute(
                "SELECT * FROM snapshots WHERE snapshot_id = ?", (snapshot_id,)
            ).fetchone()
        return dict(row) if row else None

    def _insert_cleaning_no_commit(self, record: dict) -> None:
        self.db.execute(
            "INSERT OR REPLACE INTO cleanings VALUES "
            "(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            (
                record["id"], record["project_id"], record["dataset_id"],
                record["created_at"], record["job_id"],
                record["parent_snapshot_id"], record["parent_fingerprint"],
                record["child_snapshot_id"], record["child_fingerprint"],
                record["operation"], json.dumps(list(record["columns"])),
                record.get("strategy"), record.get("constant_value"),
                record["row_count_before"], record["row_count_after"],
                record["affected_rows"], record.get("filled_rows"),
            ),
        )

    def save_cleaning(self, record: dict) -> None:
        with self._lock:
            self._insert_cleaning_no_commit(record)
            self.db.commit()

    def save_child_snapshot_with_cleaning(
        self, snapshot_id: str, data: bytes, dataset_id: str,
        fingerprint: str, row_count: int,
        columns: list | tuple[str, ...], cleaning_record: dict,
    ) -> None:
        """Persist child snapshot file + registry row + CleaningRecord.

        The two DB rows are written in ONE transaction (single commit);
        the record is inserted exactly once.
        """
        self.save_snapshot(snapshot_id, data)
        with self._lock:
            try:
                self._insert_snapshot_no_commit(
                    snapshot_id, dataset_id, fingerprint, row_count, columns)
                self._insert_cleaning_no_commit(cleaning_record)
                self.db.commit()
            except Exception:
                self.db.rollback()
                raise

    def list_cleanings(self, dataset_id: str) -> list[dict]:
        with self._lock:
            rows = self.db.execute(
                "SELECT * FROM cleanings WHERE dataset_id = ? ORDER BY rowid",
                (dataset_id,),
            ).fetchall()
        return [dict(r) for r in rows]

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
                "SELECT s.*, d.name AS name FROM snapshots s "
                "JOIN datasets d ON d.dataset_id = s.dataset_id "
                "WHERE d.project_id = ? ORDER BY s.rowid",
                (project_id,),
            ).fetchall()
        return [dict(r) for r in rows]

    def save_finding(self, record: dict) -> None:
        with self._lock:
            self.db.execute(
                "INSERT OR REPLACE INTO findings VALUES (?,?,?,?,?,?,?,?,?,?)",
                (record["finding_id"], record["project_id"], record["dataset_id"],
                 record["title"], record["body"], record["status"],
                 record["evidence_snapshot_id"], record["evidence_fingerprint"],
                 record["created_at"], record["updated_at"]),
            )
            self.db.commit()

    def get_finding(self, finding_id: str) -> dict | None:
        with self._lock:
            row = self.db.execute(
                "SELECT * FROM findings WHERE finding_id = ?", (finding_id,)
            ).fetchone()
        return dict(row) if row else None

    def list_findings(self, dataset_id: str) -> list[dict]:
        with self._lock:
            rows = self.db.execute(
                "SELECT * FROM findings WHERE dataset_id = ? ORDER BY rowid", (dataset_id,)
            ).fetchall()
        return [dict(r) for r in rows]

    def save_hypothesis(self, record: dict) -> None:
        with self._lock:
            self.db.execute(
                "INSERT OR REPLACE INTO hypotheses VALUES (?,?,?,?,?,?,?)",
                (record["hypothesis_id"], record["project_id"], record["dataset_id"],
                 record["statement"], record["status"], record["created_at"], record["updated_at"]),
            )
            self.db.commit()

    def get_hypothesis(self, hypothesis_id: str) -> dict | None:
        with self._lock:
            row = self.db.execute(
                "SELECT * FROM hypotheses WHERE hypothesis_id = ?", (hypothesis_id,)
            ).fetchone()
        return dict(row) if row else None

    def list_hypotheses(self, dataset_id: str) -> list[dict]:
        with self._lock:
            rows = self.db.execute(
                "SELECT * FROM hypotheses WHERE dataset_id = ? ORDER BY rowid", (dataset_id,)
            ).fetchall()
        return [dict(r) for r in rows]

    def close(self) -> None:
        with self._lock:
            self.db.close()
