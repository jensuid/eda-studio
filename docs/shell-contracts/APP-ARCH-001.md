# APP-ARCH-001 — Application Architecture Contract (Application-Level Layer)

**ID:** APP-ARCH-001 · **Status:** DRAFT v0.1 — **belum diratifikasi PO** (2026-11-08)
**Parent:** Doc01 §3, §5, §10.3 · Doc07 §6.1–§6.3 · Doc08 §2, §4.1–§4.2, §19 · `contract_first_ui_v2/docs/03-artifact-templates.md` §1 · [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md)
**Rigor:** Full (application-level layer lintas modul) · **Kondisi:** belum diratifikasi; **0 Pending** — `D-F4`…`D-F8` / `D-S5`/`D-S6`/`D-S8` **diratifikasi PO (17:38:27 WIB, `RATIF-SHELL-004`)**. `D-DS1`…`D-DS5` + `D-S7` **diratifikasi PO (17:15:33 WIB, `RATIF-SHELL-003`)**. **Tidak ada izin kode produksi.**
**Mengikat?** Sebagai kontrak: **tidak**. Yang mengikat hanyalah 7 keputusan di [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) §2 (`SIG-SHELL-2026-11-08-01`).

> **Posisi dokumen ini:** lapisan **application architecture** yang selama ini hilang — akar masalah audit UI/UX 2026-11-08. Tujuh fitur punya kontrak ratified, tetapi tidak pernah ada kontrak yang menyatakan siapa memiliki navigasi, modul, peran, dan batas antar-modul. Dokumen ini mengisi lapisan itu untuk **RC saja**; bukan arsitektur target jangka panjang.

---

## 1. Application Architecture Contract

