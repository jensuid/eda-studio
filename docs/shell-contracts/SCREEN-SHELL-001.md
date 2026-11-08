# SCREEN-SHELL-001 — Screen & Interaction Contract (Application Shell)

**ID:** SCREEN-SHELL-001 · **Status:** DRAFT v0.2 — **kontrak belum diratifikasi PO**; 4 keputusan di dalamnya sudah diratifikasi parsial (2026-11-08)
**Parent:** FLOW-SHELL-001 · Doc07 §6.1–§6.3 · Doc08 §4, §5.1–§5.2, §10, §11.1, §12, §16, §19 · DS-CORE-001
**Rigor:** Full · **Kondisi:** G3 BELUM exit; `D-S1`/`D-S2`/`D-S3`/`D-S4` = **Ratified oleh PO (2026-11-08)**, `D-S5`…`D-S8` masih Pending. **Tidak ada kode produksi sebelum G3 diratifikasi + G4 `DS-SHELL-001` + G5 Critic PASS** (`docs/ux-contracts/README.md` §Core rule).
**Relasi:** kontrak ini mengatur **frame** aplikasi. Region fitur tetap tunduk pada SCREEN/DS/QA per fitur yang sudah ratified; bila ada tumpang tindih, copy dan gate milik kontrak fitur **menang**, dan konfliknya dicatat sebagai amandemen.

---

## Ratifikasi parsial PO — 2026-11-08 14:04 WIB

**Sumber:** [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) · **Cakupan:** 7 keputusan bentuk shell, 4 di antaranya milik kontrak ini (`D-S1`, `D-S2`, `D-S3`, `D-S4`), semuanya **opsi A**.

| Yang berubah | Yang tidak berubah |
|---|---|
| `D-S1` (nav), `D-S2` (locale), `D-S3` (900px), `D-S4` (tipografi) kini **mengikat**; bunyi keputusannya ditranskrip ke §3.2, §3.4, §3.6, §3.8, §3.9, dan §Keputusan PO | Status kontrak tetap **DRAFT**; G3 belum exit; 5 keputusan FLOW + 4 keputusan SCREEN tetap Pending |
| Pasal terkait ditandai `[RATIFIED]` dan rekomendasi DRAFT pada 4 baris naik menjadi keputusan | `D-S4` **belum** boleh ditulis ke `tokens.css` sebelum `DS-SHELL-001` (G4) didraft |
| Amandemen terbatas terhadap Doc08 §19 / `BASELINE-FREEZE-v1.0.md` (lihat record §4) | `final screen-by-screen layouts` dan `final Job Center screen layout` **tetap Deferred**; warna/kontras/min-window `DS-CORE-001` **tidak berubah** |

Bila ada perbedaan wording antara badan kontrak dan [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) §2, **record ratifikasi yang menang**; amandemen wajib lewat record baru, bukan perubahan diam-diam.

---

## G3 — Screen Contract

### 3.1 Identitas & hierarki

- **screen:** `app-shell` — frame persisten untuk ke-8 route; bukan halaman tersendiri.
- **purpose:** membuat posisi, konteks, langkah berikutnya, dan status pekerjaan selalu terlihat tanpa memaksa pengguna membaca isi tiap fitur.
- **primary_action:** satu CTA kontekstual **"Lanjut: …"** pada stepper (FLOW-SHELL-001 step `advance`). Hanya satu aksi primer per layar (DS-CORE-001).
- **hierarchy:**
  1. Konteks aktif: proyek + dataset/snapshot (R1).
  2. Posisi & langkah berikutnya: stepper + CTA (R3).
  3. Konten fitur yang sedang dikerjakan (R4).
  4. Status pekerjaan asynchronous (R5b).
  5. Kondisi sistem yang membutuhkan perhatian (R6).
  6. Informasi versi/diagnostik (R7).
- **Yang dihapus / dilarang (dengan alasan):**

