# M3 Cleaning — Kickoff Brief (brainstorming, BUKAN kontrak)

Status: **DRAFT untuk brainstorming di fresh session.** Bukan JOB/FLOW/SCREEN
contract; tidak ada keputusan PO di dokumen ini. Framework: G1–G4 dulu,
baru G5 slice (pola M2: profiling → histogram → quality).

## Konteks yang sudah dikunci
- 10-stage MVP (Doc00): … Profile → **Quality → Clean** → Analyze → …
- Cleaning mengonsumsi temuan Quality Rules Engine (`dataset.quality.run`,
  4 rules: completeness, duplicates, constant, outliers) — tidak boleh
  mengarang aturan baru di luar kontrak yang diratifikasi.
- Prinsip arsitektur: snapshot immutable + fingerprint SHA-256; cleaning
  yang mengubah data **harus** menghasilkan snapshot baru (provenance),
  tidak pernah mutasi snapshot sumber. Reversibility = kembali ke snapshot
  sebelumnya (sudah ada `dataset.snapshots.list`).
- UI/UX: satu `ProjectPage`, mutation-driven feedback (jangan query
  `isPending`), copy literal Indonesia, min window 900px, tabel native,
  `ipcClient` saja, TS generated dari Pydantic.

## Pertanyaan brainstorming (belum diputuskan — untuk PO)
1. **Operasi MVP mana saja?** Kandidat: drop baris duplikat eksak;
   hapus baris dengan missing di kolom terpilih; imputasi sederhana
   (mean/median/mode/konstanta)? Trim outlier (winsorize/hapus)?
2. **Konfirmasi destruktif**: operasi apa yang wajib dialog konfirmasi
   dengan ringkasan dampak (baris terpengaruh)? (Stop rule framework:
   destructive rule ambigu = stop & tanya PO.)
3. **Pratinjau sebelum terapkan**: apakah PO butuh diff/preview
   (sebelum→sesudah per operasi) sebelum snapshot baru dibuat?
4. **Provenance operasi**: setiap snapshot hasil cleaning mencatat operasi
   apa + parameter + snapshot induk? (Usul: ya — "CleaningRecord" mirip
   ProfileRecord, persist di `cleanings` table.)
5. **Stale/re-run**: setelah cleaning, profiling & quality lama dianggap
   usang (sudah ada pola fingerprint stale di SCREEN-QUAL-001)?
6. **Scope kolom**: operasi per-kolom atau berlaku snapshot-wide?
7. **Daftar artefak G1–G4**: `JOB-CLEAN-001`, `FLOW-CLEAN-001`,
   `SCREEN-CLEAN-001`, `DS-CLEAN-001` di `docs/ux-contracts/cleaning/`,
   mengikuti template `contract_first_ui_v2/docs/03-artifact-templates.md`.

## QA utang yang dibawa dari M2 (polish visual, bukan blocker M3)
- O1: badge severity + garis tabel bertoken (DS-CORE), header rata kiri.
- O2: format `evidence_detail` yang lebih ramah.
- (O3 history/snapshots: CLOSED — QA-PROF-003.)
