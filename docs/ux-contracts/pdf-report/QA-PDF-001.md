# QA-PDF-001 — Independent Critic Verdict: M3 PDF Report G1–G4

**Tanggal:** 2026-11-06
**Critic:** independent re-run (subagent a59b31d9).
**Baseline yang diverifikasi:** `01-po-ratifikasi.md` Ratified (P1–P7 semua Setuju), di atas `c1b82ee`.

## Verdict keseluruhan: **PASS dengan advisory (non-blocking)** untuk G1–G4
8/8 item PASS. Builder **BOLEH lanjut** ke backend contract lock (`contracts.py` + `PdfRecord` + renderer reportlab). Advisory (a)(b)(c) wajib diputuskan *saat lock*.

| # | Item | Verdict |
|---|---|---|
| 1 | Scope vs Doc12 §11.2 REP-005 + §11.3 static chart + REP-007/008/009 | PASS |
| 2 | PDF = cermin ReportRecord (P1/P3, tanpa komputasi baru) | PASS |
| 3 | JobManager + provenance + freshness (is_final/Draft) | PASS |
| 4 | Renderer tunggal (P2) + uji PDF P5 (clipping/breaks/fonts/overflow + screenshot wajib) | PASS |
| 5 | No whole-DataFrame JSON (file di disk, payload kecil) | PASS |
| 6 | 8 states (Opsi B konsisten), keyboard, a11y, 900px | PASS |
| 7 | SEC-004 default-deny & save-cancel | PASS |
| 8 | Konsistensi SCREEN vs DS vs ratifikasi (P1–P7, copy) | PASS |

## Advisory lock
- **(a)** putuskan renderer definitif `reportlab` vs fallback + `renderer_version` berbeda per mesin (fallback = stdlib tabel-only, dijanjikan eksplisit).
- **(b)** putuskan payload `report_id` vs scope-recompute — `ReportRecord` HTML belum persist di store (`run_report` hanya return, tidak save); tambahkan `report_id` ke `PdfRecord` (sumber HTML fingerprint) agar provenance PDF–HTML tertelusur.
- **(c)** tegaskan larangan `PdfRecord` membawa PDF bytes (hanya `file_path` + `pdf_fingerprint`) + tabel pagination/chart static di fallback.
