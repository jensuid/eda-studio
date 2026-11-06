# Ratifikasi PO — M2 Bivariate G1–G4

**Tanggal:** 2026-11-06
**Status:** Ratified oleh PO (2026-11-06) — dokumen kontrak G1–G4 siap divalidasi Critic, selanjutnya G5.
**Dokumen acuan:** `JOB-FLOW-SCREEN-BIVAR.md`, `DS-BIVAR-001.md` di folder ini (JOB-BIVAR-001, FLOW-BIVAR-001, SCREEN-BIVAR-001, DS-BIVAR-001).

PO: beri **✓ Setuju / ✗ Tolak + catatan** untuk setiap item, lalu isi tanda tangan di bawah.
Tanpa tandatangan ratifikasi, builder tidak boleh mulai G5 slice.

## 1. Mode & pemetaan (V1, V2)

| ID | Usulan | PO |
|---|---|---|
| V1 | Pemetaan tipe: numerik×numerik→B1 korelasi, kategorikal×numerik→B2 grup, kategorikal×kategorikal→B3 silang, tipe lain ditolak eksplisit | ✓ Setuju |
| V2 | B1: Pearson + Spearman (2 desimal UI), pairwise-complete, n direkam | ✓ Setuju |

## 2. Sampling & kategori (V3, V4)

| ID | Usulan | PO |
|---|---|---|
| V3 | Scatter >2000 titik = sampled deterministik (baris pertama n), badge + footnote, tidak ada silent downgrade | ✓ Setuju |
| V4 | Kategori >10 per sumbu digabung "Lainnya" (terdokumentasi di footnote + tabel) | ✓ Setuju |

## 3. Chart, tabel & IPC (V5, V6, V7)

| ID | Usulan | PO |
|---|---|---|
| V5 | B2: chart bar = mean, tabel = count/mean/median/min–max (boxplot ditunda) | ✓ Setuju |
| V6 | Tabel B1 = ringkasan + sampel titik yang sama dengan chart (bukan DataFrame penuh) | ✓ Setuju |
| V7 | IPC: `dataset.bivariate.run` (JobManager-wrapped) → `BivariateRecord` dengan fingerprint seperti histogram | ✓ Setuju |

## 4. Aturan yang sudah diputuskan di kontrak (tidak diubah)

- 8 states framework terpenuhi (loading, empty-first-run, empty-filtered, partial, error, long-content, restricted, done) + keyboard/a11y/responsif 900px.
- Stale: "Hasil mungkin usang — jalankan ulang." bila fingerprint record ≠ snapshot terkini.
- Copy literal: judul "Hubungan {kolom_a} × {kolom_b}", primer "Jalankan Analisis Bivariat", loading "Menghitung bivariat…", error "Analisis bivariat gagal. Silakan coba lagi.", empty "Tidak ada pasangan nilai untuk dihitung.", konstan "Kolom ini konstan.", korelasi-tak-terdefinisi "Korelasi tidak terdefinisi untuk kolom konstan.", pasangan-sama "Pilih dua kolom yang berbeda."
- Kausalitas: tidak ada kata "menyebabkan/mempengaruhi" di UI; B1 berfootnote "Korelasi ≠ sebab-akibat".
- ECharts-only (LD-06); token chart semantic tanpa hex literal; tabel data selalu tersedia (a11y).

## Tanda tangan

- PO / penanggung jawab: Setuju oleh PO (dipandu dialog, semua item ✓ Setuju di atas)  Tanggal: 2026-11-06
- Catatan perubahan (bila ada penolakan, revisi dokumen kontrak sebelum G5): Tidak ada penolakan.

Setelah semua item ✓ Setuju → status 4 dokumen kontrak diubah dari Draft menjadi Ratified, dan tahap selanjutnya = Independent Critic → backend contract lock (`contracts.py` + record) → G5 slice.