```yaml
application: "EDA Workbench — Application Shell (MVP RC)"

product_goal: >-
  Satu analis lokal mampu membawa satu dataset dari impor sampai laporan yang dapat dipertanggungjawabkan
  tanpa kehilangan konteks kerja, tanpa mempercayai artefak usang, dan tanpa harus menebak langkah berikutnya
  (JOB-SHELL-001 §1).

platforms: ["desktop"]   # pywebview + React; single-user, offline-first, min window 900px

roles:
  - name: "Persona A — Pemula / Business Analyst"
    goals:
      - "Memahami dataset yang asing dan menemukan masalah kualitas"
      - "Mendapat arahan langkah berikutnya tanpa membaca dokumentasi"
      - "Menghasilkan laporan yang bisa dijelaskan ke pihak bisnis"
    context: "Sesekali, non-teknis, mengharapkan Guided Mode (Doc01 §3.1)"
  - name: "Persona B — Analis Data"
    goals:
      - "Akses langsung ke metode, parameter, dan kontrol eksekusi"
      - "Alur kerja yang dapat direproduksi"
    context: "Sering, teknis, mengharapkan Advanced Mode (Doc01 §3.1)"

shared_state: "Kedua peran berbagi SATU project, SATU engine, SATU domain model, SATU state (UX-001, Doc01 §3.2). Perbedaan = kompleksitas interaksi, BUKAN kapabilitas analitik."

modules:
  - id: "shell"
    purpose: "Frame persisten R1–R7: app bar, navigasi, stepper + next-step CTA, context panel, feedback global, status area"
    primary_tasks: ["orientasi posisi", "navigasi", "preservasi konteks", "monitoring job"]
    owns: ["R1", "R2", "R3", "R5", "R6", "R7"]
  - id: "project"
    purpose: "Pembuatan proyek, import dataset, dan utilitas Tools (backup/restore/export portabel/diagnostic)"
    primary_tasks: ["buat proyek", "impor CSV/XLSX/Parquet", "kelola artefak operasional"]
    route: "setup"
  - id: "dataset"
    purpose: "Preview, histogram kontekstual, Analysis Plan, export"
    primary_tasks: ["inspeksi data", "distribusi univariate"]
    route: "explorer"
  - id: "profiling"
    purpose: "Struktur & profil dataset (Doc08 stage 3)"
    primary_tasks: ["jalankan profiling", "baca profil + status freshness"]
    route: "profiling"
  - id: "quality"
    purpose: "Penilaian kualitas data (Doc08 stage 4)"
    primary_tasks: ["jalankan quality rules", "baca findings"]
    route: "quality"
  - id: "cleaning"
    purpose: "Pembersihan & preparasi (Doc08 stage 5)"
    primary_tasks: ["pratinjau dampak", "konfirmasi destruktif", "aktifkan snapshot baru"]
    route: "cleaning"
  - id: "bivariate"
    purpose: "Analisis hubungan (Doc08 stage 7)"
    primary_tasks: ["pilih pasangan kolom", "baca scatter/ringkasan"]
    route: "bivariate"
  - id: "readiness"
    purpose: "Hipotesis & kesiapan analisis (Doc08 stage 9)"
    primary_tasks: ["baca readiness record", "cek freshness"]
    route: "readiness"
  - id: "report"
    purpose: "Insights & pelaporan (Doc08 stage 10; HTML + PDF)"
    primary_tasks: ["susun report", "unduh PDF/HTML"]
    route: "report"
  - id: "job-center"
    purpose: "Permukaan monitoring persisten untuk seluruh job lintas modul"
    primary_tasks: ["pantau job aktif", "lihat state terminal", "bedakan kosong vs gagal-muat"]
    owns: ["R5b"]
  - id: "platform"
    purpose: "ipcClient, generated types, ProjectContext, routing, token stylesheet"
    primary_tasks: ["proyeksikan state backend", "jaga batas IPC", "pulihkan konteks navigasi"]
    note: "BUKAN modul UI; lapisan infrastruktur yang dipakai semua modul lain"

navigation:
  model: "sidebar"   # rail berlabel + hierarki grup; 900px = rail berlabel + drawer Job Center (D-S3)
  routing: "hash + history stack (D-F2, Ratified); navigate tetap diekspos lewat useRouter"
  hierarchy:         # D-S1, Ratified — 7 grup / 9 item; bunyi sah di RATIF-SHELL-001 §2
    - label: "Workspace"
      route_or_view: "setup — Proyek"
    - label: "Data"
      route_or_view: "explorer — Dataset"
    - label: "Preparation"
      route_or_view: "profiling — Profil; quality — Kualitas; cleaning — Pembersihan"
    - label: "Analysis"
      route_or_view: "bivariate — Hubungan"
    - label: "Discovery"
      route_or_view: "readiness — Kesiapan"
    - label: "Output"
      route_or_view: "report — Laporan"
    - label: "Tools"
      route_or_view: "setup → sub-bagian: Backup, Restore, Export portabel, Diagnostic"
  invariants:
    - "Pembersihan SEBELUM Hubungan (D-S1 menolak urutan lama router.tsx)."
    - "Proyek + dataset aktif tetap terlihat di semua route (Doc07 §6.3)."
    - "Navigasi TIDAK membatalkan job yang sedang berjalan (Doc07 §6.3)."
    - "Fitur yang belum tersedia ditandai 'Belum tersedia' dan tidak dapat diklik (D-F1) — visibility tidak boleh dihapus diam-diam."
    - "Satu-satunya locale shell = Bahasa Indonesia, satu register copy (D-S2)."

shared_patterns:
  - "Next-step CTA tunggal pada stepper — satu aksi primer per layar (DS-CORE-001)."
  - "Freshness artefak: fingerprint SHA-256 vs snapshot aktif → Current | Stale | Failed | Blocked | Refresh Available."
  - "Pemisahan kanal error per concern — BELUM final, menunggu D-F6."
  - "Job Center persisten sebagai satu-satunya permukaan monitoring global."
  - "Toast hanya untuk feedback non-blocking; banner untuk kondisi sistem; inline untuk validasi form."
  - "8 state kontrol (default/hover/focus-visible/pressed/selected/disabled/loading/error) — shell only, menunggu D-DS2."
  - "Aksesibilitas: landmark berlabel, skip link #main-content, :focus-visible, <caption> + scope, alternatif teks chart."
  - "Focus pindah ke #main-content setelah navigasi; aria-current pada item aktif; focus return setelah drawer/dialog."

boundaries:
  - "Shell memiliki R1/R2/R3/R5/R6/R7; modul fitur memiliki R4. Ketentuan shell TIDAK berlaku di dalam R4."
  - "Kontrak fitur ratified (JOB/FLOW/SCREEN/DS per fitur) tetap AUTHORITATIVE untuk region fitur. Benturan wajib dicatat sebagai amandemen PO, bukan ditimpa."
  - "Frontend hanya melalui ipcClient (4 bridge methods); generated.ts DI-GENERATE dari Pydantic, dilarang hand-edit."
  - "Job lifecycle backend-authoritative (SYS-015, Doc05 §8.2): frontend memproyeksikan, tidak transisi lokal, tidak auto-retry, tidak progress determinate."
  - "ProjectContext = proyeksi frontend; bukan source of truth. Persistensi hanya {route, projectId, datasetId} + revalidasi backend (D-F3)."
  - "Default-deny / fail-closed (SEC-004); tidak ada whole-DataFrame JSON lewat IPC (preview ≤ 200, scatter ≤ 1500, bin ≤ 30)."
  - "Satu stylesheet tokens.css; selector fitur dilarang memakai --shell-*, selector shell dilarang memakai --font-size-* (lihat DECISION-CARD-D-DS1, Ratified oleh PO — A 16:01:39 WIB)."
  - "WCAG 2.2 AA dan min window 900px BUKAN deferred (DS-CORE-001)."

open_questions:
  - "D-F4 — Ratified oleh PO — A (Beta/Phase 1, bukan RC)"
  - "D-F5 — Ratified oleh PO — A (ekstensi JobEvent, Pydantic dulu)"
  - "D-F6 — Ratified oleh PO — A (pemisahan kanal error per concern)"
  - "D-F7 — Ratified oleh PO — A (stale lintas-route + CTA refresh, fingerprint)"
  - "D-F8 — Ratified oleh PO — A (Phase 0 dulu; Phase 1 setelah PO + kontrak)"
  - "D-S5 — Ratified oleh PO — A (satu modul copy shell)"
  - "D-S6 — Ratified oleh PO — A (Esc wajib; Cmd+K Phase 2)"
  - "D-S7 — Ratified oleh PO — A (toleransi visual ≤5% + seeded fixtures)"
  - "D-S8 — Ratified oleh PO — A (In Progress ditunda sampai JobEvent.command tersedia)"
  - "D-DS1…D-DS5 — Ratified oleh PO — A (mekanisme G4; tokens.css tetap beku)"
```

