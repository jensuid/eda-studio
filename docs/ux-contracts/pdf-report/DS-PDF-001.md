# DS-PDF-001 — Design System & Component Contract (PDF Report, M3)

**Status:** Ratified v1.0 oleh PO (2026-11-06) — lihat `01-po-ratifikasi.md` · **Scope:** perluasan DS-CORE-001 khusus PDF distribusi.
Token & komponen di DS-CORE-001 + DS-REPORT-001 tetap berlaku; kontrak ini hanya menambah yang dibutuhkan PDF.
**Sifat:** semua yang baru di bawah ini **Ratified oleh PO (2026-11-06)** — lihat `01-po-ratifikasi.md`.

## Tokens tambahan (semantic, bukan hex)

| Token | Penggunaan | Catatan |
|---|---|---|
| `pdf-surface` | Latar halaman PDF | `surface` DS-CORE-001 di dalam template; file mandiri |
| `pdf-table-border` | Border tabel di PDF | `border-subtle` |
| `pdf-header-footer` | Header/footer halaman PDF | `text-secondary`, kontras ≥ 4.5:1 untuk teks halaman |
| `pdf-badge-stale` | Badge "Usang" (UI + PDF) | Teks "Usang — jalankan ulang" + "Draft — bukan final export.", bukan warna saja |
| `pdf-badge-source` | Badge sumber section | Teks tipe section + fingerprint singkat |

Larangan warisan DS-CORE-001: raw hex dilarang di komponen aplikasi; **di dalam file PDF, nilai warna didefinisikan sekali sebagai warna sumber di template renderer** (bukan hex tersebar yang tidak terlacak). Radius 6/8px & spacing base 4px tetap di UI.

## Komponen baru

| Komponen | Varian | Do | Don't |
|---|---|---|---|
| `PdfSourceList` | per-tipe + stale badge | Daftar sections ReportRecord + fingerprint singkat + badge Draft bila stale | Daftar tanpa fingerprint; stale tersembunyi |
| `PdfSummary` | done, partial | Halaman count, isi file, renderer_version, pdf fingerprint, path tujuan | Angka di ringkasan berbeda dengan yang di PDF |
| `PdfSkeleton` / `PdfError` | — | Skeleton ringan + pesan literal per SCREEN-PDF-001 | Spinner tanpa label |

## Aturan isi PDF (mengikat implementasi)

1. **Isi = HTML** (P1): PDF adalah *pernyataan kembali* angka + provenance dari ReportRecord; tidak ada narasi, kesimpulan bisnis, atau angka komputasi baru.
2. **Layout konsisten** (P5): header/footer tiap halaman + "Halaman X dari Y"; tabel dipaginasi; tidak ada clipping/broken breaks — diuji sebelum M3 done.
3. **Freshness eksplisit** (P6): section stale dilabeli di PDF; PDF stale berlabel "Draft — bukan final export."; UI memperingatkan sebelum unduh di partial.
4. **Metadata** (P5): Title/Author/Subject = nama dataset + fingerprint; font ter-embed atau terdaftar di metadata.
5. **Aksesibilitas**: aplikasi kontras AA + live region status; file PDF terbaca tabelnya (bukan gambar tunggal berisi teks).
6. **Gerakan & rendering**: tidak ada animasi/interaktif di PDF (statis); UI menghormati reduced-motion.
7. **Export path**: save dialog OS dipakai; aplikasi tidak menulis diam-diam ke path default tanpa konfirmasi user.

## Nilai ambang (Ratified P1–P7)

| ID | Ambang | Usulan |
|---|---|---|
| P1 | Isi PDF | Penutup + sections HTML yang sama + header/footer + metadata (tanpa komputasi baru) |
| P2 | Renderer tunggal | `reportlab` (bila PO memilih); fallback stdlib hanya bila tidak tersedia — dijanjikan eksplisit, tidak diam-diam |
| P3 | Sumber | Seluruh sections ReportRecord (scope HTML yang sama); tidak ada scope baru |
| P4 | Layout | Header/footer + "Halaman X dari Y" + tabel dipaginasi + font ter-embed |
| P5 | Uji PDF | Clipping/breaks/fonts/overflow di 900px/1440px — screenshot PDF wajib sebelum M3 done |
| P6 | Freshness | stale dilabeli di PDF + badge Draft; UI banner partial |
| P7 | IPC | `dataset.pdf.generate` JobManager-wrapped → `PdfRecord` (file di disk, payload kecil) |

## Enforcement (G6)

- Review checklist: token PDF terpakai di tema terpusat; PDF dibuka tanpa network; footer sumber lengkap; header/footer + nomor halaman tampil di setiap halaman.
- Uji aksesibel: daftar sumber + ringkasan dapat diakses keyboard; PDF dapat dibaca tabelnya.
- Screenshot 900px & 1440px PDF (halaman 1 + tabel terpotong/paginasi) untuk Critic — **precedens cleaning wajib screenshot; PDF tidak mengecualikan.**

## Exit G4 (untuk review PO)

Token & komponen PDF terkunci untuk slice G5. Perubahan ambang P1–P7 setelah G4 = perubahan kontrak → butuh impact review sebelum implementasi.
