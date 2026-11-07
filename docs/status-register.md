# Status Register — EDA Workbench

Terakhir diperbarui: 2026-11-07 — sesi pemulihan audit (Crouton Alpha)

## Handoff note (untuk session berikutnya — baca ini dulu)
- Posisi terakhir: P0-2 (K1/K2/K6) & P0-3 **done**, gate hijau (74 passed, ruff/tsc/gen clean), sudah di-commit.
- Kartu berikutnya: **P0-1** (git remote + CI observed) — **blocked: belum ada git remote** (`git remote -v` kosong per 2026-11-07); butuh URL remote dari pemilik sebelum bisa dikerjakan.
- Setelah P0-1: **P1-1** (ADR-003). Jangan mulai P2 sebelum P1-1 selesai.
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
| P0-1 | Git remote + CI observed | in_progress | gate §10 lokal hijau: 74 passed, ruff/tsc/gen clean | remote `jensuid/eda-studio` (dikonfirmasi pemilik 2026-11-07); fix 2 cacat CI (pnpm version:9, SBOM frontend); menunggu push + CI observed |
| P0-2a | K2 error leak | done | 74 passed, ruff clean | backend/ipc.py logging + pesan generik; tests/test_p0_fixes.py |
| P0-2b | K1 idempotency | done | 74 passed | tabel idempotency + dedup pre-dispatch; tests/test_p0_fixes.py |
| P0-2c | K6 generator fail-loud | done | regen diff kosong | tools/generate_types.py introspeksi model publik |
| P0-3 | Sinkron dokumen basi + untracked | done | — | final-roadmap.md, README-M1.md, status-register dibuat 2026-11-07 |
| P1-1 | ADR-003 Arrow/structure/Pyright | todo | — | — |
| P1-2 | Seq durable K4 + verify K5 | todo | — | — |
| P1-3 | Round-trip test + coverage | todo | — | — |
| P1-4 | Pyright strict | todo | — | — |
| P2-1 | tokens.css | todo | — | — |
| P2-2 | Shell+router+Job Client | todo | — | — |
| P2-3 | File dialog native | todo | — | — |
| P2-4 | Responsif 900/1440 | todo | — | — |
| P2-5 | A11y/visual automation | todo | — | — |
| P3-1 | Packaging/signing + beta | todo | — | manual |

Status: `todo` | `in_progress` | `done` | `blocked:<alasan>`
