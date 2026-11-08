# Handoff — Sesi Konteks Segar (Shell Contracts)

**Dibuat:** 2026-11-08 · **Sifat:** BRIEF MANDIRI / alat bantu, **bukan** kontrak, **bukan** keputusan.
**Tujuan:** sesi baru harus bisa bekerja **tanpa membaca riwayat chat**. Semua ID, status, batas, dan perintah ada di sini.
**Jalur repo:** `/Volumes/JensData/Jensu-Projects/eda-new-project/eda-studio` · **Folder kerja:** `docs/shell-contracts/`

---

## 1. Jawaban untuk pertanyaan "lanjut di sesi ini atau fresh session?"

**Rekomendasi: SPLIT — bukan pilihan biner.**

| Fase | Tempat | Alasan |
|---|---|---|
| Kartu keputusan `D-DS1`, draft `JOB-SHELL-001`, draft `APP-ARCH-001`, addendum, sinkronisasi register | **Sesi ini (selesai)** | Konteks sudah di-*compact*, jadi angka 85% **tidak lagi berlaku secara mekanis**. Sumber normatif (Doc01/07/08, templat, `tokens.css`, ratifikasi) sudah dibaca ulang di jendela ini; mengulang di sesi baru justru berisiko kehilangan bunyi ratified yang presisi |
| **Ratifikasi kontrak, Independent Critic (G5), QA acceptance (G6), implementasi apa pun** | **SESI BARU / KONTEKS SEGAR — MASIH WAJIB** | Bukan soal batas token, melainkan soal **independensi & audit** |
| ~~Keputusan PO atas `D-DS1`~~ | ⚠️ **Sudah terjadi di sesi ini (Add-02, 15:34:53 WIB): `D-DS1 = A`** → ✅ **Diratifikasi PO (Add-03, 16:01:39 WIB, `RATIF-SHELL-002`)** | PO memilih memutus di sesi penulisan, menyimpang dari rekomendasi. **Keputusan tetap sah** (otoritas PO); argumen penentang A di kartu §5 sudah disajikan sebelum jawaban. Lihat catatan di bawah |

**Tiga alasan sesi baru itu wajib, bukan opsional:**

1. **`02-framework.md` mensyaratkan Independent Critic dengan konteks segar.** Bila konteks yang menulis kontrak juga yang mengkritiknya, Critic tidak independen. Ini pelanggaran metodologi, bukan sekadar preferensi.
2. **Anchoring bias nyata.** Tujuh keputusan sebelumnya **semuanya A**. Rekomendasi `D-DS1` juga A (argumennya memang independen, dan kartu sengaja memuat argumen penentang A di §5). PO sebaiknya menilai kartu itu di sesi bersih supaya "A lagi" bukan sekadar kelanjutan pola.
3. **Jejak audit.** Sesi yang sama menangani *penyusunan*, *rekomendasi*, dan *pengesahan* menyulitkan pembuktian bahwa ratifikasi dilakukan dengan pertimbangan terpisah. Sesi baru memisahkan peran secara alami.

**Kesimpulan operasional (diperbarui Add-06):** `D-DS1` diratifikasi PO lewat `RATIF-SHELL-002`, `D-DS2`…`D-DS5` + `D-S7` diratifikasi PO lewat `RATIF-SHELL-003`, dan `D-F4`…`D-F8` + `D-S5`/`D-S6`/`D-S8` diratifikasi PO lewat `RATIF-SHELL-004` — jadi prompt keputusan di §8 diganti menjadi prompt **verifikasi independen**. Yang **tidak berubah**: jangan memulai G5, jangan meratifikasi kontrak, dan jangan meminta tanda tangan baru di sesi penulisan. Kewajiban Critic konteks segar **tidak terhapus** oleh keputusan PO. Gunakan berkas ini sebagai pintu masuk sesi baru.

> Catatan jujur: *compaction* yang baru terjadi memang membebaskan jendela konteks, tetapi **tidak** menggantikan independensi Critic. Ringkasan adalah konteks yang sama, bukan konteks segar.

