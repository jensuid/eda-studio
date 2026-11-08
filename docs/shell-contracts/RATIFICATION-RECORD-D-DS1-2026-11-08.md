# RATIF-SHELL-002 — Record Ratifikasi PO untuk Keputusan `D-DS1`

**ID:** RATIF-SHELL-002 · **Status:** BERLAKU — **1 keputusan (`D-DS1`) diratifikasi PO**; kontrak induknya tetap **DRAFT**.
**Tanggal / waktu:** 2026-11-08 **16:01:39 WIB (GMT+7)** — dari `current_time` sesi, bukan dikarang.
**Dasar ratifikasi:** pernyataan eksplisit PO `"rafitikasi d-ds1"` pada sesi WorkBuddy terautentikasi.
**Metode:** pengesahan lewat pernyataan chat PO. **BUKAN** tanda tangan digital, **BUKAN** PKI, **BUKAN** tanda tangan elektronik tersertifikasi secara hukum.
**Record sebelumnya:** [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) (7 keputusan, 14:04 WIB, ditandatangani digital 14:23:54 WIB) — **tetap utuh dan tidak disunting**.
**Integritas:** `SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256` (manifest **baru, bernama berbeda**); manifest v1 `SIGNATURE-MANIFEST-2026-11-08.sha256` **tidak ditimpa**.

> **Berkas ini SAH untuk SATU keputusan `D-DS1` yang disebut di §2, dan TIDAK berlaku untuk hal lain.**
> Ratifikasi keputusan **bukan** ratifikasi kontrak, **bukan** izin implementasi, **bukan** pembukaan G4/G5, **bukan** amandemen `DS-CORE-001`, dan **bukan** perubahan IPC/backend/kode produksi.

---

## 1. Dasar & ruang lingkup

| Butir | Isi |
|---|---|
| **Yang diratifikasi** | **`D-DS1 = A`** — mekanisme migrasi token tipografi: **aditif `--shell-font-*`** |
| **Sebelumnya** | `Diputus PO` sejak 15:34:53 WIB ([kartu §8](DECISION-CARD-D-DS1.md)), status **belum ratified** |
| **Sekarang** | **`Ratified oleh PO (2026-11-08 16:01:39 WIB)`** |
| **Sumber bunyi keputusan** | [DECISION-CARD-D-DS1.md](DECISION-CARD-D-DS1.md) §3 opsi A, §7 jawaban, §8 record |
| **Jenjang yang ditempuh** | Pilihan `"A"` (15:34:53) → ratifikasi eksplisit `"rafitikasi d-ds1"` (16:01:39). **Same pattern as** 7 keputusan sebelumnya: pilihan 13:10 → `"sy mau ratifikiasi 7 decision iut"` 14:04 |
| **Pemilik** | Product Owner, sesi WorkBuddy terautentikasi. Nama hukum sengaja **tidak direka** |
| **Dissent / catatan** | Tidak ada |
| **Sifat** | Keputusan **mekanisme**. Tidak membuka kembali nilai skala `24/18/15/14/12` yang sudah diratifikasi `D-S4` lewat `RATIF-SHELL-001` |

**Mengapa record baru, bukan menyunting `RATIF-SHELL-001`:** record lama dilindungi `SIGNATURE-MANIFEST-2026-11-08.sha256` dan menjadi bukti dari apa yang ditandatangani pada 14:23:54 WIB. Menyuntingnya akan merusak bukti historis. Prinsipnya sama dengan snapshot immutable di domain aplikasi: **amandemen = artefak baru, bukan mutasi artefak lama**.

---

## 2. Bunyi keputusan yang MENGIKAT

