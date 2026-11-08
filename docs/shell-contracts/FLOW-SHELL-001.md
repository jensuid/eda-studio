# FLOW-SHELL-001 — Flow Contract (Application Shell / End-to-End Journey)

**ID:** FLOW-SHELL-001 · **Status:** DRAFT v0.2 — **kontrak belum diratifikasi PO**; 3 keputusan di dalamnya sudah diratifikasi parsial (2026-11-08)
**Parent:** JOB-SHELL-001 (belum didraft; anchor G1 di bawah bersifat provisional) · Doc01 §5 · Doc07 §6.3 · Doc08 §3, §5, §10, §11, §12, §15 · DS-CORE-001
**Rigor:** Full (application-level layer + G1–G6) · **Kondisi:** G2 BELUM exit; `D-F1`/`D-F2`/`D-F3` = **Ratified oleh PO (2026-11-08)**, `D-F4`…`D-F8` masih Pending. **G5 dilarang dimulai.**
**Mengikat?** Sebagai kontrak: **tidak**. Tiga keputusan yang sudah diratifikasi **mengikat bentuk alur** lewat [RATIFICATION-RECORD-2026-11-08.md](RATIFICATION-RECORD-2026-11-08.md) §2. Lihat `README.md` — dokumen ini berada di folder terpisah supaya tidak tertukar dengan kontrak ratified di `docs/ux-contracts/`.

---

## Ratifikasi parsial PO — 2026-11-08 14:04 WIB

**Sumber:** [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) · **Cakupan:** 7 keputusan bentuk shell, 3 di antaranya milik kontrak ini (`D-F1`, `D-F2`, `D-F3`), semuanya **opsi A**.

| Yang berubah | Yang tidak berubah |
|---|---|
| `D-F1`, `D-F2`, `D-F3` kini **mengikat**; bunyi keputusannya ditranskrip ke §2.2, §2.3 step 9, §2.9, dan §Keputusan PO | Status kontrak tetap **DRAFT**; G2 belum exit; 5 keputusan FLOW + 4 keputusan SCREEN tetap Pending |
| Pasal yang memuat ketiga keputusan ditandai `[RATIFIED]` | `D-F8` (urutan Phase 0/1/2) tetap Pending → ratifikasi `D-F2`/`D-F3` **tidak** membuka pekerjaan Phase 1 |
| Rekomendasi DRAFT pada tiga baris tersebut naik menjadi keputusan | Tidak ada izin kode produksi, tidak ada perubahan IPC, tidak ada amandemen `generated.ts` |

Bila ada perbedaan wording antara badan kontrak dan [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) §2, **record ratifikasi yang menang**. Amandemen wajib lewat record baru, bukan perubahan diam-diam.

---

## G1 — Job anchor (provisional, menunggu JOB-SHELL-001)

- **job:** "Membawa satu dataset dari kondisi belum dikenal sampai laporan yang dapat dipertanggungjawabkan, tanpa kehilangan konteks kerja di antaranya."
- **actor:** Persona A (business analyst, non-teknis, sesekali, butuh arahan) dan Persona B (analis data, sering, ingin kontrol langsung) — Doc01 §3. Keduanya berbagi satu project/state (UX-001).
- **trigger:** Membuka aplikasi; menerima dataset baru; melanjutkan pekerjaan yang tertunda.
- **inputs:** project aktif, dataset/snapshot aktif, artefak hasil (profile/quality/readiness/…), status job.
- **desired_outcome:** pengguna selalu tahu (a) di mana posisinya, (b) apa langkah berikutnya, (c) apakah hasil yang dilihat masih berlaku.
- **success_signal:** task-based walkthrough Doc01 §11.1 ("Import → Snapshot → Profile → Assess Quality → Clean → Analyze → Visualize → Report") selesai tanpa bantuan backend manual **dan** tanpa bertanya "harus klik apa sekarang"; reload/back tidak menghilangkan konteks yang masih valid.
- **failure_cost:** pengguna mempercayai hasil yang sudah usang, mengira job gagal padahal sedang berjalan, atau mengulang pekerjaan karena tidak bisa menemukan/membuka proyeknya lagi.
- **not_in_scope:** AI interpretation, plugin marketplace, kolaborasi tim, cloud workspace, visual report builder, exhaustive statistics (Doc01 §10.3); **[RATIFIED D-F1]** Guided Mode penuh 10 stage — stepper yang dikontrakkan adalah 5 tahap bersinyal sah (§2.2).

