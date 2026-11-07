# Status Roadmap Implementasi — EDA Workbench — 2026-11-07 (Audit, tanpa implementasi)

> **Sifat dokumen:** audit + perencanaan di HEAD `4d5529e` (remediasi P0-1 s/d P4-5 selesai, sudah push ke `origin/main`).
> Sesi ini **tidak mengubah kode**; satu-satunya berkas yang ditulis adalah dokumen ini (belum di-commit).
> Acuan: `docs/16 — Implementation Roadmap & Delivery Strategy v0.2.md` §3 (Phase 1–6) & §4.1 (M1–M3), `AGENTS.md`,
> `docs/ADR-003.md`, `docs/status-register.md`, `docs/REMEDIATION-PLAN.md` (format kartu).

## 1. Ringkasan eksekutif

- **M1 (Technical Foundation) ✅ done**, **M2 (Core EDA) ⚠️ sebagian besar done** (inti jalan; sisa: chart-spec persistence + rekomendasi visualisasi + Analysis Plan/DAG), **M3 (MVP Release Candidate) ⚠️ code-complete, belum beta** (satu-satunya item checklist tersisa adalah packaging + signing manual pemilik, P4-4 ditunda non-blocking).
- Remediasi P0–P4 selesai: 179 test hijau (klaim register P4-5), backlog kartu remediasi hanya menyisakan **P4-4 (todo, ditunda — kredensial signing belum ada)**.
- Kandidat kartu berikutnya yang dievaluasi: Arrow IPC (**trigger ADR-003 belum terpenuhi — jangan mulai**), Pyright staged strict M4 (layak, tapi higenis), Phase 4 Intelligent EDA (gap produk terbesar, tetapi bergantung pada penutupan sisa M2), Phase 5 (di luar MVP — jangan mulai), Phase 6 lanjutan (update management / project export belum ada).
- **Kartu berikutnya yang diusulkan: penutupan sisa M2/Phase 3 — Chart Specification Persistence** (lihat §5). Alasan urutan: ini satu-satunya deliverable Phase 3 yang belum ada implementasinya sama sekali, menjadi fondasi artefak deterministik yang dituntut exit criteria Phase 4, dan berbentuk vertical slice 1 kartu.

## 2. Inventaris implementasi saat ini (bukti file nyata)

### Backend (`backend/`, flat modules sesuai ADR-003 Decision 2)

| Modul | Peran | Bukti |
|---|---|---|
| `ipc.py` | Bridge 4 metode, default-deny | `_COMMANDS` 20 perintah, `_QUERIES` 10 query (`ipc.py:65-96`) |
| `contracts.py` | Kontrak Pydantic / SSOT IPC | `PROTOCOL_VERSION 1.0.0`, cap preview `le=200` (:118), `_BIVAR_SAMPLE_MAX=2000` (:288) |
| `application.py` | Orkestrator WorkbenchService | seluruh handler command/query |
| `execution.py` | JobManager lifecycle durable | `JobManager`, event seq dari DB (P1-2) |
| `persistence.py` | Repository SQLite satu-satunya | tabel projects/datasets/snapshots/profiles/findings/hypotheses/idempotency |
| `ingestion.py` | CSV/XLSX/Parquet → Parquet snapshot | `SUPPORTED_SUFFIXES = {.csv,.xlsx,.parquet}` (:17), PyArrow internal |
| `profiling.py`, `quality.py`, `histograms.py`, `bivariate.py`, `cleaning.py` | Fitur Core EDA | Pearson+Spearman (`bivariate.py:153-159`), bin ≤30 (`histograms.py:22`), scatter ≤2000 (`bivariate.py:24,155`) |
| `reporting.py`, `pdf_renderer.py` | HTML/PDF report | `render_html`, `render_pdf` (reportlab + fallback stdlib) |
| `backup_restore.py`, `diagnostics.py` | Backup ZIP, bundle diagnostik ter-redaksi | `create_backup`, `create_diagnostic_bundle` |

