# Evaluasi Remediation — EDA Workbench — 2026-11-07 (evaluator independen)

- Evaluator: sesi evaluasi independen; bukan implementasi. Repo `eda-studio`, HEAD `a6937c7` (P3-1 done).
- Baseline gate §10 dijalankan ulang sesi ini (2026-11-07, macOS):
  - `.venv/bin/python -m pytest -q` → **168 passed** (exit 0)
  - `.venv/bin/ruff check backend tests` → **All checks passed**
  - `cd frontend && npx tsc --noEmit` → clean (exit 0)
  - `.venv/bin/python tools/generate_types.py` + `git diff --exit-code -- frontend/src/shared/ipc/generated.ts` → diff kosong (exit 0)
- Playwright/packaging build penuh tidak dijalankan ulang (sesuai mandat); klaim P2-5/P3-1 dicatat apa adanya.
- Dokumen dibaca: `docs/REMEDIATION-PLAN.md` (seluruhnya), `docs/status-register.md`, `docs/ADR-003.md`, `docs/AUDIT-2026-11-07-REPORT.md` §3–§5, `docs/cross-platform-evidence.md`, `docs/release-checklist.md`, `pyproject.toml`, `.github/workflows/ci.yml`, `git log --oneline` (urutan commit P0-1→P3-1 sesuai urutan rencana).

## Ringkasan eksekutif

Plan **tuntas sesuai jadwal kartu**: semua 15 kartu P0-1 s/d P3-1 berstatus done + ter-commit (`2e7d4c1` P0-2/0-3 → `a6937c7` P3-1). Gate lokal §10 saat ini hijau (168 passed). Tidak ada kartu yang terbukti palsu; sebagian besar klaim terverifikasi di kode. Risiko sisa terbesar: **RILIS BELUM BETA-READY** — build bertanda tangan + sign-off checklist masih manual/blocked (P3-1), dan ada utang dependency yang membuat clean install rapuh (`reportlab` dipakai tapi tidak dideklarasikan; `uv.lock` belum diregen untuk `pytest-cov`). Dua temuan audit **K7 dan K8 tidak memiliki kartu** dan belum disentuh (kecuali mitigasi parsial K7 via `validate_path_input`). Dokumenasi memiliki drift kecil (commit salah label di register, path screenshot-guide salah, `release-checklist.md` masih menulis "remote runs pending" padahal remote/CI sudah observed).

## Tabel verifikasi per kartu

