# Panduan Sesi Keputusan — D-DS2 / D-DS3 / D-DS4 / D-DS5 + D-S7

**Dibuat:** 2026-11-08 16:33 WIB · **Sifat:** ALAT BANTU SESI, **bukan** kontrak, **bukan** keputusan.
**Status:** **ARSIP** — sesi selesai. Kelima keputusan (`D-DS2`/`D-DS3`/`D-S7`/`D-DS4`/`D-DS5 = A`) **diratifikasi PO 2026-11-08 17:15:33 WIB** lewat `RATIF-SHELL-003` (Add-05). Dokumen ini tidak lagi dipakai sebagai panduan sesi aktif.
**Tujuan:** membantu PO membuat 5 keputusan dalam **satu sesi konteks segar** secara efektif, dengan disiplin bukti dan tanpa *anchoring bias*.
**Prasyarat:** baca `HANDOFF-FRESH-SESSION.md` dan `README.md` dulu. Jangan baca riwayat chat.
**Jalur repo:** `/Volumes/JensData/Jensu-Projects/eda-new-project/eda-studio` · **Folder kerja:** `docs/shell-contracts/`

---

## 1. Bisakah 5 keputusan dalam 1 sesi? — Ya, dengan syarat

**Jawaban singkat: bisa, tapi bukan 5 kartu terpisah.** Kelima keputusan ini saling bergantung sehingga **paket keputusan** (decision bundle) justru lebih alami daripada memisahkannya. Yang membuat ini feasible:

1. **D-DS4 bergantung pada D-S7** — regenerasi baseline tidak masuk akal tanpa fixtures dan toleransi yang sudah diputus.
2. **D-DS5 adalah konsekuensi D-DS1 = A** — pertanyaannya sempit: kapan dan bagaimana konvergensi, bukan "apakah".
3. **D-DS2 dan D-DS3 independen** dari D-DS4/D-DS5/D-S7, sehingga bisa diputus paralel tanpa kehilangan depth.
4. **Semua bersumber dari `DS-SHELL-001` §9** yang sudah ada sebagai DRAFT v0.2 dengan rekomendasi awal per keputusan.

**Syarat agar efektif:**
- Kartu disusun **sebelum** sesi, bukan saat sesi berjalan.
- PO membaca semua kartu **sebelum** menjawab satu pun.
- Urutan jawaban: **D-DS2 → D-DS3 → D-S7 → D-DS4 → D-DS5** (bukan urutan numerik), karena D-DS4 menunggu D-S7.
- Tidak ada keputusan yang otomatis dijawab "A" karena pola sebelumnya. Setiap kartu punya §argumen penentang.
- `tokens.css` tetap beku setelah sesi ini; keputusan = desain, bukan implementasi.

---

## 2. Peta ketergantungan

```
D-DS1 = A (Ratified) ──────────────────────────────────────┐
                                                            │
D-DS2 (cakupan 8 state)     D-DS3 (weight/line-height/radius)
     │ independen                  │ independen
     │                              │
     │                              v
     │                        DS-SHELL-001 siap diratifikasi?
     │                              │
     v                              v
D-S7 (fixtures + toleransi) ──> D-DS4 (regenerasi baseline)
     │                              │
     │ D-S7 DULU                    │ D-DS4 SETELAH D-S7
     v                              v
  fixtures ada        baseline baru disetujui
                          │
                          v
                    D-DS5 (konvergensi dua skala)
                          │
                          │ paling tidak mendesak;
                          │ boleh "Tunda ke pasca-RC"
                          v
                     (selesai atau ditunda)
```

**Aturan urutan yang mengikat:**
- D-DS4 **tidak boleh** diputus sebelum D-S7, karena D-DS4 menentukan strategi regenerasi baseline yang hanya masuk akal bila fixtures dan toleransi sudah diputus.
- D-DS5 **boleh** ditunda ("Tunda ke pasca-RC") tanpa memblokir gate lain. Ini adalah keputusan dengan opsi "tidak sekarang" yang sah.
- D-DS2 dan D-DS3 **boleh** diputus kapan saja dalam sesi.

---

## 3. Lima keputusan — ringkas

### D-DS2 — Cakupan 8 state kontrol

