# Audit Report — EDA Workbench — 2026-11-07 (Crouton Alpha)

> Dokumen ini adalah **rekam hasil audit** (bukan rencana). Rencana perbaikan ada di
> `docs/REMEDIATION-PLAN.md`. Status eksekusi ada di `docs/status-register.md`.
> **Buka dokumen ini + REMEDIATION-PLAN + status-register untuk resume sesi berikutnya.**

- Tanggal: 2026-11-07 (Asia/Jakarta)
- Baseline: `BASELINE-FREEZE-v1.0`, `AGENTS.md`, Doc 00–17, `contract_first_ui_v2` 02/03/05/08/09/10/11/12
- Metode: audit statis 3 jalur (backend, frontend, framework), gate dijalankan ulang

## 1. Gate terverifikasi

```
.venv/bin/python -m pytest -q            → 70 passed (exit 0)
.venv/bin/ruff check backend tests tools → All checks passed!
tsc --noEmit (frontend)                  → clean
python tools/generate_types.py           → git diff generated.ts kosong (tidak ada drift)
```

Klaim di `notes/Progress-Codebase.md` ("70 passed, ruff clean, tsc clean") **terverifikasi akurat**.

## 2. Skor per dimensi

| Dimensi | Skor | Penilaian 1 kalimat |
|---|---|---|
| Kontrak IPC / keamanan | 9/10 | SSOT Pydantic, 4 bridge methods, default-deny — dipatuhi penuh & teruji |
| Backend / job lifecycle | 8/10 | Backend-authoritative, immutable snapshot, thread-safe — dengan 2 celah nyata |
| Contract-first workflow | 9/10 | Per fitur ada JOB/FLOW/SCREEN/DS/QA + ratifikasi PO + Critic PASS |
| Kualitas slice UI/UX per fitur | 8/10 | Cleaning/bivariat/reporting di atas rata-rata; copy ratified, a11y dialog, stale fingerprint |
| Arsitektur aplikasi (shell) | 3/10 | Tanpa router, tanpa design tokens, tanpa Job Center, tanpa responsif 900px |

**Kesimpulan 1 baris:** fondasi kontrak dipatuhi di atas rata-rata untuk proyek solo/local; yang belum ada adalah lapisan aplikasi (navigasi, tema, observabilitas job) — bukan kualitas tiap slice.

## 3. Temuan Backend / IPC

### 3.1 Kekuatan (terbukti, bukan klaim)

1. **Single Source of Truth terbukti.** `backend/contracts.py:1-723` satu-satunya definisi; `generate_types.py` meregenerasi `generated.ts` tanpa drift. Frontend tidak pernah memanggil pywebview di luar `frontend/src/shared/ipc/ipcClient.ts` — grep 0 hit di luar file itu.
2. **Default-deny (SEC-004) benar.** Registry tertutup 18 perintah + 10 query, unknown ditolak `PERMISSION_DENIED` (`backend/ipc.py:60-91, 111-113`), diuji `tests/test_ipc_security.py:4-49`.
3. **SYS-015 benar.** `backend/execution.py:18-54` guard transisi ilegal, event durable, diuji `tests/test_jobmanager.py:9-32`.
4. **Immutable snapshot benar di sisi tulis.** Fingerprint atas bytes sumber (`application.py:142`), `save_snapshot` menolak overwrite + atomik `persistence.py:226-232`, cleaning tidak mutasi sumber (`cleaning.py:217-230`), preview/apply berbagi `_compute`.
5. **Paling matang: backup/restore & diagnostics.** WAL Backup API `backup_restore.py:89-98`, restore via staging+manifest `：140-199`, redaksi path `diagnostics.py:44-59`.

### 3.2 Kelemahan kritis

| ID | Temuan | Bukti | Dampak |
|---|---|---|---|
| K1 | `idempotency_key` hanya deklarasi, nol pemakaian | `contracts.py:62`; grep nol di luar contracts | Retry dapat duplikasi data |
| K2 | Pesan exception internal bocor ke klien | `ipc.py:269` (`f"internal error: {exc}"`) | Melanggar ES-13.2; bocor path/pesan SQLite |
| K3 | Klaim "Arrow IPC (M2+)" tidak terwujud; semua JSON | `ipc.py:270-271`, `contracts.py:167-172` | Prinsip dipatuhi via cap (preview ≤200, scatter ≤2000, bin ≤30) tapi bukan Arrow; belum ADR |
| K4 | `seq` event job in-memory, tidak di-seed dari DB | `execution.py` vs `persistence.py:295-300` | Duplikat/tidak monotonik antar restart |
| K5 | Snapshot tidak diverifikasi fingerprint saat read | `persistence.py:270-271` | File rusak di disk diam-diam dipakai analisis |
| K6 | Generator bisa melewatkan model baru diam-diam | `tools/generate_types.py:16-43` whitelist | Drift kontrak tanpa gate FE-011 |
| K7 | Otorisasi = "tahu ID"; `source_path`/`dest_path` arbitrer | `application.py:130-133` | Wajar desktop lokal, tapi harus dinyatakan sebagai asumsi ancaman |
| K8 | Ketegangan versi py311/3.12 vs venv 3.9 | `pyproject.toml`, `application.py:13` | Portabilitas; shim menyebar |

