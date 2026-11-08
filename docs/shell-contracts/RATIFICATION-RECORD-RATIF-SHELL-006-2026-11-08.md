# RATIF-SHELL-006 — Ratifikasi Putusan Formal G6 PASS (scope Phase 0)

**Tanggal:** 2026-11-08
**Keputusan PO:** **Opsi A — G6 PASS (scope Phase 0)**, dengan
pembatasan scope: PASS berlaku untuk **Phase 0 frontend-first** (`D-F8`);
backend/production **belum PASS**.

## Dasar putusan

1. **B1–B12 Confirmed** dengan bukti executable di
   [ADD-11-QA-ACCEPTANCE-RECORD-2026-11-08.md](ADD-11-QA-ACCEPTANCE-RECORD-2026-11-08.md)
   (manifest v6, 3/3 OK): Playwright **62/62 hijau** (seeded 11, routing 4,
   a11y 26, visual 16 @ ≤5% seeded, matrix 3, vertical 3), `pytest` 251
   passed, `ruff` bersih, `tsc --noEmit` OK, lint token-ownership hijau,
   file beku (`tokens.css`, `tokens.ts`, `generated.ts`) tak tersentuh.
2. **G5 PASS** sudah diformalkan PO lewat `RATIF-SHELL-005` (Opsi A).
3. **21 keputusan ratified, 0 Pending** (RATIF-SHELL-001…005) — tidak ada
   keputusan terbuka yang menghalangi G6.

## Konsekuensi

1. **`tokens.css` kini boleh disentuh dengan diff aditif murni**
   (`D-DS1`) — bukan perubahan non-aditif; lint
   `tools/token_ownership_lint.py` menjadi penjaga resmi.
2. **Phase 1 dibuka** menurut `D-F8` (backend-first): D-F5 `JobEvent`
   Pydantic extension, D-S8 `In Progress` pasca-`command`, D-F4
   `project.open`/recent (Beta), rehidrasi kolom D-F3, sisa B11.
3. Gap Phase 0 (rehidrasi `columns`, `SHELL_COPY.resumeFailedPrefix`,
   copy fitur B11, state-7 kondisional) menjadi **backlog Phase 1**,
   bukan halangan G6.

## Batasan eksplisit (bukan PASS)

- Job progress tetap **indeterminate** sampai D-F5 (`JobEvent.progress`).
- Tidak ada klaim PASS untuk: backend IPC nyata, Arrow IPC (ADR-003),
  packaging Tauri/pywebview asli, Cmd+K (Phase 2).
- Ratifikasi ini **bukan** tanda tangan digital dan **bukan** izin
  menyentuh `generated.ts` (tetap via `tools/generate_types.py`).