Perintah terdaftar (`backend/ipc.py:65-85`): `project.create`, `dataset.import`, `dataset.profile.run`, `dataset.histogram.run`, `dataset.quality.run`, `dataset.bivariate.run`, `dataset.report.generate`, `dataset.pdf.generate`, `dataset.cleaning.run`, `dataset.snapshot.activate`, `project.backup.create`, `project.diagnostic.create`, `project.restore`, `dataset.export`, `insight.finding.create/transition`, `insight.hypothesis.create/transition`, `dialog.pick_file`.
Query (`ipc.py:86-96`): `project.open`, `dataset.preview`, `dataset.profile`, `dataset.profile.get`, `dataset.profiles.list`, `dataset.snapshots.list`, `dataset.provenance`, `insight.findings.list`, `insight.hypotheses.list`, `dataset.cleaning.preview`.

### Frontend (`frontend/src/`)

- Shell + router state-based 7 route (`frontend/src/app/router.tsx`): Setup, Dataset, Profiling, Quality, Bivariat, Cleaning, Report. `App.tsx` shell grid 210/1fr/240 + handshake `protocol_revision` fail-closed; `ProjectContext.tsx`; `JobClient.ts` polling `getEvents` 1 detik.
- Fitur: `features/{project,bivariate,cleaning,histogram,pdf,profiling,quality,reporting}`; `shared/{ipc,job,ui,tokens.css,tokens.ts}`.
- Insight UI (finding/hypothesis lifecycle) ada di `features/profiling/ProfilingPage.tsx:86-104`.
- Playwright a11y + visual di `frontend/tests/` (27 test, job CI `a11y`).

### Tests, desktop, tools

- `tests/`: 26 file, 114 fungsi `test_` — melampaui klaim register "179 passed" (jumlah ini mencakup parametrize; keduanya konsisten dengan gate hijau terakhir P4-5). File kunci: `test_m1_slice.py`, `test_m2_{profiling,histogram,quality,bivariate}.py`, `test_m3_{report,pdf,backup_restore,export,insight,diagnostic,provenance,cleaning}.py`, `test_contracts_roundtrip.py`, `test_benchmark.py`, `test_p4_2_path_hardening.py`, `test_p4_5_error_sanitize.py`.
- `desktop/main.py`: PyWebView host 4 metode (`js_api=bridge`); `desktop/eda-workbench.spec` PyInstaller per-OS (P3-1).
- `tools/`: `generate_types.py` (fail-loud P0-2c), `benchmark.py` (performance envelope M3), `build_packaging.py`, `generate_{frontend_}sbom.py`.
- CI: `.github/workflows/ci.yml` matrix 3 OS × py311/312 + job a11y; run hijau observed `42321701878` (SHA `166dd18`), bukti di `docs/cross-platform-evidence.md`.

## 3. Status per Phase 1–6 (Doc16 §3) dan Milestone M1–M3 (§4.1)

