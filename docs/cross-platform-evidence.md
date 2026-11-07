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

## P3-1 final (2026-11-07, Beta)

Config packaging per-OS kini terdaftar di repo: PyInstaller spec
`desktop/eda-workbench.spec` (BUILD-016/017: `BUNDLE` di macOS, `COLLECT`
di Windows/Linux; frontend/dist dibundel, runtime aplikasi terkontrol
BUILD-002/015) + build script `tools/build_packaging.py`
(`--check-only` / unsigned / `--sign` via env `EDA_SIGN_IDENTITY` /
`EDA_SIGN_THUMBPRINT` + notarisasi macOS). Build bertanda tangan tetap
**blocker manual** — kredensial signing tidak masuk repo (Doc14 §6) dan
tidak ada build host bertanda tangan di lingkungan ini; unsigned build
saja yang dapat diverifikasi dari sini.

Dokumen beta (P3-1 langkah 2–3): [beta-validation-script.md](beta-validation-script.md)
(7 skenario end-to-end + kanal feedback GitHub Issues `beta-feedback`),
[release-notes-template.md](release-notes-template.md),
[bug-report-template.md](bug-report-template.md). Checklist rilis mendapat
blok sign-off pemilik di [release-checklist.md](release-checklist.md)
(belum ditandatangani — menandatangani adalah langkah manual pemilik).

## Build artefak Beta unsigned — macOS (2026-11-07, sesi lanjutan)

Artefak dibangun di dev host macOS via `python tools/build_packaging.py`
(unsigned): `dist/EDA Workbench.app` (9,1 MB), `codesign -dv` →
`Identifier=com.jensuid.eda-workbench`, tanpa Developer ID (unsigned,
sesuai keputusan pemilik 2026-11-07).

Smoke test skenario 1: app diluncurkan dari artefak → data root
`~/.eda-workbench/projects/` dibuat dengan `project.db` (+ `-shm`/`-wal`)
dan `snapshots/` → bridge `make_bridge` terinisialisasi tanpa error.
Validasi tester penuh (skenario 2–7) tetap tugas pemilik per
[beta-validation-script.md](beta-validation-script.md).

Tiga fix build-enabling sesi ini (sebelumnya flow belum pernah jalan):
1. `tools/build_packaging.py`: `build_frontend()` menjalankan pnpm di
   repo root (tanpa lockfile) — diperbaiki ke `cwd=frontend/`.
2. `desktop/eda-workbench.spec`: `Path(SPECPATH).parent.parent` menghitung
   root satu level di luar repo — diperbaiki ke `.parent`.
3. `frontend/pnpm-workspace.yaml`: `allowBuilds: esbuild: true` —
   pnpm 11 memblokir build scripts secara default (menimpa pemblokir
   `pnpm approve-builds`).

Windows/Linux: artefak belum dibangun (perlu host masing-masing OS;
PyInstaller tidak cross-compile). CI hijau di 3 OS tetap bukti runtime
(lihat baris matrix di atas).
