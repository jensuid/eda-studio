# SCREEN-CLEAN-001 — Screen & Interaction Contract (M3 Cleaning)

**ID:** SCREEN-CLEAN-001 · **Status:** Ratified oleh PO (2026-11-05)
**Parent:** FLOW-CLEAN-001 · Doc08 §5 Guided stage 5 (Clean) · DS-CORE-001 · DS-QUAL-001
**Rigor:** Standard (G1, G2, G3–G6) · **Kondisi:** G1–G4 ratified; G5 boleh dimulai setelah Critic PASS.
**Keputusan yang sudah ratified:** S1–S5 di bagian bawah (ratifikasi 2026-11-05, sesuai `01-po-ratifikasi.md`).

## G3 — Screen Contract

- **screen:** `cleaning` · **primary_action:** "Terapkan cleaning" (hanya aktif setelah preview + konfirmasi — FLOW-CLEAN-001 step 3–4)
- **hierarchy:** Simpan di tempat — section baru di bawah Profiling + Histogram + Quality (satu `ProjectPage`, satu jalur Guided). Urutan: pemilih operasi + kolom → panel pratinjau dampak (ringkasan) → dialog konfirmasi destruktif → hasil (snapshot baru + provenance + CTA re-run).
- **Bagian yang dihapus:** tidak ada editor aturan; tidak ada tabel diff before-after baris penuh; tidak ada tombol cleaning aktif tanpa QualityRecord; tidak ada winsorize/hapus outlier; tidak ada jalur UI untuk aktivasi/revert snapshot (ditangani di FLOW).
- **Copy literal (mengikat — Ratified S1):**

| elemen | teks |
|---|---|
| judul section | "Cleaning" |
| primer | "Terapkan cleaning" |
| preview loading | "Menghitung dampak…" |
| applying | "Menerapkan cleaning…" |
| error (apply) | "Cleaning gagal. Silakan coba lagi." |
| error (preview) | "Tidak dapat menghitung dampak. Silakan coba lagi." |
| empty-first-run (tanpa QualityRecord) | "Jalankan Quality Check terlebih dahulu." |
| quality-fingerprint-mismatch | "Hasil mungkin usang — jalankan ulang." |
| stale (setelah cleaning) | "Hasil mungkin usang — jalankan ulang." |
| no-finding (duplikat kosong) | "Tidak ditemukan baris duplikat pada snapshot ini." |
| no-finding (missing kosong) | "Tidak ada nilai kosong pada kolom yang dipilih." |
| ineligible (tipe tidak mendukung) | "Strategi ini tidak tersedia untuk tipe kolom ini." |
| empty column (hanya konstanta) | "Kolom ini kosong — hanya konstanta yang tersedia." |
| zero-child blocked | "Hasil cleaning akan kosong (0 baris). Pilih kolom lain atau batalkan." |
| constant invalid numerik | "Masukkan angka yang valid untuk kolom ini." |
| constant invalid kategorikal | "Masukkan teks yang tidak kosong." |
| high-impact extra | "Lebih dari setengah baris akan dihapus." |
| conflict (fingerprint berubah) | "Snapshot telah berubah. Hitung ulang dampak." |
| cancelled | "Cleaning dibatalkan. Tidak ada snapshot baru." |
| completed | "Cleaning selesai. Snapshot baru telah dibuat." |
| activate CTA (done) | "Gunakan snapshot baru" |
| revert CTA (daftar snapshot) | "Jadikan aktif" |
| dialog judul | "Terapkan cleaning?" |
| dialog body | "Operasi ini bersifat destruktif. Periksa ringkasan dampak berikut sebelum melanjutkan." |
| completed filled (impute) | "Baris diisi: {filled_rows} pada kolom {columns}." |

