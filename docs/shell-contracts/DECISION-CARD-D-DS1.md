# Kartu Keputusan `D-DS1` — Mekanisme Migrasi Token Tipografi

**Status:** ✅ **`RATIFIED OLEH PO` — `D-DS1 = A`**, 2026-11-08 **16:01:39 WIB** lewat [RATIF-SHELL-002](RATIFICATION-RECORD-D-DS1-2026-11-08.md). Sebelumnya `Diputus PO` 15:34:53 WIB. Ratifikasi ini **bukan** ratifikasi kontrak, **bukan** tanda tangan digital, **bukan** G4 exit, **bukan** izin menyunting `tokens.css`.
**Disusun:** 2026-11-08 · **Pemilik keputusan:** Product Owner (PO) · **Disusun oleh:** asisten (rekomendasi, bukan keputusan).
**Sumber keputusan induk:** [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) §2 `D-S4` — `Ratified oleh PO (2026-11-08 14:04 WIB)`, ditandatangani digital `SIG-SHELL-2026-11-08-01`.
**Mengapa kartu ini ada:** [DS-SHELL-001](DS-SHELL-001.md) §9 menandai `D-DS1` sebagai **blocker** — tidak satu pun angka `D-S4` boleh ditulis ke `frontend/src/shared/tokens.css` sebelum ini diputus. **Blocker keputusan kini terlepas; blocker implementasi masih ada** (lihat §8).

> **Peringatan bias — tetap berlaku sebagai catatan proses.** Tujuh keputusan sebelumnya semuanya **A**; rekomendasi kartu ini juga **A**; PO menjawab **`A`** tanpa catatan. Argumen penentang A di §5 sudah disajikan sebelum jawaban, sehingga risiko *acquiescence* berkurang tetapi tidak hilang. PO memilih memutus di sesi yang sama dengan penyusunan kartu, menyimpang dari rekomendasi "sesi segar" di [HANDOFF](HANDOFF-FRESH-SESSION.md) §1 — **itu hak PO dan keputusan tetap sah**. Konsekuensi yang **tidak** terhapus: Independent Critic (G5) dan ratifikasi kontrak tetap wajib konteks segar.

**Record keputusan:** §8 berkas ini. **Sumber kebenaran tunggal untuk status ratifikasi:** [RATIF-SHELL-002](RATIFICATION-RECORD-D-DS1-2026-11-08.md). Addendum integritas: [POST-SIGNATURE-ADDENDUM-2026-11-08.md](POST-SIGNATURE-ADDENDUM-2026-11-08.md) Add-02 + **Add-03**.

---

## 1. Pertanyaan yang harus dijawab

`D-S4` sudah mengikat **nilai** skala: `display 24 / title 18 / subtitle 15 / body 14 / caption 12` (px), line-height ≥ 1.4, kontrol 36px, 8 state.
Yang **belum** diputus adalah **caranya masuk ke kode**:

> Apakah kelima nilai itu ditambahkan sebagai token **baru berkategori shell** (`--shell-font-*`), ataukah token **global yang sudah ada** (`--font-size-sm/md/lg`) di-remap ke skala baru?

Ini keputusan **mekanisme**, bukan pembukaan kembali nilai `D-S4`. Menolak semua opsi di kartu ini pun tidak membatalkan `D-S4`; akibatnya hanya `tokens.css` tetap tidak boleh disentuh.

---

## 2. Bukti (berlabel sesuai `02-framework.md` §Evidence discipline)

