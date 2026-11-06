# HTML Reporting (M3) — G1 Job + G2 Flow + G3 Screen Contracts

**IDs:** JOB-REPORT-001, FLOW-REPORT-001, SCREEN-REPORT-001 · **Status:** Ratified oleh PO (2026-11-06) — lihat `01-po-ratifikasi.md`; siap validasi Critic, selanjutnya G5.
**Parent:** Doc12 §Reporting & Export Architecture (REP-001–007, REP-011/REP-012 OD-3) · Doc01 §Scope (HTML report export) · Doc16 §M3 (HTML reporting) · Snapshot immutable (SHA-256)
**Rigor:** Standard (G1, G2, G3–G6) · **Kondisi:** belum boleh coding UI sampai kontrak ini disetujui PO.
**Keputusan:** R1–R7 di bagian bawah — **Ratified oleh PO (2026-11-06)**, lihat `01-po-ratifikasi.md`.

## G1 — Job Contract (JOB-REPORT-001)

```yaml
job: "Menyimpan snapshot analisis sebagai HTML report yang dapat dibagikan/dibaca ulang"
actor: "Data analyst / data user lokal, 1 user per workspace, volume kecil-menengah (CSV/XLSX/Parquet)"
trigger: "Profiling + Quality + (opsional) Histogram/Bivariate/Cleaning selesai untuk snapshot aktif"
frequency: "Sekali per snapshot (atau diulang bila snapshot berubah); sekali klik per report"
inputs:
  - "Dataset + snapshot Parquet (immutable, SHA-256)"
  - "Record terkini per analisis yang sudah dijalankan (ProfileRecord, QualityRecord, HistogramRecord?, BivariateRecord?, CleaningRecord?) — direferensikan, bukan diduplikasi (REP-003)"
desired_outcome: "User dapat menghasilkan file HTML mandiri yang mereferensikan setiap angka ke snapshot fingerprint + analisis sumbernya, cukup untuk dibagikan/diarsipkan tanpa membuka aplikasi"
success_signal: "User mengunduh/menyimpan HTML dan penerima report dapat membaca ringkasan + provenance tanpa akses aplikasi; setiap angka tertelusur ke fingerprint"
failure_cost: "HTML yang memalsukan/ menghitung ulang angka dari data mentah, atau menelan record stale diam-diam -> report beredar dengan klaim yang tidak terbukti (REP-007: klaim kuantitatif wajib bukti deterministik)"
not_in_scope:
  - item: "PDF export (REP-005)"
    reason: "PDF = format distribusi M3-slice berikutnya; M3 slice pertama = HTML saja (REP-004 primer)"
  - item: "Dataset/Project Export (REP-008/REP-009)"
    reason: "Tiga jalur export ayrı (Report/Dataset/Project); slice ini hanya Report"
  - item: "AI summary/narrative di dalam report (REP-007 deterministic)"
    reason: "Klaim di report wajib bukti deterministik dari record; narasi AI bukan source of truth — daftar isi struktural saja"
  - item: "Template builder / custom CSS / branding engine"
    reason: "Satu template HTML ratifikasi saja; kustomisasi = M3+"
  - item: "Report scheduler / sharing server / cloud storage"
    reason: "Di luar MVP lokal; export = file lokal saja"
  - item: "Chart interaktif di report (ECharts live)"
    reason: "HTML mandiri membawa tabel + angka (non-visual + ringkasan); interaktif adalah enhancement M3+"
```

## G2 — Flow Contract (FLOW-REPORT-001)

