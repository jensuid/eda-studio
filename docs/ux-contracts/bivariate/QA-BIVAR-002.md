# QA-BIVAR-002 — Independent Critic Verdict: G5 Vertical Slice Bivariate

**Tanggal:** 2026-11-06
**Critic:** independent re-run (subagent 316427ec).
**Baseline yang diverifikasi:** HEAD `d1e6f4c` ("feat(M2): bivariate vertical slice G5"), di atas `26ff973` (Critic G1–G4 PASS).

## Verdict keseluruhan: **PASS bersyarat (conditional PASS) — kode lulus, penutupan G5 menunggu screenshot**
Backend, frontend, tests, gates, dan token PASS terverifikasi dari file:baris. Screenshot 900/1440 per mode B1/B2/B3 (G5 S5, DS-BIVAR-001:59) belum ada (folder `bivariate/` 0 PNG) — blocker untuk penutupan formal G5, bukan blocker untuk PASS kode maupun memulai M3.

| # | Item | Verdict |
|---|---|---|
| 1 | Backend (record, B1/B2/B3, pairwise-complete, sampled ≤2000, anti-kausal, JobManager, validasi) | PASS |
| 2 | Frontend (8 states, stale, badge, copy literal, ECharts, aria-label, tabel, IPC-only) | PASS (3 advisory) |
| 3 | Tests (6 test B1/B2/B3/A≠B/unknown/payload-shape) | PASS |
| 4 | Gates (pytest 46 passed, ruff clean, tsc exit 0, vite build ✓) | PASS (re-run independen) |
| 5 | Token (tanpa hex literal) | PASS |
| 6 | Screenshot 900/1440 per mode B1/B2/B3 | **BELUM ADA → closure PENDING** |

### 1. Backend — PASS
- `BivariateRecord` `backend/contracts.py:312-338` (mode num-num|cat-num|cat-cat|empty, pearson/spearman, scatter, groups, crosstab, n/missing/sampled).
- B1 `bivariate.py:153-171`, B2 `:173-185`, B3 `:187-200`; V1 pemetaan tipe, V4 top-10+`Lainnya`, V6 no-full-DataFrame.
- Pairwise-complete `bivariate.py:136-141`; sampled ≤2000 eksplisit `bivariate.py:24,158-165`.
- Anti-kausal: grep hanya menemukan komentar larangan.
- `run_bivariate` `application.py:286-334` JobManager-wrapped; validasi A≠B `application.py:297-298` literal kontrak; NotFound `application.py:295-296,306-307`.
- IPC registered `ipc.py:54` + dispatch `:123-128`; default-deny SEC-004 `ipc.py:86-88`.

### 2. Frontend — PASS (3 advisory)
- 8 states: loading, empty_first_run `:54-58`, empty_filtered `:91`, partial/stale `:83` + konstan/tak-terdefinisi, error `:82`, done `:90`, long_content via `overflowX auto`.
- Stale `BivariateSection.tsx:49` → banner "Hasil mungkin usang — jalankan ulang."
- Badge exact/sampled teks `BivariateChart.tsx:117`.
- Copy literal identik dengan `JOB-FLOW-SCREEN-BIVAR.md:95-106` (judul, primer, loading, error, empty, stale, konstan, tak-terdefinisi, pasangan-sama, ringkasan B1/B2/B3).
- ECharts scatter `:49`, bar `:69`, heatmap+visualMap `:92`; aria-label kalimat ringkasan `:109-114`; footnote "Korelasi ≠ sebab-akibat."; tabel alternatif `<details>`.
- Satu-satunya jalur IPC `ipcClient.runBivariate` `:153-160`; grep pywebview/execute_* di `features/bivariate/` kosong.
- Mount `ProjectPage.tsx:246-248` di bawah Quality.

Advisory frontend: (a) V2 "2 desimal UI" vs 4 desimal aktual; (b) marginal totals + % baris B3 hanya di tooltip, tidak di tabel; (c) keyboard "chart container fokusable Enter=buka tabel" tidak literal (tersedia setara via `<details>/<summary>`).

### 3. Tests — PASS
`tests/test_m2_bivariate.py` 6 test (B1/B2/A≠B/unknown/B3/payload-shape) + `test_ipc_security.py` menegaskan `dataset.bivariate.run` terdaftar.

### 4. Gates — PASS (re-run independen)
- `.venv/bin/python -m pytest -q` → **46 passed in 2.48s**, exit 0
- `.venv/bin/ruff check backend tests` → **All checks passed!**, exit 0
- `tsc --noEmit` → exit 0
- `vite build` → **✓ built in 19.73s**, warning chunk-size pre-existing non-blocking

### 5. Token — PASS
Grep hex literal di `frontend/src/features/bivariate/` kosong.

### 6. Screenshot 900/1440 per mode B1/B2/B3 — BELUM ADA
Folder `bivariate/` 0 PNG (hanya 4 `.md`); `docs -iname "*.png"` hanya menemukan 12 PNG cleaning. Exit criteria `DS-BIVAR-001.md:55-59` mensyaratkan screenshot done/loading/empty × B1/B2/B3 × {900,1440} untuk Critic (G5).
Putusan: **blocker untuk penutupan formal G5, bukan untuk PASS kode maupun memulai M3**. Wajib dilengkapi sebelum M3 dinyatakan done/merge; boleh backfilled follow-up desktop paralel selama fase awal M3.

## Advisory non-blocking gabungan
1. `created_at` di kontrak teknis vs implementasi tanpa persistensi (A3) — selaraskan dokumen atau catat sadar.
2. V2 "2 desimal UI" vs 4 desimal aktual.
3. Marginal totals + % baris B3 hilang dari tabel.
4. Blok `pass` mati `bivariate.py:118-120`.
5. Warning chunk-size ECharts pre-existing — kandidat code-split nanti.

## Addendum 2026-11-06 (Opsi B — putusan PO)
`loading` (transient <1 detik) dan `empty_filtered` (unreachable-by-design) dinyatakan **tidak wajib screenshot**; diverifikasi via mutation state + unit test + log. Screenshot wajib tersisa = state done per mode (B1/B2/B3) + empty_first_run. Kontrak diperbarui di `DS-BIVAR-001.md:59` dan `JOB-FLOW-SCREEN-BIVAR.md` (loading + empty_filtered).
