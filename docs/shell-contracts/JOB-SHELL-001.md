# JOB-SHELL-001 — Job Contract (Application Shell / End-to-End Journey, G1)

**ID:** JOB-SHELL-001 · **Status:** DRAFT v0.1 — **belum diratifikasi PO** (2026-11-08)
**Parent:** Doc01 §3 (persona), §5 (10 stage), §11.1 (acceptance end-to-end) · Doc08 §2 (prinsip), §3 (experience architecture), §5 (guided workflow), §19 (deferred) · Doc07 §6.3 (navigation principles) · [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) (7 keputusan, **mengikat**) · [FLOW-SHELL-001](FLOW-SHELL-001.md) §G1 provisional
**Rigor:** Full (application-level layer, G1) · **Kondisi:** G1 BELUM exit; **0 Pending** — `D-F4`…`D-F8` / `D-S5`/`D-S6`/`D-S8` **diratifikasi PO (17:38:27 WIB, `RATIF-SHELL-004`)**. `D-DS1`…`D-DS5` + `D-S7` **diratifikasi PO (17:15:33 WIB, `RATIF-SHELL-003`)**. **G5 dilarang dimulai; tidak ada izin kode produksi.**
**Mengikat?** Sebagai kontrak: **tidak**. Yang mengikat adalah 7 keputusan di [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) §2, ditandatangani digital `SIG-SHELL-2026-11-08-01`.

> **Fungsi dokumen ini:** menggantikan **anchor G1 provisional** di `FLOW-SHELL-001` §G1 dengan Job Contract lengkap sesuai templat `contract_first_ui_v2/docs/03-artifact-templates.md` §2. Mengganti anchor **bukan** meratifikasi anchor. Bila ada beda wording, **record ratifikasi yang menang** untuk 7 keputusan; untuk hal lain dokumen ini yang menjadi rujukan DRAFT.

---

## 1. G1 — Job Contract