## 4. Temuan Frontend / UI-UX

### 4.1 Kekuatan per fitur

- **Cleaning (terbaik, hampir 1:1 kontrak):** radio group native, eligibility F2, validasi inline copy ratified, dialog `alertdialog` + focus trap + Escape + second checkbox bila `affected_pct>50`, `maxHeight: calc(100vh-64px)` untuk 900px.
- **Bivariat:** 3 mode sesuai B1/B2/B3, badge teks bukan warna, footnote kausalitas, tabel fallback.
- **Reporting/PDF/Histogram:** stale banner, badge draft/final, copy literal, chart aria-label + tabel.
- **Mutation-driven feedback** konsisten di semua section — mencegah status palsu.

### 4.2 Kegagalan struktural (lapisan aplikasi)

| ID | Kegagalan | Bukti |
|---|---|---|
| U1 | Tanpa satu pun file CSS; class token tanpa stylesheet | `find *.css` kosong di `frontend/src`; inline `padding:24`/`borderRadius:8` tersebar — melanggar DS-CORE-001 |
| U2 | Tanpa router/shell navigasi | `main.tsx:9-13` hanya `<ProjectPage/>`; grep `BrowserRouter` kosong; `zustand` dependency mati; 491-baris god-component |
| U3 | `getEvents` tidak pernah dikonsumsi | Diekspos `ipcClient.ts:326-328`, nol consumer; tanpa Job Center/progress/cancel |
| U4 | Tanpa media query | Grep `@media` nol; mockup punya `@media(max-width:900px)` |
| U5 | Manual path typing | `ProjectPage.tsx:131-157`; tanpa file dialog / validasi frontend / konfirmasi destruktif |
| U6 | Query awal tanpa loading/error UI | `ProjectPage.tsx:28-77`; blank saat bridge belum siap |
| U7 | `QueryClient` polos & a11y aplikasi lemah | `main.tsx:6` tanpa `staleTime/retry`; tanpa skip link/focus-visible; kontras tak teraudit |
| U8 | `features/pdf/` kosong, inkonsistensi penamaan | PDF ada di `features/reporting/PdfSection.tsx` |

## 5. Temuan Framework / Proses

### 5.1 Dipatuhi

- Pipeline per fitur JOB→FLOW→SCREEN→DS→QA, ratifikasi PO eksplisit, Critic PASS (`QA-BIVAR-002`, `QA-REPORT-001/002`, `QA-PDF-001`, `02-critic-rerun.md`).
- Template Doc03 dipakai (failure_cost, not_in_scope, 8 states, G1–G6).
- Screenshot 900/1440 untuk bivariat (6), cleaning (12), reporting (4).

### 5.2 Belum formal penuh / drift

1. Tidak ada `APP-ARCH-001.yaml` (tailoring sah tapi tak ditandai "already decided").
2. Tanpa automation visual/a11y (hanya PNG manual; belum Playwright/axe/pixel-diff).
3. Tanpa register status artifact (Doc12 §Versioning).
4. `mockup-layout.html` & `Current-UI_UX.md` untracked.
5. CI `.github/workflows/ci.yml` siap tapi **tidak pernah observed** — tanpa git remote, cross-platform P0 belum tertutup.
6. Pyright strict (Freeze E) tidak dipasang; struktur six-layer ES-5.1 deviasi (flat modules); Doc16/17 masih Draft; `final-roadmap.md` + `README-M1.md` stale.

## 6. Roadmap per fase

| Milestone | Status |
|---|---|
| M1 Technical Foundation | ✅ Complete |
| M2 Core EDA | ✅ Complete |
| M3 MVP RC | ⚠️ Code-complete, belum Beta-ready (P0: remote+CI, packaging/signing, beta validation) |

Doc16 §4.3: "M3 tidak otomatis Beta" — sudah benar ditandai di Progress-Codebase.

## 7. Vonis

Workflow benar pada level kontrak dan jujur pada keterbatasan. Kelemahan bukan bug, melainkan belum adanya application shell + 3 utang kontrak kecil terukur (idempotency, error leak, Arrow). Rencana perbaikan: `docs/REMEDIATION-PLAN.md`.