| | |
|---|---|
| **Pertanyaan** | Apakah 8 state kontrol (default/hover/focus-visible/pressed/selected/disabled/loading/error) berlaku untuk kontrol **fitur** juga, atau **shell saja**? |
| **Rekomendasi DRAFT** | **Shell saja** untuk RC. Kontrak DS per fitur tetap authoritative di R4. |
| **Bukti** | 7 fitur sudah punya DS ratified (`DS-PROF-001`, `DS-CLEAN-001`, dst.). Menerapkan 8 state global = mengubah tampilan semua fitur tanpa Critic per fitur. |
| **Opsi yang diharapkan** | A = shell saja · B = shell + fitur (global) · C = shell + amandemen per fitur bertahap |
| **Stop rule** | Perubahan komponen bersama berdampak luas → wajib berhenti & tanya. B/C menyentuh 7 kontrak fitur ratified. |
| **Dampak ke tokens.css** | Tidak langsung. D-DS2 menentukan **scope** enforcement, bukan nilai token. |
| **Argumen penentang A** | Inkonsistensi: kontrol di R4 (fitur) punya state lebih sedikit daripada R1–R3 (shell). Pengguna tidak tahu batas region. |

### D-DS3 — Font-weight, line-height, radius

| | |
|---|---|
| **Pertanyaan** | Berapa `font-weight` & `line-height` per tingkat tipografi? Apakah radius 4/6/8px diselaraskan dengan `DS-CORE-001` (6/8px)? |
| **Rekomendasi DRAFT** | `title` 600, sisanya 400; line-height 1.4–1.5; **radius tidak diubah** (butuh amandemen `DS-CORE-001` terpisah). |
| **Bukti** | `tokens.css` tidak punya `font-weight` per tingkat; `DS-CORE-001` menyebut radius 6/8px tapi `tokens.css` punya 4/8px — ketidaksesuaian yang sudah ada sebelum shell contract. |
| **Opsi yang diharapkan** | A = rekomendasi DRAFT (weight+line-height ditambah, radius ditunda) · B = weight+line-height+radius diselaraskan sekaligus · C = tunda semua sampai Critic |
| **Stop rule** | Radius adalah ketidaksesuaian `DS-CORE-001` ↔ `tokens.css` yang menyentuh kontrak fitur. Amandemen radius = amandemen `DS-CORE-001`, bukan `DS-SHELL-001`. |
| **Dampak ke tokens.css** | A: tambah `--shell-font-weight-*` dan `--shell-line-height-*` (aditif, sama seperti D-DS1). B: juga menyentuh `--radius-sm`. |
| **Argumen penentang A** | Menunda radius = mengirim RC dengan ketidaksesuaian yang diketahui. Tapi memperbaikinya sekarang = amandemen `DS-CORE-001` yang berdampak ke semua fitur. |

### D-S7 — Toleransi visual + seeded fixtures

| | |
|---|---|
| **Pertanyaan** | Apakah toleransi visual regression diturunkan dari 15% → ≤5%? Apakah seeded fixtures per state dibuat sebelum baseline diregenerasi? |
| **Rekomendasi** | **Ya, keduanya.** Fixtures per state (populated/loading/error/stale/done/job-running/job-failed/degraded) wajib sebelum baseline baru. Toleransi ≤5% setelah baseline disetujui. Rute Readiness masuk matriks. |
| **Bukti** | `helpers.ts:25-38` mengembalikan `data:null` → 14 baseline hanya empty state. `visual.spec.ts:13-21` tidak mengunjungi `readiness`. Toleransi 15% = hijau yang tidak bisa dipercaya. |
| **Opsi yang diharapkan** | A = fixtures + ≤5% sekarang · B = fixtures dulu, toleransi tetap 15% untuk RC · C = tunda keduanya ke pasca-RC |
| **Stop rule** | `02-framework.md` §Evidence: "test yang tidak dijalankan bukan PASS". 15% pada empty state = false confidence. |
| **Dampak ke tokens.css** | Tidak langsung. D-S7 menentukan **kualitas bukti**, bukan nilai token. Tapi D-DS4 bergantung padanya. |
| **Argumen penentang A** | ≤5% mungkin terlalu ketat untuk aplikasi dengan font sistem yang berbeda per OS. Pertimbangkan 10% sebagai kompromi. |

### D-DS4 — Strategi regenerasi baseline

