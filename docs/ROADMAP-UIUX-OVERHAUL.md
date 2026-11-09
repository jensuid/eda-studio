# ROADMAP — UI/UX Overhaul Phase 1 (layak produk)

Roadmap eksekusi untuk memperbaiki menyeluruh UI/UX agar aplikasi layak
secara visual dan interaksi, setelah G6 PASS Phase 0 (`RATIF-SHELL-006`,
2026-11-08). Dibaca bersama `docs/SESSION-STATE.md` setiap sesi baru.

**Prinsip:** satu sesi = satu kartu. Urutan token dulu, lalu nav/900px,
lalu komponen, lalu copy/a11y, lalu QA. `tokens.css` aditif-only.
Kontrak kanonis: `docs/ux-contracts/shell/` v1.0 (21 keputusan ratified).

Status per kartu: `todo` | `in_progress` | `done`. Kartu `done` wajib
gate hijau + `file:line` bukti di `SESSION-STATE.md`.

---

## Fase 0 — Baseline (done di Phase 0)

Sudah selesai sebelum roadmap ini: hash router, Stepper 5 sinyal sah,
drawer override, per-concern errors, 8-state controls. Visual-token
migration **tidak** termasuk — itulah alasan user melihat "tidak ada
perubahan": Fase 1 di bawah belum dikerjakan. Bukti: `frontend/src/app/router.tsx:27-51`,
`frontend/src/shared/ui/Stepper.tsx:48-86`, `frontend/src/shared/controls.css:1-9`,
`frontend/src/shared/job/JobCenter.tsx:32-125`, `docs/shell-contracts/RATIFICATION-RECORD-RATIF-SHELL-006-2026-11-08.md:10-15`.

## Fase 1 — Token shell aditif (DS-SHELL-001 §2.4–§2.5)

### UIUX-01 — Token `--shell-font-*` aditif-only [done — 2026-11-09]

- **Kontrak:** `docs/ux-contracts/shell/DS-SHELL-001.md:80-138` (`D-DS1=A`,
  `D-DS3=A`).
- **File disentuh:** `frontend/src/shared/tokens.css` (hanya tambah baris),
  `tools/token_ownership_lint.py` (verifikasi — **tidak** diperluas, lihat
  SESSION-STATE §Bukti),
  `frontend/src/shared/tokens.ts` (**tidak diubah** — mirror canvas ECharts).
- **Tambahan:** `--shell-font-display:24px; --shell-font-title:18px;
  --shell-font-subtitle:15px; --shell-font-body:14px; --shell-font-caption:12px;`
  + `--shell-font-weight-*` (display **400**, title 600, lainnya 400 —
  per kontrak §2.5 `DS-SHELL-001.md:120-124`; koreksi atas angka roadmap 600
  untuk display) +
  `--shell-line-height-*` (display/title 1.4, subtitle/body/caption 1.5).
- **Acceptance:** `git diff frontend/src/shared/tokens.css` hanya tambah
  baris (18 tambah / 0 hapus); token lama `--font-size-sm:11px /
  -md:13px / -lg:15px` utuh (`frontend/src/shared/tokens.css:43-46`);
  lint `token_ownership_lint.py` hijau (token belum dikonsumsi — migrasi
  ownership di UIUX-02); gate §HARNESS-5 hijau (pytest 287 passed, ruff,
  tsc `-p frontend`, lint). Bukti: SESSION-STATE §Bukti/§Gate.
- **Blocked by:** harness commit (sesi ini, `490fffa`). **Done:** tanpa
  perubahan visual (token belum dipakai; UIUX-02 konsumennya).

### UIUX-02 — Ganti font shell ke `--shell-font-*` [done 2026-11-09, after UIUX-01]

- **Kontrak:** `docs/ux-contracts/shell/DS-SHELL-001.md:40-58` (§2.1
  24/18/15/14/12), §3 inventory R1–R7 (`docs/ux-contracts/shell/DS-SHELL-001.md:144-186`).
- **File disentuh:** `frontend/src/app/App.tsx` — **terbukti nol-edit** (tak ada
  `font-size` inline; semua ukuran di `tokens.css`),
  `frontend/src/shared/ui/Stepper.tsx` (`:74` chip → shell body 14),
  `frontend/src/shared/tokens.css` (hanya selektor shell; `:root` & token lama
  bit-perfect; 1 aturan aditif `.app-aside h2`).
- **Pekerjaan:** `body→body 14` (+lh 1.5), nav/banner/toast/job-list → body 14,
  section/caption dari `.app-aside h2` & `.recovery-banner h2` → title 18
  (600/1.4), versi → caption 12, **h1 app bar → subtitle 15 (400)** — koreksi atas
  frasa "h1 → display 24" di roadmap: kontrak §2.1 + §4 (`DS-SHELL-001.md:47-48`,
  `:163-165`) melarang judul display di app bar; display 24 reserved untuk judul
  ruang kerja R4 (belum ada di halaman shell). Bukti penuh di
  `docs/SESSION-STATE.md` §5.
- **Acceptance:** hierarki 1440 terbaca tanpa skala lama ✓; caption 12px
  kontras **7.24–7.58:1** (≥4.5:1) ✓; screenshot real-app
  `frontend/tests/__screenshots__/uiux-02-shell-1440.png` + `-900.png` ✓;
  gate hijau (pytest 287, ruff, tsc, lint, visual 16/16) ✓.