- **dialog konfirmasi (wajib untuk ketiga operasi):** operasi + kolom + ringkasan dampak (baris terpengaruh, %, row_count sebelum → sesudah, snapshot induk fingerprint singkat — 12 karakter pertama, pola `slice(0,12)` ProjectPage) + checkbox persetujuan eksplisit ("Saya memahami … baris akan dihapus/diisi") + dua tombol: "Batal" (default focus) dan "Terapkan cleaning" (disabled sampai checkbox tercentang). Enter tidak memicu Terapkan: Enter hanya menutup dialog lewat "Batal" bila focus di area dialog (atau tombol primer tetap disabled sampai checkbox).
- **states:** 8 keadaan framework + cabang domain — semuanya terdefinisi:
  - `loading` (preview/applying, status `aria-live="polite"` di live-region terpisah + tombol disabled via `isPending` mutation, bukan query; skeleton pemilih operasi sesuai DS `CleaningSkeleton`)
  - `empty-first-run` (belum ada QualityRecord)
  - `quality-fingerprint-mismatch` (quality dari snapshot lama; kategori stale-gate, copy sama dengan stale)
  - `empty-filtered` (operasi tidak eligible untuk kolom terpilih → copy ineligible/empty di atas, FLOW F2)
  - `partial` (snapshot kosong + CTA import ulang; cabang no-finding → pesan informatif, bukan error)
  - `no-finding` (bukan error, bukan empty: "Tidak ditemukan baris duplikat …" dalam pane Cleaning)
  - `error` (preview Failed → copy preview-error + "Coba lagi"/"Kembali"; apply Failed → ErrorContract + copy error + "Coba lagi"; apply CONFLICT → copy conflict + kembali ke preview)
  - `long-content` (daftar kolom panjang → scroll di dalam pemilih kolom saja; dialog max-height = viewport − 64px dengan scroll internal ringkasan+checkbox bila overflow, agar tombol Batal/Terapkan tetap terlihat di 900px)
  - `restricted` (N/A dengan alasan: single-user local-first — tidak ada peran/kuota yang membatasi cleaning; satu-satunya pembatasan = gate QualityRecord+fingerprint, yang sudah ditangani sebagai empty-first-run/mismatch, bukan restricted)
  - `cancelled` (copy cancelled di atas, dialog tertutup, kembali ke preview)
  - `done` (snapshot anak + provenance + CTA re-run + filled count per kolom untuk impute)
- **interaksi/keyboard:** dialog focus-trapped + Escape untuk batal; radio/checkbox pemilih operasi + kolom dapat diakses keyboard; tabel (bila ada ringkasan) dapat di-scroll horizontal **di dalam pane tabel saja** (bukan page scroll, aturan 900px); fokus terlihat `:focus-visible`; status `aria-live="polite"` (live-region terpisah dari `alertdialog`).
- **aksesibilitas:** ringkasan dampak berupa **teks** (angka + cakupan), bukan hanya ikon/dialog; dialog dengan `role="alertdialog"`; konfirmasi tidak hanya pewarnaan merah.
- **responsif:** min window 900px primary (≥1200 side-by-side pemilih + pratinjau, 900–1200 stacked untuk section ini); scroll horizontal hanya di dalam pane tabel; dialog max-height + internal scroll mengikat di 900px.

## Kontrak teknis (mengikat implementasi — Ratified 2026-11-05)

- **Operasi MVP (C1, S2):** 3 operasi — `drop_duplicates` (snapshot-wide), `drop_missing` (per-kolom, multi-kolom eksplisit), `impute` (per-kolom: **tepat satu kolom** dengan **satu strategi**). Winsorize/hapus outlier **tidak** ada di enum operasi. Enum strategy: `mean | median | mode | constant`.
- **IPC commands (S3):** pola JobManager-wrapped seperti `dataset.profile.run` / `dataset.histogram.run` / `dataset.quality.run` (nama final backend/ipc.py). Tiga operasi didefinisikan:
  - `dataset.cleaning.preview` — query read-only (tanpa Job/snapshot/record). Input `CleaningPreviewPayload {project_id: str, dataset_id: str, operation: CleaningOperation, columns: list[str], strategy?: CleaningStrategy, constant_value?: str}`; output `CleaningPreviewSummary {operation, columns, parent_fingerprint, row_count_before: int, row_count_after: int, affected_rows: int, affected_pct: float, per_column_affected?: list[CleaningColumnImpact], filled_rows?: int}`. Untuk `impute`, `affected_rows == filled_rows` dan `row_count_after == row_count_before`. Preview menampilkan `filled_rows` dan breakdown `per_column_affected` agar user bisa memverifikasi sumber pengisian.
  - `dataset.cleaning.run` — command JobManager-wrapped. Input `CleaningRunPayload {project_id: str, dataset_id: str, operation: CleaningOperation, columns: list[str], strategy?: CleaningStrategy, constant_value?: str, expected_parent_fingerprint: str}`; output `CleaningRecord` (di bawah). Validasi: `columns[]` kosong ditolak untuk `drop_missing`/`impute`; untuk `drop_duplicates` harus kosong. `strategy` wajib untuk `impute`, dilarang untuk operasi lain. `constant_value` wajib iff `strategy == "constant"`, dilarang selain itu. `expected_parent_fingerprint` wajib (TOCTOU guard). Untuk `impute`, `len(columns) == 1` (validasi backend). `CleaningColumnImpact {column: str, affected_rows: int}`.
  - `dataset.snapshot.activate` — command read-write aktivasi snapshot eksplisit (juga jalur revert ke snapshot sebelumnya). Input `{project_id: str, dataset_id: str, snapshot_id: str}`; output `DatasetRecord` yang sudah terupdate (`snapshot_id` + fingerprint/row_count/columns). Apply `cleaning.run` TIDAK otomatis mengaktifkan child. Aktivasi TIDAK digate pada profiling/quality re-run.
