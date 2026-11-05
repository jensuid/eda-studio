# QA-QUAL-001 — Critic Visual QA (SCREEN-QUAL-001 / DS-QUAL-001)

## Scope
- Screenshot evidence (PO-supplied desktop, 2026-11-05): `G6-900px.png`,
  `G6-1440px.png` — Quality Check section, snapshot bersih (10 findings OK).
- Gates at cut: pytest 31 passed, ruff clean, tsc clean, vite build OK.

## Findings (Critic)

| # | Check | Result |
|---|-------|--------|
| 1 | Copy literal: summary "0 Masalah, 0 Perlu perhatian, 10 OK · fingerprint … · 5 baris" | **PASS** |
| 2 | Clean line literal: "Tidak ditemukan masalah kualitas pada snapshot ini." | **PASS** |
| 3 | Evidence selalu berpasangan (count + % + detail) di setiap baris | **PASS** — 10/10 baris |
| 4 | Severity bukan color-only ("OK" teks; badge styling lihat O1) | **PASS** |
| 5 | Rule yang dilewati tetap tampil + penjelasan ("region outliers — dilewati: kolom non-numerik") | **PASS** (partial, bukan error) |
| 6 | Layout 900px/1440px: tabel tidak memicu horizontal page scroll | **PASS** (scroll di dalam pane, `overflowX:auto`) |
| 7 | Tidak ada kolom terpotong di kedua lebar | **PASS** |

## Observations (non-blocking, polish M3)

- **O1** — Tabel findings masih default browser: header `th` center vs sel
  kiri, tanpa garis pemisah baris, severity teks polos (belum badge
  DS-CORE `status-ok`). Rekomendasi: badge + row separator bertoken di
  polish visual M3; label teks dipertahankan (bukan color-only).
- **O2** — `evidence_detail` format angka `.4g` ("IQR 2–4, pagar -1–7")
  terse/kasar. Rekomendasi: format yang lebih ramah di iterasi berikut.
- **O3** — Section Profiling history/snapshots tidak ada di screenshot
  awal. **CLOSED** oleh QA-PROF-003 (`history-snapshots.png`, PASS).

## State coverage note
Screenshot hanya membuktikan state **done/clean** (snapshot bersih).
State loading/error/stale/empty-first-run terverifikasi via kode
(mutation-driven, copy literal di `ProjectPage.tsx`) + tests, bukan screenshot.

## Verdict
**G6 visual PASS** untuk slice quality (O1/O2 deferred polish; O3 CLOSED
via QA-PROF-003). M2 QA utang bersih — M3 boleh dimulai.
