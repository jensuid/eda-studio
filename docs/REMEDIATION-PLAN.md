# Rencana Perbaikan — EDA Workbench — 2026-11-07 (Crouton Alpha)

> **Cara resume (wajib dibaca setiap sesi):**
> 1. Baca `docs/AUDIT-2026-11-07-REPORT.md` (konteks temuan K1–K8, U1–U8).
> 2. Baca `docs/status-register.md` (status tiap tugas — hanya ubah di sana).
> 3. Ambil **tugas pertama dengan status `todo`/`in_progress`** dari daftar prioritas di bawah.
> 4. Kerjakan — sebelum selesai, jalankan gate §10; lalu update status-register.
> 5. Jangan mulai fitur baru sebelum P0 1–3 selesai.

Setiap tugas ditulis sebagai **kartu actionable**: tujuan, berkas, langkah kode konkret, kriteria diterima, gate, estimasi, dependensi. Estimasi dalam jam kerja fokus.

---

## Ringkasan prioritas & peta dependensi

```
P0-1 remote+CI ──► P0-3 docs sync ──► P1-1 ADR ──► P1-2 seq/verify ──► P1-3 generator test
P0-2 K2+K1 (kode) ─┘        │
                              ├─► P1-4 Pyright (opsional, ADR)
                              └─► P2-1 tokens.css ──► P2-2 shell+router+job client ──► P2-3 file dialog
                                                              └─► P2-4 responsif ──► P2-5 a11y test ──► Beta
```

| ID | Prioritas | Judul | Estimasi | Dependen |
|---|---|---|---|---|
| P0-1 | P0 | Git remote + push → CI observed | 0.5 h + waktu tunggu CI | — |
| P0-2 | P0 | Fix K2 (error leak) + K1 (idempotency) + K6 (generator fail-loud) | 3–4 h | — |
| P0-3 | P0 | Sinkronkan dokumen basi + status register + untracked | 1 h | — |
| P1-1 | P1 | ADR-003: Arrow vs JSON + deviasi struktur + Pyright | 1 h | P0-3 |
| P1-2 | P1 | Seq durable (K4) + verify-on-read fingerprint (K5) | 3 h | — |
| P1-3 | P1 | Round-trip generator test + coverage baseline | 2 h | P0-2 |
| P1-4 | P1 | Pyright strict (atau ADR tunda) | 2–4 h | P1-1 |
| P2-1 | P2 | Design tokens terpusat (`tokens.css`) | 3–4 h | P0-3 |
| P2-2 | P2 | Application shell + router + Job Client + Toast/ErrorBoundary | 12–16 h | P2-1 |
| P2-3 | P2 | File dialog native + validasi path + konfirmasi destruktif | 3–4 h | P2-2 |
| P2-4 | P2 | Responsif 900/1440 + chart resize | 3 h | P2-1 |
| P2-5 | P2 | A11y & visual automation (Playwright/axe/pixel-diff) | 4–6 h | P2-2, P2-4 |
| P3-1 | P3 (Beta) | Packaging/signing + beta validation script | manual + 3 h | P0-1, P2-5 |

---

## P0 — Wajib sebelum apa pun

### P0-1 — Git remote + push → CI observed
- **Mengapa:** satu-satunya blocker P0 cross-platform (Doc16 §4.3 exit criteria M3). Tanpa remote, `gh run` tidak bisa observed.
- **Langkah:**
  1. `git remote add origin <URL>` (atau `git remote -v` bila sudah ada; alias `origin`).
  2. `git push -u origin <branch>` (CI matrix 3 OS × py311/312 terdaftar di `.github/workflows/ci.yml`).
  3. Tunggu run hijau → salin run URL + SHA ke `docs/cross-platform-evidence.md` (isi bagian Windows/Linux "Needs CI run").
  4. Perbaiki 2 cacat CI yang dicatat audit: `pnpm/action-setup@v4` tanpa `version`, SBOM hanya backend — tambahkan `version: 9` dan job SBOM frontend bila CI merah.
