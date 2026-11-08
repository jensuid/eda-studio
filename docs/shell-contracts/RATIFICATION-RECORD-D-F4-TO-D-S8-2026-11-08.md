# RATIF-SHELL-004 — Record Ratifikasi PO atas 8 Keputusan FLOW + SCREEN

**ID record:** `RATIF-SHELL-004`
**Tanggal:** 2026-11-08 · **Waktu:** 17:38:27 WIB (GMT+7)
**Pernyataan PO:** `"Saya ratifikasi semua 8 keputusan tersisa sekaligus dengan opsi A dan reasoning di atas, dengan catatan: D-F5 tetap Pydantic-dulu, D-S8 tetap menunggu JobEvent.command, D-F4 tetap Beta/Phase 1, dan Cmd+K tetap Phase 2"`
**Sifat:** Record ratifikasi eksplisit oleh PO — **terpisah** dari `RATIF-SHELL-001`, `RATIF-SHELL-002`, dan `RATIF-SHELL-003`, **bukan** suntingan ketiganya.
**Status ratifikasi:** **Ratified oleh PO (2026-11-08 17:38:27 WIB)** — **bukan** tanda tangan digital, **bukan** ratifikasi kontrak, **bukan** exit gate, **bukan** izin menyentuh `tokens.css`.

---

## 1. Ruang lingkup

Berkas ini SAH untuk **delapan keputusan** yang sebelumnya berstatus `☐ Pending`:

| ID | Keputusan | Status sebelum | Status sesudah |
|---|---|---|---|
| `D-F4` | `project.open` / recent projects **Beta (Phase 1)**, bukan RC | `☐ Pending` | ✅ **Ratified oleh PO (A)** |
| `D-F5` | Ekstensi `JobEvent` di **Pydantic dulu**; `command`, `progress?`, `started_at?`, `finished_at?` | `☐ Pending` | ✅ **Ratified oleh PO (A)** |
| `D-F6` | Pemisahan kanal error per concern; satu `protocolError` dihapus | `☐ Pending` | ✅ **Ratified oleh PO (A)** |
| `D-F7` | Artefak memeriksa fingerprint; refresh hanya setelah persetujuan pengguna; CTA menyebut dependency | `☐ Pending` | ✅ **Ratified oleh PO (A)** |
| `D-F8` | **Phase 0 dulu** (tanpa IPC), Phase 1 setelah PO + kontrak | `☐ Pending` | ✅ **Ratified oleh PO (A)** |
| `D-S5` | Copy deck §3.5 diterima sebagai **satu modul copy shell**, tanpa menimpa copy fitur ratified | `☐ Pending` | ✅ **Ratified oleh PO (A)** |
| `D-S6` | `Esc` wajib; `Cmd/Ctrl+K` **ditunda ke Phase 2** | `☐ Pending` | ✅ **Ratified oleh PO (A)** |
| `D-S8` | `In Progress` per-stage **ditunda sampai `JobEvent.command` tersedia** (`D-F5`) | `☐ Pending` | ✅ **Ratified oleh PO (A)** |

Berkas ini TIDAK berlaku untuk: ratifikasi kontrak `FLOW-SHELL-001`, `SCREEN-SHELL-001`, `DS-SHELL-001`, `JOB-SHELL-001`, `APP-ARCH-001`; exit gate G1–G6; atau izin implementasi.

---

## 2. Bunyi keputusan yang diratifikasi (autoritatif)

Sumber keputusan: panduan rekomendasi di sesi ini + pernyataan PO di §1. Bila ada beda wording dengan badan kontrak, **record ini yang menang** untuk delapan keputusan di atas.

### D-F8 = A — Urutan Phase 0/1/2

> **Phase 0 dulu** (kanal error, copy, validasi, gate CTA, stale lintas-route untuk Quality/Readiness, progress indeterminate, load-failed, 900px, seeded fixtures — tanpa perubahan IPC). **Phase 1** (stepper + next-step CTA, router hash/history + resume, recent projects, ekstensi `JobEvent`, kontrol unduh/buka artefak) hanya setelah PO + amandemen kontrak. **Phase 2** post-MVP (Guided/Advanced penuh, stage 6/8/10, notification center, scoped invalidation, command palette). Sampai `D-F8` diputus, Phase 0-lah satu-satunya yang boleh direncanakan — **kini sudah diputus & diratifikasi.**