- **entry:** Dari snapshot aktif dengan ≥1 analisis selesai → primary action "Buat Report HTML". Frontend hanya memanggil `dataset.report.generate` via `ipcClient` (4 bridge methods tetap). Backend adalah pembuat HTML (bukan frontend string-building) — sumber kebenaran angka tetap record backend.
- **steps:**
  1. `select` — user memilih cakupan report (R3: Semua analisis yang ada / Profiling+Quality saja / + Histogram / + Bivariate — radio). Sistem menampilkan daftar record yang akan dimasukkan + fingerprint tiap record. Feedback: tombol primer aktif hanya bila ≥1 record dipilih.
  2. `run` — klik primer; sistem membuat Job `dataset.report.generate` (Created→Queued→Preparing→Running→Completed, backend-authoritative SYS-015). Feedback: `role="status"` "Membuat report…" + tombol disabled.
  3. `view` — job Completed; frontend menampilkan ringkasan report (jumlah sections, fingerprint sumber, path/file tujuan, ukuran file) + tombol "Unduh" (save dialog) / "Tampilkan di folder". Feedback: angka di ringkasan = angka di HTML (satu sumber).
  4. `next` — user memilih: buat report ulang (snapshot baru), kembali ke analisis, atau unduh PDF (bila PDF sudah ada → pesan "PDF tersedia di slice berikutnya" bila belum; bukan dead-end).
- **branches:**
  - Job Failed → banner error dari ErrorContract + "Coba lagi" / "Kembali". Tidak ada dead-end.
  - Job Cancelled → state Cancelled jelas + "Jalankan ulang".
  - Salah satu record stale (fingerprint ≠ snapshot terkini) → partial: record itu dimasukkan dengan label "Hasil mungkin usang — jalankan ulang." di dalam HTML + banner peringatan di UI sebelum unduh (freshness wajib REP-006; tidak ada penolakan diam-diam).
  - Belum ada analisis apa pun → empty_first_run: "Jalankan profiling terlebih dahulu." + CTA ke Profiling.
  - Snapshot kosong (0 rows) → partial: report tetap dibuat dengan halaman peringatan "Dataset tidak memiliki baris" + daftar sections kosong.
  - Akses file tidak diizinkan (dialog batal) → kembali ke ringkasan tanpa error.
- **completion:** File HTML tersimpan + tercatat di job history (durable events); fingerprint + daftar sumber tampil di ringkasan UI dan di dalam HTML (provenance immutable REP-012).
- **cancel_and_back:** Cancel aktif selama Running. Back tanpa kehilangan hasil analisis.

## G3 — Screen & Interaction Contract (SCREEN-REPORT-001)

- **screen:** `reporting` (panel/region baru di bawah Bivariate+Cleaning, satu `ProjectPage`) · **purpose:** "Simpan analisis sebagai HTML yang dapat dibagikan" · **primary_action:** "Buat Report HTML"
- **keputusan tampil (R1, Ratified):** satu halaman HTML mandiri (inline CSS, tanpa CDN/eksternal) berisi: (1) Penutup (nama dataset, fingerprint, jumlah baris, waktu generate), (2) Profiling ringkas, (3) Quality findings, (4) Histogram/bivariate ringkasan bila dipilih, (5) Cleaning provenance (bila ada), (6) Appendix: daftar sumber (record id + fingerprint + metode).
- **hierarchy:**
  1. Selector cakupan (radio R3) + daftar record yang akan dimasukkan (tipe + fingerprint singkat + staleness badge).
  2. Tombol primer "Buat Report HTML" + tombol sekunder "Unduh" (setelah Completed).
  3. `ReportSummary`: sections count, sumber fingerprint, ukuran file, path tujuan.
- **ciri HTML (mengikat implementasi, R4–R6):**
  - R4: **inline CSS saja** — file dibuka offline tanpa jaringan; tidak ada `<script>` eksternal/CDN/fonteks.
  - R5: **setiap angka direferensikan** — footer tiap tabel/angka: "Sumber: ProfileRecord {id} · fingerprint {fp} · snapshot {snapshot}" (REP-003/REP-007).
  - R6: **stale ditandai eksplisit** — record stale dilabeli di HTML (bukan disembunyikan) per REP-006.
