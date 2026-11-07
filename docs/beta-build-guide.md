# Panduan Build Beta — EDA Workbench (unsigned, per OS)

Tanggal: 2026-11-07 · Keputusan pemilik: **Beta unsigned**
(`docs/beta-unsigned-guidance.md`). Panduan ini untuk **pemilik/pembuat
build**, satu kartu — bukan untuk tester. Tester menerima **artefak +
`beta-unsigned-guidance.md` + `beta-validation-script.md`**.

Prinsip: PyInstaller hanya menghasilkan paket untuk OS host tempat ia
dijalankan. **Satu build host per OS** (macOS → `.app`, Windows → `.exe`
folder, Linux → folder). Semua perintah dijalankan dari root repo.

## 0. Prasyarat build host (sekali saja, per host)

| Kebutuhan | Cara |
|---|---|
| Python + dependensi proyek | sesuai repo (`uv sync` atau `pip install -e .`) |
| PyInstaller | `pip install pyinstaller` (hanya di build host) |
| Node.js | `pnpm` (dipakai otomatis bila ada) atau `npm` — frontend dibangun oleh tool |
| pywebview | `pip install pywebview` — **opsional** di backend (import lazy, fallback headless), tapi **wajib** di build host desktop karena `desktop/main.py` + spec PyInstaller membutuhkannya |

Cek kesiapan tanpa membangun apa pun:

```bash
python tools/build_packaging.py --check-only
```

Output yang diharapkan: `packaging prerequisites OK (unsigned build ready)`.
Bila ada baris `BLOCKED: ...`, perbaiki dulu sebelum lanjut.

## 1. Build unsigned (`--sign` TIDAK dipakai untuk Beta)

```bash
python tools/build_packaging.py
```

Yang terjadi otomatis: `pnpm install --frozen-lockfile` + `pnpm run build`
(frontend) → `pyinstaller --clean --noconfirm desktop/eda-workbench.spec`
→ hasil unsigned. Pesan penutup yang diharapkan:
`unsigned build complete — signing remains a P3-1 manual blocker`
(untuk Beta ini **bukan** blocker — keputusan pemilik 2026-11-07).

## 2. Artefak per OS + cara kirim ke tester

### macOS (host macOS)

- Artefak: `dist/EDA Workbench.app` (onefile windowed).
- Kirim: **zip folder `.app`-nya** (jangan kirim folder telanjang; zip
  menjaga struktur bundle). Kirim bersama `beta-unsigned-guidance.md`.
- Tester: ekstrak zip, klik-kanan → **Open** (sekali per build) — detail di
  panduan tester.

### Windows (host Windows)

- Artefak: folder `dist/eda-workbench/` berisi `eda-workbench.exe`
  (onedir **tanpa installer** — Inno Setup hanya pada signed host).
- Kirim: **zip seluruh folder** `eda-workbench/`. Kirim bersama
  `beta-unsigned-guidance.md`.
- Tester: ekstrak zip, jalankan `eda-workbench.exe`, SmartScreen →
  **More info → Run anyway** — detail di panduan tester.

### Linux (host Linux; di luar target Beta bila waktu terbatas)

- Artefak: folder onedir di `dist/` (AppImage = repack manual, BUILD-017;
  bukan prasyarat Beta).
- Catatan: runtime WebKitGTK diperlukan untuk PyWebView.

## 3. Data & bersih-bersih

- Data aplikasi tester tersimpan di `~/.eda-workbench/projects` (di luar
  artefak). Menghapus folder ini membersihkan state tester.
- `frontend/dist/` dan `dist/` adalah output build (tidak di-commit;
  `dist/` sudah untracked).

## 4. Validasi sebelum kirim

1. Jalankan `python tools/build_packaging.py --check-only` → OK.
2. Jalankan build §1 → selesai tanpa error.
3. Jalankan 1 skenario smoke dari `docs/beta-validation-script.md`
   (skenario 1: first-run & handshake) **di host build** sebelum kirim.
4. Kirim artefak + `beta-unsigned-guidance.md` (+ skrip validasi bila
   tester membutuhkannya).

## 5. Di luar lingkup Beta

- `--sign` (Developer ID + notarisasi macOS / Authenticode Windows):
  hanya untuk host bertanda tangan saat Stable (P4-4, menunggu kredensial).
- Auto-update (G6): belum ada — build baru diganti manual.