| Fase/Milestone | Status | Bukti | Gap terhadap exit criteria |
|---|---|---|---|
| **Phase 1 — Desktop Foundation** | ✅ done | `desktop/main.py` (PyWebView, 4 metode), bridge typed `ipc.py`, kontrak `contracts.py` + generator fail-loud, CI 3 OS hijau observed | Kecil: lifecycle startup/shutdown belum eksplisit di `desktop/main.py` (hanya `create_window`+`start`); tidak memblokir fase berikutnya. |
| **Phase 2 — Data Foundation** | ✅ done (dengan catatan) | `project.create/open`, import CSV/XLSX/Parquet (`ingestion.py:17`), SQLite `persistence.py`, Parquet snapshot, fingerprint SHA-256, backup/restore `backup_restore.py`, test `test_m1_slice.py`, `test_m1_next_adapters.py`, `test_m3_backup_restore.py` | **DuckDB integration: belum ada** (grep `duckdb` di `backend/` = nol; hanya disebut di Doc16). Large-dataset handling = in-memory Parquet + cap payload, belum pushdown/streaming (sesuai ADR-003). External Reference vs Managed Import: hanya Managed Import yang terimplementasi. |
| **Phase 3 — Core EDA** (= M2) | ⚠️ sebagian besar done | Profiling (`profiling.py`), quality (`quality.py`), cleaning non-destruktif + preview + snapshot immutable (`cleaning.py`), univariate histogram (`histograms.py`), bivariate Pearson/Spearman + scatter/heatmap (`bivariate.py`), ECharts (`HistogramChart.tsx`, `BivariateChart.tsx`), provenance (`dataset.provenance`, SEC-012), test `test_m2_*.py` | **Belum ada sama sekali:** (a) *Chart specification persistence* — grep `chart` di `contracts.py` hanya mode report; tidak ada tabel/perintah menyimpan spec visualisasi; (b) *Visualization recommendations*; (c) *Analysis Plan generation/approval + DAG execution* — `execution.py` hanya JobManager sekuensial per-perintah, tanpa plan/DAG. Statistik lanjutan (CI/effect size) juga belum ada — bivariate hanya r + rho. |
| **Phase 4 — Intelligent EDA** | ⚠️ fondasi saja | Finding/Hypothesis CRUD + state machine (`application.py:1066-1154`, `persistence.py:93-112`), UI lifecycle (`ProfilingPage.tsx:86-104`), staleness detection parsial di reporting (`application.py:476-655` banding fingerprint) | **Belum ada:** context-aware recommendations, anomaly detection, pattern discovery, segmentation, modeling readiness assessment, artifact dependency invalidation umum (stale hanya untuk section report/cleaning), Guided/Advanced workflows. Catatan Doc16: fase ini bukan mandatory MVP bila di luar baseline P0 — tetapi kini kandidat post-M3 utama. |
| **Phase 5 — AI & Extensibility** | ❌ belum (sengaja) | Grep `llm/openai/anthropic/plugin` di `backend/`+`frontend/src` = nol di luar `ingestion.py` (false positive openpyxl) | Seluruh scope (AI provider abstraction, plugin manifest/registry/SDK, isolasi) belum ada. Doc16: AI & marketplace di luar MVP baseline — **jangan mulai sebelum Phase 4 stabil dan ada demand terdokumentasi**. |
| **Phase 6 — Reporting & Release** | ⚠️ sebagian besar done | HTML report (`reporting.py`), PDF (`pdf_renderer.py`), dataset export CSV/Parquet (`dataset.export`, `test_m3_export.py`), packaging PyInstaller (`eda-workbench.spec`, `tools/build_packaging.py`), SBOM (`tools/generate_sbom.py`), compatibility manifest (`cross-platform-evidence.md`), runbook (`operational-runbook.md`), benchmark envelope (`tools/benchmark.py`) | **Belum ada:** code signing/notarisasi (P4-4 `todo` ditunda — butuh kredensial pemilik, bukan kode), update management, crash recovery eksplisit (job `INTERRUPTED` tersedia di kontrak tetapi tidak ada recovery flow teruji khusus), portable *project* export (yang ada = backup ZIP + dataset export terpisah). Report Builder hanya report 3 mode via `RunReportPayload`, bukan builder visual. |
| **M1 — Technical Foundation** | ✅ done | Seluruh outcome §4.1 (desktop jalan, project dibuat, CSV/XLSX/Parquet diimpor, dataset disimpan, dibuka kembali, preview ≤200) terpenuhi + test M1 | — |
| **M2 — Core EDA** | ⚠️ sebagian besar done | Profiling, quality, cleaning dasar, univariate, bivariate, ECharts, execution/artifact foundation — semua jalan e2e | Sisa sama dengan Phase 3: chart-spec persistence, rekomendasi visualisasi, Analysis Plan/DAG. M2 belum dapat dinyatakan 100% sebelum ketiganya ditutup. |
| **M3 — MVP Release Candidate** | ⚠️ code-complete, belum beta | Provenance, HTML reporting, backup/restore, reliability hardening (P1-2, P4-2, P4-5), security validation (default-deny, sanitasi error), cross-platform evidence (CI 3 OS), performance envelope (`test_benchmark.py`), operational docs (runbook, checklist) | Satu item checklist tersisa: packaging + signing installer (manual pemilik, P4-4). M3 ≠ Beta (Doc16 §4.1): beta validation script sudah ada (`docs/beta-validation-script.md`) tetapi eksekusi beta butuh build bertanda tangan pemilik. |

