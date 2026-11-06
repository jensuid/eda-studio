# Ratifikasi PO — M3 HTML Reporting G1–G4

**Tanggal:** 2026-11-06
**Status:** Ratified oleh PO (2026-11-06) — dokumen kontrak G1–G4 siap divalidasi Critic, selanjutnya G5.
**Dokumen acuan:** `JOB-FLOW-SCREEN-REPORT.md`, `DS-REPORT-001.md` di folder ini (JOB-REPORT-001, FLOW-REPORT-001, SCREEN-REPORT-001, DS-REPORT-001).

PO: beri **✓ Setuju / ✗ Tolak + catatan** untuk setiap item, lalu isi tanda tangan di bawah.
Tanpa tandatangan ratifikasi, builder tidak boleh mulai G5 slice.

## 1. Isi & cakupan (R1, R3)

| ID | Usulan | PO |
|---|---|---|
| R1 | Isi HTML: Penutup + Profiling + Quality + Chart/Bivariate ringkas + Cleaning + Appendix sumber (struktural saja, tanpa narasi/kesimpulan baru) | ✓ Setuju |
| R3 | Cakupan radio: all / profile-quality / with-charts / with-visuals | ✓ Setuju |

## 2. Format & renderer (R2, R4)

| ID | Usulan | PO |
|---|---|---|
| R2 | PDF adalah slice berikutnya; UI jujur "PDF tersedia di slice berikutnya" (atau hapus tombol PDF) | ✓ Setuju |
| R4 | Renderer Python stdlib html, inline CSS, tanpa JS eksternal, satu file mandiri offline | ✓ Setuju |

## 3. Provenance & IPC (R5, R6, R7)

| ID | Usulan | PO |
|---|---|---|
| R5 | Setiap tabel footer sumber: record id · fingerprint · snapshot | ✓ Setuju |
| R6 | Freshness: stale dimasukkan + dilabeli di HTML; UI banner partial (tidak ada penolakan diam-diam) | ✓ Setuju |
| R7 | IPC: `dataset.report.generate` JobManager-wrapped → `ReportRecord` (file artifact di disk, payload kecil, backend renderer) | ✓ Setuju |

## 4. Aturan yang sudah diputuskan di kontrak (tidak diubah)

- REP-001–007: bounded context, shared spec, referensi artifact (bukan duplikasi), HTML primer, PDF distribusi slice berikutnya, freshness wajib, klaim = bukti deterministik.
- Export Report terpisah dari Dataset/Project Export (REP-008/REP-009).
- File HTML: satu file inline-CSS, tanpa CDN/eksternal; tidak ada narasi AI di report.
- 8 states framework terpenuhi + keyboard/a11y/responsif 900px (DS-CORE-001); daftar record + ringkasan `aria-live="polite"`.
- HTML semantic (`h1–h3`, `table` + `th scope`), terbaca screen reader tanpa JS.

## Tanda tangan

- PO / penanggung jawab: Setuju oleh PO (dipandu dialog, semua item ✓ Setuju di atas)  Tanggal: 2026-11-06
- Catatan perubahan (bila ada penolakan, revisi dokumen kontrak sebelum G5): Tidak ada penolakan.

Setelah semua item ✓ Setuju → status kontrak (JOB-FLOW-SCREEN-REPORT.md, DS-REPORT-001.md) diubah dari Draft menjadi Ratified, dan tahap selanjutnya = Independent Critic → backend contract lock (`contracts.py` + `ReportRecord`) → G5 slice.
