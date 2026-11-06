# DS-BIVAR-001 — Design System & Component Contract (Bivariate, M2)

**Status:** Ratified v1.0 oleh PO (2026-11-06) — lihat `01-po-ratifikasi.md` · **Scope:** perluasan DS-CORE-001 khusus hubungan dua kolom deskriptif.
Token & komponen di DS-CORE-001 + DS-HIST-001 tetap berlaku; kontrak ini hanya menambah yang dibutuhkan bivariat.
**Sifat:** semua yang baru di bawah ini **PROPOSED** sampai disetujui PO di G4 exit.

## Tokens tambahan (semantic, bukan hex)

| Token | Penggunaan | Catatan |
|---|---|---|
| `chart-scatter-point` | Titik scatter B1 | Satu seri; warna = `accent` DS-CORE-001; outline berbeda untuk sampel vs exact tidak dibedakan visual (badge teks yang membedakan) |
| `chart-group-bar` | Bar mean B2 | Satu seri; warna = `accent` |
| `chart-heat-cell` | Cell heatmap B3 | Skala intensitas tunggal (monokrom accent); bukan palet multi-warna |
| `chart-axis` | Garis/tick sumbu + label | `text-secondary`, kontras ≥ 4.5:1 untuk teks tick |
| `chart-grid` | Gridlines | `border-subtle`, maksimal 4 garis |
| `badge-exact` / `badge-sampled` | Lencana mode komputasi di ringkasan | Badge teks ("Exact" / "Sampled (n=…)"), bukan warna saja |
| `badge-stale` | Lencana hasil usang | Teks "Usang — jalankan ulang" + banner (SCREEN-BIVAR-001), bukan warna saja |

Larangan warisan DS-CORE-001/DS-HIST-001: raw hex dilarang di komponen chart; tidak ada palet multi-seri; radius 6/8px & spacing base 4px tetap.

## Komponen baru

| Komponen | Varian | Do | Don't |
|---|---|---|---|
| `ColumnPairSelect` | default, disabled (tanpa profil), error | Dua selector dari `ProfileRecord` (nama + tipe singkat) + label mode otomatis | Selector dari data mentah / kolom di luar profil; pasangan sama diizinkan |
| `BivariateChart` | scatter (B1), groupBar (B2), heatmap (B3), loading skeleton, empty, error | Judul, satuan, label sumbu, tooltip mode-spesifik, footnote "Correlasi ≠ sebab-akibat" (B1) / "Sampled n=…" bila relevan | Chart tanpa judul/satuan; warna saja sebagai pembeda; klaim kausal |
| `BivariateSummary` | num-num, cat-num, cat-cat | Angka mode + n + missing pairs + fingerprint + badge exact/sampled + kalimat aksesibel SCREEN-BIVAR-001 | Statistik inferensial / p-value; kesimpulan bisnis |
| `BivariateDataTable` | B1 ringkas+sampel, B2 per-grup, B3 cross-tab | Tabel angka yang sama dengan chart; alternatif non-visual; toggle di samping chart | Chart tanpa alternatif tabel (pelanggaran a11y); whole-DataFrame JSON |
| `BivariateSkeleton` / `BivariateEmpty` / `BivariateError` | — | Skeleton bentuk chart (LD-10), pesan literal per SCREEN-BIVAR-001 | Spinner tanpa label; chart kosong tanpa teks |

## Aturan visualisasi (mengikat implementasi)

1. **Tujuan sebelum tipe** (diputuskan di V1): tipe pasangan menentukan mode B1/B2/B3; pengguna tidak memilih chart.
2. **Judul + satuan wajib**: judul "Hubungan {kolom_a} × {kolom_b}"; sumbu mencantumkan nama kolom; satuan hanya bila diketahui dari nama kolom — tidak mengarang satuan baru.
3. **Sumbu dibatasi**: tick maksimal ~10 label; kategori > V4 digabung "Lainnya" (didokumentasikan di footnote + tabel).
4. **Tooltip**: B1 "x, y" (+ Pearson/Spearman di footnote); B2 "{kategori}: mean {m} · median {md} · n {n}"; B3 "{a} × {b}: {count} ({pct}% dari {a})".
5. **Pembeda non-warna**: badge exact/sampled teks; "Lainnya" berborder/pola berbeda; stale = teks banner, bukan warna saja.
6. **Aksesibilitas**: container `role="img"` + `aria-label` = kalimat ringkasan SCREEN-BIVAR-001; `BivariateDataTable` selalu tersedia; status job `aria-live="polite"`.
7. **Gerakan**: transisi ≤ 150ms, hormati reduced-motion; tidak ada animasi dekoratif pada chart.
8. **ECharts-only** (LD-06): tidak ada plotly/bokeh/custom canvas. Heatmap B3 diimplementasikan sebagai `visualMap` + cell/tooltip, bukan tabel trik.
9. **Sampling eksplisit**: bila `sampled: true`, footnote chart + badge menampilkan `sample_size` dan aturan seleksi (deterministik: baris pertama n pada snapshot, atau V3 bila PO memilih lain). Tidak ada silent approximation.

## Nilai ambang yang masih PROPOSED (untuk ratifikasi)

| ID | Ambang | Usulan |
|---|---|---|
| V2 | Korelasi | Pearson + Spearman, 2 desimal UI |
| V3 | Scatter sample | Batas n tampilan = **2000 titik** (baris pertama deterministik); n_pair tetap dihitung exact |
| V4 | Gabung kategori | Top **10** kategori/sumbu + 1 "Lainnya" |
| V5 | B2 chart | Bar = mean; tabel = count/mean/median/min–max (boxplot ditunda) |
| V6 | Tabel B1 | Ringkasan + sampel titik yang sama dengan chart (bukan DataFrame penuh) |
| V7 | IPC | `dataset.bivariate.run` JobManager-wrapped → `BivariateRecord` |
| V1 | Pemetaan tipe | numerik×numerik→B1; kategorikal×numerik→B2; kategorikal×kategorikal→B3; tipe lain ditolak eksplisit |

## Enforcement (G6)

- Review checklist: token chart terpakai di tema terpusat; tidak ada hex literal di komponen chart; tidak ada bahasa kausal di copy.
- Uji aksesibel: chart container punya aria-label + tabel data dapat diakses keyboard; pembeda tidak hanya warna.
- Screenshot 900px & 1440px pada state done/loading/empty per mode (B1/B2/B3) untuk Critic (G5).

## Exit G4 (untuk review PO)

Token & komponen bivariat terkunci untuk slice G5. Perubahan ambang V1–V7 setelah G4 = perubahan kontrak → butuh impact review sebelum implementasi.
