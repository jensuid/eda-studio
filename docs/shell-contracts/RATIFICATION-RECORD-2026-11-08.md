# RATIF-SHELL-001 — Record Ratifikasi Parsial PO (7 Keputusan Bentuk Shell)

**ID:** RATIF-SHELL-001 · **Status:** BERLAKU SEBAGIAN — 7 keputusan **diratifikasi PO**; kontrak induknya **tetap DRAFT**.
**Tanggal / waktu:** ratifikasi 2026-11-08 14:04 WIB · **ditandatangani digital** 2026-11-08 14:23:54 WIB (GMT+7) · **Pemilik keputusan:** Product Owner (PO).
**Tanda tangan:** `SIG-SHELL-2026-11-08-01` pada [RATIFICATION-SESSION-01.md](RATIFICATION-SESSION-01.md) §8 · **Integritas:** `SIGNATURE-MANIFEST-2026-11-08.sha256`.
**Berkas induk:** [FLOW-SHELL-001.md](FLOW-SHELL-001.md) · [SCREEN-SHELL-001.md](SCREEN-SHELL-001.md)
**Bukti pendukung:** [DECISIONS-2026-11-08.md](DECISIONS-2026-11-08.md) · [RATIFICATION-SESSION-01.md](RATIFICATION-SESSION-01.md) · `prototypes/shell-v0/index.html#session-all-a` (DISPOSABLE)

> **Berkas ini SAH untuk 7 keputusan yang disebut di §2, dan TIDAK berlaku untuk hal lain.**
> Ratifikasi keputusan **bukan** ratifikasi kontrak, **bukan** izin implementasi, **bukan** pembukaan G5, dan **bukan** perubahan IPC/backend.

---

## 1. Dasar ratifikasi & rantai bukti

| Waktu (WIB) | Peristiwa | Berkas / bukti |
|---|---|---|
| 2026-11-08 13:02 | PO memilih **`A`** untuk `D-F1` | Chat; dicatat di `DECISIONS-2026-11-08.md` §Riwayat jawaban |
| 2026-11-08 13:10 | PO menyatakan **"semua A untuk sisa 6 keputusan"** → `D-F2`, `D-F3`, `D-S1`, `D-S2`, `D-S3`, `D-S4` | Chat; eksplisit, tanpa perlu interpretasi |
| 2026-11-08 13:10–13:40 | 7/7 pilihan tersinkron ke panel mockup, terekspor, dan lolos validasi 58/58 | `#session-all-a`, `localStorage`, Markdown export, `/tmp/shell-v0-session-test.js` |
| 2026-11-08 14:04 | PO menyatakan **"sy mau ratifikiasi 7 decision iut"** → tindakan pengesahan | Chat; dasar hukum ratifikasi |
| 2026-11-08 14:23:54 | PO menyatakan **"sy sign secara digital aja worksheet nya"** → worksheet ditandatangani digital | `SIG-SHELL-2026-11-08-01`, worksheet §8, manifest SHA-256 |

**Bentuk paraf:** pengesahan elektronik PO dalam sesi teraudentikasi, **ditandatangani digital pada worksheet** (`SIG-SHELL-2026-11-08-01`, 14:23:54 WIB). Tujuh kolom `Paraf PO` di worksheet §4.1–§4.7 kini berisi **penunjuk ke Signature ID**, bukan tanda tangan rekaan. Integritas diverifikasi lewat `shasum -a 256 -c SIGNATURE-MANIFEST-2026-11-08.sha256`. **Batas kejujuran:** ini bukan tanda tangan PKI/tersertifikasi secara hukum; kekuatan buktinya ada pada identitas akun sesi, stempel waktu, dan sidik jari berkas (rincian di worksheet §8).

**Asumsi yang dinyatakan:** pihak yang memberi perintah ratifikasi bertindak selaku PO. Bila asumsi ini keliru, ratifikasi dibatalkan dan seluruh status dikembalikan ke DRAFT — cukup satu pernyataan pembatalan dari PO.

