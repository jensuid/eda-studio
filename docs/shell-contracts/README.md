# Shell-Level UX Contracts — ARSIP DRAFT BERTANDA TANGAN; kanonis ratified terbit di `docs/ux-contracts/shell/` (21 keputusan, 0 Pending)

**Dibuat:** 2026-11-08 · **Versi:** v0.10 + Add-01…Add-10 · **Status:** ARSIP — **bukan** kontrak yang mengikat implementasi. Kanonis yang mengikat: `docs/ux-contracts/shell/` v1.0 Ratified (`RATIF-SHELL-005`).
**Pemilik keputusan:** Product Owner (PO). **Rigor:** Full (lintas modul, sesuai `contract_first_ui_v2/docs/02-framework.md` §Application-level layer).

> **RATIFIKASI PARSIAL PO — 2026-11-08 14:04 WIB, DITANDATANGANI DIGITAL 14:23:54 WIB.** Tujuh keputusan bentuk shell (`D-F1`, `D-F2`, `D-F3`, `D-S1`, `D-S2`, `D-S3`, `D-S4`) sudah **diratifikasi PO** lewat [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md), dengan tanda tangan digital `SIG-SHELL-2026-11-08-01` di [worksheet §8](RATIFICATION-SESSION-01.md) dan sidik jari di `SIGNATURE-MANIFEST-2026-11-08.sha256`. **Kedua kontrak di folder ini tetap DRAFT** dan 9 keputusan tetap Pending. Ratifikasi parsial **tidak** memindahkan artefak ke `docs/ux-contracts/`, **tidak** menambah baris di `docs/status-register.md`, dan **tidak** membuka G5 maupun izin kode produksi.

