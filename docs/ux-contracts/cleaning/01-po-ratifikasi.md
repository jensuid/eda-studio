# Ratifikasi PO — M3 Cleaning G1–G4

**Tanggal:** 2026-11-05
**Status:** Ratified oleh PO (2026-11-05) — 4 dokumen kontrak G1–G4 siap divalidasi Critic, selanjutnya G5.
**Dokumen acuan:** `JOB-CLEAN-001.md`, `FLOW-CLEAN-001.md`, `SCREEN-CLEAN-001.md`, `DS-CLEAN-001.md` di folder ini.

PO: beri **✓ Setuju / ✗ Tolak + catatan** untuk setiap item, lalu isi tanda tangan di bawah.
Tanpa tandatangan ratifikasi, builder tidak boleh mulai G5 slice.

## 1. Operasi MVP (C1)

| ID | Usulan | PO |
|---|---|---|
| C1-a | Hapus duplikat eksak (snapshot-wide, seluruh kolom sama) | ✓ Setuju |
| C1-b | Hapus baris dengan missing di kolom terpilih (per-kolom) | ✓ Setuju |
| C1-c | Imputasi sederhana per-kolom: mean/median (numerik), mode (kategorikal), konstanta (input user) | ✓ Setuju |
| C1-d | Outlier trim (winsorize/hapus) **DITUNDA** — destructive rule ambigu, stop rule berlaku | ✓ Setuju (ditunda) |

## 2. Konfirmasi & pratinjau (C2–C3)

| ID | Usulan | PO |
|---|---|---|
| C2 | **Ketiga operasi wajib dialog konfirmasi destruktif** dengan ringkasan dampak, sebelum snapshot baru dibuat. Tidak ada jalur "terapkan langsung" yang melewati dialog. | ✓ Setuju |
| C3 | **Pratinjau = ringkasan dampak saja (dry-run)** — baris terpengaruh, %, row_count sebelum→sesudah, fingerprint induk singkat. Bukan diff baris penuh. | ✓ Setuju |

## 3. Provenance & stale (C4–C6)

| ID | Usulan | PO |
|---|---|---|
| C4 | Persist `CleaningRecord` di tabel `cleanings` (mirip ProfileRecord): operasi + parameter + snapshot induk & fingerprint → snapshot anak & fingerprint. | ✓ Setuju |
| C5 | Setelah cleaning, profiling & quality lama untuk snapshot induk = **stale** ("Hasil mungkin usang — jalankan ulang."), wajib re-run sebelum Analyze. | ✓ Setuju |
| C6 | Scope campuran: duplikat = snapshot-wide; hapus-missing + imputasi = per-kolom terpilih. | ✓ Setuju |

## 4. Flow & interaksi (F1–F4)

| ID | Usulan (dari FLOW-CLEAN-001) | PO |
|---|---|---|
| F1 | Pratinjau dry-run ringkasan saja, tanpa menulis snapshot / tanpa persist record. | ✓ Setuju (implisit C3) |
| F2 | Eligibility imputasi per tipe: mean/median = numerik saja, mode = kategorikal/teks, konstanta = semua tipe (dengan validasi tipe). | ✓ Setuju |
| F3 | Hapus missing boleh multi-kolom (baris terhapus bila salah satu kolom kosong), pilihan eksplisit di UI. | ✓ Setuju |
| F4 | Konstanta harus sesuai tipe kolom target. | ✓ Setuju (implisit F2) |

## 5. Screen, IPC & design system (S1–S5)

| ID | Usulan (dari SCREEN-CLEAN-001 & DS-CLEAN-001) | PO |
|---|---|---|
| S1 | Copy literal seperti tabel di SCREEN-CLEAN-001 (judul "Cleaning", primer "Terapkan cleaning", dst.) | ✓ Setuju |
| S2 | Enum operasi hanya 3 (drop_duplicates, drop_missing, impute). Outlier tidak ada di enum. | ✓ Setuju (implisit C1) |
| S3 | Command IPC usulan: `dataset.cleaning.run` JobManager-wrapped (pola run_profile/run_histogram/quality.run). | ✓ Setuju |
| S4 | 8 states framework terpenuhi (loading, empty-first-run, empty-filtered, partial, error, long-content, restricted, done) + keyboard/a11y/responsif 900px. | ✓ Setuju (implisit kontrak) |
| S5 | G5 slice membuktikan 1 jalur vertikal + screenshot 900px/1440px untuk Critic sebelum screen lain menyusul. | ✓ Setuju |

## 6. UTANG QA dari M2 (O1/O2)

| ID | Keputusan | PO |
|---|---|---|
| O1 | Polish visual M3: badge severity + garis tabel bertoken (DS-CORE), header rata kiri. | ✓ Setuju (polish M3) |
| O2 | Format `evidence_detail` yang lebih ramah. | ✓ Setuju (polish M3) |
| — | O3 history/snapshots: CLOSED (QA-PROF-003), tidak perlu ratifikasi ulang. | — |

## Tanda tangan

- PO / penanggung jawab: Setuju oleh PO (dipandu dialog, semua item ✓ Setuju di atas)  Tanggal: 2026-11-05
- Catatan perubahan (bila ada penolakan, revisi dokumen kontrak sebelum G5): Tidak ada penolakan. Outlier trim tetap ditunda sesuai C1-d.

Setelah semua item ✓ Setuju → status 4 dokumen kontrak diubah dari Draft menjadi Ratified, dan tahap selanjutnya = Independent Critic → backend contract lock (`contracts.py` + `cleanings` table) → G5 slice.