**Status terkini Add-12 (2026-11-08):** **putusan formal G6 PASS (scope Phase 0) oleh PO — Opsi A** lewat [RATIF-SHELL-006](RATIFICATION-RECORD-RATIF-SHELL-006-2026-11-08.md) + manifest v7 (4/4 OK). Konsekuensi: `tokens.css` terbuka **additive-only** (`D-DS1`); Phase 1 dibuka (D-F5 → D-S8 → D-F4 → D-F3 rehidrasi → sisa B11). Backend/production **belum PASS**; Cmd+K Phase 2; `generated.ts` tetap via `tools/generate_types.py`.



---

## 2. Fakta yang TIDAK BOLEH diubah tanpa amandemen PO

### 2.1 Tujuh keputusan `Ratified oleh PO (2026-11-08 14:04 WIB)`

Sumber kebenaran tunggal: [RATIFICATION-RECORD-2026-11-08.md](RATIFICATION-RECORD-2026-11-08.md) §2. Ditandatangani digital `SIG-SHELL-2026-11-08-01` (14:23:54 WIB). Bila ada beda wording dengan badan kontrak, **record yang menang**.

| ID | Bunyi ringkas |
|---|---|
| `D-F1` | Stepper **5 tahap** dari sinyal sah saja; tolak 10 stage / `In Progress` per tahap / persentase / status karangan |
| `D-F2` | Router **hash + history stack**; `navigate` tetap lewat `useRouter` |
| `D-F3` | Simpan **hanya** `{route, projectId, datasetId}` di `localStorage`, **wajib revalidasi backend** |
| `D-S1` | **7 grup / 9 item**; Pembersihan sebelum Hubungan; utilitas → grup Tools |
| `D-S2` | **Bahasa Indonesia** sebagai satu-satunya locale shell, satu register copy |
| `D-S3` | 900px: **rail berlabel + drawer Job Center** |
| `D-S4` | Skala **24/18/15/14/12**, line-height ≥1.4, kontrol 36px + **8 state**, kartu, tabel `<caption>`+`scope`, alternatif teks chart |

### 2.2 Status "parsial" — ini yang paling sering disalahpahami

- Ratifikasi **21 keputusan**, **bukan** ratifikasi kontrak.
- `FLOW-SHELL-001` & `SCREEN-SHELL-001` tetap **DRAFT v0.2**; `DS-SHELL-001` **DRAFT v0.5** (Add-02: `D-DS1 = A` ditranskrip; Add-03: `Ratified oleh PO`; Add-04: 5 keputusan `Diputus PO — A`; Add-05: 5 keputusan naik ke **Ratified oleh PO** via `RATIF-SHELL-003`; Add-06: 8 keputusan naik ke **Ratified oleh PO** via `RATIF-SHELL-004`).
- `APP-ARCH-001` & `JOB-SHELL-001` **DRAFT v0.1** (Add-01).
- **13 semula. Add-04 (16:48:45 WIB):** 5 diputus → **8 Pending tersisa** (5 FLOW + 3 SCREEN: `D-S5`, `D-S6`, `D-S8`). **Add-05 (17:15:33 WIB):** 5 itu diratifikasi → **13 ratified, 8 Pending**. `D-DS1` berstatus **`Ratified oleh PO (16:01:39 WIB)`** lewat `RATIF-SHELL-002`, **bukan** ditandatangani digital. **Add-06 (17:38:27 WIB):** 8 tersisa diratifikasi → **21 ratified, 0 Pending**.
- **`tokens.css` / `tokens.ts` tetap beku** meski semua keputusan shell sudah diratifikasi — keputusan ≠ ratifikasi kontrak ≠ izin implementasi.
- **Tidak ada gate yang exit** (G1/G2/G3/G4/G5/G6). `docs/status-register.md` **tidak** ditambah baris; artefak **tidak** dipindah ke `docs/ux-contracts/`.
- **Tidak ada izin kode produksi.**

### 2.3 Integritas tanda tangan

`SIGNATURE-MANIFEST-2026-11-08.sha256` melindungi **5 berkas**: `RATIFICATION-SESSION-01.md`, `RATIFICATION-RECORD-2026-11-08.md`, `DECISIONS-2026-11-08.md`, `FLOW-SHELL-001.md`, `SCREEN-SHELL-001.md`.