> **ADDENDUM Add-01 — 2026-11-08 (pasca-tanda-tangan).** `JOB-SHELL-001` dan `APP-ARCH-001` kini tersedia sebagai **DRAFT v0.1**. Lima berkas yang dilindungi `SIGNATURE-MANIFEST-2026-11-08.sha256` **sengaja tidak disunting**; delapan kalimat usang di dalamnya ditunjuk eksplisit oleh [POST-SIGNATURE-ADDENDUM-2026-11-08.md](POST-SIGNATURE-ADDENDUM-2026-11-08.md). Manifest v1 tetap **5/5 OK**. Objek yang ditandatangani (7 keputusan) **tidak berubah**; tidak ada gate yang exit.
>
> **RATIFIKASI `D-DS1 = A` — 2026-11-08 16:01:39 WIB (Add-03).** PO menyatakan **`"rafitikasi d-ds1"`** → keputusan naik dari `Diputus PO` menjadi **`Ratified oleh PO`** lewat [RATIF-SHELL-002](RATIFICATION-RECORD-D-DS1-2026-11-08.md). Record ratifikasi terpisah (bukan suntingan `RATIF-SHELL-001`); manifest baru `SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256` (**2/2 OK**); manifest v1 tetap **5/5 OK** dan utuh. **Bukan** tanda tangan digital, **bukan** ratifikasi kontrak, **bukan** G4 exit, **bukan** izin menyentuh `tokens.css`. Detail di [Add-03](POST-SIGNATURE-ADDENDUM-2026-11-08.md).
>
> **KEPUTUSAN Add-04 — 2026-11-08 16:48:45 WIB.** PO menjawab **`"D-DS2 -> D-DS3 -> D-S7 -> D-DS4 -> D-DS5 , semua A"`** untuk 5 keputusan mekanisme G4 + `D-S7`. Semua naik dari `Pending` menjadi **`Diputus PO — A`**: `D-DS2` (shell saja), `D-DS3` (weight+line-height aditif, radius ditunda), `D-S7` (seeded fixtures + toleransi <=5% sekarang), `D-DS4` (regenerasi baseline setelah D-S7), `D-DS5` (tunda konvergensi ke pasca-RC). `DS-SHELL-001` naik ke **DRAFT v0.3**. Total keputusan terbuka turun dari **13 → 8 Pending**. `D-S7` juga tercatat di `SCREEN-SHELL-001` (berkas bertanda tangan → transkrip via addendum, **bukan** suntingan). **Masih dilarang menyentuh `tokens.css` / `tokens.ts`** — butuh ratifikasi kontrak + G4 exit + Critic G5.
>
> **RATIFIKASI Add-05 — 2026-11-08 17:15:33 WIB (`RATIF-SHELL-003`).** PO menyatakan ratifikasi 5 keputusan sekaligus → `D-DS2`, `D-DS3`, `D-S7`, `D-DS4`, `D-DS5` naik dari `Diputus PO — A` menjadi **`Ratified oleh PO (A, 17:15:33 WIB)`** lewat [RATIF-SHELL-003](RATIFICATION-RECORD-D-DS2-TO-D-S7-2026-11-08.md). Record ratifikasi terpisah; manifest baru `SIGNATURE-MANIFEST-RATIF-SHELL-003-2026-11-08.sha256` (**1/1 OK**); manifest v1 tetap **5/5 OK**, v2 **2/2 OK**, utuh. Total kini **13 ratified** (7 + 1 + 5), **8 Pending** (D-F4–D-F8, D-S5, D-S6, D-S8). `DS-SHELL-001` naik ke **DRAFT v0.4**. **Bukan** tanda tangan digital, **bukan** ratifikasi kontrak, **bukan** G4 exit, **bukan** izin menyentuh `tokens.css`. Detail di [Add-05](POST-SIGNATURE-ADDENDUM-2026-11-08.md).
>
> **RATIFIKASI Add-06 — 2026-11-08 17:38:27 WIB (`RATIF-SHELL-004`).** PO menyatakan ratifikasi **8 keputusan tersisa sekaligus opsi A** → `D-F4` (Beta/Phase 1), `D-F5` (Pydantic-dulu), `D-F6` (kanal error terpisah), `D-F7` (stale + CTA refresh), `D-F8` (Phase 0 dulu), `D-S5` (copy deck satu modul), `D-S6` (`Esc` wajib, `Cmd+K` Phase 2), `D-S8` (tunggu `JobEvent.command`) naik dari `Pending` menjadi **`Ratified oleh PO (A, 17:38:27 WIB)`** lewat [RATIF-SHELL-004](RATIFICATION-RECORD-D-F4-TO-D-S8-2026-11-08.md). Record ratifikasi terpisah; manifest baru `SIGNATURE-MANIFEST-RATIF-SHELL-004-2026-11-08.sha256` (**1/1 OK**); manifest v1 tetap **5/5 OK**, v2 **2/2 OK**, v3 **1/1 OK**, utuh. Total kini **21 ratified, 0 Pending** — semua keputusan shell sudah diratifikasi. `DS-SHELL-001` naik ke **DRAFT v0.5**. `FLOW-SHELL-001`/`SCREEN-SHELL-001` (berkas bertanda tangan) tetap `☐ Pending` di badan teks; koreksi via addendum. **Bukan** tanda tangan digital, **bukan** ratifikasi kontrak, **bukan** G4 exit, **bukan** izin menyentuh `tokens.css`. Detail di [Add-06](POST-SIGNATURE-ADDENDUM-2026-11-08.md).
>
> **KOREKSI Add-09 — 2026-11-08.** Addendum pembetulan transkrip usang `FLOW-SHELL-001`/`SCREEN-SHELL-001` di berkas bertanda tangan (G5-01/G5-02/G5-04/G5-08) + disposition G5-06 (`Likely`) & G5-07 (threshold B1/B12). Berkas bertanda tangan **tidak disunting**; keenam kontrak memenuhi syarat **G5 PASS** (putusan formal milik PO). **Bukan** ratifikasi kontrak, **bukan** G6 exit, **bukan** izin menyentuh `tokens.css`. Detail di [Add-09](POST-SIGNATURE-ADDENDUM-2026-11-08.md).
>
> **G5 FEEDBACK Add-08 — 2026-11-08 ([G5-CRITIC-REPORT-2026-11-08.md](G5-CRITIC-REPORT-2026-11-08.md)).** Independent Critic konteks segar melaporkan **8 temuan** (2 High G5-01/G5-02 transkrip usang `FLOW-SHELL-001`/`SCREEN-SHELL-001` di berkas bertanda tangan; 2 Medium; 4 Low/Suggestion): tidak ada blocker substansi terhadap 21 keputusan; verdict advisory APP-ARCH/JOB/DS/QA **PASS**, FLOW/SCREEN **FAIL bersyarat**; `QA-SHELL-001` PASS sebagai kontrak (bukan acceptance — B1–B12 Belum ada). B8 `JOB-SHELL-001` diperbarui. G5 PASS formal menunggu disposition PO (Add-09). **Bukan** ratifikasi, **bukan** G5 PASS, **bukan** G6 exit, **bukan** izin menyentuh `tokens.css`.
>
> **DRAFT Add-07 — 2026-11-08 (`QA-SHELL-001` DRAFT v0.1).** Kontrak acceptance & validasi G6 kini tersedia sebagai **DRAFT v0.1** ([QA-SHELL-001.md](QA-SHELL-001.md)): empat lapis validasi, matriks state × viewport × route × keyboard, katalog bukti B1–B12 (semuanya **Belum ada**), kriteria rilis PASS / PASS WITH ACCEPTED RISKS / FAIL. Dokumen ini **bukan** QA Acceptance Record — tidak ada build yang diuji dan tidak ada PASS yang diklaim. **Bukan** ratifikasi kontrak, **bukan** G6 exit, **bukan** izin menyentuh `tokens.css`.
>
> **KEPUTUSAN Add-02 — 2026-11-08 15:34:53 WIB.** PO menjawab **`A`** untuk [`D-DS1`](DECISION-CARD-D-DS1.md): mekanisme **aditif `--shell-font-*`**, token global `11/13/15` dibiarkan. Status naik dari `Diputus PO` ke **`Ratified oleh PO (16:01:39 WIB)`** lewat Add-03. `DS-SHELL-001` tetap **DRAFT v0.2**. Konsekuensi: **`D-DS5`** dibuka sebagai keputusan resmi Pending (konvergensi dua skala). **Masih dilarang menyentuh `tokens.css` / `tokens.ts`** — butuh `D-DS2`…`D-DS5`, `D-S7`, ratifikasi G4, dan Critic G5.

