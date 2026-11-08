# Catatan Keputusan Sesi Ratifikasi — Shell v0

**Status:** CATATAN SESI — **7 keputusan DIRATIFIKASI PO 2026-11-08 14:04 WIB dan DITANDATANGANI DIGITAL 14:23:54 WIB** (`SIG-SHELL-2026-11-08-01`); 9 keputusan tetap Pending; kontrak induk tetap DRAFT.
**Tanggal:** 2026-11-08 · **Record ratifikasi:** [RATIFICATION-RECORD-2026-11-08.md](RATIFICATION-RECORD-2026-11-08.md) · **Worksheet:** [RATIFICATION-SESSION-01.md](RATIFICATION-SESSION-01.md) · **Mockup:** `prototypes/shell-v0/index.html` (DISPOSABLE)

> Berkas ini adalah **catatan jalannya sesi**. Sumber hukum ratifikasi ada di `RATIFICATION-RECORD-2026-11-08.md` §2.
> `FLOW-SHELL-001` (v0.2) dan `SCREEN-SHELL-001` (v0.2) tetap berstatus **DRAFT / belum diratifikasi sebagai kontrak utuh**.
> Ratifikasi parsial **bukan** izin kode produksi: 9 keputusan masih Pending, G1/G4/G6 belum ada, dan Independent Critic (G5) belum PASS.

**Riwayat jawaban:**
- `A` pada 2026-11-08 13:02 GMT+7 → dicatat untuk **`D-F1`** saja, karena sesi saat itu ditawarkan satu keputusan demi satu keputusan.
- `"semua A untuk sisa 6 keputusan"` pada 2026-11-08 13:10 GMT+7 → konfirmasi eksplisit untuk **`D-F2`, `D-F3`, `D-S1`, `D-S2`, `D-S3`, `D-S4`**.
- `"sy mau ratifikiasi 7 decision iut"` pada 2026-11-08 **14:04 WIB** → **tindakan pengesahan PO** untuk ketujuh keputusan.
- `"sy sign secara digital aja worksheet nya"` pada 2026-11-08 **14:23:54 WIB** → **tanda tangan digital** pada worksheet, `SIG-SHELL-2026-11-08-01`.

Dengan demikian **7 / 7 keputusan bentuk shell berisi pilihan dan sudah berparaf PO**, semuanya mengikuti rekomendasi fasilitator, tanpa dissent yang disampaikan. **Sembilan keputusan lainnya tidak naik status.**

---

## Rekap 7 keputusan bentuk shell

| # | ID | Pertanyaan | Pilihan | Sesuai rekomendasi | Sumber | Paraf PO |
|---|---|---|---|---|---|---|
| 1 | `D-F1` | Stepper 10 stage penuh atau minimal? | **A** — stepper minimal 5 stage dari sinyal nyata | Ya | Chat 13:02 GMT+7 | ✅ PO via chat 14:04 WIB |
| 2 | `D-F2` | Router state-only atau hash + history? | **A** — hash routing + history stack | Ya | Chat 13:10 GMT+7 | ✅ PO via chat 14:04 WIB |
| 3 | `D-F3` | Strategi pemulihan konteks saat reload? | **A** — persist + wajib revalidasi | Ya | Chat 13:10 GMT+7 | ✅ PO via chat 14:04 WIB |
| 4 | `D-S1` | Grup & urutan navigasi final? | **A** — 7 grup / 9 item | Ya | Chat 13:10 GMT+7 | ✅ PO via chat 14:04 WIB |
| 5 | `D-S2` | Locale tunggal yang mana? | **A** — Bahasa Indonesia konsisten | Ya | Chat 13:10 GMT+7 | ✅ PO via chat 14:04 WIB |
| 6 | `D-S3` | Perilaku 900px? | **A** — rail berlabel + drawer Job Center | Ya | Chat 13:10 GMT+7 | ✅ PO via chat 14:04 WIB |
| 7 | `D-S4` | Skala tipografi & komponen shell? | **A** — amandemen 24/18/15/14/12 | Ya | Chat 13:10 GMT+7 | ✅ PO via chat 14:04 WIB |

