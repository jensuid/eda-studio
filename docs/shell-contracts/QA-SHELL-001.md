# QA-SHELL-001 — Acceptance & Validation Contract (G6)

**Dibuat:** 2026-11-08 · **Versi:** DRAFT v0.1 · **Status:** DRAFT / PROPOSED — **bukan** kontrak acceptance yang sudah dijalankan, **bukan** PASS.
**Pemilik keputusan:** Product Owner (PO). **Rigor:** Full (application-level layer, G6).
**Kondisi:** G6 BELUM exit; kontrak ini **mendefinisikan** apa yang wajib dibuktikan — semua bukti di §3 berstatus **Belum ada**. Semua 21 keputusan shell sudah **Ratified oleh PO** (`RATIF-SHELL-001` Add-01; `RATIF-SHELL-002` `D-DS1` 16:01:39 WIB; `RATIF-SHELL-003` `D-DS2`…`D-DS5` + `D-S7` 17:15:33 WIB; `RATIF-SHELL-004` `D-F4`…`D-F8` + `D-S5`/`D-S6`/`D-S8` 17:38:27 WIB). **Tidak ada izin kode produksi; `tokens.css` tetap beku.**

> **Batasan eksplisit:** dokumen ini adalah **kontrak penerimaan** (apa yang harus dibuktikan, bagaimana, dan kriteria lulusnya). Ia **bukan** QA Acceptance Record dari run mana pun: tidak ada build yang diuji, tidak ada test yang dijalankan, tidak ada screenshot yang diambil untuk dokumen ini. **Test yang tidak dijalankan bukan PASS.**

---

## 1. Ruang lingkup & empat lapis validasi

Mengacu `contract_first_ui_v2/docs/11-qa-and-validation.md`. QA shell wajib mencakup empat lapis, dan **satu lapis tidak menggantikan lapis lain**:

| Lapis | Pertanyaan | Contoh bukti shell |
|---|---|---|
| 1. Contract conformance | Implementasi cocok dengan struktur, copy, state, perilaku, token yang disetujui? | Lint kepemilikan token (`D-DS1 = A`); `git diff` aditif murni `tokens.css`; sinkron copy deck (`D-S5`) dengan copy fitur ratified |
| 2. Functional & interaction | Aksi menghasilkan outcome benar? Validasi, permission, error, cancel, recovery benar? | Reload/Back/revalidasi gagal (`D-F2`/`D-F3`); fingerprint mismatch → `Stale` (`D-F7`); satu uji per kanal error (`D-F6`) |
| 3. Visual & accessibility | Hierarki, layout, tipografi, kontras, fokus, responsif/adaptif di ukuran yang didukung? | 8 state × 3 kontrol × 2 viewport; kontras terukur 5 tingkat; axe 0 critical 8 route; keyboard + screen reader |
| 4. Usability validation | Pengguna representatif bisa menyelesaikan tugas utama tanpa kebingungan terhindarkan? | Walkthrough tugas Doc01 §11.1 dengan seeded fixtures pada 900px dan 1440px |

**Di luar lingkup QA shell:** kontrak fitur ratified di `docs/ux-contracts/` (cleaning, profiling, quality, dst.) — QA shell hanya memastikan shell **tidak menimpa** copy/state fitur tersebut, bukan menguji ulang isi fitur.

### Batas keras yang dipakai QA sebagai oracle

- Python/Pydantic `backend/` satu-satunya source of truth IPC; `generated.ts` hanya dari `tools/generate_types.py` — tidak ada hand-edit.
- Frontend hanya lewat `ipcClient` (4 bridge methods).
- Job lifecycle backend-authoritative (SYS-015; Doc05 §8.2) — frontend memproyeksikan, tidak mengarang status.
- Default-deny / fail-closed (SEC-004); snapshot immutable dengan fingerprint SHA-256.
- Tidak ada whole-DataFrame JSON lewat IPC (preview ≤ 200, scatter ≤ 1500, bin ≤ 30).
- WCAG 2.2 AA dan min window 900px **bukan** deferred (DS-CORE-001).

---

## 2. Matriks pengujian (risk-based)

Sumber: `11-qa-and-validation.md` §Test matrix + `SCREEN-SHELL-001` §3.10 + `DS-SHELL-001` §10.

| Dimensi | Nilai yang dicakup shell |
|---|---|
| State | populated / loading / error / stale / done / job-running / job-failed / degraded (`D-S7`) |
| Viewport/window | **900px (minimum kontraktual)** dan **1440px** |
| Route | 8 route, **termasuk Readiness** (saat ini tidak dikunjungi `visual.spec.ts:13-21`) |
| Input | mouse, keyboard (jalur Tab R1→R7, `Esc`, skip link, focus return drawer), assistive technology (spot check banner/drawer/dialog) |
| Data | typical, boundary, missing, unusually long; **seeded fixtures** — bukan `data:null` (`helpers.ts:25-38`) |
| Kontrol | `button` / `input` / `select` × 8 state (`default|hover|focus-visible|pressed|selected|disabled|loading|error`), termasuk `disabled_reason` yang terbaca (`D-S4`) |

