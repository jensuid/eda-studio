# FLOW-CLEAN-001 — Flow Contract (M3 Cleaning)

**ID:** FLOW-CLEAN-001 · **Status:** Ratified oleh PO (2026-11-05)
**Parent:** JOB-CLEAN-001 · Doc08 §5 Guided stage 5 (Clean) · SYS-015 (job lifecycle backend-authoritative)
**Rigor:** Standard (G1, G2, G3–G6) · **Kondisi:** G1–G4 ratified; G5 boleh dimulai setelah Critic PASS.
**Keputusan yang sudah ratified:** F1–F4 di bagian bawah (ratifikasi 2026-11-05, sesuai `01-po-ratifikasi.md`).

## G2 — Flow Contract

- **entry:** Dari Quality Check selesai (QualityRecord tampil) → user memilih operasi **Hapus duplikat**, **Hapus baris kosong** (missing), atau **Isi nilai kosong** (imputasi) pada section Cleaning (satu `ProjectPage`, di bawah Profiling + Histogram + Quality).
- **prerequisite (hard gate):** `dataset.quality.run` Completed untuk snapshot aktif DAN fingerprint quality == fingerprint snapshot aktif. Tanpa QualityRecord → operasi disabled + empty state (cabang `no-quality`). Quality dari snapshot lama → operasi disabled + copy stale, bukan cleaning.
- **steps:**
  1. `select` — user memilih operasi + kolom (duplikat: snapshot-wide; hapus-missing: multi-kolom eksplisit per F3; imputasi: **tepat satu kolom** dengan satu strategi — dipilih agar eligibility F2 per-tipe tidak ambigu; lihat B3). Frontend hanya memanggil IPC via `ipcClient` (4 bridge methods tetap). Validasi: operasi harus memetakan ke rule Quality yang actionable (completeness, duplicates) — operasi tanpa temuan tidak boleh dijalankan (empty state informatif, bukan error). **Finding constant & outliers tidak actionable** (informational only, tidak membuka cleaning).
  2. `preview` — dry-run ringkasan dampak (F1) via **`dataset.cleaning.preview`** (read-only query, bukan command; tidak membuat Job/snapshot/record): `role="status"` "Menghitung dampak…" + tombol disabled (mutation `isPending`, bukan query). Output: `{affected_rows, affected_pct, row_count_before, row_count_after, columns, operation, parent_fingerprint, per_column_affected?, filled_rows?}`. Untuk `impute`: `affected_rows` = jumlah sel terisi (= `filled_rows`), `row_count_after` = `row_count_before`. `affected_pct = affected_rows / row_count_before × 100` (bulat 2 desimal, pola quality.py). `drop_duplicates` affected = `dup_count` (n − distinct, baris ekstra yang dihapus — definisi yang sama dengan quality.py). `drop_missing` multi-kolom = union; output wajib menyertakan breakdown per-kolom (`per_column_affected`) agar user bisa verifikasi. Belum snapshot baru, belum tulis data.
  3. `confirm` — dialog konfirmasi destruktif (C2): ringkasan dampak dari step 2 + checkbox persetujuan eksplisit per operasi ("Saya memahami … baris akan dihapus/diisi"). Tanpa checkbox tercentang → tombol "Terapkan" disabled. Default focus = **"Batal"**. Dialog memakai `role="alertdialog"`; status preview/applying diumumkan via live-region terpisah (bukan atribut dialog) untuk menghindari konflik assertive/polite.
  4. `apply` — klik "Terapkan cleaning" → `dataset.cleaning.run` (command, JobManager-wrapped). Payload wajib membawa `expected_parent_fingerprint`. **Revalidasi & cegah TOCTOU:** backend menolak dengan `CONFLICT` bila fingerprint tidak cocok (snapshot berubah sejak preview) — UI menampilkan copy "Snapshot telah berubah. Hitung ulang dampak." Feedback: `role="status"` "Menerapkan cleaning…" + tombol disabled. Apply memakai `idempotency_key` dari envelope (hindari double-submit selain isPending).
  5. `completed` — job Completed → snapshot anak dibuat + `CleaningRecord` persist **dalam satu transaksi backend** (bila persist gagal, job tidak Completed, child tidak dibuat, tetap Failed). Single-tx design hanya; tidak ada kompensasi alternatif.
  6. `activate`/`revert` — UI: setelah Completed, tombol "Gunakan snapshot baru" di panel done (copy di SCREEN) memanggil `dataset.snapshot.activate`. Revert: di daftar snapshot lain, user memilih snapshot mana pun (termasuk induk) lalu "Jadikan aktif" yang memanggil command yang sama (tidak ada command terpisah). Tidak ada dead-end. Setelah aktivasi, banner stale di Profiling/Quality: "Hasil mungkin usang — jalankan ulang." + CTA "Jalankan ulang Profiling" / "Jalankan ulang Quality Check" pada snapshot anak.
  7. `stale` — Analyze hanya dari snapshot aktif yang fingerprint profil/quality-nya == fingerprint aktif; bila mismatch, Analyze diblokir dengan pesan stale ("Hasil mungkin usang — jalankan ulang."). Penegakan: gate Analyze memeriksa fingerprint quality/profil vs aktif; aktivasi tidak memblokir.
