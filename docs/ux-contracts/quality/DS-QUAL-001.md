# DS-QUAL-001 — Design System & Component Contract (Quality Rules, M2)

**Status:** Draft v0.1 untuk G4 review · **Scope:** perluasan DS-CORE-001 khusus Quality Check.
Token & komponen di DS-CORE-001 tetap berlaku; kontrak ini hanya menambah yang dibutuhkan quality results.
**Sifat:** semua yang baru di bawah ini **PROPOSED** sampai disetujui PO di G4 exit.

## Tokens tambahan (semantic, bukan hex)

| Token | Penggunaan | Catatan |
|---|---|---|
| `severity-ok` | Badge severity `ok` di tabel findings | Reuse `status-ok` DS-CORE-001; teks "OK" wajib, bukan warna saja |
| `severity-check` | Badge severity `check` | Reuse `status-warning` DS-CORE-001; teks "Perlu perhatian" |
| `severity-problem` | Badge severity `problem` | Reuse `status-error` DS-CORE-001; teks "Masalah" |
| `quality-evidence` | Teks/angka evidence per baris | `text-secondary`, kontras ≥ 4.5:1, font 13px tabular-nums bila tersedia |
| `quality-rule-id` | Label `rule_id` (mis. `completeness`) | Mono 12px, `text-secondary` — bukan warna, bukan ikon saja |

Larangan warisan DS-CORE-001: raw hex dilarang di komponen quality; radius 6/8px & spacing base 4px tetap; tidak ada kartu bertumpuk (LD-04).

## Komponen baru

| Komponen | Varian | Do | Don't |
|---|---|---|---|
| `QualitySummary` | ada temuan, bersih, stale | Total per severity (mis. "1 Masalah, 3 Perlu perhatian, 12 OK") + fingerprint singkat | Statistik inferensial; kesimpulan bisnis (“data layak jual”) — bukan M2 |
| `QualityFindingsTable` | default, loading skeleton, empty, error | Kolom: Kolom \| Aturan \| Severity \| Bukti (count + % + detail); scroll horizontal di dalam pane tabel saja | Baris tanpa bukti; aturan disembunyikan (skipped rule harus tampil dengan penjelasan) |
| `QualitySkeleton` / `QualityEmpty` / `QualityError` | — | Skeleton bentuk tabel (LD-10), pesan literal per SCREEN-QUAL-001 | Spinner tanpa label; tabel kosong tanpa teks |
| `QualityCtaM3` | disabled | Catatan jujur "Cleaning tersedia di M3" — tombol disabled dengan alasan | Dead-end: tombol mati tanpa penjelasan; cleaning aktif di M2 |

## Aturan tampilan (mengikat implementasi)

1. **Angka + bukti selalu berpasangan**: setiap baris severity wajib disertai evidence count/pct/detail dari Q4 — tidak boleh tampil badge saja.
2. **Severity bukan warna saja**: badge selalu berteks (OK / Perlu perhatian / Masalah) + `rule_id` mono.
3. **Tabel boleh panjang**: long-content scroll di dalam pane tabel; summary tetap terlihat di atas pane (sticky header bila sederhana).
4. **Aksesibilitas**: tabel findings adalah `<table>` native (keyboard dapat diakses); status job `aria-live="polite"`; ringkasan total berupa teks.
5. **Gerakan**: transisi ≤ 150ms, hormati reduced-motion; tidak ada animasi dekoratif.
6. **Tidak ada chart**: quality = tabel saja (DS ini tidak menambah token chart). Histogram tetap memakai DS-HIST-001 bila user berpindah kolom.
7. **ECharts-only** tetap berlaku untuk fitur yang memakai chart (LD-06); quality tidak memakai chart, jadi tidak ada konflik.

## Enforcement (G6)

- Review checklist: token severity terpakai di tema terpusat; tidak ada hex literal di komponen quality; tabel findings bukan `<div>` grid.
- Uji aksesibel: tabel dapat diakses keyboard; status `aria-live` mengumumkan "Selesai" / "Gagal".
- Screenshot 900px & 1440px pada state done/loading/empty untuk Critic (G5).

## Exit G4 (untuk review PO)
Token & komponen quality terkunci untuk slice G5. Perubahan set aturan (Q1), ambang severity (Q2), atau kontrak IPC (Q5) setelah G4 = perubahan kontrak → butuh impact review sebelum implementasi. Bila PO menolak Q5 (menuntut persistensi), slice G5 ditambah tabel `quality_assessments` mengikuti pola `profiles` G6 — keputusan itu tercatat sebelum coding.
