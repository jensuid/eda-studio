"""Project backup/restore — Doc04 §12, Doc16 M3 P0 acceptance.

Full backup = ZIP package (`.edaworkspace`-shaped) containing:
- `project.db` copied via SQLite Backup API (consistent, WAL-safe)
- `snapshots/` managed payloads (immutable files only)
- `manifest.json` — version, counts, per-file SHA-256

Restore targets a NEW location (default restore strategy): validates
manifest + checksums + schema, restores metadata/payloads into a temp dir
first, and only installs to the destination after integrity checks pass.
The original project is never touched by a restore.
"""
from __future__ import annotations

import hashlib
import json
import sqlite3
import tempfile
import zipfile
from datetime import timezone
from pathlib import Path

MANIFEST_VERSION = "1"
UTC = timezone.utc  # noqa: UP017 -- venv is Python 3.9 in some envs

_REQUIRED_TABLES = ("projects", "datasets", "snapshots", "profiles")


class BackupError(ValueError):
    pass


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def _now_iso() -> str:
    from datetime import datetime

    return datetime.now(UTC).isoformat()


def _read_metadata(db_path: Path) -> dict:
    conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    try:
        tables = {r[0] for r in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'")}
        missing = [t for t in _REQUIRED_TABLES if t not in tables]
        if missing:
            raise BackupError(f"missing required tables: {missing}")
        out = {}
        for t in ("projects", "datasets", "snapshots", "profiles", "cleanings"):
            if t in tables:
                out[f"count_{t}"] = conn.execute(
                    f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        out["projects"] = [
            {"project_id": r[0], "name": r[1]}
            for r in conn.execute("SELECT project_id, name FROM projects")
        ]
        out["snapshots"] = [
            {"snapshot_id": r[0], "dataset_id": r[1], "fingerprint": r[2]}
            for r in conn.execute(
                "SELECT snapshot_id, dataset_id, fingerprint FROM snapshots")
        ]
        return out
    finally:
        conn.close()


def create_backup(root: str | Path, dest: str | Path) -> dict:
    """Full backup of a project root to a ZIP file. Returns the manifest."""
    root, dest = Path(root), Path(dest)
    src_db = root / "project.db"
    if not src_db.exists():
        raise BackupError(f"project.db not found in {root}")
    if dest.exists():
        raise BackupError(f"destination already exists: {dest}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    snapshots_dir = root / "snapshots"

    with tempfile.TemporaryDirectory(prefix="eda-backup-") as tmp:
        tmp_db = Path(tmp) / "project.db"
        # SQLite Backup API — consistent copy without raw file copy under WAL.
        src_conn = sqlite3.connect(str(src_db))
        dst_conn = sqlite3.connect(str(tmp_db))
        try:
            src_conn.backup(dst_conn)
        finally:
            src_conn.close()
            dst_conn.close()

        metadata = _read_metadata(tmp_db)
        manifest: dict = {
            "version": MANIFEST_VERSION,
            "created_at": _now_iso(),
            "project_db_sha256": _sha256_file(tmp_db),
            "counts": {k[6:]: v for k, v in metadata.items()
                       if k.startswith("count_")},
            "projects": metadata["projects"],
            "snapshots": metadata["snapshots"],
            "files": [{"name": "project.db",
                       "sha256": _sha256_file(tmp_db)}],
        }
        payloads: dict[str, Path] = {"project.db": tmp_db}
        if snapshots_dir.is_dir():
            for f in sorted(snapshots_dir.iterdir()):
                if f.is_file():
                    manifest["files"].append({
                        "name": f"snapshots/{f.name}",
                        "sha256": _sha256_file(f),
                    })
                    payloads[f"snapshots/{f.name}"] = f
        manifest_bytes = json.dumps(manifest, indent=2).encode()

        with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("manifest.json", manifest_bytes)
            for zip_name, path in payloads.items():
                zf.write(path, zip_name)
    return manifest


def restore_backup(archive: str | Path, dest_root: str | Path) -> dict:
    """Restore a backup ZIP to a NEW location. Returns the manifest.

    Dest must not exist or be an empty directory. Restore stages into a
    temp dir; only on successful validation is it installed at dest_root.
    Raises BackupError on any corruption/mismatch, leaving dest_root
    untouched (or absent).
    """
    archive, dest_root = Path(archive), Path(dest_root)
    if not archive.exists():
        raise BackupError(f"backup not found: {archive}")
    if dest_root.exists() and any(dest_root.iterdir()):
        raise BackupError(f"destination is not empty: {dest_root}")

    with tempfile.TemporaryDirectory(prefix="eda-restore-") as tmp:
        tmp_root = Path(tmp)
        try:
            with zipfile.ZipFile(archive) as zf:
                names = zf.namelist()
                if "manifest.json" not in names or "project.db" not in names:
                    raise BackupError("missing manifest.json or project.db")
                manifest = json.loads(zf.read("manifest.json"))
                for f in manifest.get("files", []):
                    if f["name"] not in names and f["name"] != "project.db":
                        raise BackupError(f"missing file in backup: {f['name']}")
                    data = zf.read(f["name"])
                    if _sha256_bytes(data) != f["sha256"]:
                        raise BackupError(f"checksum mismatch: {f['name']}")
                # Extract
                zf.extractall(tmp_root)
        except (zipfile.BadZipFile, json.JSONDecodeError) as e:
            raise BackupError(f"invalid backup archive: {e}") from e

        if manifest.get("version") != MANIFEST_VERSION:
            raise BackupError(
                f"unsupported manifest version: {manifest.get('version')}")
        staged_db = tmp_root / "project.db"
        if _sha256_file(staged_db) != manifest["project_db_sha256"]:
            raise BackupError("project.db checksum mismatch")
        _read_metadata(staged_db)  # schema check

        # Integrity check on staged DB.
        conn = sqlite3.connect(f"file:{staged_db}?mode=ro", uri=True)
        try:
            ok = conn.execute("PRAGMA integrity_check").fetchone()[0]
            if ok != "ok":
                raise BackupError(f"integrity_check failed: {ok}")
            fk = conn.execute("PRAGMA foreign_key_check").fetchall()
            if fk:
                raise BackupError(f"foreign_key_check failed: {len(fk)} rows")
        finally:
            conn.close()

        # Manifest snapshot count vs actual payload files (reconcile refs).
        actual = {p.name for p in (tmp_root / "snapshots").iterdir()} \
            if (tmp_root / "snapshots").is_dir() else set()
        for f in manifest["files"]:
            if f["name"].startswith("snapshots/") and \
                    f["name"].split("/")[-1] not in actual:
                raise BackupError(f"missing snapshot payload: {f['name']}")

        # Install to dest_root (original project untouched throughout).
        dest_root.mkdir(parents=True, exist_ok=True)
        (dest_root / "snapshots").mkdir(exist_ok=True)
        import shutil
        shutil.copy2(staged_db, dest_root / "project.db")
        for p in actual:
            shutil.copy2(tmp_root / "snapshots" / p,
                         dest_root / "snapshots" / p)
    return manifest
