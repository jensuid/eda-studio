# Addendum Pasca-Tanda-Tangan — 2026-11-08 (Add-01 + Add-02 + Add-03 + Add-04 + Add-05 + Add-06)

**Sifat:** CATATAN PERUBAHAN STATUS & RECORD KEPUTUSAN, **bukan** amandemen 7 keputusan, **bukan** ratifikasi kontrak, **bukan** tanda tangan digital baru, **bukan** kontrak.
**Add-01** = dua draft baru + 8 kalimat usang (§1–§6). **Add-02** = keputusan PO `D-DS1 = A`, **15:34:53 WIB** (§7). **Add-03** = ratifikasi PO `D-DS1 = A`, **16:01:39 WIB** (§8). **Add-04** = keputusan PO `D-DS2 = A`, `D-DS3 = A`, `D-S7 = A`, `D-DS4 = A`, `D-DS5 = A`, **16:48:45 WIB** (§9). **Add-05** = ratifikasi PO `D-DS2 = A`, `D-DS3 = A`, `D-S7 = A`, `D-DS4 = A`, `D-DS5 = A`, **17:15:33 WIB** via `RATIF-SHELL-003` (§10). **Add-06** = ratifikasi PO `D-F4 = A`, `D-F5 = A`, `D-F6 = A`, `D-F7 = A`, `D-F8 = A`, `D-S5 = A`, `D-S6 = A`, `D-S8 = A`, **17:38:27 WIB** via `RATIF-SHELL-004` (§11).
**Tanda tangan yang dimaksud:** `SIG-SHELL-2026-11-08-01` (2026-11-08 14:23:54 WIB), manifest `SIGNATURE-MANIFEST-2026-11-08.sha256`.
**Objek yang ditandatangani:** **hanya 7 keputusan bentuk shell** (`D-F1`, `D-F2`, `D-F3`, `D-S1`, `D-S2`, `D-S3`, `D-S4`), sebagaimana tercantum di [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) §2.

---

## 1. Mengapa addendum ini perlu

Setelah penandatanganan, dua draft baru ditambahkan:

| Berkas | Gate | Status |
|---|---|---|
| [JOB-SHELL-001.md](JOB-SHELL-001.md) | G1 | **DRAFT v0.1** — belum diratifikasi |
| [APP-ARCH-001.md](APP-ARCH-001.md) | Application layer | **DRAFT v0.1** — belum diratifikasi |

Akibatnya, **delapan kalimat** di dalam 5 berkas yang dilindungi manifest menjadi usang secara faktual. Kelima berkas itu adalah:

```
RATIFICATION-SESSION-01.md
RATIFICATION-RECORD-2026-11-08.md
DECISIONS-2026-11-08.md
FLOW-SHELL-001.md
SCREEN-SHELL-001.md
```

**Keputusan integritas:** kelima berkas **SENGAJA TIDAK DIEDIT**. Menyuntingnya lalu me-refresh hash akan menghapus bukti tentang *apa yang sebenarnya ada pada saat PO menandatangani*. Manifest v1 dibiarkan **immutable** sebagai bukti historis; koreksi status ditempatkan di addendum ini. Ini konsisten dengan prinsip yang sama dengan snapshot immutable di domain aplikasi.

---

## 2. Daftar pernyataan yang kini usang

| # | Berkas : baris | Pernyataan tertanda | Fakta per Add-01 |
|---|---|---|---|
| 1 | `RATIFICATION-RECORD-2026-11-08.md:59` | `` `APP-ARCH-001`, `JOB-SHELL-001`, `QA-SHELL-001` — **Belum didraft** `` | `APP-ARCH-001` & `JOB-SHELL-001` **DRAFT v0.1 tersedia**; hanya `QA-SHELL-001` yang belum didraft |
| 2 | `RATIFICATION-RECORD-2026-11-08.md:118` | "Selanjutnya: draft `APP-ARCH-001`, `JOB-SHELL-001` (G1), `QA-SHELL-001` (G6)." | Dua item pertama **selesai sebagai draft** (belum ratifikasi); `QA-SHELL-001` tetap terbuka |
| 3 | `RATIFICATION-SESSION-01.md:218` | `- [ ] Draft APP-ARCH-001, JOB-SHELL-001 (G1), QA-SHELL-001 (G6).` | Centang **sebagian**: 2/3 draft ada. Kotak sengaja tetap tidak dicentang karena masih ada `QA-SHELL-001` dan karena draft ≠ ratifikasi |
| 4 | `FLOW-SHELL-001.md:4` | "**Parent:** JOB-SHELL-001 (belum didraft; anchor G1 di bawah bersifat provisional)" | Parent kini **DRAFT v0.1 tersedia**. Anchor G1 di §G1 digantikan oleh Job Contract lengkap; lihat §3 |
| 5 | `FLOW-SHELL-001.md:24` | `## G1 — Job anchor (provisional, menunggu JOB-SHELL-001)` | Anchor **provisional digantikan** [JOB-SHELL-001](JOB-SHELL-001.md) §1 untuk keperluan draft. Bunyi 3 keputusan ratified di badan FLOW **tidak berubah** |
| 6 | `FLOW-SHELL-001.md:200` | `- [ ] JOB-SHELL-001 didraft dan diratifikasi.` | **Didraft ✅ / diratifikasi ❌** → kotak **tetap belum dicentang** |
| 7 | `DECISIONS-2026-11-08.md:76` | `Draft APP-ARCH-001, JOB-SHELL-001, QA-SHELL-001 — ☐ belum` | Berubah menjadi **sebagian**: 2 DRAFT v0.1, 1 belum. Status 7 keputusan ratified **tidak berubah** |
| 8 | `SCREEN-SHELL-001.md:255` | "`APP-ARCH-001` belum didraft, `JOB-SHELL-001` belum ada — kotak tetap belum dicentang" | Keduanya **DRAFT v0.1 tersedia**. Kesimpulan akhir kalimat **masih benar**: kotak tetap belum dicentang karena prasyaratnya juga mencakup **ratifikasi G1** |

