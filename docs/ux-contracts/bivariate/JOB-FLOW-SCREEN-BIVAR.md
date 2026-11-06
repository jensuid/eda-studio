# Bivariate Analysis Deskriptif (M2) — G1 Job + G2 Flow + G3 Screen Contracts

**IDs:** JOB-BIVAR-001, FLOW-BIVAR-001, SCREEN-BIVAR-001 · **Status:** Ratified oleh PO (2026-11-06) — lihat `01-po-ratifikasi.md`; siap validasi Critic, selanjutnya G5.
**Parent:** Doc16 §M2 (Basic bivariate analysis) · Doc01 §Scope (Basic univariate and bivariate analysis) · Doc08 §5 Guided stage 3+ · JobManager (Doc05) · ECharts (Doc07, LD-06 di DS-CORE-001)
**Rigor:** Standard (G1, G2, G3–G6) · **Kondisi:** belum boleh coding UI sampai kontrak ini disetujui PO.
**Keputusan yang masih PROPOSED:** V1–V7 di bagian bawah (butuh ratifikasi PO saat exit G4).

## G1 — Job Contract (JOB-BIVAR-001)

```yaml
job: "Melihat hubungan dua kolom untuk menilai apakah analisis lanjutan layak"
actor: "Data analyst / data user lokal, 1 user per workspace, volume kecil-menengah (CSV/XLSX/Parquet)"
trigger: "Profiling + Quality selesai (ProfileRecord + QualityRecord tersedia) dan user memilih dua kolom untuk dibandingkan"
frequency: "Beberapa kali per dataset (2-3 pasangan kolom utama); sekali klik per pasangan"
inputs:
  - "Dataset + snapshot Parquet (immutable, SHA-256)"
  - "ProfileRecord (tipe inferensi, missing %, ringkasan per kolom)"
  - "QualityRecord (untuk gate: hasil bivariat dari snapshot lama = stale)"
desired_outcome: "User dapat menjawab: dua kolom ini bergerak bersama atau tidak, seberapa kuat, dan dalam bentuk apa (korelasi / beda grup / tabel silang) — cukup untuk memutuskan analisis berikutnya tanpa membuka file mentah"
success_signal: "User memilih aksi berikutnya (ganti pasangan, lanjut cleaning/analisis terpisah, atau kembali ke univariate) dengan tepat setelah melihat hasil; setiap angka tertelusur ke snapshot fingerprint + pasangan kolom + metode"
failure_cost: "Korelasi dibaca sebagai sebab-akibat, sampled diam-diam, atau kategori digabung tanpa dokumentasi -> keputusan analisis menyesatkan (Doc13: causal claims require causal evidence; Doc10: AI must not describe correlation as causation)"
not_in_scope:
  - item: "Uji inferensial & p-value / CI (t-test, ANOVA, chi-square)"
    reason: "Tahap inferensi terpisah (M3+); M2 = deskriptif saja (korelasi ringkas, mean grup, count silang)"
  - item: "Interpretasi kausal / rekomendasi bisnis otomatis"
    reason: "AI bukan source of truth (AI-013/014); hasil menampilkan angka + bentuk, bukan kesimpulan"
  - item: "Regresi / model prediktif"
    reason: "Di luar M2 Core EDA; bivariate = observasi hubungan, bukan pemodelan"
  - item: "Export chart / report HTML"
    reason: "P4; tabel data tersedia sebagai alternatif non-visual"
  - item: "Agregasi > 2 kolom / pivot multi-dimensi"
    reason: "Bivariate = tepat dua kolom per run; multivariat = M3+"
```

## Scope B1–B3 (yang dikontrak)