## 4. Daftar celah (gap) terurut prioritas

| # | Gap | Fase | Mengapa prioritas ini | Pemicu/dependensi |
|---|---|---|---|---|
| G1 | **Chart specification persistence** (+ rekomendasi visualisasi sederhana) | Phase 3 / M2 | Satu-satunya deliverable Phase 3 tanpa implementasi sama sekali; exit criterion "membuat dan menyimpan visualizations" belum terpenuhi; menjadi artefak deterministik untuk klaim statistik Phase 4 | Tidak ada — dapat dimulai sekarang |
| G2 | **Analysis Plan + DAG execution** (plan dari pilihan analisis → approval → eksekusi berurutan dengan artefak) | Phase 3 / M2 | Scope Phase 3 "Execution" belum terpenuhi; JobManager saat ini per-perintah tanpa rencana | Membutuhkan G1 sebagai artefak plan |
| G3 | **Phase 4 slice pertama: anomaly + modeling-readiness assessment** (deterministik, berbasis artefak profil/quality yang ada) | Phase 4 | Gap produk terbesar setelah M3; exit Phase 4 menuntut klaim statistik dari artefak deterministik — tanpa G1/G2 fondasinya lemah | G1 selesai; bukan mandatory MVP (Doc16) |
| G4 | **Pyright staged strict (M4)** — mulai `contracts.py` (pydantic-only), lalu boundary `ipc.py` | M4 / utang | Trigger ADR-003 (b) terpenuhi secara teknis; baseline terukur (strict 1.288 error, basic 80 error — 74 di dispatch `ipc.py`); nilai higenis nyata, risiko runtime nol | Tidak ada — dapat paralel kapan saja; lakukan setelah G1 agar tidak berebut diff `ipc.py`/`contracts.py` |
| G5 | **Arrow IPC** | Phase 2/M2+ | **Trigger ADR-003 belum terpenuhi**: tidak ada bukti payload agregat >100 KB (benchmark tidak mengukur ukuran payload; cap 200/2000/30 masih menahan semua jalur). Memulai sekarang melanggar keputusan cost/benefit ADR-003 | Ukur dulu ukuran payload per query (kartu kecil); Arrow hanya bila >100 KB / scatter >2000 / data tabular mentah baru |
| G6 | **Phase 6 lanjutan:** update management, crash-recovery flow teruji, portable project export | Phase 6 | Dibutuhkan untuk Stable, bukan untuk Beta; sebagian bersifat desain produk (kanal update) | Keputusan produk + signing (P4-4) |
| G7 | **Signing/notarisasi (P4-4)** | Phase 6 | Satu-satunya blocker Beta, tetapi **non-blocking dan butuh kredensial pemilik** — bukan pekerjaan kode agent | Kredensial pemilik |
| G8 | DuckDB / large-dataset pushdown; Phase 5 AI & plugin | Phase 2 / Phase 5 | Belum ada demand terukur; Doc16 menempatkan AI di luar MVP; DuckDB hanya relevan bila dataset besar terbukti lambat via benchmark | Bukti performa dari `tools/benchmark.py` pada tier Large |

## 5. Kartu implementasi berikutnya yang diusulkan

### NXT-1 — Chart Specification Persistence (penutupan sisa M2 / Phase 3)