**Catatan penting untuk #8:** prasyarat Exit G3 bukan sekadar "berkas ada", melainkan "`JOB-SHELL-001` (G1) **diratifikasi**". Jadi kehadiran dua draft **tidak menaikkan** status G3. Tidak ada kotak centang yang boleh dibuka oleh addendum ini.

---

## 3. Batas penggantian anchor G1

[JOB-SHELL-001](JOB-SHELL-001.md) §1 menyajikan Job Contract lengkap sesuai templat `03-artifact-templates.md` §2 (`job / actor / trigger / frequency / inputs / desired_outcome / success_signal / failure_cost / not_in_scope`). Isinya **selaras** dengan anchor provisional, dengan tiga penguatan:

1. `actor` dirinci ke Persona A/B dan satu state bersama (Doc01 §3.2).
2. `success_signal` diikat ke walkthrough Doc01 §11.1 **dengan seeded fixtures**, bukan screenshot empty state.
3. `not_in_scope` mencantumkan secara eksplisit penolakan `D-F1` terhadap stepper 10 stage / `In Progress` / persentase.

**Yang tidak berubah:** tidak ada keputusan PO baru; tidak ada ratifikasi; 9 keputusan lama + 4 keputusan `D-DS*` tetap Pending; `RATIF-SHELL-001` tetap sumber kebenaran tunggal untuk bunyi 7 keputusan. Bila di kemudian hari ada perbedaan wording antara `JOB-SHELL-001` dan `RATIF-SHELL-001` §2, **record ratifikasi yang menang**.

---

## 4. Dampak pada `SIGNATURE-MANIFEST-2026-11-08.sha256`

| Pertanyaan | Jawaban |
|---|---|
| Apakah manifest v1 diubah? | **Tidak.** Isi 5 hash tetap apa adanya |
| Apakah perlu manifest v2? | **Tidak untuk Add-01 maupun Add-02** — tidak ada berkas bertanda tangan yang disunting pada kedua putaran. **Add-03 membuat manifest baru bernama berbeda** (`SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256`, 2 hash) untuk record ratifikasi + kartu; v1 tetap utuh |
| Apakah verifikasi masih lulus? | **Ya — v1: 5/5 OK; v2: 2/2 OK** (diverifikasi setelah Add-03) |
| Kapan manifest baru diperlukan? | **Add-03 sudah membuatnya:** PO menyatakan `"rafitikasi d-ds1"` (16:01:39 WIB) → `RATIF-SHELL-002` + `SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256`. Manifest v1 tetap **tidak ditimpa** |

Verifikasi:

```bash
cd docs/shell-contracts
shasum -a 256 -c SIGNATURE-MANIFEST-2026-11-08.sha256
```

---

## 5. Yang TIDAK berubah sama sekali (oleh Add-01, Add-02, maupun Add-03)

- Tujuh bunyi keputusan ratified dan tanda tangan `SIG-SHELL-2026-11-08-01`.
- `FLOW-SHELL-001` / `SCREEN-SHELL-001` = **DRAFT v0.2**; `DS-SHELL-001` tetap berstatus **DRAFT** (nomor versi naik v0.1 → v0.2 karena transkrip keputusan, **bukan** karena ratifikasi kontrak).
- G1/G2/G3/G4/G5/G6: **tidak ada gate yang exit**.
- Larangan menyentuh `frontend/src/shared/tokens.css`, `tokens.ts`, `generated.ts`, dan kode produksi apa pun.
- Posisi folder: tetap `docs/shell-contracts/`, **bukan** `docs/ux-contracts/`; `docs/status-register.md` tetap tidak ditambah baris.
- Kewajiban **Independent Critic (G5) dengan konteks segar** — tidak terhapus oleh keputusan maupun ratifikasi PO di sesi penulisan.

**Yang berubah di Add-02:** `D-DS1` Pending → **`Diputus PO (A)`**; `D-DS5` usulan → **keputusan resmi Pending**. Total keputusan terbuka tetap **13** (9 lama + `D-DS2`…`D-DS5`), karena satu selesai dan satu dibuka.

**Yang berubah di Add-03:** `D-DS1` naik dari `Diputus PO` → **`Ratified oleh PO (16:01:39 WIB)`** lewat `RATIF-SHELL-002`. Record ratifikasi terpisah dibuat; manifest baru `SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256` (2 hash, **2/2 OK**); manifest v1 tetap **5/5 OK** dan utuh. `D-DS1` **bukan** tanda tangan digital. Total keputusan terbuka tetap **13 Pending**.

**Yang berubah di Add-04:** `D-DS2`, `D-DS3`, `D-DS4`, `D-DS5`, `D-S7` — semua naik dari `Pending` → **`Diputus PO — A (16:48:45 WIB)`**. `DS-SHELL-001` naik dari **DRAFT v0.2 → DRAFT v0.3**. `README.md` naik ke **v0.6**. Total keputusan terbuka turun dari **13 → 8 Pending** (5 FLOW + 3 SCREEN). Tidak ada manifest baru (keputusan belum ratified). Tidak ada berkas bertanda tangan yang disunting. `tokens.css` / `tokens.ts` tetap beku.

