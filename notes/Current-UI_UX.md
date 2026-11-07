## Evaluasi UI/UX Saat Ini

### Kondisi Sekarang (dari [ProjectPage.tsx](frontend/src/features/project/ProjectPage.tsx))

Halaman projekt masih berupa **single-page form stack mentah**:

- 8+ section (Projekt, Import, Profiling, Snapshots, Provenance, Backup, Export, Insights, Diagnostic) ditumpuk vertikal, semua form input teks path manual.
- Pola "ketik path file" untuk backup/restore/export/diagnostic — mengharuskan user mengetik path absolut, rawan typo.
- Tidak ada **file-native dialog** (open/save picker) — user tidak bisa browse file seperti aplikasi desktop normal.
- Tidak ada **sidebar navigasi** — semua di satu scroll; workflow inti (import → analyse → report) tenggelam di antara section utilitas (backup/diagnostic).
- Tidak ada **empty state, loading skeleton, atau toast feedback** terpusat — hanya `<p role="alert">` per-section.
- Data utama (dataset, profil, findings) hanya tabel teks; visualisasi ECharts untuk histogram/bivariate ada tapi tidak terhubung ke workflow highlight.
- Tidak ada **command palette / keyboard shortcut** untuk user power.
- Tidak ada **tema, spacing system, atau komponen design** — hasil akal-akalan styling per-section.

**Kesimpulan:** fungsional lengkap, tapi **yakni prototype engineering, bukan produk**. Untuk Beta validation, ini akan jadi penghalang utama — user non-teknis akan bingung di path input dan struktur halaman.

### Plan UI/UX yang Saya Rekomendasikan (Urutan)

#### Tahap 1 — Struktur & Navigasi (fondasi Beta)
1. **Sidebar layout** — navigasi antar workflow: `Datasets` | `Analysis` | `Insights` | `Reports` | `Project tools` (Backup/Diagnostic/SBOM).
2. **Stepper workflow** untuk MVP path: Import → Profil → Cleaning/Analyse → Report → Export, dengan status per-step.
3. **File picker native** — ganti input path teks dengan `showOpenFilePicker` / dialog pywebview untuk import, save, backup, export, diagnostic.

#### Tahap 2 — Komponen & Feedback
4. **Design system ringan** — spacing/type/color token, tombol primer/sekunder, form field konsisten (1 file CSS + komponen kecil).
5. **Toast & empty state** terpusat, skeleton loading untuk query berat (profile/report).
6. **Dataset card** — ringkasan 1 baris (nama, rows, columns, fingerprint) + aksi cepat, bukan sekadar tabel.

#### Tahap 3 — Polish Beta
7. **Visualisasi terhubung** — histogram/bivariate ECharts inline di Analysis, bukan section terpisah.
8. **Command palette** (Cmd+K) untuk aksi umum.
9. **Dark mode** opsional + responsive min-width untuk jendela desktop.

### Estimasi
Tahap 1 ≈ 2–3 slice kecil (layout + stepper + file picker). Tahap 2–3 menyusul sebelum Beta publik.

---

Mau saya mulai dari **Tahap 1** (sidebar + stepper + file picker)? Atau kamu mau lihat dulu wireframe/mockup tertulis untuk layout-nya sebelum coding?

---

## Wireframe/Mockup — Layout Baru (Tahap 1)

### Struktur Global (Desktop 3-panel)

```
┌──────────────────────────────────────────────────────────────────────┐
│ Titlebar: EDA Workbench · Project: Demo                [_] [□] [×]  │
├──────────┬───────────────────────────────────────────┬───────────────┤
│ SIDEBAR  │  MAIN CONTENT (per route)                 │  RIGHT PANEL  │
│ (nav)    │                                          │  (contextual) │
│          │                                          │               │
│ ▸ Datasets│  ┌──────────────────────────────────┐   │  Dataset Info │
│ ▸ Analysis│  │ Stepper: ① Import → ② Profil →  │   │  - rows: 1,240│
│ ▸ Insights│  │           ③ Analyse → ④ Report  │   │  - cols: 8    │
│ ▸ Reports │  └──────────────────────────────────┘   │  - fp: a3f9…  │
│ ▸ Tools   │                                          │               │
│          │  [ Konten route aktif ]                  │  [ Aksi cepat ]│
│ ─────────│                                          │               │
│ ⚙ Settings│  Status bar / toast region              │               │
└──────────┴───────────────────────────────────────────┴───────────────┘
```