- **Pydantic SSOT (aturan AGENTS.md):** semua payload & record di atas (**harus**) didefinisikan di `backend/contracts.py` sebagai model Pydantic sebelum G5 dimulai (single source of truth); TypeScript di `frontend/src/shared/ipc/` di-generate via `tools/generate_types.py` — jangan hand-edit. `CleaningRecord {id: str, project_id: str, dataset_id: str, created_at: str, job_id?: str, parent_snapshot_id: str, parent_fingerprint: str, child_snapshot_id: str, child_fingerprint: str, operation: CleaningOperation, columns: list[str], strategy?: CleaningStrategy, constant_value?: str, row_count_before: int, row_count_after: int, affected_rows: int, filled_rows?: int}`. Persist di tabel `cleanings` (milik backend/persistence.py). Ukuran kecil (ringkasan, bukan whole-DataFrame) → JSON IPC aman.
- **Dry-run (F1→S4):** preview memanggil perhitungan tanpa menulis snapshot; tidak menyimpan `CleaningRecord` sampai apply Completed.
- **Persistensi (C4→S5):** G5 slice **persist** `CleaningRecord` di tabel `cleanings` (berbeda dengan quality/histogram yang recompute — provenance cleaning wajib durable). Job lifecycle tetap durable via events (SYS-015). Snapshot anak + record tersimpan dalam satu transaksi.
- **Stale (C5):** setelah aktivasi (`dataset.snapshot.activate` ke child), fingerprint snapshot aktif berubah secara eksplisit; Profiling/Quality dari snapshot induk tampil stale + wajib re-run sebelum Analyze (copy "Hasil mungkin usang — jalankan ulang."). Mekanisme stale = perbandingan fingerprint (profile/quality.fingerprint vs aktif); penegakan di Analyze + aktivasi snapshot.

## Keputusan yang sudah ratified (2026-11-05)

| ID | Pertanyaan | Keputusan |
|---|---|---|
| S1 | Copy literal | Seperti tabel copy di atas; Ratified |
| S2 | Enum operasi | 3 operasi saja, outlier tidak ada |
| S3 | Nama command IPC | `dataset.cleaning.run` + `dataset.cleaning.preview` + `dataset.snapshot.activate` (JobManager-wrapped/query) |
| S4 | Preview | Dry-run ringkasan, bukan diff baris |
| S5 | Persistensi CleaningRecord | Persist dari slice G5 (provenance wajib) |

## Exit G3

Tidak ada perilaku penting yang ditinggalkan ke penemuan implementasi: operasi, scope, copy, 8 states, dialog, keyboard, a11y, responsif sudah diputuskan (S1–S5 Ratified 2026-11-05). **G5 boleh dimulai setelah Critic PASS. Cleaning M3 tetap non-aktif sampai aktivasi snapshot diimplementasikan (B4).**

## QA utang dari M2 yang diwarisi (polish, bukan blocker M3)

- O1: badge severity + garis tabel bertoken (DS-CORE) — bila cleaning menampilkan severity Quality, wajib memakai token `status-ok`/`status-warning`/`status-error` dari DS-CORE-001 (bukan token baru); bila tidak menampilkan severity, kontrak menyatakan cleaning tidak punya tampilan severity.
- O2: format `evidence_detail` yang lebih ramah.
- (O3 history/snapshots: CLOSED — QA-PROF-003.)