**Ditolak:** B (Phase 1 dulu — menuntut perubahan IPC sebelum jadwal kontrak), C (Phase 0+1 bersamaan — tidak dapat diuji bertahap).
**Bukti (Confirmed):** sekarang hanya ada 4 bridge methods (`ipcClient.ts`); Phase 1 mengunci `D-F2`/`D-F3` yang sudah diratifikasi bentuknya tetapi belum boleh dikerjakan.

### D-F5 = A — Ekstensi `JobEvent`, Pydantic dulu

> Tambah `command`, `progress?`, `started_at?`, `finished_at?` di `backend/contracts.py` (Pydantic), lalu `tools/generate_types.py`. **Tidak** ditanya di frontend dulu; `generated.ts` tidak boleh di-hand-edit. Field opsional kecuali backend benar-benar menyediakannya secara authoritative.

**Ditolak:** B (ekstensi di TS dulu — melanggar aturan single source of truth), C (tidak ada ekstensi — `In Progress` & progres tidak akan pernah jujur).
**Bukti (Confirmed):** `JobEvent` saat ini tidak membawa `command`, `progress`, atau timestamp; lifecycle job backend-authoritative (SYS-015).

### D-S8 = A — `In Progress` per-stage ditunda

> Status `In Progress` per tahap **ditunda** sampai `JobEvent.command` tersedia (`D-F5`). Sementara itu stepper hanya menampilkan status dari sinyal sah (§2.2 `D-F1` ratified); tidak ada persentase, tidak ada status karangan.

**Ditolak:** B (tampilkan `In Progress` sekarang dari state frontend), C (hapus konsep progres sepenuhnya — bukti penerimaan `D-F1` tabel sinyal × status tidak akan lengkap).
**Prasyarat:** `D-F5 = A` diratifikasi bersama record ini; `D-S8` tetap menunggu implementasi kontraknya.

### D-F4 = A — `project.open` / recent projects: Beta (Phase 1)

> `project.open` / daftar proyek terakhir **masuk Beta (Phase 1), bukan RC**. RC hanya memperbaiki alur "buat proyek baru". Saat ini alur "kembali ke proyek yang sudah ada" (`E4`) tetap BLOCKED karena tidak ada `project.open`/`project.list`.

**Ditolak:** B (masuk RC — menambah scope kontrak + definisi alur konfirmasi yang belum ada), C (tidak pernah — user local tidak dapat melanjutkan pekerjaan tertunda).
**Bukti (Confirmed):** `ipcClient` hanya punya `project.create`; alur konfirmasi unsaved changes untuk ganti proyek belum didefinisikan.

### D-F6 = A — Pemisahan kanal error per concern

> Pisahkan per concern sesuai `FLOW-SHELL-001` §2.5: protokol/backend → banner persisten di app bar (critical, tidak bisa di-dismiss); pemulihan crash → banner di main sebelum konten route (warning, "Tutup"); versi/update → region versi saja (info, bisa di-dismiss); job lifecycle → Job Center (satu-satunya rekam jejak); aksi fitur → toast non-blocking + inline `role="alert"`; render crash → ErrorBoundary per-route ("Coba lagi" / "Kembali ke Setup"). Satu `protocolError` dihapus. Error copy di-branch berdasarkan `error.code`, bukan `error.message` mentah.

**Ditolak:** B (satu kanal global — cacat yang sudah dikonfirmasi), C (toast tunggal saja — peristiwa penting tidak punya rekam jejak).
**Bukti (Confirmed):** `App.tsx:59` memakai `protocolError` untuk handshake, recovery, dan update check sekaligus.

### D-F7 = A — Stale lintas-route + CTA refresh

> Semua artefak memeriksa fingerprint; refresh **hanya setelah persetujuan pengguna**; CTA menyebut dependency yang berubah (mis. "Perlu diperbarui: {dependency} berubah sejak hasil ini dibuat."). Artefak stale tidak boleh dilabeli `Completed`/`Current`.

**Ditolak:** B (refresh otomatis diam-diam — menghapus konteks kerja), C (tidak ada mekanisme stale — artefak usang tampak valid).
**Bukti (Confirmed):** snapshot immutable & fingerprint SHA-256 adalah sumber kebenaran status artefak; status lintas-route saat ini state lokal per komponen.

### D-S5 = A — Copy deck lintas-route