### Route: Datasets
```
┌─ Datasets ───────────────────────────────────────────────┐
│ [ + Import Dataset ]   (button primer → file picker)     │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ sample.csv                        rows: 128 · cols:6│  │
│ │ fp a3f9c… · imported 2026-11-06 · [Aktif]           │  │
│ │ [Open] [Profile] [Export ▾] [Provenance]             │  │
│ └────────────────────────────────────────────────────┘  │
│ ┌────────────────────────────────────────────────────┐  │
│ │ messy.csv                         rows: 42 · cols:4 │  │
│ │ [Open] [Profile] [Export ▾] [Provenance]             │  │
│ └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Route: Analysis (per dataset terpilih)
```
┌─ Analysis: sample.csv ──────────────────────────────────┐
│ Stepper: ① Import ✓ → ② Profil ← (aktif) → ③ Analyse ○ │
│                                                          │
│ ┌─ Profil Risiko ──────────────┐ ┌─ Quality ───────────┐│
│ │ rows 128 · nulls 3 · dup 0   │ │ score: 92/100       ││
│ │ [Run Profile] [Re-run]       │ │ [Lihat detail]      ││
│ └──────────────────────────────┘ └─────────────────────┘│
│                                                          │
│ ┌─ Histogram: x ───────────────┐ ┌─ Bivariate ─────────┐│
│ │  [ECharts chart]             │ │  [ECharts scatter]  ││
│ │  bins: 20 · [Run]            │ │  [Run]              ││
│ └──────────────────────────────┘ └─────────────────────┘│
└──────────────────────────────────────────────────────────┘
```

### Route: Insights
```
┌─ Insights: sample.csv ───────────────────────────────────┐
│ [ + Finding ]  [ + Hypothesis ]                          │
│                                                          │
│ FINDINGS                          STATUS                  │
│ ──────────────────────────────────────────────────────   │
│ Duplicate rows 3%              [Proposed] [Accept][...]  │
│ Missing X correlated w/ Y      [Accepted] [Archive]      │
│                                                          │
│ HYPOTHESES                                                 │
│ ──────────────────────────────────────────────────────   │
│ X memengaruhi Y           [Investigating] [Supported]... │
│                                                          │
│ (Anotasi + evidence snapshot_id ditampilkan di expand)   │
└──────────────────────────────────────────────────────────┘
```

### Route: Reports & Tools
```
┌─ Reports ───────────────────────────────────────────────┐
│ [Generate HTML Report]  [Generate PDF]                   │
│                                                          │
│ Riwayat artefak:                                          │
│ report-2026-11-06.html  · 2.1 MB · [Open] [Download]    │
│ report.pdf            · 890 KB  · [Open]                 │
└──────────────────────────────────────────────────────────┘

┌─ Tools ─────────────────────────────────────────────────┐
│ Backup & Restore                              [status]  │
│  [Save Backup ▾] → file picker .edaworkspace            │
│  [Restore]       → folder tujuan baru (validasi auto)   │
│                                                          │
│ Diagnostic Bundle                         [status]      │
│  [Create] → .zip redacted (tanpa data mentah)            │
│                                                          │
│ Export Dataset                              [status]    │
│  sample.csv → [CSV ▾] [Parquet ▾] → file picker          │
└──────────────────────────────────────────────────────────┘
```

### Prinsip yang Dipakai
1. **Workflow-first, bukan feature-stack** — stepper menuntun MVP path; utilitas (backup/diagnostic) pindah ke Tools.
2. **File picker > ketik path** — semua path lewat native dialog; path teks hanya fallback.
3. **Dataset adalah objek pusat** — Analysis/Insights/Reports selalu dalam konteks dataset aktif (right panel).
4. **Status terlihat** — stepper + badge status (Proposed/Accepted/dll) di mana-mana, bukan di dalam form.
5. **Satu pola aksi** — `[Run]`/`[Create]` + pending spinner + toast sukses/gagal terpusat.

---

Kalau wireframe ini disetujui, pilihan eksekusi:

- **(a)** Langsung implement Tahap 1 di session ini — layout sidebar + stepper + file picker, bertahap per slice.
- **(b)** Saya breakdown jadi daftar slice kecil (estimasi + urutan) dulu, untuk kamu review sebelum coding.
- **(c)** Mockup HTML statis dulu (satu file, tanpa backend) untuk validasi visual sebelum implementasi React.

Pilih (a), (b), atau (c)?