---

## 6. Daftar berkas baru pada putaran ini

| Berkas | Sifat | Bertanda tangan? |
|---|---|---|
| `DECISION-CARD-D-DS1.md` | Kartu + **§8 record keputusan `D-DS1 = A`** (Add-02) → status naik ke **Ratified** (Add-03) | ✅ Dalam manifest v2 |
| `RATIFICATION-RECORD-D-DS1-2026-11-08.md` | `RATIF-SHELL-002` — record ratifikasi eksplisit PO (Add-03, 16:01:39 WIB) | ✅ Dalam manifest v2 |
| `SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256` | Manifest baru (2 hash) untuk `RATIF-SHELL-002` (Add-03) | ❌ Bukan objek; alat verifikasi |
| `JOB-SHELL-001.md` | DRAFT v0.1 kontrak G1 | ❌ Tidak |
| `APP-ARCH-001.md` | DRAFT v0.1 application layer | ❌ Tidak |
| `POST-SIGNATURE-ADDENDUM-2026-11-08.md` | Berkas ini — Add-01 + Add-02 + Add-03 | ❌ Tidak |
| `HANDOFF-FRESH-SESSION.md` | Brief untuk sesi independen (diperbarui Add-02 + Add-03) | ❌ Tidak |
| `README.md`, `DS-SHELL-001.md`, `HANDOFF-FRESH-SESSION.md`, `DECISION-CARD-D-DS1.md` | **Disunting** Add-02 + Add-03 (sinkronisasi register & transkrip ratifikasi) | ❌ Tidak — **tidak ada** yang masuk manifest v1, jadi aman |
| `SESSION-GUIDE-D-DS2-TO-D-S7.md` | Panduan sesi 5 keputusan (dibuat sebelum Add-04) | ❌ Tidak |
| `README.md`, `DS-SHELL-001.md`, `HANDOFF-FRESH-SESSION.md` | **Disunting** Add-04 (transkrip 5 keputusan + sinkronisasi register) | ❌ Tidak — tidak masuk manifest v1/v2 |

**Berkas yang SENGAJA TIDAK disunting pada Add-02:** `RATIFICATION-SESSION-01.md`, `RATIFICATION-RECORD-2026-11-08.md`, `DECISIONS-2026-11-08.md`, `FLOW-SHELL-001.md`, `SCREEN-SHELL-001.md` (kelima berkas bertanda tangan), serta `SIGNATURE-MANIFEST-2026-11-08.sha256`, `tokens.css`, `tokens.ts`, `generated.ts`, `docs/status-register.md`.

---

## 7. Add-02 — Keputusan PO `D-DS1 = A` (2026-11-08 15:34:53 WIB)

| Butir | Isi |
|---|---|
| **Pernyataan PO** | `"A"` — menjawab kartu [`DECISION-CARD-D-DS1.md`](DECISION-CARD-D-DS1.md) §7 |
| **Waktu** | 15:34:53 WIB (GMT+7), dari `current_time` sesi |
| **Keputusan** | **A — Aditif `--shell-font-*`**: 5 token baru khusus shell; `--font-size-sm/md/lg` (11/13/15) dibiarkan; `tokens.ts` tidak berubah; wajib 3 pengaman (lint kepemilikan, diff aditif murni, utang `D-DS5`) |
| **Ditolak** | B (remap global), C (alias bertahap), Tunda |
| **Status** | **`Diputus PO`** — **bukan** `Ratified`, **bukan** tanda tangan digital, **bukan** G4 exit |
| **Record lengkap** | Kartu §8 (bunyi, objek, batas, konsekuensi, pembatalan) |
| **Transkrip** | `DS-SHELL-001.md` → **DRAFT v0.2** §2.4, §8 butir 2 & 7–9, §9, §11, §12 |
| **Sinkronisasi** | `README.md` → v0.4; `HANDOFF-FRESH-SESSION.md` §1/§2/§3/§4/§8; kartu §3/§6/§7/§8 |

**Mengapa ini bukan `Ratified`:** preseden yang berlaku — 7 keputusan sebelumnya mula-mula hanya dicatat sebagai pilihan (`"A"`, `"semua A untuk sisa 6 keputusan"`), lalu naik menjadi ratified **hanya** setelah pernyataan eksplisit PO `"sy mau ratifikiasi 7 decision iut"` (14:04 WIB) yang melahirkan `RATIF-SHELL-001`. Untuk `D-DS1`, pernyataan semacam itu belum ada. Menyebutnya "ratified" sekarang akan mengaburkan jenjang bukti.

**Konsekuensi yang dibuka:** **`D-DS5`** naik dari *usulan* menjadi **keputusan resmi Pending** — strategi & waktu konvergensi dua skala. Alasannya nyata: `body` shell 14px vs fitur 13px, `caption` 12px vs 11px (kartu §5). Tidak boleh diselesaikan diam-diam dengan "membersihkan token lama".

**Penyimpangan proses yang dicatat jujur:** [HANDOFF](HANDOFF-FRESH-SESSION.md) §1 merekomendasikan keputusan ini diambil di sesi konteks segar (karena 7 jawaban A sebelumnya menciptakan *anchoring bias*). PO tetap menjawab di sesi penulisan. **Keputusan sah** — otoritas PO tidak bergantung pada rekomendasi proses — dan argumen penentang A di kartu §5 sudah tersedia sebelum jawaban. Yang **tidak** terhapus: kewajiban **Independent Critic (G5) dengan konteks segar** dan ratifikasi kontrak. Prompt verifikasi independen tersedia di handoff §8.