## Mengapa folder ini terpisah dari `docs/ux-contracts/`

1. **Akar masalah yang ditemukan pada review UI/UX MVP RC (2026-11-08):** framework contract-first diterapkan *per fitur* (SCREEN/DS/QA untuk 7 fitur sudah ratified), tetapi tidak pernah diterapkan pada **application shell / journey**. Akibatnya tiap fitur punya 8 state, sementara produk tidak punya alur kerja, bahasa visual, atau koherensi lintas-route. Folder ini menampung kontrak untuk lapisan yang hilang itu.
2. **Pemisahan status.** `docs/ux-contracts/` adalah register artefak yang sudah diratifikasi PO dan ditautkan ke `docs/status-register.md`. Menaruh DRAFT di sana akan membuatnya mudah tertukar dengan kontrak approved. Folder terpisah = tidak ada yang membaca dokumen ini sebagai keputusan final.
3. **Baseline Freeze v1.0 masih berlaku.** `docs/BASELINE-FREEZE-v1.0.md:4,24` menegaskan baris yang tidak disebut dalam register tetap berstatus aslinya (Proposed/Deferred/OPEN) dan TIDAK dianggap confirmed. Doc08 §19 secara eksplisit men-Deferred *final screen-by-screen layouts*, *exact navigation labels and ordering*, *detailed design tokens and visual theme*, dan *final Job Center screen layout*. Dokumen ini mengusulkan keputusan untuk area itu, bukan meratifikasinya.
4. **Stop rule.** Sesuai `02-framework.md` §Stop rule, kontrak tidak boleh mengarang perilaku produk yang konsekuensial. Semua keputusan yang belum ada pemiliknya ditandai `D-F*` / `D-S*` dan **menghentikan G5 sampai PO memilih**.