| ID | Status register | Verdict evaluator | Bukti kode |
|---|---|---|---|
| P0-1 remote+CI | done, CI run 42321701878 SHA 166dd18 | Terverifikasi sebagian* | Remote `origin https://github.com/jensuid/eda-studio.git` ada; fix CI (`version:9`, SBOM frontend, `uv.lock` ter-track commit `166dd18`) terkonfirmasi di `.github/workflows/ci.yml`. *Run CI 42321701878 hanya dilaporkan pemilik (`cross-platform-evidence.md`: "dilaporkan hijau oleh pemilik"); tidak dapat diverifikasi independen sesi ini (tidak ada `gh` auth). Jangan jadikan itu satu-satunya bukti cross-platform. |
| P0-2a K2 error leak | done | Sebagian | Jalur generik benar: `backend/ipc.py` `except Exception: log.exception(...); _error(INTERNAL, "internal error")`, grep `internal error: {` = 0. **Namun** jalur `VALIDATION/NOT_FOUND/CONFLICT` masih `str(exc)` (`backend/ipc.py:160,264,266,268`) dan `command not allowed: {req.command}` (`ipc.py:156`) — pesan validasi Pydantic bisa memuat detail. Klaim "tidak ada detail path di respons" hanya terbukti untuk generic Exception. |
| P0-2b K1 idempotency | done | Terverifikasi | Tabel `idempotency` + `get_idempotent_result`/`save_idempotent_result` di `backend/persistence.py:114,256-270`, replay pre-dispatch `backend/ipc.py:162-165`, simpan pasca-sukses `ipc.py:276-277`. Test `tests/test_p0_fixes.py` ada; suite 168 passed. |
| P0-2c K6 generator fail-loud | done | Terverifikasi | `tools/generate_types.py:94-96` introspeksi model publik, `SystemExit` bila tak-terdaftar, `OMIT_OK={"Response"}`; regen diff kosong terverifikasi sesi ini. |
| P0-3 docs sync | done | Terverifikasi sebagian | `docs/status-register.md` dibuat, `notes/final-roadmap.md`/`README-M1.md` diperbarui. **Drift:** `docs/release-checklist.md` masih `- [ ] Cross-platform evidence ... remote runs pending git remote` dan `- [ ] Release compatibility documentation`, bertentangan dengan P0-1 done + evidence observed. |
| P1-1 ADR-003 | done | Terverifikasi | `docs/ADR-003.md` Accepted ada; footnote Arrow di `AGENTS.md:11-12`; cap terkonfirmasi (preview/scatter/bin). Revisit trigger terdokumentasi. |
| P1-2 seq K4 + verify K5 | done | Terverifikasi, label commit salah | K4: `backend/execution.py:36` seed dari `store.max_event_seq()` + guard anti-regresi `:45`; K5: `snapshots.file_fingerprint` + migrasi `backend/persistence.py:138-156`, `read_snapshot(strict)` `:337-362`, `ConflictError` di persistence. Test `tests/test_p1_seq_snapshot.py` ada. **Salah label:** register menulis "commit 1fb5f4d (P1-1)" — commit nyata P1-2 adalah `408a02a` (`1fb5f4d` = P1-1). |
| P1-3 round-trip + coverage | done | Terverifikasi, utang lock | `tests/test_contracts_roundtrip.py` ada; `pyproject.toml:20` `pytest-cov>=5` + CI `--cov` tanpa fail-under. **Utang tercatat & terkonfirmasi:** `grep pytest-cov uv.lock` = 0 hit — lock belum diregen (SBOM/CI pakai lock lama; CI install via pip menutupi ini). Klaim coverage 91% tidak diuji ulang sesi ini (perlu `--cov` ulang). |
| P1-4 Pyright | done ("ditunda ke M4") | Terverifikasi, sah | ADR-003 Decision 3 diamandemen: strict 1.288 error / basic 80 error; tidak ada `pyrightconfig.json`/step CI (terkonfirmasi grep nol). Alternatif sah kartu; utang M4 nyata. |
| P2-1 tokens.css | done | Terverifikasi | `frontend/src/shared/tokens.css` satu-satunya `.css` di `frontend/src`; hex hanya di tokens.css; `frontend/src/shared/tokens.ts` mirror numeric untuk ECharts; `style=`/className yatim teratasi. |
| P2-2 shell+router+JobClient | done | Terverifikasi | `frontend/src/app/App.tsx` (150 baris), `router.tsx`, `ProjectContext.tsx`, `frontend/src/shared/job/JobClient.ts`+`JobCenter.tsx`, `frontend/src/shared/ui/{Toaster,ErrorBoundary,LoadingSkeleton}.tsx`; `ProjectPage.tsx` 491 baris terhapus; `main.tsx` QueryClient eksplisit; `getEvents`/`getProtocolInfo` kini dipakai. Deviasi terdokumentasi (screenshot-guide, JobEvent tanpa progres). |
| P2-3 file dialog | done | Terverifikasi | `dialog.pick_file` terdaftar `backend/ipc.py:84,235`, `validate_path_input` `backend/application.py:115` dipakai import/backup/restore/export (`:160,791,817-818,847,881`), `frontend/src/features/project/FilePathInput.tsx` + `DestructiveConfirmDialog.tsx` ada; regen TS ter-commit; 168 passed. Catatan mandat: register P2-3 ringkas (tidak menyebut opsi Excel dihapus — terdokumentasi di baris register "deviasi: opsi Excel dihapus"), label kartu-vs-disk konsisten. |
| P2-4 responsif 900/1440 | done | Terverifikasi sebagian | `minmax(0,1fr)`, `.table-scroll`, `ResizeObserver→chart.resize()` di chart terkonfirmasi; deviasi "screenshot tidak dibuat, serahkan ke P2-5" tercatat jujur. Bukti visual 900/1440 PDF tak ada dari kartu ini (di-cover P2-5 baseline PNG). |
| P2-5 a11y/visual | done | Terverifikasi sebagian* | `frontend/tests/a11y.spec.ts`+`visual.spec.ts`, `frontend/playwright.config.ts`, `@playwright/test 1.48.2`+`@axe-core/playwright` di `frontend/package.json`, job `a11y` di CI, `frontend/tests/__screenshots__` ada. *Playwright 27 passed tidak dijalankan ulang sesi ini (mandat); toleransi `maxDiffPixelRatio: 0.15` (`visual.spec.ts:54`) lemah — dapat menutupi regresi layout. |
| P3-1 packaging/signing+beta | done | Sebagian (manual blocker terbuka) | `desktop/eda-workbench.spec`, `tools/build_packaging.py`, `docs/beta-validation-script.md` (7 skenario), `docs/release-notes-template.md`, `docs/bug-report-template.md`, `docs/release-checklist.md` sign-off blok ada. `tools/build_packaging.py --check-only` sesi ini → **BLOCKED: pyinstaller not on PATH**; tidak ada build bertanda tangan yang teramati; `docs/release-checklist.md` belum ditandatangani; `dist/` untracked. Kartu menandai ini manual pemilik — status done untuk fase kode, **belum done untuk rilis**. |

## Daftar tindak lanjut terurut prioritas

### Wajib (sebelum rilis / Beta)