**Integritas:** manifest v1 **tidak disunting**, `shasum -a 256 -c` tetap **5/5 OK**. Tidak ada `RATIF-SHELL-002` dan tidak ada manifest baru pada putaran ini. `tokens.css` / `tokens.ts` / `generated.ts` / `docs/status-register.md` tetap tidak tersentuh.

---

## 8. Add-03 — Ratifikasi PO `D-DS1 = A` (2026-11-08 16:01:39 WIB)

| Butir | Isi |
|---|---|
| **Pernyataan PO** | `"rafitikasi d-ds1"` — ratifikasi eksplisit keputusan `D-DS1` yang sebelumnya hanya berstatus `Diputus PO` |
| **Waktu** | 16:01:39 WIB (GMT+7), dari `current_time` sesi |
| **Status sebelum** | `Diputus PO (A)` sejak 15:34:53 WIB (Add-02) |
| **Status sesudah** | ✅ **`Ratified oleh PO (2026-11-08 16:01:39 WIB)`** |
| **Record ratifikasi** | [RATIFICATION-RECORD-D-DS1-2026-11-08.md](RATIFICATION-RECORD-D-DS1-2026-11-08.md) — `RATIF-SHELL-002`, record terpisah, **bukan** suntingan `RATIF-SHELL-001` |
| **Manifest baru** | `SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256` — 2 hash (record + kartu); **2/2 OK** |
| **Manifest v1** | `SIGNATURE-MANIFEST-2026-11-08.sha256` — **tidak ditimpa**, tetap **5/5 OK** |
| **Tanda tangan digital?** | ❌ **Tidak.** Ratifikasi sah lewat pernyataan PO eksplisit (preseden: `"sy mau ratifikiasi 7 decision iut"` 14:04 WIB sebelum tanda tangan digital opsional 14:23 WIB). Bila PO menginginkan tanda tangan digital, itu tindakan terpisah dengan Signature ID baru |
| **Yang diratifikasi** | **Mekanisme migrasi token saja** — 5 token `--shell-font-*` aditif, token lama dibiarkan, 3 pengaman wajib. Tidak membuka kembali nilai skala `D-S4` (24/18/15/14/12) |
| **Yang TIDAK diratifikasi** | Kontrak `DS-SHELL-001` (tetap DRAFT v0.2), `D-DS2`…`D-DS5` (tetap Pending), 9 keputusan lama (tetap Pending), G1–G6 (tidak ada gate exit), `tokens.css`/`tokens.ts` (tetap beku), `docs/status-register.md` (tidak ditambah) |
| **Konsekuensi** | Blocker *keputusan* untuk G4 terlepas; blocker *implementasi* tetap ada: `D-DS2`…`D-DS5` → `D-S7` → ratifikasi kontrak → G4 exit → Critic G5 PASS |
| **Sinkronisasi** | `README.md` → v0.5; `DS-SHELL-001.md` §2.4/§8/§9/§11/§12 → `[RATIFIED]`; `HANDOFF-FRESH-SESSION.md` §1/§2/§3/§4/§8/§9; `DECISION-CARD-D-DS1.md` §3/§6/§7/§8 |

**Jenjang bukti yang dipertahankan:**
1. PO menjawab `"A"` (15:34:53 WIB) → pilihan, status `Diputus PO`
2. PO menyatakan `"rafitikasi d-ds1"` (16:01:39 WIB) → pengesahan eksplisit, status naik ke `Ratified oleh PO`
3. `RATIF-SHELL-002` dibuat sebagai record terpisah (bukan suntingan `RATIF-SHELL-001`)
4. Manifest baru dengan nama berbeda dibuat; manifest v1 tetap immutable

**Catatan proses:** keputusan dan ratifikasi terjadi di sesi yang sama dengan penyusunan kartu, menyimpang dari rekomendasi sesi segar di [HANDOFF](HANDOFF-FRESH-SESSION.md) §1. **Keputusan tetap sah** — otoritas PO. Argumen penentang A di kartu §5 sudah tersedia sebelum jawaban. Yang **tidak terhapus**: kewajiban **Independent Critic (G5) dengan konteks segar** dan ratifikasi kontrak.

**Integritas pasca-Add-03:** manifest v1 **5/5 OK** (tidak berubah), manifest v2 **2/2 OK** (baru). Tidak ada berkas bertanda tangan v1 yang disunting. `tokens.css` / `tokens.ts` / `generated.ts` / `docs/status-register.md` tetap tidak tersentuh.

---

## 9. Add-04 — Keputusan PO `D-DS2 = A`, `D-DS3 = A`, `D-S7 = A`, `D-DS4 = A`, `D-DS5 = A` (2026-11-08 16:48:45 WIB)

| Butir | Isi |
|---|---|
| **Pernyataan PO** | `"D-DS2 -> D-DS3 -> D-S7 -> D-DS4 -> D-DS5 , semua A"` — menjawab 5 keputusan mekanisme G4 + D-S7 dalam satu pernyataan |
| **Waktu** | 16:48:45 WIB (GMT+7), dari `date` sesi |
| **Urutan jawaban** | D-DS2 -> D-DS3 -> D-S7 -> D-DS4 -> D-DS5 (menghormati ketergantungan: D-DS4 menunggu D-S7) |
| **Keputusan** | Semua **A** — lihat tabel rinci di bawah |
| **Status** | **`Diputus PO`** untuk semua 5 — **bukan** `Ratified`, **bukan** tanda tangan digital, **bukan** G4 exit |
| **Record lengkap** | Transkrip di `DS-SHELL-001.md` §2.5 (D-DS3), §8 butir 9-12, §9 decision table, §11 Exit G4, §12 traceability |
| **Sinkronisasi** | `README.md` -> v0.6; `HANDOFF-FRESH-SESSION.md` §2.2/§3/§4/§8; `POST-SIGNATURE-ADDENDUM-2026-11-08.md` (berkas ini) §9 |