**Jalur migrasi (SELESAI 2026-11-08 via Add-10):** keenam artefak telah dipindahkan ke `docs/ux-contracts/shell/` sebagai **v1.0 Ratified**, status diubah menjadi `Ratified oleh PO (2026-11-08, RATIF-SHELL-005)`, baris ditambahkan ke `docs/status-register.md`, dan Independent Critic (G5) telah melaporkan (PASS formal oleh PO, Opsi A). Folder ini kini adalah **arsip DRAFT bertanda tangan** — jangan lagi menyunting kontrak di sini; perubahan kontrak dilakukan di `docs/ux-contracts/shell/` dengan record amandemen baru. `tokens.css` tetap beku sampai G6 (B9/B10); Phase 0 frontend-only yang diizinkan (`D-F8`).

## Cakupan

**Di dalam:** application bar, primary navigation, workflow stepper / next-step CTA, routing & context preservation, main workspace frame, context panel (dataset aktif + Job Center), feedback global (banner/toast/error), state global, perilaku responsif 900/1440, terminologi dan copy lintas-route.

**Di luar:** kontrak layar per fitur yang sudah ratified (tetap authoritative untuk region fitur), nilai token visual (DS-CORE-001 tetap authoritative untuk warna/kontras/min-window), kontrak IPC/Pydantic, QA artefak, implementasi.

| ID | Gate | Status | Berkas | Parent |
|---|---|---|---|---|
| `APP-ARCH-001` | Application layer | **DRAFT v0.1** — belum diratifikasi PO | [APP-ARCH-001.md](APP-ARCH-001.md) | Doc07 §6, Doc08 §4, `RATIF-SHELL-001` |
| `JOB-SHELL-001` | G1 | **DRAFT v0.1** — belum diratifikasi PO; menggantikan anchor G1 provisional | [JOB-SHELL-001.md](JOB-SHELL-001.md) | Doc01 §3, §5, §11.1; FLOW-SHELL-001 §G1 |
| `FLOW-SHELL-001` | G2 | **DRAFT v0.2** — 8/8 keputusan ratified PO (3 lewat `RATIF-SHELL-001`, 5 lewat `RATIF-SHELL-004`; badan teks bertanda tangan → koreksi via addendum) | [FLOW-SHELL-001.md](FLOW-SHELL-001.md) | JOB-SHELL-001 (DRAFT v0.1), Doc08 §5, §10, §11, §12, §15 |
| `SCREEN-SHELL-001` | G3 | **DRAFT v0.2** — 8/8 keputusan ratified PO (4 lewat `RATIF-SHELL-001`, 1 lewat `RATIF-SHELL-003`, 3 lewat `RATIF-SHELL-004`; badan teks bertanda tangan → koreksi via addendum) | [SCREEN-SHELL-001.md](SCREEN-SHELL-001.md) | FLOW-SHELL-001, Doc07 §6.1, DS-CORE-001 |
| `DS-SHELL-001` | G4 | **DRAFT v0.5** — belum diratifikasi; `D-DS1 = A` **Ratified oleh PO (16:01:39 WIB)** lewat `RATIF-SHELL-002`; `D-DS2`…`D-DS5` + `D-S7` **Ratified oleh PO — A (17:15:33 WIB, `RATIF-SHELL-003`)**; `D-F4`…`D-F8` + `D-S5`/`D-S6`/`D-S8` **Ratified oleh PO — A (17:38:27 WIB, `RATIF-SHELL-004`)** | [DS-SHELL-001.md](DS-SHELL-001.md) | `DS-CORE-001` (amandemen terbatas), `SCREEN-SHELL-001` §3.9.7, `RATIF-SHELL-001` §2 `D-S4`, [kartu `D-DS1`](DECISION-CARD-D-DS1.md) §8, [RATIF-SHELL-002](RATIFICATION-RECORD-D-DS1-2026-11-08.md), [RATIF-SHELL-004](RATIFICATION-RECORD-D-F4-TO-D-S8-2026-11-08.md) |
| `QA-SHELL-001` | G6 | **DRAFT v0.1** — belum diratifikasi PO; kontrak acceptance, semua bukti B1–B12 Belum ada | [QA-SHELL-001.md](QA-SHELL-001.md) | `11-qa-and-validation.md`, `JOB-SHELL-001` §5, `DS-SHELL-001` §10, `FLOW-SHELL-001` + `SCREEN-SHELL-001` §3.10 |
| `RATIF-SHELL-001` | — | **BERLAKU SEBAGIAN** (7 keputusan, 2026-11-08) | [RATIFICATION-RECORD-2026-11-08.md](RATIFICATION-RECORD-2026-11-08.md) | Pernyataan PO 14:04 WIB |
| `RATIF-SHELL-002` | — | **BERLAKU** (1 keputusan `D-DS1`, 2026-11-08) | [RATIFICATION-RECORD-D-DS1-2026-11-08.md](RATIFICATION-RECORD-D-DS1-2026-11-08.md) | Pernyataan PO `"rafitikasi d-ds1"` 16:01:39 WIB |

