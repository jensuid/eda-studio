# JOB-CLEAN-001 — Job Contract (M3 Cleaning)

**ID:** JOB-CLEAN-001 · **Status:** Ratified oleh PO (2026-11-05)
**Parent:** Doc08 §5 Guided stage 5 (Clean) · Doc03 §4.4 Transformation Context · JobManager (Doc05) · Snapshot immutable (SHA-256) + aktivasi snapshot eksplisit
**Rigor:** Standard (G1, G2, G3–G6) · **Kondisi:** G1–G4 ratified; G5 boleh dimulai setelah Critic PASS.
**Keputusan yang sudah ratified:** C1–C6 di bagian bawah (ratifikasi 2026-11-05, sesuai `01-po-ratifikasi.md`).
**Sumber brainstorming:** `00-kickoff-brief.md` — sesi brainstorming 2026-11-05, bukan kontrak.

## G1 — Job Contract

```yaml
job: "Memperbaiki masalah kualitas dataset yang teridentifikasi sebelum analisis"
actor: "Data analyst / data user lokal, 1 user per workspace, volume kecil-menengah (CSV/XLSX/Parquet)"
trigger: "Quality Check selesai (QualityRecord tersedia dengan fingerprint == fingerprint snapshot aktif) dan user memilih operasi cleaning dari temuan yang problem/check"
frequency: "Sekali per dataset/snapshot/operasi; diulang untuk snapshot baru hasil cleaning"
inputs:
  - "Dataset + snapshot Parquet (immutable, SHA-256)"
  - "QualityRecord (findings per rule: completeness, duplicates, constant, outliers)"
  - "ProfileRecord (tipe kolom, missing %, ringkasan numerik/kategorikal)"
desired_outcome: "User dapat memperbaiki masalah kualitas yang ditemukan (duplikat, missing) melalui operasi deterministik yang terpilih eksplisit per kolom / snapshot, dengan pratinjau dampak dan konfirmasi sebelum snapshot baru dibuat, lalu melanjutkan analisis dari snapshot baru yang terprovenance"
success_signal: "User memilih operasi cleaning berdasarkan temuan yang evidence-backed, mengkonfirmasi dampaknya, dan melihat snapshot baru dengan provenance lengkap; profiling & quality lama ditandai stale dan di-run ulang sebelum analisis"
failure_cost: "Tanpa konfirmasi / tanpa pratinjau → user menghapus data yang sebenarnya valid atau mengisi nilai yang salah; tanpa snapshot baru → data sumber termutasi dan tidak reversibel; aturan asal-asalan merusak snapshot dan melanggar Doc03 §4.4"
not_in_scope:
  - item: "Trim outlier (winsorize / hapus)"
    reason: "Destructive rule ambigu: ambang IQR 1.5× belum PO-ratified (QUALITY Q1–Q3); menghapus nilai valid = risiko tinggi. Stop rule framework: destructive rule ambigu = stop & tanya PO. Ditunda ke iterasi berikutnya."
  - item: "Custom rule builder / bahasa aturan (DSL)"
    reason: "M3 MVP = operasi deterministik bawaan saat Quality findings; M2 hanya menilai, M3 hanya memperbaiki temuan yang ada."
  - item: "Interpretasi AI / rekomendasi aksi otomatis"
    reason: "AI bukan source of truth (AI-013/014); engine hanya menyediakan operasi + angka dampak, bukan kesimpulan bisnis."
  - item: "Validity domain bisnis (mis. rentang harga valid, format NIK)"
    reason: "Butuh knowledge domain per dataset; tidak ada di M3 MVP."
  - item: "Cleaning tanpa menemukan QualityRecord"
    reason: "Cleaning mengonsumsi temuan Quality Rules Engine (4 rules); tanpa quality run maka operasi tidak boleh dijalankan — wajib run Quality dulu (FLOW-CLEAN-001)."
```

## Keputusan brainstorming yang masuk kontrak (Ratified 2026-11-05)

| ID | Keputusan (hasil brainstorm) | Status |
|---|---|---|
| C1 | Operasi MVP = hapus duplikat eksak + hapus baris missing per-kolom + imputasi sederhana (mean/median/mode/konstanta) | Ratified |
| C2 | Ketiga operasi wajib dialog konfirmasi destruktif dengan ringkasan dampak | Ratified |
| C3 | Pratinjau = ringkasan dampak saja (dry-run via `dataset.cleaning.preview`), bukan diff baris penuh | Ratified (detail IPC lihat FLOW-CLEAN-001/S3) |
| C4 | Provenance = persist `CleaningRecord` (operasi + parameter + snapshot induk → snapshot anak) | Ratified |
| C5 | Setelah cleaning, profiling & quality lama = stale, wajib re-run sebelum Analyze | Ratified |
| C6 | Scope campuran: duplikat = snapshot-wide; hapus missing + imputasi = per-kolom | Ratified |

**Catatan provenance:** Ratifikasi tercatat di `01-po-ratifikasi.md` (2026-11-05, ditandatangani PO). Perubahan apa pun setelah G4 = perubahan kontrak → butuh impact review sebelum implementasi (aturan README.md).
