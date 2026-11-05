# QA-PROF-002 — G6 Acceptance Record (job-wrapped profiling + history)

## Scope
- Backend: `dataset.profile.run` command (JobManager Created→Completed, durable
  events), `profiles` table (persisted `ProfileRecord` + `profile_id`), snapshot
  list per project.
- Contracts (Pydantic → TS generated): `RunProfilePayload`,
  `ListProfilesPayload`, `GetProfileByIdPayload`, `ListSnapshotsPayload`;
  `ProfileSummary`, `ProfileListRecord`, `SnapshotInfo`, `SnapshotListRecord`;
  `ProfileRecord.profile_id`.
- Frontend (via `ipcClient` only): run job button, history list + open saved,
  snapshots list. Thresholds unchanged (PROPOSED).
- Regression: `tests/test_store_thread_safety.py` (PyWebView worker-thread
  sqlite access — bug #3).

## Evidence
- Gates: `.venv/bin/python -m pytest -q` → **22 passed**; `ruff check` clean;
  `tsc --noEmit` clean; `npm run build` OK (226.12 kB).
- Tests: `tests/test_m2_profiling_g6.py` (job COMPLETED event, history round-trip,
  reopen by id, snapshots list, NOT_FOUND mapping).
- **Desktop re-verified (PO, 2026-11-05):** load fix confirmed (single
  "Jalankan Profiling" action, mutation-driven loading state); each run
  appends to Profiling history. Critic visual on history/snapshots layout
  at 900px still pending before M3 ECharts histograms.