**Keputusan bulat tanpa dissent:** ketujuh pilihan mengikuti rekomendasi fasilitator dan tidak ada catatan dissent. Ini sah secara prosedural, namun dicatat agar record ini tidak kelak dibaca sebagai rubber stamp (lihat worksheet §3.6).

---

## 2. Tujuh keputusan yang DIRATIFIKASI

Status semua baris: **`Ratified oleh PO (2026-11-08)` — opsi A**, mengikat untuk **bentuk shell**.

| ID | Bunyi keputusan yang mengikat | Yang secara eksplisit DITOLAK | Bukti penerimaan yang MASIH WAJIB |
|---|---|---|---|
| `D-F1` | Stepper **5 tahap** (Proyek, Dataset, Profil, Kualitas, Kesiapan) dengan status hanya dari sinyal sah; tahap lain `Belum tersedia` dan tidak diklik | Stepper 10 stage penuh, `In Progress` per tahap, persentase, stage 8, status karangan | Tabel sinyal × status; uji fingerprint mismatch (`FLOW` §2.2) |
| `D-F2` | **Hash routing + history stack**; `navigate` tetap lewat `useRouter` agar 28 komponen tidak berubah; nav sebagai `<a href="#…">` | Router state-only; rewrite router pihak ketiga saat RC | Uji **reload** dan **Back/Forward** — screenshot mockup bukan bukti |
| `D-F3` | Simpan `{route, projectId, datasetId}` di localStorage, **wajib revalidasi ke backend saat boot**, gagal → `degraded` beralasan | Tanpa persistensi; menyimpan record analisis; empty state saat revalidasi gagal | Uji **revalidasi gagal** + reload; bukan screenshot |
| `D-S1` | **7 grup / 9 item**; Pembersihan sebelum Hubungan; backup/restore/export/diagnostic → `Tools` | 8 item flat tanpa hierarki; urutan lama (Readiness ke-5, Cleaning ke-7) | Sinkron `router.tsx` saat implementasi; uji `aria-current` |
| `D-S2` | Satu locale **Bahasa Indonesia** untuk seluruh shell; satu register copy | Campuran `Bivariat` / `Assessing…` / `rows`; ID dokumen internal di UI | `D-S5` copy deck masih Pending; copy fitur ratified tidak boleh ditimpa |
| `D-S3` | 900px: rail **berlabel ~176px**, Job Center + dataset + versi ke **drawer**, toggle selalu terlihat, `Esc` + focus return | `display:none` pada region berstatus/aksi; rail ikon buta 64px; menunda perbaikan 900px | Uji **aksesibilitas 900px** (axe + keyboard + screen reader) |
| `D-S4` | Amandemen `DS-CORE-001`: skala **24/18/15/14/12**, line-height ≥1.4, kontrol 36px dengan 8 state, kartu, tabel `<caption>` + `scope`, alternatif teks chart | Skala 11/13/15px + kontrol native; mengubah **warna/kontras/min-window** `DS-CORE-001` | **`DS-SHELL-001` (G4) wajib didraft + diratifikasi** sebelum nilai dipakai di kode (draf v0.1 ada per 2026-11-08, ratifikasi belum) |

Bunyi keputusan di atas ditranskrip ke badan `FLOW-SHELL-001` (§2.2, §2.3, §2.9, §Keputusan PO) dan `SCREEN-SHELL-001` (§3.2, §3.4, §3.6, §3.8, §3.9, §Keputusan PO). Bila ada perbedaan wording antara record ini dan badan kontrak, **record ini yang menang** dan badan kontrak diamandemen.

---

## 3. Yang TIDAK diratifikasi (tetap seperti semula)

