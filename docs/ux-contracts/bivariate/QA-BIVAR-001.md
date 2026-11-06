# QA-BIVAR-001 — Independent Critic Verdict: Bivariate G1–G4

**Tanggal:** 2026-11-06
**Critic:** independent re-run (subagent 63ff9dce).
**Baseline yang diverifikasi:** `01-po-ratifikasi.md` Ratified (V1–V7 semua Setuju), di atas `cf2fdc6`.

## Verdict keseluruhan: **PASS dengan advisory (non-blocking)** untuk G1–G4

Tidak ada blocker untuk lanjut ke backend contract lock (`contracts.py` + `BivariateRecord`). Satu hal yang diperbaiki sebelum G5 coding adalah pembersihan status basi (A1), bukan isi kontrak.

| # | Item | Verdict |
|---|---|---|
| 1 | Scope & not-in-scope vs Doc16 §M2 + Doc01 §Scope | PASS |
| 2 | No whole-DataFrame JSON over IPC | PASS (A2 advisory) |
| 3 | JobManager-wrapped + backend-authoritative + provenance | PASS (A3 advisory) |
| 4 | Exact vs sampled eksplisit (V3) | PASS |
| 5 | Kausalitas (tanpa klaim sebab-akibat) | PASS |
| 6 | 8 states, keyboard, a11y, responsif, ECharts, token | PASS |
| 7 | SEC-004 default-deny | PASS |
| 8 | Konsistensi internal SCREEN vs DS vs ratifikasi | PASS (A1 advisory) |

### 1. Scope & not-in-scope vs Doc16 §M2 + Doc01 §Scope — PASS
- Parent kontrak eksplisit `JOB:4` (Doc16 §M2, Doc01 §Scope). Deskriptif saja: B1 Pearson+Spearman, B2 mean/median grup, B3 cross-tab.
- `not_in_scope`: uji inferensial/p-value/CI, interpretasi kausal, regresi, export chart/report (P4), agregasi >2 kolom — konsisten "basic bivariate, deskriptif".
- Baseline: Doc16 §M2 "Basic bivariate analysis", Doc01 Scope "Basic univariate and bivariate analysis".

### 2. No whole-DataFrame JSON over IPC — PASS (A2)
- Payload hanya `{project_id, dataset_id, column_a, column_b}` → record ringkasan; ditegaskan "bukan whole-DataFrame → JSON IPC aman". Sama seperti pola histogram.

### 3. JobManager-wrapped + backend-authoritative + provenance — PASS (A3)
- Lifecycle `Created→Queued→Preparing→Running→Completed, backend-authoritative SYS-015`; command `dataset.bivariate.run` JobManager-wrapped.
- Provenance `snapshot_id`+`fingerprint` di record, tampil di `BivariateSummary` — identik pola histogram & quality. Stale gate fingerprint ≠ terkini.

### 4. Exact vs sampled eksplisit (V3) — PASS
- Record wajib `sampled: bool, sample_size?`; scatter >V3 dicatat eksplisit; completion "tidak ada silent downgrade"; badge exact/sampled di summary & done. V3 = 2000 titik deterministik baris-pertama — konsisten.

### 5. Kausalitas — PASS
- Copy UI tidak ada "menyebabkan/mempengaruhi" (grep hanya menemukan di larangan); larangan eksplisit + footnote B1 "Korelasi ≠ sebab-akibat". B2 copy murni deskriptif.

### 6. 8 states, keyboard, a11y, responsif, ECharts, token — PASS
- 8 states lengkap; keyboard Tab berurutan, Enter=buka tabel, fokus ke status; a11y `role="img"` + `aria-label` kalimat ringkasan, `aria-live="polite"`, tabel selalu tersedia; responsif 900px; ECharts-only; token semantic tanpa hex.

### 7. SEC-004 default-deny — PASS
- A≠B divalidasi frontend+backend; kolom tidak ada di profil ditolak backend; tipe tak didukung ditolak eksplisit dengan pesan tipe.

### 8. Konsistensi internal — PASS (A1)
- V1–V7 konsisten lintas file (JOB, DS, ratifikasi); copy literal identik; arah column_a/b konsisten.

## Advisory non-blocking
- **A1 (diperbaiki saat verdict ini, sebelum G5):** status basi — header "Ratified" tapi isi masih "PROPOSED … butuh ratifikasi" + "atau V3 bila PO memilih lain" + "4 dokumen". Dibersihkan jadi Ratified.
- **A2:** AGENTS.md "analytics payloads use Arrow IPC (M2+)" vs kontrak "JSON IPC aman" untuk ≤2000 titik. Ikuti preseden histogram; kunci di `contracts.py` bahwa `sample_size ≤ 2000` dan titik plot tidak disimpan penuh di record (hanya ringkasan + sampel untuk tabel).
- **A3:** putuskan eksplisit saat lock: persist `BivariateRecord` ke tabel vs recompute (histogram/quality = recompute murah; cleaning = persist). Kontrak saat ini hanya menyebut job history.
- **A4:** rujukan "mengikuti C5 (cleaning)" abstrak — ganti dengan aturan stale eksplisit (fingerprint ≠ snapshot terkini = stale).

## Bukti utama per berkas
- `JOB-FLOW-SCREEN-BIVAR.md:4` parent; `:39-41` B1/B2/B3; `:22-32` not-in-scope; `:47,50,62` IPC/job/provenance; `:78-86` 8 states; `:94-109` copy/a11y; `:113-118` kontrak teknis V2–V7.
- `DS-BIVAR-001.md:7-19` tokens; `:25-29` komponen; `:40-41` ECharts + sampling; `:47-52` V1–V7.
- `01-po-ratifikasi.md:14-30` V1–V7 ✓ Setuju; `:34-38` aturan terputuskan.

## Gates (relevan kontrak)
- Belum ada kode G5 — gates pytest/ruff/typecheck tidak dijalankan untuk verdict ini (verdict = validasi dokumen G1–G4).