- Add-01 **sengaja tidak menyunting** kelima berkas itu. Delapan kalimat usang ditunjuk oleh [POST-SIGNATURE-ADDENDUM-2026-11-08.md](POST-SIGNATURE-ADDENDUM-2026-11-08.md).
- `README.md` dan `DS-SHELL-001.md` **tidak** ada dalam manifest → aman disunting (sudah disinkronkan).
- Verifikasi: `cd docs/shell-contracts && shasum -a 256 -c SIGNATURE-MANIFEST-2026-11-08.sha256` → **5/5 OK**.
- Add-02 (`D-DS1 = A`) awalnya tidak membuat record ratifikasi baru. Namun PO kemudian menyatakan `"rafitikasi d-ds1"` → **Add-03**: `RATIF-SHELL-002` + manifest baru `SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256` (**2/2 OK**). Manifest v1 tetap **5/5 OK** dan utuh. Ratifikasi `D-DS1` **bukan** tanda tangan digital.
- Add-05 (ratifikasi `D-DS2`…`D-DS5` + `D-S7`): `RATIF-SHELL-003` + manifest baru `SIGNATURE-MANIFEST-RATIF-SHELL-003-2026-11-08.sha256` (**1/1 OK**). Manifest v1 **5/5 OK**, v2 **2/2 OK**, utuh. Ratifikasi **bukan** tanda tangan digital.
- Add-06 (ratifikasi `D-F4`…`D-F8` + `D-S5`/`D-S6`/`D-S8`): `RATIF-SHELL-004` + manifest baru `SIGNATURE-MANIFEST-RATIF-SHELL-004-2026-11-08.sha256` (**1/1 OK**). Manifest v1 **5/5 OK**, v2 **2/2 OK**, v3 **1/1 OK**, utuh. Ratifikasi **bukan** tanda tangan digital.
- Tanda tangan ini **bukan** PKI / tanda tangan elektronik tersertifikasi secara hukum; ini acknowledgment sesi terautentikasi + integrity check.

---

## 3. Inventaris artefak

| Berkas | Gate | Status |
|---|---|---|
| `README.md` | register | v0.9, DRAFT/PROPOSED |
| `APP-ARCH-001.md` | Application layer | **DRAFT v0.1** (kondisi: 0 Pending) |
| `JOB-SHELL-001.md` | G1 | **DRAFT v0.1** (kondisi: 0 Pending) |
| `FLOW-SHELL-001.md` | G2 | DRAFT v0.2 · 8/8 ratified (via addendum) · **bertanda tangan** |
| `SCREEN-SHELL-001.md` | G3 | DRAFT v0.2 · 8/8 ratified (via addendum) · **bertanda tangan** |
| `DS-SHELL-001.md` | G4 | **DRAFT v0.5** · `D-DS1 = A` **Ratified oleh PO (§2.4/§8/§9/§11)** · `D-DS2`…`D-DS5` + `D-S7` **Ratified oleh PO — A (17:15:33 WIB, `RATIF-SHELL-003`)** · `D-F4`…`D-F8` + `D-S5`/`D-S6`/`D-S8` **Ratified oleh PO — A (17:38:27 WIB, `RATIF-SHELL-004`)** |
| `QA-SHELL-001.md` | G6 | **DRAFT v0.1** (Add-07) — kontrak acceptance; bukti B1–B12 semuanya Belum ada; belum diratifikasi |
| `RATIFICATION-RECORD-2026-11-08.md` | — | `RATIF-SHELL-001`, BERLAKU SEBAGIAN |
| `RATIFICATION-RECORD-D-DS1-2026-11-08.md` | — | `RATIF-SHELL-002`, **BERLAKU** (D-DS1) |
| `RATIFICATION-RECORD-D-DS2-TO-D-S7-2026-11-08.md` | — | `RATIF-SHELL-003`, **BERLAKU** (D-DS2–D-DS5 + D-S7) |
| `RATIFICATION-RECORD-D-F4-TO-D-S8-2026-11-08.md` | — | `RATIF-SHELL-004`, **BERLAKU** (D-F4–D-F8 + D-S5/D-S6/D-S8) |
| `RATIFICATION-SESSION-01.md` | — | Worksheet, ditutup & ditandatangani |
| `DECISIONS-2026-11-08.md` | — | Catatan sesi, ratified parsial |
| `DECISION-CARD-D-DS1.md` | — | ✅ **RATIFIED OLEH PO — A** (16:01:39 WIB, `RATIF-SHELL-002`); sebelumnya `Diputus PO` 15:34:53 WIB. §8 = record keputusan. **Bukan** tanda tangan digital |
| `POST-SIGNATURE-ADDENDUM-2026-11-08.md` | — | Add-01 + Add-02 + Add-03 + Add-04 + Add-05 + **Add-06** |
| `SIGNATURE-MANIFEST-2026-11-08.sha256` | — | 5 hash (v1, utuh) |
| `SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256` | — | 2 hash (v2) |
| `SIGNATURE-MANIFEST-RATIF-SHELL-003-2026-11-08.sha256` | — | 1 hash (v3) |
| `SIGNATURE-MANIFEST-RATIF-SHELL-004-2026-11-08.sha256` | — | 1 hash (v4, baru) |
| `SESSION-GUIDE-D-DS2-TO-D-S7.md` | — | **Arsip** — sesi selesai, 5 keputusan diratifikasi 17:15:33 WIB |
| `prototypes/shell-v0/index.html` | — | **Mockup DISPOSABLE**, bukan G5 slice, bukan bukti penerimaan |

