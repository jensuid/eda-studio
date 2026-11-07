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
tests/       74 test: slice M1, default-deny, state machine, M2/M3, P0 fixes
```

## Cara jalan
```bash
python3 -m venv .venv && .venv/bin/pip install "pydantic>=2.9" pytest ruff eval_type_backport
.venv/bin/python tools/generate_types.py
.venv/bin/python -m pytest -q          # 74 passed (2026-11-07)
.venv/bin/ruff check backend tests tools
cd frontend && pnpm install && pnpm run build
```

## Keputusan yang sudah diratifikasi (Freeze v1.0)
IPC-001–005/010–012, SYS-015/016/018, SEC-004, FE-002/004/011, OD-9 (Pyright strict,
TS strict, generator dipilih di ADR P1), OD-8 gate merge, OD-11 didelegasi ke ADR.

## Batasan M1 ini (sengaja)
- M1-next (selesai): import CSV/XLSX/Parquet dinormalisasi ke snapshot **Parquet kanonis**
  (`backend/ingestion.py`); fingerprint SHA-256 selalu dari bytes sumber asli.
- Desktop shell terverifikasi di level bridge+bundle (pywebview terinstall, `js_api`
  terekspos, `frontend/dist` terbangun); peluncuran jendela interaktif = langkah manual
  `python desktop/main.py` (tidak diuji otomatis di lingkungan ini).
- JobManager sinkron in-process; ProcessPool/scheduler = M2 (Doc05 §21).
- Desktop shell butuh `pip install pywebview` (tidak diuji di CI ini).

## ADR yang sudah Accepted (2026-11-07)
ADR-001 generator kustom di `tools/generate_types.py` + fail-loud (P0-2c); ADR-002 IPC M1 — keduanya **Accepted**. ADR-003 (Arrow vs JSON, struktur, Pyright) masih terbuka — lihat `docs/REMEDIATION-PLAN.md` P1-1. Audit penuh: `docs/AUDIT-2026-11-07-REPORT.md`.

## ADR P1 yang masih terbuka
Generator Pydantic→TS final (`datamodel-codegen`-setara vs generator kustom di `tools/`),
ORM/repo (stdlib sqlite vs SQLAlchemy Core), DDL per modul.