```yaml
job: "Membawa satu dataset dari kondisi belum dikenal sampai laporan yang dapat dipertanggungjawabkan, tanpa kehilangan konteks kerja di antaranya"

actor: "Satu pengguna lokal per workspace (single-user desktop, Doc01 §3.2): Persona A = business analyst non-teknis, sesekali, membutuhkan arahan; Persona B = analis data, sering, menginginkan kontrol langsung. Keduanya berbagi SATU project, SATU engine, dan SATU state (UX-001) — perbedaannya hanya kompleksitas interaksi, bukan kapabilitas analitik. Volume CSV/XLSX/Parquet kecil–menengah."

trigger: "Membuka aplikasi (cold start); menerima dataset baru; melanjutkan pekerjaan yang tertunda; atau kembali dari event job terminal."

frequency: "Berkesinambungan selama satu sesi proyek; dapat dijeda, di-reload, dan dilanjutkan. Bukan job satu-kali per tombol — ini job tingkat PERJALANAN, bukan job tingkat fitur."

inputs:
  - "Project aktif (projectId) dan identitas dataset/snapshot aktif"
  - "Artefak hasil: ProfileRecord, QualityRecord, ReadinessRecord, CleaningRecord, ReportRecord — masing-masing dengan fingerprint SHA-256"
  - "Status job backend yang authoritative (JobState / JobEvent lewat ipcClient)"
  - "Status protokol / pemulihan (getProtocolInfo, recoveryStatus)"
  - "Konteks navigasi: route aktif dan 3 field yang dipulihkan (D-F3: route, projectId, datasetId)"

desired_outcome: "Pengguna setiap saat dapat menjawab tiga pertanyaan tanpa membaca isi tiap fitur: (a) di mana posisinya dalam alur, (b) apa langkah berikutnya yang sah, (c) apakah hasil yang sedang dilihat masih berlaku bagi snapshot aktif. Konteks kerja bertahan saat berpindah route, saat job berjalan di latar, dan saat aplikasi di-reload/back (dengan revalidasi ke backend)."

success_signal: >-
  Walkthrough berbasis tugas Doc01 §11.1 ("Import → Snapshot → Profile → Assess Quality → Clean → Analyze → Visualize → Report")
  selesai tanpa bantuan backend manual, tanpa satu pun pertanyaan "harus klik apa sekarang", dan tanpa hasil usang yang
  ditampilkan sebagai masih berlaku. Reload dan Back tidak menghilangkan konteks yang masih valid; konteks yang sudah
  tidak valid ditolak dengan alasan yang dapat ditindaklanjuti, bukan diam-diam direset.
  Diuji dengan seeded fixtures per state, BUKAN screenshot empty state.

failure_cost: >-
  Pengguna mempercayai hasil yang sudah usang (fingerprint mismatch tidak terdeteksi), mengira job gagal padahal sedang
  berjalan, mengulang pekerjaan karena tidak bisa membuka kembali proyeknya (tidak ada project.open / project.list),
  atau kehilangan kepercayaan karena progress bar menampilkan angka karangan. Biayanya bukan sekadar inefisiensi:
  pada EDA, kesimpulan yang diambil dari artefak stale adalah KESIMPULAN YANG SALAH dan dapat dipakai untuk keputusan bisnis.

not_in_scope:
  - item: "Guided Mode penuh 10 stage, status In Progress per stage, dan persentase progres"
    reason: "D-F1 (Ratified, opsi A) secara eksplisit menolaknya. Stepper shell = 5 tahap bersinyal sah; tahap 6/7/10 'Belum tersedia' tidak dapat diklik; tahap 8 tidak ditampilkan dan dicatat sebagai gap. Sinyal In Progress tidak tersedia karena JobEvent tidak membawa command/progress/timestamp (D-F5, D-S8 diratifikasi PO — A 17:38:27 WIB; nilai belum tersedia sampai kontrak backend diimplementasikan)."
  - item: "Perhitungan statistik, rekomendasi analisis, atau interpretasi AI"
    reason: "Milik engine dan kontrak fitur; AI bukan source of truth (AI-013/014). Shell hanya memproyeksikan status dan menyediakan navigasi."
  - item: "Lifecycle job: create/cancel/retry/transisi status, auto-retry, progress determinate"
    reason: "Backend-authoritative (SYS-015, Doc05 §8.2). Frontend dilarang mengarang status; jobProgress() (JobClient.ts:39-60, Running→70%) harus dihapus, bukan dijadikan kontrak. Progress wajib indeterminate sampai backend mengekspos angka (D-F5 diratifikasi PO — A, Pydantic-dulu).
  - item: "Membuka / mendaftar proyek yang sudah ada (project.open, project.list)"
    reason: "Tidak ada pada ipcClient. E4 di FLOW-SHELL-001 §2.1 berstatus BLOCKED; D-F4 diratifikasi PO — A (Beta/Phase 1, bukan RC). Dilarang mengarang solusi sementara."
  - item: "Kolaborasi tim, cloud workspace, plugin marketplace, visual report builder, exhaustive statistics"
    reason: "Doc01 §10.3 — di luar MVP. Doc07 §6.2 / Doc08 §4.1 mencantumkan grup Extensions & Settings yang TIDAK tersedia di RC; lihat APP-ARCH-001 §3 untuk divergensi yang didokumentasikan."
  - item: "Keputusan copy lintas-route, shortcut global, toleransi visual regression"
    reason: "Diratifikasi PO — A sebagai D-S5 (satu modul copy shell), D-S6 (Esc wajib, Cmd+K Phase 2), D-S7 (fixtures + <=5%). Shell tidak boleh mengarang label, shortcut, atau ambang kualitas."
```

---

## 2. Batas terhadap Job Contract fitur yang sudah ratified

Ini sumber kebingungan yang paling mungkin terjadi, jadi ditegaskan: **JOB-SHELL-001 tidak menggantikan, tidak menimpa, dan tidak menurunkan** JOB kontrak fitur.

| | Job fitur (sudah ratified) | Job shell (dokumen ini, DRAFT) |
|---|---|---|
| Contoh | [JOB-CLEAN-001](../ux-contracts/cleaning/JOB-CLEAN-001.md), `JOB-FLOW-SCREEN-PROF.md` | `JOB-SHELL-001` |
| Unit kerja | Satu operasi analitik: cleaning, profiling, quality | Seluruh perjalanan satu dataset |
| Trigger | Gate fitur terpenuhi, user klik aksi di R4 | Buka aplikasi / dataset baru / lanjut sesi |
| Selesai ketika | `CleaningRecord` / `ProfileRecord` tersimpan dengan provenance | Laporan dapat dipertanggungjawabkan; konteks tidak pernah hilang |
| Sumber kebenaran | Kontrak fitur + record backend | 7 keputusan ratified + sinyal backend |
| Region | R4 (Main Workspace) | R1, R2, R3, R5, R6, R7 |
| Status saat ini | **Approved** (`docs/status-register.md`) | **DRAFT v0.1** |

