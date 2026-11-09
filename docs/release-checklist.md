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

## Sign-off rilis (digital — B+C, 2026-11-09)

**B. Persetujuan digital** — Workflow `Release gate` (`.github/workflows/release-gate.yml`,
manual dispatch: `version` + `tag`): job `verify` (pytest + ruff + verifikasi tanda
tangan tag) → job `approve` menunggu persetujuan di GitHub **Environment `release`**
(`required reviewers`, tercatat otomatis dengan akun + timestamp) → job `record`
menulis ringkasan ke job summary. Setup satu kali oleh pemilik: *Settings →
Environments → `release` → Required reviewers* (konfigurasi repo, bukan kode).

**C. Signed tag** — `tools/sign_release_tag.sh vX.Y.Z` (fail-closed: working tree
bersih, tag belum ada, HEAD sudah ter-push, `tag.gpgsign=true`): membuat annotated
signed tag (SSH/GPG) di HEAD, push, lalu verifikasi. Kunci signer harus terdaftar
di akun GitHub sebagai signing key. Tag membuktikan *siapa pembuat tag* — bukan
persetujuan rilis (itu tugas B).

**A. Code signing biner** — **ditunda ke Stable, non-blocking untuk Beta**
(keputusan pemilik 2026-11-07; kredensial Apple/Azure ±US$99/th / ±US$120/th).
Beta dirilis unsigned per [beta-unsigned-guidance.md](beta-unsigned-guidance.md);
workflow rilis tidak memuat signing apa pun.

| Peran | Mekanisme | Tercatat |
|---|---|---|
| Release owner | Approve Environment `release` di GitHub | akun + timestamp run otomatis |
| Tester beta (≥2) | Beta validation script | hasil di GitHub Issues `beta-feedback` |

**Bukti run pertama (2026-11-09)**: tag bertanda tangan `v0.1.0-beta` → SHA `07cc04f`; workflow *Release gate* [run 42560863442](https://github.com/jensuid/eda-studio/actions/runs/42560863442): verify ✅ (pytest+ruff+`git tag -v` terverifikasi di runner via allowed signers dari input) → approve ✅ oleh required reviewer → record ✅. Ini membuktikan gate digital B+C berfungsi end-to-end. HEAD rilis berikutnya: buat tag dari HEAD terbaru (saat ini `756d529`).

Dokumen ini tidak lagi ditandatangani manual — persetujuan digital di GitHub
 menggantikan tanda tangan konvensional.

## Non-MVP (tidak masuk RC — sesuai §4.2)

AI integration, plugin marketplace, collaboration, cloud platform.