---

## G2 — Flow Contract

### 2.1 Entry points

| ID | Entry | Precondition | Tujuan pertama |
|---|---|---|---|
| E1 | Cold start, tanpa proyek | `getProtocolInfo()` OK, `projectId == null` | `select-project` (Setup) |
| E2 | Cold start dengan autosave | `recoveryStatus().unclean_previous && has_autosave` | `recover` (banner pemulihan) **sebelum** `select-project` |
| E3 | Cold start dengan handshake gagal | `getProtocolInfo()` reject / revisi beda | `degraded` — shell tetap dirender, aksi backend dinonaktifkan dengan alasan |
| E4 | Kembali ke proyek yang sudah ada | **BLOCKED** — tidak ada `project.open` / `project.list` pada `ipcClient` (lihat §2.7) | menunggu D-F4 |
| E5 | Navigasi route | proyek/dataset aktif | `orient` pada route tujuan |
| E6 | Event job terminal | `getEvents` mengembalikan state terminal | `monitor` → `advance` |
| E7 | Reload / back / resize ≤900px | sesi berjalan | `resume` |

### 2.2 Peta stage → rute (Doc08 §5 ↔ `router.tsx:24-33`)

**Aturan utama:** status stage hanya boleh diturunkan dari sinyal yang benar-benar tersedia dan authoritative. Dilarang mengarang `Completed`/`In Progress` dari keberadaan tombol, dari klik pengguna, atau dari state lokal komponen.

| Stage Doc08 | Route | Sinyal yang tersedia saat ini | Status yang BOLEH ditampilkan |
|---|---|---|---|
| 1 Project Understanding | `setup` | `ProjectContext.projectId != null` | Not Started / Completed |
| 2 Data Ingestion | `setup` → `explorer` | `ProjectContext.dataset != null` | Not Started / Completed |
| 3 Structure & Profiling | `profiling` | `savedProfile != null` + `savedProfile.fingerprint == dataset.fingerprint` | + Stale saat fingerprint mismatch |
| 4 Data Quality | `quality` | `qualityRecord != null` + fingerprint | + Stale (pemeriksaan fingerprint **belum ada** di `QualityPage`) |
| 5 Cleaning & Preparation | `cleaning` | perubahan `dataset.fingerprint` + `dataset.snapshots.list` | Ready / "Ada snapshot baru"; **bukan** Completed tanpa `CleaningRecord` |
| 6 Univariate | `explorer` (histogram) | tidak ada record lintas-route (state lokal) | Not Started / Ready saja |
| 7 Relationship | `bivariate` | tidak ada record lintas-route | Not Started / Ready saja |
| 8 Anomaly & Pattern | **tidak ada route** | — | **Tidak ditampilkan** sebagai stage yang bisa diklik; dicatat sebagai gap, bukan ditutupi |
| 9 Hypothesis & Readiness | `readiness` | `readinessRecord != null` + fingerprint | + Stale (pemeriksaan fingerprint **belum ada**) |
| 10 Insights & Reporting | `report` | `ReportRecord` hanya state lokal `ReportSection` | Not Started / Ready saja |

**Dua vocabulary yang tidak boleh dicampur** (Doc08 §5.2 vs §10):
- **Workflow status** stepper: `Not Started | Ready | In Progress | Needs Attention | Completed | Blocked`.
- **Freshness** artefak: `Current | Stale | Failed | Blocked | Refresh Available`.
Status `Completed` tidak berarti hasil sempurna (Doc08 §5.2:198).

