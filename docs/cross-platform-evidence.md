# Cross-Platform Compatibility Evidence (M3 P2)

Doc16 §4.3 exit criteria + §21.2: *"Packaging berhasil pada target OS"* dan
*"Setiap milestone membutuhkan cross-platform compatibility evidence."*

## Target matrix

| OS | Status | Evidence |
|----|--------|----------|
| macOS (Apple Silicon) | **Observed** (dev host) | pytest 69 passed, frontend build ok, backup/restore + diagnostic zip verified |
| Windows 10/11 | Not yet run | — |
| Linux (Ubuntu 22.04+) | Not yet run | — |

## Per-platform procedure (run on each target)

1. Install deps: `uv sync --locked` (or `python -m pip install -r requirements.txt`).
2. Gates: `.venv/bin/python -m pytest -q` → all pass; `.venv/bin/ruff check backend tests tools` → clean.
3. Frontend: `pnpm install && pnpm run build` + `tsc --noEmit`.
4. Backup/restore roundtrip: create project → import CSV → `project.backup.create` → restore to new root → open restored project.
5. Diagnostic: `project.diagnostic.create` → unzip → verify `manifest.json` checksums + no absolute paths.
6. SBOM: `.venv/bin/python tools/generate_sbom.py` → `dist/sbom.json` + `checksums.txt`.
7. Record: date, OS/build, python version, commit hash, pass/fail per step in the table above.

Manual packaging/signing ( installer) requires a signed build host — not automatable in this repo; tracked as release-blocker in [release-checklist.md](release-checklist.md).
