# Release Checklist — M3 MVP Release Candidate (Doc16 §4.3, P0)

Checklist berbasis evidence. Status diisi dari gate yang benar-benar dijalankan.

## P0 Mandatory (harus selesai sebelum MVP RC)

- [x] Backup/restore roundtrip — `backend/backup_restore.py`, `tests/test_m3_backup_restore.py`
- [x] Dataset export CSV/Parquet — `backend/application.py::export_dataset`, `tests/test_m3_export.py`
- [x] HTML/PDF reporting — `dataset.report.generate` / `dataset.pdf.generate`, `tests/test_m3_report.py`, `tests/test_m3_pdf.py`
- [x] Provenance ≠ audit — `dataset.provenance`, SEC-012, `tests/test_m3_provenance.py`
- [x] Insight lifecycle — Finding/Hypothesis state machines, `tests/test_m3_insight.py`
- [x] Diagnostic bundle + redaction — `project.diagnostic.create`, `tests/test_m3_diagnostic.py`
- [x] SBOM + checksums — `tools/generate_sbom.py`, CycloneDX dari `uv.lock`
- [x] Performance envelope baseline — `tools/benchmark.py`, `tests/test_benchmark.py`
- [x] Cross-platform evidence — macOS observed locally + Windows/Linux via CI matrix hijau 3 OS ([run 42321701878](https://github.com/jensuid/eda-studio/actions/runs/42321701878), SHA `166dd18`, dilaporkan pemilik 2026-11-07; lihat [cross-platform-evidence.md](cross-platform-evidence.md), [`.github/workflows/ci.yml`](../.github/workflows/ci.yml))
- [ ] Packaging + signing installer — perlu build host bertanda tangan (manual; bukan kode). **Beta:** sengaja unsigned per keputusan pemilik 2026-11-07 (panduan tester: `docs/beta-unsigned-guidance.md`); signing wajib sebelum Stable.
  Verifikasi agent 2026-11-09 (HEAD `6a1a05a`): `pnpm --filter ./frontend build` sukses (13,97 dtk, hanya warning chunk-size); `tools/build_packaging.py --check-only` melaporkan blocker `pyinstaller not on PATH` — checker/manifest valid, kompilasi tetap butuh build host pemilik. Frontend siap dibundel.
- [x] Release compatibility documentation — target matrix + evidence di [cross-platform-evidence.md](cross-platform-evidence.md); operasional di [operational-runbook.md](operational-runbook.md)

## Gates terakhir (2026-11-09, macOS — HEAD `6a1a05a`)

- `pytest -q`: **287 passed**
- `ruff check backend tests`: **All checks passed**
- `tsc --noEmit`: clean
- `vite build`: sukses 13,97 dtk (warning chunk-size non-blocking)

## Sign-off rilis (P3-1, manual)

Packaging per-OS terdaftar: `desktop/eda-workbench.spec` (PyInstaller
BUILD-016/017) + `tools/build_packaging.py` (`--sign` butuh host bertanda
tangan; kredensial tidak di repo). Beta validation script:
[beta-validation-script.md](beta-validation-script.md) (7 skenario).
Dokumen ini **belum ditandatangani** — tanda tangan adalah langkah manual
pemilik setelah build bertanda tangan + 7 skenario lolos.

| Peran | Nama | Tanggal | Tanda tangan |
|---|---|---|---|
| Release owner | | | |
| Tester beta (≥2) | | | |

## Non-MVP (tidak masuk RC — sesuai §4.2)

AI integration, plugin marketplace, collaboration, cloud platform.