- **Kriteria diterima:** `docs/cross-platform-evidence.md` berisi run URL + 3 OS observed; status-register P0-1 = `done`.
- **Gate:** CI hijau 3 OS; pytest/ ruff hijau di CI.

### P0-2 — Fix K2 (error leak) + K1 (idempotency) + K6 (generator fail-loud)

#### P0-2a — K2: jangan bocorkan exception internal
- **Berkas:** `backend/ipc.py` (`execute_command:220-221`, `execute_query:268-269`), tambah `logging`.
- **Langkah:**
  1. Tambahkan `import logging; log = logging.getLogger(__name__)` di atas `backend/ipc.py`.
  2. Ganti `f"internal error: {exc}"` → pesan generik `"internal error"` di kedua jalur; `log.exception(...)` server-side dengan `correlation_id`.
  3. Bungkus koersi `Request(**request)` (baris 110, 226) dalam `try/except` → envelope `VALIDATION_ERROR` pesan generik bila malformed total.
  4. Tambahkan test `tests/test_ipc_security.py`: mock service melempar `RuntimeError("sqlite disk path /secret/...")` → assert respons `code==INTERNAL_ERROR` dan `"secret" not in message`.
- **Kriteria diterima:** grep `internal error: {exc}` nol; test baru hijau; tidak ada detail path di respons.

#### P0-2b — K1: eksekusi `idempotency_key`
- **Berkas:** `backend/ipc.py` (`execute_command` pre-dispatch), `backend/persistence.py` (tabel idempotency), `backend/contracts.py` (tidak perlu ubah — field sudah ada `:62`).
- **Langkah:**
  1. `Store.__init__`: buat tabel `idempotency(key TEXT PRIMARY KEY, command TEXT NOT NULL, result_json TEXT NOT NULL, created_at TEXT NOT NULL)` bila belum ada.
  2. Di `execute_command`, **sebelum dispatch**: bila `req.idempotency_key` → `SELECT result_json WHERE key=? AND command=?`; bila ada, kembalikan respons tersimpan (dedup, tanpa menjalankan ulang).
  3. Setelah dispatch sukses → `INSERT INTO idempotency(...) ON CONFLICT DO NOTHING` + `Response` sukses.
  4. Test: kirim `project.create` 2× dengan key sama → project hanya 1 dibuat; respons kedua identik (dedup).
  5. Catat: query tidak pakai idempotency (read-only).
- **Kriteria diterima:** test dedup hijau; grep pemakaian `idempotency_key` di `backend/` ≥ 2 titik di luar contracts.

#### P0-2c — K6: generator fail-loud
- **Berkas:** `tools/generate_types.py`.
- **Langkah:**
  1. Setelah daftar `MODELS`, introspeksi semua `BaseModel` publik di `contracts` (`inspect.getmembers(contracts, ...)`); model publik tak-terdaftar → `raise SystemExit(f"Unregistered contract models: {...}")`, kecuali daftar `OMIT_OK` eksplisit di atas file.
  2. Jalankan `python tools/generate_types.py` → sebanding diff; tidak berubah (bukti tidak ada model terlewat).
- **Kriteria diterima:** generator gagal keras bila model baru lupa didaftarkan; saat ini diff kosong.

### P0-3 — Sinkronkan dokumen basi + commit artefak untracked
- **Berkas:** `notes/final-roadmap.md`, `README-M1.md`, `docs/status-register.md` (baru — lihat template §11), `notes/Current-UI_UX.md`, `docs/mockup-layout.html`.
- **Langkah:**
  1. `final-roadmap.md`: ubah "M1 ✅, M2 berikutnya — setuju mulai profiling?" → M1/M2 ✅, M3-RC code-complete, 3 P0 tersisa (remote+CI, packaging/signing, beta).
  2. `README-M1.md`: "11 test, ADR masih terbuka" → "70 test, ADR-001/002 Accepted"; rujuk `AUDIT-2026-11-07-REPORT.md`.
  3. Buat `docs/status-register.md` dari template §11; isi semua artifact ID (JOB/FLOW/SCREEN/DS/QA per fitur) + kartu P0–P3 + status.
  4. `git add docs/mockup-layout.html notes/Current-UI_UX.md docs/AUDIT-2026-11-07-REPORT.md docs/REMEDIATION-PLAN.md docs/status-register.md` + commit.
