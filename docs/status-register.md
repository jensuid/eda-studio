# Status Register — EDA Workbench

Terakhir diperbarui: 2026-11-07 — sesi pemulihan audit (Crouton Alpha)

## Handoff note (untuk session berikutnya — baca ini dulu)
- Posisi terakhir: P0-1 **blocked:auth GitHub** (commit lokal `20b1bc8`, belum ter-push). Kerja lokal P0-1 selesai: remote `jensuid/eda-studio` terpasang, 2 cacat CI diperbaiki, gate §10 hijau (74 passed). `git push` gagal karena `gh` token invalid per 2026-11-07 — butuh pemilik jalankan `gh auth login`, lalu push & amati CI.
- Kartu berikutnya: lanjutan **P0-1** — push + CI observed + tulis run URL ke `cross-platform-evidence.md`, baru `done`. Jangan mulai kartu kedua sebelum P0-1 `done`.
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
| P0-1 | Git remote + CI observed | blocked:auth GitHub | gate §10 lokal hijau: 74 passed, ruff/tsc/gen clean (commit 20b1bc8) | remote `jensuid/eda-studio` terpasang; fix 2 cacat CI done (pnpm version:9, SBOM frontend `tools/generate_frontend_sbom.py` 122 komponen); `git push` gagal: gh token invalid (2026-11-07), butuh `gh auth login` / PAT; setelah push, tunggu CI + tulis run URL ke `cross-platform-evidence.md` |
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
