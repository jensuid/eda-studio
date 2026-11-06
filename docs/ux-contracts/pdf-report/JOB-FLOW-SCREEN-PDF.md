# PDF Report (M3) — G1 Job + G2 Flow + G3 Screen Contracts

**IDs:** JOB-PDF-001, FLOW-PDF-001, SCREEN-PDF-001 · **Status:** Ratified oleh PO (2026-11-06) — lihat `01-po-ratifikasi.md`; siap validasi Critic, selanjutnya G5.
**Parent:** Doc12 §11.2 PDF Renderer (REP-005) · Doc12 §11.3 Chart Rendering · Doc01 §Scope (HTML report export) · Doc16 §M3
**Rigor:** Standard (G1, G2, G3–G6) · **Kondisi:** belum boleh coding UI sampai kontrak ini disetujui PO.
**Keputusan:** P1–P7 di bagian bawah — **Ratified oleh PO (2026-11-06)**, lihat `01-po-ratifikasi.md`.

## G1 — Job Contract (JOB-PDF-001)

```yaml
job: "Menyimpan snapshot analisis sebagai PDF distribusi yang dapat dibagikan/dicetak"
actor: "Data analyst / data user lokal, 1 user per workspace, volume kecil-menengah (CSV/XLSX/Parquet)"
trigger: "Report HTML selesai (ReportRecord tersedia) dan user ingin versi distribusi PDF"
frequency: "Sekali per ReportRecord; sekali klik per PDF"
inputs:
  - "ReportRecord HTML (ReportRecord: sections + renderer_version + content_fingerprint + is_final)"
  - "Snapshot fingerprint + sections (provenance immutable)"
desired_outcome: "User dapat menghasilkan file PDF mandiri yang merupakan cermin distribusi dari HTML yang sama (angka + provenance identik), cukup untuk dibagikan/dicetak tanpa membuka aplikasi"
success_signal: "User mengunduh/menyimpan PDF dan penerima dapat membaca halaman + nomor halaman + header/footer + provenance tanpa akses aplikasi; setiap angka tertelusur ke section sumber"
failure_cost: "PDF yang menghitung ulang angka, kehilangan provenance, atau terpotong (clipping/broken breaks) -> versi distribusi menyimpang dari HTML resmi; Doc12: PDF output harus diuji terhadap clipping/breaks/fonts/overflow"
not_in_scope:
  - item: "Chart interaktif / live ECharts di PDF"
    reason: "PDF = format statis distribusi (REP-005); chart sebagai tabel/gambar statis saja (11.3: provide static representation)"
  - item: "Dataset/Project Export (REP-008/REP-009)"
    reason: "Tiga jalur export terpisah; slice ini hanya PDF dari HTML Report"
  - item: "AI summary/narasi di PDF"
    reason: "Klaim wajib bukti deterministik dari ReportRecord (REP-007); template hanya merender kembali angka"
  - item: "Template builder / branding engine"
    reason: "Satu template PDF ratifikasi saja; kustomisasi = M3+"
  - item: "PDF merge/split/annotate"
    reason: "Di luar MVP; PDF dihasilkan segar dari ReportRecord setiap run"
  - item: "HTML regeneration di slice ini"
    reason: "HTML sudah G5 PASS (JOB-REPORT-001); PDF hanya merender dari ReportRecord yang ada"
```

## G2 — Flow Contract (FLOW-PDF-001)