> Copy deck `SCREEN-SHELL-001` §3.5 diterima sebagai **satu modul copy shell** (satu register Bahasa Indonesia, sesuai `D-S2` ratified) — termasuk ganti "Buat Project" → "Buat proyek", "Assessing…" → "Sedang diproses…", bedakan empty vs load-error (job), dan aturan tidak ada ID dokumen/hash sebagai kalimat utama. Copy fitur yang sudah ratified (mis. `SCREEN-CLEAN-001` §Copy literal) **tidak boleh ditimpa**.

**Ditolak:** B (copy per fitur terpisah tanpa deck — kembali ke campuran bahasa), C (deck menimpa copy fitur — melanggar kontrak fitur ratified).
**Bukti (Confirmed):** `ProjectSetup.tsx`/`DatasetExplorer.tsx` masih campuran bahasa + bocoran ID dokumen ke UI.

### D-S6 = A — Shortcut global

> `Esc` **wajib** (tutup drawer/dialog; fokus kembali ke origin). `Cmd/Ctrl+K` command palette **ditunda ke Phase 2** — jangan ditambahkan diam-diam; tidak ada shortcut yang menimpa konvensi OS; semua shortcut harus terdiscoverable.

**Ditolak:** B (command palette sekarang — fitur baru, bukan pembetulan), C (tanpa `Esc` — melanggar standar interaksi modal/drawer).
**Bukti (Confirmed):** drawer 900px dan dialog memerlukan jalur keluar keyboard yang deterministik.

---

## 3. Yang TIDAK diratifikasi oleh record ini

- Kontrak `FLOW-SHELL-001` tetap **DRAFT v0.2**, **bertanda tangan** — lima keputusan `D-F4`…`D-F8` di badan teksnya tetap `☐ Pending`; koreksi via addendum (Add-06).
- Kontrak `SCREEN-SHELL-001` tetap **DRAFT v0.2**, **bertanda tangan** — `D-S5`/`D-S6`/`D-S8` di badan teksnya tetap `☐ Pending`; koreksi via addendum (Add-06).
- Kontrak `DS-SHELL-001` tetap **DRAFT v0.4** (sekarang semua keputusannya `Ratified oleh PO`). Ratifikasi keputusan ≠ ratifikasi kontrak.
- G1/G2/G3/G4/G5/G6: **tidak ada gate yang exit**.
- `tokens.css` / `tokens.ts` tetap **beku** — butuh ratifikasi kontrak + G4 exit + Independent Critic (G5) PASS.
- `docs/status-register.md` tetap tidak ditambah baris.
- Tidak ada kode produksi yang diizinkan.

---

## 4. Perubahan status oleh record ini

| ID | Status sebelum (2026-11-08 pagi) | Status sesudah (record ini, 17:38:27 WIB) |
|---|---|---|
| `D-F4` | `☐ Pending` | ✅ **`Ratified oleh PO (A, 2026-11-08 17:38:27 WIB, RATIF-SHELL-004)`** |
| `D-F5` | `☐ Pending` | ✅ **`Ratified oleh PO (A, 2026-11-08 17:38:27 WIB, RATIF-SHELL-004)`** |
| `D-F6` | `☐ Pending` | ✅ **`Ratified oleh PO (A, 2026-11-08 17:38:27 WIB, RATIF-SHELL-004)`** |
| `D-F7` | `☐ Pending` | ✅ **`Ratified oleh PO (A, 2026-11-08 17:38:27 WIB, RATIF-SHELL-004)`** |
| `D-F8` | `☐ Pending` | ✅ **`Ratified oleh PO (A, 2026-11-08 17:38:27 WIB, RATIF-SHELL-004)`** |
| `D-S5` | `☐ Pending` | ✅ **`Ratified oleh PO (A, 2026-11-08 17:38:27 WIB, RATIF-SHELL-004)`** |
| `D-S6` | `☐ Pending` | ✅ **`Ratified oleh PO (A, 2026-11-08 17:38:27 WIB, RATIF-SHELL-004)`** |
| `D-S8` | `☐ Pending` | ✅ **`Ratified oleh PO (A, 2026-11-08 17:38:27 WIB, RATIF-SHELL-004)`** |

**Total keputusan ratified:** 7 (RATIF-SHELL-001) + 1 (RATIF-SHELL-002) + 5 (RATIF-SHELL-003) + 8 (record ini) = **21 ratified**. **Tersisa 0 Pending** — semua keputusan shell di paket ini sudah diratifikasi; yang belum terjadi adalah ratifikasi kontrak & exit gate.

