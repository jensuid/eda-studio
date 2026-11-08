# Sesi Ratifikasi — 7 Keputusan Bentuk Shell

**Status:** ALAT BANTU SESI / ARSIP — **bukan** kontrak. **SESI DITUTUP & DITANDATANGANI DIGITAL:** 7 keputusan diratifikasi PO **2026-11-08 14:04 WIB**, ditandatangani digital **2026-11-08 14:23:54 WIB** (`SIG-SHELL-2026-11-08-01`, lihat §8).
**Tanggal:** 2026-11-08 · **Pemilik keputusan:** Product Owner · **Fasilitator:** ____________ · **Pencatat:** ____________
**Durasi:** 45–60 menit · **Bahan:** `prototypes/shell-v0/index.html` (DISPOSABLE)
**Ruang lingkup:** 7 dari 16 keputusan yang menentukan **bentuk shell**. Sembilan sisanya ditunda (lihat §5).
**Catatan berjalan:** [DECISIONS-2026-11-08.md](DECISIONS-2026-11-08.md) · **Record autoritatif:** [RATIFICATION-RECORD-2026-11-08.md](RATIFICATION-RECORD-2026-11-08.md) · **Sidik jari integritas:** `SIGNATURE-MANIFEST-2026-11-08.sha256`.

> **Urutan paraf (penting untuk audit):** (1) pilihan disampaikan 13:02 & 13:10 WIB; (2) pengesahan PO lewat chat 14:04 WIB; (3) **tanda tangan digital PO 14:23:54 WIB** pada lembar ini. Tujuh kolom `Paraf PO` di §4.1–§4.7 kini merujuk ke `SIG-SHELL-2026-11-08-01` — itu **bukan** tanda tangan hasil rekaan, melainkan penunjuk ke blok tanda tangan §8 yang sah. Untuk bunyi keputusan yang mengikat, tetap rujuk [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) §2.

---

## 1. Tujuan sesi

Mengunci tujuh keputusan yang tidak bisa dinilai dari tabel prosa: cakupan stepper, router, pemulihan konteks, grup navigasi, locale, perilaku 900px, dan skala tipografi. **Hasil aktual:** tujuh keputusan **diratifikasi PO via chat 14:04 WIB** (semua opsi A), ditranskrip ke `FLOW-SHELL-001` v0.2 dan `SCREEN-SHELL-001` v0.2, dan dicatat di `RATIFICATION-RECORD-2026-11-08.md`.

Yang **bukan** tujuan sesi — dan **tetap tidak tercapai**: menyetujui implementasi, meratifikasi kontrak utuh, membuka G5, atau memutuskan perubahan IPC/backend.

## 2. Persiapan (5 menit)

1. Buka `prototypes/shell-v0/index.html` di browser (tanpa server).
2. Klik **"Panduan 7 keputusan"** pada toolbar → panel sesi muncul di atas frame.
3. Pastikan banner merah `DISPOSABLE PROTOTYPE — NOT FOR PRODUCTION` terlihat.
4. Di panel, tiap keputusan punya tombol **"Tampilkan di mockup"** yang mengatur viewport, state, dan menyorot region yang relevan. Tombol yang sama bisa diganti manual lewat fragmen URL di `prototypes/shell-v0/README.md`.

## 3. Aturan main (bacakan di awal)

1. **Hanya PO yang memutuskan.** Kolom "Rekomendasi" adalah usulan fasilitator, bukan hasil.
2. **Buktikan dari mockup.** Untuk tiap keputusan, sebutkan apa yang benar-benar terlihat. Label bukti: `Confirmed` (terlihat/teruji), `Likely` (inferensi), `Suggestion` (opini).
3. **"Tunda" sah**, tetapi wajib ditulis bukti apa yang kurang dan kapan diputus kembali.
4. **Menyetujui visual ≠ menyetujui kode.** Prototipe ini DISPOSABLE, bukan G5 slice, bukan referensi implementasi. Tidak ada kode UI produksi sampai 16 keputusan diratifikasi, gate yang hilang ditutup, dan Independent Critic (G5) PASS.
5. **`Baseline Freeze v1.0` tetap berlaku.** Baris yang tidak disebut dalam register tidak naik statusnya.
6. Catat **dissent** apa adanya. Keputusan bulat tanpa catatan sering berarti pertanyaan belum benar-benar diajukan.