- **entry:** Dari ReportRecord HTML selesai → primary action "Buat PDF". Frontend hanya memanggil `dataset.pdf.generate` via `ipcClient` (4 bridge methods tetap). Backend adalah satu-satunya penulis PDF (bukan frontend).
- **steps:**
  1. `select` — tidak ada cakupan baru: PDF = seluruh ReportRecord yang dipilih (scope HTML yang sama). Sistem menampilkan ringkasan sumber (sections count, is_final, content_fingerprint). Feedback: tombol primer aktif hanya bila ReportRecord ada.
  2. `run` — klik primer; sistem membuat Job `dataset.pdf.generate` (Created→Queued→Preparing→Running→Completed, backend-authoritative SYS-015). Feedback: `role="status"` "Membuat PDF…" + tombol disabled.
  3. `view` — job Completed; frontend menampilkan ringkasan PDF (halaman count, isi file, fingerprint nguồn, renderer_version, path/file tujuan). Feedback: angka di ringkasan = angka di HTML (satu sumber — ReportRecord).
  4. `next` — user memilih: unduh PDF, kembali ke HTML Report, atau kembali ke analisis.
- **branches:**
  - Job Failed → banner error dari ErrorContract + "Coba lagi" / "Kembali". Tidak ada dead-end.
  - Job Cancelled → state Cancelled jelas + "Jalankan ulang".
  - ReportRecord stale (is_final=False) → partial: PDF tetap dibuat dengan halaman "Hasil mungkin usang — jalankan ulang." + banner peringatan di UI sebelum unduh (freshness REP-006; tidak ada penolakan diam-diam). PDF stale tidak boleh dikira final (Doc12 §10.2).
  - Belum ada ReportRecord → empty_first_run: "Buat Report HTML terlebih dahulu." + CTA ke Report.
  - Font/encodisin terpotong → job gagal dengan ErrorContract (bukan PDF rusak diam-diam); retry tersedia.
- **completion:** File PDF tersimpan + tercatat di job history (durable events); content_fingerprint sumber + pdf fingerprint tampil di ringkasan UI dan di trailer/metadata PDF.
- **cancel_and_back:** Cancel aktif selama Running. Back ke Report HTML tanpa kehilangan hasil analisis.

## G3 — Screen & Interaction Contract (SCREEN-PDF-001)

- **screen:** `pdf` (panel/region baru di bawah Report HTML, satu `ProjectPage`) · **purpose:** "Simpan analisis sebagai PDF distribusi dari HTML ini" · **primary_action:** "Buat PDF"
- **keputusan tampil (P1, Ratified):** PDF satu-file mandiri berisi: (1) Penutup (sama dengan HTML: nama dataset, fingerprint, waktu, content_fingerprint HTML sumber), (2) Isi sections sama (Profiling/Quality/Chart/Bivariate/Cleaning ringkas), (3) Header/footer tiap halaman (nama dataset + nomor halaman "Halaman X dari Y"), (4) Metadata PDF (Title/Author/Subject = nama dataset + fingerprint), (5) Appendix sumber (sama dengan HTML: record id + fingerprint + metode).
- **hierarchy:**
  1. Ringkasan sumber (ReportRecord: sections count, is_final badge Final/Draft, content_fingerprint).
  2. Tombol primer "Buat PDF" + tombol sekunder "Unduh PDF" (setelah Completed).
  3. `PdfSummary`: halaman count, ukuran file, renderer_version, pdf fingerprint, path tujuan.
- **ciri PDF (mengikat implementasi, P4–P6):**
  - P4: **satu renderer PDF** — template Python (`reportlab` bila tersedia; bila tidak, fallback renderer stdlib yang membatasi: tabel saja tanpa gambar) — PO memilih di P4; tidak ada dua mesin paralel.
  - P5: **layout konsisten** — header/footer + nomor halaman wajib; tabel dipaginasi (tidak ada clipping); font ter-embed (fallback: font sistem + metadata font).
  - P6: **isi = HTML** — angka/provenance identik ReportRecord; stale dilabeli eksplisit di PDF (bukan disembunyikan).
