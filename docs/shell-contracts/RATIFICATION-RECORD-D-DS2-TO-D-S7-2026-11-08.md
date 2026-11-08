# RATIF-SHELL-003 — Record Ratifikasi PO atas 5 Keputusan Mekanisme G4 + D-S7

**ID record:** `RATIF-SHELL-003`
**Tanggal:** 2026-11-08 · **Waktu:** 17:15:33 WIB (GMT+7)
**Pernyataan PO:** `"ya ratifikasi semyua 5 keputusan buat , process menjadi lebih efekftif"`
**Sifat:** Record ratifikasi eksplisit oleh PO — **terpisah** dari `RATIF-SHELL-001` dan `RATIF-SHELL-002`, **bukan** suntingan keduanya.
**Status ratifikasi:** **Ratified oleh PO (2026-11-08 17:15:33 WIB)** — **bukan** tanda tangan digital, **bukan** ratifikasi kontrak, **bukan** G4 exit, **bukan** izin menyentuh `tokens.css`.

---

## 1. Ruang lingkup

Berkas ini SAH untuk **lima keputusan** yang sebelumnya berstatus `Diputus PO (A, Add-04, 16:48:45 WIB)`:

| ID | Keputusan | Status sebelum | Status sesudah |
|---|---|---|---|
| `D-DS2` | 8 state kontrol berlaku untuk **shell saja** | `Diputus PO — A (Add-04)` | ✅ **Ratified oleh PO (A)** |
| `D-DS3` | `font-weight` + `line-height` per tingkat (aditif); radius **tidak diubah** | `Diputus PO — A (Add-04)` | ✅ **Ratified oleh PO (A)** |
| `D-S7` | Seeded fixtures per state + toleransi ≤5% + rute Readiness — sekarang | `Diputus PO — A (Add-04)` | ✅ **Ratified oleh PO (A)** |
| `D-DS4` | Baseline diregenerasi **setelah D-S7** selesai | `Diputus PO — A (Add-04)` | ✅ **Ratified oleh PO (A)** |
| `D-DS5` | Konvergensi dua skala **ditunda ke pasca-RC**; utang teknis tercatat | `Diputus PO — A (Add-04)` | ✅ **Ratified oleh PO (A)** |

Berkas ini TIDAK berlaku untuk: keputusan lain yang masih Pending (8 keputusan: D-F4–D-F8, D-S5, D-S6, D-S8), ratifikasi kontrak `DS-SHELL-001` (tetap DRAFT), ratifikasi kontrak `SCREEN-SHELL-001` (tetap DRAFT v0.2, bertanda tangan), exit gate G4, atau izin implementasi.

---

## 2. Bunyi keputusan yang diratifikasi (autoritatif)

Sumber keputusan: pernyataan PO `"D-DS2 → D-DS3 → D-S7 → D-DS4 → D-DS5 , semua A"` (16:48:45 WIB, Add-04). Sumber ratifikasi: pernyataan PO `"ya ratifikasi semyua 5 keputusan buat , process menjadi lebih efekftif"` (17:15:33 WIB). Bila ada beda wording dengan badan kontrak, **record ini yang menang** untuk lima keputusan di atas.

### D-DS2 = A — Cakupan 8 state kontrol: shell saja

> Delapan state kontrol (default/hover/focus-visible/pressed/selected/disabled/loading/error) berlaku untuk **`button`, `input`, `select` di layer shell R1–R7 saja**. Kontrak DS per fitur tetap authoritative di R4. Menerapkan 8 state global tanpa Critic per fitur = pelanggaran.

**Ditolak:** B (shell + fitur/global), C (shell + amandemen per fitur bertahap).
**Bukti (Confirmed):** 7 fitur sudah punya DS ratified (`DS-PROF-001`, `DS-CLEAN-001`, dst.) — menerapkan global = mengubah tampilan tanpa Critic per fitur.

### D-DS3 = A — Font-weight, line-height, radius

> `title` weight **600**, sisanya **400**. Line-height **1.4** untuk `display`/`title`, **1.5** untuk `subtitle`/`body`/`caption`. Penambahan bersifat **aditif**: `--shell-font-weight-*` dan `--shell-line-height-*` — sama seperti `D-DS1`. **Radius TIDAK diubah** — `--radius-sm: 4px` tetap; ketidaksesuaian dengan `DS-CORE-001` (6px) dicatat sebagai utang amandemen `DS-CORE-001` terpisah.

**Ditolak:** B (weight + line-height + radius diselaraskan sekaligus — menyentuh `DS-CORE-001` dan 7 kontrak fitur), C (tunda semua sampai Critic).
**Bukti (Confirmed):** `tokens.css:84,108,113,118` hanya `700`; `tokens.css:318` `600`; `tokens.css:245` `line-height: 1.5` hanya sekali; `tokens.css:40-41` `--radius-sm: 4px`, `--radius-md: 8px` vs `DS-CORE-001:16` 6/8px.

