# QA-REPORT-001 — Independent Critic Verdict: M3 HTML Reporting G1–G4

**Tanggal:** 2026-11-06
**Critic:** independent re-run (subagent 4a04b4ae).
**Baseline yang diverifikasi:** `01-po-ratifikasi.md` Ratified (R1–R7 semua Setuju), di atas `38698c9`.

## Verdict keseluruhan: **PASS dengan advisory (non-blocking)** untuk G1–G4
Tidak ada blocker; builder **BOLEH lanjut** ke backend contract lock (`contracts.py` + `ReportRecord` + renderer HTML). A1/A3 wajib diputuskan *saat lock*; A4/A5 follow-up docs.

| # | Item | Verdict |
|---|---|---|
| 1 | Scope & not-in-scope vs Doc12 REP-001–007, Doc01 §Scope, Doc16 §M3, REP-008/009 | PASS |
| 2 | REP-003 referensi artifact + renderer backend | PASS |
| 3 | JobManager + provenance immutable + freshness | PASS (A1, A3 lock) |
| 4 | No whole-DataFrame JSON (file di disk, payload kecil) | PASS |
| 5 | R5 tertelusur & R6 stale dilabeli | PASS |
| 6 | 8 states, keyboard, a11y, responsif, inline-CSS | PASS (A2) |
| 7 | SEC-004 default-deny & save-cancel | PASS |
| 8 | Konsistensi SCREEN vs DS vs ratifikasi (R1–R7, copy) | PASS (A4, A5) |
| G1 JOB | — | PASS |
| G2 FLOW | — | PASS |
| G3 SCREEN | — | PASS |
| G4 DS | — | PASS advisory |

## Temuan per nomor (ringkas, bukti file:baris)
1. Parent `JOB:4` mengikat Doc12 (REP-001–007, REP-011/012 OD-3), Doc01, Doc16. HTML primer + PDF slice berikutnya `JOB:22-23,101`, `DS:51`, `01:21`. Freshness + bukti deterministik `JOB:20,26-27,47`. REP-008/009 terpisah `JOB:24-25`.
2. Referensi REP-003 `JOB:17-19,64,98`; DS melarang duplikasi `DS:32` + angka-olahan baru `DS:31,38`. Renderer backend `JOB:38,98` (stdlib `html`, tanpa dependency baru).
3. JobManager `JOB:41,97`, IPC `ipcClient` `JOB:38`, provenance immutable `JOB:51,100`, freshness `JOB:99` (stale = fingerprint ≠ snapshot; dimasukkan + dilabeli) — identik pola histogram/quality/cleaning/bivariate.
4. File di disk `JOB:97`, `DS:56`, `01:30` — bukan payload IPC, tidak melanggar no-whole-DataFrame/Arrow.
5. R5 footer per tabel `JOB:64`, `DS:39,54`; R6 stale dilabeli `JOB:47,65,91,99`, `DS:33,40,55` ("Hasil mungkin usang — jalankan ulang." identik quality/cleaning/bivariate).
6. 8 states `JOB:66-74`, keyboard native `JOB:79`, a11y `JOB:92`, responsif DS-CORE-001 `JOB:93`, inline-CSS `JOB:63` + `DS:34,41,53`.
7. Fingerprint asing ditolak SEC-004 `JOB:80`; save-batal kembali diam-diam `JOB:50,78`, `DS:44` (tidak menulis diam-diam).
8. R1–R7 identik lintas file (`DS:48-56` = `01:14-30` = SCREEN `:57,63-65,97-101`); copy literal identik (primer/loading/error/empty/partial/stale).

## Advisory
- **A1 (saat lock):** Doc12 §10.2.1 menuntut final export diblokir bila required-section tidak Current; kontrak belum menyatakan required vs optional + banner partial belum eksplisit sebagai explicit confirmation. Lock harus memutuskan eksplisit (semua section optional-terungkap, atau tandai draft + konfirmasi tercatat di provenance).
- **A2 (saat lock/G5):** live region = status job (bukan list/ringkasan utuh); renderer = tanpa `<script>` sama sekali (perketat dari "tanpa external").
- **A3 (saat lock):** tambahkan `renderer_version`, `content_fingerprint`, `validation_summary` (+ `report_execution_id`/`job_id` Doc12 §6.4) ke `ReportRecord`; tambah `is_final`/required-sections flag.
- **A4 redaksional (commit docs):** typo "ayrı" Turki `JOB:25`; cabang "unduh PDF bila sudah ada" ambigu vs R2; pemetaan label FLOW `+ Histogram / + Bivariate` ke enum `with-charts/with-visuals` belum disebut; `DS:16` "inline-PERHITUNGAN" tidak bermakna; parent "OD-3" tak terdefinisi.
- **A5 (sekuens):** `JOB:105` klaim "Exit G4 lulus — boleh mulai G5" harus dibaca "setelah Critic PASS" sesuai ratifikasi `:45`.