| # | Ketentuan | Status |
|---|---|---|
| 1 | Tambahkan **5 token baru berkategori shell**: `--shell-font-display: 24px`, `--shell-font-title: 18px`, `--shell-font-subtitle: 15px`, `--shell-font-body: 14px`, `--shell-font-caption: 12px` | **Ratified** |
| 2 | Token lama `--font-size-sm: 11px`, `--font-size-md: 13px`, `--font-size-lg: 15px` **dibiarkan apa adanya**, termasuk 16 deklarasi selector global di `tokens.css` yang memakainya | **Ratified** |
| 3 | Kelima token baru dipakai **hanya** oleh selector milik shell R1–R7. Selector fitur dilarang memakainya; selector shell dilarang memakai `--font-size-*` | **Ratified** |
| 4 | `frontend/src/shared/tokens.ts` **tidak diubah** oleh keputusan ini (tidak ada elemen canvas milik shell). Mirror numerik hanya disentuh lewat amandemen terpisah | **Ratified** |
| 5 | **Diff aditif murni:** saat implementasi kelak diizinkan, `git diff frontend/src/shared/tokens.css` wajib **hanya menambah baris** — nol baris nilai lama diubah/dihapus. Bukti diff dilampirkan ke `QA-SHELL-001` | **Ratified** |
| 6 | **Utang konvergensi wajib dicatat** sebagai keputusan terbuka **`D-DS5`**; menghapus atau menyatukan token lama tanpa keputusan `D-DS5` = pelanggaran kontrak | **Ratified** |
| 7 | **Kejujuran baseline:** A **tidak** membuat 14 baseline tetap hijau (app bar / rail / stepper muncul di tiap screenshot). Regenerasi baseline tetap wajib, menunggu `D-DS4` + `D-S7` | **Ratified sebagai fakta, bukan janji** |

**Ditolak secara eksplisit:** **B** — remap global `--font-size-*`; **C** — alias + migrasi bertahap per fitur; **Tunda**.

Bila ada perbedaan wording antara [DS-SHELL-001](DS-SHELL-001.md) §2.4 dan record ini, **record ini yang menang**. Amandemen wajib lewat record baru, bukan suntingan diam-diam.

---

## 3. Yang TIDAK diratifikasi

| Hal | Status |
|---|---|
| `DS-SHELL-001` sebagai kontrak | **Tetap DRAFT v0.2** — ratifikasi keputusan ≠ ratifikasi kontrak |
| `D-DS2`, `D-DS3`, `D-DS4`, `D-DS5` | ☐ **Pending** (4 keputusan mekanisme) |
| 9 keputusan lama `D-F4`…`D-F8`, `D-S5`…`D-S8` | ☐ **Pending** |
| `FLOW-SHELL-001` / `SCREEN-SHELL-001` | **Tetap DRAFT v0.2** |
| `APP-ARCH-001` / `JOB-SHELL-001` | **Tetap DRAFT v0.1** |
| `QA-SHELL-001` | **Belum didraft** |
| G1 / G2 / G3 / G4 / G5 / G6 | **Tidak ada gate yang exit** |
| Amandemen `DS-CORE-001`, Doc08 §19, `BASELINE-FREEZE-v1.0.md` | **TIDAK ada amandemen baru.** `D-DS1` adalah mekanisme penulisan token, bukan nilai *detailed design tokens / visual theme*; amandemen terbatas sudah dicatat di `RATIF-SHELL-001` §4 dan tidak berubah |
| `frontend/src/shared/tokens.css`, `tokens.ts`, `generated.ts`, kode produksi | **Tetap DILARANG disunting** |
| `docs/status-register.md`, migrasi ke `docs/ux-contracts/` | **Tidak ditambah baris / tidak dipindah** |

---

## 4. Perubahan status artefak akibat record ini

| Artefak | Sebelum | Sesudah |
|---|---|---|
| `D-DS1` | `Diputus PO` (15:34:53) | ✅ **`Ratified oleh PO` (16:01:39)** — `RATIF-SHELL-002` |
| [DECISION-CARD-D-DS1.md](DECISION-CARD-D-DS1.md) | kartu + record keputusan | Status naik; §7/§8 menunjuk record ini |
| [DS-SHELL-001.md](DS-SHELL-001.md) | DRAFT v0.2 dengan transkrip `Diputus PO` | DRAFT v0.2 dengan penanda `[RATIFIED]`; status kontrak **tidak naik** |
| `README.md` | v0.4 | v0.5 |
| [POST-SIGNATURE-ADDENDUM-2026-11-08.md](POST-SIGNATURE-ADDENDUM-2026-11-08.md) | Add-01 + Add-02 | + **Add-03** |
| [HANDOFF-FRESH-SESSION.md](HANDOFF-FRESH-SESSION.md) | `D-DS1` = Diputus PO | `D-DS1` = Ratified; prompt verifikasi diperbarui |
| Manifest | hanya v1 (5 hash) | v1 **utuh** + **manifest baru bernama berbeda** |

---

## 5. Rantai bukti

| Waktu | Peristiwa | Bukti |
|---|---|---|
| 2026-11-08 14:04 WIB | PO meratifikasi 7 keputusan bentuk shell | `RATIF-SHELL-001` |
| 2026-11-08 14:23:54 WIB | PO menandatangani worksheet secara digital | `SIG-SHELL-2026-11-08-01`, manifest v1 |
| 2026-11-08 15:34:53 WIB | PO menjawab `"A"` untuk `D-DS1` → **pilihan**, belum ratified | kartu §8, Add-02 |
| 2026-11-08 **16:01:39 WIB** | PO menyatakan **`"rafitikasi d-ds1"`** → **tindakan pengesahan** | **Record ini**, Add-03, manifest baru |