| | |
|---|---|
| **Pertanyaan** | Bagaimana baseline visual diregenerasi saat skala tipografi shell berubah? |
| **Rekomendasi DRAFT** | Tunggu D-S7: seeded fixtures dulu, baru regenerasi baseline, baru turunkan toleransi. **D-DS1 = A tetap menggeser 14 baseline** (app bar/rail/stepper ada di tiap screenshot). |
| **Bukti** | 14 baseline PNG ter-commit (7 route × 2 viewport). App bar, nav rail, stepper muncul di setiap screenshot → pergeseran pasti terjadi. |
| **Opsi yang diharapkan** | A = regenerasi setelah D-S7 selesai · B = regenerasi sekarang dengan fixtures sementara · C = jangan regenerasi sampai konvergensi (D-DS5) |
| **Stop rule** | Regenerasi tanpa fixtures = hijau yang tidak bisa dipercaya. C menunda terlalu lama: baseline bergeser sekarang, tidak bisa menunggu D-DS5. |
| **Dampak ke tokens.css** | Tidak langsung. D-DS4 menentukan **proses QA**, bukan nilai token. |
| **Prasyarat** | **D-S7 harus diputus lebih dulu.** |
| **Argumen penentang A** | A menunda regenerasi baseline sampai fixtures selesai, yang bisa memakan waktu. Baselines yang ada saat ini merekam empty state yang menyesatkan. |

### D-DS5 — Konvergensi dua skala tipografi

| | |
|---|---|
| **Pertanyaan** | Kapan dan bagaimana token `--font-size-*` lama (11/13/15) disatukan atau dihapus, setelah `--shell-font-*` (24/18/15/14/12) ada? |
| **Rekomendasi** | **Tunda ke pasca-RC.** Dua skala berdampingan diterima sebagai utang teknis yang tercatat. Konvergensi memerlukan amandemen per fitur + Critic masing-masing. |
| **Bukti** | `body` shell 14px vs fitur 13px, `caption` 12px vs 11px = ketidakkonsistenan nyata (kartu D-DS1 §5). Tapi konvergensi = menyentuh 16 deklarasi global + 28 komponen + 7 kontrak fitur ratified. |
| **Opsi yang diharapkan** | A = tunda ke pasca-RC, catat sebagai utang · B = konvergensi sekarang dengan amandemen per fitur · C = hapus token lama sekarang (berbahaya) |
| **Stop rule** | C = melanggar stop rule (perubahan komponen bersama berdampak luas). B = butuh amandemen 7 kontrak fitur, tidak proporsional di RC. |
| **Dampak ke tokens.css** | A: tidak ada (token lama dibiarkan). B/C: menyentuh token global. |
| **Argumen penentang A** | Dua skala dalam satu layar adalah cacat visual yang nyata, bukan utang abstrak. Ini versi mini dari masalah yang memicu audit UI/UX. |

---

## 4. Format kartu keputusan

Setiap keputusan disusun sebagai kartu dengan struktur yang sama dengan `DECISION-CARD-D-DS1.md`:

```
1. Pertanyaan yang harus dijawab
2. Bukti (berlabel Confirmed / Likely / Suggestion)
3. Opsi (A / B / C, dengan kelebihan dan biaya)
4. Reasoning rekomendasi
5. Argumen terkuat MENENTANG rekomendasi (wajib)
6. Dampak ke artefak lain
7. Jawaban PO (kosong, diisi saat sesi)
8. Record keputusan (kosong, diisi saat sesi)
```

**Kartu dibuat sebelum sesi**, bukan saat sesi. Asisten menyusun semua kartu, lalu PO membaca semuanya sebelum menjawab.

---

## 5. Urutan sesi yang direkomendasikan

### Fase 1 — Persiapan (sebelum PO menjawab)

| Langkah | Siapa | Output |
|---|---|---|
| Baca `HANDOFF-FRESH-SESSION.md` §1–§5 | Asisten | Konteks normatif |
| Baca `DS-SHELL-001.md` §9 (5 keputusan) + §8 enforcement | Asisten | Rekomendasi awal |
| Baca `SCREEN-SHELL-001.md` §3.10 (D-S7 detail) | Asisten | Bukti D-S7 |
| Verifikasi bukti aktual: `helpers.ts`, `visual.spec.ts`, `tokens.css` radius/weight | Asisten | Label Confirmed/Likely |
| Susun 5 kartu keputusan dengan §5 argumen penentang | Asisten | 5 berkas `DECISION-CARD-D-DS*.md` + `DECISION-CARD-D-S7.md` |
| Validasi: link, YAML (tidak ada), konsistensi status | Asisten | Siap untuk PO |

### Fase 2 — Sesi keputusan PO