## 4. Urutan dan ringkasan

| # | ID | Pertanyaan | Fragmen | Rekomendasi | Keputusan PO (14:04 WIB) |
|---|---|---|---|---|---|
| 1 | `D-F1` | Stepper 10 stage penuh atau minimal? | `#stepper` | **A** — 5 stage bersinyal nyata | ✅ **A — Ratified oleh PO** |
| 2 | `D-F2` | Router state-only atau hash + history? | `#normal` | **A** — hash routing + history | ✅ **A — Ratified oleh PO** |
| 3 | `D-F3` | Strategi pemulihan konteks saat reload? | `#normal` | **A** — persist + revalidasi | ✅ **A — Ratified oleh PO** |
| 4 | `D-S1` | Grup & urutan navigasi final? | `#annotate` | **A** — 7 grup / 9 item | ✅ **A — Ratified oleh PO** |
| 5 | `D-S2` | Locale tunggal mana? | `#normal` | **A** — Bahasa Indonesia | ✅ **A — Ratified oleh PO** |
| 6 | `D-S3` | Perilaku 900px? | `#900-drawer` | **A** — rail berlabel + drawer | ✅ **A — Ratified oleh PO** |
| 7 | `D-S4` | Skala tipografi & komponen shell? | `#normal` | **A** — amandemen 24/18/15/14/12 | ✅ **A — Ratified oleh PO** |

**7 / 7 ratified · 0 Tunda · 0 dissent · ✅ ditandatangani digital `SIG-SHELL-2026-11-08-01` (14:23:54 WIB).** Status resmi ada di tabel ini dan di [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) §2; rekam tanda tangan ada di §8 lembar ini. Kolom bukti/dissent pada kartu §4.1–§4.7 sengaja dibiarkan kosong karena tidak ada bukti tambahan maupun dissent yang disampaikan — **kosong di sini berarti "tidak ada", bukan "belum diisi"**.

---

### 4.1 `D-F1` — Cakupan stepper

**Buka:** `#stepper` · **Sorot:** R3 (Alur analisis)
**Amati:** stepper hanya menampilkan 5 tahap; status per tahap berupa `Selesai` / `Terkini` / `Siap` / `Belum dimulai`; tidak ada persentase, tidak ada `In Progress`, tidak ada stage 8; teks eksplisit *"status tidak dikarang"*. Fragmen `#stepper` membuka detail kelima tahap (pada 900px juga lewat tombol "Lihat semua tahap").

| Opsi | Isi |
|---|---|
| **A (rekomendasi)** | Stepper minimal 5 stage dari sinyal yang tersedia; sisanya `Belum tersedia` dan tidak diklik; stage 8 tidak ditampilkan |
| B | Stepper penuh 10 stage sesuai Doc08 §5 sekarang juga |
| C | Tunda sampai `JobEvent.command` tersedia lalu putuskan ulang |

**Alasan rekomendasi:** `JobEvent` saat ini tidak membawa `command`, `progress`, atau timestamp. Stepper penuh mau tidak mau akan mengarang `In Progress`/`Completed`, melanggar UX-008 dan prinsip backend-authoritative (SYS-015). Bukti: `frontend/src/shared/ipc/generated.ts`, `frontend/src/shared/job/JobClient.ts` (`jobProgress()` memetakan state ke angka tetap), `FLOW-SHELL-001` §2.4. Label: **Confirmed**.
**Risiko bila B/C:** B merusak kepercayaan pengguna pada status; C menunda seluruh perbaikan alur kerja tanpa manfaat karena 5 stage sudah cukup sebagai next-step CTA.
**Ikut terkunci:** `D-S8` (status `In Progress` ditunda), `D-F5` (prasyarat backend, tetap ditunda).
**Bukti yang dilihat PO:** ____________________ · **Label:** ☐ Confirmed ☐ Likely ☐ Suggestion
**Catatan / dissent:** ______________________________________________
**Keputusan:** ☑ **A** — `Ratified oleh PO (2026-11-08)` · **Paraf PO:** ✅ `SIG-SHELL-2026-11-08-01` (digital, §8) · **Tanggal:** 2026-11-08 14:23:54 WIB

---

### 4.2 `D-F2` — Router

