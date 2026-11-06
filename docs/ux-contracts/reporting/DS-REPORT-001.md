# DS-REPORT-001 — Design System & Component Contract (HTML Reporting, M3)

**Status:** Ratified v1.0 oleh PO (2026-11-06) — lihat `01-po-ratifikasi.md` · **Scope:** perluasan DS-CORE-001 khusus report HTML.
Token & komponen di DS-CORE-001 + DS-HIST-001 + DS-BIVAR-001 tetap berlaku; kontrak ini hanya menambah yang dibutuhkan report.
**Sifat:** semua yang baru di bawah ini **Ratified oleh PO (2026-11-06)** — lihat `01-po-ratifikasi.md`.

## Tokens tambahan (semantic, bukan hex)

| Token | Penggunaan | Catatan |
|---|---|---|
| `report-surface` | Latar halaman HTML report | `surface` DS-CORE-001 di dalam `<style>` inline; file mandiri |
| `report-table-border` | Border tabel di HTML | `border-subtle` |
| `report-badge-stale` | Badge "Usang" (UI + HTML) | Teks "Usang — jalankan ulang", bukan warna saja |
| `report-badge-source` | Badge sumber record | Teks "Profiling"/"Quality"/… + fingerprint singkat |

Larangan warisan DS-CORE-001: raw hex dilarang di komponen aplikasi; **di dalam file HTML, nilai warna didefinisikan sekali sebagai CSS custom properties di `<style>`** (bukan hex tersebar yang tidak terlacak). Radius 6/8px & spacing base 4px tetap di UI.

## Komponen baru (UI aplikasi)

| Komponen | Varian | Do | Don't |
|---|---|---|---|
| `ReportScopeRadio` | all, profile-quality, with-charts, with-visuals | Radio native + label literal per SCREEN-REPORT-001 | Dropdown tersembunyi; pilihan yang mengarah ke record yang belum ada |
| `ReportSourceList` | per-tipe + stale badge | Daftar record yang masuk + fingerprint singkat + badge "Usang" bila stale | Daftar tanpa fingerprint; stale tersembunyi |
| `ReportSummary` | done, partial | Sections count, fingerprint sumber, ukuran file, path tujuan | Angka di ringkasan berbeda dengan yang di file HTML |
| `ReportSkeleton` / `ReportError` | — | Skeleton ringan + pesan literal per SCREEN-REPORT-001 | Spinner tanpa label |

## Komponen file HTML (template, R4–R6)

| Bagian HTML | Do | Don't |
|---|---|---|
| `<h1>` + Penutup | Nama dataset, fingerprint, rows, waktu generate | Angka-olahan baru dari data mentah |
| Section Profiling/Quality/Chart/Bivariate/Cleaning | Tabel ringkas + footer sumber per tabel (`record id · fingerprint · snapshot`) | Duplikasi DataFrame mentah penuh |
| Label stale | "Hasil mungkin usang — jalankan ulang." per record | Menyembunyikan record stale |
| CSS | `<style>` inline satu blok, tanpa CDN/`@import`/font eksternal | `<script src>` / link eksternal |

## Aturan visualisasi & isi (mengikat implementasi)

1. **Isi struktural saja** (R1): HTML adalah *pernyataan kembali* angka dari record; tidak ada narasi, kesimpulan bisnis, atau angka komputasi baru di template.
2. **Judul + referensi wajib** (R5): setiap tabel/angka punya footer sumber; penutup menyebut fingerprint snapshot.
3. **Freshness eksplisit** (R6): record stale dilabeli di file; UI memperingatkan sebelum unduh di partial.
4. **Mandiri** (R4): file dibuka offline; tidak ada akses jaringan.
5. **Aksesibilitas**: aplikasi kontras AA; file HTML semantic (`h1–h3`, `table` + `th scope`), terbaca screen reader tanpa JS.
6. **Gerakan & rendering**: tidak ada animasi di file HTML (statis); UI menghormati reduced-motion.
7. **Export path**: save dialog OS dipakai; aplikasi tidak menulis diam-diam ke path default tanpa konfirmasi user.

## Nilai ambang (Ratified R1–R7)

| ID | Ambang | Usulan |
|---|---|---|
| R1 | Isi HTML | Penutup + Profiling + Quality + Chart/bivariate ringkas + Cleaning + Appendix sumber |
| R2 | PDF | Slice berikutnya; UI jujur "PDF tersedia di slice berikutnya" (atau hapus tombol PDF bila PO menolak) |
| R3 | Cakupan radio | all / profile-quality / with-charts / with-visuals |
| R4 | Renderer | Python stdlib `html`, inline CSS, tanpa JS eksternal, satu file |
| R5 | Referensi | Setiap tabel footer `record id · fingerprint · snapshot` |
| R6 | Freshness | stale dimasukkan + dilabeli; UI banner partial |
| R7 | IPC | `dataset.report.generate` JobManager-wrapped → `ReportRecord` (file artifact di disk, payload kecil) |

## Enforcement (G6)

- Review checklist: token report terpakai di tema terpusat; file HTML dibuka offline tanpa network; footer sumber lengkap.
- Uji aksesibel: daftar record + ringkasan dapat diakses keyboard; file HTML semantic.
- Screenshot 900px & 1440px pada state done/loading/empty untuk Critic (G5) — **tidak ada screenshot HTML diambil dari browser sebagai bukti visual G5** (file diuji via parse HTML + uji isi, bukan screenshot).

## Exit G4 (untuk review PO)

Token & komponen report terkunci untuk slice G5. Perubahan ambang R1–R7 setelah G4 = perubahan kontrak → butuh impact review sebelum implementasi.