**Berkas pendukung (bukan kontrak):**

| Berkas | Isi | Status |
|---|---|---|
| [DECISION-CARD-D-DS1.md](DECISION-CARD-D-DS1.md) | Kartu keputusan `D-DS1`: opsi A/B/C, reasoning, bukti berlabel, argumen penentang, **§8 record keputusan** | ✅ **RATIFIED OLEH PO — A**, 16:01:39 WIB (`RATIF-SHELL-002`). Sebelumnya `Diputus PO` 15:34:53 WIB. **Bukan** tanda tangan digital |
| [RATIFICATION-RECORD-D-DS1-2026-11-08.md](RATIFICATION-RECORD-D-DS1-2026-11-08.md) | `RATIF-SHELL-002` — record ratifikasi eksplisit PO untuk `D-DS1 = A` (16:01:39 WIB) | **BERLAKU** — 1 keputusan; kontrak induk tetap DRAFT |
| [POST-SIGNATURE-ADDENDUM-2026-11-08.md](POST-SIGNATURE-ADDENDUM-2026-11-08.md) | Add-01 (8 kalimat usang) + Add-02 (keputusan `D-DS1`) + Add-03 (ratifikasi `D-DS1`) + Add-04 (5 keputusan D-DS2–D-DS5 + D-S7) + Add-05 (ratifikasi RATIF-SHELL-003) + **Add-06 (ratifikasi RATIF-SHELL-004: D-F4–D-F8, D-S5, D-S6, D-S8)** | Catatan status & keputusan |
| [SESSION-GUIDE-D-DS2-TO-D-S7.md](SESSION-GUIDE-D-DS2-TO-D-S7.md) | Panduan sesi 5 keputusan (D-DS2–D-DS5 + D-S7) — peta ketergantungan, urutan, bias mitigation | Alat bantu (terpakai Add-04, diratifikasi Add-05) |
| [HANDOFF-FRESH-SESSION.md](HANDOFF-FRESH-SESSION.md) | Brief self-contained untuk sesi Independent Critic / ratifikasi | Alat bantu |
| [G5-CRITIC-REPORT-2026-11-08.md](G5-CRITIC-REPORT-2026-11-08.md) | Laporan Independent Critic G5 (konteks segar, 2026-11-08) | Feedback advisory; disposition milik PO |
| [RATIFICATION-SESSION-01.md](RATIFICATION-SESSION-01.md), [DECISIONS-2026-11-08.md](DECISIONS-2026-11-08.md) | Worksheet & catatan jalannya sesi (ditutup 14:04 WIB) | Arsip bertanda tangan |
| [RATIFICATION-RECORD-D-F4-TO-D-S8-2026-11-08.md](RATIFICATION-RECORD-D-F4-TO-D-S8-2026-11-08.md) | `RATIF-SHELL-004` — record ratifikasi eksplisit PO untuk 8 keputusan tersisa (17:38:27 WIB) | **BERLAKU** — 8 keputusan; kontrak induk tetap DRAFT |
| [SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256](SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256) | 2 hash SHA-256 (record + kartu), `shasum -a 256 -c …` | **2/2 OK** |
| [SIGNATURE-MANIFEST-RATIF-SHELL-003-2026-11-08.sha256](SIGNATURE-MANIFEST-RATIF-SHELL-003-2026-11-08.sha256) | 1 hash SHA-256 (record), `shasum -a 256 -c …` | **1/1 OK** |
| [SIGNATURE-MANIFEST-RATIF-SHELL-004-2026-11-08.sha256](SIGNATURE-MANIFEST-RATIF-SHELL-004-2026-11-08.sha256) | 1 hash SHA-256 (record), `shasum -a 256 -c …` | **1/1 OK** |
| [SIGNATURE-MANIFEST-2026-11-08.sha256](SIGNATURE-MANIFEST-2026-11-08.sha256) | 5 hash SHA-256, `shasum -a 256 -c …` | **5/5 OK** |