## Fase 2 — Nav 7 grup/9 item + 900px berlabel (SCREEN D-S1/D-S3)

### UIUX-03 — Nav 7 grup / 9 item + rail ~176px di 900px [todo, after UIUX-02]

- **Kontrak:** `docs/ux-contracts/shell/SCREEN-SHELL-001.md:111-132`
  (7 grup/9 item, Pembersihan sebelum Hubungan, utilities ke Tools);
  §3.2–§3.3 layout 900–1199px + pohon R1–R7.
- **File disentuh:** `frontend/src/app/App.tsx:69-80,134-145,292-293`,
  `frontend/src/app/router.tsx:27-36` (ROUTES 8 flat → 9 item),
  `frontend/src/shared/copy/shellCopy.ts:16-112`,
  `frontend/src/shared/tokens.css:441-451` (hapus `display:none .app-aside` /
  `.nav-label` di 900px).
- **Pekerjaan:** `<a href="#…">` + `aria-current="page"`, Cmd/Ctrl-click,
  label tidak pernah `display:none`; R5/R7 → drawer tunggal (sudah di
  `controls.css` override, satukan sumbernya).
- **Acceptance:** 900px: rail berlabel ~176px, toggle drawer selalu terlihat,
  `Esc` + focus-return; tidak ada `display:none` pada region berstatus;
  keyboard Tab R1→R7.

## Fase 3 — Komponen R3/R5/R4 (Stepper, CTA, JobCenter, DatasetCard)

### UIUX-04 — Stepper 14px/36px + CTA primer "Lanjut: …" [todo, after UIUX-03]

- **Kontrak:** FLOW §2.2 + DS §3 (CTA primer satu per layar).
- **File disentuh:** `frontend/src/shared/ui/Stepper.tsx:66-86,88-156`,
  `frontend/src/app/App.tsx` (R3).
- **Acceptance:** chip Stepper ≥36px target, font body 14;
  CTA primer satu per layar dengan copy `Lanjut: …`; Stage 6/7/10
  "Belum tersedia" tidak bisa diklik; Stage 8 tanpa stage.

### UIUX-05 — JobCenter jujur + DatasetCard [todo, after UIUX-04]

- **Kontrak:** DS §3 (Job item indeterminate berlabel, badge teks+warna),
  `frontend/src/shared/job/JobCenter.tsx:32-125` (sudah jujur, belum visual).
- **Pekerjaan:** samakan visual JobCenter dengan inventory (banner per
  concern, toast dedup correlation id); DatasetCard: nama + rows/cols +
  fingerprint 12 char + aksi cepat (jangan tabel teks saja).
- **Acceptance:** tidak ada "Belum ada job" palsu saat `loadFailed`
  (sudah `frontend/src/shared/job/JobCenter.tsx:85-125`); badge teks+warna;
  progress numeric hanya bila backend mengizinkan (D-F5).

## Fase 4 — Copy & a11y (Bahasa Indonesia, kontras)

### UIUX-06 — Copy tunggal + error branch [todo, after UIUX-05]

- **Kontrak:** `D-S2` (Bahasa Indonesia tunggal), `D-F7`.
- **File disentuh:** `frontend/src/shared/copy/shellCopy.ts`,
  `frontend/src/shared/copy/errorCopy.ts`, `frontend/src/app/App.tsx:59`
  (single `protocolError` → per-concern).
- **Acceptance:** tanpa ID dokumen internal / `error.message` mentah di
  headline; branching `error.code`; copy fitur menang atas shell.

### UIUX-07 — Audit a11y & kontras 5 level [todo, after UIUX-06]

- **Kontrak:** DS §3 8-state, §6 responsif; QA B5/B7.
- **Acceptance:** axe 0 critical 8 route; target ≥36px; kontras ≥4.5:1
  termasuk caption 12px/muted; skip link + focus-visible tetap.

## Fase 5 — QA visual & serah terima

### UIUX-08 — Tandai ulang baseline visual ≤5% + regression gate [todo, after UIUX-07]

- **Kontrak:** `docs/ux-contracts/shell/QA-SHELL-001.md:45-114` (B1–B12,
  visual ≤5% setelah baseline `D-S7=A`).
- **Acceptance:** baseline visual diregen (B10) di 900px + 1440px,
  8 route termasuk Readiness, mouse/keyboard/AT; `pytest` + `ruff` +
  `tsc --noEmit` hijau; setelah ini → arsip/hapus `prototypes/shell-v0/`.

---

## Urutan esensial & utang

Urutan ratified Phase 1: D-F5 (backend `JobEvent.progress`) → D-S8 →
D-F4 (project.open/recent) → D-F3 rehidrasi → sisa B11. Kartu visual
UIUX-01..08 di atas adalah jalur visual yang paralel; **bila menyentuh
progress numeric, berhenti sampai D-F5** — visual boleh jalan sendiri,
angka jangan.

Utang terbuka (jangan diperbaiki diam-diam): radius 4px vs 6px
(`DS-CORE-001`), konvergensi token lama post-RC (`D-DS5=A`), sisa copy
fitur B11, `columns` rehidrasi, `SHELL_COPY.resumeFailedPrefix`,
state-7 kondisional, Cmd+K Phase 2.
