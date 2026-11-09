# RUNBOOK — Workflow Harness EDA Workbench

File ini adalah SOP operasional agar implementasi bisa dilanjutkan lintas
sesi, lintas harness (DSH/Claude/Codex/manusia), dan lintas model tanpa
mengandalkan ingatan chat. Konteks bertumpu pada file, bukan pada
ringkasan model.

Urutan baca selalu: `docs/SESSION-STATE.md` → file ini → roadmap kartu →
kontrak kanonis. Lihat `AGENTS.md` §HARNESS-1 untuk bootstrap 5 menit.

---

## 1. Resume (5 menit, sesi baru / model baru / harness baru)

1. Baca `docs/SESSION-STATE.md` §Status sesi + §Gate terakhir. Catat HEAD,
   next card, dan apakah ada pekerjaan `wip:` yang belum selesai.
2. Baca `docs/RUNBOOK.md` (file ini) §2–§4 untuk protokol kerja.
3. Baca `docs/ROADMAP-UIUX-OVERHAUL.md` kartu next (scope, file disentuh,
   acceptance, dependensi). Tetapkan `in_progress` hanya untuk 1 kartu.
4. Verifikasi lingkungan dalam ≤10 perintah, jangan melebihi 15 menit:
   ```bash
   pwd && git log --oneline -5 && git status --short
   .venv/bin/python -m pytest -q        # verifikasi gate terakhir masih hijau
   git diff --stat
   ```
5. Cek bau konflik: bila HEAD berbeda dari `SESSION-STATE.md` §HEAD, atau
   kartu `in_progress` di roadmap tidak sesuai `SESSION-STATE.md`, berhenti
   dan sinkronkan file-file itu dulu. Jangan ambil kartu baru.
6. Konfirmasi ke user/PO dalam satu kalimat: kartu apa yang diambil,
   file apa yang akan disentuh, gate apa yang akan dijalankan.

## 2. Implement (satu kartu, file-scope sempit)

1. Ambil kartu `ready` terkecil di roadmap. Jangan melompati dependensi
   (mis. Fase 1 token sebelum Fase 2 nav/900px).
2. Scope file ditulis dulu di `SESSION-STATE.md` §Status sesi (`file:`).
   Bila file disentuh di luar scope → tambah ke `SESSION-STATE.md` sebelum
   mengubahnya. Ini menjaga sesi paralel dengan file disjoint.
3. Atur file yang dilarang (AGENTS.md §HARNESS-4): jangan hand-edit
   `frontend/src/shared/ipc/generated.ts`, jangan tambahkan token warna
   baru, jangan karang progress numeric, jangan edit arsip
   `docs/shell-contracts/`.
4. Setelah implement: catat `file:line` bukti di `SESSION-STATE.md` §Bukti.
   Klaim tanpa `file:line` tidak dipercaya sesi berikut.
5. Bolehkan satu pertanyaan klarifikasi yang berarti (seperti min window,
   urutan nav, atau locale) — jangan ajukan pertanyaan retoris. Gunakan
   `ask_user_question` tools bila ada konflik kontrak yang ambiguous.

## 3. Verify (gate per kartu, wajib sebelum `done`)

Jalankan persis gate di `AGENTS.md` §HARNESS-5:

```bash
.venv/bin/python -m pytest -q
.venv/bin/ruff check backend tests
npx tsc --noEmit
.venv/bin/python tools/token_ownership_lint.py
git diff --stat
```

- Semua hijau → maju ke §4.
- Gagal satu → kartu tetap `in_progress`, tulis perintah + output ke
  `SESSION-STATE.md` §Gate terakhir, jangan `done`. Inline issue kecil boleh
  diperbaiki; klaim perbaikan harus disertakan bukti gate ulang.
- Bukti visual (QA-SHELL-001 B1–B12): bila menyentuh CSS/layout, sertakan
  screenshot Playwright real-app (desktop 1440 + 900), bukan mockup
  `prototypes/shell-v0/`. Mockup tidak pernah PASS.

## 4. Commit (atomik, satu kartu satu commit)

1. `git status --short` — pastikan file yang disentuh = scope kartu + 2 file
   state (`docs/SESSION-STATE.md`, `docs/ROADMAP-UIUX-OVERHAUL.md`).
2. `git add <file-kartu> docs/SESSION-STATE.md docs/ROADMAP-UIUX-OVERHAUL.md`
3. Pesan commit: `<kartu>: <ringkasan>` + baris bukti. Contoh:
   `UIUX-01: tambah token shell aditif (--shell-font-*)` lalu bullet
   `Gate: pytest/ruff/tsc/lint hijau; Bukti: frontend/src/shared/tokens.css:43-52`.
4. Push bila diminta: `GH_CONFIG_DIR=<repo>/.gh-config git -c credential.helper='!/usr/local/bin/gh auth git-credential' push origin main`
5. Tandai kartu `done` di roadmap dengan tanggal + hash commit pendek.

## 5. Handoff tutup sesi (checklist wajib sebelum akhir)

- [ ] `docs/SESSION-STATE.md` diperbarui: HEAD, status sesi, kartu
      selesai/berlangsung, bukti `file:line`, gate terakhir.
- [ ] `docs/ROADMAP-UIUX-OVERHAUL.md` kartu ditandai (`done`/`in_progress`).
- [ ] Commit atomik §4 (atau `wip:` bila berhenti di tengah — sesi berikut
      wajib selesaikan/rollback kartu itu dulu).
- [ ] Ringkasan satu paragraf untuk user: apa yang selesai (dengan hash),
      apa yang menunggu, apa yang tidak diklaim (bila ada).
- [ ] Jangan tinggalkan `in_progress` tanpa commit. Jangan mengandalkan
      konteks chat — file adalah satu-satunya handoff.

## 6. Multi-session paralel

- Dua harness boleh jalan serentak hanya bila scope file disjoint
  (mis. sesi A `tokens.css`, sesi B `Stepper.tsx`). Koordinasi lewat
  `docs/SESSION-STATE.md` §Sesi aktif — tulis nama harness/model + scope
  sebelum mulai.
- Backend (`backend/`) dan frontend (`frontend/src/`) **tidak** diubah
  serentak tanpa koordinasi. Bila ada konflik kontrak → berhenti & tanya PO
  (stop rule `02-framework.md`), jangan timpa.
- Bila dua sesi menabrak file yang sama: yang `git status` duluan menang;
  yang kedua berhenti, rebase, baca ulang `SESSION-STATE.md`, lanjutkan.
