# QA-REPORT-002 — Independent Critic Verdict: G5 Vertical Slice M3 HTML Reporting

**Tanggal:** 2026-11-06
**Critic:** independent re-run (subagent 9f7d68df).
**Baseline yang diverifikasi:** HEAD `d6d5eab` ("feat(M3): HTML reporting vertical slice G5"), di atas `24b7081` (Critic G1–G4 PASS).

## Verdict keseluruhan: **PASS dengan advisory (non-blocking)** untuk G5
Semua klaim builder terverifikasi dari file:baris. Screenshot UI 900/1440 belum ada — follow-up desktop, bukan blocker PASS G5 (kontrak DS `DS-REPORT-001:62` sendiri menulis bukti visual G5 = parse HTML + uji isi; tahan untuk M3 done).

| # | Item | Verdict |
|---|---|---|
| 1 | contracts.py ReportRecord/ReportSection/is_final/validation_summary/renderer_version/content_fingerprint (A1/A3) | PASS + advisory |
| 2 | reporting.py stdlib html, inline `<style>`, TANPA `<script>`, referensi artifact, stale dilabeli | PASS |
| 3 | application.run_report JobManager-wrapped, backend sole author, file di disk | PASS + advisory |
| 4 | ipc.py registered + default-deny | PASS |
| 5 | ReportSection.tsx 8 states, stale banner, draft/final badge, copy literal | PASS + advisory |
| 6 | ipcClient.runReport satu-satunya jalur IPC; mount di bawah Bivariate | PASS + advisory |
| 7 | tests/test_m3_report.py 3 test; test_ipc_security protocol list | PASS + advisory |
| 8 | Gates: pytest 49, ruff, tsc, vite build | PASS (re-run independen) |
| 9 | Token: tanpa hex literal | PASS |
| 10 | Screenshot UI report 900/1440 | TIDAK ADA — follow-up, bukan blocker |

### 1. contracts.py — PASS + advisory
`_REPORT_RENDERER_VERSION="report-html/1.0"` `:352`; ReportSection `:368-373` (required=False); ReportRecord `:376-388` (file_path/file_size_bytes/renderer_version/content_fingerprint/is_final/validation_summary); lock A1 `:342-348`, A3 `:349-351`.

### 2. reporting.py renderer — PASS
`import html` `:12`; inline `<style>` `:107-112`; grep `script` hanya komentar `:6` (tidak ada tag script/CDN); footer sumber R5 `:22-26`; label stale R6/A1 `:19,29-30` dipakai `:50,66,88,97`.

### 3. run_report — PASS + advisory
`jobs.run("dataset.report.generate", ...)` `:436`; `render_html(...)` server-side `:407-412`; write `store.root/reports/*.html` `:415-419`; `sha256(data)` `:431`; is_final=False + PARTIAL bila ada stale `:420-425`.

Advisory A2 (untuk follow-up sebelum klaim M3 done): `charts = []` selalu kosong `:406` → scope with-charts/with-visuals tidak memasukkan histogram/bivariate ringkas yang dijanjikan label radio; quality direcompute (record_id=dataset_id) bukan referensi QualityRecord persisten; cleaning masuk `cleanings_list` tapi tidak ditambah ke `sections`. Fidelity referensi-record penuh hanya untuk profile.

### 4. ipc.py — PASS
Registered `"dataset.report.generate"` `:56`, dispatch `:131-136`, deny PERMISSION_DENIED `:88-90,165-167`.

### 5. ReportSection.tsx — PASS + advisory
Stale `:34,66`; loading `:70`; empty_first_run `:39-44`; error `:71`; done `:72-82`; badge `:80` "Final."/"Draft — bukan final export."; copy literal cocok (judul `:38`, primer `:67`, loading `:70`, partial `:66`, done `:75`).

Advisory A4: stale line frontend `:64` singkat ("Usang — Jalankan ulang." vs literal kontrak penuh — literal penuh hidup di backend `reporting.py:19`); error menempel raw message; `empty_filtered` unreachable-by-design (radio selalu terpilih); tombol sekunder "Unduh" belum ada (backend menulis file sendiri sebagai artifact R7); mount di antara Bivariate dan Cleaning (deviasi urutan kecil dari SCREEN "di bawah Bivariate+Cleaning").

### 6. IPC + mount — PASS + advisory
Satu-satunya pemanggil `ipcClient.runReport` `ReportSection.tsx:30` → `ipcClient.ts:163-170` (`bridge().execute_command` 4 methods, tanpa pywebview langsung); `ProjectPage.tsx:248` Bivariate lalu `251` Report.

### 7. Tests — PASS + advisory
`test_m3_report.py` 3 test (`:24` generate, `:43` stale, `:52` payload shape); `test_ipc_security.py:38-41` list memuat `dataset.report.generate`.
Advisory A3: test stale lemah (tidak pernah membuat profile stale; hanya asserts `is_final` bool).

### 8. Gates — PASS (re-run independen)
- `.venv/bin/python -m pytest -q` → **49 passed in 2.75s**, exit 0
- `.venv/bin/ruff check backend tests` → **All checks passed!**, exit 0
- `tsc --noEmit` → exit 0
- `vite build` → **✓ built in 11.90s**, exit 0 (warning chunk-size pre-existing non-blocking)

### 9. Token — PASS
Grep hex literal di `frontend/src/features/reporting/` kosong.

### 10. Screenshot UI report 900/1440 — TIDAK ADA
Folder `reporting/` hanya 4 `.md` (tanpa `.png`). **Follow-up desktop, BUKAN blocker PASS G5** (DS `DS-REPORT-001:62`: bukti visual G5 = parse HTML + uji isi; `test_m3_report.py:34-40` menguji isi; komponen UI DOM native sederhana). Untuk **M3 done** (bukan PASS G5), screenshot 900/1440 UI report wajib ditangkap sebelum deklarasikan selesai (mengikuti preseden cleaning 12 png).

## Advisory non-blocking gabungan
- **A1:** konstanta renderer_version terduplikasi (`contracts.py:352` vs `reporting.py:17`) — satukan.
- **A2:** charts kosong + quality recompute + cleaning tidak di sections (lihat §3) — wajib diperbaiki atau klaim scope diturunkan sebelum M3 declared done.
- **A3:** test stale lemah (struktural, bukan perilaku).
- **A4:** copy/state minor (stale singkat, error raw message, empty_filtered/unduh belum ada, mount order).
- **A5:** 8 states konsisten pola slice sebelumnya (empty_filtered unreachable-by-design, restricted/long_content n/a sesuai kontrak).

## Addendum 2026-11-06 (Opsi B — putusan PO)
`loading` (transient <1 detik) dan `empty_filtered` (unreachable-by-design, radio selalu terpilih) dinyatakan **tidak wajib screenshot**; diverifikasi via mutation state + unit test + log. Screenshot wajib tersisa = state done + empty_first_run. Kontrak diperbarui di `DS-REPORT-001.md:62` dan `JOB-FLOW-SCREEN-REPORT.md` (loading + empty_filtered).