| Hal | Status setelah record ini |
|---|---|
| `D-F4`, `D-F5`, `D-F6`, `D-F7`, `D-F8` | **Pending** — 5 keputusan FLOW |
| `D-S5`, `D-S6`, `D-S7`, `D-S8` | **Pending** — 4 keputusan SCREEN |
| `FLOW-SHELL-001` secara utuh | **DRAFT v0.2** — G2 BELUM exit |
| `SCREEN-SHELL-001` secara utuh | **DRAFT v0.2** — G3 BELUM exit |
| `DS-SHELL-001` | **DRAFT v0.1** (2026-11-08) — belum diratifikasi; `D-DS1`…`D-DS4` Pending |
| `APP-ARCH-001`, `JOB-SHELL-001`, `QA-SHELL-001` | **Belum didraft** |
| G4 / G5 / G6 | **Belum dibuka.** Independent Critic dengan konteks segar belum dijadwalkan |
| Implementasi `frontend/`, `backend/contracts.py`, `generated.ts` | **Tidak ada perubahan; tidak diizinkan** |
| Migrasi ke `docs/ux-contracts/shell/` + baris di `docs/status-register.md` | **Belum dilakukan** — register itu memuat artefak yang sudah diratifikasi utuh; baru diisi saat kontrak utuh naik status |
| `docs/BASELINE-FREEZE-v1.0.md` | Tetap berlaku, dengan amandemen terbatas di §4 |
| `prototypes/shell-v0/` | Tetap **DISPOSABLE**; menunggu arsip/hapus, belum dihapus |

---

## 4. Amandemen terbatas terhadap Baseline Freeze v1.0 / Doc08 §19

Doc08 §19 men-Deferred empat area. PO sekarang menyelesaikan **dua di antaranya, untuk layer shell saja**:

| Deferred Doc08 §19 | Keputusan | Cakupan amandemen |
|---|---|---|
| *exact navigation labels and ordering* | `D-S1` (+ `D-S2`) | **Resolved untuk shell**: 7 grup / 9 item, urutan dan label final lintas-route. Label di dalam region fitur tetap milik kontrak fitur ratified |
| *detailed design tokens and visual theme* | `D-S4` | **Resolved sebagian**: hanya skala tipografi 24/18/15/14/12 + state kontrol dasar shell. **Warna, kontras AA, radius, spacing, dan min-window 900px dari `DS-CORE-001` TIDAK berubah** |
| *final screen-by-screen layouts* | — | **Tetap Deferred.** R1–R7 adalah frame, bukan layout per layar |
| *final Job Center screen layout* | — | **Tetap Deferred.** `D-S3` hanya memutuskan *di mana* Job Center berada pada 900px, bukan rincian isinya |

Amandemen ini **tidak** menaikkan status baris lain yang tidak disebut. `docs/status-register.md` sengaja tidak disentuh pada tahap ratifikasi parsial agar register tidak memuat artefak setengah ratified.

---

## 5. Ratifikasi ≠ PASS: bukti yang belum ada

Empat keputusan disahkan **sebagai arah**, bukan sebagai hasil uji. Menandainya "sudah diterima" dari prototipe adalah pelanggaran disiplin bukti (`02-framework.md` §Evidence discipline).

| Keputusan | Yang belum ada | Konsekuensi |
|---|---|---|
| `D-F2`, `D-F3` | Uji reload / Back / revalidasi gagal pada aplikasi nyata | Belum boleh diklaim context loss selesai |
| `D-S3` | Uji aksesibilitas pada 900px (axe 0 critical + keyboard + screen reader) | 900px masih release blocker sampai uji ini PASS |
| `D-S4` | `DS-SHELL-001` (G4) | Angka tipografi belum boleh ditulis ke `tokens.css` |
| `D-F1` | `D-F8` (urutan Phase) dan `D-F5` (`JobEvent`) masih Pending | Stepper 5 tahap disahkan bentuknya, **bukan** jadwal pengerjaannya |

**Catatan khusus `D-F2` / `D-F3`:** keduanya berada di Phase 1 menurut `FLOW-SHELL-001` §2.8, sementara keputusan yang mengunci urutan Phase (`D-F8`) masih Pending. Maka ratifikasi ini **tidak** membuka pekerjaan Phase 1 dan **tidak** mengizinkan perubahan IPC. Yang berubah hanyalah: bila Phase 1 kelak disetujui, bentuk router dan resume sudah tidak perlu diperdebatkan lagi.

**`D-F1` mengunci tanpa memutus:** `D-S8` (`In Progress` per-stage) dan `D-F5` (ekstensi `JobEvent`) tetap Pending. Menyetujui A **tidak** diam-diam menyetujui keduanya.