| Dihapus | Alasan |
|---|---|
| Rail 8 tombol datar tanpa status (`App.tsx:162-177`) | Feature-stack, bukan workflow; tidak menjawab "selanjutnya apa" |
| ID internal di UI: "Doc04 §12", "G6-2", "Doc15 §10", "Doc04 §11" | Bukan bahasa pengguna; bocoran artefak engineering ke produk |
| `display:none` untuk `.app-aside` di ≤900px (`tokens.css:441-443`) | Menghilangkan Job Center dan versi pada **min window kontraktual** (DS-CORE-001) |
| `.nav-label { display:none }` tanpa ikon (`tokens.css:449-451`) | Navigasi buta: `setup-900.png` hanya menampilkan kotak kosong |
| `jobProgress()` Running→70% (`JobClient.ts:39-60`) | Progress rekayasa, bukan data backend (Doc08 §11.1:473) |
| Satu `protocolError` untuk semua kegagalan (`App.tsx:59`) | Kegagalan cek update tampil sebagai kerusakan protokol |
| `role="alertdialog"` pada banner non-modal (`App.tsx:186`) | Mengklaim modal tanpa `aria-modal`, focus trap, atau pemindahan fokus |
| "Belum ada job." saat polling gagal (`JobClient.ts:79-81`, `JobCenter.tsx:22`) | Doc08 §11.1:485 melarang kegagalan muat disamarkan sebagai daftar kosong |
| Teks `error.message` mentah di banner | `ipcClient.ts:137-139`: UI wajib branch pada `error.code` |
| Copy "Report siap diunduh" tanpa kontrol unduh (`ReportSection.tsx:74-78`) | Dead-end; `a.href` path filesystem mentah (`PdfSection.tsx:43`) tidak andal di pywebview |

### 3.2 Layout

**Default / wide (≥1200px, baseline 1440×900):**
```
┌─────────────────────────────────────────────────────────────────────────┐
│ R1 App bar: EDA Workbench · Proyek: <nama> · Dataset: <nama> [Aktif]  │
├──────────────┬───────────────────────────────────────┬──────────────────┤
│ R2 Nav       │ R3 Stepper  ①──②──③──④…   [Lanjut: …]  │ R5a Dataset card│
│ (bergrup,    ├───────────────────────────────────────┤ R5b Job Center   │
│  berlabel,   │ R6 Feedback global (persisten)        │ R7 Versi/update  │
│  berstatus)  ├───────────────────────────────────────┤                  │
│              │ R4 Main workspace (konten route)      │                  │
│              │    <ErrorBoundary per-route>           │                  │
└──────────────┴───────────────────────────────────────┴──────────────────┘
```
Grid saat ini `210px | 1fr | 240px` (`tokens.css:257-265`) **dipertahankan** agar perubahan tidak menyentuh layout tiap fitur. R3 dan R6 adalah baris baru di dalam kolom `main`, bukan kolom baru.

**Narrow (900–1199px, wajib penuh di 900px):**
```
┌───────────────────────────────────────────────────────────┐
│ R1 App bar (nama proyek disingkat, dataset tetap terbaca)│
├────────┬──────────────────────────────────────────────────┤
│ R2 Nav │ R3 Stepper ringkas: "Tahap 2 dari 5 · Profil" │
│ label  │    [Lanjut: …]  [▸ Panel]                     │
│ tetap  ├──────────────────────────────────────────────────┤
│ utuh   │ R6 (bila ada) → R4 Main workspace             │
│        │ R5 + R7 → **drawer** yang bisa dibuka/ditutup  │
└────────┴──────────────────────────────────────────────────┘
```
**Aturan mengikat:** pada 900px, **tidak ada region yang berisi status atau aksi boleh `display:none`**. R5/R7 pindah ke drawer dengan tombol toggle yang selalu terlihat dan badge jumlah job aktif; tombol toggle mempunyai accessible name dan `aria-expanded`; `Esc` menutup dan fokus kembali ke toggle. Alternatif rail-ikon (64px) ditolak karena menghilangkan label tanpa pengganti visual — biaya implementasi ikon + tooltip lebih besar daripada mempertahankan rail ~176px berlabel.

> **`[RATIFIED] D-S3` — Ratified oleh PO (2026-11-08), opsi A.** Keputusan final: **rail berlabel ~176px + drawer Job Center / dataset / versi**, toggle selalu terlihat, `Esc` + focus return. **Ditolak secara eksplisit:** `display:none` pada region berstatus/aksi, rail ikon buta 64px, dan menunda perbaikan 900px ke setelah RC. 900px adalah **minimum window kontraktual** (`DS-CORE-001`), sehingga ini release blocker, bukan edge case. **Bukti penerimaan yang masih wajib:** uji aksesibilitas 900px (axe 0 critical + jalur keyboard + screen reader pada drawer) — screenshot prototipe disposable bukan bukti PASS. Catatan: keputusan ini memutus **di mana** Job Center berada, bukan rincian isinya; *final Job Center screen layout* tetap Deferred (Doc08 §19). Sumber: [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) §2, §4.