**Aturan benturan:** bila ketentuan shell bertabrakan dengan kontrak fitur ratified di dalam R4, **kontrak fitur yang menang**, dan benturannya dicatat sebagai amandemen yang harus diputus PO — bukan ditimpa diam-diam.

---

## 3. Keputusan yang sudah mengikat (transkrip, bukan keputusan baru)

Dokumen ini **tidak menambah satu pun keputusan PO**. Berikut 7 keputusan yang sudah `Ratified oleh PO (2026-11-08 14:04 WIB)` dan relevan dengan G1; bunyi sahnya ada di [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) §2.

| ID | Isi ringkas | Jejak di kontrak ini |
|---|---|---|
| `D-F1` | Stepper 5 tahap, hanya dari sinyal sah; tolak 10 stage / `In Progress` / persentase | §1 `not_in_scope`, §1 `desired_outcome` |
| `D-F2` | Router **hash + history stack**, `navigate` tetap lewat `useRouter` | §1 `inputs` (konteks navigasi), §5 |
| `D-F3` | Simpan **hanya** `{route, projectId, datasetId}` di `localStorage`, **wajib revalidasi backend** | §1 `trigger` / `success_signal`, §5 |
| `D-S1` | 7 grup / 9 item; Pembersihan sebelum Hubungan; utilitas → Tools | §1 `not_in_scope` (batas modul) |
| `D-S2` | Bahasa Indonesia konsisten, satu register copy | Seluruh copy kontrak ini |
| `D-S3` | 900px: rail berlabel + drawer Job Center | §5 (bukti aksesibilitas) |
| `D-S4` | Skala 24/18/15/14/12, kontrol 36px, 8 state — **butuh G4 ratified** | §5 (prasyarat bukti visual) |

> **Jangan mencampur dua vocabulary** (Doc08 §5.2 vs §10): **workflow status** = `Not Started | Ready | In Progress | Needs Attention | Completed | Blocked`; **freshness artefak** = `Current | Stale | Failed | Blocked | Refresh Available`. `Completed` tidak berarti hasil sempurna.

---

## 4. Ketergantungan yang belum tersedia (Confirmed, bukan izin perbaikan)

| Ketergantungan | Bukti | Keputusan pengunci |
|---|---|---|
| `project.open` / `project.list` tidak ada di `ipcClient` | `frontend/src/shared/ipc/ipcClient.ts`; `ProjectSetup.tsx` hanya `project.create` | `D-F4` **Ratified oleh PO — A (17:38:27 WIB)** — Beta/Phase 1 |
| `JobEvent` tanpa `command` / `progress` / timestamp | `frontend/src/shared/ipc/generated.ts:52-59` | `D-F5`, `D-S8` **Ratified oleh PO — A (17:38:27 WIB)** — Pydantic-dulu; nilai belum tersedia |
| Kanal error global masih satu `protocolError` untuk 3 concern | `App.tsx` | `D-F6` **Ratified oleh PO — A (17:38:27 WIB)** — kanal per concern |
| Cek fingerprint belum ada di `QualityPage` / `ReadinessPage` | `FLOW-SHELL-001` §2.2 | `D-F7` **Ratified oleh PO — A (17:38:27 WIB)** — fingerprint + CTA refresh |
| Urutan Phase 0 / 1 / 2 | `FLOW-SHELL-001` §2.8 | `D-F8` **Ratified oleh PO — A (17:38:27 WIB)** — Phase 0 dulu, Phase 1 setelah PO + kontrak — **mengunci kapan `D-F2`/`D-F3` boleh dikerjakan** |
| `ProjectContext` frontend-only, tidak persist | `frontend/src/app/ProjectContext.tsx` | `D-F3` (bentuk sudah sah, jadwal belum) |

**Batas keras yang tidak boleh dilemahkan kontrak ini:** `generated.ts` di-GENERATE dari Pydantic, bukan hand-edit; frontend hanya lewat `ipcClient`; job lifecycle backend-authoritative; default-deny / fail-closed (SEC-004); tidak ada whole-DataFrame JSON lewat IPC (preview ≤ 200, scatter ≤ 1500, bin ≤ 30); WCAG 2.2 AA dan min window 900px **bukan** deferred; snapshot immutable dengan fingerprint SHA-256.