| Langkah | Siapa | Durasi estimasi |
|---|---|---|
| PO baca semua 5 kartu sekaligus | PO | 15–20 menit |
| Tanya/klarifikasi (jika ada) | PO ↔ asisten | 5–10 menit |
| PO jawab **D-DS2** | PO | 2 menit |
| PO jawab **D-DS3** | PO | 2 menit |
| PO jawab **D-S7** | PO | 3 menit |
| PO jawab **D-DS4** (sekarang D-S7 sudah diputus) | PO | 3 menit |
| PO jawab **D-DS5** (boleh "Tunda") | PO | 2 menit |

**Urutan wajib:** D-DS2 → D-DS3 → **D-S7** → D-DS4 → D-DS5.

### Fase 3 — Sinkronisasi (setelah PO menjawab)

| Langkah | Siapa | Output |
|---|---|---|
| Transkrip ke `DS-SHELL-001.md` §8/§9/§11 | Asisten | DRAFT v0.3 |
| Transkrip ke `SCREEN-SHELL-001.md` §3.10 | Asisten | (berkas bertanda tangan → jangan disunting, gunakan addendum) |
| Update `README.md` tabel keputusan | Asisten | v0.6 |
| Update `HANDOFF-FRESH-SESSION.md` §4 | Asisten | Status keputusan |
| Jika PO ratifikasi: buat `RATIF-SHELL-003` + manifest baru | Asisten | Record terpisah |
| Update memory log | Asisten | Catatan sesi |

---

## 6. Peringatan bias

| Risiko | Mitigasi |
|---|---|
| **8 jawaban A berturut-turut** (7 shell + D-DS1) → PO otomatis pilih A lagi | Setiap kartu punya §5 argumen penentang yang **sama kuat** dengan D-DS1. PO wajib membaca §5 sebelum menjawab. |
| **Keputusan di sesi yang sama dengan penyusunan kartu** | Kartu disusun lebih dulu, PO baca semua, lalu jawab. Tidak ada kartu yang disusun "sedang diputus". Tapi: Critic G5 tetap wajib konteks segar — sesi keputusan ≠ sesi Critic. |
| **D-S7 terlihat teknis → PO skip** | D-S7 adalah **kualitas bukti**, bukan detail teknis. 15% pada empty state = hijau palsu. Kartu harus menjelaskan konsekuensi kepercayaan tes, bukan angka. |
| **D-DS5 terlihat tidak mendesak → PO tunda tanpa rencana** | "Tunda" sah, tetapi harus disertai **tenggat eksplisit** dan **kondisi pemicu** (trigger), bukan sekadar "nanti". Kartu harus meminta PO menentukan kapan. |
| **D-DS3 radius ditunda terus** | Radius 4 vs 6px adalah ketidaksesuaian `DS-CORE-001` ↔ `tokens.css` yang sudah ada sebelum shell contract. Amandemen terpisah tidak diblok, hanya tidak masuk `DS-SHELL-001`. Catat sebagai utang. |

---

## 7. Yang masih dilarang setelah sesi ini

- `tokens.css` / `tokens.ts` tetap **beku** — bahkan jika semua 5 keputusan selesai.
- `tokens.css` baru boleh disentuh setelah: `DS-SHELL-001` diratifikasi PO → G4 exit → **Independent Critic (G5) PASS dengan konteks segar**.
- Tidak ada gate yang exit hanya karena 5 keputusan selesai.
- `docs/status-register.md` tidak ditambah baris.
- Artefak tidak dipindah ke `docs/ux-contracts/`.
- Kode produksi tetap dilarang.

**5 keputusan menutup prasyarat *keputusan* G4, bukan prasyarat *ratifikasi* G4.**

---

## 8. Yang masih terbuka setelah sesi ini

Bila semua 5 diputus:

| Keputusan | Status |
|---|---|
| `D-DS1` | ✅ Ratified (16:01:39 WIB) |
| `D-DS2` | ✅ Diputus/Ratified (sesi baru) |
| `D-DS3` | ✅ Diputus/Ratified (sesi baru) |
| `D-DS4` | ✅ Diputus/Ratified (sesi baru) |
| `D-DS5` | ✅ Diputus/Tunda (sesi baru) |
| `D-S7` | ✅ Diputus/Ratified (sesi baru) |
| `D-F4`…`D-F8` | ☐ Pending (5) |
| `D-S5`, `D-S6`, `D-S8` | ☐ Pending (3) |
| **Total tersisa** | **8 Pending** |