### Rincian per keputusan

| ID | Opsi | Bunyi ringkas | Bukti (Confirmed) | Yang ditolak |
|---|---|---|---|---|
| `D-DS2` | A | 8 state kontrol berlaku untuk **shell saja**; kontrak DS per fitur tetap authoritative di R4 | 7 fitur sudah punya DS ratified — menerapkan global = mengubah tampilan tanpa Critic per fitur | B (global), C (amandemen per fitur bertahap) |
| `D-DS3` | A | `title` weight 600, lainnya 400; line-height 1.4 (display/title) / 1.5 (lainnya); **radius tidak diubah** | `tokens.css:84,108,113,118` hanya `700`; `tokens.css:318` `600`; `tokens.css:245` `line-height: 1.5` hanya sekali; `--radius-sm: 4px` vs `DS-CORE-001` 6px | B (weight+line-height+radius sekaligus), C (tunda semua) |
| `D-S7` | A | Seeded fixtures per state + toleransi **<=5%** + rute **Readiness** masuk matriks — semua sekarang | `helpers.ts:27,34` mengembalikan `data:null`; `visual.spec.ts:54` `maxDiffPixelRatio: 0.15`; rute Readiness tidak dikunjungi; 28 baseline PNG hanya empty state | B (fixtures dulu, toleransi 15%), C (tunda keduanya) |
| `D-DS4` | A | Baseline diregenerasi **setelah D-S7** selesai: seeded fixtures -> baseline baru -> turunkan toleransi -> verifikasi | 28 baseline PNG ter-commit; app bar/rail/stepper di setiap screenshot -> pergeseran pasti terjadi | B (regenerasi sekarang dengan fixtures sementara), C (tunda sampai D-DS5) |
| `D-DS5` | A | Konvergensi dua skala **ditunda ke pasca-RC**; dua skala berdampingan diterima sebagai utang teknis tercatat | `body` shell 14px vs fitur 13px, `caption` 12px vs 11px = ketidakkonsistenan nyata; 16 deklarasi global + 28 komponen + 7 kontrak fitur | B (konvergensi sekarang), C (hapus token lama sekarang — berbahaya) |

### Bukti yang diverifikasi sebelum keputusan

| Bukti | Sumber | Label |
|---|---|---|
| `tokens.css` tidak punya `font-weight` per tingkat (hanya `700` 4x dan `600` 1x) | `frontend/src/shared/tokens.css:84,108,113,118,318` | **Confirmed** |
| `tokens.css` radius: `--radius-sm: 4px`, `--radius-md: 8px` vs `DS-CORE-001` 6/8px | `tokens.css:40-41` vs `DS-CORE-001:16` | **Confirmed** |
| `tokens.css` `line-height: 1.5` hanya sekali (baris 245) | `tokens.css:245` | **Confirmed** |
| `helpers.ts` mengembalikan `data: null` untuk semua query | `frontend/tests/helpers.ts:27,34` | **Confirmed** |
| `visual.spec.ts` toleransi `maxDiffPixelRatio: 0.15` | `frontend/tests/visual.spec.ts:54` | **Confirmed** |
| `visual.spec.ts` tidak mengunjungi rute Readiness | `frontend/tests/visual.spec.ts` (routes list) | **Confirmed** |
| 28 baseline PNG ter-commit | `find frontend/tests -name '*.png' | wc -l` = 28 | **Confirmed** |

### `D-S7` dan `SCREEN-SHELL-001.md` — berkas bertanda tangan

`D-S7` tercatat di `SCREEN-SHELL-001.md` (§3.10) sebagai keputusan layer G3. Berkas ini **dilindungi** oleh `SIGNATURE-MANIFEST-2026-11-08.sha256` dan **SENGAJA TIDAK DISUNTING** pada Add-04, konsisten dengan preseden Add-01 yang juga tidak menyunting berkas bertanda tangan.

**Status `D-S7` di `SCREEN-SHELL-001.md` tetap `Pending`** — pernyataan usang ini ditunjuk eksplisit oleh addendum ini. Status aktual `D-S7` adalah **`Diputus PO — A (Add-04, 16:48:45 WIB)`** sebagaimana tercatat di `DS-SHELL-001.md` §9 dan `README.md` decision table.

**Jenjang bukti yang dipertahankan untuk `D-S7`:** PO menjawab `"semua A"` (16:48:45 WIB) -> status `Diputus PO`. Belum ada pernyataan ratifikasi eksplisit untuk `D-S7`.

### Penyimpangan proses yang dicatat jujur

[SESSION-GUIDE-D-DS2-TO-D-S7.md](SESSION-GUIDE-D-DS2-TO-D-S7.md) §5 merekomendasikan kartu keputusan disusun **sebelum** sesi, PO membaca semua kartu, lalu jawab dalam urutan D-DS2 -> D-DS3 -> D-S7 -> D-DS4 -> D-DS5. PO menjawab langsung `"semua A"` tanpa kartu terpisah per keputusan, menyimpang dari panduan.

