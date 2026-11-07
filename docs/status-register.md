# Status Register — EDA Workbench

Terakhir diperbarui: 2026-11-07 — sesi pemulihan audit (Crouton Alpha)

## Handoff note (untuk session berikutnya — baca ini dulu)
- Posisi terakhir: P1-1 **done** (2026-11-07). ADR-003 Accepted (`docs/ADR-003.md`): IPC JSON + cap (preview ≤200, scatter ≤2000, bin ≤30), Arrow IPC dinyatakan belum diterapkan, deviasi flat-modules dicatat, Pyright diputuskan di P1-4. Gate §10 hijau lokal (74 passed, ruff/tsc/gen clean).
- Kartu berikutnya: **P1-2** (Seq durable K4 + verify K5). Jangan mulai P2 sebelum P1-1 selesai — P1-1 selesai, lanjut P1-2.
- Catatan auth sesi ini: `gh` di shell agent masih invalid; push dilakukan manual oleh pemilik. Untuk sesi berikutnya, pemilik jalankan push manual bila agent tidak dapat push.
- Prompt resume session baru: "Baca `docs/status-register.md`, ambil kartu `todo` pertama dari `docs/REMEDIATION-PLAN.md`, kerjakan, jalankan gate §10, update status register. Jangan mulai kartu kedua sebelum kartu pertama `done`."
- Aturan titik bersih: berhenti hanya pada kartu `done` dengan bukti gate; jangan tinggalkan `in_progress` tanpa commit.

## Artifact status (Doc12 §Versioning)
| Artifact ID | Nama | Status | Ratifikasi PO | Lokasi |
|---|---|---|---|---|
| JOB/SCREEN/DS/QA-PROF-001 | Profiling | Approved | 2026-11-05 | docs/ux-contracts/profiling/ |
| JOB/SCREEN/DS/QA-HIST-001 | Histogram | Approved | 2026-11-06 | docs/ux-contracts/histogram/ |
| JOB/SCREEN/DS/QA-QUAL-001 | Quality | Approved | 2026-11-06 | docs/ux-contracts/quality/ |
| JOB/SCREEN/DS/QA-BIVAR-001 | Bivariate | Approved | 2026-11-06 | docs/ux-contracts/bivariate/ |
| JOB/SCREEN/DS/QA-REPORT-001 | Reporting | Approved | 2026-11-06 | docs/ux-contracts/reporting/ |
| JOB/SCREEN/DS/QA-PDF-001 | PDF export | Approved | 2026-11-06 | docs/ux-contracts/reporting/ |
| JOB/SCREEN/DS/QA-CLEAN-001 | Cleaning | Approved | 2026-11-06 | docs/ux-contracts/cleaning/ |