| # | Label | Temuan | Sumber |
|---|---|---|---|
| E1 | **Confirmed** | Token saat ini hanya 3 tingkat: `--font-size-sm: 11px`, `--font-size-md: 13px`, `--font-size-lg: 15px`. | `frontend/src/shared/tokens.css:44-46` |
| E2 | **Confirmed** | `tokens.css` memuat **16 deklarasi** `font-size: var(--font-size-*)` yang tersebar di ~51 **selector global** (`.panel-title`, `button`, `table`, `.muted`, dll.). Bukan selector milik satu fitur. | `tokens.css:66,119,144,151,186,227,239,244,251,277,312,323,335,375,…` |
| E3 | **Confirmed** | Hanya **2 berkas** di `frontend/src` yang memuat literal `--font-size-`: `tokens.css` dan `tokens.ts`. **Nol** berkas `.tsx`. | `grep -rln -- '--font-size-' frontend/src` |
| E4 | **Confirmed** | Komponen tidak mengonsumsi token secara langsung — mereka terkena **lewat kaskade selector global** di `tokens.css`. Artinya E3 **tidak** berarti dampaknya kecil. | E2 + E3 |
| E5 | **Confirmed** | Mirror numerik untuk canvas ECharts: `FONT_SIZE_SM=11`, `FONT_SIZE_MD=13`, `FONT_SIZE_LG=15`, `CHART_TITLE_SIZE=14`. `var()` tidak bisa dipakai di canvas. | `frontend/src/shared/tokens.ts` |
| E6 | **Confirmed** | **28** berkas `.tsx`; **14** baseline PNG ter-commit (7 route × 2 viewport) + 14 salinan di `__screenshots__/visual.spec.ts-snapshots`. | `find frontend/tests -name '*.png'` |
| E7 | **Confirmed** | `helpers.ts` mengembalikan `data: null` untuk semua query → 14 baseline merekam **empty state** saja; `visual.spec.ts` tidak mengunjungi `readiness`; toleransi `maxDiffPixelRatio: 0.15`. | `frontend/tests/helpers.ts:25-38`, `visual.spec.ts:13-21` |
| E8 | **Likely** | Remap global akan menggeser tipografi pada layar fitur yang kontraknya sudah ratified (`SCREEN-PROF-*`, `SCREEN-CLEAN-001`, dst.) tanpa amandemen dan tanpa Critic masing-masing. | E2 + `docs/status-register.md` |
| E9 | **Likely** | Pergeseran +1 s.d. +3px kemungkinan **lolos** di toleransi 15% → *false confidence*: tes hijau padahal perubahan visual tidak pernah direview. | E6 + E7 |
| E10 | **Confirmed** | `02-framework.md` §Stop rule: *"A shared component change has broad impact not yet assessed"* → wajib berhenti dan bertanya. | `contract_first_ui_v2/docs/02-framework.md` |
| E11 | **Suggestion** | Kedua skala akan hidup berdampingan bila opsi aditif dipilih; utang konvergensi ini perlu dicatat eksplisit, bukan dibiarkan tersirat. | Analisis kartu ini |

**Catatan koreksi terhadap catatan sesi sebelumnya:** angka "2 file" yang beredar di `DS-SHELL-001` §9 benar untuk *konsumen literal*, tetapi **tidak** menggambarkan *blast radius*. E2/E4 adalah fakta yang menentukan. `DS-SHELL-001` perlu dikoreksi lewat amandemen pada §9 (dokumen itu tidak bertanda tangan, jadi aman disunting).

---

## 3. Opsi

### Opsi A — Aditif `--shell-*` **(REKOMENDASI)**

Tambahkan 5 token baru yang **hanya dipakai selector shell R1–R7**:

```css
--shell-font-display: 24px;
--shell-font-title: 18px;
--shell-font-subtitle: 15px;
--shell-font-body: 14px;
--shell-font-caption: 12px;
```

`--font-size-sm/md/lg` **dibiarkan** di 11/13/15. `tokens.ts` tidak diubah kecuali ada elemen canvas milik shell (saat ini tidak ada). Tiga pengaman wajib:

1. **Lint kepemilikan:** selector fitur dilarang memakai `--shell-font-*`; selector shell dilarang memakai `--font-size-*`.
2. **Diff aditif murni:** `git diff frontend/src/shared/tokens.css` hanya boleh menambah baris; nol baris nilai lama yang diubah/hapus.
3. **Utang konvergensi dicatat** sebagai keputusan baru `D-DS5` (disahkan PO bersama `D-DS2`…`D-DS4`), dengan tenggat pasca-RC — bukan diselesaikan diam-diam.

| Kelebihan | Biaya / risiko |
|---|---|
| Blast radius terbatas pada chrome shell; kontrak fitur ratified tidak berubah (E8 dihindari) | Dua skala hidup berdampingan → `body` shell 14px vs fitur 13px terlihat beda (E11) |
| Dapat dibalik cukup dengan menghapus 5 baris | Tetap menggeser **sebagian** dari 14 baseline (app bar, rail, stepper ada di tiap screenshot) — lihat §4 |
| G4 bisa diratifikasi sekarang tanpa menunggu `D-S7` / fixtures | Butuh lint baru; butuh disiplin saat menulis selector shell |
| Mematuhi stop rule (E10): tidak ada perubahan komponen bersama yang belum dinilai | Utang desain yang jujur, harus masuk register keputusan |

### Opsi B — Remap global `--font-size-*`

Retarget 3 token lama menjadi 5 tingkat, perbarui 16 deklarasi global + `tokens.ts` dalam satu commit.

