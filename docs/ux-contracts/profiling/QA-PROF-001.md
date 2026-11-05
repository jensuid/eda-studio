# QA-PROF-001 — Acceptance Record (G5 slice, 2026-11-05)

## Scope of slice
Backend: `backend/profiling.py` (univariate descriptives from Parquet snapshot) +
`dataset.profile` query (contract: `ColumnProfile`/`ProfileRecord` in
`backend/contracts.py`, generated TS updated). Frontend: Profiling section in
`ProjectPage.tsx` (Jalankan Profiling → ringkasan + tabel kolom, states:
empty-first-run, loading, error, done).

## Evidence
- Gates: `.venv/bin/python -m pytest -q` → **19 passed** (incl. 3 profiling tests:
  numeric+categorical, missing→problem, unknown dataset→NOT_FOUND);
  `ruff check` clean; `pnpm run typecheck` clean; `pnpm run build` OK.
- Tests: `tests/test_m2_profiling.py`.
- Logical UI walkthrough (offline, tanpa screenshot capture di headless):
  import sample.csv → Profiling → tabel 3 kolom, sales numeric min 430/max 1200,
  region categorical 4 distinct. Screenshot review tidak dapat dibuat di
  environment ini — **Critique visual harus dilakukan di desktop shell.**

## Known slice simplifications (G6 follow-ups, bukan blocker untuk review)
1. Profiling berjalan sebagai query sinkron, belum dibungkus JobManager job
   (flow menulis Created→Completed). Agendakan sebelum M2 feature-complete.
2. Threshold status (30% missing → problem) masih PROPOSED.
3. Tabel belum virtual scroll; kolom belum bisa di-sort/expand (contract M2 iterasi).

## Critique list untuk reviewer desktop
- [ ] Layout di 900px dan 1440px (DS-CORE-001)
- [ ] Badge status terlihat jelas (teks, bukan hanya warna)
- [ ] State loading/error terbaca
- [ ] Hierarki: ringkasan → tabel → aksi lanjutan
