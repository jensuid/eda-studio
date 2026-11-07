# Beta Validation Script — EDA Workbench (P3-1)

User testing end-to-end. Run on the target OS from the packaged build
(`python tools/build_packaging.py`, `desktop/eda-workbench.spec`). Data
dihapus setelah tiap skenario; hasil dicatat per skenario (Pass/Fail +
catatan). Template laporan bug: [bug-report-template.md](bug-report-template.md).
Kanal feedback: lihat §Feedback.

Profil beta: analis data yang terbiasa CSV/Parquet, belum pernah pakai
EDA Workbench. Waktu target: ≤ 30 menit untuk 7 skenario pertama.

## Skenario

### 1. First-run & protocol handshake
1. Jalankan installer/paket pada OS target.
2. Buka aplikasi, buat project baru (nama + lokasi folder).
3. **Ekspektasi:** jendela terbuka tanpa banner mismatch; handshake
   `getProtocolInfo` vs protokol backend lolos; tidak ada error di layar.

### 2. Import CSV → snapshot → preview
1. Import `sample.csv` (≤ 200 baris preview) lewat FilePathInput ("Pilih…").
2. Tunggu job selesai di Job Center.
3. **Ekspektasi:** snapshot Parquet kanonis terbentuk; fingerprint SHA-256
   tampil; preview ≤ 200 baris; sumber CSV tidak berubah (immutable).

### 3. Profiling & histogram
1. Profiling dataset dari skenario 2.
2. Tampilkan histogram untuk satu kolom numerik; resize jendela.
3. **Ekspektasi:** summary stats konsisten; chart render ulang saat resize
   (ResizeObserver); tidak ada horizontal scroll pada lebar 900px.

### 4. Quality & cleaning dengan konfirmasi destruktif
1. Jalankan quality check; catat temuan.
2. Jalankan satu operasi cleaning (mis. drop null) — konfirmasi modal muncul.
3. Batalkan modal, lalu ulangi dan setujui.
4. **Ekspektasi:** modal destruktif tampil sebelum eksekusi; cancel = tidak ada
   perubahan; approve = cleaning tersimpan sebagai record baru dengan id.

### 5. Bivariate & drill-down
1. Bivariate dua kolom numerik (scatter ≤ 2000 titik).
2. Ganti pasangan kolom.
3. **Ekspektasi:** scatter ter-render; cap 2000 titik aktif (tidak freeze);
   invalidasi query konsisten setelah job terminal (Job Center).

### 6. Report & PDF export
1. Generate report (HTML) dari findings.
2. Export PDF.
3. **Ekspektasi:** HTML dan PDF terunduh; PDF memuat provenance + fingerprint;
   snapshot terverifikasi strict pada export (ConflictError bila tamper).

### 7. Backup → pindah mesin/folder → restore → diagnostic
1. `project.backup.create` (ZIP), salin folder project ke lokasi lain.
2. Restore ke root baru; buka restored project.
3. `project.diagnostic.create` → unzip → cek `manifest.json` checksums.
4. **Ekspektasi:** restore membuka project identik; tidak ada absolute path
   di bundle; checksums cocok.

## Feedback

Kanal feedback beta: GitHub Issues repo ini dengan label `beta-feedback`
(menggunakan [bug-report-template.md](bug-report-template.md)), atau formulir
internal `docs/feedback-form.md` bila diisi offline. Sertakan: skenario,
langkah reproduksi, OS/build, commit/package version, lampiran diagnostic ZIP.
Semua laporan dibaca ≤ 3 hari kerja.

## Sign-off

| Peran | Nama | Tanggal | Tanda tangan |
|---|---|---|---|
| Tester 1 | | | |
| Tester 2 | | | |
| Owner release | | | |
