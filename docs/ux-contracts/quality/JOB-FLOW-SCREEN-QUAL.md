# Quality Rules Engine (M2) — G1 Job + G2 Flow + G3 Screen Contracts

**IDs:** JOB-QUAL-001, FLOW-QUAL-001, SCREEN-QUAL-001 · **Status:** Draft untuk G1–G4 review (2026-11-05)
**Parent:** Doc08 §5 Guided stage 4 (Quality) · Doc03 §4.3 Data Quality Context · JobManager (Doc05) · Snapshot immutable (SHA-256)
**Rigor:** Standard (G1, G2, G3–G6) · **Kondisi:** belum boleh coding UI sampai kontrak ini disetujui PO.
**Keputusan yang masih PROPOSED:** Q1–Q5 di bagian bawah (butuh ratifikasi PO saat exit G4).

## G1 — Job Contract (JOB-QUAL-001)

```yaml
job: "Mengetahui masalah kualitas dataset sebelum memutuskan cleaning/analisis"
actor: "Data analyst / data user lokal, 1 user per workspace, volume kecil-menengah (CSV/XLSX/Parquet)"
trigger: "Profiling selesai (ProfileRecord tersedia) dan user ingin memeriksa kualitas snapshot"
frequency: "Sekali per dataset/snapshot; diulang bila snapshot berubah"
inputs:
  - "Dataset + snapshot Parquet (immutable, SHA-256)"
  - "ProfileRecord (missing %, distinct, min/max/mean per kolom)"
desired_outcome: "User dapat melihat daftar temuan kualitas yang evidence-backed (aturan + angka + cakupan) dan memutuskan: lanjut analisis, perbaiki sumber data, atau jalankan cleaning (M3) — tanpa menilai angka itu sendiri"
success_signal: "User memilih aksi berikutnya (clean/analyze/import ulang) dengan tepat setelah melihat findings; setiap finding tertelusur ke snapshot fingerprint + aturan yang menghasilkannya"
failure_cost: "Aturan tak jelas / angka tanpa evidence / severity mengarang → user salah mengira data bersih atau salah membuang data; cleaning asal-asalan merusak snapshot (dilarang: assessment tidak boleh memodifikasi data, Doc03 §4.3)"
not_in_scope:
  - item: "Cleaning / perbaikan data otomatis"
    reason: "Cleaning workflow = M3 (Transformation Context, Doc03 §4.4); M2 hanya menilai, tidak mengubah"
  - item: "Custom rule builder / bahasa aturan (DSL)"
    reason: "Di luar M2; M2 = aturan deterministik bawaan saja (Q1). Custom rules = ide M3+"
  - item: "Interpretasi AI / rekomendasi aksi otomatis"
    reason: "AI bukan source of truth (AI-013/014); engine hanya menampilkan angka + severity, bukan kesimpulan bisnis"
  - item: "Validity domain bisnis (mis. rentang harga valid, format NIK)"
    reason: "Butuh knowledge domain per dataset; tidak ada di M2. Out of scope eksplisit"
```

## G2 — Flow Contract (FLOW-QUAL-001)

- **entry:** Dari Profiling selesai (ProfileRecord tampil) → primary action "Jalankan Quality Check". Frontend hanya memanggil `dataset.quality.run` via `ipcClient` (4 bridge methods tetap).
- **steps:**
  1. `run` — klik primer; sistem membuat Job `dataset.quality.run` (Created→Queued→Preparing→Running→Completed, backend-authoritative SYS-015). Feedback: `role="status"` "Memeriksa kualitas…" + tombol disabled (`isPending` mutation, bukan query — pelajaran bug G6).
  2. `view` — job Completed; tabel findings tampil: kolom | aturan | severity badge | evidence. Feedback: angka di tabel = angka di ProfileRecord (missing % konsisten), fingerprint tampil di ringkasan.
  3. `next` — user memilih: kembali ke tabel profiling, pilih kolom untuk histogram, atau lanjut ke Clean (M3, belum ada → no dead-end: tampil pesan "Cleaning tersedia di M3").
- **branches:**
  - Job Failed → banner error dari ErrorContract + "Coba lagi" / "Kembali". Tidak ada dead-end.
  - Job Cancelled → state Cancelled jelas + "Jalankan ulang".
  - Snapshot tanpa profil → empty_first_run: "Jalankan profiling terlebih dahulu" + CTA ke Profiling.
  - Snapshot kosong (0 rows) → partial: "Dataset tidak memiliki baris" + CTA import ulang.
  - Kolom semua missing → finding `completeness/problem` tetap tampil (bukan disembunyikan).
  - Aturan tidak dapat dihitung (mis. IQR kolom non-numerik) → rule itu skipped dengan penjelasan, bukan error (partial state).
