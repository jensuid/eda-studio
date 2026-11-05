# Profiling (M2, fitur pertama) — G1 Job + G2 Flow + G3 Screen Contracts

**IDs:** JOB-PROF-001, FLOW-PROF-001, SCREEN-PROF-001 · **Status:** Draft for G3 review (2026-11-05)
**Parent:** Doc08 §5 Guided stages 3 (Snapshot → Profile) · Doc05 (Job lifecycle)
**Rigor:** Standard (G1, G2, G3–G6)

## G1 — Job Contract (JOB-PROF-001)
- **job:** "Memahami isi dan kondisi sebuah dataset sebelum menganalisisnya"
- **actor:** Data analyst / data user lokal, 1 user per workspace, volume kecil–menengah (file CSV/XLSX/Parquet).
- **trigger:** Dataset selesai di-import (snapshot tersedia) dan user memilih "Profiling".
- **inputs:** Snapshot Parquet (immutable, SHA-256), schema kolom (nama + tipe inferensi M2).
- **desired_outcome:** User dapat menjawab: berapa baris/kolom, kolom mana yang bermasalah (missing, tipe campur, duplikat), dan distribusi kasar tiap kolom numerik/kategorikal — sebagai dasar keputusan cleaning/analisis.
- **success_signal:** User mencapai kesimpulan "dataset layak / perlu dibersihkan" tanpa membuka file mentah; setiap angka dapat ditelusur ke snapshot fingerprint.
- **failure_cost:** Insight dibangun di atas data yang salah paham (tipe salah inferensi, missing tersembunyi) → keputusan bisnis keliru.
- **not_in_scope:**
  - Statistik inferensial / uji hipotesis (itu P3, bukan profiling deskriptif).
  - Auto-cleaning (profiling hanya *mendeteksi*; cleaning = tahap terpisah, Doc05 §12).
  - Visualisasi interaktif penuh (M2 lanjutan; profiling boleh menampilkan ringkasan distribusi sederhana).

## G2 — Flow Contract (FLOW-PROF-001)
- **entry:** Dari layar import selesai (dataset terdaftar) → tombol "Jalankan Profiling" (primary action).
- **steps:**
  1. `submit` — user klik; sistem membuat Job (Created→Queued). Feedback: indikator job di Job Center + status di halaman.
  2. `run` — backend: Preparing→Running (baca Parquet, infer tipe, hitung statistik). Feedback: progress ringkas (bukan frame-level), state backend-authoritative.
  3. `view` — job Completed; hasil profiling ditampilkan (SCREEN-PROF-001). Feedback: tabel ringkasan + badge kualitas per kolom.
  4. `next` — user memilih: lanjut ke Quality/Cleaning, ganti dataset, atau kembali ke Guided stage berikutnya.
- **branches:**
  - Job Failed → banner error + pesan penyebab (dari ErrorContract) + tombol "Coba lagi" / "Kembali". Tidak ada dead-end.
  - Job Cancelled → state Cancelled jelas, tombol "Jalankan ulang".
  - Dataset tanpa snapshot (edge) → empty-state: "Dataset belum memiliki snapshot" + CTA kembali ke import.
- **completion:** Hasil profiling tampil + tercatat di job history (durable events).
- **cancel_and_back:** Cancel tersedia selama Running (→ Cancelling→Cancelled). Back kembali ke dataset list tanpa kehilangan hasil yang sudah disimpan.

## G3 — Screen & Interaction Contract (SCREEN-PROF-001)
- **screen:** `profiling` · **purpose:** "Lihat kondisi dataset dalam satu layar" · **primary_action:** "Jalankan Profiling"
- **hierarchy:**
  1. Ringkasan dataset (nama, baris, kolom, fingerprint, waktu profil).
  2. Tabel kolom: nama, tipe, missing %, distinct, min–max/mean (numerik), top kategori (kategorikal), badge status.
  3. Peringatan kualitas (missing tinggi, tipe campur, duplikat terdeteksi).
  4. Aksi lanjutan (ke Cleaning / ke dataset lain).
- **removed:** Grafik kompleks (ditunda ke visualisasi M2), statistik inferensial, tombol export (P4).
- **regions & states (wajib):**
  - `loading`: skeleton tabel + status job ("Profiling berjalan…"), tombol Cancel aktif.
  - `empty_first_run`: belum pernah profiling → ajakan + primary action.
  - `empty_filtered`: (bila filter kolom ditambah di slice berikut) pesan "tidak ada kolom cocok".
  - `partial`: profil lama + banner "Hasil mungkin usang — jalankan ulang" (bila snapshot berubah).
  - `error`: pesan ErrorContract + retry.
  - `long_content`: tabel kolom dengan scroll ber-virtualisasi; ringkasan tetap terlihat.
  - `restricted`: tidak ada peran restricted di M2 (single-user lokal).
  - `done`: tabel terisi + badge status per kolom.
- **interactions:** klik baris kolom → detail kolom (expand); sort kolom; klik "Jalankan Profiling" → job dibuat, fokus berpindah ke status.
- **keyboard:** Tab order: primary action → tabel → aksi lanjutan; Enter/Space mengaktifkan; fokus kembali ke status setelah aksi.
- **validation:** limit/sort input divalidasi; pesan error literal dari backend.
- **copy (ID):** Judul "Profiling Dataset"; primary "Jalankan Profiling"; error generik "Profiling gagal. Silakan coba lagi."; loading "Profiling sedang berjalan…".
- **accessibility:** kontras AA; badge status tidak hanya warna (ada label teks); tabel punya header scope; status job diumumkan (aria-live polite).
- **responsive/adaptive (desktop):** min window 1024px; panel tabel scroll horizontal bila perlu; tidak ada layout mobile (desktop app, Doc14).

## Exit G3 (untuk review PO)
Tidak ada perilaku penting yang ditinggalkan ke penemuan implementasi: setiap region punya state,
setiap kontrol punya hasil + feedback, hierarki mendukung JOB-PROF-001.
**Belum boleh coding UI sampai kontrak ini disetujui.**