- **regions & states (8 wajib):**
  - `loading`: skeleton ringan + status "Membuat PDF…"; tombol primer disabled.
  - `empty_first_run`: belum ada ReportRecord → ajakan "Buat Report HTML terlebih dahulu." + CTA.
  - `empty_filtered`: n/a (tidak ada scope baru) — dicakup empty_first_run.
  - `partial`: ReportRecord stale (is_final=False) → banner "Ada hasil usang — lihat daftar sebelum mengunduh." + badge "Draft — bukan final export." di UI dan halaman PDF.
  - `error`: ErrorContract literal + "Coba lagi".
  - `long_content`: banyak halaman → tidak dibatasi; scroll hanya di ringkasan.
  - `restricted`: tidak ada peran restricted di M2/M3 lokal (single-user lokal, sama seperti screening lain).
  - `done`: ringkasan + unduh tersedia; halaman + fingerprint + path tampil.
- **interactions:**
  - Klik primer → job dibuat, fokus ke status.
  - Klik "Unduh PDF" → save dialog; batal = kembali ke ringkasan diam-diam.
- **keyboard:** Tab: tombol primer → tombol unduh → fokus kembali ke status. Semua kontrol `<button>` native.
- **validation:** ReportRecord wajib ada; ReportRecord fingerprint asing (bukan snapshot dataset ini) ditolak backend (default-deny, SEC-004).
- **copy (ID, literal):**
  - judul "PDF Report"
  - primer "Buat PDF"
  - sekunder "Unduh PDF"
  - loading "Membuat PDF…"
  - error "PDF gagal dibuat. Silakan coba lagi."
  - empty-first "Buat Report HTML terlebih dahulu."
  - partial "Ada hasil usang — lihat daftar sebelum mengunduh."
  - done "PDF siap diunduh."
  - stale di dalam PDF "Hasil mungkin usang — jalankan ulang."
  - draft "Draft — bukan final export."
- **accessibility:** kontras AA (DS-PDF-001); status job `aria-live="polite"` di live region status (bukan list); metadata PDF terisi.
- **responsive/adaptive (desktop, 900px min — DS-CORE-001):** ≥1200px: ringkasan + tombol berdampingan. 900–1200px: ringkasan di atas tombol. File PDF render baik di 900px; tidak ada layout mobile aplikasi (Doc14).

## Kontrak teknis yang diusulkan (untuk G5/G6, bukan bagian UI kontrak)

- **IPC (Ratified, P7):** command `dataset.pdf.generate` (JobManager-wrapped) dengan payload `{project_id, dataset_id, report_id}` (report_id = sumber HTML ReportRecord; section diputuskan di run_report saat G5 — bila store belum persist ReportRecord, payload `{project_id, dataset_id, scope}` dan section dihitung ulang deterministik) → `PdfRecord {dataset_id, snapshot_id, fingerprint, report_sections, page_count, file_path, file_size_bytes, renderer_version, pdf_fingerprint, source_html_fingerprint, is_final, validation_summary, created_at}`. PDF = artifact file di disk; payload IPC kecil.
- **Renderer (Ratified, P4):** satu mesin; `reportlab` (bila PO memilih) untuk header/footer + pagination tabel + embed font; fallback stdlib hanya bila reportlab tidak tersedia (dijanjikan eksplisit di P4, tidak diam-diam).
- **Provenance (Ratified):** PDF menyematkan daftar sumber immutable yang sama (record id + fingerprint + metode) + footer halaman; metadata PDF Title/Author/Subject = dataset + fingerprint.
- **Uji PDF (Ratified, P5 wajib sebelum M3 done):** clipping, broken breaks, missing fonts, layout overflow di 900px/1440px — screenshot PDF 900/1440 wajib (precedens cleaning).

## Exit G1–G3 (untuk review PO)

Tidak ada perilaku penting yang ditinggalkan ke penemuan implementasi: isi PDF, sumber ReportRecord, renderer tunggal, layout header/footer, freshness, copy, dan a11y sudah diputuskan (P1–P7 Ratified). Exit G4 lulus — builder boleh mulai G5 setelah Critic PASS (backend contract lock → slice).