Dimensi **tidak** dikalikan membabi buta; cakupan dipilih berbasis risiko dan setiap pengecualian dicatat dengan disposition (lihat §4). Kombinasi wajib minimum:

- **State × viewport × route × keyboard path** (`SCREEN-SHELL-001` §3.10).
- **8 state kontrol × 3 kontrol × 2 viewport** dengan screenshot + assertion `aria-*` + `disabled_reason` (`DS-SHELL-001` §10).
- **Sinyal × status** untuk stepper 5 tahap (`D-F1`): tiap status ditelusur ke satu sinyal authoritative; tahap 6/7/10 "Belum tersedia" tidak dapat diklik; tahap 8 tidak ditampilkan.
- **Satu uji per concern** untuk kanal error terpisah (`D-F6`), dengan assertion tidak ada cross-contamination (protocol vs recovery vs update-check).

### Visual regression

- Screenshot pada ukuran & state yang dideklarasikan; build, environment, fixture, viewport **konsisten** antar run.
- Toleransi: **≤5%** setelah baseline baru disetujui (`D-S7 = A`, Ratified 17:15:33 WIB). Toleransi 15% saat ini hanya diterima **sementara dengan disposition eksplisit** — bukan PASS.
- Regenerasi baseline mengikuti strategi `D-DS4 = A` (setelah `D-S7`); bukti regenerasi dilampirkan ke record acceptance.
- Screenshot adalah bukti visual **saja**, bukan bukti kebenaran fungsional.

### Aksesibilitas

- axe **0 critical** pada 8 route (termasuk Readiness) **plus** walkthrough keyboard manual dan uji screen reader untuk banner/drawer/dialog (`SCREEN-SHELL-001` §3.10).
- Jalur keyboard lengkap R1→R7, focus return drawer, `Esc` wajib (`D-S6 = A` — `Esc` mandatory; `Cmd+K` Phase 2), `:focus-visible` pada setiap state.
- Kontras: **pengukuran nyata** untuk kelima tingkat tipografi pada `surface` dan `surface-raised`, termasuk `caption` 12px dan teks `muted` (WCAG 2.2 AA).
- Zoom/reflow dan dynamic announcement diuji untuk workflow kritis.

### Performance UX

Diukur perilaku yang dirasakan pengguna, bukan sekadar angka backend:

- Time to first useful content; feedback delay setelah aksi; visibilitas progres untuk tugas panjang (indeterminate sampai `D-F5` diimplementasikan — `D-S8`).
- Kemampuan membatalkan atau melanjutkan bekerja; job tetap berjalan saat navigasi (`D-F2`).
- Layout stability; recovery setelah timeout/failure (`degraded` beralasan, bukan empty state — `D-F3`).

---

## 3. Katalog bukti (semuanya Belum ada)

Pemetaan ke `JOB-SHELL-001` §5 (B1–B8), `DS-SHELL-001` §10, `FLOW-SHELL-001` §Traceability, `SCREEN-SHELL-001` §3.10/§Traceability.

| # | Bukti | Kontrak pengunci | Status |
|---|---|---|---|
| B1 | Walkthrough tugas Doc01 §11.1 dengan seeded fixtures, 900px + 1440px | `JOB-SHELL-001` §5 | ☐ Belum ada — `helpers.ts` masih `data:null`. **Threshold terukur (G5-07, Add-09):** 5 tugas Doc01 §11.1, 900px + 1440px, jalur keyboard-only, seeded fixtures (bukan `data:null`), dicatat per tugas |
| B2 | Tabel **sinyal × status** stepper 5 tahap | `D-F1` | ☐ Belum ada |
| B3 | Uji **fingerprint mismatch** → artefak `Stale`, bukan `Current` | `D-F7` | ☐ Belum ada |
| B4 | Uji **reload / Back / revalidasi gagal** (`D-F2` + `D-F3`) — screenshot tidak cukup untuk arsitektur | `FLOW-SHELL-001` §2.9 | ☐ Belum ada |
| B5 | Uji aksesibilitas 900px: rail berlabel, drawer, focus return, `Esc`, skip link; axe 0 critical 8 route | `D-S3`/`D-S6` | ☐ Belum ada |
| B6 | Job tetap berjalan saat navigasi; progress indeterminate; `jobProgress()` dihapus | `D-F2`/`D-F5`/`D-S8` | ☐ Belum ada |
| B7 | 8 state × 3 kontrol × 2 viewport + pengukuran kontras nyata untuk 5 tingkat | `D-S4`/`D-DS3` | ☐ Belum ada — menunggu G4 exit |
| B8 | Independent Critic (G5) konteks segar, temuan `Confirmed / Likely / Suggestion` | G5 | ✅ **Laporan diterima 2026-11-08** — [G5-CRITIC-REPORT-2026-11-08.md](G5-CRITIC-REPORT-2026-11-08.md) (Add-08); disposition via **Add-09** |
| B9 | Lint kepemilikan token + `git diff` **aditif murni** `tokens.css` pada saat implementasi kelak | `D-DS1 = A` | ☐ Belum ada — `tokens.css` beku |
| B10 | Regenerasi baseline visual sesuai `D-DS4` (setelah `D-S7`), toleransi ≤5% | `D-S7`/`D-DS4` | ☐ Belum ada — 14 baseline masih empty state |
| B11 | Sinkron copy deck satu modul dengan copy fitur ratified; tidak ada ID dokumen/`error.message` di headline | `D-S5`/`D-S2` | ☐ Belum ada |
| B12 | Vertical slice G5: `cold-start → ingest → orient → run-stage → advance` + satu edge state (stale atau load-failed), 900px + 1440px, jalur keyboard, data representatif | `SCREEN-SHELL-001` Exit G3 | ☐ Belum ada. **Threshold terukur (G5-07, Add-09):** diselesaikan keyboard-only, 2 viewport, 1 edge state, data representatif; dicatat per langkah dengan label `Confirmed / Likely / Suggestion` |

