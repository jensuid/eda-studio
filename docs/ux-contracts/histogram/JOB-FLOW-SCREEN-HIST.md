# Histogram Deskriptif (M2) — G1 Job + G2 Flow + G3 Screen Contracts

**IDs:** JOB-HIST-001, FLOW-HIST-001, SCREEN-HIST-001 · **Status:** Draft untuk G1–G4 review (2026-11-05)
**Parent:** Doc08 §5 Guided stage 3 (Profile) · JobManager (Doc05) · ECharts (Doc07, LD-06 di DS-CORE-001)
**Rigor:** Standard (G1, G2, G3–G6) · **Kondisi:** belum boleh coding UI sampai kontrak ini disetujui PO.
**Keputusan yang masih PROPOSED:** T1–T5 di bagian bawah (butuh ratifikasi PO saat exit G4).

## G1 — Job Contract (JOB-HIST-001)

```yaml
job: "Melihat bentuk distribusi satu kolom untuk menilai kecenderungan dan keanehan data"
actor: "Data analyst / data user lokal, 1 user per workspace, volume kecil-menengah (CSV/XLSX/Parquet)"
trigger: "Profiling selesai (ProfileRecord tersedia) dan user memilih satu kolom untuk dilihat distribusinya"
frequency: "Beberapa kali per dataset (1-2 kolom utama); sekali klik per kolom"
inputs:
  - "Dataset + snapshot Parquet (immutable, SHA-256)"
  - "ProfileRecord (tipe inferensi, missing %, ringkasan per kolom)"
desired_outcome: "User dapat menjawab bentuk distribusi kolom: merata/miring/mengelompok, di mana puncak dan ekornya, berapa banyak missing — cukup untuk memutuskan cleaning/analisis berikutnya tanpa membuka file mentah"
success_signal: "User memilih aksi berikutnya (clean/analyze/ganti kolom) dengan tepat setelah melihat chart; setiap nilai dapat ditelusur ke snapshot fingerprint"
failure_cost: "Bin/sumbu yang salah (aturan binning tak jelas, skala dihilangkan) menyesatkan -> keputusan cleaning/analisis keliru"
not_in_scope:
  - item: "Statistik inferensial (uji hipotesis, p-value)"
    reason: "Tahap analisis terpisah, bukan deskriptif (JOB-PROF-001)"
  - item: "Grafik multi-variabel (scatter, korelasi, heatmap)"
    reason: "Visualisasi lanjutan M3; histogram = univariat saja"
  - item: "Interpretasi AI otomatis atas bentuk distribusi"
    reason: "AI bukan source of truth (AI-013/014); chart menampilkan angka, bukan kesimpulan"
  - item: "Export chart (PNG/Excel)"
    reason: "P4; tabel data tersedia sebagai alternatif non-visual"
```

## G2 — Flow Contract (FLOW-HIST-001)

- **entry:** Dari Profiling selesai (ProfileRecord tampil) → user memilih kolom → primary action "Tampilkan Histogram".
- **steps:**
  1. `select` — user memilih kolom dari daftar `ProfileRecord`. Feedback: strategi chart terapkan (T1: numerik → histogram, kategorikal → frequency bar), tombol primer aktif.
  2. `run` — klik primer; sistem membuat Job `dataset.histogram.run` (Created→Queued→Preparing→Running→Completed, backend-authoritative). Feedback: skeleton bentuk chart + status job (`role="status"`, aria-live).
  3. `view` — job Completed; chart + `ChartSummary` + toggle `ChartDataTable` tampil. Feedback: angka di chart sama dengan ringkasan numerik (min/max/mean konsisten dengan ProfileRecord).
  4. `next` — user memilih: ganti kolom, lanjut ke Quality/Cleaning, atau kembali ke tabel profiling. Hasil tetap tercatat di job history.
- **branches:**
  - Job Failed → banner error dari ErrorContract + "Coba lagi" / "Kembali". Tidak ada dead-end.
  - Job Cancelled → state Cancelled jelas + "Jalankan ulang".
  - Kolom kategorikal → bukan error: tampil frequency bar (T3). Kolom konstan (distinct=1) → single-bin + badge status dari profiling.
  - Kolom semua missing → empty state khusus (bukan chart kosong): "Kolom ini tidak memiliki nilai" + CTA kembali ke tabel profiling.
  - Dataset tanpa profil → empty_first_run: "Jalankan profiling terlebih dahulu" + CTA ke Profiling.
- **completion:** Chart tampil + tercatat di job history (durable events); fingerprint tampil di ringkasan.
- **cancel_and_back:** Cancel aktif selama Running. Back ke tabel profiling tanpa kehilangan riwayat profil; chart terakhir tetap bisa dibuka dari riwayat (G6 follow-up, bukan slice pertama).

## G3 — Screen & Interaction Contract (SCREEN-HIST-001)

- **screen:** `histogram` (panel/region di layar Profiling) · **purpose:** "Lihat distribusi satu kolom dalam satu pandangan" · **primary_action:** "Tampilkan Histogram"
- **keputusan tampil per tipe (T1, PROPOSED):**
  - Numerik (`inferred_type == numeric`) → **histogram** (binning per T2).
  - Kategorikal/string → **frequency bar** top kategori + 1 bar "Lainnya" (T3). Tidak ada histogram untuk kategorikal.
  - Konstan (distinct = 1) → single-bar + status `check/problem` dari ProfileRecord.