### 3.3 Region tree

| ID | Region | Konten | Pemilik | Status yang berlaku |
|---|---|---|---|---|
| R1 | App bar | nama app, proyek aktif, dataset aktif + fingerprint pendek, indikator mode degraded | shell | loading, empty-first-run, partial, error, done |
| R2 | Primary nav | grup + item + status turunan (Blocked/Needs Attention) + `aria-current` | shell | empty-first-run, restricted, done |
| R3 | Workflow stepper | stage, status, freshness badge, CTA "Lanjut: …" | shell (data dari kontrak fitur) | loading, partial, error, stale, done |
| R4 | Main workspace | konten route + ErrorBoundary per-route | fitur | 8 state sesuai SCREEN per fitur |
| R5a | Dataset card | nama, baris, kolom, snapshot, status Aktif, aksi cepat | shell | loading, empty-first-run, stale, done |
| R5b | Job Center | daftar job, status authoritative, progress indeterminate, tautan konteks | shell (proyeksi) | loading, empty-first-run, **error/unavailable**, partial, done, stale |
| R6 | Feedback global | banner protokol/backend, recovery, render crash; toast region | shell | error, warning, done, dismissed |
| R7 | Versi & update | versi, platform, "Periksa update", hasil | shell | loading, empty-first-run, error, done |

**Matriks state per region (singkatan: L=loading, E1=empty-first-run, E2=empty-filtered, P=partial, X=error, LC=long-content, R=restricted, D=done; domain: PR=processing, ST=stale, OFF=offline/degraded, CF=conflict):**

| Region | L | E1 | E2 | P | X | LC | R | D | Domain |
|---|---|---|---|---|---|---|---|---|---|
| R1 | "Memuat proyek…" (bukan angka kosong) | "Belum ada proyek · Buat proyek" | n/a | nama disingkat + tooltip | "Konteks tidak dapat dimuat" + Coba lagi | ellipsis + tooltip, bukan wrap 2 baris | n/a | nama + dataset + badge Aktif | OFF: badge "Backend tidak tersedia" |
| R2 | skeleton item | semua item tampil, yang tergate berbadge "Terkunci" + alasan | n/a | n/a | n/a | scroll vertikal internal pada grup | item yang tidak tersedia tidak dihapus diam-diam (Doc07 §6.2:248), diberi alasan | `aria-current="page"` + status | ST/PR: badge pada stage terkait saja |
| R3 | skeleton stage | "Mulai dari Buat proyek" + 1 CTA | n/a | "Belum tersedia" untuk stage tanpa sinyal sah | "Status alur tidak dapat dimuat" | ringkas di 900px, daftar expandable | n/a | status + CTA | ST: badge "Perlu diperbarui" + alasan; CF: banner terpisah |
| R5a | skeleton kartu | "Belum ada dataset aktif · Impor dataset" | n/a | n/a | "Dataset tidak dapat dimuat" | nama panjang di-ellipsis | n/a | kartu + fingerprint 12 char | ST setelah aktivasi snapshot |
| R5b | "Memuat job…" | "Belum ada job. Jalankan analisis dari fitur mana pun." | filter aktif tanpa hasil → copy berbeda | sebagian event diterima → "Memperbarui…" | **"Daftar job tidak dapat dimuat" + Coba lagi** | daftar scroll internal, item terbaru di atas | action Cancel/Retry tidak ditampilkan sampai backend menyediakan | job terminal tetap terlihat dengan identitas stabil | PR indeterminate; OFF backoff polling; CF status belum terkonfirmasi + rekonsiliasi |
| R6 | n/a | tidak ada banner | n/a | beberapa concern → urutan prioritas §FLOW 2.5 | banner per concern, bisa di-dismiss kecuali critical | stack maksimal 3 + "Lihat semua" | n/a | kosong = tidak ada region | OFF/PR/CF sesuai concern |
| R7 | "Memeriksa…" | "Versi —" | n/a | n/a | pesan di region ini **saja** | n/a | n/a | versi + platform | OFF: "Pemeriksaan update tidak tersedia" |

### 3.4 Navigasi — `[RATIFIED] D-S1` + `[RATIFIED] D-S2` (2026-11-08)