**Progres:** 7 / 7 · **Diratifikasi PO:** ✅ 7 / 7 (2026-11-08 14:04 WIB) · **Belum dijawab:** tidak ada · **Dissent tercatat:** tidak ada · **Masih Pending:** 9 keputusan lihat §"Sembilan keputusan yang tetap ditunda"

---

## Bunyi keputusan (bukan sekadar huruf A)

Ditulis agar kontrak kelak tidak menafsirkan "A" secara longgar. **Sejak 2026-11-08 14:04 WIB tabel ini mengikat** dan sudah ditranskrip ke badan `FLOW-SHELL-001` / `SCREEN-SHELL-001`; versi autoritatif ada di [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) §2.

| ID | Yang disetujui | Yang secara eksplisit TIDAK disetujui |
|---|---|---|
| `D-F1` | Stepper 5 tahap (Proyek, Dataset, Profil, Kualitas, Kesiapan) dengan status hanya dari sinyal sah; tahap lain `Belum tersedia` dan tidak diklik | Stepper 10 stage penuh, status `In Progress` per tahap, persentase, stage 8, status karangan |
| `D-F2` | Hash routing + history stack; `navigate` tetap lewat `useRouter` agar 28 komponen tidak berubah; nav dirender sebagai `<a href="#…">` | Router state-only, rewrite router pihak ketiga saat RC |
| `D-F3` | Simpan `{route, projectId, datasetId}` di localStorage, **wajib revalidasi ke backend saat boot**, gagal → state `degraded` beralasan | Tanpa persistensi; menyimpan record analisis; menyajikan empty state saat revalidasi gagal |
| `D-S1` | 7 grup / 9 item; Pembersihan sebelum Hubungan; backup/restore/export/diagnostic → Tools | 8 item flat tanpa hierarki; urutan lama (Readiness ke-5, Cleaning ke-7) |
| `D-S2` | Satu locale Bahasa Indonesia untuk seluruh shell; satu register copy | Campuran `Bivariat` / `Assessing…` / `rows`; ID dokumen internal di UI (`Doc04 §12`, `G6-2`, `Doc15 §10`) |
| `D-S3` | 900px: rail berlabel ~176px, Job Center + dataset + versi pindah ke drawer, toggle selalu terlihat, `Esc` + focus return | `display:none` pada region berstatus/aksi; rail ikon buta 64px; menunda perbaikan 900px |
| `D-S4` | Amandemen `DS-CORE-001`: skala 24/18/15/14/12, kontrol 36px dengan hover/fokus/disabled, kartu, tabel `<caption>` + `scope`, alternatif teks chart | Skala 11/13/15px + kontrol native; mengubah warna/kontras/min-window `DS-CORE-001` |

## Catatan kehati-hatian

