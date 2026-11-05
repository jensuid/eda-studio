# DS-HIST-001 — Design System & Component Contract (Histogram, M2)

**Status:** Draft v0.1 untuk G4 review · **Scope:** perluasan DS-CORE-001 khusus distribusi deskriptif.
Token & komponen di DS-CORE-001 tetap berlaku; kontrak ini hanya menambah yang dibutuhkan histogram.
**Sifat:** semua yang baru di bawah ini **PROPOSED** sampai disetujui PO di G4 exit.

## Tokens tambahan (semantic, bukan hex)

| Token | Penggunaan | Catatan |
|---|---|---|
| `chart-series` | Bar histogram/frequency | Satu seri saja; warna = `accent` DS-CORE-001 |
| `chart-series-muted` | Bar "Lainnya" (kategorikal) & bin non-puncak opsional | Pembeda **non-warna** wajib: pola/border berbeda, bukan hanya abu |
| `chart-peak` | Bar bin terpadat | Label nilai selalu tampil di bar ini (bukan tooltip saja) |
| `chart-outlier` | Bin outlier candidate (ekor jauh) | Mark khusus + teks "outlier candidate" di ringkasan |
| `chart-axis` | Garis/tick sumbu + label | `text-secondary`, kontras ≥ 4.5:1 untuk teks tick |
| `chart-grid` | Gridlines horizontal | `border-subtle`, maksimal 4 garis |

Larangan warisan DS-CORE-001: raw hex dilarang di komponen chart; chart tidak boleh memakai
palet multi-seri (satu seri, T1–T3); radius 6/8px & spacing base 4px tetap.

## Komponen baru

| Komponen | Varian | Do | Don't |
|---|---|---|---|
| `ColumnSelect` | default, disabled (tanpa profil), error | Daftar kolom dari `ProfileRecord` persis (nama + tipe singkat) | Daftar dari data mentah / kolom yang tidak ada di profil |
| `HistogramChart` | histogram (numerik), frequency (kategorikal), single-bin (konstan), loading skeleton, empty, error | Judul, satuan, label sumbu, tooltip (rentang + count + %), label bar puncak | Chart tanpa judul/satuan; warna saja sebagai pembeda; sumbu tanpa satuan |
| `ChartSummary` | numerik, kategorikal | Min–max/mean, bin terpadat, missing %, kalimat aksesibel | Statistik inferensial (uji/p-value) — bukan M2 |
| `ChartDataTable` | — | Tabel bin/kategori + count + %; alternatif non-visual chart; toggle di samping chart | Chart tanpa alternatif tabel (pelanggaran a11y) |
| `ChartSkeleton` / `ChartEmpty` / `ChartError` | — | Skeleton bentuk chart (LD-10), pesan literal per SCREEN-HIST-001 | Spinner tanpa label; chart kosong tanpa teks |

## Aturan visualisasi (mengikat implementasi)

1. **Tujuan sebelum tipe** (sudah diputuskan di T1): numerik → histogram, kategorikal → frequency bar.
2. **Judul + satuan wajib**: judul "Distribusi {kolom}"; sumbu X mencantumkan rentang/satuan
   (mis. "sales (Rp)" bila diketahui dari nama kolom — tidak mengarang satuan baru).
3. **Sumbu dibatasi**: tick X maksimal ~10 label; bar area scroll internal bila perlu (bukan page scroll).
4. **Tooltip**: "Rentang: {min}–{max} · {count} nilai ({pct}%)" (kategorikal: "{kategori}: {count} ({pct}%)").
5. **Pembeda non-warna**: bar puncak berlabel; "Lainnya"/outlier berpolal/border berbeda dari bar biasa.
6. **Aksesibilitas**: container `role="img"` + `aria-label` = kalimat ringkasan SCREEN-HIST-001;
   `ChartDataTable` selalu tersedia; status job `aria-live="polite"`.
7. **Gerakan**: transisi ≤ 150ms, hormati reduced-motion; tidak ada animasi dekoratif pada chart.
8. **ECharts-only** (LD-06): tidak ada plotly/bokeh/custom canvas.

## Enforcement (G6)

- Review checklist: token chart terpakai di tema terpusat; tidak ada hex literal di komponen chart.
- Uji aksesibel: chart container punya aria-label + tabel data dapat diakses keyboard.
- Screenshot 900px & 1440px pada state done/loading/empty untuk Critic (G5).

## Exit G4 (untuk review PO)
Token & komponen histogram terkunci untuk slice G5. Perubahan aturan binning (T2) atau
kontrak IPC (T5) setelah G4 = perubahan kontrak → butuh impact review sebelum implementasi.