**Buka:** `#normal` · **Sorot:** R1 (app bar)
**Amati:** konteks `Proyek: Analisis Penjualan Q3` + chip dataset + fingerprint tetap terlihat lintas tampilan; klik item nav mengubah `aria-current` dan label rute, tetapi **alamat URL tidak berubah** (ini keterbatasan aplikasi saat ini, bukan mockup).

| Opsi | Isi |
|---|---|
| **A (rekomendasi)** | Hash routing + history stack; `navigate` tetap lewat `useRouter` agar 28 komponen tidak berubah |
| B | Pertahankan router state-only; perbaiki hanya tampilan |
| C | Router pustaka pihak ketiga / rewrite penuh |

**Alasan rekomendasi:** `frontend/src/app/router.tsx` menyimpan `route` di `useState`; reload selalu kembali ke Setup, Back/Forward tidak bekerja, tidak ada deep link. `SCREEN-SHELL-001` §3.4 juga mensyaratkan item nav berupa `<a href="#…">` agar Cmd/Ctrl-click dan middle-click bekerja — itu hanya mungkin bila D-F2 = A. Bukti: `router.tsx`, `ProjectContext.tsx`, Doc07 §6.3. Label: **Confirmed**.
**Risiko bila B:** perbaikan visual tidak menyembuhkan context loss; pengguna tetap kehilangan posisi kerja setiap reload. **Bila C:** scope rewrite besar saat RC, menyentuh freeze.
**Catatan penting:** ini **keputusan arsitektur**; mockup hanya menunjukkan konteks yang harus dipertahankan. Bukti penerimaan nanti berupa uji reload/Back, bukan screenshot. Jangan menandai PASS dari prototipe.
**Ikut terkunci:** `D-S6` (shortcut discoverability), `D-F3`.
**Bukti yang dilihat PO:** ____________________ · **Label:** ☐ Confirmed ☐ Likely ☐ Suggestion
**Catatan / dissent:** ______________________________________________
**Keputusan:** ☑ **A** — `Ratified oleh PO (2026-11-08)` · **Paraf PO:** ✅ `SIG-SHELL-2026-11-08-01` (digital, §8) · **Tanggal:** 2026-11-08 14:23:54 WIB

---

### 4.3 `D-F3` — Pemulihan konteks saat reload

**Buka:** `#normal` · **Sorot:** R1 (app bar)
**Amati:** app bar memuat `route` (Profiling), `projectId`, `datasetId`, dan fingerprint snapshot aktif — yakni himpunan data minimum yang harus hidup kembali setelah reload. Tidak ada record analisis yang disimpan di app bar.

| Opsi | Isi |
|---|---|
| **A (rekomendasi)** | Simpan `{route, projectId, datasetId}` di localStorage, **wajib revalidasi ke backend saat boot**; gagal → state `degraded` dengan alasan, bukan empty state; tidak menyimpan record analisis |
| B | Tanpa persistensi (reload selalu Setup) |
| C | Simpan seluruh record analisis agar "langsung penuh" setelah reload |

**Alasan rekomendasi:** `ProjectContext.tsx` murni in-memory. Menyimpan record analisis (C) berisiko menyajikan hasil usang sebagai valid — konflik langsung dengan `D-F7` dan aturan fingerprint immutable. Revalidasi adalah satu-satunya cara menjaga kejujuran status. Bukti: `ProjectContext.tsx`, `FLOW-SHELL-001` §2.6, `docs/BASELINE-FREEZE-v1.0.md`. Label: **Confirmed** untuk masalah, **Likely** untuk mekanisme.
**Risiko bila B:** context loss berulang pada aplikasi desktop (pekerjaan analisis panjang). **Bila C:** artefak usang tampil sah.
**Ikut terkunci:** `D-F4` (`project.open`, ditunda ke Beta), bentuk state `degraded` di `SCREEN-SHELL-001` §State matrix.
**Bukti yang dilihat PO:** ____________________ · **Label:** ☐ Confirmed ☐ Likely ☐ Suggestion
**Catatan / dissent:** ______________________________________________
**Keputusan:** ☑ **A** — `Ratified oleh PO (2026-11-08)` · **Paraf PO:** ✅ `SIG-SHELL-2026-11-08-01` (digital, §8) · **Tanggal:** 2026-11-08 14:23:54 WIB

---

### 4.4 `D-S1` — Grup & urutan navigasi

