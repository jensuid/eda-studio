# DS-CORE-001 — Design System & Component Contract (awal, untuk M2)

**Status:** Draft v0.1 for G4 review · **Scope:** hanya token & komponen yang dibutuhkan
profiling slice dulu; diperluas seiring fitur M2 (aturan: token/varian baru wajib ada use case).

## Tokens (semantic names, bukan hex)
- **Color:** `surface` (latar utama), `surface-raised` (kartu/panel), `text-primary`,
  `text-secondary`, `border-subtle`, `accent` (aksi primer), `status-success`,
  `status-warning`, `status-danger`, `status-info`. Kontras teks ≥ 4.5:1 (AA).
- **Typography:** satu family sistem; scale `title` / `body` / `caption`; line-height ≥ 1.4.
- **Spacing:** base unit 4px; gap scale 4/8/16/24; padding panel 16.
- **Sizing:** tinggi kontrol 36px; lebar kolom tabel adaptif; min window 1024px (desktop).
- **Shape:** radius 6px (kontrol), 8px (panel); border 1px `border-subtle`.
- **Elevation:** panel memakai border + surface-raised; shadow minimal (desktop app tenang).
- **Motion:** transisi ≤ 150ms; hormati reduced-motion.

## Components (yang dibutuhkan slice profiling)
| Komponen | Varian | Do | Don't |
|---|---|---|---|
| Button primer | default, loading, disabled | satu aksi primer per layar | dua tombol primer bersaing |
| Badge status | success/warning/danger + label teks | status kolom (OK/periksa/bermasalah) | warna saja tanpa teks |
| Tabel data | sortable, virtual scroll | header scope, sel kosong bermakna | tabel tanpa state loading/empty |
| Banner | info/warning/error | hasil usang, job gagal | modal untuk error non-blocking |
| Progress/status job | indeterminate + label | "Profiling berjalan…" | spinner tanpa label |

## Data visualization (aturan, Doc09 framework + Doc07)
Tujuan chart dinyatakan dulu sebelum tipe chart; judul, satuan, sumbu, legenda, empty/loading
state, ringkasan aksesibel (teks), dan pembeda non-warna wajib ada. Profiling slice memakai
ringkasan distribusi sederhana; chart interaktif penuh = iterasi M2 berikutnya.

## Enforcement
- Raw hex/spacing liar dilarang di komponen bersama (review checklist G6).
- Token terpusat di satu modul tema frontend; komponen domain tetap di modul fitur
  sampai reuse terbukti (Doc09 framework §Governance).
