# G5 Independent Critic Report — Shell Contracts (2026-11-08)

**Peran:** Independent Critic (G5), konteks segar, bukan penulis, bukan pengesah.
**Tanggal:** 2026-11-08. **Status:** FEEDBACK DRAFT — temuan bersifat advisory; keputusan & disposition tetap milik PO. **Bukan** ratifikasi, **bukan** G5 PASS formal, **bukan** G6 exit.
**Kontrak yang diperiksa:** `APP-ARCH-001`, `JOB-SHELL-001`, `FLOW-SHELL-001`, `SCREEN-SHELL-001`, `DS-SHELL-001`, `QA-SHELL-001` (DRAFT v0.1).
**Dasar:** `HANDOFF-FRESH-SESSION.md` §2–§5, §8; `README.md`; `RATIFICATION-RECORD-2026-11-08.md` §2; `RATIF-SHELL-002/003/004`. **Aturan "record menang"** (`RATIFICATION-RECORD-2026-11-08.md:46`).

## Temuan

| ID | Label | Severity | Lokasi | Harapan vs Fakta | Rekomendasi |
|---|---|---|---|---|---|
| G5-01 | Confirmed | **High** | `FLOW-SHELL-001.md:5,16-17,73,75,163,175,182-186,196,201` | Harapan: 21 Ratified, 0 Pending. Fakta: badan FLOW masih menyatakan `D-F4…D-F8` = Pending, "G5 dilarang dimulai", `D-F5`/`D-S8` Pending (§2.2, §2.8), §Keputusan PO menampilkan 5 Pending. Substansi §2.5/§2.7/§2.8 cocok dengan RATIF-SHELL-004, tetapi transkrip usang dan secara *wording* bertentangan dengan record. Record menang → cacat dokumentasi, bukan cacat keputusan. | Addendum PO pembetulan transkrip FLOW (berkas bertanda tangan tidak disunting). |
| G5-02 | Confirmed | **High** | `SCREEN-SHELL-001.md:5,16,115,134,161,251` | Harapan: 21 Ratified, 0 Pending. Fakta: SCREEN masih menyatakan `D-S5…D-S8` Pending (header, §3.4:115, §3.5, Exit G3:251). §3.5 benar sebagai *usulan literal*, tetapi label statusnya usang setelah `D-S5` Ratified A 17:38:27. Record menang. | Addendum: §3.5 kini Ratified A tetapi tetap tidak menimpa copy fitur ratified (SCREEN-CLEAN-001 menang; SCREEN §3.5:159). |
| G5-03 | Confirmed | **Medium** | `JOB-SHELL-001.md:124` (B8) vs `APP-ARCH-001.md:209` | B8 masih "Belum dimulai (memang dilarang)" — usang setelah G5 dimulai. | **Sudah diperbarui** (Add-08): B8 → "Laporan diterima; menunggu disposition PO". |
| G5-04 | Confirmed | **Medium** | `FLOW-SHELL-001.md:4` (parent provisional) | FLOW masih menulis parent "belum didraft; anchor provisional"; JOB-SHELL-001 kini ada (DRAFT v0.1). | Referensikan JOB-SHELL-001 eksplisit di addendum; tidak mengubah isi teknis. |
| G5-05 | Likely | **Low** | `APP-ARCH-001.md:113,116` | Dua baris bertanda stale di checkpoint sebelumnya; pada berkas yang dibaca Critic sudah diperbarui. | Verifikasi satu checkout; tidak ada tindakan bila sudah konsisten. |
| G5-06 | Confirmed | **Low** | `DS-SHELL-001.md:227` (§8 butir 1: "klaim hex liar = 0 terverifikasi") | Klaim verifikasi tanpa artefak bukti run lampiran — satu-satunya klaim "terverifikasi" tanpa rujukan artefak. | Turunkan menjadi Likely, atau lampirkan output lint ke QA §3 (B9). **Belum diubah** — menunggu disposition PO. |
| G5-07 | Suggestion | **Low** | `QA-SHELL-001.md:83-96` (B1, B2, B12) | B1 (walkthrough Doc01 §11.1) dan B12 (vertical slice) belum menyebut kriteria selesai terukur (berapa tugas, viewport, jalur keyboard). B7/B10 sudah terukur. | Tambahkan acceptance threshold B1/B12 saat ratifikasi QA (mis. 5 tugas §11.1, 900+1440px, keyboard-only). |
| G5-08 | Suggestion | **Low** | `FLOW-SHELL-001.md:82-93` (steps 6-10) | Stage 7 = `Hubungan` (bivariate) juga terkait kontrak fitur ratified JOB-FLOW-SCREEN-BIVAR; FLOW tidak menyebutnya eksplisit. | Perjelas di addendum: stage 7 tidak tersedia-sinyal di shell meskipun kontrak fitur BIVAR ratified — bukan konflik. |

## Pemeriksaan per tugas