**Buka:** `#annotate` · **Sorot:** R2 (rail berlabel)
**Amati:** 7 grup / 9 item — `Workspace / Data / Preparation / Analysis / Discovery / Output / Tools`; **Pembersihan sebelum Hubungan**; backup, restore, export, diagnostic pindah ke `Tools`; tidak ada 8 tombol flat tanpa hierarki.

| Opsi | Isi |
|---|---|
| **A (rekomendasi)** | 7 grup / 9 item seperti mockup; Pembersihan sebelum Hubungan; utilitas di Tools |
| B | Pertahankan 8 item flat, hanya perbaiki styling |
| C | Urutan lain (tuliskan di catatan) |

**Alasan rekomendasi:** `App.tsx`/`router.tsx` saat ini menaruh Readiness di urutan 5 dan Cleaning di 7, berlawanan dengan urutan kerja Doc08 §5. Doc08 §19 memang men-Deferred *exact navigation labels and ordering* — **justru karena itu keputusan ini harus diambil PO sekarang**, bukan ditebak tim. Bukti: `notes/Current-UI_UX.md` (wireframe sidebar), `docs/07 — Frontend Architecture v0.3.md` §6.2. Label: **Confirmed** untuk urutan saat ini, **Suggestion** untuk grup final.
**Risiko bila B:** pengguna tetap harus menghafal urutan fitur, bukan mengikuti alur; next-step CTA tidak punya pijakan.
**Ikut terkunci:** `D-S6` (Cmd+K tetap ditunda), label final di `D-S2`.
**Bukti yang dilihat PO:** ____________________ · **Label:** ☐ Confirmed ☐ Likely ☐ Suggestion
**Catatan / dissent (tuliskan urutan bila C):** ______________________________
**Keputusan:** ☑ **A** — `Ratified oleh PO (2026-11-08)` · **Paraf PO:** ✅ `SIG-SHELL-2026-11-08-01` (digital, §8) · **Tanggal:** 2026-11-08 14:23:54 WIB

---

### 4.5 `D-S2` — Locale tunggal

**Buka:** `#normal` · **Sorot:** R4 (main workspace)
**Amati:** seluruh copy satu bahasa; tidak ada `Bivariat`, `Assessing…`, `rows`, `Doc04 §12`, `G6-2`, `Doc15 §10`; satuan dan angka memakai konvensi Indonesia; istilah `Hubungan`, `Pembersihan`, `Kesiapan`, `Baris`, `Kolom`, `Perlu diperbarui`.

| Opsi | Isi |
|---|---|
| **A (rekomendasi)** | Bahasa Indonesia konsisten sebagai satu-satunya locale |
| B | Seluruhnya English |
| C | Biarkan campuran; perbaiki bertahap per fitur |

**Alasan rekomendasi:** aplikasi sudah berbahasa Indonesia di mayoritas layar; biaya mengubah segalanya ke English lebih besar dan tidak diminta pengguna. Yang tidak boleh dipertahankan adalah **campuran**. ID dokumen internal tidak boleh bocor ke UI. Bukti: `ProjectSetup.tsx` (`Backup & Restore (Doc04 §12)`, `Export Portabel (G6-2)`), `DatasetExplorer.tsx`, `SCREEN-SHELL-001` §3.4–3.5. Label: **Confirmed**.
**Risiko bila C:** tiap fitur jadi sumber kebenaran sendiri; `D-S5` (copy deck) tidak pernah bisa ditutup.
**Ikut terkunci:** `D-S5` (copy deck, ditunda), sinkronisasi dengan `SCREEN-CLEAN-001` yang sudah ratified — **copy fitur ratified tidak boleh ditimpa diam-diam**.
**Bukti yang dilihat PO:** ____________________ · **Label:** ☐ Confirmed ☐ Likely ☐ Suggestion
**Catatan / dissent:** ______________________________________________
**Keputusan:** ☑ **A** — `Ratified oleh PO (2026-11-08)` · **Paraf PO:** ✅ `SIG-SHELL-2026-11-08-01` (digital, §8) · **Tanggal:** 2026-11-08 14:23:54 WIB

---

### 4.6 `D-S3` — Perilaku 900px

**Buka:** `#900-drawer` · **Sorot:** R5 (panel samping)
**Amati:** rail tetap **berlabel** (176px, bukan ikon buta); Job Center + dataset + versi pindah ke **drawer** dengan toggle `Panel` selalu terlihat dan badge jumlah job; `Esc` menutup dan mengembalikan fokus; tidak ada region berstatus yang hilang. Bandingkan dengan screenshot baseline `frontend/tests/__screenshots__/visual.spec.ts-snapshots/*-900.png`.

