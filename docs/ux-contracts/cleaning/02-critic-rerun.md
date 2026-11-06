# Critic — Verdict Re-run: M3 Cleaning Vertical Slice (G5)

Tanggal: **2026-11-06**
Critic: independent re-run after fixes.
Baseline yang diverifikasi: HEAD `e381209` ("docs: cleaning screenshots 900px/1440px (G5 S5)"), di atas `3e916d5` ("fix: restore preview for stale detection") dan `6a81775` ("feat: cleaning vertical slice G5").

## Verdict keseluruhan: **PASS** (6/6 previously-FAIL items terverifikasi teratasi; 1 advisory non-blocking)

Verdict sebelumnya **FAIL** karena: kontrak dialog, copies, high-impact guard, klaim single-transaction. Keenam item tersebut **sudah teratasi dan terverifikasi di HEAD ini**. Satu advisory baru dicatat di §3 yang tidak menghalangi PASS (ada jalur aktivasi fungsional, hanya label↔aksi tertukar vs tabel copy).

---

### 1. Kontrak dialog (`CleaningConfirmDialog.tsx`) — **PASS**

* Tersedia sebagai `role="alertdialog"` dengan `aria-modal`, `aria-labelledby`/`aria-describedby` (baris 56+).
* Focus default pada "Batal" via `cancelRef` (baris 14, 21, 115); `Terapkan cleaning` `disabled={!canConfirm}` sampai checkbox ter-check.
* Enter tidak memicu apply: `onSubmit={(e) => e.preventDefault()}` dan Enter-key ditolak eksplisit di `onKeyDown` (baris 74).
* `maxHeight: "calc(100vh - 64px)"` (baris 72) dengan scroll internal; footer tombol di luar area scroll.
* Focus trap Tab (baris 24–48), Escape → `onCancel()` saat tidak pending.
* Checkbox utama bertuliskan "Saya memahami {affected_rows} baris akan dihapus…" / "Saya memahami {filled_rows} sel akan diisi pada kolom …".

### 2. Copy literals (SCREEN tabel, 27 literal) — **PASS**

Semua 27 literal terverifikasi secara literal per baris (grep `frontend/src` + `backend --include` menunjukkan OK untuk setiap item, termasuk "Hasil cleaning akan kosong (0 baris)…" di `backend/application.py:353` dan "Snapshot telah berubah. Hitung ulang dampak." di `backend/application.py:341` + `CleaningSection.tsx:146,151`).

Pengecualian: lihat §3 (mapping aksi, bukan literal).

### 3. Advisory — mapping CTA aktivasi tertukar vs tabel copy — **advisory, non-blocking**

* `SCREEN-CLEAN-001.md:37-38`: activate CTA (done) = **"Gunakan snapshot baru"**; revert CTA (daftar snapshot) = **"Jadikan aktif"**.
* `FLOW-CLEAN-001.md:18` (langkah 6): tombol **"Gunakan snapshot baru"** di panel done memanggil `dataset.snapshot.activate`.
* Implementasi (`CleaningSection.tsx:157-160`): **"Gunakan snapshot baru"** hanya `setCompleted(null)` (menutup panel, tidak mengaktivasi); **`dataset.snapshot.activate`** dipanggil oleh tombol **"Jadikan aktif"**. Tombol "Jadikan aktif" untuk revert di daftar snapshot lain tidak ada di `ProjectPage` (daftar snapshot read-only — grep "Jadikan aktif" di `ProjectPage.tsx` kosong).
* Dampak: fungsionalitas aktivasi **tetap ada** (via "Jadikan aktif"), bukan dead-end; tetapi label↔aksi tertukar vs kontrak. Diajukan sebagai advisory perbaikan follow-up (swap handler, atau tambahkan "Jadikan aktif" per baris di daftar snapshot). Tidak menghalangi PASS karena jalur aktivasi tersedia dan semua literal hadir.

### 4. Persistensi single-transaction — **PASS**

* `backend/application.py:381-386`: child snapshot + record ditulis dalam **satu** pemanggilan `save_child_snapshot_with_cleaning` (satu `commit()`, `rollback()` + re-raise saat ekssepsi, `persistence.py:159-178`), di-insert **tepat sekali** (ekstraksi `_insert_*_no_commit` + satu `commit()`), setelah job selesai.
* Klaim "single-transaction" di kontrak terpenuhi (record ditulis sekali; klaim sebelumnya tentang dual-write tidak berlaku pada kode ini).
* `CleaningRecord` di tabel `cleanings` (`persistence.py` `INSERT OR REPLACE INTO cleanings`), `job_id=status.job_id` dari job nyata (`application.py:367`).