---

## 5. Rantai bukti

| Langkah | Waktu | Bukti |
|---|---|---|
| Panduan rekomendasi + reasoning 8 keputusan disajikan | sesi ini | jawaban assistant dengan tabel bundle 1–2 |
| PO menjawab ratifikasi semua 8 sekaligus opsi A + 4 catatan | 17:38:27 WIB | Record ini (§1, §2) |
| Manifest v4 dibuat | 17:38 WIB | `SIGNATURE-MANIFEST-RATIF-SHELL-004-2026-11-08.sha256` |
| Verifikasi manifest v1, v2, v3, v4 | 17:38 WIB | `shasum -a 256 -c` — masing-masing OK |

---

## 6. Integritas

| Manifest | Berkas | Hash | Status |
|---|---|---|---|
| v1 `SIGNATURE-MANIFEST-2026-11-08.sha256` | 5 berkas bertanda tangan | tetap | **5/5 OK** (tidak berubah) |
| v2 `SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256` | 2 berkas (record + kartu D-DS1) | tetap | **2/2 OK** (tidak berubah) |
| v3 `SIGNATURE-MANIFEST-RATIF-SHELL-003-2026-11-08.sha256` | 1 berkas (record) | tetap | **1/1 OK** (tidak berubah) |
| v4 `SIGNATURE-MANIFEST-RATIF-SHELL-004-2026-11-08.sha256` | 1 berkas (record ini) | baru | **1/1 OK** (baru) |

Verifikasi:

```bash
cd docs/shell-contracts
shasum -a 256 -c SIGNATURE-MANIFEST-2026-11-08.sha256                              # expect: 5/5 OK
shasum -a 256 -c SIGNATURE-MANIFEST-RATIF-SHELL-002-2026-11-08.sha256              # expect: 2/2 OK
shasum -a 256 -c SIGNATURE-MANIFEST-RATIF-SHELL-003-2026-11-08.sha256              # expect: 1/1 OK
shasum -a 256 -c SIGNATURE-MANIFEST-RATIF-SHELL-004-2026-11-08.sha256              # expect: 1/1 OK
```

Manifest v1–v3 **tidak ditimpa**. Setiap manifest dengan nama berbeda, konsisten dengan preseden Add-03/Add-05.

---

## 7. Batas kejujuran

1. **Ratifikasi ini terjadi di sesi yang sama dengan penyajian panduan**, menyimpang dari rekomendasi sesi segar di `HANDOFF-FRESH-SESSION.md` §1. **Ratifikasi tetap sah** — otoritas PO tidak bergantung pada rekomendasi proses.
2. **Argumen penentang A** disajikan di panduan (scope RC, risk IPC, discoverability command palette) dan di `SESSION-GUIDE-D-DS2-TO-D-S7.md` untuk 5 keputusan sebelumnya.
3. **Tanda tangan digital? Tidak.** Ratifikasi sah lewat pernyataan PO eksplisit. Bila PO menginginkan tanda tangan digital, itu tindakan terpisah dengan Signature ID baru.
4. **`FLOW-SHELL-001.md` & `SCREEN-SHELL-001.md` tetap `☐ Pending` di badan teks** — berkas bertanda tangan (v1), tidak disunting. Status aktual kedelapan keputusan: `Ratified oleh PO (17:38:27 WIB)` lewat record ini. Koreksi via addendum (Add-06).
5. **`tokens.css` tetap beku.** Semua 21 keputusan shell ratified, tetapi kontrak belum diratifikasi dan tidak ada gate yang exit.

---

## 8. Aturan pembatalan

Record ini dapat dibatalkan hanya oleh:
1. Pernyataan eksplisit PO yang menarik kembali ratifikasi.
2. Temuan Critic (G5) bahwa transkrip keputusan ke kontrak tidak setia pada bunyi opsi A — dalam hal ini, keputusan tetap sah tetapi transkrip harus diperbaiki.
3. Konflik dengan kontrak fitur ratified yang belum teridentifikasi — diselesaikan via amandemen PO, bukan pembatalan otomatis.

---

## 9. Versi

**Versi 1.0** — dibuat 2026-11-08 17:38:27 WIB. Record ini bersifat tetap; perubahan hanya melalui amandemen PO eksplisit.