---

## 4. Keputusan: 0 terbuka + 21 selesai

**Semua keputusan shell sudah diratifikasi PO.** Tidak ada keputusan terbuka tersisa.

**FLOW (8/8 Ratified):** `D-F1`/`D-F2`/`D-F3` (Add-01, 2026-11-08) · `D-F8` **Ratified oleh PO — A (17:38:27 WIB)** · `D-F5` **Ratified oleh PO — A (17:38:27 WIB)** · `D-S8` **Ratified oleh PO — A (17:38:27 WIB)** · `D-F4` **Ratified oleh PO — A (17:38:27 WIB)** · `D-F6` **Ratified oleh PO — A (17:38:27 WIB)** · `D-F7` **Ratified oleh PO — A (17:38:27 WIB)** — semua lewat `RATIF-SHELL-004`.
**SCREEN (8/8 Ratified):** `D-S1`…`D-S4` (Add-01) · `D-S7` **Ratified oleh PO — A (17:15:33 WIB, `RATIF-SHELL-003`)** · `D-S5`/`D-S6`/`D-S8` **Ratified oleh PO — A (17:38:27 WIB, `RATIF-SHELL-004`)**.
**G4 (0 Pending):** `D-DS1` **Ratified oleh PO (16:01:39 WIB, `RATIF-SHELL-002`)**; `D-DS2`/`D-DS3`/`D-DS4`/`D-DS5` semua **Ratified oleh PO — A (17:15:33 WIB, `RATIF-SHELL-003`)**.
**Selesai & diratifikasi (21):** `D-F1`…`D-F3`, `D-S1`…`D-S4` (Add-01) · `D-DS1 = A` (Add-03) · `D-DS2`/`D-DS3`/`D-S7`/`D-DS4`/`D-DS5 = A` (Add-05) · `D-F4`/`D-F5`/`D-F6`/`D-F7`/`D-F8`/`D-S5`/`D-S6`/`D-S8 = A` (Add-06, 17:38:27 WIB, `RATIF-SHELL-004`). Status ini **mengikat penyusunan kontrak**, bukan implementasi. `tokens.css` tetap beku.

**Urutan yang disarankan (diperbarui Add-06):** ~~`D-F8` → `D-F4`…`D-F7`, `D-S5`, `D-S6`, `D-S8`~~ ✅ **selesai & diratifikasi (Add-06)** → bukti penerimaan → ratifikasi kontrak utuh (DRAFT → `docs/ux-contracts/shell/` + `docs/status-register.md`) → **G5 Critic konteks segar** → baru `tokens.css`.