- **Mengapa:** menutup gap G1 — deliverable Phase 3 "membuat dan menyimpan visualizations" yang belum ada implementasinya sama sekali; tanpa artefak chart yang tersimpan, exit criteria M2/Phase 3 tidak terpenuhi dan Phase 4 tidak memiliki artefak deterministik untuk klaim statistik.
- **Berkas:**
  - `backend/contracts.py` — payload/record baru: `SaveChartSpecPayload {project_id, dataset_id, snapshot_id, chart_type, column_a, column_b?, config}`, `ListChartSpecsPayload`, `ChartSpecRecord {chart_id, snapshot_id, fingerprint, chart_type, columns, config, created_at}`.
  - `backend/persistence.py` — tabel `chart_specs` + `save_chart_spec/list_chart_specs` (pola `save_finding`).
  - `backend/application.py` — `save_chart_spec` (validasi snapshot milik dataset + fingerprint cocok, tolak bila stale) dan `list_chart_specs`.
  - `backend/ipc.py` — daftarkan `chart.spec.save` (command) + `chart.specs.list` (query); `tools/generate_types.py` MODELS + regen `frontend/src/shared/ipc/generated.ts` (kait P0-2c fail-loud).
  - `frontend/src/features/bivariate/BivariatePage.tsx` + `frontend/src/features/histogram/HistogramChart.tsx` — tombol "Simpan chart" yang mengirim spec chart yang sedang ditampilkan; daftar chart tersimpan per dataset.
  - `tests/test_chart_spec.py` (baru).
- **Langkah:**
  1. Tambah model kontrak di `contracts.py`; tambah tabel + repository di `persistence.py` (tirukan pola `findings`).
  2. Implementasi service di `application.py`: verifikasi `snapshot_id` milik `dataset_id`, bandingkan fingerprint (reuse pola stale `application.py:476`), simpan spec sebagai artefak; list mengembalikan spec + status stale per spec.
  3. Daftarkan command/query di `ipc.py`, tambah ke MODELS generator, regen TS, verifikasi diff generator kosong pada run kedua.
  4. Frontend: tombol simpan di halaman chart + daftar spec tersimpan (read-only list + banner stale bila fingerprint berubah) — tanpa perubahan visual chart yang ada.
  5. Test: save→list round-trip; spec pada snapshot basi ditandai stale; fingerprint mismatch saat save ditolak `CONFLICT`; command tak-terdaftar tetap `PERMISSION_DENIED`.
- **Kriteria diterima:**
  - User dapat menyimpan chart dari halaman histogram/bivariate dan melihatnya kembali pada dataset yang sama setelah reopen project.
  - Spec yang snapshot-nya berubah ditandai stale, bukan diam-diam basi.
  - `grep -n "chart.spec" backend/ipc.py` ≥ 2 (command+query); generator diff kosong; tidak ada whole-DataFrame JSON (payload hanya spec kecil — patuh ADR-003).
- **Gate:** `.venv/bin/python -m pytest -q` (termasuk `tests/test_chart_spec.py` baru) · `.venv/bin/ruff check backend tests` · `tsc --noEmit` (frontend) · `python tools/generate_types.py && git diff --exit-code -- frontend/src/shared/ipc/generated.ts`.
- **Estimasi:** 4–6 jam kerja fokus (1 kartu, sesuai target granularitas Doc16 §7: 1–5 hari kerja).
- **Dependensi:** tidak ada (P4-5 selesai). Setelah NXT-1 `done`: urutan lanjut G2 (Analysis Plan/DAG) → G3 (Phase 4 anomaly + modeling readiness) → G4 (Pyright staged). Arrow IPC (G5) tetap ditunda sampai trigger ADR-003 terukur.

## 6. Cara resume untuk fresh session berikutnya

1. Baca dokumen ini (§3–§5), `docs/status-register.md`, dan `docs/REMEDIATION-PLAN.md` §10 (gate).
2. Tambah baris NXT-1 ke `docs/status-register.md` dengan status `in_progress`, kerjakan, jalankan gate §10, lalu tandai `done` + bukti (jumlah test, run/URL bila ada).
3. Jangan mulai kartu kedua sebelum NXT-1 `done`; jangan mulai Arrow IPC sebelum trigger ADR-003 terukur; jangan mulai Phase 5.
