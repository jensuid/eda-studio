# Cross-Platform Compatibility Evidence (M3 P2)

Doc16 §4.3 exit criteria + §21.2: *"Packaging berhasil pada target OS"* dan
*"Setiap milestone membutuhkan cross-platform compatibility evidence."*

## Target matrix

| OS | Status | Evidence |
|----|--------|----------|
| macOS (Apple Silicon) | **Observed** (dev host, 2026-11-06) | pytest 70 passed, frontend build ok, backup/restore + diagnostic zip verified |
| Windows 10/11 | Needs CI run | `.github/workflows/ci.yml` matrix — runs on push after remote is set; no results yet |
| Linux (Ubuntu 22.04+) | Needs CI run | same workflow |

## CI matrix (`.github/workflows/ci.yml`)

Jobs per OS (`ubuntu-latest`, `windows-latest`, `macos-latest`):
- `backend`: pip install `.[dev]`, pytest, ruff, SBOM generation (Python 3.11 + 3.12 matrix).
- `frontend`: pnpm install --frozen-lockfile, tsc --noEmit, build.
- `benchmark`: `tools/benchmark.py 10000`, artifact `perf.json` per OS.

Local verification (2026-11-07, macOS) of every CI step passed:
pytest 70 passed, ruff clean, SBOM 16 components, benchmark 10k rows total 0.38s, tsc clean.
Actual remote runs are pending until this repo has a git remote.

## Per-platform procedure (run on each target)

1. Install deps: `uv sync --locked` (or `python -m pip install -r requirements.txt`).
2. Gates: `.venv/bin/python -m pytest -q` → all pass; `.venv/bin/ruff check backend tests tools` → clean.
3. Frontend: `pnpm install && pnpm run build` + `tsc --noEmit`.
4. Backup/restore roundtrip: create project → import CSV → `project.backup.create` → restore to new root → open restored project.
5. Diagnostic: `project.diagnostic.create` → unzip → verify `manifest.json` checksums + no absolute paths.
6. SBOM: `.venv/bin/python tools/generate_sbom.py` → `dist/sbom.json` + `checksums.txt`.
7. Record: date, OS/build, python version, commit hash, pass/fail per step in the table above.

Manual packaging/signing ( installer) requires a signed build host — not automatable in this repo; tracked as release-blocker in [release-checklist.md](release-checklist.md).