**Keputusan tetap sah** — otoritas PO tidak bergantung pada format kartu. Argumen penentang A untuk setiap keputusan tersedia di `SESSION-GUIDE-D-DS2-TO-D-S7.md` §3 (sudah dibaca sebelum jawaban). Yang **tidak terhapus**: kewajiban **Independent Critic (G5) dengan konteks segar** dan ratifikasi kontrak.

### Integritas pasca-Add-04

- Manifest v1 `SIGNATURE-MANIFEST-2026-11-08.sha256`: **5/5 OK** (tidak berubah)
- Manifest v2 `SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256`: **2/2 OK** (tidak berubah)
- Tidak ada manifest baru pada Add-04 (keputusan belum ratified)
- Tidak ada berkas bertanda tangan yang disunting
- `tokens.css` / `tokens.ts` / `generated.ts` / `docs/status-register.md` tetap tidak tersentuh
- `SCREEN-SHELL-001.md` tetap `DRAFT v0.2` dengan `D-S7 = Pending` di badan teks — koreksi via addendum ini

---

## 10. Add-05 — Ratifikasi PO `D-DS2 = A`, `D-DS3 = A`, `D-S7 = A`, `D-DS4 = A`, `D-DS5 = A` (2026-11-08 17:15:33 WIB)

| Butir | Isi |
|---|---|
| **Pernyataan PO** | `"ya ratifikasi semyua 5 keputusan"` — melanjutkan sesi Add-04, ratifikasi 5 keputusan dalam satu pernyataan |
| **Waktu** | 17:15:33 WIB (GMT+7), dari `date` sesi |
| **Keputusan** | Semua tetap **A** — tidak ada perubahan bunyi dari Add-04 |
| **Status** | **`Ratified oleh PO`** untuk semua 5 — **bukan** tanda tangan digital, **bukan** ratifikasi kontrak, **bukan** G4 exit |
| **Record lengkap** | [RATIF-SHELL-003](RATIFICATION-RECORD-D-DS2-TO-D-S7-2026-11-08.md) |
| **Sinkronisasi** | `README.md` -> v0.7; `HANDOFF-FRESH-SESSION.md` §1/§2/§3/§4/§8/§9; `DS-SHELL-001.md` -> DRAFT v0.4; `POST-SIGNATURE-ADDENDUM-2026-11-08.md` (berkas ini) §10 |

### Rincian per keputusan

| ID | Opsi | Bunyi ringkas | Status Add-05 |
|---|---|---|---|
| `D-DS2` | A | 8 state kontrol berlaku untuk **shell saja** | **Ratified oleh PO (17:15:33 WIB, `RATIF-SHELL-003`)** |
| `D-DS3` | A | `title` weight 600, lainnya 400; line-height 1.4 / 1.5; **radius tidak diubah** | **Ratified oleh PO (17:15:33 WIB, `RATIF-SHELL-003`)** |
| `D-S7` | A | Seeded fixtures per state + toleransi **<=5%** + rute **Readiness** masuk matriks | **Ratified oleh PO (17:15:33 WIB, `RATIF-SHELL-003`)** |
| `D-DS4` | A | Baseline diregenerasi **setelah D-S7** selesai | **Ratified oleh PO (17:15:33 WIB, `RATIF-SHELL-003`)** |
| `D-DS5` | A | Konvergensi dua skala **ditunda ke pasca-RC** | **Ratified oleh PO (17:15:33 WIB, `RATIF-SHELL-003`)** |

### Koreksi `D-S7` di `SCREEN-SHELL-001.md` — berkas bertanda tangan

`D-S7` tercatat di `SCREEN-SHELL-001.md` (§3.10) sebagai keputusan layer G3. Berkas ini **dilindungi** oleh `SIGNATURE-MANIFEST-2026-11-08.sha256` dan **SENGAJA TIDAK DISUNTING** pada Add-05.

**Status `D-S7` di `SCREEN-SHELL-001.md` tetap `Pending`** — pernyataan usang ini ditunjuk eksplisit oleh addendum ini. Status aktual `D-S7` adalah **`Ratified oleh PO — A (17:15:33 WIB, `RATIF-SHELL-003`)`** sebagaimana tercatat di `DS-SHELL-001.md` §9 dan `README.md` decision table.

> Jenjang bukti yang dipertahankan: PO menjawab `"ya ratifikasi semyua 5 keputusan"` (17:15:33 WIB) -> status `Ratified oleh PO` untuk kelima keputusan. Bukan tanda tangan digital `SIG-SHELL-2026-11-08-01`.

### Integritas pasca-Add-05

- Manifest v1 `SIGNATURE-MANIFEST-2026-11-08.sha256`: **5/5 OK** (tidak berubah)
- Manifest v2 `SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256`: **2/2 OK** (tidak berubah)
- Manifest v3 `SIGNATURE-MANIFEST-RATIF-SHELL-003-2026-11-08.sha256`: **1/1 OK** (baru, untuk RATIF-SHELL-003)
- Tidak ada berkas bertanda tangan yang disunting
- `tokens.css` / `tokens.ts` / `generated.ts` / `docs/status-register.md` tetap tidak tersentuh
- `SCREEN-SHELL-001.md` tetap `DRAFT v0.2` dengan `D-S7 = Pending` di badan teks — koreksi via addendum ini (§10)

---

---

## 11. Add-06 — Ratifikasi PO `D-F4 = A`, `D-F5 = A`, `D-F6 = A`, `D-F7 = A`, `D-F8 = A`, `D-S5 = A`, `D-S6 = A`, `D-S8 = A` (2026-11-08 17:38:27 WIB)