> **`[RATIFIED] D-S1` — opsi A.** Pemetaan **final** untuk shell: **7 grup / 9 item** sesuai tabel di bawah; **Pembersihan sebelum Hubungan**; backup/restore/export portabel/diagnostic pindah ke grup **Tools**. **Ditolak:** 8 item flat tanpa hierarki dan urutan lama (`router.tsx` menaruh Readiness ke-5, Cleaning ke-7). Ini menyelesaikan *exact navigation labels and ordering* dari Doc08 §19 **untuk layer shell saja**; label di dalam region fitur tetap milik kontrak fitur ratified (lihat record §4).
>
> **`[RATIFIED] D-S2` — opsi A.** **Bahasa Indonesia konsisten sebagai satu-satunya locale** untuk seluruh shell, dengan **satu register copy**. **Ditolak:** alternatif seluruh-English, campuran `Bivariat` / `Assessing…` / `rows` / `Buat Project` / `Ke Setup`, dan bocoran ID dokumen internal ke UI (`Doc04 §12`, `G6-2`, `Doc15 §10`). **Batas:** keputusan ini **tidak** meratifikasi copy deck §3.5 (`D-S5` masih Pending) dan **tidak boleh menimpa** copy fitur yang sudah ratified (mis. `SCREEN-CLEAN-001` §Copy literal).

| Grup | Item (label final, ID) | Route | Catatan |
|---|---|---|---|
| Workspace | Proyek | `setup` | pembuatan proyek + import; utilitas dipindah (lihat Tools) |
| Data | Dataset | `explorer` | preview, histogram sebagai **tab kontekstual**, Analysis Plan, export |
| Preparation | Profil | `profiling` | Doc08 stage 3 |
| Preparation | Kualitas | `quality` | Doc08 stage 4 |
| Preparation | Pembersihan | `cleaning` | Doc08 stage 5 — **pindah ke sebelum** Analisis |
| Analysis | Hubungan | `bivariate` | Doc08 stage 7 |
| Discovery | Kesiapan | `readiness` | Doc08 stage 9 |
| Output | Laporan | `report` | Doc08 stage 10 (HTML + PDF) |
| Tools | Backup, Restore, Export portabel, Diagnostic | `setup` → sub-bagian/group tersendiri | pemisahan 5 section yang saat ini bertumpuk di `ProjectSetup.tsx` |

- Doc08 stage 6 (Univariate) tidak punya route: ditangani sebagai tab "Distribusi" di dalam `explorer`, **bukan** item nav baru. Doc08 stage 8 (Anomaly) belum ada permukaan: **tidak dibuatkan item palsu**, dicatat sebagai gap di `README.md`.
- Item nav dirender sebagai **`<a href="#…">`** (bukan `<button>`) agar Cmd/Ctrl-click dan middle-click bekerja. **`[RATIFIED] D-F2`** sudah menjamin hash routing, sehingga ketentuan ini kini mengikat (sebelumnya bergantung pada keputusan yang belum ada). `aria-current="page"` tetap wajib.
- Urutan nav mengikuti alur kerja, bukan urutan implementasi. Status `Blocked` ditampilkan sebagai badge + alasan, bukan penghapusan item.
- **Bukti penerimaan yang masih wajib:** sinkronisasi `router.tsx` saat implementasi, uji `aria-current`, dan uji Cmd/Ctrl-click / middle-click.

### 3.5 Copy deck (D-S5 — usulan literal, **belum ratified**)

| Kunci | Teks usulan | Catatan |
|---|---|---|
| app.title | "EDA Workbench" | tetap |
| context.empty | "Belum ada proyek. Buat proyek untuk memulai." | ganti "Buat Project" |
| context.dataset_empty | "Belum ada dataset aktif. Impor dataset untuk mulai menganalisis." | ganti "Belum ada dataset aktif." + "Ke Setup" |
| stepper.title | "Alur analisis" | baru |
| stepper.next | "Lanjut: {nama langkah}" | 1 CTA primer |
| stepper.unavailable | "Status belum tersedia" | untuk stage tanpa sinyal sah |
| stepper.stale | "Perlu diperbarui: {dependency} berubah sejak hasil ini dibuat." | Doc08 §10:449-455 |
| stepper.in_progress_global | "Analisis sedang berjalan" | tidak ditempel ke stage tertentu |
| gate.blocked | "{Prasyarat} belum tersedia." + tombol "Ke {prasyarat}" | wajib CTA, bukan disabled saja |
| job.empty | "Belum ada job. Jalankan analisis dari fitur mana pun." | dipertahankan |
| job.load_error | "Daftar job tidak dapat dimuat." + "Coba lagi" | baru; membedakan error vs kosong |
| job.unavailable | "Status job belum tersinkron." | partial/offline |
| job.progress | "Sedang diproses…" | indeterminate, tanpa persentase |
| error.protocol | "Versi protokol tidak cocok. Fitur yang membutuhkan backend belum dapat dipakai." | kanal khusus |
| error.backend | "Backend tidak tersedia. Coba lagi atau periksa aplikasi." | kanal khusus |
| error.update | "Pemeriksaan update gagal. Coba lagi nanti." | hanya di R7 |
| error.render | "Tampilan ini tidak dapat dimuat." + "Coba lagi" / "Kembali ke Setup" | tanpa `error.message` |
| recovery.title | "Aplikasi berhenti tanpa clean exit" | dipertahankan |
| success.generic | "{Objek} siap." + ringkasan yang bermakna | bukan fingerprint/byte count sbg headline |
| validation.required | "Nama proyek wajib diisi." / "Nama dataset wajib diisi." | inline, `aria-describedby` |