## Referensi normatif

- `docs/01 — Product Vision & Requirements v0.2.md` §1–§3 (persona, prinsip), §5 (10 stage), §8.2 (payload), §11.1 (acceptance end-to-end).
- `docs/07 — Frontend Architecture v0.3.md` §6.1–§6.3 (shell, nav groups, navigation principles).
- `docs/08 — UX & Interaction Architecture v0.3.md` §2, §3, §4, §5, §10, §11, §12, §15, §16, §18, §19.
- `docs/ux-contracts/README.md` (six gates, non-negotiables, binding constraints) dan `contract_first_ui_v2/docs/03-artifact-templates.md` (templat G2/G3).
- `docs/ux-contracts/profiling/DS-CORE-001.md` (min window 900px, kontras AA, kontrol 36px).
- `docs/BASELINE-FREEZE-v1.0.md`, `AGENTS.md`.

## Batasan mengikat (tidak boleh dilemahkan oleh kontrak ini)

1. `frontend/src/shared/ipc/generated.ts` di-GENERATE dari Pydantic `backend/contracts.py` — **jangan hand-edit**. Setiap field/command baru wajib Pydantic dulu, baru `tools/generate_types.py`.
2. Frontend hanya lewat `ipcClient` (4 bridge methods). Job lifecycle tetap **backend-authoritative** (SYS-015, Doc05 §8.2); frontend memproyeksikan, tidak mengarang status, tidak auto-retry, tidak transisi lifecycle lokal.
3. Autoritas default-deny / fail-closed (SEC-004).
4. Tidak ada whole-DataFrame JSON lewat IPC (ADR-003: JSON + cap aktif). Cap berlaku: preview ≤ 200, scatter ≤ 1500, bin ≤ 30.
5. WCAG 2.2 AA **bukan** deferred; min window 900px (DS-CORE-001).
6. Snapshot immutable, fingerprint SHA-256, source bytes tidak dimutasi.

## Daftar keputusan PO (16)