- **regions & states (8 wajib):**
  - `loading`: skeleton ringan + status job "Membuat report…"; radio + tombol primer disabled.
  - `empty_first_run`: belum ada analisis → ajakan "Jalankan profiling terlebih dahulu." + CTA.
  - `empty_filtered`: cakupan dipilih kosong → "Pilih setidaknya satu analisis." + lihat daftar.
  - `partial`: ada record stale → banner "Ada hasil usang — lihat daftar sebelum mengunduh." + badge per record.
  - `error`: ErrorContract literal + "Coba lagi".
  - `long_content`: banyak findings → scroll hanya di dalam ringkasan; file HTML tidak dibatasi.
  - `restricted`: tidak ada peran restricted di M2/M3 lokal (single-user lokal, sama seperti screening lain).
  - `done`: ringkasan + unduh tersedia; fingerprint + path tampil.
- **interactions:**
  - Pilih cakupan radio → daftar record diperbarui, tombol primer aktif.
  - Klik primer → job dibuat, fokus ke status.
  - Klik "Unduh" → save dialog; batal = kembali ke ringkasan diam-diam.
- **keyboard:** Tab: radio cakupan → tombol primer → tombol unduh → fokus kembali ke status setelah aksi. Semua kontrol `<button>/<input type=radio>` native.
- **validation:** cakupan wajib dipilih; record dengan fingerprint asing (bukan snapshot dataset ini) ditolak backend (default-deny, SEC-004).
- **copy (ID, literal):**
  - judul "Report HTML"
  - primer "Buat Report HTML"
  - sekunder "Unduh"
  - loading "Membuat report…"
  - error "Report gagal dibuat. Silakan coba lagi."
  - empty-first "Jalankan profiling terlebih dahulu."
  - empty-filtered "Pilih setidaknya satu analisis."
  - partial "Ada hasil usang — lihat daftar sebelum mengunduh."
  - done "Report siap diunduh."
  - stale di dalam HTML "Hasil mungkin usang — jalankan ulang."
- **accessibility:** kontras AA (DS-REPORT-001); daftar record `aria-live="polite"` di status; file HTML sendiri semantic (h1/h2, table `th scope`), terbaca screen reader.
- **responsive/adaptive (desktop, 900px min — DS-CORE-001):** ≥1200px: radio + daftar berdampingan. 900–1200px: radio di atas daftar. File HTML render baik di 900px tanpa scroll halaman berlebih; tidak ada layout mobile aplikasi (Doc14).

## Kontrak teknis yang diusulkan (untuk G5/G6, bukan bagian UI kontrak)

- **IPC (Ratified, R7):** command `dataset.report.generate` (JobManager-wrapped) dengan payload `{project_id, dataset_id, scope: 'all'|'profile-quality'|'with-charts'|'with-visuals'}` → `ReportRecord {dataset_id, snapshot_id, fingerprint, scope, sections: [{kind, record_id, fingerprint, stale: bool}], file_path, file_size_bytes, created_at}`. HTML = artifact file di disk (bukan string JSON besar over IPC — payload kecil, file besar di disk, sesuai "no whole-DataFrame JSON").
- **Renderer (Ratified, R4):** template HTML satu-file Python (`html` stdlib + string template, tanpa dependency baru) yang membaca record terkini dari store (referensi artifact REP-003); inline `<style>`; tidak ada JS eksternal.
- **Freshness (Ratified, R6):** per record, `stale = record.fingerprint !== dataset.snapshot.fingerprint`; stale dimasukkan + dilabeli, bukan ditolak.
- **Provenance (REP-012):** setiap HTML menyematkan daftar sumber immutable (record id + fingerprint + metode) yang tidak dapat diubah frontend.
- **PDF (Ratified, R2):** TIDAK dalam slice ini — `dataset.report.pdf` (atau export PDF) adalah slice berikutnya; UI menunjukkan pesan jujur "PDF tersedia di slice berikutnya" bila user memilih (R2 bila PO menolak: hapus tombol PDF sepenuhnya).

## Exit G1–G3 (untuk review PO)

Tidak ada perilaku penting yang ditinggalkan ke penemuan implementasi: isi HTML, cakupan radio, referensi artifact, freshness, inline-CSS, copy, dan a11y sudah diputuskan (R1–R7 Ratified). Exit G4 lulus — builder boleh mulai G5 slice (backend contract lock → slice) pada kerangka kontrak ini.