- **hierarchy:**
  1. Kolom selector + tombol primer "Tampilkan Histogram".
  2. Chart area (`HistogramChart`) + judul "Distribusi {kolom}".
  3. `ChartSummary`: min, max, mean, bin/kategori terpadat (count + %), missing %.
  4. Toggle `ChartDataTable` (alternatif non-visual) + ringkasan teks aksesibel.
- **removed:** boxplot/violin/density curve (iterasi berikutnya), scatter, export PNG, interpretasi AI — semua bukan kebutuhan JOB-HIST-001.
- **regions & states (8 wajib):**
  - `loading`: `ChartSkeleton` (bentuk chart) + status job "Membuat histogram…"; kolom selector + tombol primer disabled.
  - `empty_first_run`: belum ada profil → ajakan "Jalankan profiling terlebih dahulu" + CTA.
  - `empty_filtered`: kolom semua-missing → "Kolom ini tidak memiliki nilai" + CTA kembali.
  - `partial`: profil lama + fingerprint chart ≠ snapshot terkini → banner "Hasil mungkin usang — jalankan ulang".
  - `error`: ErrorContract literal + "Coba lagi".
  - `long_content`: banyak bin/kategori → scroll hanya di dalam chart area; selector + ringkasan tetap terlihat.
  - `restricted`: tidak ada peran restricted di M2 (single-user lokal, sama seperti SCREEN-PROF-001).
  - `done`: chart + ringkasan terisi; bar puncak berlabel; fingerprint tampil.
- **interactions:**
  - Pilih kolom → strategi chart diperbarui, tombol primer aktif; fokus tetap di selector.
  - Hover bar (pointer) → tooltip "Rentang: {min}–{max} · {count} nilai ({pct}%)" (kategorikal: "{kategori}: {count} ({pct}%)").
  - Toggle tabel → `ChartDataTable` tampil menggantikan/alternatif chart; chart bukan satu-satunya jalur data.
  - Klik "Tampilkan Histogram" → job dibuat, fokus ke status, skeleton tampil.
- **keyboard:** Tab: ColumnSelect → tombol primer → toggle tabel → (chart container fokusable, Enter = buka tabel data). Fokus kembali ke status setelah aksi.
- **validation:** kolom wajib dipilih sebelum run; kolom yang tidak ada di profil ditolak backend (default-deny, SEC-004).
- **copy (ID, literal):** judul "Distribusi {kolom}"; primer "Tampilkan Histogram"; loading "Membuat histogram…"; error "Histogram gagal dibuat. Silakan coba lagi."; empty-missing "Kolom ini tidak memiliki nilai."; ringkasan aksesibel: "Distribusi {kolom}: {n} nilai, rentang {min}–{max}, puncak di {bin} ({pct}%)."
- **accessibility:** kontras AA (DS-HIST-001); chart container `role="img"` + `aria-label` = kalimat ringkasan di atas; tabel data selalu tersedia (non-color-only distinction: bar puncak berlabel); status `aria-live="polite"`.
- **responsive/adaptive (desktop, 900px min — DS-CORE-001):** ≥1200px: selector + chart + ringkasan berdampingan. 900–1200px: selector menumpuk di atas chart, ringkasan di bawah chart. Scroll horizontal hanya di dalam chart area, tidak di halaman. Semua state terbaca di 900px; tidak ada layout mobile (Doc14).

## Kontrak teknis yang diusulkan (untuk G5/G6, bukan bagian UI kontrak)

- **IPC (PROPOSED, T5):** command `dataset.histogram.run` (JobManager-wrapped, seperti `dataset.profile.run`) dengan payload `{project_id, dataset_id, column_name}` → `HistogramRecord {dataset_id, snapshot_id, fingerprint, column_name, inferred_type, kind: 'histogram'|'frequency', bins: [{label, count}], stats: {min, max, mean, missing_pct, top_bin}}`.
- **Payload kecil** (bin ≤ T2/T3) → JSON IPC tetap aman; bukan whole-DataFrame (aturan "no whole-DataFrame JSON" tidak terlanggar).
- **Binning (PROPOSED, T2):** adaptif berbasis IQR (Freedman–Diaconis) dengan batas maksimal **30 bin**; bila IQR = 0 → fallback jeda sama dari min–max. Aturan ini wajib didokumentasikan di UI (tertulis di tooltip/footnote) agar tidak menyesatkan.
- **Kategorikal (PROPOSED, T3):** top **10** kategori + 1 bar "Lainnya" (menjumlahkan sisanya).
- **Traceability (PROPOSED, T4):** setiap `HistogramRecord` membawa `snapshot_id` + `fingerprint` yang sama dengan profilnya; chart dari snapshot lama ditandai partial (banner usang).

## Exit G1–G3 (untuk review PO)
Tidak ada perilaku penting yang ditinggalkan ke penemuan implementasi: strategi chart per tipe, binning, 8 states, keyboard, copy, dan a11y sudah diputuskan (T1–T5 PROPOSED menunggu ratifikasi). **Belum boleh coding UI sampai kontrak ini disetujui.**