| Butir | Isi |
|---|---|
| **Pernyataan PO** | `"Saya ratifikasi semua 8 keputusan tersisa sekaligus dengan opsi A dan reasoning di atas, dengan catatan: D-F5 tetap Pydantic-dulu, D-S8 tetap menunggu JobEvent.command, D-F4 tetap Beta/Phase 1, dan Cmd+K tetap Phase 2"` |
| **Waktu** | 17:38:27 WIB (GMT+7), dari `date` sesi |
| **Keputusan** | Semua **A** dengan 4 catatan PO yang dipertahankan verbatim |
| **Status** | **`Ratified oleh PO`** untuk semua 8 — **bukan** tanda tangan digital, **bukan** ratifikasi kontrak, **bukan** G4 exit |
| **Record lengkap** | [RATIF-SHELL-004](RATIFICATION-RECORD-D-F4-TO-D-S8-2026-11-08.md) |
| **Sinkronisasi** | `README.md` -> v0.8; `DS-SHELL-001.md` -> DRAFT v0.5; `HANDOFF-FRESH-SESSION.md` §1/§4; `JOB-SHELL-001.md`; `APP-ARCH-001.md`; `POST-SIGNATURE-ADDENDUM-2026-11-08.md` (berkas ini) §11 |
| **Total** | **21 ratified, 0 Pending** — semua keputusan shell sudah diratifikasi |

### Rincian per keputusan

| ID | Opsi | Bunyi ringkas | Status Add-06 |
|---|---|---|---|
| `D-F8` | A | **Phase 0 dulu** (tanpa IPC); Phase 1 setelah PO + kontrak | **Ratified oleh PO (17:38:27 WIB, `RATIF-SHELL-004`)** |
| `D-F5` | A | Ekstensi `JobEvent` di **Pydantic dulu**: `command`, `progress?`, `started_at?`, `finished_at?` | **Ratified oleh PO (17:38:27 WIB, `RATIF-SHELL-004`)** |
| `D-S8` | A | `In Progress` per-stage **ditunda** sampai `JobEvent.command` tersedia | **Ratified oleh PO (17:38:27 WIB, `RATIF-SHELL-004`)** |
| `D-F4` | A | `project.open` / recent projects **Beta (Phase 1)**, bukan RC | **Ratified oleh PO (17:38:27 WIB, `RATIF-SHELL-004`)** |
| `D-F6` | A | Kanal error **per concern**; satu `protocolError` dihapus | **Ratified oleh PO (17:38:27 WIB, `RATIF-SHELL-004`)** |
| `D-F7` | A | Artefak memeriksa **fingerprint**; refresh setelah **persetujuan**; CTA menyebut dependency | **Ratified oleh PO (17:38:27 WIB, `RATIF-SHELL-004`)** |
| `D-S5` | A | Copy deck sebagai **satu modul copy shell**; copy fitur ratified tidak ditimpa | **Ratified oleh PO (17:38:27 WIB, `RATIF-SHELL-004`)** |
| `D-S6` | A | `Esc` **wajib**; `Cmd/Ctrl+K` **Phase 2** | **Ratified oleh PO (17:38:27 WIB, `RATIF-SHELL-004`)** |

### Koreksi `D-F4`…`D-F8` & `D-S5`/`D-S6`/`D-S8` di `FLOW-SHELL-001.md` & `SCREEN-SHELL-001.md` — berkas bertanda tangan

`D-F4`…`D-F8` tercatat di `FLOW-SHELL-001.md` dan `D-S5`/`D-S6`/`D-S8` di `SCREEN-SHELL-001.md`. Kedua berkas **dilindungi** oleh `SIGNATURE-MANIFEST-2026-11-08.sha256` dan **SENGAJA TIDAK DISUNTING** pada Add-06.

**Status kedelapan keputusan di badan kedua berkas tetap `Pending`** — pernyataan usang ini ditunjuk eksplisit oleh addendum ini. Status aktual kedelapannya adalah **`Ratified oleh PO — A (17:38:27 WIB, `RATIF-SHELL-004`)`** sebagaimana tercatat di `README.md` decision table dan `DS-SHELL-001.md` §0/§11.

> Jenjang bukti yang dipertahankan: PO menjawab ratifikasi semua 8 keputusan sekaligus opsi A + 4 catatan (17:38:27 WIB) -> status `Ratified oleh PO` untuk kedelapan keputusan. Bukan tanda tangan digital `SIG-SHELL-2026-11-08-01`.

### Integritas pasca-Add-06

- Manifest v1 `SIGNATURE-MANIFEST-2026-11-08.sha256`: **5/5 OK** (tidak berubah)
- Manifest v2 `SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256`: **2/2 OK** (tidak berubah)
- Manifest v3 `SIGNATURE-MANIFEST-RATIF-SHELL-003-2026-11-08.sha256`: **1/1 OK** (tidak berubah)
- Manifest v4 `SIGNATURE-MANIFEST-RATIF-SHELL-004-2026-11-08.sha256`: **1/1 OK** (baru, untuk RATIF-SHELL-004)
- Tidak ada berkas bertanda tangan yang disunting
- `tokens.css` / `tokens.ts` / `generated.ts` / `docs/status-register.md` tetap tidak tersentuh
- `FLOW-SHELL-001.md` tetap `DRAFT v0.2` dengan `D-F4`…`D-F8 = Pending` di badan teks; `SCREEN-SHELL-001.md` tetap `DRAFT v0.2` dengan `D-S5`/`D-S6`/`D-S8 = Pending` di badan teks — koreksi via addendum ini (§11)