> **`[RATIFIED] D-F1` — Ratified oleh PO (2026-11-08), opsi A.** Stepper yang dikontrakkan adalah **5 tahap**: `1 Project Understanding` (Proyek), `2 Data Ingestion` (Dataset), `3 Structure & Profiling` (Profil), `4 Data Quality` (Kualitas), `9 Hypothesis & Readiness` (Kesiapan). Statusnya hanya boleh diturunkan dari sinyal pada tabel di atas. Tahap 6/7/10 ditandai **"Belum tersedia"** dan **tidak dapat diklik**; tahap 8 **tidak ditampilkan** sebagai stage, tetap dicatat sebagai gap. **Ditolak secara eksplisit:** stepper 10 stage penuh, status `In Progress` per tahap, persentase progres, dan status karangan. Bukti penerimaan yang masih wajib: tabel sinyal × status dan uji fingerprint mismatch. Ratifikasi ini **tidak** memutus `D-S8` maupun `D-F5`; keduanya tetap Pending. Sumber: [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) §2.

**Keterbatasan jujur (D-F5, D-S8):** `JobEvent` (`frontend/src/shared/ipc/generated.ts:52-59`) tidak membawa `command`, `progress`, atau timestamp. Maka:
- `In Progress` **tidak boleh** ditempelkan pada stage tertentu; shell hanya boleh menampilkan indikator global "Analisis sedang berjalan" dari `useJobPoller`.
- `Needs Attention` hanya boleh dari sinyal yang sah: fingerprint mismatch atau job state `Failed`/`Interrupted` yang tampil global.
- Progress di Job Center wajib **indeterminate** sampai backend mengekspos angka; `jobProgress()` (`JobClient.ts:39-60`, Running→70%) harus dihapus, bukan dipakai sebagai kontrak.

### 2.3 Steps

| # | id | purpose | preconditions | action | effect | feedback | next |
|---|---|---|---|---|---|---|---|
| 1 | `cold-start` | tentukan titik masuk | — | boot aplikasi | handshake protokol + `app.info` + `project.recovery.status` | status startup yang tidak berkedip; tidak ada flash "Belum ada job" | E1/E2/E3 |
| 2 | `select-project` | punya wadah kerja | handshake OK | isi nama → `project.create` | `projectId` tersimpan di konteks | project card + toast sukses; **inline validation** wajib (lihat §2.6) | `ingest` |
| 3 | `ingest` | dataset aktif | `projectId != null` | pilih file native → `dataset.import` | `dataset` tersimpan; snapshot immutable + fingerprint | dataset card di app bar/context panel: nama, baris, kolom, fingerprint pendek, status Aktif | `orient` |
| 4 | `orient` | pengguna tahu posisi & langkah | `dataset != null` | shell merender stepper + next-step CTA | tidak ada mutasi | stage status + satu CTA primer "Lanjut: …" yang menunjuk route paling awal yang `Ready`/`Blocked` | `run-stage` |
| 5 | `run-stage` | hasil analisis | gate fitur terpenuhi (kontrak fitur authoritative) | aksi di region fitur → command lewat `ipcClient` | job backend; **frontend tidak mengubah lifecycle** | status `role="status"` + kontrol disabled saat pending; job muncul di Job Center | `monitor` |
| 6 | `monitor` | pantau tanpa kehilangan konteks | job aktif | navigasi bebas antar route | job tetap berjalan (Doc07 §6.3:260-262); navigasi TIDAK membatalkan job | Job Center persisten, identitas job stabil | `advance` / `recover` |
| 7 | `advance` | lanjut tanpa menebak | hasil tersimpan & Current | klik next-step CTA | `navigate(route)` tanpa reset konteks | focus pindah ke `#main-content`, `aria-current` diperbarui | `run-stage` / `finish` |
| 8 | `recover` | tidak ada dead-end | error / stale / job gagal / konflik | ikuti CTA pemulihan | sesuai cabang §2.4 | cause + impact + saran + retry bila eligible (Doc08 §12.3) | `run-stage` / `orient` |
| 9 | `resume` | konteks bertahan | reload / back / resize | restore route + konteks, lalu revalidasi ke backend | tidak ada perubahan artefak | bila revalidasi gagal → `degraded`, bukan data kosong | `orient` |
| 10 | `finish` | hasil dipakai | report/pdf selesai | unduh / buka artefak | **BLOCKED** — belum ada kontrol unduh yang benar (§2.7) | menunggu kontrak baru | terminal |