**Urutan berikutnya:** `D-F8` (urutan Phase, mengunci `D-F2`/`D-F3`) → `D-F4`…`D-F7`, `D-S5`, `D-S6`, `D-S8` → bukti penerimaan → ratifikasi kontrak utuh → Independent Critic G5 → Phase 0.

---

## 9. Prompt siap pakai untuk sesi baru

Salin blok berikut ke sesi/konteks baru:

```
Baca dulu docs/shell-contracts/HANDOFF-FRESH-SESSION.md dan 
docs/shell-contracts/SESSION-GUIDE-D-DS2-TO-D-S7.md (panduan sesi ini).
Lalu DS-SHELL-001.md §9 (5 keputusan) dan §8 (enforcement).
Jangan membaca riwayat chat; anggap brief itu self-contained.

Peran kamu: PENYUSUN KARTU KEPUTUSAN, bukan pengesah dan bukan Critic.

Tugas:
1. Verifikasi bukti aktual untuk setiap keputusan:
   - D-DS2: cek kontrak DS fitur di docs/ux-contracts/ (apakah sudah ada 8 state?)
   - D-DS3: cek tokens.css untuk font-weight dan radius yang ada
   - D-S7: cek helpers.ts, visual.spec.ts, jumlah baseline, rute readiness
   - D-DS4: cek jumlah baseline PNG yang akan bergeser
   - D-DS5: cek selector global di tokens.css yang memakai --font-size-*
2. Susun 5 kartu keputusan dengan format DECISION-CARD-D-DS1.md:
   - §1 pertanyaan, §2 bukti berlabel, §3 opsi A/B/C, §4 reasoning,
     §5 argumen penentang, §6 dampak, §7 jawaban (kosong), §8 record (kosong)
3. Urutan kartu: D-DS2, D-DS3, D-S7, D-DS4, D-DS5
4. Setelah semua kartu siap, sajikan ke PO untuk dibaca sekaligus.
5. PO menjawab dalam urutan: D-DS2 → D-DS3 → D-S7 → D-DS4 → D-DS5
6. Transkrip jawaban ke DS-SHELL-001.md §8/§9/§11 (naik ke DRAFT v0.3).
7. Update README.md dan HANDOFF-FRESH-SESSION.md.
8. Jangan menyentuh tokens.css, tokens.ts, generated.ts, atau kode produksi.
9. Jangan menyunting 5 berkas bertanda tangan (lihat HANDOFF §2.3).
10. Jangan mencentang kotak Exit G4.

Setelah 5 keputusan selesai, tanyakan: "Apakah Anda ingin meratifikasi
semua keputusan ini sekaligus?" Jika ya, buat RATIF-SHELL-003 + manifest
baru (jangan timpa v1 atau v2).
```

---

## 10. Verifikasi cepat (sebelum dan sesudah sesi)

**Sebelum sesi:**
```bash
cd docs/shell-contracts
shasum -a 256 -c SIGNATURE-MANIFEST-2026-11-08.sha256                    # expect: 5/5 OK
shasum -a 256 -c SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256    # expect: 2/2 OK
grep -c 'font-size: var(--font-size-' ../../frontend/src/shared/tokens.css  # expect: 16
grep -rln -- '--font-size-' ../../frontend/src                             # expect: 2 berkas
find ../../frontend/tests -name '*.png' | wc -l                            # expect: 14+
grep -n 'maxDiffPixelRatio' ../../frontend/tests/visual.spec.ts            # expect: 0.15
```

**Sesudah sesi:**
```bash
cd docs/shell-contracts
shasum -a 256 -c SIGNATURE-MANIFEST-2026-11-08.sha256                    # expect: 5/5 OK (tidak berubah)
shasum -a 256 -c SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256    # expect: 2/2 OK (tidak berubah)
ls -1 DECISION-CARD-D-DS*.md DECISION-CARD-D-S7.md 2>/dev/null | wc -l   # expect: 5 kartu baru
grep -c 'Diputus PO\|Ratified' DS-SHELL-001.md                            # transkrip tersinkron
git status --porcelain -- frontend/                                       # expect: empty (no production changes)
```

---

**Status akhir:** Panduan ini bukan kontrak dan bukan keputusan. Ia memastikan sesi 5 keputusan berjalan terstruktur, dengan urutan yang menghormati ketergantungan, dan tanpa mengorbankan disiplin bukti atau integritas tanda tangan.