| ID | Pasangan tipe | Hasil wajib | Chart (ECharts) |
|---|---|---|---|
| **B1** | numerik × numerik | Pearson r + Spearman ρ (2 desimal) + n pasangan + missing pairs; scatter (sampled bila > V3, direkam eksplisit) | Scatter 2D, sumbu berlabel kolom; titik "Lainnya" tidak ada |
| **B2** | kategorikal × numerik | Per kategori: count, mean, median, min–max; total selisih mean max–min | Bar per kategori (mean) + tooltip median/count; atau boxstrip bila renderer mendukung (V5) |
| **B3** | kategorikal × kategorikal | Cross-tab: count + % per baris; marginal totals; kategori "Lainnya" bila > V4 | Heatmap bar-tabel (cell = count, intensitas = % baris); bukan chart 3D |

Catatan arah: B2/B3 tidak simetris — urutan kolom pertama = baris/grup. Kontrak menyebut `column_a` (pertama) dan `column_b` (kedua) eksplisit di payload + record.

## G2 — Flow Contract (FLOW-BIVAR-001)

- **entry:** Dari Profiling + Quality selesai → user memilih dua kolom → primary action "Jalankan Analisis Bivariat". Frontend hanya memanggil `dataset.bivariate.run` via `ipcClient` (4 bridge methods tetap).
- **steps:**
  1. `select` — user memilih kolom A + kolom B dari `ProfileRecord`; sistem menentukan mode B1/B2/B3 dari tipe inferensi (T1 di bawah). Feedback: label mode tampil sebelum run ("Korelasi (numerik × numerik)" dsb.); tombol primer aktif hanya bila pasangan valid.
  2. `run` — klik primer; sistem membuat Job `dataset.bivariate.run` (Created→Queued→Preparing→Running→Completed, backend-authoritative SYS-015). Feedback: `role="status"` "Menghitung bivariat…" + skeleton chart + tombol disabled.
  3. `view` — job Completed; chart + `BivariateSummary` + toggle `BivariateDataTable` tampil. Feedback: angka di chart = angka di ringkasan (n konsisten, fingerprint tampil).
  4. `next` — user memilih: ganti pasangan, kembali ke univariate (histogram), atau lanjut cleaning. Hasil tetap tercatat di job history.
- **branches:**
  - Job Failed → banner error dari ErrorContract + "Coba lagi" / "Kembali". Tidak ada dead-end.
  - Job Cancelled → state Cancelled jelas + "Jalankan ulang".
  - Pasangan sama (A == B) → validasi frontend + backend: "Pilih dua kolom yang berbeda." (bukan error job).
  - Tipe tidak didukung (mis. datetime × numerik bila inferensi mendukungnya) → ditolak eksplisit dengan pesan tipe, bukan dihitung diam-diam (default-deny SEC-004).
  - Salah satu kolom konstan (distinct = 1) → partial: hasil tetap dihitung bila matematis terdefinisi, kolom konstan ditandai "Kolom ini konstan."; bila korelasi terdefinisi tidak (varians 0) → pesan literal "Korelasi tidak terdefinisi untuk kolom konstan." (bukan 0 diam-diam).
  - Kolom semua-missing / n pasangan = 0 → empty state khusus: "Tidak ada pasangan nilai untuk dihitung." + CTA ganti pasangan.
  - Snapshot berubah setelah hasil tampil (fingerprint record ≠ dataset terkini) → banner "Hasil mungkin usang — jalankan ulang." (partial).
  - Dataset tanpa profil → empty_first_run: "Jalankan profiling terlebih dahulu" + CTA ke Profiling.
- **completion:** Chart + ringkasan tampil + tercatat di job history (durable events); fingerprint + metode + n tampil di ringkasan; `exact/sampled` direkam eksplisit (tidak ada silent downgrade).
- **cancel_and_back:** Cancel aktif selama Running. Back ke tabel profiling tanpa kehilangan riwayat.

## G3 — Screen & Interaction Contract (SCREEN-BIVAR-001)