| Opsi | Isi |
|---|---|
| **A (rekomendasi)** | Rail berlabel + drawer Job Center; larang `display:none` pada region berstatus/aksi |
| B | Rail ikon 64px + tooltip, panel kanan tetap disembunyikan |
| C | Tunda perbaikan 900px ke setelah RC |

**Alasan rekomendasi:** 900px adalah **minimum window kontraktual** (`DS-CORE-001`), jadi ini bukan edge case. `tokens.css` saat ini menyembunyikan `.app-aside` dan `.nav-label` di ≤900px — artinya Job Center dan label navigasi hilang tepat pada ukuran minimum. WCAG 2.2 AA tidak boleh di-Deferred. Bukti: `frontend/src/shared/tokens.css` blok `@media (max-width:900px)`, screenshot baseline 900px. Label: **Confirmed** (release blocker).
**Risiko bila B:** butuh set ikon + tooltip + uji a11y baru, lebih mahal daripada mempertahankan rail berlabel. **Bila C:** meluncurkan RC yang rusak pada ukuran minimum.
**Ikut terkunci:** `D-S7` (baseline visual 900px harus diuji ulang), `QA-SHELL-001`.
**Bukti yang dilihat PO:** ____________________ · **Label:** ☐ Confirmed ☐ Likely ☐ Suggestion
**Catatan / dissent:** ______________________________________________
**Keputusan:** ☑ **A** — `Ratified oleh PO (2026-11-08)` · **Paraf PO:** ✅ `SIG-SHELL-2026-11-08-01` (digital, §8) · **Tanggal:** 2026-11-08 14:23:54 WIB

---

### 4.7 `D-S4` — Skala tipografi & komponen shell

**Buka:** `#normal` · **Sorot:** R4 (kartu, tabel, kontrol)
**Amati:** hierarki 24 / 18 / 15 / 14 / 12px; kontrol 36px dengan state hover, fokus (`:focus-visible`), disabled; kartu berborder + surface; tabel memakai `<caption>` dan `scope`; chart punya ringkasan teks; badge warna selalu disertai teks (bukan color-only).

| Opsi | Isi |
|---|---|
| **A (rekomendasi)** | Amandemen `DS-CORE-001`: 5 tingkat tipografi + 8 state kontrol dasar shell |
| B | Pertahankan 11/13/15px dan kontrol native; rapikan hanya spasi |
| C | Tunda sampai desain visual penuh siap |

**Alasan rekomendasi:** `tokens.css` hanya punya 11/13/15px dan `button` cuma punya `transition`; screenshot baseline memperlihatkan layar putih luas dengan kontrol native. Ini bukan soal selera: hierarki dan state fokus menyentuh keterbacaan serta WCAG 2.2 AA. Bukti: `frontend/src/shared/tokens.css`, `frontend/tests/__screenshots__/visual.spec.ts-snapshots/*-1440.png`, `DS-CORE-001`. Label: **Confirmed** untuk kondisi, **Suggestion** untuk angka final.
**Risiko bila B:** perbaikan shell lain (stepper, nav, drawer) tetap terlihat seperti prototipe. **Bila C:** `DS-SHELL-001` (G4) tidak punya dasar dan G5 tidak bisa dibuka.
**Ikut terkunci:** `DS-SHELL-001` wajib didraft setelah keputusan ini; warna/kontras/min-window `DS-CORE-001` **tidak berubah**.
**Bukti yang dilihat PO:** ____________________ · **Label:** ☐ Confirmed ☐ Likely ☐ Suggestion
**Catatan / dissent:** ______________________________________________
**Keputusan:** ☑ **A** — `Ratified oleh PO (2026-11-08)` · **Paraf PO:** ✅ `SIG-SHELL-2026-11-08-01` (digital, §8) · **Tanggal:** 2026-11-08 14:23:54 WIB

---

## 5. Sembilan keputusan yang sengaja TIDAK diputus hari ini