> **`[RATIFIED] D-F2` — Ratified oleh PO (2026-11-08), opsi A (step 7 `advance`, E5/E7).** Routing wajib **hash + history stack**. `navigate` tetap diekspos lewat `useRouter` agar 28 komponen pemakai tidak berubah; item nav dirender sebagai `<a href="#…">` sesuai `SCREEN-SHELL-001` §3.4. Back/Forward mengembalikan route tanpa membatalkan job dan tanpa menghapus hasil. **Ditolak:** router state-only (`router.tsx` saat ini) dan rewrite router pihak ketiga saat RC. Bukti penerimaan: uji **reload** dan **Back/Forward** pada aplikasi nyata — screenshot prototipe bukan bukti.
>
> **`[RATIFIED] D-F3` — Ratified oleh PO (2026-11-08), opsi A (step 9 `resume`, E7).** Simpan **hanya** `{route, projectId, datasetId}` di `localStorage`. Saat boot, **wajib revalidasi ke backend** sebelum konteks ditampilkan; bila gagal → state `degraded` **beralasan**, bukan empty state dan bukan data kosong. **Dilarang** menyimpan record analisis (profile/quality/readiness/report), karena berisiko menyajikan artefak usang sebagai valid dan bertentangan dengan aturan fingerprint immutable. **Ditolak:** tanpa persistensi, dan opsi "simpan seluruh record". Bukti penerimaan: uji reload + **revalidasi gagal**.
>
> **Batas waktu pengerjaan:** kedua keputusan ini berada di Phase 1 (§2.8), sementara `D-F8` yang mengunci urutan Phase masih **Pending**. Ratifikasi bentuk **tidak** sama dengan otorisasi memulai Phase 1 atau menyentuh IPC. Sumber: [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) §2, §5.

### 2.4 Branches wajib (tidak boleh ada dead-end)

| Cabang | Pemicu | Perilaku yang disyaratkan |
|---|---|---|
| `no-project` | `projectId == null` | stepper tampil dalam keadaan `Not Started`; CTA tunggal "Buat proyek"; route lain boleh dibuka tetapi menampilkan empty-first-run + CTA ke Setup (bukan tombol disabled tanpa jalan keluar) |
| `no-dataset` | `projectId != null`, `dataset == null` | CTA "Impor dataset"; gate fitur mengikuti kontrak fitur masing-masing |
| `gate-blocked` | prasyarat fitur belum terpenuhi | teks alasan + tombol **"Ke …"** menuju prasyarat. Dilarang hanya `<button disabled>` (kondisi saat ini: `BivariateSection.tsx:54-58`, `ReportSection.tsx:39-43`, `PdfSection.tsx:53-57`) |
| `stale` | `artifact.fingerprint != dataset.fingerprint` | tampilkan: alasan, dependency yang berubah, dampak, rekomendasi refresh, **persetujuan pengguna sebelum refresh** (Doc08 §10, UX-008). Artefak lama tetap dapat diakses. Berlaku **semua** artefak, termasuk Quality & Readiness yang saat ini tidak memeriksa fingerprint |
| `job-running` | job belum terminal | navigasi bebas; progress indeterminate; tidak ada auto-retry |
| `job-failed` | state `Failed`/`Interrupted` | error + "Coba lagi" hanya bila backend menyatakan eligible; tautan ke konteks asal job |
| `job-cancelled` | state `Cancelled` | tampilkan hasil authoritative backend, bukan status hasil klik cancel (Doc08 §11.3:522) |
| `load-failed` | `getEvents`/query gagal | **"Daftar job tidak dapat dimuat" + Coba lagi** — dilarang menyamarkan sebagai "Belum ada job." (Doc08 §11.1:485; `JobClient.ts:79-81` saat ini swallow error) |
| `protocol-mismatch` | revisi protokol beda | banner persisten khusus protokol; aksi backend dinonaktifkan dengan alasan; bukan banner error umum |
| `backend-unavailable` | bridge/backend absen | mode `degraded`: UI tetap dapat dinavigasi, setiap aksi backend menampilkan alasan; polling diberi backoff |
| `recovery-available` | E2 | banner pemulihan dengan fokus jelas dan escape "Tutup"; memulihkan ke root baru, tidak menimpa proyek aktif (perilaku `App.tsx:186-201` dipertahankan, `role="alertdialog"` diperbaiki di SCREEN) |
| `crash-render` | ErrorBoundary menangkap | copy generik (bukan `error.message`), "Kembali ke Setup" + "Coba lagi"; retry tidak boleh loop pada crash deterministik |
| `update-check-failed` | `app.update.check` gagal | pesan di region versi saja; **tidak boleh** muncul sebagai kegagalan protokol |
| `context-switch` | dataset/snapshot berubah saat ada draft | konfirmasi atau preservasi draft (Doc08 §15:658); setelah aktivasi snapshot, semua artefak turunan ditandai stale |
| `resize-900` | lebar ≤900px | semua region tetap **terjangkau** (drawer), tidak ada `display:none` pada region berisi status/aksi |
| `unknown-route` | hash/route tidak dikenal | fallback ke Setup + pesan; tidak ada layar kosong |