---

## 2. Peta modul → region → kontrak

| Region | Nama | Pemilik | Kontrak / keputusan |
|---|---|---|---|
| R1 | App Bar (proyek + dataset/snapshot aktif) | `shell` | [SCREEN-SHELL-001](SCREEN-SHELL-001.md) §3.2; `D-S2` |
| R2 | Primary Navigation | `shell` | `D-S1`, `D-S3`; §3 divergensi |
| R3 | Stepper + next-step CTA | `shell` | `D-F1`; [FLOW-SHELL-001](FLOW-SHELL-001.md) §2.2 |
| R4 | Main Workspace | **modul fitur** | Kontrak fitur ratified — **bukan** dokumen ini |
| R5 | Context Panel (dataset aktif) | `shell` | SCREEN §3.6 |
| R5b | Job Center | `job-center` | `D-S3`; Doc08 §12 |
| R6 | Feedback global (banner/toast/error) | `shell` | `D-F6` Ratified oleh PO — A; FLOW §2.4–2.5 |
| R7 | Versi / update / diagnostik | `shell` | `SCREEN-SHELL-001` §3.8 |

---

## 3. Divergensi terhadap Doc07 §6.2 / Doc08 §4.1 (amandemen terbatas, DIDOKUMENTASIKAN)

Ini bagian yang paling mudah terlewat. Dokumen normatif mengusulkan **8 grup** dengan banyak destinasi; `D-S1` meratifikasi **7 grup / 9 item** untuk shell RC. Selisihnya **tidak boleh dihilangkan diam-diam**.

