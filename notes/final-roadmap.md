Berikut brief roadmap sampai aplikasi final, berlandaskan **Doc16 (Implementation Roadmap & Delivery Strategy)** — bukan tebakan baru, tapi urutan resmi baseline yang sudah diratifikasi.

---

## Peta besar (Doc16)

| Fase | Isi | Milestone | Status |
|---|---|---|---|
| **P1** Technical Foundation | Scaffold, IPC typed, SQLite/Parquet, JobManager, ingestion | **M1** | ✅ Selesai (termasuk M1-next Parquet/Excel) |
| **P2** Core EDA | Profiling, quality, cleaning, univariate/bivariate, ECharts | **M2** | ⏳ Berikutnya |
| **P3** Advanced EDA | Anomaly/pattern, hipotesis, readiness, insight lifecycle | M2/M3 | ⬜ |
| **P4** Reporting & Export | HTML/PDF report, dataset export, project `.edaworkspace`, provenance | **M3** | ⬜ |
| **P5** Platform | Plugin (subprocess isolated), AI governance layer | M3/post-MVP | ⬜ |
| **P6** Release & Hardening | Backup/restore, cross-platform evidence, security hardening, SBOM | **M3 Release Candidate** | ⬜ |
| **Post-MVP** | Marketplace plugin, kolaborasi tim, cloud, ML training, AI interpretation penuh | — | ⬜ Non-goal MVP (§10.3 Doc01) |

**Prinsip delivery-nya** (Doc16 §11–13): trunk-based development, CI berlapis PR → Main → Nightly → Beta → Stable, dan **tanpa tanggal rilis spekulatif** — maju hanya kalau evidence gate lulus (test, security review, cross-platform proof).

---

## Detail per fase

### M2 — Core EDA (P2, pekerjaan utama berikutnya)
1. **Profiling** — tipe kolom, missing, distribusi, statistik ringkas (univariate). Membaca snapshot Parquet yang sudah stabil.
2. **Quality** — deteksi duplikat, inkonsistensi, outlier awal; rekomendasi perbaikan.
3. **Cleaning** — transformasi deklaratif: detect → recommend → configure → preview → validate → approve → execute (Doc05 §12). Hasil cleaning = dataset turunan baru, snapshot asli tidak pernah diubah.
4. **Visualisasi** — ECharts dari *Visualization Spec* ber-versi yang disimpan sebagai backend artifact (bukan dari frontend semata).
5. **Execution engine** — scheduler + ProcessPool untuk komputasi CPU; disiplin *exact vs approximate* eksplisit dan tercatat (tidak ada silent downgrade).

### M3 — Release Candidate (P3–P6)
- **Insight lifecycle**: Finding & Hypothesis (Proposed → Accepted → Investigating → Supported/Not Supported/Inconclusive → Archived) — ini yang mencegah "spurious insight" dari EDA eksploratif.
- **Reporting**: HTML + PDF dari template yang sudah diratifikasi arahnya (REP-001–007), freshness validation wajib, export payload-bound (SEC-013).
- **Provenance & audit**: audit ≠ provenance (SEC-012) — keduanya dibangun terpisah.
- **Plugin & AI**: hanya yang sudah disepakati untuk MVP (registry, subprocess isolated, capability check); AI sebagai intelligence layer dengan tool governance, bukan sumber kebenaran analitik.
- **Hardening**: backup/restore teruji, diagnostic bundle dengan redaksi, bukti cross-platform (Win x64, macOS ARM64/Intel, Linux x64/ARM64), SBOM + checksum + signed release (Doc14).

### Post-MVP (sengaja di luar MVP)
Plugin marketplace, kolaborasi tim, cloud workspace, full ML training, AI interpretation mandiri,68
F-01–F-05 (penutupan formal PLG/AI) — semuanya *setelah* aplikasi stabil di tangan pengguna.

---

## Risiko yang dijaga sepanjang jalan (dari dokumen)
1. **Spurious insight** → hypothesis lifecycle + evidence-grounded.
2. **Silent approximation** → exact/approx/sampled diuji terpisah dan direkam eksplisit.
3. **Contract drift** → tipe TS selalu generated dari Pydantic (ADR-001).
4. **Proposed dianggap Confirmed** → item belum diratifikasi tidak ditulis di kode (mis. angka retention, toleransi epsilon, PDF engine).
5. **Over-building P4–P6 sebelum M1–M3 terbukti reproducible** → urutan milestone adalah guardrail-nya.

---

## Posisi kita sekarang
**M1 ✅ lengkap** (termasuk ADR + adapter + verifikasi desktop level bridge). Langkah terkecil berikutnya yang membuka M2: **univariate profiling** — satu fitur EDA pertama yang membaca snapshot Parquet.

Setuju saya mulai M2 dari profiling?