- **branches:**
  - **no-quality** — belum ada QualityRecord → empty-first-run: "Jalankan Quality Check terlebih dahulu." + CTA ke Quality. Operasi cleaning disabled.
  - **quality-fingerprint-mismatch** — QualityRecord ada tapi fingerprint ≠ snapshot aktif → operasi disabled + copy "Hasil mungkin usang — jalankan ulang." + CTA jalankan ulang Quality (ini stale-gate, bukan error).
  - **no-finding** — tidak ada finding `problem`/`check` untuk operasi itu → partial: pesan informatif "Tidak ditemukan baris duplikat pada snapshot ini." / "Tidak ada nilai kosong pada kolom yang dipilih." atau sejenisnya. Operasi tidak dijalankan.
  - **preview-failed** — `dataset.cleaning.preview` gagal → banner error dari ErrorContract + "Coba lagi" / "Kembali". Tidak ada dead-end.
  - **Job Failed** → banner error dari ErrorContract + "Coba lagi" / "Kembali". Tidak ada dead-end.
  - **Job Cancelled** → state Cancelled jelas + "Jalankan ulang" + copy "Cleaning dibatalkan. Tidak ada snapshot baru." (copy literal di SCREEN).
  - **apply-CONFLICT** — fingerprint berubah antara preview dan apply → copy "Snapshot telah berubah. Hitung ulang dampak." + kembali ke step 2.
  - **Snapshot kosong (0 rows)** → partial: "Dataset tidak memiliki baris" + CTA import ulang.
  - **Kolom konstanta yang dipilih untuk dihapus barisnya** → allowed dengan peringatan dampak (semua baris terpengaruh). Konfirmasi wajib tampil jelas.
  - **Hasil 0 baris (row_count_after == 0)** → apply DIBLOKIR backend & UI dengan copy "Hasil cleaning akan kosong (0 baris). Pilih kolom lain atau batalkan." (cegah child kosong).
  - **Imputasi pada kolom numerik dengan mean/median (F2):** eligibility — mean/median=numerik saja, mode=kategorikal/teks, konstanta=semua; **kolom `empty`** (semua missing) → hanya konstanta diperbolehkan (mean/median/mode undefined), kolom lain disabled dengan alasan.
  - **Konstanta invalid (F4):** konstanta wajib sesuai tipe: numerik → harus bisa diparse sebagai float (mis. "123" OK, "abc" ditolak); kategorikal → string apa pun kecuali string kosong atau whitespace-only (yang merupakan sentinel missing) ditolak. UI menampilkan inline error.
  - **High-impact guard (drop_missing):** bila affected > 50% snapshot induk → dialog menambah penegasan wajib (checkbox kedua: "Saya memahami lebih dari setengah baris akan dihapus") agar bukan satu klik.
- **completion:** Snapshot anak tampil dengan provenance (`CleaningRecord`), profil & quality ditandai stale, fingerprint baru tampil di ringkasan.
- **cancel_and_back:** Cancel aktif selama preview/applying. Back ke tabel Quality tanpa kehilangan riwayat quality; cleaning yang dibatalkan tidak membuat snapshot baru.

## Keputusan yang sudah ratified (2026-11-05)

| ID | Pertanyaan | Keputusan | Dampak bila ditolak |
|---|---|---|---|
| F1 | Dry-run atau diff baris penuh? | Dry-run ringkasan saja via `dataset.cleaning.preview` (C3) — murah, payload kecil | Diff baris penuh → scope payload & UI naik besar |
| F2 | Eligibility imputasi per tipe kolom | mean/median=numerik, mode=kategorikal/teks, konstanta=semua tipe; **empty** hanya konstanta; teks tidak boleh mean/median | Aturan longgar → risiko nilai salah tipe |
| F3 | Hapus missing multi-kolom | Pilihan multi-kolom eksplisit (baris terhapus bila salah satu kolom kosong, union + breakdown per-kolom) | Single-kolom saja → copy & dialog lebih sederhana |
| F4 | Isi konstanta: validasi tipe | Konstanta harus sesuai tipe kolom target (float untuk numerik, non-kosong/non-whitespace untuk kategorikal) | Tanpa validasi → data rusak diam-diam |

## Exit G2

Flow lengkap dari `select` sampai `stale`/re-run terdefinisi; tidak ada perilaku penting yang ditinggalkan ke penemuan implementasi. F1–F4 Ratified 2026-11-05 (lihat `01-po-ratifikasi.md`). **G5 boleh dimulai setelah Critic PASS. Terutama: outlier trim (winsorize/hapus) tetap non-aktif di flow ini.**
