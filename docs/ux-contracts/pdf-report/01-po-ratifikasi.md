# Ratifikasi PO — M3 PDF Report G1–G4

**Tanggal:** 2026-11-06
**Status:** Ratified oleh PO (2026-11-06) — dokumen kontrak G1–G4 siap divalidasi Critic, selanjutnya G5.
**Dokumen acuan:** `JOB-FLOW-SCREEN-PDF.md`, `DS-PDF-001.md` di folder ini (JOB-PDF-001, FLOW-PDF-001, SCREEN-PDF-001, DS-PDF-001).

PO: beri **✓ Setuju / ✗ Tolak + catatan** untuk setiap item, lalu isi tanda tangan di bawah.
Tanpa tandatangan ratifikasi, builder tidak boleh mulai G5 slice.

## 1. Isi & sumber (P1, P3)

| ID | Usulan | PO |
|---|---|---|
| P1 | Isi PDF: Penutup + sections HTML yang sama + header/footer + metadata (tanpa komputasi baru, angka identik ReportRecord) | ✓ Setuju |
| P3 | Sumber: seluruh sections ReportRecord (scope HTML yang sama); tidak ada scope baru | ✓ Setuju |

## 2. Renderer & layout (P2, P4, P5)

| ID | Usulan | PO |
|---|---|---|
| P2 | Renderer tunggal: reportlab (bila PO memilih); fallback stdlib hanya bila tidak tersedia — dijanjikan eksplisit, tidak diam-diam | ✓ Setuju |
| P4 | Layout: header/footer + "Halaman X dari Y" + tabel dipaginasi + font ter-embed | ✓ Setuju |
| P5 | Uji PDF (clipping/breaks/fonts/overflow di 900px/1440px) — screenshot PDF wajib sebelum M3 done | ✓ Setuju |

## 3. Freshness & IPC (P6, P7)

| ID | Usulan | PO |
|---|---|---|
| P6 | Freshness: stale dilabeli di PDF + badge "Draft — bukan final export."; UI banner partial | ✓ Setuju |
| P7 | IPC: dataset.pdf.generate JobManager-wrapped → PdfRecord (file di disk, payload kecil) | ✓ Setuju |

## 4. Aturan yang sudah diputuskan di kontrak (tidak diubah)

- REP-005: PDF = format distribusi/presentation (bukan screenshot chart ke PDF); Doc12 §11.2–11.3 (layout konsisten, header/footer, page numbering, tabel pagination, font, metadata, static chart).
- Isi = HTML ReportRecord yang sama (bukan komputasi ulang); stale dilabeli + Draft; metadata Title/Author/Subject = dataset + fingerprint.
- 8 states framework terpenuhi (loading transient + empty_filtered unreachable-by-design mengikuti putusan Opsi B bivariat/report); keyboard/a11y/responsif 900px (DS-CORE-001).
- Export Report terpisah dari Dataset/Project Export (REP-008/REP-009); PDF merge/split/annotate di luar MVP.

## Tanda tangan

- PO / penanggung jawab: Setuju oleh PO (dipandu dialog, semua item ✓ Setuju di atas)  Tanggal: 2026-11-06
- Catatan perubahan (bila ada penolakan, revisi dokumen kontrak sebelum G5): Tidak ada penolakan.

Setelah semua item ✓ Setuju → status kontrak (JOB-FLOW-SCREEN-PDF.md, DS-PDF-001.md) diubah dari Draft menjadi Ratified, dan tahap selanjutnya = Independent Critic → backend contract lock (`contracts.py` + `PdfRecord` + renderer PDF) → G5 slice.
