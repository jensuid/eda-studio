# Panduan Screenshot Desktop 900px & 1440px — Bivariat + Report

**Tujuan:** bukti visual G5 (S5) untuk Critic — wajib sebelum **M3 dinyatakan done** (bukan blocker PASS kode).
**Butuh:** Mac dengan shell grafis PyWebView (`desktop/main.py`). Tidak bisa dari CLI headless.

## Prasyarat (sekali)

```bash
# 1. Pastikan backend venv + deps (uv) sehat
.venv/bin/python -m pytest -q            # harus: 49 passed
.venv/bin/ruff check backend tests      # harus: All checks passed!

# 2. Build frontend (file dist dipakai shell)
./node_modules/.bin/tsc --noEmit        # dari frontend/
./node_modules/.bin/vite build          # dari frontend/ → ✓ built

# 3. Install shell grafis (belum ada di .venv)
.venv/bin/pip install pywebview
```

## Jalankan app desktop

```bash
.venv/bin/python desktop/main.py
```

Jendela **EDA Workbench** terbuka (`frontend/dist/index.html`).
Urutan aksi di UI (sama seperti cleaning):

1. Buat Project → Import Dataset (`tests/fixtures/sample.csv`) → Jalankan Profiling → Jalankan Quality Check
2. **Bivariat (ganti pasangan, jalankan, screenshot):**
   - B1 numerik×numerik: `id` × `sales` → chart scatter + ringkasan "Korelasi id dengan sales: Pearson …"
   - B2 kategorikal×numerik: `region` × `sales` → bar per kategori
   - B3 kategorikal×kategorikal: buat fixture kedua atau pakai `region` × `region` tidak bisa (A≠B ditolak) → pakai fixture `city,channel` (dari test) bila ada, atau tandai B3 via tabel cross-tab bila datasetmu punya 2 kolom kategorikal
   - Loading: screenshot saat "Menghitung bivariat…" (jangan tunggu selesai)
   - Empty/partial (bila sempat): snapshot diubah setelah hasil tampil → banner "Hasil mungkin usang — jalankan ulang."
3. **Report:** di bawah Bivariate pilih cakupan → "Buat Report HTML" → screenshot ringkasan done ("Report siap diunduh…")
4. **Ubah ukuran jendela** ke **900px** dan **1440px** (seret/resize; lebar = ringkasan segmen di bawah) untuk setiap state di atas.

## File yang harus ada setelah selesai

```
docs/ux-contracts/bivariate/bivariate-b1-num-num-900.png
docs/ux-contracts/bivariate/bivariate-b1-num-num-1440.png
docs/ux-contracts/bivariate/bivariate-b2-cat-num-900.png
docs/ux-contracts/bivariate/bivariate-b2-cat-num-1440.png
docs/ux-contracts/bivariate/bivariate-b3-cat-cat-900.png
docs/ux-contracts/bivariate/bivariate-b3-cat-cat-1440.png

docs/ux-contracts/reporting/report-done-900.png
docs/ux-contracts/reporting/report-done-1440.png
docs/ux-contracts/reporting/report-empty-first-run-900.png
docs/ux-contracts/reporting/report-empty-first-run-1440.png
```

> **Putusan 2026-11-06 (Opsi B):** `loading` adalah transient (<1 detik) dan `empty_filtered`
> unreachable-by-design (radio selalu terpilih) — keduanya **tidak wajib screenshot**,
> diverifikasi via mutation state + unit test + log. Screenshot wajib = state done +
> empty_first_run di atas. Lihat DS-BIVAR-001:59 dan DS-REPORT-001:62.

Precedens cleaning (12 PNG di `docs/ux-contracts/cleaning/`) adalah pola penamaan yang dipakai Critic untuk verifikasi visual (OCR + mata).

## Yang dicek Critic (untuk PASS penutupan G5)

- Chart/ringkasan terbaca di 900px dan 1440px; badge Exact/Sampled + fingerprint tampil.
- Copy literal identik kontrak (LOAD: "Membuat report…", EROR, BIVARIAT "Menghitung bivariat…").
- Tidak ada bahasa kausal ("menyebabkan") di B1.
- Tabel alternatif dapat dibuka (detil "Data tabel").