### D-S7 = A — Toleransi visual + seeded fixtures

> Seeded fixtures per state (populated/loading/error/stale/done/job-running/job-failed/degraded) wajib dibuat sebelum baseline diregenerasi. Toleransi visual regression diturunkan dari `maxDiffPixelRatio: 0.15` → **≤5%**. Rute **Readiness** wajib masuk matriks visual regression. Semua sekarang, bukan ditunda.

**Ditolak:** B (fixtures dulu, toleransi tetap 15% untuk RC), C (tunda keduanya ke pasca-RC).
**Bukti (Confirmed):** `helpers.ts:27,34` mengembalikan `data:null`; `visual.spec.ts:54` `maxDiffPixelRatio: 0.15`; rute Readiness tidak dikunjungi; 28 baseline PNG hanya empty state.

### D-DS4 = A — Strategi regenerasi baseline

> Baseline visual diregenerasi **setelah D-S7 selesai**: seeded fixtures → baseline baru → turunkan toleransi → verifikasi hijau. `D-DS1 = A` tetap menggeser 28 baseline PNG (app bar/rail/stepper ada di setiap screenshot). Regenerasi tanpa fixtures = false confidence.

**Ditolak:** B (regenerasi sekarang dengan fixtures sementara), C (tunda sampai konvergensi D-DS5).
**Bukti (Confirmed):** 28 baseline PNG ter-commit; app bar/rail/stepper di setiap screenshot → pergeseran pasti.
**Prasyarat:** D-S7 harus diputus lebih dulu — **sudah diputus (A, Add-04) dan sekarang diratifikasi (record ini).**

### D-DS5 = A — Konvergensi dua skala tipografi

> Konvergensi token `--font-size-*` lama (11/13/15) dengan `--shell-font-*` baru (24/18/15/14/12) **ditunda ke pasca-RC**. Dua skala berdampingan diterima sebagai **utang teknis yang tercatat**. Tunda sah, tetapi wajib ada **tenggat eksplisit** dan **kondisi pemicu (trigger)** yang ditentukan PO.

**Ditolak:** B (konvergensi sekarang dengan amandemen per fitur — tidak proporsional di RC), C (hapus token lama sekarang — berbahaya, melanggar stop rule).
**Bukti (Confirmed):** `body` shell 14px vs fitur 13px, `caption` 12px vs 11px = ketidakkonsistenan nyata; 16 deklarasi global + 28 komponen + 7 kontrak fitur ratified terlibat.

---

## 3. Yang TIDAK diratifikasi oleh record ini

- Kontrak `DS-SHELL-001` tetap **DRAFT** (sekarang v0.4 setelah transkrip ratifikasi). Ratifikasi keputusan ≠ ratifikasi kontrak.
- Kontrak `SCREEN-SHELL-001` tetap **DRAFT v0.2**, **bertanda tangan** — `D-S7` di badan teksnya tetap `☐ Pending`; koreksi via addendum (Add-04 + Add-05). Berkas **tidak disunting**.
- 8 keputusan Pending (D-F4–D-F8, D-S5, D-S6, D-S8) tetap Pending.
- G1/G2/G3/G4/G5/G6: **tidak ada gate yang exit**.
- `tokens.css` / `tokens.ts` tetap **beku** — butuh ratifikasi kontrak + G4 exit + Independent Critic (G5) PASS.
- `docs/status-register.md` tetap tidak ditambah baris.
- Tidak ada kode produksi yang diizinkan.

---

## 4. Perubahan status oleh record ini

| ID | Status sebelum (Add-04, 16:48:45 WIB) | Status sesudah (record ini, 17:15:33 WIB) |
|---|---|---|
| `D-DS2` | `Diputus PO — A` | ✅ **`Ratified oleh PO (A, 2026-11-08 17:15:33 WIB, RATIF-SHELL-003)`** |
| `D-DS3` | `Diputus PO — A` | ✅ **`Ratified oleh PO (A, 2026-11-08 17:15:33 WIB, RATIF-SHELL-003)`** |
| `D-S7` | `Diputus PO — A` | ✅ **`Ratified oleh PO (A, 2026-11-08 17:15:33 WIB, RATIF-SHELL-003)`** |
| `D-DS4` | `Diputus PO — A` | ✅ **`Ratified oleh PO (A, 2026-11-08 17:15:33 WIB, RATIF-SHELL-003)`** |
| `D-DS5` | `Diputus PO — A` | ✅ **`Ratified oleh PO (A, 2026-11-08 17:15:33 WIB, RATIF-SHELL-003)`** |