1. **Keputusan bulat A tanpa dissent.** Tidak ada yang salah secara prosedural — PO berhak menerima seluruh rekomendasi — tetapi worksheet §3 mengingatkan bahwa keputusan bulat tanpa catatan sering berarti pertanyaan belum benar-benar diajukan. Simpan catatan ini agar sesi tidak kelak dibaca sebagai rubber stamp.
2. **Empat keputusan tidak bisa dibuktikan dari mockup.** `D-F2` dan `D-F3` baru PASS setelah uji **reload / Back / revalidasi gagal**; `D-S3` setelah uji aksesibilitas pada 900px; `D-S4` setelah `DS-SHELL-001` (G4) **diratifikasi** — draf v0.1 sudah ada per 2026-11-08, tetapi itu belum memenuhi prasyarat. Screenshot prototipe **bukan** bukti penerimaan.
3. **`D-F1` mengunci dua hal yang belum diputus:** `D-S8` (status `In Progress` ditunda) dan `D-F5` (ekstensi `JobEvent`). Keduanya tetap berada di daftar 9 yang ditunda; menyetujui A tidak diam-diam menyetujui keduanya.
4. **`D-S2` tidak menimpa copy fitur ratified.** Copy deck lintas-route (`D-S5`) masih ditunda dan harus disinkronkan dengan `SCREEN-CLEAN-001` dsb.
5. **Tidak ada yang diimplementasikan.** Tujuh keputusan yang kini ratified tetap tidak mengubah `frontend/`, tidak mengubah IPC, dan tidak membuka G5. Yang berubah hanya status keputusan di dokumen, bukan kode.
6. **Bentuk paraf — sudah ditandatangani digital.** Pengesahan awal lewat chat 14:04 WIB, lalu PO menandatangani worksheet secara digital pada **14:23:54 WIB** (`SIG-SHELL-2026-11-08-01`, worksheet §8). Tujuh kolom `Paraf PO` kini menunjuk ke Signature ID tersebut — bukan tanda tangan rekaan. Integritas diverifikasi lewat `SIGNATURE-MANIFEST-2026-11-08.sha256`. Ini **bukan** tanda tangan PKI/tersertifikasi secara hukum; lihat batas kejujuran di worksheet §8.
7. **`D-F2`/`D-F3` berada di Phase 1, tetapi `D-F8` Pending.** Ratifikasi bentuk router/resume tidak membuka pekerjaan Phase 1 dan tidak mengizinkan perubahan IPC.

---

## Sembilan keputusan yang tetap ditunda (tidak berubah setelah ratifikasi parsial)

`D-F4`, `D-F5`, `D-F6`, `D-F7`, `D-F8`, `D-S5`, `D-S6`, `D-S7`, `D-S8` — rincian bukti yang dibutuhkan ada di worksheet §5. **Ratifikasi 7 keputusan bentuk shell pada 14:04 WIB tidak menaikkan status kesembilan ini.**

## Status pasca-ratifikasi (2026-11-08 14:04 WIB)

| Langkah | Status |
|---|---|
| Lengkapi 7 pilihan | ✅ selesai (13:10 WIB) |
| Paraf PO untuk 7 keputusan | ✅ selesai (chat 14:04 WIB) + **tanda tangan digital 14:23:54 WIB** — [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md), [worksheet §8](RATIFICATION-SESSION-01.md), `SIGNATURE-MANIFEST-2026-11-08.sha256` |
| Transkrip bunyi keputusan ke badan `FLOW-SHELL-001` / `SCREEN-SHELL-001` + tanda `Ratified oleh PO` pada 7 baris | ✅ selesai (kontrak naik ke v0.2, tetap DRAFT) |
| Ratifikasi **utuh** kedua kontrak (G2/G3 exit) | ☐ belum — 9 keputusan masih Pending |
| Bukti penerimaan: uji reload/Back/revalidasi gagal, aksesibilitas 900px, G4 | ☐ belum |
| Draft `DS-SHELL-001` (G4) | ✅ **DRAFT v0.1 selesai 2026-11-08** — prasyarat *draft* `D-S4` terpenuhi; kontrak belum diratifikasi, 4 keputusan mekanisme `D-DS1`…`D-DS4` masih Pending |
| Draft `APP-ARCH-001`, `JOB-SHELL-001`, `QA-SHELL-001` | ☐ belum |
| Baris di `docs/status-register.md` | ☐ sengaja belum — register memuat artefak fully ratified; diisi saat kontrak utuh naik status |
| **Independent Critic (G5)** dengan konteks segar | ☐ belum |
| **Paralel, wajib sebelum rilis:** 7 skenario `docs/beta-validation-script.md` + kanal `beta-feedback` | ☐ belum |
| Arsipkan / hapus `prototypes/shell-v0/` | ☐ belum — menunggu ratifikasi utuh |