### 2.5 Feedback global (D-F6)

Satu kanal error untuk semua concern adalah cacat yang dikonfirmasi (`App.tsx:59` memakai `protocolError` untuk handshake, recovery, **dan** update check). Kontrak:

| Concern | Kanal | Dismiss | Prioritas |
|---|---|---|---|
| Protokol / backend | banner persisten di app bar | tidak bisa di-dismiss sampai sembuh | critical |
| Pemulihan crash | banner di main, sebelum konten route | "Tutup" | warning |
| Versi / update | region versi saja | ya | info |
| Job lifecycle | Job Center (satu-satunya rekam jejak) | tidak | sesuai status |
| Aksi fitur | toast non-blocking + inline `role="alert"` pada region fitur | ya | success/error |
| Render crash | ErrorBoundary per-route | "Coba lagi" / "Kembali ke Setup" | critical |

- Error copy **di-branch berdasarkan `error.code`**, bukan `error.message` mentah (`ipcClient.ts:137-139`). Pesan backend boleh ditaruh di detail diagnostik yang bisa disalin, bukan di kalimat utama.
- Notifikasi job membawa stable job id dan membuka detail/konteks; dismiss tidak mengubah job (Doc08 §12.2).
- Dedup berbasis identity/correlation id, bukan kesamaan teks; toast bukan satu-satunya rekam jejak peristiwa penting.

### 2.6 Aturan validasi & konfirmasi lintas-route

- Form wajib menampilkan inline error + `aria-invalid` + `aria-describedby`; `required: true` tanpa `formState.errors` (`ProjectSetup.tsx:110,143`) adalah **defek**, bukan desain.
- Submit ganda dicegah saat mutation pending; input valid dipertahankan setelah kegagalan yang bisa dipulihkan (`10-interaction-and-accessibility.md` §Forms).
- Aksi destruktif mengikuti kontrak fitur (SCREEN-CLEAN-001) — shell tidak mendefinisikan ulang dan tidak menambah lapisan konfirmasi.

### 2.7 Ketergantungan backend yang BELUM tersedia (jangan dikarang di UI)

Daftar ini diverifikasi terhadap `frontend/src/shared/ipc/ipcClient.ts` (daftar command per 2026-11-08):