**Aturan lintas-route (prinsip, tetap berlaku):** tidak ada ID dokumen/ticket, tidak ada hash/byte count sebagai kalimat utama sukses, tidak ada `error.message` mentah, tidak ada persentase progress buatan. Copy fitur yang sudah ratified (mis. SCREEN-CLEAN-001 §Copy literal) **tidak boleh ditimpa** oleh deck ini.

> **Status pasca-ratifikasi 2026-11-08:** `D-S2` menetapkan **bahasa** (Bahasa Indonesia), **bukan** teks literal deck ini. Seluruh baris di atas tetap **usulan / Pending (`D-S5`)** sampai disinkronkan dengan kontrak fitur ratified. Menyalin teks deck ke komponen dengan alasan "sudah diratifikasi locale" adalah interpretasi keliru.

### 3.6 Interaksi (6 field per kontrol — `10-interaction-and-accessibility.md` §Interaction contract)

| Kontrol | Trigger | Precondition | Result | Feedback | Failure | Recovery |
|---|---|---|---|---|---|---|
| Item nav R2 | click / Enter / Cmd-click | selalu tersedia (yang tergate tetap bisa dibuka untuk melihat alasan) | `navigate(route)`; job tetap jalan | `aria-current` + fokus ke `#main-content` | route tidak dikenal → fallback Setup + pesan | "Kembali ke Setup" |
| Stage R3 | click / Enter | stage punya route & sinyal sah | navigasi ke stage | status + badge freshness | stage "Belum tersedia" → tidak bisa diklik, ada tooltip alasan | CTA "Lanjut: …" |
| CTA "Lanjut: …" | click / Enter | minimal satu stage `Ready` atau `Blocked` | navigasi ke stage paling awal yang eligible | focus pindah, stepper diperbarui | tidak ada stage eligible → CTA "Buat proyek"/"Impor dataset" | selalu ada satu tujuan |
| Dataset card R5a | click | `dataset != null` | buka `explorer` dengan konteks dataset | kartu tetap menandai Aktif | dataset tidak dapat dimuat → error + Coba lagi | revalidasi ke backend |
| Toggle panel 900px | click / Enter / Esc | viewport ≤1199px | buka/tutup drawer R5+R7 | `aria-expanded`, badge job aktif, focus trap saat terbuka | gagal render → panel inline fallback | Esc menutup, fokus kembali ke toggle |
| Item job R5b | click / Enter | job identitas stabil | buka detail/konteks asal tanpa kehilangan pekerjaan aktif | highlight + fokus | konteks asal tidak tersedia → pesan, bukan navigasi buta | tetap di Job Center |
| Banner R6 | dismiss | non-critical | hilang dari tampilan | toast "Ditutup" tidak perlu | critical tidak bisa di-dismiss | revalidasi otomatis saat reconnect |
| Toast action | click | notifikasi punya target | buka konteks sumber + job id | focus pindah | target hilang → pesan informatif | Job Center tetap jadi rekam jejak |
| "Periksa update" R7 | click | tidak sedang pending | `app.update.check` | status di R7 saja | pesan R7, **bukan** banner protokol | tombol aktif lagi |
| "Pulihkan autosave" R6 | click | E2 | `project.recovery.restore` | banner status + root baru | error di banner recovery | "Tutup" tetap tersedia |
| ErrorBoundary "Coba lagi" | click | crash | reset boundary | konten dirender ulang | crash deterministik → tawarkan "Kembali ke Setup", bukan loop | escape selalu ada |
| Reload / Back | browser | ✅ `D-F2`/`D-F3` **Ratified oleh PO (2026-11-08)** | restore route + konteks (3 field), revalidasi wajib | status "Memuat konteks…" | revalidasi gagal → `degraded` beralasan, bukan empty state | "Buat proyek"/"Coba lagi" |

