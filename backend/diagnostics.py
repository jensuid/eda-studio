"""User-initiated diagnostic bundle — Doc15 §10, Doc16 M3 P2 (OBS-007).

Basic level contents (ZIP):
- `metadata.json` — app, bundle version, level, platform, python version
- `health.json` — SQLite integrity_check / foreign_key_check + table counts
- `recent_errors.json` — failed job events (command, message, no payloads)
- `manifest.json` — per-file SHA-256 + redaction summary

Mandatory safeguards (§10.3): no raw datasets/sample rows, no DB contents,
no credentials, absolute paths redacted to `<workspace>`. The bundle is
generated once, stored where the user asks, and never uploaded anywhere.
"""
from __future__ import annotations

import hashlib
import json
import re
import sqlite3
import sys
import zipfile
from datetime import UTC, datetime
from pathlib import Path

MANIFEST_VERSION = "1"

_COUNT_TABLES = ("projects", "datasets", "snapshots", "profiles",
                 "cleanings", "findings", "hypotheses", "jobs", "job_events")
_PATH_RE = re.compile(r"([A-Za-z]:\\(?:[^\s\"']+\\)*[^\s\"']*|/(?:[^\s\"'/]+/)+[^\s\"']*)")


class DiagnosticError(ValueError):
    pass


def _sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def _now_iso() -> str:
    return datetime.now(UTC).isoformat()


def _redact(obj, root: Path, counter: list[int]):
    """Recursively replace absolute workspace paths + any abs path."""
    root_str = str(root)
    if isinstance(obj, str):
        s = obj
        if root_str and root_str in s:
            counter[0] += s.count(root_str)
            s = s.replace(root_str, "<workspace>")
        s, n = _PATH_RE.subn("<path>", s)
        counter[0] += n
        return s
    if isinstance(obj, dict):
        return {k: _redact(v, root, counter) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_redact(v, root, counter) for v in obj]
    return obj


def _collect(root: Path) -> tuple[dict, dict, list]:
    db_path = root / "project.db"
    if not db_path.exists():
        raise DiagnosticError(f"project database not found: {db_path}")
    conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    try:
        integrity = [r[0] for r in conn.execute("PRAGMA integrity_check")]
        fk = [dict(r) for r in conn.execute("PRAGMA foreign_key_check")]
        tables = {r[0] for r in conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'")}
        counts = {}
        for t in _COUNT_TABLES:
            if t in tables:
                counts[t] = conn.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
        errors = [dict(r) for r in conn.execute(
            "SELECT e.state, e.message, j.command FROM job_events e "
            "JOIN jobs j ON j.job_id = e.job_id "
            "WHERE e.state = 'Failed' ORDER BY e.seq DESC LIMIT 50")]
    finally:
        conn.close()
    metadata = {
        "version": MANIFEST_VERSION,
        "created_at": _now_iso(),
        "level": "basic",
        "platform": sys.platform,
        "python_version": sys.version.split()[0],
        "app": "eda-workbench",
    }
    health = {
        "integrity_check": integrity,
        "foreign_key_violations": fk,
        "counts": counts,
    }
    return metadata, health, errors


def create_diagnostic_bundle(root: Path, dest: Path) -> dict:
    """Write a redacted basic diagnostic ZIP to `dest`. Returns manifest."""
    if dest.exists():
        raise DiagnosticError(f"destination already exists: {dest}")
    metadata, health, errors = _collect(root)

    counter = [0]
    files: dict[str, bytes] = {
        "metadata.json": json.dumps(_redact(metadata, root, counter), indent=2).encode(),
        "health.json": json.dumps(_redact(health, root, counter), indent=2).encode(),
        "recent_errors.json": json.dumps(_redact(errors, root, counter), indent=2).encode(),
    }
    redaction = {
        "paths_redacted": counter[0],
        "excluded": ["raw_datasets", "sample_rows", "database_contents",
                     "credentials", "prompts_and_conversations",
                     "personal_files", "absolute_paths"],
    }
    manifest = {
        "version": MANIFEST_VERSION,
        "created_at": metadata["created_at"],
        "level": metadata["level"],
        "files": [{"name": name, "sha256": _sha256_bytes(data)}
                  for name, data in sorted(files.items())],
        "redaction": redaction,
    }
    files["manifest.json"] = json.dumps(manifest, indent=2).encode()

    dest.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as zf:
        for name, data in sorted(files.items()):
            zf.writestr(name, data)
    manifest["path"] = str(dest)
    manifest["sha256"] = _sha256_bytes(dest.read_bytes())
    return manifest