| Kelebihan | Biaya / risiko |
|---|---|
| Satu skala saja, tidak ada drift | Mengubah ~16 selector global yang dipakai **28 komponen** (E2/E4) |
| Konsistensi visual langsung tercapai | Menimpa kontrak DS/SCREEN fitur ratified tanpa amandemen (E8) → **melanggar stop rule (E10)** |
| Tidak ada utang konvergensi | 14 baseline bergeser semua; toleransi 15% kemungkinan meloloskan tanpa review (E9) |
| | Di fase **MVP RC + Baseline Freeze v1.0**, ini perubahan berisiko tinggi tanpa bukti penerimaan |

### Opsi C — Alias + migrasi bertahap per fitur

Definisikan 5 token semantik, alias-kan token lama, lalu migrasikan tiap fitur lewat amandemen G4 tersendiri dengan fixture per state.

| Kelebihan | Biaya / risiko |
|---|---|
| Tujuan akhir paling bersih: satu skala, transisi terdokumentasi | Paling kompleks; butuh kontrak migrasi + amandemen per fitur + `D-S7` fixtures **sebelum** baseline boleh diregenerasi |
| Risiko teknis paling rendah *jika* dijalankan penuh | Tidak proporsional untuk RC: masih ada **9 + 4 keputusan Pending** dan **7 skenario beta belum dijalankan** |
| | Menunda `D-S4` paling lama; berisiko *analysis paralysis* |

---

## 4. Reasoning rekomendasi A

1. **Keputusan ini soal batas kepemilikan, bukan soal estetika.** `D-S4` lahir sebagai *amandemen terbatas* `DS-CORE-001` **untuk shell** ([RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) §4: warna, kontras, radius, spacing, min-window **tidak berubah**). Menulis nilai itu ke token global justru memperluas amandemen ke seluruh fitur — itu bukan lagi amandemen terbatas, dan PO tidak pernah menyetujuinya.
2. **E2 membalik intuisi awal.** Karena tidak ada `.tsx` yang memakai token (E3), remap sekilas terlihat aman. Kenyataannya 16 selector global di `tokens.css` adalah *shared component* dalam arti stop rule (E10). Jadi B bukan "mengubah 3 angka", melainkan "mengubah tipografi seluruh aplikasi".
3. **Kondisi bukti belum memadai untuk perubahan luas.** Fixtures masih `data:null`, `readiness` tidak diuji, toleransi 15% (E7). Regenerasi baseline besar-besaran dalam kondisi itu menghasilkan hijau yang tidak bisa dipercaya (E9). A menunda regenerasi besar ke `D-DS4`/`D-S7` saat fixtures sudah ada.
4. **Reversibilitas bernilai tinggi di RC.** A bisa dibatalkan dengan `git revert` bersih; B dan C tidak.
5. **A tidak menutup jalan ke C.** A sebenarnya adalah **langkah pertama C tanpa komitmen jadwal**: token semantiknya identik, dan `D-DS5` kelak yang memutuskan konvergensi. Jadi memilih A hari ini tidak mengunci masa depan.

### Kejujuran yang wajib dicatat

**A tidak membuat 14 baseline tetap hijau.** App bar, nav rail, dan stepper muncul di setiap screenshot, jadi pergeseran tetap terjadi. Bedanya: pada A diff bersifat **sempit, dapat diatribusi ke shell, dan bisa direview per-region**; pada B diff menyentuh seluruh layar fitur sekaligus. Regenerasi baseline **tetap wajib**, dan tetap menunggu `D-DS4` + `D-S7`. Klaim "aditif = tidak ada baseline berubah" adalah **tidak benar** dan tidak boleh dipakai sebagai argumen.

---

## 5. Argumen terkuat MENENTANG A (disajikan sengaja)

> **Dua skala dalam satu layar adalah cacat visual yang nyata, bukan utang abstrak.** Region R4 (konten fitur) akan merender `body` 13px, sementara R1/R3/R5 (shell) merender 14px; `caption` fitur 11px vs shell 12px. Pengguna tidak tahu—dan tidak peduli—bahwa itu "amandemen terbatas". Yang ia lihat adalah produk yang tidak konsisten, yaitu **keluhan utama yang memicu seluruh audit UI/UX ini**. Menunda konvergensi ke `D-DS5` berarti mengirim RC dengan versi mini dari masalah yang sedang kita perbaiki.