### 3.7 Keyboard, focus, aksesibilitas

- **tab_order:** skip-link → R1 → R2 (atas ke bawah) → R3 → R6 (bila ada) → R4 → R5 → R7. Di 900px drawer terbuka, fokus masuk drawer dan **kembali ke toggle** saat ditutup.
- **focus_after_action:** setelah `navigate`, fokus ke `#main-content` (perilaku `App.tsx:74-78` dipertahankan); setelah dialog/drawer tutup, kembali ke origin; setelah toast action, ke target.
- **shortcuts (D-S6, usulan):** `Esc` tutup drawer/dialog; `Cmd/Ctrl+K` command palette **hanya** bila disetujui (jangan ditambahkan diam-diam); tidak ada shortcut yang menimpa konvensi OS. Semua shortcut harus terdiscoverable.
- **name_and_role:** `<header>/<nav>/<main>/<aside>` landmark; nav item anchor dengan accessible name; `aria-current`; toggle `aria-expanded`; region live `aria-live="polite"`; critical `role="alert"`. `role="alertdialog"` **hanya** untuk modal sungguhan dengan `aria-modal` + focus trap; banner recovery memakai `role="region"` + `aria-label`.
- **tabel:** `<caption>` + `<th scope="col">` pada semua tabel shell dan fitur; alternatif teks untuk chart tetap memakai `<details>` yang sudah ada, dan tooltip hover bukan satu-satunya sumber informasi.
- **status:** tidak hanya warna; badge selalu berteks (DS-CORE-001); kontras ≥4.5:1; `:focus-visible` 2px; `prefers-reduced-motion`; target kontrol ≥36px (DS-CORE-001).
- **konfirmasi:** mengikuti kontrak fitur; shell tidak menambah lapisan.

### 3.8 Responsif & adaptif

| Viewport | Perilaku |
|---|---|
| **900px (minimum kontraktual)** | rail tetap berlabel (lebar ~176px), R3 ringkas + expandable, R5/R7 ke drawer dengan toggle terlihat, tidak ada scroll horizontal, tidak ada region ber-status yang hilang |
| 1200px | R5/R7 kembali ke kolom kanan 240px; R3 penuh |
| ≥1440px | grid `210px / 1fr / 240px`; R4 memakai kartu/panel, bukan tumpukan form native |
| Di bawah 900px | window tidak dapat di-resize lebih kecil (DS-CORE-001); tidak ada layout alternate yang dijanjikan |

> Baris **900px** di atas kini mengikat lewat **`[RATIFIED] D-S3` (2026-11-08)**; rincian penolakan dan bukti penerimaan ada di §3.2. `D-S7` (seeded fixtures + toleransi ≤5% + rute Readiness) masih **Pending**, jadi baseline visual 900px **belum** boleh diklaim PASS.

### 3.9 Kontrak teknis yang mengikat implementasi

