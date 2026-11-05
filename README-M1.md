# EDA Workbench — M1 Technical Foundation (Step 2)

Vertical slice yang berjalan: **project → import CSV → immutable snapshot → preview → reopen**,
melalui JobManager backend-authoritative dan IPC typed (Baseline Freeze v1.0).

## Struktur
```
backend/     contracts.py (Pydantic = source of truth, SYS-016)
             domain.py · application.py · execution.py (JobManager, Doc05 §8.2)
             persistence.py (SQLite WAL+FK, snapshot files) · ipc.py (4 bridge methods, SEC-004)
frontend/    React+TS+Vite; satu ipcClient; types di src/shared/ipc/generated.ts (GENERATED)
desktop/     PyWebView host — expose hanya 4 bridge methods
tools/       generate_types.py (Pydantic -> TS)
tests/       11 test: slice M1, default-deny, state machine
```

## Cara jalan
```bash
python3 -m venv .venv && .venv/bin/pip install "pydantic>=2.9" pytest ruff eval_type_backport
.venv/bin/python tools/generate_types.py
.venv/bin/python -m pytest -q          # 11 passed
.venv/bin/ruff check backend tests tools
cd frontend && pnpm install && pnpm run build
```

## Keputusan yang sudah diratifikasi (Freeze v1.0)
IPC-001–005/010–012, SYS-015/016/018, SEC-004, FE-002/004/011, OD-9 (Pyright strict,
TS strict, generator dipilih di ADR P1), OD-8 gate merge, OD-11 didelegasi ke ADR.

## Batasan M1 ini (sengaja)
- Import hanya `.csv` (stdlib). Adapter `.parquet`/`.xlsx` = M1-next; port storage sudah siap.
- Snapshot disimpan sebagai bytes CSV ter-fingerprint SHA-256 (Parquet menyusul dengan pyarrow).
- JobManager sinkron in-process; ProcessPool/scheduler = M2 (Doc05 §21).
- Desktop shell butuh `pip install pywebview` (tidak diuji di CI ini).

## ADR P1 yang masih terbuka
Generator Pydantic→TS final (`datamodel-codegen`-setara vs generator kustom di `tools/`),
ORM/repo (stdlib sqlite vs SQLAlchemy Core), DDL per modul.
