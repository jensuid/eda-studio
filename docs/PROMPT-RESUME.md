# PROMPT-RESUME — Satu paste untuk sesi baru (model/harness baru)

Salin seluruh blok di bawah ke sesi/konteks baru. Jangan membaca riwayat
chat. Jereknya adalah `AGENTS.md` §HARNESS-1 + file-file baca-pertama.

---

```text
Kamu melanjutkan EDA Workbench di /Volumes/JensData/Jensu-Projects/eda-new-project/eda-studio
tanpa riwayat chat. Baca dulu urut ini sebelum tool selain read:

1. docs/SESSION-STATE.md      — posisi, next card, gate terakhir, HEAD
2. docs/RUNBOOK.md            — SOP resume → implement → gate → commit → handoff
3. docs/ROADMAP-UIUX-OVERHAUL.md — backlog UIUX-01..UIUX-08 (satu sesi = satu kartu)
4. docs/status-register.md    — status ratifikasi PO (kebijakan)
5. docs/ux-contracts/shell/README.md — kontrak kanonis v1.0 (jangan edit docs/shell-contracts/)

 lalu jalankan: pwd; git log --oneline -5; git status --short

Tugas kamu: ambil kartu ready terkecil dari ROADMAP (saat ini UIUX-01),
isi docs/SESSION-STATE.md §Sesi aktif (harness/model, kartu, scope file),
kerjakan sampai gate hijau: .venv/bin/python -m pytest -q;
.venv/bin/ruff check backend tests; npx tsc --noEmit;
.venv/bin/python tools/token_ownership_lint.py; git diff --stat
Update SESSION-STATE.md + tandai kartu di ROADMAP, commit atomik satu kartu,
laporkan hash + bukti file:line. Jangan tinggalkan in_progress tanpa commit.
Jangan hand-edit frontend/src/shared/ipc/generated.ts; jangan karang progress;
tokens.css aditif-only; prototypes/shell-v0/ bukan bukti PASS.

Aturan keras ada di AGENTS.md. Bila kontrak bertentangan atau izin ambigu,
berhenti & tanya sebelum mengubah file.
```

---

## Pemakaian

- Sesi baru: paste blok di atas. Sesi lama (compact/token penuh): cukup paste
  blok yang sama — tidak perlu menempel ringkasan chat.
- Model/harness berbeda: blok yang sama dipakai. DSH/Claude/Codex/manusia
  semuanya mulai dari 5 file yang sama + `git log/status`.
- Bila blok ini bertentangan dengan `docs/SESSION-STATE.md` (HEAD/next card),
  menang `docs/SESSION-STATE.md` — perbarui blok ini bila template berubah.