Bila argumen ini lebih penting bagi PO daripada risiko freeze, **opsi C (atau B dengan amandemen fitur eksplisit) adalah pilihan yang sah** — asalkan disertai: amandemen `DS-CORE-001` + kontrak fitur terdampak, seeded fixtures, regenerasi 14 baseline, dan Independent Critic dengan konteks segar. Itu urutan kerja yang jauh lebih panjang, dan itulah biaya sebenarnya yang harus disetujui, bukan sekadar "pilih B".

---

## 6. Dampak ke artefak lain — **sudah dijalankan (Add-02 + Add-03)**

| Artefak | Perubahan nyata | Catatan integritas |
|---|---|---|
| `DS-SHELL-001` §2.4, §8, §9, §11 | `D-DS1` → **Diputus PO (A)**; mekanisme 5 token `--shell-font-*` + 3 pengaman ditulis ke kontrak; `D-DS5` dibuka sebagai keputusan resmi; Exit G4 tetap belum dicentang | Tidak bertanda tangan → aman disunting |
| `DECISION-CARD-D-DS1.md` | status → **Diputus PO (A, 15:34:53 WIB)**; §7 diisi; §8 record keputusan ditambahkan | Berkas baru, tidak bertanda tangan |
| `DECISIONS-2026-11-08.md` | **SENGAJA TIDAK DISUNTING** | **Bertanda tangan** → Add-02 di [POST-SIGNATURE-ADDENDUM](POST-SIGNATURE-ADDENDUM-2026-11-08.md) yang mencatat |
| `RATIFICATION-RECORD-2026-11-08.md` | **SENGAJA TIDAK DISUNTING** | `RATIF-SHELL-001` tetap utuh dan manifest v1 tetap 5/5 OK |
| **`RATIFICATION-RECORD-D-DS1-2026-11-08.md`** | **BARU (Add-03)** — `RATIF-SHELL-002`, record ratifikasi eksplisit PO 16:01:39 WIB | Record terpisah, bukan suntingan `RATIF-SHELL-001` |
| **`SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256`** | **BARU (Add-03)** — 2 hash untuk record + kartu | **Nama berbeda**; manifest v1 **tidak ditimpa** |
| `README.md` | `D-DS1` → ✅ **Ratified**; `D-DS5` → Pending resmi; Add-02 + Add-03 ditautkan | Tidak bertanda tangan → aman |
| `HANDOFF-FRESH-SESSION.md` | `D-DS1` → Ratified; prompt verifikasi independen diperbarui | Tidak bertanda tangan → aman |
| `tokens.css` / `tokens.ts` | **TIDAK DISENTUH — masih dilarang** | Butuh `D-DS2`…`D-DS5` + ratifikasi G4 + G5 Critic PASS |

**Yang TIDAK berubah baik saat diputus maupun saat diratifikasi:** status `DS-SHELL-001` (tetap **DRAFT v0.2** — bukan kontrak ratified), 9 keputusan lama Pending, `D-DS2`…`D-DS5` Pending, G1–G6 tetap tertutup, izin kode produksi tetap tidak ada, `tokens.css`/`tokens.ts` tetap beku, dan isi 7 keputusan bertanda tangan tetap utuh. **Ratifikasi `D-DS1` meratifikasi keputusan, bukan kontrak.**

---

## 7. Jawaban PO — TERISI

| Kolom | Isi |
|---|---|
| **Keputusan PO** | ☑ **A** — Aditif `--shell-font-*`; ☐ B ☐ C ☐ Tunda |
| **Bunyi mengikat** | Tambahkan **5 token baru berkategori shell** ke `tokens.css`; `--font-size-sm/md/lg` lama **dibiarkan** pada 11/13/15 px sampai dampaknya dinilai. Wajib disertai **3 pengaman** di §3 opsi A: lint kepemilikan, diff aditif murni, dan pencatatan utang konvergensi `D-DS5`. |
| **Dissent / catatan PO** | Tidak ada (PO menjawab `"A"` tanpa catatan) |
| **Bukti jawaban** | Pesan chat PO `"A"`, **2026-11-08 15:34:53 WIB (GMT+7)** |
| **Paraf** | PO via chat pada sesi terautentikasi — **bukan** tanda tangan digital |
| **Tindakan ratifikasi** | ✅ Pesan chat PO **`"rafitikasi d-ds1"`**, **2026-11-08 16:01:39 WIB (GMT+7)** → [RATIF-SHELL-002](RATIFICATION-RECORD-D-DS1-2026-11-08.md) |
| **Ditandatangani digital?** | ❌ **Tidak.** `SIG-SHELL-2026-11-08-01` hanya mencakup 7 keputusan bentuk shell dan **tidak** berlaku untuk `D-DS1`. Ratifikasi ini sah lewat pernyataan eksplisit PO, sama seperti dasar ratifikasi 7 keputusan pada 14:04 WIB sebelum tanda tangan digital opsional 14:23 WIB |

