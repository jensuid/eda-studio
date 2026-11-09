# SESSION-STATE — Posisi Sesi EDA Workbench

**Diperbarui:** 2026-11-09 · **HEAD terverifikasi:** `025ab12` (2026 saat sesi ini ditulis)
**File ini adalah satu-satunya status hari ini.** Sesi baru wajib baca ini pertama (lihat `AGENTS.md` §HARNESS-1).
Status kebijakan/ratifikasi tetap di `docs/status-register.md`; dokumen ini hanya mencatat progress kerja.

---

## 1. Status sesi

- **Fase:** Harness strengthening (AGENTS.md §HARNESS-1..6 + RUNBOOK) selesai; implementasi UI/UX Phase 1 **belum mulai**.
- **Kartu terakhir selesai:** HARNESS (`AGENTS.md`, `docs/RUNBOOK.md`) — bukti: `AGENTS.md` + `docs/RUNBOOK.md` di working tree (belum commit per penulisan ini → kartu harness belum `done` secara Git, lihat §Bukti).
- **Kartu berikutnya (`ready`):** `UIUX-01` — Token shell aditif `--shell-font-*` (detail di `docs/ROADMAP-UIUX-OVERHAUL.md`).
- **Sesi aktif:** tidak ada (file ini ditulis sebagai penutup sesi harness). Sesi berikutnya wajib mengisi §Sesi aktif sebelum mengedit file produk.

## 2. Next action (untuk sesi berikut, tanpa membaca chat)

1. Commit harness ini atomik bila belum: `git add AGENTS.md docs/RUNBOOK.md docs/SESSION-STATE.md docs/ROADMAP-UIUX-OVERHAUL.md docs/PROMPT-RESUME.md` + gate §Gate terakhir.
2. Ambil `UIUX-01` (Fase 1): baca `docs/ux-contracts/shell/DS-SHELL-001.md` §2.4–§2.5 + `frontend/src/shared/tokens.css:43-52,66,257-314,441-451` + `tools/token_ownership_lint.py`. Tambahkan token `--shell-font-*` aditif-only, jalankan gate, update file ini, commit satu kartu.
3. Bila `UIUX-01` menemukan konflik kontrak (mis. radius, kontras), berhenti & tanya PO — jangan timpa kontrak ratified.

## 3. Sesi aktif (isi sebelum mulai edit produk)

```
Harness/model: <isi>
Kartu diambil: <isi, mis. UIUX-01>
Scope file: <daftar file yang akan disentuh>
Tujuan sesi: <satu kalimat>
```

## 4. Gate terakhir

- Gate harness (2026-11-09, sesi ini): `pytest` **287 passed** (8.61s) · `ruff` All checks passed · `tsc --noEmit` exit 0 · `tools/token_ownership_lint.py` OK ("no hex/font-size/font-weight literals outside token files"). Working tree sebelum commit: `M AGENTS.md` + `docs/RUNBOOK.md`, `docs/SESSION-STATE.md`, `docs/ROADMAP-UIUX-OVERHAUL.md`, `docs/PROMPT-RESUME.md` (untracked files `prototypes/`, `.workbuddy-ai/`, `notes/evaluasi-workbuddy/` tidak disentuh).
- Gate produk terakhir (konteks, bukan gate sesi ini): G6 PASS Phase 0 2026-11-08 (`RATIF-SHELL-006`): Playwright 62/62, pytest 251, ruff/tsc OK — sumber: `docs/shell-contracts/RATIFICATION-RECORD-RATIF-SHELL-006-2026-11-08.md:10-15`.

## 5. Bukti (`file:line` wajib)

- `AGENTS.md` §HARNESS-1..6 (bootstrap, precedence, disiplin, konten, gate, handoff) dibuat sesi ini.
- `docs/RUNBOOK.md` §1–§6 (resume → handoff + paralel) dibuat sesi ini.
- `docs/ROADMAP-UIUX-OVERHAUL.md` (Fase 0–5, kartu UIUX-01..UIUX-08) dibuat sesi ini.
- `docs/PROMPT-RESUME.md` (satu paste untuk sesi baru) dibuat sesi ini.
- Kontrak kanonis shell terverifikasi: `docs/ux-contracts/shell/README.md:1-22` (v1.0 Ratified 2026-11-08, 21 keputusan, G6 PASS Phase 0).
- Aturan aditif-only saat ini: `docs/shell-contracts/RATIFICATION-RECORD-RATIF-SHELL-006-2026-11-08.md:22-30` (`tokens.css` aditif murni, Phase 1 dibuka D-F5 → D-S8 → D-F4 → D-F3 rehidrasi → sisa B11). Angka token lama yang belum diubah: `frontend/src/shared/tokens.css:43-46`.

## 6. Batasan terbuka (Bukan PASS)

- Job progress tetap indeterminate sampai backend D-F5 (`JobEvent.progress`) — jangan karang numeric di frontend.
- Cmd+K Phase 2 (sudah ada `CommandPalette.tsx`, belum PASS).
- Arrow IPC ADR-003 belum diterapkan (cap preview ≤200 / scatter ≤1500 / bin ≤30).
- Utang radius `--radius-sm:4px` vs `DS-CORE-001:6px` tunggu amandemen — jangan diubah diam-diam.
- `prototypes/shell-v0/` DISPOSABLE — bukan bukti PASS; akhiri dengan arsip/hapus setelah Phase 1 visual selesai.

## 7. Larangan pengisian

- Jangan mengedit arsip `docs/shell-contracts/` untuk meng-update status sesi. Status sesi hanya di file ini + roadmap.
- Jangan menandai kartu `done` tanpa gate hijau + `file:line` bukti.
- Jangan meninggalkan `in_progress` tanpa commit.