1. **Deklarasikan `reportlab`** — bukti: `backend/pdf_renderer.py:24,56-57` import reportlab; `pyproject.toml:12-15` dependencies hanya `pydantic, pyarrow, openpyxl`; `grep reportlab uv.lock` = 0. Dampak: clean install/packaged build tanpa reportlab → jalur PDF/export mati. Aksi: tambah `reportlab` ke dependencies + regen `uv.lock`.
2. **Regen `uv.lock` untuk `pytest-cov`** — bukti: `pyproject.toml:20` vs `uv.lock` 0 hit; register P1-3 mencatat. Dampak: SBOM dari lock lama tidak mencerminkan dev deps; CI lolos hanya karena pip. Aksi: jalankan `uv lock` di host pemilik dan commit.
3. **Selesaikan signing/notarisasi + build bertanda tangan per OS + sign-off checklist** — bukti: `tools/build_packaging.py --check-only` BLOCKED (pyinstaller tak terinstal), `docs/release-checklist.md` sign-off kosong, `docs/cross-platform-evidence.md §P3-1 final` menyatakan blocker manual. Dampak: tidak ada artefak installer terdistribusi aman; M3 tidak Beta (Doc16 §4.3). Aksi: jalankan signed build di host pemilik per OS, catat checksum, tandatangani checklist.
4. **Tutup K7 (otorisasi="tahu ID", path arbitrer) secara eksplisit** — bukti: Audit K7; `backend/application.py:155-161` import dari `source_path` arbitrer; mitigasi parsial `validate_path_input` (P2-3) tapi tidak ada dokumen asumsi ancaman. Dampak: desktop lokal OK, tapi asumsi tidak dinyatakan → risiko salah pakai path di luar project root. Aksi: tambahkan threat-model note + batasi `source_path`/`dest_path` ke direktori yang diizinkan (atau nyatakan asumsi di Doc11).

### Sebaiknya (M4 / sprint berikutnya)

5. **Pyright bertahap dari `contracts.py`** — ADR-003 revisit trigger (b) terpenuhi sebagian; baseline 1.288 strict/80 basic. Aksi: pasang `pyrightconfig.json` mode basic + CI step, perbaiki 6 temuan non-dispatch `ipc.py`.
6. **Tutup sisa K2 (VALIDATION `str(exc)`)** — `backend/ipc.py:160,264,266,268` masih memancarkan detail Pydantic ke klien. Aksi: petakan pesan validasi ke pesan generik per field.
7. **Selaraskan versi Python (K8)** — `pyproject.toml:10` requires ≥3.11, `backend/application.py:13` shim untuk venv 3.9. Aksi: hapus shim, pin dev ke 3.11+ di host pemilik.
8. **Pantau revisit Arrow IPC** — ADR-003 trigger: payload agregat >100 KB / scatter >2000 / data tabular mentah baru. Aksi: tambah log ukuran respons IPC untuk deteksi trigger.
9. **Perbaiki path screenshot-guide + ketatkan toleransi visual** — plan merujuk `docs/screenshot-guide.md:65` (tak ada); nyata `docs/ux-contracts/screenshot-guide.md`; `visual.spec.ts:54` toleransi 15%. Aksi: perbaiki rujukan + turunkan toleransi bertahap setelah baseline stabil.
10. **Pisah bundle frontend >500 kB** — `frontend/dist/assets/index-*.js` 1,31 MB (warning pra-ada, P2-2 catat). Aksi: `manualChunks`/dynamic import untuk ECharts.

### Opsional

11. **Hapus/batasi `zustand` dependency mati** — `frontend/package.json:17`, grep `zustand` di `frontend/src` = 0. Aksi: hapus dari package.json.
12. **U8 sisa:** `frontend/src/features/pdf/` kosong (0 file) vs PDF di `features/reporting/PdfSection.tsx`. Aksi: hapus direktori kosong atau pindahkan.
13. **APP-ARCH-001.yaml + Doc16/17 Draft** — Audit §5.2.1/§5.2.6; `docs/16…:6`/`docs/17…:4` masih "Draft for Review". Aksi: tandai "already decided" atau ratifikasi.
14. **Perbaiki drift dokumen** — register P1-2 salah commit (`1fb5f4d` vs `408a02a`); `release-checklist.md` status stale; register P1-3/P2-3 ringkasan tak selevel kartu lain. Aksi: koreksi register + checklist agar konsisten dengan evidence.

## Catatan utang manual pemilik

- Signing/notarisasi macOS (`EDA_SIGN_IDENTITY`/`EDA_SIGN_THUMBPRINT`), PyInstaller build host per OS, dan tanda tangan `docs/release-checklist.md` (release owner + ≥2 tester beta) — tidak dapat diotomatiskan dari sandbox; blocker tercatat di P3-1 dan `cross-platform-evidence.md`.
- Regen `uv.lock` (`pytest-cov`, `reportlab`) di host pemilik (`uv` sandbox-restricted).
- 7 skenario `docs/beta-validation-script.md` belum dijalankan; kanal feedback GitHub Issues `beta-feedback` perlu dibuat.
- Verifikasi run CI 42321701878 dan Playwright 27 passed di lingkungan pemilik (CI hijau) sebagai bukti akhir sebelum rilis.