- **Kriteria diterima:** `git status` bersih untuk 5 file di atas; status-register terdaftar di README/Gate.

---

## P1 — Utang terukur (setelah P0)

### P1-1 — ADR-003: Arrow vs JSON + deviasi struktur + Pyright
- **Berkas:** `docs/ADR-003.md` (baru, format ADR-001/002: Context, Alternatives, Consequences, revisit trigger).
- **Keputusan yang direkam:**
  1. **Arrow vs JSON:** IPC tetap JSON untuk MVP dengan cap payload (preview ≤200, scatter ≤2000, bin ≤30) karena payload agregat kecil; klaim "Arrow IPC (M2+)" di AGENTS.md dinyatakan **belum diterapkan**; revisit trigger: payload agregat > 100 KB atau scatter > 2000 titik.
  2. **Struktur six-layer:** deviasi sadar ke flat modules karena arah dependensi bersih; revisit saat migrasi Arrow / plugin.
  3. **Pyright:** diputuskan di P1-4 (pasang atau tunda).
- **Kriteria diterima:** ADR-003 Accepted; `AGENTS.md` baris Arrow diperbarui dengan footnote ADR-003.

### P1-2 — Seq durable (K4) + verify-on-read fingerprint (K5)
- **Berkas:** `backend/execution.py`, `backend/persistence.py`.
- **Langkah:**
  1. K4: saat `JobManager.__init__`, seed `_seq` dari `SELECT COALESCE(MAX(seq),0) FROM job_events`; ganti counter in-memory dengan AUTOINCREMENT DB bila memungkinkan.
  2. K5: `read_snapshot` (`persistence.py:270-271`) hitung SHA-256 dan bandingkan dengan fingerprint DB; tambah flag `strict: bool = False` — strict=True → `ConflictError` bila mismatch, strict=False → log warning + lanjut (mode komptibel). Batasi: aktifkan strict untuk export/report/pdf.
  3. Test: restart JobManager → `seq` monotonik; tukar file snapshot di disk → strict mode menolak dengan `CONFLICT`, non-strict log warning.
- **Kriteria diterima:** test restart monotonik hijau; test tamper strict hijau; non-strict tidak pecahkan flow lama.

### P1-3 — Round-trip generator test + coverage baseline
- **Berkas:** `tests/test_contracts_roundtrip.py` (baru), `pyproject.toml` (`[tool.pytest.ini_options]` + coverage opsional), `.github/workflows/ci.yml`.
- **Langkah:**
  1. Test: untuk tiap model di `MODELS`, `model.model_json_schema()` → TypeScript stub non-kosong; model publik tak-terdaftar → gagal (mengikat P0-2c).
  2. Tambahkan round-trip: `Request → model_dump → Request` untuk tiap payload perintah/query; `Response` selalu satu dari `{data, error}`.
  3. Pasang coverage report (tanpa gate kaku dulu): `pytest --cov=backend --cov-report=term-missing`; catat baseline % di status-register; target awal ≥ 70% baris backend.
- **Kriteria diterima:** test round-trip hijau; coverage baseline terdokumentasi; FE-011 terpenuhi.

### P1-4 — Pyright strict (atau ADR tunda)
- **Berkas:** `pyrightconfig.json` / `[tool.pyright]` di `pyproject.toml`, `.github/workflows/ci.yml`.
- **Langkah:** instal `pyright --strict` pada `backend/`; perbaiki annotation baru (tanpa ubah runtime); tambah step CI `pyright`. Bila > 4 jam dan temuan minor, pilih alternatif sah: ADR-003 mencatat "Pyright ditunda ke M4" + tracking issue.
- **Kriteria diterima:** pyright hijau di CI, atau ADR penundaan ditandatangani.