**Bukti penerimaan yang masih WAJIB sebelum nilai ini boleh dipakai di kode** (ratifikasi tidak menghapusnya):

- `D-DS2`…`D-DS5` diputus PO.
- `D-S7`: seeded fixtures per state + penurunan toleransi `0.15` → ≤5%; `readiness` masuk matriks visual.
- Pengukuran kontras nyata kelima tingkat pada `surface` / `surface-raised`, termasuk `caption` 12px.
- `DS-SHELL-001` diratifikasi sebagai kontrak + G4 exit.
- **Independent Critic (G5) PASS dengan konteks segar**, temuan berlabel `Confirmed / Likely / Suggestion`.
- Bukti `git diff` aditif murni untuk `tokens.css` dicatat di `QA-SHELL-001`.

Disiplin: **test yang tidak dijalankan bukan PASS**; screenshot prototipe disposable `prototypes/shell-v0/` bukan bukti penerimaan.

---

## 6. Integritas

Manifest **baru** (v1 sengaja tidak ditimpa):

```
SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256
```

Isinya = SHA-256 dari **2 berkas yang merupakan objek ratifikasi**:
`RATIFICATION-RECORD-D-DS1-2026-11-08.md` dan `DECISION-CARD-D-DS1.md`.

`DS-SHELL-001.md` **sengaja tidak dimasukkan** ke dalam manifest: kontrak itu masih DRAFT dan pasti akan disunting lagi saat `D-DS2`…`D-DS5` diputus, sehingga hash-nya akan berubah secara wajar. Konsistensi transkripnya diverifikasi lewat tautan dan review, bukan lewat hash.

```bash
cd docs/shell-contracts
shasum -a 256 -c SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256   # expect: 2/2 OK
shasum -a 256 -c SIGNATURE-MANIFEST-2026-11-08.sha256                    # expect: 5/5 OK (v1 tetap utuh)
```

**Pemisahan yang disengaja:** manifest v1 melindungi tanda tangan digital `SIG-SHELL-2026-11-08-01` atas 7 keputusan; manifest baru ini melindungi **ratifikasi `D-DS1` yang tidak ditandatangani digital**. Keduanya tidak boleh disatukan, karena status hukumnya berbeda.

---

## 7. Batas kejujuran

- Ratifikasi ini **sah secara internal** sebagai pengesahan PO dalam sesi terautentikasi — dasar yang **sama persis** dengan ratifikasi 7 keputusan pada 14:04 WIB sebelum tanda tangan digital opsional ditambahkan pada 14:23 WIB.
- Ini **bukan** tanda tangan kriptografik berbasis kunci privat/PKI dan **bukan** tanda tangan elektronik tersertifikasi secara hukum. Tidak ada identitas hukum yang diverifikasi; tidak ada nama yang direka.
- Bila PO menginginkan bentuk tanda tangan digital untuk record ini, itu adalah **tindakan terpisah** yang harus diminta eksplisit (preseden: `"sy sign secara digital aja worksheet nya"`), dan akan menghasilkan **Signature ID baru** + update manifest baru — bukan perubahan pada `SIG-SHELL-2026-11-08-01`.

---

## 8. Pembatalan / amandemen

Perubahan apa pun pada bunyi §2 wajib melalui **`RATIF-SHELL-003`** yang merujuk ID ini, dengan rantai bukti baru. Dilarang menyunting record ini diam-diam; bila terpaksa, hash pada manifest §6 akan gagal dan harus diterbitkan manifest bernama baru dengan penjelasan. `RATIF-SHELL-001` tidak boleh dijadikan wadah amandemen untuk `D-DS1`.

---

## 9. Versi

- **Versi:** v1.0 — ratifikasi 2026-11-08 16:01:39 WIB.
- **Cakupan:** 1 keputusan (`D-DS1 = A`).
- **Berkas ini adalah sumber kebenaran tunggal** untuk status ratifikasi `D-DS1`. Untuk bunyi 7 keputusan bentuk shell, tetap [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) §2.

---

**Status akhir:** `D-DS1 = A` **Ratified oleh PO**. Kontrak induk tetap DRAFT, tidak ada gate yang exit, dan `tokens.css` tetap tidak boleh disentuh.