| ID | Mengapa ditunda | Bukti yang dibutuhkan | Track |
|---|---|---|---|
| `D-F4` | `project.open` / daftar proyek butuh kontrak Pydantic, bukan keputusan visual | `backend/contracts.py` + `tools/generate_types.py`; uji restore | Beta / Phase 1 |
| `D-F5` | Ekstensi `JobEvent` (`command`, `progress?`, timestamp) adalah perubahan IPC | Pydantic dulu, `generated.ts` tidak boleh di-hand-edit | Phase 1 |
| `D-F6` | Pemisahan kanal error per concern terlihat di mockup, tetapi menyentuh `App.tsx` + Job Center | Desain kanal + uji kegagalan per concern | Phase 0 |
| `D-F7` | Aturan stale lintas-route dan CTA refresh terlihat di state `Stale`, tetapi butuh fingerprint check di tiap fitur | Audit artefak Quality/Readiness/Report | Phase 0 |
| `D-F8` | Endorsemen urutan Phase 0/1/2 adalah keputusan perencanaan, bukan bentuk | Rencana rilis + status freeze | Setelah sesi |
| `D-S5` | Copy deck lintas-route harus disinkron dengan kontrak fitur ratified | Review `SCREEN-CLEAN-001` dsb. | Setelah `D-S2` |
| `D-S6` | Cmd+K / shortcut global tidak ada di mockup | Daftar shortcut + uji konflik OS | Phase 2 |
| `D-S7` | Toleransi visual 15% → ≤5% + seeded fixtures adalah keputusan kualitas bukti | `frontend/tests/helpers.ts`, `visual.spec.ts`, rute Readiness | Sebelum G6 |
| `D-S8` | Status `In Progress` per-stage bergantung `D-F5` | Sama dengan `D-F5` | Phase 1 |

> Catatan koreksi: rekomendasi 2026-11-08 menyebut "sembilan lainnya ditunda" tetapi hanya mendaftar delapan ID. Yang kesembilan adalah `D-S8`, dimasukkan di tabel ini.

State `Stale` dan `Gagal memuat` tetap **boleh dipakai sebagai ilustrasi** selama sesi, tetapi jangan dijadikan bukti PASS untuk `D-F6`/`D-F7`.

## 6. Penutup sesi (cek sebelum bubar)

- [x] Ketujuh keputusan punya pilihan, paraf PO (via chat 14:04 WIB), dan tanggal; **dissent: tidak ada** (dicatat, bukan dihilangkan).
- [x] Ringkasan keputusan tersimpan sebagai `docs/shell-contracts/DECISIONS-2026-11-08.md`.
- [x] 7 baris di `FLOW-SHELL-001` §Keputusan PO dan `SCREEN-SHELL-001` §Keputusan PO berstatus `Ratified oleh PO (2026-11-08)`; 9 sisanya tetap `Pending`.
- [x] Bunyi keputusan (bukan sekadar "A") ditranskrip ke badan kontrak; kedua kontrak naik ke **v0.2** namun **tetap DRAFT**.
- [x] Record ratifikasi `RATIF-SHELL-001` dibuat sebagai sumber kebenaran tunggal, termasuk amandemen terbatas Doc08 §19.
- [x] Draft `DS-SHELL-001` (G4) — **DRAFT v0.1 selesai 2026-11-08**, belum diratifikasi sebagai kontrak.
- [ ] Draft `APP-ARCH-001`, `JOB-SHELL-001` (G1), `QA-SHELL-001` (G6).
- [ ] Susun bukti penerimaan: uji reload/Back/revalidasi gagal (`D-F2`/`D-F3`), aksesibilitas 900px (`D-S3`), G4 (`D-S4`).
- [ ] Ratifikasi **utuh** G2/G3 setelah 9 keputusan Pending selesai; baru daftarkan artefak ke `docs/status-register.md` dan jalankan **Independent Critic** dengan konteks segar — ini yang membuka G5.
- [ ] **Paralel, Wajib sebelum rilis:** jalankan 7 skenario `docs/beta-validation-script.md` pada build saat ini (masih belum dijalankan per `docs/EVALUATION-REMEDIATION-2026-11-07.md`) dan buka kanal `beta-feedback`.
- [ ] Arsipkan atau hapus `prototypes/shell-v0/` setelah ratifikasi **utuh**. Jangan dibiarkan menjadi acuan visual yang setengah benar.

## 7. Yang tetap dilarang setelah sesi ini