- **completion:** Findings tampil + tercatat di job history (durable events); fingerprint tampil di ringkasan.
- **cancel_and_back:** Cancel aktif selama Running. Back ke tabel profiling tanpa kehilangan riwayat profil.

## G3 — Screen Contract (SCREEN-QUAL-001)

- **screen:** `quality` · **primary_action:** "Jalankan Quality Check"
- **hierarchy:** Simpan di tempat — section baru di bawah Profiling + Histogram (satu `ProjectPage`, satu jalur Guided). Urutan: ringkasan (total temuan per severity) → tabel findings → bukti per baris → aksi lanjutan (M3 placeholder jujur).
- **Bagian yang dihapus:** tidak ada grafik kompleks (quality = tabel, bukan chart); tidak ada editor aturan; tidak ada tombol cleaning aktif.
- **Copy literal (mengikat):**

| elemen | teks |
|---|---|
| judul section | "Quality Check" |
| primer | "Jalankan Quality Check" |
| loading | "Memeriksa kualitas…" |
| error | "Quality check gagal. Silakan coba lagi." |
| empty-first-run | "Jalankan profiling terlebih dahulu." |
| stale (fingerprint berubah sejak profil terakhir) | "Hasil mungkin usang — jalankan ulang." |
| clean (tidak ada finding problem/check) | "Tidak ditemukan masalah kualitas pada snapshot ini." |

- **severity → badge:** `ok` → "OK", `check` → "Perlu perhatian", `problem` → "Masalah" (reuse status-badge DS-CORE-001, bukan warna saja).
- **states:** 8 keadaan framework (loading, empty-first-run, empty-filtered, partial, error, long-content, restricted, done) — semuanya terdefinisi; restricted tidak relevan (local-first, single user) tapi error + partial wajib.
- **interaksi/keyboard:** tabel findings dapat di-scroll horizontal di dalam pane tabel saja (bukan page scroll, aturan 900px); fokus terlihat; status `aria-live="polite"`.
- **aksesibilitas:** ringkasan total + setiap evidence berupa teks (angka + cakupan), bukan hanya badge berwarna.
- **responsif:** min window 900px primary (≥1200 side-by-side, 900–1200 stacked untuk section ini); scroll horizontal hanya di dalam pane tabel.

## Kontrak teknis (mengikat implementasi)

- **Aturan MVP (PROPOSED, Q1)** — 4 aturan deterministik, evidence wajib:
  - `completeness` (per kolom): missing % per kolom, cakupan = kolom + snapshot.
  - `duplicates` (per snapshot): duplikat baris eksak (seluruh kolom sama), evidence = count baris duplikat.
  - `constant` (per kolom): distinct == 1, evidence = 1 nilai + labelnya.
  - `outliers` (per kolom numerik): di luar 1.5×IQR, evidence = count + % + rentang IQR (Q3).
- **Severity (PROPOSED, Q2):** `completeness`: missing_pct > 30 → `problem`, > 0 → `check`, 0 → `ok` (selaras ambang profiling yang sudah PROPOSED). `duplicates`: > 0 → `check`, 0 → `ok`. `constant`: → `check` selalu. `outliers`: count > 0 → `check`, 0 → `ok`. **Ambang 30% dan 1.5×IQR belum PO-ratified — sama seperti ambang profiling yang masih PROPOSED.**
- **Evidence (PROPOSED, Q4):** setiap finding membawa `rule_id + column_name? + severity + message + evidence {count, pct, detail}`; angka tanpa evidence dilarang (invariant Doc03 §4.3). Provenance: `dataset_id + snapshot_id + fingerprint + row_count` per record.
- **Payload (PROPOSED, Q5 — T5 dari histogram diterapkan):** command `dataset.quality.run` JobManager-wrapped (pola `run_profile`/`run_histogram`); payload `{project_id, dataset_id}` → `QualityRecord {dataset_id, snapshot_id, fingerprint, row_count, findings: [{rule_id, column_name?, severity, message, evidence_count, evidence_pct}], summary}`. Ukuran kecil (findings per kolom ≤ 4×n_kolom + 1) → JSON IPC aman, bukan whole-DataFrame.
- **Persistensi (PROPOSED, Q5):** G5 slice **tidak** persist QualityRecord (recompute murah dari snapshot, sama seperti histogram); riwayat quality deferred ke G6 bila PO membutuhkannya. Job lifecycle tetap durable via events.

## Exit G1–G3 (untuk review PO)
Tidak ada perilaku penting yang ditinggalkan ke penemuan implementasi: set aturan, severity, copy, 8 states, keyboard, dan a11y sudah diputuskan (Q1–Q5 PROPOSED menunggu ratifikasi). **Belum boleh coding UI sampai kontrak ini disetujui. Terutama:Cleaning M3 tetap non-aktif di slice ini.**