### 5. Optimistic concurrency — **PASS**

* `CleaningRunPayload.expected_parent_fingerprint` wajib (`contracts.py:322-329`).
* TOCTOU check in-band di `application.py:338-341` menolak `CONFLICT` ("Snapshot telah berubah. Hitung ulang dampak.") bila fingerprint induk berbeda.
* `ipc.py:138-139` memetakan `ConflictError` → `CONFLICT` untuk command.

### 6. Stale-banner restored-preview flow — **PASS**

* `runMutation.onSuccess` kini menyimpan preview ke `stalePreview` sebelum `setPreview(null)`; `activateMutation.onSuccess` me-restore `setPreview(stalePreview)` — banner stale dapat tercapai melalui alur kanonis (fix `3e916d5`).
* `previewStale = preview.parent_fingerprint !== dataset.fingerprint` (`CleaningSection.tsx:91`); banner `CleaningStaleBanner` "Snapshot telah berubah. Hitung ulang dampak." dirender bersama ringkasan yang disembunyikan saat stale (baris 145–146).
* Dilaporkan oleh user sebagai reproduksi manual; arsip `cleaning-stale-*.png` menunjukkan banner hadir (lihat §11).

### 7. IPC JSON-serializability — **PASS**

* Seluruh return `execute_command`/`execute_query` menggunakan `.model_dump(mode="json")` (18 instance di `ipc.py`), termasuk `CleaningRecord` (`created_at: datetime` → ISO string). Bug serialisasi pywebview (datetime tidak ter-serialize) teratasi.
* `get_events` juga `.model_dump(mode="json")` (baris 187); `JobState` "Completed" sesuai wire value.
* Verifikasi e2e sebelumnya via bridge langsung: `ok: True`, `json serializable: OK`, `created_at: 2026-11-06T09:11:28.437055Z`, event state `Completed`.

### 8. Prerequisite gate + F1–F4/F2 — **PASS**

* Gate: `gated = qualityRecord && qualityRecord.fingerprint === dataset.fingerprint` (`CleaningSection.tsx:79-80`); bila tidak, "Jalankan Quality Check terlebih dahulu." dan banner "Hasil mungkin usang — jalankan ulang." bila stale. `CleaningSection` tanpa `key` di `ProjectPage` → preview state persisten lintas pergantian dataset (diperlukan untuk stale).
* F1: impute tepat satu kolom — backend `_validate` (`length!=1` → `ValidationError`) dan frontend (disabled "Hitung dampak" kecuali tepat 1 kolom).
* F2: `eligibleStrategies` (numeric → mean/median/constant; categorical → mode/constant; empty → constant saja) + label "Strategi ini tidak tersedia untuk tipe kolom ini." + para "Kolom ini kosong — hanya konstanta yang tersedia."
* F3: multi-column union + `per_column_affected` breakdown (`cleaning.py` `_compute` + `CleaningImpactSummary.tsx:16-22`).
* F4: konstanta wajib cocok dengan tipe (`constantError` inline + `_validate` backend, "Masukkan angka yang valid…" / "Masukkan teks yang tidak kosong.").

### 9. High-impact guard (> 50%) — **PASS**

* Checkbox kedua "Lebih dari setengah baris akan dihapus." muncul bila `preview.affected_pct > 50` (`CleaningConfirmDialog.tsx:103-112`); `canConfirm` memerlukan kedua checkbox.
* Backend menolak hasil 0-baris dengan "Hasil cleaning akan kosong (0 baris). Pilih kolom lain atau batalkan." (`application.py:351-354`).
* "Lebih dari setengah baris akan dihapus." terverifikasi hadir di kode (grep OK di §2). Screenshot dialog pada 12,5% dengan benar **tidak** menampilkan checkbox kedua.

### 10. Tokens / no chart / placement — **PASS**

* `grep "#[0-9a-fA-F]{3,6}|rgba(|rgb(" frontend/src/features/cleaning` → kosong: tidak ada raw hex di komponen cleaning.
* Class tokens diterapkan: `cleaning-impact`, `cleaning-operation-id`, `cleaning-danger-dialog surface-raised border-subtle` (form), `cleaning-stale`.
* Tidak ada chart di cleaning (spec rule 7).
* Placement: `CleaningSection` di `ProjectPage` di bawah Profiling+Histogram+Quality; `window.pywebview` hanya di `ipcClient` (grep `window.pywebview|pywebview` di `frontend/src` di luar `ipcClient` kosong).