| Kebutuhan flow | Status | Konsekuensi kontrak |
|---|---|---|
| `project.open` / `project.list` / daftar proyek terakhir | **tidak ada** (hanya `project.create`) | E4 diblokir. D-F4 memutuskan apakah RC menambahkannya. **Pydantic dulu** di `backend/contracts.py`, lalu `tools/generate_types.py`; `generated.ts` tidak boleh di-hand-edit |
| `JobEvent.command`, `.progress`, `.started_at` | **tidak ada** | stepper `In Progress` per-stage, progress determinate, elapsed, dan invalidasi query tertarget tidak mungkin. Sementara: indeterminate, indikator global, `invalidateQueries()` boleh dipakai tetapi wajib dicatat sebagai utang performa |
| `job.cancel` / `job.retry` | **tidak ada** | Job Center tidak boleh menampilkan tombol Cancel/Retry yang palsu; Doc08 §11.3 menuntut hasil authoritative |
| Buka/unduh artefak (shell.reveal / save-as) | **tidak ada**; `PdfSection.tsx:43` memakai path filesystem mentah sebagai `a.href` | `finish` diblokir; copy "siap diunduh" tanpa kontrol adalah dead-end (`ReportSection.tsx:74-78`) |
| Status artefak lintas-route (histogram, bivariate, report) | state lokal komponen | stage 6/7/10 tidak boleh dilabeli `Completed` (§2.2) |

### 2.8 Urutan rilis yang diusulkan (D-F8)

- **Phase 0 — frontend-only, tanpa perubahan kontrak IPC:** kanal error, copy, validasi, gate CTA, stale lintas-route untuk Quality/Readiness, progress indeterminate, load-failed, 900px, seeded state fixtures. Semua bisa dikerjakan dengan 4 bridge methods yang ada.
- **Phase 1 — butuh keputusan PO + amandemen kontrak:** stepper + next-step CTA + urutan nav, router hash/history + resume, recent projects, ekstensi `JobEvent`, kontrol unduh/buka artefak.
- **Phase 2 — post-MVP:** Guided/Advanced penuh, stage 6/8/10, notification center, scoped invalidation, command palette.

> **`[CATATAN RATIFIKASI 2026-11-08]`** `D-F2` dan `D-F3` sudah diratifikasi PO, tetapi keduanya berada di Phase 1 sementara **`D-F8` (urutan Phase) masih Pending**. Karena itu urutan di atas tetap **usulan**, dan ratifikasi bentuk router/resume **belum** mengizinkan pekerjaan Phase 1 maupun perubahan IPC. Sampai `D-F8` diputus, Phase 0-lah satu-satunya yang boleh direncanakan.

### 2.9 completion, cancel_and_back, resume

- **completion:** laporan/artefak dapat diakses; stepper menampilkan status akhir yang jujur; tidak ada artefak yang diklaim Current padahal stale.
- **cancel_and_back:** cancel adalah *user intent* ke backend, bukan transisi lokal; Back/Forward mengembalikan route tanpa membatalkan job, tanpa menghapus hasil, tanpa kehilangan dataset aktif. Navigasi tidak pernah memicu command domain.
- **resume:** `[RATIFIED D-F3, 2026-11-08]` route + `projectId` + `datasetId` dipulihkan dari `localStorage` (hanya ketiga field itu), namun **wajib direvalidasi** ke backend sebelum ditampilkan; bila gagal → `degraded` dengan alasan, bukan empty state. Record analisis tidak disimpan. Tidak ada data yang ditulis ulang saat resume. Back/Forward mengikuti `[RATIFIED D-F2]` di §2.3.

---

## Keputusan PO

**Record ratifikasi:** [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) — 3 dari 8 keputusan FLOW **diratifikasi PO pada 2026-11-08 14:04 WIB** (opsi A). Lima sisanya **Pending**. Ratifikasi parsial ini tidak menaikkan status kontrak.

