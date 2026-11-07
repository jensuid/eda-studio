# Cross-Platform Compatibility Evidence (M3 P2)

Doc16 §4.3 exit criteria + §21.2: *"Packaging berhasil pada target OS"* dan
*"Setiap milestone membutuhkan cross-platform compatibility evidence."*

## Target matrix

| OS | Status | Evidence |
|----|--------|----------|
| macOS (Apple Silicon) | **Observed** (CI 2026-11-07 + dev host 2026-11-06) | CI: [run 42321701878](https://github.com/jensuid/eda-studio/actions/runs/42321701878) SHA `166dd18d0c134e7ff781b381021481cdfb0439b1` hijau (backend py311/312 + frontend + benchmark). Dev host: pytest 70 passed, frontend build ok, backup/restore + diagnostic zip verified |
| Windows 10/11 | **Observed** (CI 2026-11-07) | [run 42321701878](https://github.com/jensuid/eda-studio/actions/runs/42321701878) SHA `166dd18d0c134e7ff781b381021481cdfb0439b1` hijau 3 job (backend py311/312 + frontend + benchmark) |
| Linux (Ubuntu 22.04+) | **Observed** (CI 2026-11-07) | [run 42321701878](https://github.com/jensuid/eda-studio/actions/runs/42321701878) SHA `166dd18d0c134e7ff781b381021481cdfb0439b1` hijau 3 job |

> Catatan observasi: run 42321701878 dilaporkan hijau 3 OS oleh pemilik saat sesi 2026-11-07; run URL dapat diverifikasi langsung oleh pemilik di Actions. Root cause run sebelumnya merah (backend SBOM): `uv.lock` ter-`gitignore` — diperbaiki di `166dd18` (lockfile kini ter-track).

## CI matrix (`.github/workflows/ci.yml`)

Jobs per OS (`ubuntu-latest`, `windows-latest`, `macos-latest`):
- `backend`: pip install `.[dev]`, pytest, ruff, SBOM generation (Python 3.11 + 3.12 matrix).
- `frontend`: pnpm install --frozen-lockfile, tsc --noEmit, build, frontend SBOM (`tools/generate_frontend_sbom.py`, artifact `frontend-sbom-<os>.json`).
- `benchmark`: `tools/benchmark.py 10000`, artifact `perf.json` per OS.

Perbaikan P0-1 yang terverifikasi di CI hijau (run 42321701878, SHA `166dd18`):
1. `pnpm/action-setup@v4` diberi `version: 9` (selaras `frontend/pnpm-lock.yaml` lockfileVersion 9.0).
2. SBOM frontend ditambahkan (`tools/generate_frontend_sbom.py`, 122 komponen).
3. `uv.lock` kini ter-track (dulu `gitignore`) — root cause backend SBOM gagal.

Local verification (2026-11-07, macOS) of every CI step passed:
pytest 74 passed, ruff clean, SBOM 16 components, frontend SBOM 122 components, benchmark 10k rows total 0.38s, tsc clean.

## Per-platform procedure (run on each target)

1. Install deps: `uv sync --locked` (or `python -m pip install -r requirements.txt`).
2. Gates: `.venv/bin/python -m pytest -q` → all pass; `.venv/bin/ruff check backend tests tools` → clean.
3. Frontend: `pnpm install && pnpm run build` + `tsc --noEmit`.
4. Backup/restore roundtrip: create project → import CSV → `project.backup.create` → restore to new root → open restored project.
5. Diagnostic: `project.diagnostic.create` → unzip → verify `manifest.json` checksums + no absolute paths.
6. SBOM: `.venv/bin/python tools/generate_sbom.py` → `dist/sbom.json` + `checksums.txt`.
7. Record: date, OS/build, python version, commit hash, pass/fail per step in the table above.

Manual packaging/signing ( installer) requires a signed build host — not automatable in this repo; tracked as release-blocker in [release-checklist.md](release-checklist.md).