| Grup Doc07 §6.2 / Doc08 §4.1 | Status di RC | Perlakuan |
|---|---|---|
| Workspace | ✅ Ada (`Proyek`) | Destinasi `Overview`, `Workflow` **tidak tersedia**; dicatat sebagai gap, bukan dihapus |
| Data | ✅ Ada (`Dataset`) | `Datasets`, `Data Explorer`, `Relationships` tidak dipetakan ke route terpisah |
| Preparation | ✅ Ada (`Profil`, `Kualitas`, `Pembersihan`) | `Transformations` ≡ `Pembersihan` di RC |
| Analysis | ✅ Ada (`Hubungan`) | `Univariate` → tab kontekstual di `Dataset`; `Anomaly & Patterns` **tidak ada route** (FLOW §2.2 stage 8) |
| Discovery | ✅ Ada (`Kesiapan`) | `Hypotheses`, `Findings` tidak tersedia |
| Output | ✅ Ada (`Laporan`) | `Visualizations` tidak dipetakan terpisah |
| **Extensions** | ❌ **Tidak ada di RC** | Plugins & AI Settings = Doc01 §10.3 out-of-scope. **Tidak boleh ditampilkan sebagai nav yang bisa diklik** |
| **Settings** | ❌ **Tidak ada di RC** | Application/Project/Preferences tidak tersedia |
| **Tools** | ➕ **Baru (D-S1)** | Backup, Restore, Export portabel, Diagnostic dipisah dari 5 section bertumpuk di `ProjectSetup.tsx` |

**Batas amandemen** (sesuai [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) §4): `D-S1` menyelesaikan *exact navigation labels and ordering* **untuk layer shell saja**. Doc07 §6.2 dan Doc08 §4.1 **tidak diubah** dan tetap menjadi arsitektur target. Mengaktifkan Extensions/Settings di kemudian hari = perubahan kontrak, butuh amandemen PO + Critic, bukan sekadar menambah item nav.

**Dua janji Doc07 §6.3 yang belum terpenuhi:**

| Janji | Kondisi | Catatan |
|---|---|---|
| *"Unsaved user changes trigger a clear confirmation flow"* | **Belum didefinisikan** untuk shell | Skenario utamanya (ganti proyek) justru **BLOCKED** oleh tidak adanya `project.open` (`D-F4` diratifikasi PO — A: Beta/Phase 1). Dilarang mengarang aturan konfirmasi sekarang |
| *"Deep links to datasets, artifacts, and findings"* | **Sebagian** | `D-F2` membuat deep link **tingkat route** mungkin, tetapi deep link **artefak/finding** tidak diratifikasi dan tidak tersedia. Tidak boleh diklaim sudah didukung |

---

## 4. Ketidaksesuaian implementasi saat ini (Confirmed — BUKAN izin perbaikan)