### 11. Screenshot 900px/1440px (preview/dialog/done/stale/no-finding/ineligible) — **PASS**

12 berkas di `docs/ux-contracts/cleaning/` (`cleaning-{preview,dialog,done,stale,no-finding,ineligible}-{900,1440}.png`). Verifikasi OCR (tesseract):

* **preview** (900+1440): "Hapus baris hilang", "Kolom: score", "Baris: 8 → 7 · Terdampak: 1 (12.5%)", "score: 1 baris", "Snapshot induk: ac6ead09bbd6…". ✓
* **dialog** (900+1440): "Terapkan cleaning?", "Operasi ini bersifat destruktif. Periksa ringkasan dampak berikut sebelum melanjutkan.", "Saya memahami 1 baris akan dihapus dari snapshot ini." + "Batal". ✓
* **done** (900+1440): "Cleaning selesai. Snapshot baru telah dibuat.", "Snapshot baru: 01a1b024 · e6d3f0b70d05… · 8 → 7 baris", "Gunakan snapshot baru" + "Jadikan aktif". ✓
* **stale** (900+1440): "Hitung dampak" + "Snapshot telah berubah. Hitung ulang dampak." ✓
* **no-finding** (900+1440): "Baris: 8 → 8 · Terdampak: 0 (0%)" + "Tidak ada nilai kosong pada kolom yang dipilih." ✓
* **ineligible** (900+1440): "Modus (mode) — Strategi ini tidak tersedia untuk tipe kolom ini." ✓

### 12. Gates — **PASS**

* `.venv/bin/python -m pytest -q` → `40 passed in 1.37s`
* `.venv/bin/ruff check backend tests` → `All checks passed!`
* `pnpm run typecheck` → bersih
* `pnpm run build` sebelumnya PASS (vite `✓ built in 11.91s`/`14.31s`, warning chunk-size saja)

---

## Bukti utama per berkas

* `backend/application.py:284-388` — `cleaning_preview`, TOCTOU 338-341, literal CONFLICT 341, zero-child 351-354, `job_id=status.job_id` di 367, single-tx call 382-386, `activate_snapshot` 389+.
* `backend/persistence.py:159-178` — `save_child_snapshot_with_cleaning` single commit + rollback.
* `backend/ipc.py:100-198` — dispatch `dataset.cleaning.run` (121-128), `dataset.snapshot.activate` (129-131), mapping `ConflictError`→CONFLICT (138-139), semua `.model_dump(mode="json")` (termasuk 135-145, 178-184, 187). Catatan minor: `execute_query` (177-182) tidak memetakan `ConflictError`; `cleaning_preview` tidak pernah melempar `Conflict`, jadi bukan pelanggaran kontrak.
* `backend/contracts.py:283-347` — `CleaningOperation`/`CleaningStrategy`, `CleaningPreviewSummary` (termasuk `parent_fingerprint`, `per_column_affected`, `filled_rows`), `CleaningRunPayload.expected_parent_fingerprint` wajib, `CleaningRecord` (`created_at: datetime` 342).
* `backend/cleaning.py` (230 baris) — `_validate` F2/F4, `_compute` (drop-imputation/drop-missing union/per-column), `preview_cleaning` dry-run.
* `frontend/src/features/cleaning/CleaningSection.tsx` — gate 40-41/79-80, stale 91/146, `stalePreview` restore 71-72/85-86, CTA done 157-160 (advisory §3).
* `frontend/src/features/cleaning/CleaningConfirmDialog.tsx:14-115` — alertdialog, focus Batal, trap, Escape, Enter-prevent, high-impact, `maxHeight calc(100vh-64px)` 72.
* `frontend/src/features/cleaning/CleaningOperationPicker.tsx:16-22,38-52` — F2 eligibility + `constantError`.
* `frontend/src/features/cleaning/CleaningImpactSummary.tsx:24-29` — no-finding literals.
* `frontend/src/features/project/ProjectPage.tsx:146-155` — daftar snapshot read-only (relevan untuk advisory §3).
* `tests/test_m3_cleaning.py` (153 baris, 9 test) — semua mencakup dispatches valid.