| ID | Pertanyaan | Isi keputusan / rekomendasi | Status |
|---|---|---|---|
| D-F1 | Stepper 10 stage penuh atau minimal? | **5 stage bersinyal sah (1,2,3,4,9)**; sisanya "Belum tersedia" dan tidak diklik; stage 8 tidak ditampilkan | ✅ **Ratified oleh PO (2026-11-08)** — A · mengikat §2.2 |
| D-F2 | Router state-only atau hash + history? | **Hash routing + history stack**; `navigate` tetap lewat `useRouter` agar 28 komponen tidak berubah; nav `<a href="#…">` | ✅ **Ratified oleh PO (2026-11-08)** — A · mengikat §2.3 |
| D-F3 | Persistensi konteks saat reload | Simpan **hanya** `{route, projectId, datasetId}` di localStorage; **wajib revalidasi** ke backend; gagal → `degraded` beralasan | ✅ **Ratified oleh PO (2026-11-08)** — A · mengikat §2.3, §2.9 |
| D-F4 | `project.open` / recent projects masuk RC? | **Beta (Phase 1)**, bukan RC; RC hanya memperbaiki alur "buat proyek baru" | ☐ Pending |
| D-F5 | Ekstensi `JobEvent` | Tambah `command`, `progress?`, `started_at?`, `finished_at?` di Pydantic; **tidak** di frontend dulu | ☐ Pending — prasyarat `D-S8` |
| D-F6 | Kanal error global | Pisahkan per concern sesuai §2.5; satu `protocolError` dihapus | ☐ Pending |
| D-F7 | Stale lintas-route | Semua artefak memeriksa fingerprint; refresh hanya setelah persetujuan pengguna; CTA menyebut dependency | ☐ Pending |
| D-F8 | Urutan Phase 0/1/2 | Phase 0 dulu (tanpa IPC), Phase 1 setelah PO + kontrak | ☐ Pending — **mengunci kapan D-F2/D-F3 boleh dikerjakan** |

### Bunyi keputusan yang mengikat (3 baris ratified)

| ID | Disetujui | Ditolak secara eksplisit | Bukti penerimaan yang belum ada |
|---|---|---|---|
| `D-F1` | Stepper 5 tahap (Proyek, Dataset, Profil, Kualitas, Kesiapan), status hanya dari sinyal sah | Stepper 10 stage penuh, `In Progress` per tahap, persentase, stage 8, status karangan | Tabel sinyal × status; uji fingerprint mismatch |
| `D-F2` | Hash routing + history stack; `useRouter` dipertahankan; Back/Forward tidak membatalkan job | Router state-only; rewrite router pihak ketiga saat RC | Uji reload + Back/Forward |
| `D-F3` | Persist 3 field + revalidasi wajib + `degraded` beralasan saat gagal | Tanpa persistensi; menyimpan record analisis; empty state saat revalidasi gagal | Uji reload + revalidasi gagal |

**Catatan:** `D-F1` tidak memutus `D-S8` maupun `D-F5`. `D-F2`/`D-F3` tidak memutus `D-F8`. Menyetujui A tidak diam-diam menyetujui keputusan yang bergantung padanya.

## Exit G2 (belum terpenuhi)

- [ ] JOB-SHELL-001 didraft dan diratifikasi.
- [ ] D-F4…D-F8 diputuskan PO dan ditandatangani — **`D-F1`/`D-F2`/`D-F3` ✅ sudah (2026-11-08); 5 tersisa, kotak ini tetap belum dicentang**.
- [ ] Bukti penerimaan untuk 3 keputusan ratified tersedia (reload, Back/Forward, revalidasi gagal, tabel sinyal × status).
- [ ] Setiap entry point punya exit; setiap cabang §2.4 punya recovery; tidak ada dead-end.
- [ ] Tidak ada status yang diturunkan dari data yang tidak tersedia (§2.2/§2.7).
- [ ] Dampak ke kontrak fitur ratified dinilai (terutama SCREEN-CLEAN-001 stale copy & FLOW-CLEAN-001 step 7).
- [ ] Independent Critic (G5) dijadwalkan dengan konteks segar.

## Traceability

| Alur | SCREEN-SHELL-001 | Bukti yang harus ada di QA-SHELL-001 |
|---|---|---|
| E1/E2/E3 startup | R1, R6 | screenshot 1440/900 + simulasi handshake gagal |
| §2.2 stage status | R3 | tabel status × sinyal, uji fingerprint mismatch |
| §2.4 stale / gate / load-failed | R3, R4, R6 | seeded fixtures per state, bukan `data:null` |
| §2.5 kanal error | R6 | satu uji per concern, assert tidak ada cross-contamination |
| §2.9 resume | R1–R5 | reload/back/resize walkthrough |