| ID | Pertanyaan | Berkas | Status |
|---|---|---|---|
| D-F1 | Stepper penuh 10 stage vs stepper minimal berbasis sinyal yang benar-benar tersedia | FLOW-SHELL-001 | ✅ **Ratified oleh PO (2026-11-08)** — A |
| D-F2 | Router: tetap state-only atau hash routing + history | FLOW-SHELL-001 | ✅ **Ratified oleh PO (2026-11-08)** — A |
| D-F3 | Strategi pemulihan konteks saat reload (localStorage + revalidasi vs tanpa persistensi) | FLOW-SHELL-001 | ✅ **Ratified oleh PO (2026-11-08)** — A |
| D-F4 | Apakah `project.open` / daftar proyek masuk RC atau Beta | FLOW-SHELL-001 | ✅ **Ratified oleh PO — A (17:38:27 WIB, `RATIF-SHELL-004`)** — Beta/Phase 1, bukan RC |
| D-F5 | Ekstensi `JobEvent` (command/progress/timestamp) — Pydantic dulu | FLOW-SHELL-001 | ✅ **Ratified oleh PO — A (17:38:27 WIB, `RATIF-SHELL-004`)** — `command`, `progress?`, `started_at?`, `finished_at?` di Pydantic dulu |
| D-F6 | Pemisahan kanal error global per concern | FLOW-SHELL-001 | ✅ **Ratified oleh PO — A (17:38:27 WIB, `RATIF-SHELL-004`)** — kanal per concern, satu `protocolError` dihapus |
| D-F7 | Aturan stale lintas-route dan CTA refresh yang disetujui pengguna | FLOW-SHELL-001 | ✅ **Ratified oleh PO — A (17:38:27 WIB, `RATIF-SHELL-004`)** — fingerprint check, refresh setelah persetujuan, CTA menyebut dependency |
| D-F8 | Urutan rilis: Phase 0 (frontend-only) sebelum Phase 1 (butuh kontrak backend) | FLOW-SHELL-001 | ✅ **Ratified oleh PO — A (17:38:27 WIB, `RATIF-SHELL-004`)** — Phase 0 dulu, Phase 1 setelah PO + kontrak — **mengunci kapan D-F2/D-F3 boleh dikerjakan** |
| D-S1 | Grup navigasi & urutan final | SCREEN-SHELL-001 | ✅ **Ratified oleh PO (2026-11-08)** — A |
| D-S2 | Locale tunggal + label final (menggantikan "Bivariat"/"Assessing…"/"rows") | SCREEN-SHELL-001 | ✅ **Ratified oleh PO (2026-11-08)** — A |
| D-S3 | Layout 900px: rail berlabel + drawer Job Center (rekomendasi) vs rail ikon | SCREEN-SHELL-001 | ✅ **Ratified oleh PO (2026-11-08)** — A |
| D-S4 | Skala tipografi & komponen dasar shell (amandemen DS-CORE-001) | SCREEN-SHELL-001 | ✅ **Ratified oleh PO (2026-11-08)** — A; butuh G4 |
| D-S5 | Copy deck lintas-route | SCREEN-SHELL-001 | ✅ **Ratified oleh PO — A (17:38:27 WIB, `RATIF-SHELL-004`)** — satu modul copy shell, tanpa menimpa copy fitur ratified |
| D-S6 | Shortcut global (Cmd+K, Esc) dan cakupannya | SCREEN-SHELL-001 | ✅ **Ratified oleh PO — A (17:38:27 WIB, `RATIF-SHELL-004`)** — `Esc` wajib, `Cmd/Ctrl+K` Phase 2 |
| D-S7 | Toleransi visual regression diturunkan 15% → ≤5% + seeded state fixtures | SCREEN-SHELL-001 | ✅ **Ratified oleh PO — A (17:15:33 WIB, `RATIF-SHELL-003`)** — seeded fixtures + ≤5% sekarang. Transkrip via addendum (berkas bertanda tangan) |
| D-S8 | Apakah stepper status `In Progress` ditunda sampai `JobEvent.command` tersedia | SCREEN-SHELL-001 | ✅ **Ratified oleh PO — A (17:38:27 WIB, `RATIF-SHELL-004`)** — ditunda sampai `JobEvent.command` tersedia (`D-F5`) |

**Record ratifikasi:** [RATIFICATION-RECORD-2026-11-08.md](RATIFICATION-RECORD-2026-11-08.md) — sumber kebenaran tunggal untuk bunyi 7 keputusan, batas amandemen Doc08 §19, dan daftar bukti penerimaan yang belum ada.

### Keputusan tambahan dari `DS-SHELL-001` (G4)

Lima keputusan **mekanisme** yang muncul saat G4 didraft. Ini **bukan** bagian dari 16 keputusan di atas dan **tidak** membuka kembali `D-S4` yang sudah ratified:

| ID | Pertanyaan | Status |
|---|---|---|
| `D-DS1` | Migrasi token: aditif `--shell-*` vs remap global `--font-size-*` (**blocker keputusan — sudah terlepas**) | ✅ **RATIFIED OLEH PO — A (aditif), 2026-11-08 16:01:39 WIB** (`RATIF-SHELL-002`). Sebelumnya `Diputus PO` 15:34:53 WIB. [Kartu](DECISION-CARD-D-DS1.md) §8 = record. **Bukan** tanda tangan digital. Ditranskrip ke `DS-SHELL-001` §2.4 / §8 / §9 |
| `D-DS2` | 8 state kontrol berlaku untuk fitur juga, atau shell saja | ✅ **RATIFIED OLEH PO — A (17:15:33 WIB, `RATIF-SHELL-003`)** — shell saja untuk RC |
| `D-DS3` | `font-weight` / line-height per tingkat; penyelarasan radius 4/6/8px | ✅ **RATIFIED OLEH PO — A (17:15:33 WIB, `RATIF-SHELL-003`)** — weight+line-height aditif, radius ditunda |
| `D-DS4` | Strategi regenerasi baseline visual (terkait `D-S7`) | ✅ **RATIFIED OLEH PO — A (17:15:33 WIB, `RATIF-SHELL-003`)** — regenerasi setelah D-S7 |
| `D-DS5` | **Konvergensi dua skala tipografi** — konsekuensi langsung `D-DS1 = A` | ✅ **RATIFIED OLEH PO — A (17:15:33 WIB, `RATIF-SHELL-003`)** — tunda ke pasca-RC; utang teknis tercatat. `body` shell 14px vs fitur 13px, `caption` 12px vs 11px |

**Total keputusan terbuka:** 9 lama + `D-DS2`…`D-DS5` (4) = 13 semula. **Add-04 (16:48:45 WIB):** `D-DS2`/`D-DS3`/`D-DS4`/`D-DS5` + `D-S7` diputus PO — A → **8 Pending tersisa** (5 FLOW + 3 SCREEN). **Add-05 (17:15:33 WIB):** 5 keputusan itu naik ke **Ratified oleh PO** lewat `RATIF-SHELL-003` — **13 ratified, 8 Pending**. `D-DS1` **diratifikasi PO** lewat `RATIF-SHELL-002` (16:01:39 WIB). **Add-06 (17:38:27 WIB):** `D-F4`…`D-F8` + `D-S5`/`D-S6`/`D-S8` naik ke **Ratified oleh PO** lewat `RATIF-SHELL-004` — **21 ratified, 0 Pending**. Semua keputusan shell sudah diratifikasi; yang belum terjadi adalah ratifikasi kontrak & exit gate.

**Koreksi bukti `D-DS1` (Add-01):** klaim "hanya 2 file konsumen token" benar untuk *konsumen literal*, tetapi **tidak** menggambarkan *blast radius*. `tokens.css` memuat **16 deklarasi** `font-size: var(--font-size-*)` pada **selector global** yang dipakai 28 komponen `.tsx`; `tokens.ts` menyimpan mirror numerik untuk canvas ECharts; 14 baseline PNG ter-commit. Detail dan label `Confirmed / Likely / Suggestion` ada di kartu keputusan §2.

**Alat bantu sesi (arsip):** [RATIFICATION-SESSION-01.md](RATIFICATION-SESSION-01.md) memandu **7 keputusan bentuk shell** dengan mockup disposable di `prototypes/shell-v0/index.html` (mode "Panduan 7 keputusan"). Sesi ditutup 14:04 WIB; sembilan keputusan sisanya sengaja ditunda sampai bukti backend/QA tersedia. [Catatan jalannya sesi](DECISIONS-2026-11-08.md) kini berstatus ratified parsial. Worksheet **bukan** kontrak.

## Disiplin bukti

Setiap temuan/klaim dalam siklus G5–G6 wajib berlabel **Confirmed / Likely / Suggestion** dan merujuk kontrak, screenshot, test, atau lokasi sumber (`02-framework.md` §Evidence discipline). Kegagalan memuat data tidak boleh disajikan sebagai data kosong; test yang tidak dijalankan bukan PASS.