## Kartu tugas (lihat docs/REMEDIATION-PLAN.md)
| ID | Judul | Status | Bukti gate | Catatan |
|---|---|---|---|---|
| AUDIT-2026-11-07 | Audit report | done | — | docs/AUDIT-2026-11-07-REPORT.md |
| REMED-2026-11-07 | Remediation plan | done | — | docs/REMEDIATION-PLAN.md |
| P0-1 | Git remote + CI observed | done | CI hijau 3 OS: [run 42321701878](https://github.com/jensuid/eda-studio/actions/runs/42321701878) SHA `166dd18`; gate §10 lokal hijau: 74 passed, ruff/tsc/gen clean | remote `jensuid/eda-studio`; fix 2 cacat CI (pnpm version:9, SBOM frontend 122 komponen) + root cause SBOM backend (`uv.lock` kini ter-track, commit `166dd18`); bukti di `docs/cross-platform-evidence.md` |
| P0-2a | K2 error leak | done | 74 passed, ruff clean | backend/ipc.py logging + pesan generik; tests/test_p0_fixes.py |
| P0-2b | K1 idempotency | done | 74 passed | tabel idempotency + dedup pre-dispatch; tests/test_p0_fixes.py |
| P0-2c | K6 generator fail-loud | done | regen diff kosong | tools/generate_types.py introspeksi model publik |
| P0-3 | Sinkron dokumen basi + untracked | done | — | final-roadmap.md, README-M1.md, status-register dibuat 2026-11-07 |
| P1-1 | ADR-003 Arrow/structure/Pyright | done | gate §10 lokal hijau 2026-11-07: 74 passed, ruff clean, tsc clean, gen diff kosong | `docs/ADR-003.md` Accepted (format ADR-001/002); AGENTS.md footnote ADR-003; klaim terverifikasi via grep (cap di contracts.py:118/288, bivariate.py:24, histograms.py:22; pyarrow hanya Parquet/CSV internal; pyright nol); Pyright diputuskan di P1-4 |
| P1-2 | Seq durable K4 + verify K5 | done | commit 1fb5f4d (P1-1) | gate §10 lokal hijau: pytest 80 passed (6 test baru `tests/test_p1_seq_snapshot.py`), ruff ✅, tsc ✅, generator ✅. K4: `JobManager.__init__` seed `_seq` dari `Store.max_event_seq()` + guard anti-regresi. K5: kolom `snapshots.file_fingerprint` (migrasi ALTER TABLE, baris lama NULL → verify dilewati) karena fingerprint import = hash source-bytes ≠ hash file Parquet; verify-on-read strict/non-strict; strict di export/report/pdf; `ConflictError` pindah ke `persistence.py` (diekspor ulang application, ipc tak berubah). |
| P1-3 | Round-trip test + coverage | done | gate §10 hijau 2026-11-07: pytest 151 passed (71 test baru `tests/test_contracts_roundtrip.py`), ruff ✅, tsc ✅, gen diff kosong | coverage baseline backend 91% total (target awal ≥70% terpenuhi; `contracts.py` 100%, terendah `pdf_renderer.py` 42%) via `pytest --cov=backend --cov-report=term-missing` (CI kini menjalankan cov report, tanpa fail-under); round-trip: stub TS non-kosong per MODELS, model tak-terdaftar gagal gate, `Request→dump→Request` + payload round-trip untuk 18 perintah & 10 query, `Response` selalu tepat satu dari `{data, error}`; `pytest-cov` masuk dev deps (uv.lock belum diregen di sesi ini — sandbox; CI install via pip, SBOM dari lock lama tetap hijau) |
| P1-4 | Pyright strict | done | gate §10 hijau 2026-11-07: pytest 151 passed, ruff ✅, tsc ✅, gen diff kosong (tak ada perubahan kode backend) | Keputusan: **Pyright strict ditunda ke M4** (alternatif sah kartu) — amandemen ADR-003 (`docs/ADR-003.md` Decision 3): pyright 1.1.414 strict pada `backend/` = **1.288 error** (17 file/4.246 baris), dominan Unknown karena pyarrow inti + openpyxl + reportlab tanpa `py.typed`; basic = 80 error (74 akses atribut dinamis `BaseModel` di dispatch `ipc.py`). Revisit trigger: pyarrow bertipe atau strict bertahap dari `contracts.py`; tracking di register ini. `pyright` terinstal hanya di `.venv` lokal untuk penilaian (tidak di `pyproject`/CI). Utang `uv.lock` pytest-cov dari P1-3 tak tersentuh (P1-4 tanpa dev dep baru). |
| P2-1 | tokens.css | done | gate §10 hijau: pytest 151 passed, ruff ✅, tsc ✅, gen diff kosong; `vite build` ✅ (css 2,30 kB) | `frontend/src/shared/tokens.css` (baru, satu-satunya .css) di-import `main.tsx`; semua token kartu (surface/raised/border/text/muted, status 3, chart scatter+heat, space 4/8/12/16/24/32, radius 4/8, font 11/13/15, duration 150ms + `prefers-reduced-motion`→0, kontras teks ≥4,5:1, badge teks+warna); verifikasi klaim: hex/rgb liar = 0 di TSX (klaim "hapus inline hex" terpenuhi trivially), yang ada = inline numeric (padding:24, borderRadius:8, fontSize:11) + 8 className yatim (surface-raised, border-subtle, status-danger, cleaning-stale/impact/operation-id/danger-dialog, dialog-overlay) → kini definisi nyata di tokens.css; `style=` tersisa 0. Deviasi kartu: (1) tambah `frontend/src/shared/tokens.ts` — ECharts canvas tak bisa konsumsi var() untuk angka/warna, dimirror via konstanta numeric (FONT_SIZE_SM=11, CHART_TITLE_SIZE=14) + `cssVar()` baca warna chart dari :root (scatter itemStyle, heatmap visualMap inRange=surface→heat-cell; tanpa hex di TS); (2) histogram bar & judul chart 14px dipertahankan nilainya (tak ada token bar di kartu; judul via konstanta) agar visual tak berubah; (3) `minWidth:320`/`maxHeight:200` dipindah ke kelas CSS di tokens.css (tetap literal, terpusat); rename overlay `cleaning-danger-dialog`→`dialog-overlay` karena className lama dipakai di overlay sekaligus panel (konflik definisi). |
| P2-2 | Shell+router+Job Client | todo | — | — |
| P2-3 | File dialog native | todo | — | — |
| P2-4 | Responsif 900/1440 | todo | — | — |
| P2-5 | A11y/visual automation | todo | — | — |
| P3-1 | Packaging/signing + beta | todo | — | manual |

Status: `todo` | `in_progress` | `done` | `blocked:<alasan>`