---

## 5. Batas keras (tidak boleh dilemahkan kontrak mana pun)

1. `frontend/src/shared/ipc/generated.ts` **di-GENERATE** dari Pydantic `backend/contracts.py`; dilarang hand-edit. Field/command baru: Pydantic dulu → `tools/generate_types.py`.
2. Frontend hanya lewat `ipcClient` (4 bridge methods). Job lifecycle **backend-authoritative** (SYS-015, Doc05 §8.2): tidak ada transisi lokal, auto-retry, atau progress karangan. `jobProgress()` (`JobClient.ts:39-60`) harus **dihapus**, bukan dijadikan kontrak.
3. Default-deny / fail-closed (SEC-004).
4. Tidak ada whole-DataFrame JSON lewat IPC. Cap: preview ≤ 200, scatter ≤ 1500, bin ≤ 30.
5. **WCAG 2.2 AA dan min window 900px BUKAN deferred** (`DS-CORE-001`). Warna/kontras/radius/spacing/min-window **tidak berubah** oleh `D-S4`.
6. Snapshot immutable, fingerprint SHA-256, source bytes tidak dimutasi.
7. **Stop rule** (`02-framework.md`): berhenti & tanya bila kontrak bertentangan, aturan destruktif/izin ambigu, data/state belum terdefinisi, atau perubahan komponen bersama berdampak luas.
8. Kontrak fitur ratified tetap **authoritative di R4**. Benturan = amandemen PO, bukan ditimpa.
9. `frontend/tests/helpers.ts` mengembalikan `data:null`. **Test yang tidak dijalankan bukan PASS**; kegagalan memuat ≠ data kosong; screenshot mockup disposable **bukan** bukti penerimaan.

---

## 6. Temuan implementasi (Confirmed) — bukti audit, BUKAN daftar tugas

`router.tsx` state-only (URL tidak berubah, reload → Setup) · nav flat 8 tombol dengan urutan keliru · `ProjectContext` in-memory · satu `protocolError` untuk 3 concern · inline banner memakai `role="alertdialog"` tanpa modal · `JobCenter` menampilkan "Belum ada job" saat gagal memuat · progress determinate karangan · `visual.spec.ts` tidak mengunjungi `readiness` · toleransi 15% · 14 baseline hanya empty state · campuran bahasa + bocoran ID dokumen ke UI (`Doc04 §12`, `G6-2`, `Doc15 §10`).

**Jangan memperbaiki satu pun sebelum G4/G5 selesai dan PO meratifikasi kontrak utuh.**

---

## 7. Yang masih belum dijalankan di luar kontrak shell

- **7 skenario validasi beta** di `docs/beta-validation-script.md` masih belum dijalankan.
- Kanal `beta-feedback` belum dibuat.
- Baseline Freeze v1.0 berlaku: baris yang tidak terdaftar tetap Proposed / Deferred / OPEN, **bukan** confirmed.
- Doc08 §19: *final screen-by-screen layouts* dan *final Job Center screen layout* masih **Deferred**.

---

## 8. Prompt siap pakai untuk sesi baru

Salin seluruh blok berikut ke sesi/konteks baru:

```
Baca dulu docs/shell-contracts/HANDOFF-FRESH-SESSION.md dan docs/shell-contracts/README.md,
lalu RATIFICATION-RECORD-2026-11-08.md §2 (sumber kebenaran tunggal 7 keputusan),
RATIFICATION-RECORD-D-DS1-2026-11-08.md, RATIFICATION-RECORD-D-DS2-TO-D-S7-2026-11-08.md,
dan RATIFICATION-RECORD-D-F4-TO-D-S8-2026-11-08.md (total 21 keputusan Ratified oleh PO, 0 Pending).
Jangan membaca riwayat chat; anggap brief itu self-contained.

Peran kamu: Independent Critic (G5) untuk draft APP-ARCH-001, JOB-SHELL-001,
FLOW-SHELL-001, SCREEN-SHELL-001, DS-SHELL-001, dan QA-SHELL-001 (DRAFT v0.1, Add-07) —
BUKAN penulis dan BUKAN pengesah.

Kerjakan:
1. Cek konsistensi 21 keputusan ratified terhadap bunyi di tiap kontrak.
2. Cek benturan dengan kontrak fitur ratified di docs/ux-contracts/ dan batas keras di brief §5.
3. Cek divergensi APP-ARCH-001 §3 terhadap Doc07 §6.2 / Doc08 §4.1 sudah didokumentasikan,
   bukan dihilangkan diam-diam.
4. Cek QA-SHELL-001: apakah katalog bukti B1-B12 lengkap & terukur, dan apakah ada klaim
   PASS yang tidak didukung bukti yang dijalankan?
5. Cek klaim bukti: mana yang Confirmed / Likely / Suggestion, mana yang baru klaim.
6. Keluarkan temuan berlabel Confirmed / Likely / Suggestion dengan rujukan berkas:baris.

Dilarang: menyunting berkas bertanda tangan, menulis kode produksi, menyentuh
tokens.css / tokens.ts / generated.ts, menaikkan status kontrak, atau mencentang
kotak Exit gate. Laporkan temuan saja; keputusan tetap milik PO.
```

**`D-DS1` diratifikasi (`A`, 16:01:39 WIB, `RATIF-SHELL-002`). `D-DS2`…`D-DS5` + `D-S7` diratifikasi PO — A (17:15:33 WIB, `RATIF-SHELL-003`).** Prompt verifikasi independen — gunakan di sesi baru, karena semua 6 keputusan diambil di sesi penulisan:

```
Baca DECISION-CARD-D-DS1.md §2/§4/§5/§8 dan DS-SHELL-001.md §2.4, §8, §9, §11.
Peran kamu: PEMERIKSA INDEPENDEN, bukan pembela keputusan.

D-DS1 = A sudah Ratified oleh PO (2026-11-08 16:01:39 WIB, RATIF-SHELL-002),
bukan ditandatangani digital. Jangan mengulang pilihan A/B/C. Yang dinilai:

1. Apakah transkrip ke DS-SHELL-001 setia pada bunyi opsi A, termasuk
   TIGA pengaman (lint kepemilikan, diff aditif murni, utang D-DS5)?
2. Apakah ada klaim berlebihan: "aditif = baseline tidak berubah",
   "D-DS1 = izin menulis tokens.css", "Diputus = Ratified",
   atau "D-DS1 otomatis memutus D-DS2..D-DS5"?
3. Apakah D-DS5 benar-benar terbuka sebagai konsekuensi, bukan sekadar catatan?
4. Apakah konflik §8 butir 2 (tokens.ts tidak berubah) sudah konsisten
   dengan aturan lama "dua berkas harus sinkron"?
5. Catat penyimpangan proses: keputusan diambil di sesi penulisan meski
   disarankan sesi segar. Apakah ini memengaruhi validitas G5? (Jawaban
   expected: tidak membatalkan keputusan, tetapi Critic TETAP wajib segar.)

Keluarkan temuan berlabel Confirmed / Likely / Suggestion + rujukan berkas:baris.
Dilarang menyunting berkas bertanda tangan atau kode produksi.
```

---

## 9. Perintah verifikasi cepat

```bash
cd docs/shell-contracts
shasum -a 256 -c SIGNATURE-MANIFEST-2026-11-08.sha256                    # expect: 5/5 OK
shasum -a 256 -c SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256    # expect: 2/2 OK
shasum -a 256 -c SIGNATURE-MANIFEST-RATIF-SHELL-003-2026-11-08.sha256    # expect: 1/1 OK
shasum -a 256 -c SIGNATURE-MANIFEST-RATIF-SHELL-004-2026-11-08.sha256    # expect: 1/1 OK
grep -c 'font-size: var(--font-size-' ../../frontend/src/shared/tokens.css   # expect: 16
grep -rln -- '--font-size-' ../../frontend/src             # expect: 2 berkas
ls -1 *.md | wc -l
```

---

**Status akhir:** Brief ini tidak mengubah status apa pun. Ia hanya memastikan sesi berikutnya tidak bergantung pada riwayat chat dan tidak mencampur peran penulis, kritikus, dan pengesah.