- **screen:** `bivariate` (panel/region baru di bawah Quality, satu `ProjectPage`, satu jalur Guided) · **purpose:** "Bandingkan dua kolom dalam satu pandangan" · **primary_action:** "Jalankan Analisis Bivariat"
- **keputusan tampil per mode (V1, PROPOSED):**
  - B1 numerik×numerik → scatter + ringkasan korelasi (Pearson + Spearman + n).
  - B2 kategorikal×numerik → bar per kategori (mean) + tabel grup (count/mean/median/min–max).
  - B3 kategorikal×kategorikal → heatmap-tabel silang (count + % baris) + marginal totals.
- **hierarchy:**
  1. Dua selector kolom (A + B) + label mode otomatis + tombol primer "Jalankan Analisis Bivariat".
  2. Chart area (`BivariateChart`: scatter | groupBar | heatmap) + judul "Hubungan {kolom_a} × {kolom_b}".
  3. `BivariateSummary`: angka mode (korelasi / selisih mean / total pasangan) + n + missing pairs + fingerprint + badge exact/sampled.
  4. Toggle `BivariateDataTable` (alternatif non-visual): untuk B1 = tabel ringkas (bukan titik mentah, lihat V6); B2 = tabel per grup; B3 = cross-tab penuh.
- **removed:** uji statistik, regresi, interpretasi kausal, export PNG, pivot >2 kolom — semua bukan kebutuhan JOB-BIVAR-001.
- **regions & states (8 wajib):**
  - `loading`: `BivariateSkeleton` (bentuk chart) + status job "Menghitung bivariat…"; selector + tombol primer disabled.
  - `empty_first_run`: belum ada profil → ajakan "Jalankan profiling terlebih dahulu" + CTA.
  - `empty_filtered`: n pasangan = 0 → "Tidak ada pasangan nilai untuk dihitung." + CTA ganti pasangan.
  - `partial`: fingerprint record ≠ snapshot terkini → banner "Hasil mungkin usang — jalankan ulang"; kolom konstan → label "Kolom ini konstan."
  - `error`: ErrorContract literal + "Coba lagi".
  - `long_content`: banyak kategori/pasangan → scroll hanya di dalam chart area; selector + ringkasan tetap terlihat.
  - `restricted`: tidak ada peran restricted di M2 (single-user lokal, sama seperti SCREEN-HIST-001).
  - `done`: chart + ringkasan terisi; badge exact/sampled + fingerprint tampil.
- **interactions:**
  - Pilih pasangan → mode diperbarui, tombol primer aktif; fokus tetap di selector.
  - Hover titik/bar/cell → tooltip mode-spesifik (B1: "x, y"; B2: "{kategori}: mean {m} · median {md} · n {n}"; B3: "{a} × {b}: {count} ({pct}% dari {a})").
  - Toggle tabel → `BivariateDataTable` tampil menggantikan/alternatif chart; chart bukan satu-satunya jalur data.
  - Klik primer → job dibuat, fokus ke status, skeleton tampil.
- **keyboard:** Tab: ColumnA → ColumnB → tombol primer → toggle tabel → (chart container fokusable, Enter = buka tabel data). Fokus kembali ke status setelah aksi.
- **validation:** kedua kolom wajib dipilih + berbeda sebelum run; kolom tidak ada di profil ditolak backend (default-deny, SEC-004); pasangan tipe tak didukung ditolak dengan pesan eksplisit.
- **copy (ID, literal):**
  - judul "Hubungan {kolom_a} × {kolom_b}"
  - primer "Jalankan Analisis Bivariat"
  - loading "Menghitung bivariat…"
  - error "Analisis bivariat gagal. Silakan coba lagi."
  - empty-missing "Tidak ada pasangan nilai untuk dihitung."
  - stale "Hasil mungkin usang — jalankan ulang."
  - konstan "Kolom ini konstan."
  - korelasi-tak-terdefinisi "Korelasi tidak terdefinisi untuk kolom konstan."
  - pasangan-sama "Pilih dua kolom yang berbeda."
  - ringkasan aksesibel B1: "Korelasi {kolom_a} dengan {kolom_b}: Pearson {r}, Spearman {rho}, {n} pasangan."
  - ringkasan aksesibel B2: "Rata-rata {kolom_b} per {kolom_a}: tertinggi {maks} pada {kategori}, terendah {min} pada {kategori2}, {k} grup."
  - ringkasan aksesibel B3: "Silang {kolom_a} dengan {kolom_b}: {m} baris × {n} kolom, total {total} pasangan."