1. **IPC:** hanya lewat `ipcClient` dengan 4 bridge methods. `generated.ts` di-generate dari Pydantic; perubahan `JobEvent`, `project.open`, atau perintah unduh/buka artefak **wajib** Pydantic → `tools/generate_types.py` → `git diff --exit-code`.
2. **Job lifecycle:** Job Center memproyeksikan `getEvents`; tidak ada transisi lokal, auto-retry, status "cancelled" hasil klik, atau angka progress buatan. Selama `JobEvent` belum punya `command`/`progress`/waktu: indeterminate, tanpa Cancel/Retry, tanpa elapsed.
3. **Cap & payload:** preview ≤200 (`getPreview` default 20 → dapat dinaikkan hingga 200), scatter ≤1500, bin ≤30, tidak ada whole-DataFrame JSON (ADR-003). Paging/virtualisasi di R4 tidak boleh menaikkan cap tanpa ADR.
4. **Stale:** pengecekan fingerprint dilakukan untuk **semua** artefak yang punya `fingerprint`, termasuk Quality & Readiness; refresh hanya setelah persetujuan pengguna (UX-008).
5. **Invalidasi:** selama `JobEvent.command` belum ada, `invalidateQueries()` tanpa scope boleh dipakai tetapi wajib dicatat sebagai utang; tidak boleh menambah query baru yang mahal sebagai gantinya.
6. **Copy:** string terpusat dalam satu modul copy shell; dilarang string UI baru di komponen yang memuat ID dokumen, `error.message`, atau satuan byte/hash di headline.
7. **Komponen dasar — `[RATIFIED] D-S4`, Ratified oleh PO (2026-11-08), opsi A:** amandemen terbatas `DS-CORE-001` §Typography. Skala final: **`display 24 / title 18 / subtitle 15 / body 14 / caption 12`**, line-height ≥1.4, kontrol 36px, state `default|hover|focus-visible|pressed|selected|disabled|loading|error` untuk `button`, `input`, `select`; `button:disabled` wajib punya perlakuan visual + `disabled_reason` yang dapat dibaca; kartu berborder + surface-raised; tabel `<caption>` + `<th scope>`; alternatif teks untuk chart; badge selalu berteks (bukan color-only). **Ditolak:** skala 11/13/15px + kontrol native (`tokens.css:43-46`), dan **mengubah warna, kontras AA, atau min-window 900px `DS-CORE-001`** — ketiganya tidak termasuk amandemen. **Prasyarat belum terpenuhi:** `DS-SHELL-001` (G4) wajib **diratifikasi** sebelum angka ini ditulis ke `tokens.css`; ratifikasi keputusan **bukan** izin menyunting stylesheet. **Update 2026-11-08:** [DS-SHELL-001](DS-SHELL-001.md) kini tersedia sebagai **DRAFT v0.1 / belum diratifikasi** — jadi prasyarat *draft* terpenuhi, prasyarat *ratifikasi G4* masih terbuka. Sumber: [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) §2, §4.

### 3.10 Bukti G5/G6 yang harus ada (D-S7)

Kondisi saat ini: `frontend/tests/helpers.ts:25-38` mengembalikan `data:null` untuk **setiap** query, sehingga 14 baseline hanya merekam empty state; `visual.spec.ts:13-21` dan `a11y.spec.ts` tidak mengunjungi `readiness`; toleransi `maxDiffPixelRatio: 0.15`. Kontrak:

- Fixture **per state**: populated / loading / error / stale / done / job-running / job-failed / degraded, bukan hanya `data:null`.
- Matriks: **state × viewport (900, 1440) × route (8, termasuk Readiness) × keyboard path**.
- Toleransi visual diturunkan ke **≤5%** setelah baseline baru disetujui; 15% hanya diterima sementara dengan disposition eksplisit.
- axe 0 critical **plus** walkthrough keyboard manual dan uji screen-reader untuk banner/drawer/dialog; "test tidak dijalankan bukan PASS".
- Independent Critic dengan konteks segar; temuan berlabel Confirmed / Likely / Suggestion.

---

## Keputusan PO

**Record ratifikasi:** [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) — 4 dari 8 keputusan SCREEN **diratifikasi PO pada 2026-11-08 14:04 WIB** (opsi A). Empat sisanya **Pending**. Ratifikasi parsial ini tidak menaikkan status kontrak.

| ID | Pertanyaan | Isi keputusan / rekomendasi | Status |
|---|---|---|---|
| D-S1 | Grup & urutan nav final | **7 grup / 9 item** §3.4; Pembersihan sebelum Hubungan; Tools terpisah | ✅ **Ratified oleh PO (2026-11-08)** — A · mengikat §3.4 |
| D-S2 | Locale tunggal | **Bahasa Indonesia konsisten**, satu register copy | ✅ **Ratified oleh PO (2026-11-08)** — A · mengikat §3.4 |
| D-S3 | Perilaku 900px | **Rail berlabel ~176px + drawer**; tolak `display:none` dan rail-ikon buta | ✅ **Ratified oleh PO (2026-11-08)** — A · mengikat §3.2, §3.8 |
| D-S4 | Skala tipografi & komponen dasar | **Amandemen `DS-CORE-001`: 24/18/15/14/12 + 8 state kontrol**; warna/kontras/min-window tidak berubah | ✅ **Ratified oleh PO (2026-11-08)** — A · mengikat §3.9.7, **G4 masih wajib** |
| D-S5 | Copy deck §3.5 | Terima sebagai satu modul copy, tanpa menimpa copy fitur ratified | ☐ Pending — sinkron dengan `SCREEN-CLEAN-001` |
| D-S6 | Shortcut global | Esc wajib; Cmd+K ditunda ke Phase 2 | ☐ Pending |
| D-S7 | Kualitas bukti | Seeded fixtures + toleransi ≤5% + rute Readiness | ☐ Pending |
| D-S8 | `In Progress` per-stage | Ditunda sampai `JobEvent.command` tersedia (`D-F5`) | ☐ Pending |

