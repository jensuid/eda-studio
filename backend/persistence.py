"""Persistence — SQLite metadata + filesystem snapshots (Doc04).

One SQLite file per project root (`project.db`) with WAL + FK enforced
(OD-5 ratified). Snapshot payloads are plain files under `snapshots/`
(immutable, fingerprinted). M1 stores CSV bytes verbatim; Parquet storage
arrives with the pyarrow adapter without changing this port.
"""
from __future__ import annotations

import json
import logging
import sqlite3
import threading
from datetime import UTC, datetime
from pathlib import Path

from backend.domain import Dataset, Project, Snapshot, fingerprint_bytes

log = logging.getLogger(__name__)

RUNTIME_STATE_FILE = "runtime-state.json"


class ConflictError(ValueError):
    """Integrity / optimistic-concurrency conflict.

    Raised for opaque fingerprint mismatch on verify-on-read (K5) and
    re-exported by `backend.application` so `ipc.py` translates it to the
    CONFLICT ErrorContract.
    """

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
    message TEXT NOT NULL DEFAULT '',
    command TEXT,
    progress REAL,
    started_at TEXT,
    finished_at TEXT
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
    columns TEXT NOT NULL,
    file_fingerprint TEXT
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
CREATE TABLE IF NOT EXISTS chart_specs (
    chart_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    dataset_id TEXT NOT NULL,
    snapshot_id TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    chart_type TEXT NOT NULL,
    x TEXT NOT NULL,
    y TEXT,
    grp TEXT,
    encodings_json TEXT NOT NULL,
    options_json TEXT NOT NULL,
    version INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS analysis_plans (
    plan_id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    dataset_id TEXT NOT NULL,
    snapshot_id TEXT NOT NULL,
    fingerprint TEXT NOT NULL,
    status TEXT NOT NULL,
    steps_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS idempotency (
    key TEXT NOT NULL,
    command TEXT NOT NULL,
    result_json TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (key, command)
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
        self._migrate_snapshots_file_fingerprint()
        self._migrate_job_events_extension()
        self.db.commit()
        self._backfill_snapshots()
        self._init_runtime_state()

    def _runtime_state_path(self) -> Path:
        return self.root / RUNTIME_STATE_FILE

    def _read_runtime_state(self) -> dict:
        try:
            return json.loads(self._runtime_state_path().read_text())
        except (OSError, ValueError):
            return {}

    def _write_runtime_state(self, state: dict) -> None:
        try:
            self._runtime_state_path().write_text(json.dumps(state, indent=2))
        except OSError:
            log.warning("failed to write runtime state", exc_info=True)

    def _init_runtime_state(self) -> None:
        """Crash-recovery marker (G6-1).

        Reads the PREVIOUS run's marker before overwriting it:
        ``state == "running"`` means the previous run never marked a
        clean exit (kill/crash) → ``unclean_previous`` is True.
        The new marker is written immediately; a clean exit overwrites
        it with ``state == "clean"`` via :meth:`mark_clean_exit`.
        """
        previous = self._read_runtime_state()
        self.previous_runtime_state = previous
        self.unclean_previous = previous.get("state") == "running"
        self._write_runtime_state(
            {"state": "running",
             "started_at": datetime.now(UTC).isoformat()})

    def mark_clean_exit(self) -> None:
        """Record a clean shutdown (called by the desktop shell on exit)."""
        self._write_runtime_state(
            {"state": "clean",
             "last_clean_exit_at": datetime.now(UTC).isoformat()})

    def _migrate_snapshots_file_fingerprint(self) -> None:
        """Add snapshots.file_fingerprint to pre-existing databases (K5).

        Existing rows keep NULL: their stored bytes predate file-hash
        registration, so verify-on-read skips them instead of failing
        spuriously (the registered `fingerprint` is the source-bytes hash
        at import, not the stored Parquet hash).
        """
        cols = {
            r[1]
            for r in self.db.execute("PRAGMA table_info(snapshots)").fetchall()
        }
        if "file_fingerprint" not in cols:
            self.db.execute(
                "ALTER TABLE snapshots ADD COLUMN file_fingerprint TEXT"
            )

    def _migrate_job_events_extension(self) -> None:
        """Add D-F5 columns to pre-existing job_events databases.

        Existing rows keep NULL for command/progress/started_at/
        finished_at: pre-extension events carry no such data, and reading
        them back yields None (Pydantic defaults) instead of failing.
        """
        cols = {
            r[1]
            for r in self.db.execute("PRAGMA table_info(job_events)").fetchall()
        }
        for column, ddl in (
            ("command", "ALTER TABLE job_events ADD COLUMN command TEXT"),
            ("progress", "ALTER TABLE job_events ADD COLUMN progress REAL"),
            ("started_at", "ALTER TABLE job_events ADD COLUMN started_at TEXT"),
            ("finished_at", "ALTER TABLE job_events ADD COLUMN finished_at TEXT"),
        ):
            if column not in cols:
                self.db.execute(ddl)

    def _backfill_snapshots(self) -> None:
        """Register pre-M3 dataset snapshots in the registry (idempotent)."""
        with self._lock:
            rows = self.db.execute(
                "SELECT * FROM datasets"
            ).fetchall()
            for row in rows:
                self.db.execute(
                    "INSERT OR IGNORE INTO snapshots"
                    " (snapshot_id, dataset_id, fingerprint, row_count, columns)"
                    " VALUES (?,?,?,?,?)",
                    (row["snapshot_id"], row["dataset_id"],
                     row["fingerprint"], row["row_count"], row["columns"]),
                )
            self.db.commit()

    def _insert_snapshot_no_commit(self, snapshot_id: str, dataset_id: str,
                                   fingerprint: str, row_count: int,
                                   columns: list | tuple[str, ...],
                                   file_fingerprint: str | None = None) -> None:
        self.db.execute(
            "INSERT OR IGNORE INTO snapshots"
            " (snapshot_id, dataset_id, fingerprint, row_count, columns,"
            "  file_fingerprint)"
            " VALUES (?,?,?,?,?,?)",
            (snapshot_id, dataset_id, fingerprint, row_count,
             json.dumps(list(columns)), file_fingerprint),
        )

    def register_snapshot(self, snapshot_id: str, dataset_id: str,
                          fingerprint: str, row_count: int,
                          columns: list | tuple[str, ...],
                          file_fingerprint: str | None = None) -> None:
        with self._lock:
            self._insert_snapshot_no_commit(
                snapshot_id, dataset_id, fingerprint, row_count, columns,
                file_fingerprint)
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
                    snapshot_id, dataset_id, fingerprint, row_count, columns,
                    fingerprint_bytes(data))
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

    # -- idempotency (K1: dedup command retries) ---------------------------
    def get_idempotent_result(self, key: str, command: str) -> dict | None:
        with self._lock:
            row = self.db.execute(
                "SELECT result_json FROM idempotency WHERE key = ? AND command = ?",
                (key, command),
            ).fetchone()
        return json.loads(row["result_json"]) if row else None

    def save_idempotent_result(self, key: str, command: str, result: dict) -> None:
        from datetime import UTC, datetime

        with self._lock:
            self.db.execute(
                "INSERT OR IGNORE INTO idempotency(key, command, result_json, created_at)"
                " VALUES (?, ?, ?, ?)",
                (key, command, json.dumps(result), datetime.now(UTC).isoformat()),
            )
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

    def list_projects(self) -> list[Project]:
        with self._lock:
            rows = self.db.execute("SELECT * FROM projects ORDER BY rowid").fetchall()
        return [Project(row["project_id"], row["name"]) for row in rows]

    def list_recent_projects(self, limit: int = 10) -> list[dict]:
        """D-F4: recent projects, most-recently-created first.

        Read-only: projects table rowid order is the backend activity
        log (creation order); no mutation, no timestamps invented.
        """
        with self._lock:
            rows = self.db.execute(
                "SELECT p.project_id, p.name, "
                "(SELECT COUNT(*) FROM datasets d WHERE d.project_id = p.project_id) "
                "AS dataset_count FROM projects p ORDER BY p.rowid DESC LIMIT ?",
                (limit,),
            ).fetchall()
        return [dict(r) for r in rows]

    def latest_dataset_id(self, project_id: str) -> str | None:
        """D-F4 Beta: most recently imported dataset for a project."""
        with self._lock:
            row = self.db.execute(
                "SELECT dataset_id FROM datasets WHERE project_id = ? "
                "ORDER BY rowid DESC LIMIT 1",
                (project_id,),
            ).fetchone()
        return row["dataset_id"] if row else None

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

    def read_snapshot(self, snapshot_id: str, strict: bool = False) -> bytes:
        """Read snapshot bytes, verifying the stored-file fingerprint (K5).

        Verification compares SHA-256 of the bytes on disk against the
        registry's `file_fingerprint` (hash of the stored Parquet payload —
        distinct from `fingerprint`, which at import is the source-bytes
        hash). Snapshots without a registry row or with NULL
        `file_fingerprint` (pre-K5 databases) cannot be verified and are
        returned as-is.

        strict=True raises ConflictError on mismatch (export/report/pdf
        paths); strict=False logs a warning and returns the bytes.
        """
        data = (self.root / "snapshots" / f"{snapshot_id}.parquet").read_bytes()
        row = self.get_snapshot(snapshot_id)
        expected = row.get("file_fingerprint") if row else None
        if expected is None:
            log.debug("snapshot %s: no file_fingerprint registered; "
                      "skipping verify-on-read", snapshot_id)
            return data
        actual = fingerprint_bytes(data)
        if actual != expected:
            if strict:
                raise ConflictError(f"snapshot fingerprint mismatch: {snapshot_id}")
            log.warning("snapshot %s: fingerprint mismatch on read "
                        "(verify-on-read, non-strict)", snapshot_id)
        return data

    # -- jobs (durable lifecycle, OBS-009) --------------------------------
    def save_job(self, job_id: str, command: str, state: str, correlation_id: str | None) -> None:
        with self._lock:
            self.db.execute(
                "INSERT OR REPLACE INTO jobs VALUES (?,?,?,?)",
                (job_id, command, state, correlation_id),
            )
            self.db.commit()

    def save_event(self, event_id: str, job_id: str, correlation_id: str | None,
                   state: str, seq: int, message: str,
                   command: str | None = None,
                   progress: float | None = None,
                   started_at: str | None = None,
                   finished_at: str | None = None) -> None:
        with self._lock:
            self.db.execute(
                "INSERT INTO job_events VALUES (?,?,?,?,?,?,?,?,?,?)",
                (event_id, job_id, correlation_id, state, seq, message,
                 command, progress, started_at, finished_at),
            )
            self.db.commit()

    def events_since(self, seq: int) -> list[dict]:
        with self._lock:
            rows = self.db.execute(
                "SELECT * FROM job_events WHERE seq > ? ORDER BY seq", (seq,)
            ).fetchall()
        return [dict(r) for r in rows]

    def max_event_seq(self) -> int:
        """Highest persisted job-event seq (K4 durable seq seed)."""
        with self._lock:
            row = self.db.execute(
                "SELECT COALESCE(MAX(seq), 0) AS m FROM job_events"
            ).fetchone()
        return int(row["m"])

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

    def save_chart_spec(self, record: dict) -> None:
        with self._lock:
            self.db.execute(
                "INSERT OR REPLACE INTO chart_specs VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
                (record["chart_id"], record["project_id"], record["dataset_id"],
                 record["snapshot_id"], record["fingerprint"], record["chart_type"],
                 record["x"], record["y"], record["group"],
                 json.dumps(record["encodings"]), json.dumps(record["options"]),
                 record["version"], record["created_at"], record["updated_at"]),
            )
            self.db.commit()

    def get_chart_spec(self, chart_id: str) -> dict | None:
        with self._lock:
            row = self.db.execute(
                "SELECT * FROM chart_specs WHERE chart_id = ?", (chart_id,)
            ).fetchone()
        return dict(row) if row else None

    def list_chart_specs(self, dataset_id: str) -> list[dict]:
        with self._lock:
            rows = self.db.execute(
                "SELECT * FROM chart_specs WHERE dataset_id = ? ORDER BY rowid", (dataset_id,)
            ).fetchall()
        return [dict(r) for r in rows]

    def save_plan(self, record: dict) -> None:
        with self._lock:
            self.db.execute(
                "INSERT OR REPLACE INTO analysis_plans VALUES (?,?,?,?,?,?,?,?,?)",
                (record["plan_id"], record["project_id"], record["dataset_id"],
                 record["snapshot_id"], record["fingerprint"], record["status"],
                 json.dumps(record["steps"]), record["created_at"], record["updated_at"]),
            )
            self.db.commit()

    def get_plan(self, plan_id: str) -> dict | None:
        with self._lock:
            row = self.db.execute(
                "SELECT * FROM analysis_plans WHERE plan_id = ?", (plan_id,)
            ).fetchone()
        return dict(row) if row else None

    def list_plans(self, dataset_id: str) -> list[dict]:
        with self._lock:
            rows = self.db.execute(
                "SELECT * FROM analysis_plans WHERE dataset_id = ? ORDER BY rowid", (dataset_id,)
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