**Total keputusan ratified:** 7 (RATIF-SHELL-001) + 1 (RATIF-SHELL-002) + 5 (record ini) = **13 ratified**. Tersisa **8 Pending** (D-F4–D-F8, D-S5, D-S6, D-S8).

---

## 5. Rantai bukti

| Langkah | Waktu | Bukti |
|---|---|---|
| PO menyusun panduan sesi 5 keputusan | 16:33 WIB | `SESSION-GUIDE-D-DS2-TO-D-S7.md` |
| PO menjawab `"semua A"` untuk 5 keputusan | 16:48:45 WIB | Add-04 di `POST-SIGNATURE-ADDENDUM-2026-11-08.md` §9 |
| Transkrip ke `DS-SHELL-001.md` (§2.5, §8, §9, §11, §12) | 16:48–17:00 WIB | DRAFT v0.3 |
| Sinkronisasi `README.md` v0.6, `HANDOFF`, addendum Add-04 | 16:48–17:00 WIB | Berkas diperbarui |
| PO menyatakan `"ya ratifikasi semyua 5 keputusan"` | 17:15:33 WIB | Record ini (§1, §2) |
| Manifest v3 dibuat | 17:15 WIB | `SIGNATURE-MANIFEST-RATIF-SHELL-003-2026-11-08.sha256` |
| Verifikasi manifest v1, v2, v3 | 17:15 WIB | `shasum -a 256 -c` — masing-masing OK |

---

## 6. Integritas

| Manifest | Berkas | Hash | Status |
|---|---|---|---|
| v1 `SIGNATURE-MANIFEST-2026-11-08.sha256` | 5 berkas bertanda tangan | tetap | **5/5 OK** (tidak berubah) |
| v2 `SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256` | 2 berkas (record + kartu D-DS1) | tetap | **2/2 OK** (tidak berubah) |
| v3 `SIGNATURE-MANIFEST-RATIF-SHELL-003-2026-11-08.sha256` | 1 berkas (record ini) | baru | **1/1 OK** (baru) |

Verifikasi:

```bash
cd docs/shell-contracts
shasum -a 256 -c SIGNATURE-MANIFEST-2026-11-08.sha256                              # expect: 5/5 OK
shasum -a 256 -c SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256              # expect: 2/2 OK
shasum -a 256 -c SIGNATURE-MANIFEST-RATIF-SHELL-003-2026-11-08.sha256              # expect: 1/1 OK
```

Manifest v1 dan v2 **tidak ditimpa**. Setiap manifest dengan nama berbeda, konsisten dengan preseden Add-03.

---

## 7. Batas kejujuran

1. **Ratifikasi ini terjadi di sesi yang sama dengan keputusan dan penyusunan panduan**, menyimpang dari rekomendasi sesi segar di `HANDOFF-FRESH-SESSION.md` §1 dan `SESSION-GUIDE-D-DS2-TO-D-S7.md` §5. **Ratifikasi tetap sah** — otoritas PO tidak bergantung pada rekomendasi proses.
2. **Argumen penentang A** untuk setiap keputusan tersedia di `SESSION-GUIDE-D-DS2-TO-D-S7.md` §3, sudah dibaca sebelum jawaban PO.
3. **Tanda tangan digital? Tidak.** Ratifikasi sah lewat pernyataan PO eksplisit. Bila PO menginginkan tanda tangan digital, itu tindakan terpisah dengan Signature ID baru.
4. **`D-S7` di `SCREEN-SHELL-001.md` tetap `☐ Pending`** di badan teks — berkas bertanda tangan, tidak disunting. Status aktual: `Ratified oleh PO (17:15:33 WIB)` lewat record ini. Koreksi via addendum (Add-04 + Add-05).
5. **`tokens.css` tetap beku.** Ratifikasi 5 keputusan + D-DS1 = 6 keputusan ratified, tetapi kontrak `DS-SHELL-001` belum diratifikasi dan G4 belum exit.

---

## 8. Aturan pembatalan

Record ini dapat dibatalkan hanya oleh:
1. Pernyataan eksplisit PO yang menarik kembali ratifikasi ("batalkan ratifikasi D-DS2…" atau setara).
2. Temuan Critic (G5) bahwa transkrip keputusan ke `DS-SHELL-001.md` tidak setia pada bunyi opsi A — dalam hal ini, keputusan tetap sah tetapi transkrip harus diperbaiki.
3. Konflik dengan kontrak fitur ratified yang belum teridentifikasi — diselesaikan via amandemen PO, bukan pembatalan otomatis.

---

## 9. Versi

**Versi 1.0** — dibuat 2026-11-08 17:15:33 WIB. Record ini bersifat tetap; perubahan hanya melalui amandemen PO eksplisit.