**Status keputusan:** ✅ **`Ratified oleh PO (2026-11-08 16:01:39 WIB)`** — naik dari `Diputus PO (15:34:53 WIB)` setelah pernyataan eksplisit. **Sumber kebenaran tunggal:** [RATIF-SHELL-002](RATIFICATION-RECORD-D-DS1-2026-11-08.md). Bila ada beda wording, **record ratifikasi yang menang**.

---

## 8. Record keputusan `D-DS1 = A`

| Butir | Isi |
|---|---|
| **ID** | `D-DS1` |
| **Waktu pilihan** | 2026-11-08 **15:34:53 WIB (GMT+7)** — dari `current_time` sesi, bukan dikarang |
| **Waktu ratifikasi** | 2026-11-08 **16:01:39 WIB (GMT+7)** — pernyataan eksplisit `"rafitikasi d-ds1"` |
| **Status akhir** | ✅ **`Ratified oleh PO`** — [RATIF-SHELL-002](RATIFICATION-RECORD-D-DS1-2026-11-08.md) |
| **Pemilik** | Product Owner, sesi WorkBuddy terautentikasi (nama hukum sengaja tidak direka) |
| **Dasar** | Jawaban `"A"` terhadap [kartu keputusan](DECISION-CARD-D-DS1.md) ini; §2 bukti, §4 reasoning, §5 argumen penentang sudah tersedia **sebelum** jawaban. Pengesahan: `"rafitikasi d-ds1"` |
| **Objek** | **Mekanisme migrasi token saja.** Tidak membuka kembali nilai skala `D-S4` (24/18/15/14/12) |
| **Berlaku untuk** | Penyusunan `DS-SHELL-001` dan turunannya; lint / diff discipline pada masa depan |
| **TIDAK berlaku untuk** | Ratifikasi kontrak, amandemen `DS-CORE-001`, kontrak fitur ratified, `generated.ts`/IPC, perubahan `tokens.css`/`tokens.ts`, regenerasi baseline, G4/G5 exit, kode produksi |
| **Yang ditolak eksplisit** | **B** (remap global `--font-size-*`), **C** (alias + migrasi bertahap), **Tunda** |
| **Konsekuensi baru** | **`D-DS5` dibuka sebagai keputusan resmi Pending**: strategi & waktu konvergensi dua skala. Sebelum ini hanya berstatus *usulan* |
| **Utang yang dicatat, bukan disembunyikan** | `body` shell 14px vs fitur 13px; `caption` 12px vs 11px → ketidakkonsistenan visual nyata (§5). 14 baseline **tetap** akan bergeser; regenerasi menunggu `D-DS4` + `D-S7` |
| **Catatan proses** | PO memutus di sesi yang sama dengan penyusunan kartu, menyimpang dari rekomendasi sesi segar. Keputusan **tetap sah** (otoritas PO). Kewajiban **Independent Critic G5 dengan konteks segar** dan ratifikasi kontrak **tidak terhapus** |
| **Integritas** | 5 berkas bertanda tangan **tidak disunting**; Add-02 + **Add-03** di [POST-SIGNATURE-ADDENDUM-2026-11-08.md](POST-SIGNATURE-ADDENDUM-2026-11-08.md); manifest **v1 tetap 5/5 OK** + manifest baru `SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256` **2/2 OK** |
| **Bentuk tanda tangan** | ❌ Tidak ada tanda tangan digital. Ratifikasi sah lewat pernyataan PO eksplisit; tanda tangan digital bila diinginkan adalah tindakan terpisah dengan Signature ID baru |
| **Pembatalan / amandemen** | Hanya lewat **`RATIF-SHELL-003`** yang merujuk [RATIF-SHELL-002](RATIFICATION-RECORD-D-DS1-2026-11-08.md) §8; bukan suntingan diam-diam pada record ini |

**Prasyarat yang masih harus dipenuhi sebelum satu baris `tokens.css` ditulis:** `D-DS2`, `D-DS3`, `D-DS4`, `D-DS5` diputus → `D-S7` (seeded fixtures + toleransi ≤5%) → `DS-SHELL-001` diratifikasi PO → G4 exit → **Independent Critic (G5) PASS dengan konteks segar**. Sampai saat itu, keputusan `A` bersifat **desain**, bukan **implementasi**.