1. **Konsistensi 21 keputusan vs wording kontrak.** 21/21 Ratified di 4 record. APP-ARCH, JOB, DS, QA konsisten; FLOW & SCREEN **tidak konsisten secara wording** (G5-01/G5-02) meski substansi cocok — diperkirakan & didokumentasikan (koreksi via addendum, bukan edit berkas bertanda tangan). DS-SHELL-001 satu-satunya kontrak yang 0 Pending di semua badan.
2. **Konflik dengan `docs/ux-contracts/`.** Tidak ada konflik material. Shell tunduk eksplisit pada kontrak fitur (JOB:76 "feature contract wins"; DS §1 prinsip 6; SCREEN §3.5:159 copy SCREEN-CLEAN-001 menang). Satu *debt* diakui terbuka (radius 4px vs DS-CORE-001 6px, dikunci D-DS3/D-DS5 pasca-RC) — sesuai putusan PO.
3. **Divergensi APP-ARCH §3 vs Doc07 §6.2 / Doc08 §4.1.** **Terdokumentasi, bukan dihapus diam-diam**: pemetaan 8 grup → 7 grup/9 item per baris, Extensions/Settings ❌ tidak di RC, Tools satu-satunya grup baru, janji Doc07 §6.3 yang belum terpenuhi dicatat jujur (APP-ARCH-001:178-183).
4. **QA-SHELL-001.** Katalog B1–B12 lengkap terhadap 21 keputusan; sebagian besar terukur (B5 axe 0 critical/8 route, B7 8×3×2 + kontras, B9 diff aditif, B10 ≤5%); B1/B12 kurang terukur (G5-07). **Tidak ada klaim PASS tak didukung**: QA eksplisit NOT PASS, semua bukti "Belum ada", vonis **FAIL by default** (`QA-SHELL-001:110`).
5. **Status bukti.** Confirmed (ada file:line): audit mismatch implementasi APP-ARCH §4 A1–A10; temuan DS §2.2; label "Likely" pada prototype `--fs-*` tepat. Klaim tanpa bukti tersisa: hanya "hex liar = 0 terverifikasi" (G5-06).

## Verdict per kontrak (advisory)

| Kontrak | Verdict | Catatan |
|---|---|---|
| APP-ARCH-001 | **PASS** (advisory) | Divergensi §3 terapan; 0 Pending benar. |
| JOB-SHELL-001 | **PASS** (advisory) | B8 usang (G5-03), bukan blocker; sudah diperbarui. |
| FLOW-SHELL-001 | **FAIL bersyarat (transkrip usang)** | Perbaiki via addendum; bukan edit berkas bertanda tangan. |
| SCREEN-SHELL-001 | **FAIL bersyarat (transkrip usang)** | Sama seperti FLOW. |
| DS-SHELL-001 | **PASS** (advisory) | Transkripsi 21 keputusan benar; satu klaim Low (G5-06). |
| QA-SHELL-001 | **PASS** (advisory) | **Bukan bukti acceptance** — B1–B12 Belum ada, G6 tetap FAIL sampai bukti dieksekusi. |

**Keseluruhan:** tidak ada blocker substansi terhadap 21 keputusan. Satu-satunya penghalang G5 PASS penuh adalah transkrip usang FLOW/SCREEN yang secara desain diperbaiki lewat addendum. Jika PO menerbitkan addendum pembetulan itu, keenam kontrak dapat ditandai G5 PASS. **G6 tetap tertutup sampai B1–B12 dieksekusi.**

## Bukan cacat (not-defects)

- Stage 6/7/10 "Belum tersedia", stage 8 tidak ditampilkan, `In Progress` per-stage ditolak — benar per D-F1.
- Extensions/Settings tidak di RC — eksplisit dan tidak boleh diklik (APP-ARCH §3).
- Radius 4px vs 6px dikunci D-DS3/D-DS5 sebagai utang pasca-RC — bukan pelanggaran.
- `tokens.css`/`tokens.ts` tak disentuh; `generated.ts` tidak di-hand-edit; tidak ada kode produksi — pembekuan dipatuhi.
- Addendum koreksi FLOW/SCREEN bukan "mengedit berkas bertanda tangan" — justru cara yang benar (RATIF-SHELL-003:72).

## Disposition

| Temuan | Disposition |
|---|---|
| G5-03 (B8 usang) | ✅ Diperbaiki di `JOB-SHELL-001` §5 (Add-08). |
| G5-01, G5-02, G5-04, G5-08 | ✅ **Add-09** (`POST-SIGNATURE-ADDENDUM-2026-11-08.md`): koreksi transkrip FLOW/SCREEN + parent anchor + stage 7; berkas bertanda tangan tidak disunting. |
| G5-06 | ✅ **Add-09:** `DS-SHELL-001` §8 butir 1 diturunkan menjadi **`Likely`**; menjadi `Confirmed` setelah QA B9. |
| G5-07 | ✅ **Add-09:** threshold terukur B1/B12 ditambahkan ke `QA-SHELL-001` §3. |
| G5-05 | ✅ Dikonfirmasi Add-09 — berkas yang dibaca Critic sudah diperbarui; tidak ada tindakan. |