**`D-S2` tidak menimpa copy fitur:** `D-S5` (copy deck) masih Pending dan wajib disinkronkan dengan `SCREEN-CLEAN-001` dsb.

---

## 6. Yang kini mengikat vs yang tetap dilarang

**Mengikat (untuk diskusi desain & kontrak turunan):** ketujuh bunyi keputusan di §2. Kontrak turunan (`DS-SHELL-001`, `QA-SHELL-001`, `APP-ARCH-001`) wajib konsisten dengannya; bila ingin menyimpang, harus lewat amandemen PO, bukan keputusan implementasi.

**Tetap dilarang:**
1. Menulis kode produksi berdasarkan mockup disposable atau record ini.
2. Menambah `project.open`, Cancel/Retry job, progress determinate, atau tombol unduh artefak sebelum kontrak Pydantic-nya ada.
3. Mengubah `frontend/src/shared/ipc/generated.ts` dengan tangan.
4. Menurunkan toleransi visual 15% → ≤5% tanpa seeded fixtures per state.
5. Menandai `FLOW-SHELL-001` / `SCREEN-SHELL-001` sebagai "approved" hanya untuk membuka G5.
6. Menyajikan kegagalan muat sebagai data kosong; mengklaim test yang tidak dijalankan sebagai PASS.

---

## 7. Gate berikutnya (urutan tidak boleh dilompat)

1. ✅ `DS-SHELL-001` (G4) **sudah didraft v0.1** (2026-11-08). **Ratifikasi G4 tetap tertunda** sampai `D-DS1`…`D-DS4` diputus. Selanjutnya: draft `APP-ARCH-001`, `JOB-SHELL-001` (G1), `QA-SHELL-001` (G6).
2. Putuskan 9 keputusan Pending dengan bukti masing-masing (worksheet §5).
3. Susun bukti penerimaan §5: uji reload/Back/revalidasi gagal, uji aksesibilitas 900px, G4.
4. Ratifikasi **utuh** `FLOW-SHELL-001` (G2 exit) dan `SCREEN-SHELL-001` (G3 exit) → migrasi ke `docs/ux-contracts/shell/` → baris baru di `docs/status-register.md`.
5. **Independent Critic (G5)** dengan konteks segar, temuan berlabel `Confirmed / Likely / Suggestion`.
6. Baru kemudian G5 slice + Phase 0 (frontend-only, tanpa perubahan IPC).
7. **Paralel, wajib sebelum rilis:** jalankan 7 skenario `docs/beta-validation-script.md` pada build saat ini dan buka kanal `beta-feedback`.
8. Arsipkan atau hapus `prototypes/shell-v0/` setelah ratifikasi utuh.

---

## 8. Pembatalan & amandemen

- **Pembatalan:** pernyataan PO bahwa ia tidak bertindak selaku PO, atau membatalkan ratifikasi → seluruh `Ratified oleh PO (2026-11-08)` dikembalikan ke `Pending`, kontrak kembali ke v0.1, `SIG-SHELL-2026-11-08-01` dicabut, dan record ini ditandai `DIBATALKAN`.
- **Amandemen:** perubahan bunyi keputusan wajib record baru `RATIF-SHELL-002` yang menyebut ID yang diubah, alasan, dan dampak ke kontrak turunan. Dilarang mengedit baris §2 diam-diam. Amandemen **membatalkan sidik jari lama** dan wajib tanda tangan baru `SIG-SHELL-<tanggal>-02` beserta manifest yang diperbarui.
- **Perubahan berkas DRAFT:** kontrak `FLOW`/`SCREEN` memang akan diedit lagi saat 9 keputusan Pending diputus. Perubahan itu **tidak membatalkan tanda tangan atas 7 keputusan**, tetapi akan membuat hash lama di manifest tidak cocok — saat itu terbitkan manifest baru dan catat alasannya di sini, jangan diam-diam menimpa hash.
- **Versi:** v1.1 — ratifikasi 2026-11-08 14:04 WIB; tanda tangan digital 14:23:54 WIB.