---

## P2 — Lapisan aplikasi UI/UX (kerja besar)

### P2-1 — Design tokens terpusat (`tokens.css`)
- **Berkas baru:** `frontend/src/shared/tokens.css`; ubah semua `*.tsx` yang kini inline style; tambah `import "./tokens.css"` di `main.tsx`.
- **Isi token (semantic, bukan hex liar):**
  - `--color-surface`, `--color-surface-raised`, `--color-border-subtle`, `--color-text`, `--color-text-muted`, `--color-status-success/warning/danger`, `--color-chart-scatter-point`, `--color-chart-heat-cell`.
  - `--space-1..6` (4/8/12/16/24/32), `--radius-sm/md`, `--font-size-sm/md/lg` (11/13/15), `--duration-fast: 150ms`.
  - `@media (prefers-reduced-motion: reduce)` → durability 0.
  - Kontras teks ≥ 4.5:1, badge status selalu teks (bukan warna) — sesuai DS-CORE-001.
- **Langkah:** definisikan token; ganti `padding:24`→`var(--space-5)`, `borderRadius:8`→`var(--radius-md)`, `fontSize:11`→`var(--font-size-sm)`; ganti semua className yatim (`surface-raised`, `border-subtle`, `status-danger`, `cleaning-*`) dengan definisi nyata; hapus inline hex.
- **Kriteria diterima:** `find frontend/src -name "*.css" -delete` sebelum/baru → 1 file; grep hex liar `#[0-9a-fA-F]{3,6}` di `frontend/src` hanya di `tokens.css`; `tsc` + build hijau.

### P2-2 — Application shell + router + Job Client + Toast/ErrorBoundary
- **Berkas baru:** `frontend/src/app/App.tsx`, `frontend/src/app/router.tsx` (tanpa react-router bila ingin nol dep — state-based route), `frontend/src/shared/job/JobClient.ts`, `frontend/src/shared/ui/Toaster.tsx`, `frontend/src/shared/ui/ErrorBoundary.tsx`.
- **Langkah:**
  1. **Shell:** adopsi grid mockup `docs/mockup-layout.html` (rail 210px + panel utama + panel kanan 240px; `@media(max-width:900px)` rail→64px, panel kanan disembunyikan).
  2. **Pecah `ProjectPage.tsx` (491 baris)** menjadi feature routes: `ProjectSetup`, `DatasetExplorer`, `ProfilingPage`, `QualityPage`, `CleaningPage`, `BivariatePage`, `ReportPage` — satu fitur satu file; sisakan komposisi di `App.tsx`.
  3. **Job Client:** `setInterval` 1s → `ipcClient.getEvents(sinceSeq)`; event → invalidasi `QueryClient` terkait + update Job Center (daftar job lintas fitur, status queued/running/cancelled, progress determinate). `QueryClient` konfigurasi eksplisit: `staleTime: 3000, retry: 1, refetchOnWindowFocus: false`.
  4. **Toast & ErrorBoundary:** toaster global untuk mutation result/error; `ErrorBoundary` per-route; loading skeleton per DS-CORE-001 (jangan "spinner tanpa label").
  5. **Handshake startup:** panggil `getProtocolInfo` saat boot; tampilkan banner versi tidak cocok bila `protocol_revision` berbeda.
- **Kriteria diterima:** tidak ada `ProjectPage.tsx` god-component; tidak ada `getEvents` tak-terpakai; Job Center menampilkan job dari 2 fitur berbeda; screenshot 900/1440 terisi sesuai `screenshot-guide.md:65`.