---

## 5. Bukti yang wajib ada sebelum G1 diajukan ratifikasi

| # | Bukti | Status |
|---|---|---|
| B1 | Walkthrough berbasis tugas Doc01 §11.1 dengan **seeded fixtures**, direkam pada 900px dan 1440px | ☐ Belum ada — `helpers.ts` masih `data:null` |
| B2 | Tabel **sinyal × status**: tiap status stepper ditelusur ke satu sinyal authoritative | ☐ Belum ada |
| B3 | Uji **fingerprint mismatch** → artefak tampil `Stale`, bukan `Current` | ☐ Belum ada |
| B4 | Uji **reload / Back / revalidasi gagal** untuk `D-F2` + `D-F3` (screenshot tidak cukup untuk arsitektur) | ☐ Belum ada |
| B5 | Uji aksesibilitas 900px: rail berlabel, drawer, focus return, `Esc`, skip link | ☐ Belum ada |
| B6 | Uji job tetap berjalan saat navigasi; progress **indeterminate**; `jobProgress()` dihapus | ☐ Belum ada |
| B7 | 8 state kontrol × 3 kontrol × 2 viewport + pengukuran kontras nyata (G4) | ☐ Menunggu `D-DS1`…`D-DS4` |
| B8 | Independent Critic (G5) dengan **konteks segar**, temuan berlabel `Confirmed / Likely / Suggestion` | ✅ **Laporan diterima 2026-11-08** ([G5-CRITIC-REPORT-2026-11-08.md](G5-CRITIC-REPORT-2026-11-08.md)): 8 temuan (2 High G5-01/G5-02, 2 Medium, 4 Low/Suggestion); verdict advisory APP-ARCH/JOB/DS/QA PASS, FLOW/SCREEN FAIL bersyarat (transkrip usang — koreksi via addendum). G5 PASS formal menunggu disposition PO (Add-09); **G6 tetap blocked sampai B1–B12 dieksekusi** |

**Disiplin:** kegagalan memuat data tidak boleh disajikan sebagai data kosong; **test yang tidak dijalankan bukan PASS**; screenshot prototipe disposable `prototypes/shell-v0/` **bukan** bukti penerimaan.

---

## 6. Exit G1 (belum terpenuhi)

- [ ] PO meratifikasi `JOB-SHELL-001` sebagai kontrak (bukan sekadar keputusan di dalamnya).
- [x] `D-F4`…`D-F8` sudah **diratifikasi PO — A (17:38:27 WIB, `RATIF-SHELL-004`)**, termasuk **`D-F8`** yang mengunci urutan Phase. Kotak tetap belum dicentang karena ratifikasi kontrak belum terjadi.
- [ ] B1–B6 tersedia dan terverifikasi.
- [ ] Tidak ada benturan tanpa amandemen dengan JOB kontrak fitur ratified (§2).
- [ ] [APP-ARCH-001](APP-ARCH-001.md), `FLOW-SHELL-001`, `SCREEN-SHELL-001`, `DS-SHELL-001`, `QA-SHELL-001` (DRAFT v0.1, Add-07) tersedia dan konsisten.
- [ ] G5 Independent Critic PASS dengan konteks segar.

---

## 7. Traceability

| Sumber | Bagian kontrak ini |
|---|---|
| Doc01 §3.1–§3.2 | §1 `actor`, §2 (satu state bersama) |
| Doc01 §5, §11.1 | §1 `desired_outcome`, `success_signal`; §5 B1 |
| Doc08 §2, §5.2, §10 | §1 `failure_cost`; §3 vocabulary |
| Doc08 §19 (Deferred) | §1 `not_in_scope` — layout per layar & Job Center masih Deferred |
| Doc07 §6.3 | §1 `trigger` (navigasi tidak membatalkan job), §5 B4/B6 |
| `RATIF-SHELL-001` §2 | §3 (7 keputusan mengikat) |
| `FLOW-SHELL-001` §G1, §2.1, §2.2 | §1, §4 — anchor provisional kini digantikan |
| `DS-CORE-001` | §4 batas keras (AA, 900px) |

---

**Status akhir:** DRAFT v0.1. Dokumen ini **melengkapi prasyarat *draft* G1**, bukan prasyarat *ratifikasi* G1. Tidak ada kode produksi, tidak ada perubahan IPC, dan tidak ada keputusan PO baru yang diizinkan.