Menulis kode produksi berdasarkan mockup; menambah `project.open`, Cancel/Retry job, progress determinate, atau tombol unduh sebelum kontrak Pydantic-nya ada; menurunkan toleransi tes tanpa seeded fixtures; mengubah `generated.ts` dengan tangan; menandai dokumen DRAFT sebagai "approved" hanya untuk membuka G5; **menulis angka `D-S4` ke `tokens.css` sebelum `DS-SHELL-001` diratifikasi dan G4 exit** (draf v0.1 sudah ada, tetapi itu belum cukup); **memakai ratifikasi `D-F2`/`D-F3` sebagai izin memulai Phase 1** selama `D-F8` masih Pending.

Ratifikasi 7 keputusan pada 14:04 WIB **dan tanda tangan digital 14:23:54 WIB tidak menghapus satu pun larangan di atas**. Tanda tangan mengikat **bunyi keputusan**, bukan membuka implementasi.

---

## 8. Tanda tangan digital PO — `SIG-SHELL-2026-11-08-01`

| Field | Nilai |
|---|---|
| **Signature ID** | `SIG-SHELL-2026-11-08-01` |
| **Penandatangan** | Product Owner — pemilik akun/sesi WorkBuddy yang memberikan perintah ratifikasi. Nama legal tidak dicatat dalam sesi ini; identitas mengikat pada **akun sesi teraudentikasi + rantai percakapan**, bukan pada nama yang diketik manual |
| **Perintah penandatanganan** | `"sy sign secara digital aja worksheet nya dan lanjut ke ds-shell-001"` |
| **Waktu ratifikasi** | 2026-11-08 14:04 WIB (GMT+7) |
| **Waktu tanda tangan** | **2026-11-08 14:23:54 WIB (GMT+7)** — dari `current_time` sesi, bukan dikarang |
| **Metode** | Pengesahan elektronik dalam sesi teraudentikasi; tujuh kolom paraf di §4.1–§4.7 menunjuk ke Signature ID ini |
| **Obyek yang ditandatangani** | **7 keputusan bentuk shell** (`D-F1`, `D-F2`, `D-F3`, `D-S1`, `D-S2`, `D-S3`, `D-S4`), semuanya opsi A, sebagaimana bunyinya di [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) §2 |
| **Yang TIDAK ditandatangani** | Kontrak `FLOW-SHELL-001` / `SCREEN-SHELL-001` secara utuh (tetap DRAFT v0.2); 9 keputusan Pending; mockup disposable; implementasi, IPC, atau perubahan `generated.ts` |
| **Integritas berkas** | `SIGNATURE-MANIFEST-2026-11-08.sha256` berisi SHA-256 dari worksheet ini, record ratifikasi, catatan keputusan, dan kedua kontrak pada saat penandatanganan |

### Pernyataan penandatanganan

> Saya, selaku Product Owner, menandatangani secara digital lembar sesi ini sebagai pengesahan atas **tujuh** keputusan bentuk shell yang tercantum di §4 dan dijelaskan di `RATIF-SHELL-001` §2. Saya memahami bahwa tanda tangan ini **tidak** meratifikasi kontrak secara utuh, **tidak** memutus sembilan keputusan yang ditunda, dan **tidak** memberikan izin implementasi sebelum G4/G5/G6 terpenuhi.

### Cara verifikasi

```bash
cd docs/shell-contracts
shasum -a 256 -c SIGNATURE-MANIFEST-2026-11-08.sha256
```

Semua baris harus `OK`. Bila ada `FAILED`, berkas yang bersangkutan telah berubah setelah penandatanganan; **jangan** mengklaim lembar ini masih tertanda tangan — pulihkan dari versi yang tercatat atau terbitkan `SIG-SHELL-2026-11-08-02`.

### Batas kejujuran (wajib dibaca auditor)

Ini **bukan** tanda tangan kriptografik berbasis kunci privat/PKI dan **bukan** tanda tangan elektronik tersertifikasi secara hukum. Kekuatan buktinya berasal dari tiga hal yang bisa diperiksa: (1) identitas akun sesi yang sama di sepanjang rantai percakapan, (2) stempel waktu sesi, dan (3) sidik jari SHA-256 yang mendeteksi perubahan berkas setelah penandatanganan. Bila organisasi membutuhkan kekuatan hukum lebih tinggi, tanda tangani ulang dengan mekanisme bersertifikat dan catat sebagai amandemen record.