### P2-3 — File dialog native + validasi path + konfirmasi destruktif
- **Berkas:** `backend/ipc.py` (tambah perintah `dialog.pick_file` — catat: melebihi 4 metode bridge; masuk lewat `execute_command` sebagai perintah terdaftar baru, bukan metode ke-5), `frontend/src/features/project/FilePathInput.tsx` (baru).
- **Langkah:**
  1. Backend: perintah `dialog.pick_file` → panggil PyWebView file dialog bila tersedia, fallback path string; validasi ekstensi (CSV/XLSX/Parquet untuk import; ZIP untuk restore; batas direktori project untuk dest).
  2. Frontend: `FilePathInput` (readonly text + tombol "Pilih…"); konfirmasi modal destruktif sebelum restore/backup/export dengan copy ratified; disabled submit saat pending (pola Doc10).
  3. Tambahkan `dialog.pick_file` ke `_COMMANDS` + `MODELS` + regen TS (kait P0-2c).
- **Kriteria diterima:** import/backup/restore/export tidak lagi manual-typing saja; test validasi path hijau; konfirmasi destruktif teruji.

### P2-4 — Responsif 900/1440 + chart resize
- **Berkas:** `frontend/src/shared/tokens.css`, `HistogramChart.tsx`, `BivariateChart.tsx`.
- **Langkah:** `@media` di tokens (900px); ganti `minWidth:320` inline dengan container min; pasang `ResizeObserver` → `chart.resize()` di ECharts; urutan kolom `grid-template-columns:1fr` di ≤900px; tanpa scroll horizontal pada 900px.
- **Kriteria diterima:** uji manual 900px tanpa overflow horizontal; chart ter-render ulang saat resize; screenshot 900/1440.pdf bukti.

### P2-5 — A11y & visual automation
- **Berkas:** `tests/frontend/` (Playwright), `.github/workflows/ci.yml` (job baru).
- **Langkah:** jalankan `axe-playwright` untuk tiap route (target: 0 critical); screenshot visual regression (900/1440) vs baseline PNG `docs/ux-contracts/`; skip link + landmark + heading hierarchy + `focus-visible` dipasang; fokus dipindah setelah dialog/dynamic update (penuh Doc10).
- **Kriteria diterima:** CI job a11y hijau; 0 axe critical; baseline visual tercatat.

---

## P3 — Beta-ready (manual + kode)

### P3-1 — Packaging/signing + beta validation script
1. Config PyInstaller per-OS + build host bertanda tangan (manual; tandai blocker di status-register).
2. Tulis `docs/beta-validation-script.md` (user testing end-to-end 5–7 skenario), `docs/release-notes-template.md`, `docs/bug-report-template.md`, kanal feedback.
3. Salin `cross-platform-evidence.md` final; release-checklist ditandatangani.

---

## 10. Gate wajib sebelum tugas dinyatakan selesai

```
.venv/bin/python -m pytest -q
.venv/bin/ruff check backend tests
frontend/node_modules/.bin/tsc --noEmit --project frontend/tsconfig.json
python tools/generate_types.py && git diff --exit-code -- frontend/src/shared/ipc/generated.ts
```

Satu pun merah → tugas belum `done`; perbaiki dulu.

## 11. Template status-register (resumable)

`docs/status-register.md`:

```markdown
# Status Register — EDA Workbench

Terakhir diperbarui: YYYY-MM-DD — oleh: <nama sesi>

## Artifact status (Doc12 §Versioning)
| Artifact ID | Nama | Status | Ratifikasi PO | Reviewer | Lokasi |
|---|---|---|---|---|---|
| JOB/SCREEN/DS/QA-PROF-001 | Profiling | Approved | 2026-11-05 | — | docs/ux-contracts/profiling/ |
| … | … | … | … | … | … |

## Kartu tugas
| ID | Judul | Status | Bukti gate | Catatan |
|---|---|---|---|---|
| P0-1 | Git remote + CI | todo | — | — |
| P0-2a | K2 error leak | todo | — | — |
| … | … | todo | — | — |

Status: `todo` | `in_progress` | `done` | `blocked:<alasan>`
```

**Aturan update:** sebelum mulai kartu → `in_progress`; setelah gate §10 hijau → `done` + bukti (run URL / jumlah test). Jangan hapus baris selesai.
