# Kontrak Shell — Status Ratified (2026-11-08)

Folder ini adalah **kanonis ratified** untuk lapisan shell EDA Workbench, diterbitkan ulang sebagai **v1.0** lewat `RATIF-SHELL-005` (arsip DRAFT bertanda tangan: `docs/shell-contracts/`).

| ID | Lapisan | Gate | Status |
|---|---|---|---|
| [APP-ARCH-001](APP-ARCH-001.md) | Application Architecture | — | v1.0 Ratified 2026-11-08 |
| [JOB-SHELL-001](JOB-SHELL-001.md) | Job Contract | G1 Considered complete | v1.0 Ratified 2026-11-08 |
| [FLOW-SHELL-001](FLOW-SHELL-001.md) | Flow Contract | G2 Considered complete | v1.0 Ratified 2026-11-08 |
| [SCREEN-SHELL-001](SCREEN-SHELL-001.md) | Screen & Interaction | G3 Considered complete | v1.0 Ratified 2026-11-08 |
| [DS-SHELL-001](DS-SHELL-001.md) | Design System & Component | G4 Considered complete | v1.0 Ratified 2026-11-08 |
| [QA-SHELL-001](QA-SHELL-001.md) | Acceptance & Validation | G6 **FAIL by default** (bukti B1–B12 Belum ada) | v1.0 Ratified 2026-11-08 |

**Putusan formal:** G5 **PASS** oleh PO (`RATIF-SHELL-005`, Opsi A). Total **21 keputusan ratified, 0 Pending** (RATIF-SHELL-001…005).

**Pendamping otoritatif (disalin dari arsip):** [POST-SIGNATURE-ADDENDUM-2026-11-08.md](POST-SIGNATURE-ADDENDUM-2026-11-08.md) (Add-01…Add-10) · [G5-CRITIC-REPORT-2026-11-08.md](G5-CRITIC-REPORT-2026-11-08.md).

**Batasan yang masih berlaku:**
- `frontend/src/shared/tokens.css` **tetap beku** sampai G6 (bukti B9/B10); `git diff` `tokens.css` harus aditif murni (`D-DS1`).
- Izin kode terbatas **Phase 0 frontend-only** (`D-F8`); Phase 1 butuh otorisasi PO terpisah.
- Bukti B1–B12 **Belum ada** — test yang tidak dijalankan bukan PASS.
- Record ratifikasi: `docs/shell-contracts/RATIFICATION-RECORD-RATIF-SHELL-005-2026-11-08.md`; manifest integritas v5: `docs/shell-contracts/SIGNATURE-MANIFEST-RATIF-SHELL-005-2026-11-08.sha256`.