### Bunyi keputusan yang mengikat (4 baris ratified)

| ID | Disetujui | Ditolak secara eksplisit | Bukti penerimaan yang belum ada |
|---|---|---|---|
| `D-S1` | 7 grup / 9 item; Pembersihan sebelum Hubungan; utilitas → Tools | 8 item flat; urutan lama Readiness ke-5 / Cleaning ke-7 | Sinkron `router.tsx`; uji `aria-current` |
| `D-S2` | Satu locale Bahasa Indonesia untuk shell; satu register copy | Semua-English; campuran `Bivariat`/`Assessing…`/`rows`; ID dokumen di UI | `D-S5` + sinkron copy fitur ratified |
| `D-S3` | 900px: rail berlabel + drawer, toggle selalu terlihat, `Esc` + focus return | `display:none` pada region berstatus/aksi; rail ikon 64px; menunda | Uji aksesibilitas 900px (axe + keyboard + SR) |
| `D-S4` | Skala 24/18/15/14/12 + 8 state kontrol dasar shell | 11/13/15px + native; mengubah warna/kontras/min-window `DS-CORE-001` | `DS-SHELL-001` (G4) |

**Catatan:** `D-S2` tidak meratifikasi copy deck. `D-S4` tidak meratifikasi `DS-SHELL-001`. `D-S3` tidak meratifikasi *final Job Center screen layout*. Tidak ada keputusan ratified yang diam-diam menaikkan keputusan yang bergantung padanya.

## Exit G3 (belum terpenuhi)

- [ ] D-S5…D-S8 diputuskan PO; **D-F1/D-F2/D-F3 ✅ dan D-F4…D-F8 masih Pending** di `FLOW-SHELL-001`. Kotak ini tetap belum dicentang.
- [ ] Bukti penerimaan untuk 4 keputusan ratified tersedia: uji aksesibilitas 900px, `DS-SHELL-001` (G4), sinkron nav & copy fitur ratified.
- [ ] Setiap region punya state yang berlaku; setiap kontrol punya 6 field interaksi; tidak ada perilaku penting yang diserahkan ke penemuan implementasi.
- [ ] Konflik dengan kontrak fitur ratified didaftarkan sebagai amandemen (khususnya stale copy SCREEN-CLEAN-001 dan gate SCREEN-REPORT-001).
- [ ] `DS-SHELL-001` (G4) dan `APP-ARCH-001` tersedia untuk ditinjau; `JOB-SHELL-001` (G1) diratifikasi. **Sebagian terpenuhi 2026-11-08:** [DS-SHELL-001](DS-SHELL-001.md) DRAFT v0.1 sudah tersedia (belum diratifikasi); `APP-ARCH-001` belum didraft, `JOB-SHELL-001` belum ada — kotak tetap belum dicentang.
- [ ] G5 slice: satu vertical slice yang menjalankan `cold-start → ingest → orient → run-stage → advance`, **satu edge state** (stale atau load-failed), 900px + 1440px, jalur keyboard, data representatif — lalu Critic PASS.

## Traceability

| Kontrak | Region / kontrol | Sumber normatif | Bukti QA-SHELL-001 |
|---|---|---|---|
| FLOW §2.1 E1–E3 | R1, R6, R7 | Doc08 §11, §12 | screenshot startup + degraded |
| FLOW §2.2 stage status | R3 | Doc08 §5.2, §10 | tabel sinyal × status, uji mismatch |
| FLOW §2.4 stale / gate / load-failed | R3, R5b, R6 | Doc08 §10, §11.1:485 | seeded fixtures per cabang |
| FLOW §2.5 kanal error | R6, R7 | Doc08 §12.1–12.3 | 4 uji concern terpisah |
| FLOW §2.9 resume | R1–R5 | Doc07 §6.3, Doc08 §15 | reload/back/resize walkthrough |
| §3.7 aksesibilitas | semua | Doc08 §16, WCAG 2.2 AA | axe + keyboard manual + screen reader |