| # | Temuan | Sumber | Keputusan pengunci |
|---|---|---|---|
| A1 | Router state-only: URL tidak berubah, tidak ada Back/Forward, reload kembali ke Setup | `frontend/src/app/router.tsx` | `D-F2` sudah ratified; **jadwal** `D-F8` Ratified oleh PO — A (Phase 0 dulu) |
| A2 | Nav flat 8 `<button>`, urutan Readiness ke-5 / Cleaning ke-7, tidak ada grup | `App.tsx`, `router.tsx:24-33` | `D-S1` sudah ratified; belum boleh diimplementasi |
| A3 | `ProjectContext` in-memory, hilang saat reload/launch | `ProjectContext.tsx` | `D-F3`; butuh revalidasi backend |
| A4 | Satu `protocolError` untuk protocol + recovery + update-check | `App.tsx` | `D-F6` Ratified oleh PO — A (kanal per concern) |
| A5 | Inline recovery banner memakai `role="alertdialog"` tanpa modal/focus trap | `App.tsx` | SCREEN §3.7; pelanggaran semantik |
| A6 | `JobCenter` menampilkan "Belum ada job" untuk kegagalan memuat | `JobCenter.tsx` | FLOW §2.4 — failure ≠ empty |
| A7 | Progress determinate karangan `Running → 70%` | `JobClient.ts:39-60` | `D-F5`, `D-S8` Ratified oleh PO — A; wajib indeterminate |
| A8 | `visual.spec.ts` tidak mengunjungi `readiness`; 7 route × 2 VP = 14 baseline | `visual.spec.ts:13-21` | `D-S7` Ratified oleh PO — A |
| A9 | `helpers.ts` mengembalikan `data:null` → baseline hanya empty state | `helpers.ts:25-38` | `D-S7`; seeded fixtures |
| A10 | Label campur bahasa + bocoran ID dokumen ke UI (`Doc04 §12`, `G6-2`, `Doc15 §10`) | `ProjectSetup.tsx`, `DatasetExplorer.tsx` | `D-S2` ratified, `D-S5` Ratified oleh PO — A |

> **Stop rule:** daftar ini adalah **bukti audit**, bukan daftar tugas. Selama kontrak masih DRAFT dan G5 belum PASS, tidak satu pun boleh diperbaiki di kode produksi (`docs/ux-contracts/README.md` §Core rule).

---

## 5. Exit / prasyarat ratifikasi (belum terpenuhi)

- [ ] PO meratifikasi `APP-ARCH-001` sebagai kontrak.
- [x] `D-F4`…`D-F8`, `D-S5`…`D-S8`, `D-DS1`…`D-DS5` sudah **diratifikasi PO — A (RATIF-SHELL-004 / RATIF-SHELL-003 / RATIF-SHELL-002)**. Kotak tetap belum dicentang karena ratifikasi kontrak belum terjadi.
- [ ] Divergensi §3 disetujui eksplisit sebagai **amandemen terbatas**, atau Doc07/Doc08 diamandemen.
- [ ] [JOB-SHELL-001](JOB-SHELL-001.md), `FLOW-SHELL-001`, `SCREEN-SHELL-001`, `DS-SHELL-001`, `QA-SHELL-001` (DRAFT v0.1, Add-07) konsisten dengan peta modul §2.
- [ ] Tidak ada benturan tanpa amandemen dengan kontrak fitur ratified di R4.
- [ ] Independent Critic (G5) PASS dengan **konteks segar**; temuan berlabel `Confirmed / Likely / Suggestion`.

---

## 6. Traceability

| Sumber | Bagian kontrak ini |
|---|---|
| `03-artifact-templates.md` §1 | §1 struktur YAML |
| Doc01 §3.1–§3.2, §5, §10.3 | §1 `roles`, `modules`; §3 baris Extensions |
| Doc07 §6.1, §6.2, §6.3 | §1 `navigation.model`, peta R1–R7, §3, §4 A1 |
| Doc08 §2, §4.1–§4.2, §19 | §1 `shared_patterns`, §3, batas amandemen |
| `RATIF-SHELL-001` §2 / §4 | §1 `navigation.hierarchy` + `invariants`; §3 |
| `SCREEN-SHELL-001` §3.1–§3.9 | §2 peta region |
| `FLOW-SHELL-001` §2.1–§2.9 | §1 `shared_patterns`, §4 A1/A6/A7 |
| Audit UI/UX 2026-11-08 (`.workbuddy-ai/memory/2026-11-08.md`) | §4 A1–A10 |

---

**Status akhir:** DRAFT v0.1. Dokumen ini **melengkapi prasyarat *draft* application layer**, bukan prasyarat *ratifikasi*. Bersama `JOB-SHELL-001`, ia menutup dua baris "Belum didraft" pada `README.md` — tetapi **tidak** menaikkan status `FLOW-SHELL-001` / `SCREEN-SHELL-001` / `DS-SHELL-001`, tidak membuka G5, dan tidak mengizinkan kode produksi.