- **kausalitas:** tidak ada kata "menyebabkan/mempengaruhi" di UI mana pun. Korelasi tampil sebagai angka + bentuk saja. Jika pola visual sugestif, UI tetap tidak menyimpulkan.
- **accessibility:** kontras AA (DS-BIVAR-001); chart container `role="img"` + `aria-label` = kalimat ringkasan per mode; tabel data selalu tersedia; status `aria-live="polite"`.
- **responsive/adaptive (desktop, 900px min — DS-CORE-001):** ≥1200px: selector + chart + ringkasan berdampingan. 900–1200px: selector menumpuk di atas chart, ringkasan di bawah chart. Scroll horizontal hanya di dalam chart area. Semua state terbaca di 900px; tidak ada layout mobile (Doc14).

## Kontrak teknis yang diusulkan (untuk G5/G6, bukan bagian UI kontrak)

- **IPC (PROPOSED, V7):** command `dataset.bivariate.run` (JobManager-wrapped, seperti `dataset.histogram.run` / `dataset.quality.run`) dengan payload `{project_id, dataset_id, column_a, column_b}` → `BivariateRecord {dataset_id, snapshot_id, fingerprint, column_a, column_b, mode: 'num-num'|'cat-num'|'cat-cat', metrics: {...}, n_pairs, missing_pairs, sampled: bool, sample_size?, created_at}`. Payload kecil (ringkasan + sampel plot, bukan whole-DataFrame) → JSON IPC aman.
- **B1 korelasi (PROPOSED, V2):** Pearson (linear) + Spearman (rank) dihitung di atas pasangan lengkap (pairwise-complete; pasangan dengan missing di salah satu sisi tidak masuk n). Dibulatkan 2 desimal di UI, presisi penuh di record. Scatter: bila n > V3, sampel ditampilkan direkam `sampled: true` + `sample_size`; tidak ada downgrade diam-diam (exact vs sampled eksplisit, sesuai M2 §5).
- **B2 grup (PROPOSED, V5):** kategori diurutkan by count desc, > V4 digabung "Lainnya" (menjumlahkan count, mean/median dihitung ulang dari anggota grup + ditandai). Bar = mean; tooltip + tabel memuat median/min–max.
- **B3 silang (PROPOSED, V4):** kategori diurutkan by count desc per sumbu, > V4 digabung "Lainnya" per sumbu. Cell = count; % = count / total baris kategori A. Marginal totals wajib tampil.
- **Traceability (PROPOSED, V6):** setiap `BivariateRecord` membawa `snapshot_id` + `fingerprint` yang sama dengan profilnya; hasil dari snapshot lama ditandai partial (banner usang). Tabel B1 menampilkan ringkasan + sampel titik yang sama dengan chart (bukan seluruh DataFrame).
- **Stale:** mengikuti aturan C5 (cleaning) — profil/quality/bivariat dari snapshot lama = stale.

## Exit G1–G3 (untuk review PO)

Tidak ada perilaku penting yang ditinggalkan ke penemuan implementasi: mode per pasangan, rumus ringkas, sampling, penggabungan kategori, 8 states, keyboard, copy, dan a11y sudah diputuskan (V1–V7 PROPOSED menunggu ratifikasi). **Belum boleh coding UI sampai kontrak ini disetujui. Tanpa tandatangan ratifikasi, builder tidak boleh mulai G5 slice.**