---

**Status akhir:** Add-01 s.d. Add-06 + Add-08 (G5 feedback) + **Add-09 (koreksi temuan G5-01/G5-02/G5-04/G5-08, disposition G5-06/G5-07)** tercatat. Objek yang ditandatangani **utuh**, manifest v1 **tetap terverifikasi 5/5 OK**, manifest v2 **2/2 OK**, manifest v3 **1/1 OK**, manifest v4 **1/1 OK**, semua pernyataan usang memiliki penunjuk eksplisit, keputusan PO `D-DS1 = A` tercatat sebagai **`Ratified oleh PO (16:01:39 WIB)`** lewat `RATIF-SHELL-002`, keputusan PO `D-DS2`/`D-DS3`/`D-S7`/`D-DS4`/`D-DS5` = **A** tercatat sebagai **`Ratified oleh PO (17:15:33 WIB)`** lewat `RATIF-SHELL-003`, keputusan PO `D-F4`/`D-F5`/`D-F6`/`D-F7`/`D-F8`/`D-S5`/`D-S6`/`D-S8` = **A** tercatat sebagai **`Ratified oleh PO (17:38:27 WIB)`** lewat `RATIF-SHELL-004`, dan tidak ada status kontrak yang dinaikkan secara diam-diam.

---

## Add-09 — Koreksi transkrip usang FLOW/SCREEN + parent anchor + stage 7 + disposition G5-06/G5-07 (2026-11-08 ±18:05 WIB)

Sumber: [G5-CRITIC-REPORT-2026-11-08.md](G5-CRITIC-REPORT-2026-11-08.md). `FLOW-SHELL-001.md` & `SCREEN-SHELL-001.md` **dilindungi manifest v1 dan SENGAJA TIDAK DISUNTING**; koreksi berikut berlaku secara addendum (aturan "record menang", `RATIFICATION-RECORD-2026-11-08.md:46`; cara yang benar menurut `RATIF-SHELL-003:72`).

| ID | Lokasi usang | Bunyi usang | Bunyi yang benar (berlaku) |
|---|---|---|---|
| G5-01 | `FLOW-SHELL-001.md:5,16-17,73,75,163,175,182-186,196,201` | `D-F4…D-F8` = Pending; "G5 dilarang dimulai"; `D-F5`/`D-S8` Pending | `D-F4`/`D-F5`/`D-F6`/`D-F7`/`D-F8` = **Ratified oleh PO — A (17:38:27 WIB, `RATIF-SHELL-004`)**; G5 telah berjalan (Add-08), LULUS formal menunggu disposition PO ini |
| G5-02 | `SCREEN-SHELL-001.md:5,16,115,134,161,251` | `D-S5…D-S8` = Pending (§3.4:115, §3.5, Exit G3:251) | `D-S5`/`D-S6`/`D-S8` = **Ratified oleh PO — A (17:38:27 WIB, `RATIF-SHELL-004`)**. §3.5 tetap benar sebagai *usulan literal*: tidak menimpa copy fitur ratified (SCREEN-CLEAN-001 menang; SCREEN §3.5:159) |
| G5-04 | `FLOW-SHELL-001.md:4` | Parent "belum didraft; anchor provisional" | Parent = **`JOB-SHELL-001` (DRAFT v0.1)**; anchor provisional G1 terpenuhi |
| G5-08 | `FLOW-SHELL-001.md:82-93` | Stage 6/7/10 "Belum tersedia" tanpa rujukan kontrak fitur | **Stage 7 = `Hubungan` (bivariate)** terkait kontrak fitur ratified JOB-FLOW-SCREEN-BIVAR; stage 7 **tidak tersedia-sinyal di shell** meskipun kontrak fitur BIVAR ratified — bukan konflik, bukan kehilangan sungai Doc08 |
| G5-05 | `APP-ARCH-001.md:113,116` | Baris bertanda stale (checkpoint lama) | Pada berkas yang dibaca Critic sudah diperbarui; tidak ada tindakan |

**Disposition yang diterapkan langsung ke kontrak *unsigned*:**

| ID | Tindakan |
|---|---|
| G5-06 | `DS-SHELL-001.md` §8 butir 1: label klaim "hex liar = 0" diturunkan menjadi **`Likely`** (output lint belum dilampirkan) — menjadi `Confirmed` setelah QA B9 dieksekusi |
| G5-07 | `QA-SHELL-001.md` §3: threshold terukur ditambahkan untuk **B1** (5 tugas Doc01 §11.1, 900+1440px, keyboard-only, seeded fixtures) dan **B12** (keyboard-only, 2 viewport, 1 edge state, data representatif, dicatat per langkah) |

**Dampak status:** dengan Add-09, keenam kontrak shell memenuhi syarat **G5 PASS** (putusan formal milik PO). G6 tetap **FAIL** sampai bukti B1–B12 dieksekusi; ratifikasi kontrak (& migrasi ke `docs/ux-contracts/shell/` + `docs/status-register.md`) tetap belum terjadi; `tokens.css` tetap beku.

**Integritas pasca-Add-09:** manifest v1 **5/5 OK**, v2 **2/2 OK**, v3 **1/1 OK**, v4 **1/1 OK** — tidak ada berkas bertanda tangan yang disunting; `tokens.css` / `tokens.ts` / `generated.ts` / `docs/status-register.md` tidak tersentuh.