**Disiplin bukti:** kegagalan memuat data tidak boleh disajikan sebagai data kosong; **test yang tidak dijalankan bukan PASS**; screenshot prototipe disposable `prototypes/shell-v0/` **bukan** bukti penerimaan; setiap klaim/temuan wajib berlabel `Confirmed / Likely / Suggestion` dan merujuk kontrak, screenshot, test, atau lokasi sumber.

---

## 4. Kriteria keputusan rilis (G6)

Mengacu `11-qa-and-validation.md` §Release decision:

| Keputusan | Syarat |
|---|---|
| **PASS** | Semua kriteria acceptance terpenuhi; tidak ada blocker tersisa (B1–B12 ada, terverifikasi, dan Critic G5 PASS). |
| **PASS WITH ACCEPTED RISKS** | Risiko tersisa memiliki pemilik, rationale, dan tindak lanjut tercatat (mis. toleransi 15% sementara, konvergensi tipografi pasca-RC per `D-DS5`). |
| **FAIL** | Blocker, perilaku kritis yang belum terverifikasi, atau deviasi kontrak material tersisa. Status saat ini: **FAIL by default** — bukan karena ada kegagalan, melainkan karena **belum ada bukti yang dijalankan**. |

Setiap record acceptance run wajib mencatat: build (commit/version), kontrak yang diuji (path), hasil functional/interaction/accessibility/visual/performance dengan bukti, hasil walkthrough tugas manusia, open defects dengan severity + disposition (`fix`/`accept`/`defer`), dan approval pemilik. Format mengikuti templat `03-artifact-templates.md` §7 (QA Acceptance Record).

---

## 5. Exit G6 (belum terpenuhi)

- [ ] `QA-SHELL-001` diratifikasi PO sebagai kontrak acceptance.
- [ ] B1–B12 tersedia dan terverifikasi pada build yang dideklarasikan.
- [ ] Independent Critic (G5) PASS dengan konteks segar; temuan berlabel `Confirmed / Likely / Suggestion` ditutup atau didisposisikan.
- [ ] Tidak ada blocker; setiap risiko diterima tercatat dengan pemilik + tindak lanjut.
- [ ] Record acceptance run diterbitkan (format §7 template) dan ditandatangani PO.

---

## 6. Traceability

| Sumber | Bagian kontrak ini | Bukti yang dihasilkan |
|---|---|---|
| `11-qa-and-validation.md` | §1 lapis, §2 matriks, §4 keputusan | record acceptance per run |
| `JOB-SHELL-001` §5 (B1–B8) | §3 B1–B8 | bukti penerimaan G1 |
| `DS-SHELL-001` §10, §8 butir 7–12 | §2 matriks kontrol, §3 B7/B9/B10 | matriks state, kontras, lint, diff aditif |
| `FLOW-SHELL-001` §Traceability, §Exit G2 | §3 B2–B4/B6 | tabel sinyal × status, uji reload/back, uji per concern |
| `SCREEN-SHELL-001` §3.10, §Traceability, Exit G3 | §2 matriks, §3 B5/B11/B12 | axe + keyboard + SR, sinkron copy, vertical slice |
| `RATIF-SHELL-001` s.d. `RATIF-SHELL-004` | §3 pengunci per bukti | 21 keputusan ratified, 0 Pending |
| `03-artifact-templates.md` §7 | §4 format record | QA Acceptance Record per run |

---

**Status akhir:** DRAFT v0.1. Dokumen ini **melengkapi prasyarat *draft* G6**, bukan prasyarat *ratifikasi* G6. Tidak ada build yang diuji, tidak ada test yang dijalankan, dan tidak ada PASS yang diklaim. **Tidak ada kode produksi yang diizinkan; `tokens.css` dan `tokens.ts` tetap tidak boleh disentuh** sampai ratifikasi kontrak + G1–G4 exit + Independent Critic (G5) PASS dengan konteks segar.
