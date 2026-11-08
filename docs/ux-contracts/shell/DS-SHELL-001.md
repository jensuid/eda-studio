# DS-SHELL-001 — Design System & Component Contract (Application Shell, G4)

**ID:** DS-SHELL-001 · **Status:** **v1.0 Ratified oleh PO (2026-11-08, `RATIF-SHELL-005`)** — re-issue dengan koreksi Add-09 terinkorporasi; G5 **PASS**. `D-DS1` **Ratified oleh PO (A, 16:01:39 WIB, `RATIF-SHELL-002`)**, `D-DS2`…`D-DS5` + `D-S7` **Ratified oleh PO — A (17:15:33 WIB, `RATIF-SHELL-003`)**, `D-F4`…`D-F8` + `D-S5`/`D-S6`/`D-S8` **Ratified oleh PO — A (17:38:27 WIB, `RATIF-SHELL-004`)** — ditranskrip ke §2.4 / §2.5 / §8 / §9 / §11 (2026-11-08)
**Parent:** `DS-CORE-001` (amandemen terbatas) · `SCREEN-SHELL-001` · `FLOW-SHELL-001` · `RATIF-SHELL-001` keputusan `D-S4` · `RATIF-SHELL-002` keputusan `D-DS1` · `RATIF-SHELL-003` keputusan `D-DS2`…`D-DS5`, `D-S7` · `RATIF-SHELL-004` keputusan `D-F4`…`D-F8`, `D-S5`, `D-S6`, `D-S8` · [DECISION-CARD-D-DS1.md](DECISION-CARD-D-DS1.md) §8
**Rigor:** Full (application-level layer, G4) · **Kondisi:** G4 Considered complete; `D-DS1`…`D-DS5` + `D-S7` + `D-F4`…`D-F8` + `D-S5`/`D-S6`/`D-S8` = A sudah **diratifikasi PO** (21 keputusan ratified, 0 Pending). **G5 PASS oleh PO (`RATIF-SHELL-005`, Opsi A).** `tokens.css` tetap beku sampai G6 (B9/B10); izin kode terbatas **Phase 0 frontend-only** (`D-F8`).
**Mengikat?** Sebagai kontrak: **ya** — 21 keputusan di RATIF-SHELL-001…005 (`SIG-SHELL-2026-11-08-01` hanya untuk 7 keputusan pertama; sisanya lewat record RATIF-SHELL-002…005). **Keputusan `D-DS1` membuka penyusunan kontrak, bukan implementasi.**
**Lokasi:** `docs/ux-contracts/shell/` (kanonis ratified). Arsip DRAFT bertanda tangan: `docs/shell-contracts/` (manifest v1 5/5 OK).

---

## 0. Ruang lingkup amandemen

| `D-S4` meratifikasi | `D-S4` TIDAK meratifikasi |
|---|---|
| Skala tipografi **24 / 18 / 15 / 14 / 12 px**, line-height ≥ 1.4 | Warna, kontras AA, dan **min window 900px** `DS-CORE-001` — **tidak berubah** |
| 8 state kontrol dasar `button` / `input` / `select` | Nilai radius, spacing, durasi motion — tetap `DS-CORE-001` / `tokens.css` |
| Kartu berborder + surface-raised, tabel `<caption>` + `th scope`, alternatif teks chart, badge berteks | Copy literal (`D-S5` Ratified oleh PO — A, 17:38:27 WIB, `RATIF-SHELL-004`), layout per layar (masih Deferred), rincian Job Center (masih Deferred) |
| **Prinsip** bahwa hierarki & state fokus menyentuh WCAG 2.2 AA | Mekanisme penulisan token ke `tokens.css` — kini diratifikasi `D-DS1 = A`, lihat **§2.4** |

**Amandemen terhadap Doc08 §19 / `BASELINE-FREEZE-v1.0.md`:** *detailed design tokens and visual theme* dinyatakan **resolved sebagian**, hanya untuk skala tipografi dan state kontrol **layer shell**. Rincian ada di [RATIF-SHELL-001](RATIFICATION-RECORD-2026-11-08.md) §4. Baris lain yang tidak disebut tidak naik status.

**Batas keras:** delapan state wajib dapat diekspresikan **tanpa token warna baru**, hanya memakai token yang sudah ada di `frontend/src/shared/tokens.css:16-29` ditambah `outline`, `border-style`, `font-weight`, dan `opacity`. Menambah `--color-*` baru adalah amandemen terpisah di luar `D-S4`.

---

## 1. System & prinsip

```yaml
system: "EDA Workbench — Shell Design System (amandemen terbatas DS-CORE-001)"
tokens_source: "frontend/src/shared/tokens.css"   # satu-satunya stylesheet; numeric mirror di tokens.ts untuk ECharts
scope: "R1–R7 shell; region fitur tetap tunduk pada DS per fitur yang sudah ratified"
```

1. **Semantic, bukan literal.** Komponen memakai `var(--*)` atau kelas bersama; tidak ada hex/spacing liar di TSX (DS-CORE-001 §Enforcement, `tokens.css:1-6`).
2. **States before polish.** Delapan state kontrol adalah kontrak, bukan hiasan; `default`-nya saja tidak cukup.
3. **Satu aksi primer per layar** (DS-CORE-001) — CTA "Lanjut: …" di R3.
4. **Tidak hanya warna.** Setiap status/badge wajib punya teks; fokus wajib terlihat; pesan error wajib punya teks, bukan sekadar border merah.
5. **AA bukan deferred.** Kontras teks ≥ 4.5:1, target kontrol ≥ 36px, `:focus-visible` 2px, `prefers-reduced-motion`.
6. **Amandemen tidak menyentuh fitur.** Bila token shell bertabrakan dengan kontrak fitur ratified, **kontrak fitur menang** untuk region fitur dan konfliknya dicatat sebagai amandemen.
7. **Prototipe bukan referensi.** `prototypes/shell-v0/` (DISPOSABLE) memvisualisasikan skala 24/18/15/14/12, tetapi **bukan** sumber nilai implementasi.

---

## 2. Tipografi — `[RATIFIED] D-S4`

### 2.1 Skala final

| Tingkat | Ukuran | Peran pada shell | Contoh region |
|---|---|---|---|
| `display` | **24 px** | satu judul utama per layar, bila ada | judul workspace R4 (bukan app bar) |
| `title` | **18 px** | judul panel / section | "Alur analisis" R3, "Job Center" R5b |
| `subtitle` | **15 px** | sub-judul, nama proyek/dataset | R1 app bar, judul kartu R5a |
| `body` | **14 px** | teks isi, label kontrol, item nav | R2, R4, R5b, R7 |
| `caption` | **12 px** | meta, fingerprint pendek, satuan, helper text | R5a, R7, caption tabel, `disabled_reason` |

- **Line-height ≥ 1.4** untuk semua tingkat (DS-CORE-001, dan diratifikasi `D-S4`).
- **Family:** satu family sistem — `system-ui, -apple-system, "Segoe UI", sans-serif` (`tokens.css:65`). **Tidak diubah.**
- **Weight & line-height per-tingkat — `[RATIFIED] D-DS3 = A` (17:15:33 WIB, `RATIF-SHELL-003`):** `title` weight 600, sisanya 400; line-height 1.4 untuk `display`/`title`, 1.5 untuk `subtitle`/`body`/`caption`. Penambahan weight & line-height bersifat **aditif** (`--shell-font-weight-*`, `--shell-line-height-*`), sama seperti `D-DS1`. **Radius TIDAK diubah** — ketidaksesuaian `--radius-sm: 4px` vs `DS-CORE-001` 6px dicatat sebagai utang, menunggu amandemen `DS-CORE-001` terpisah. Yang mengikat baru ukurannya, batas bawah line-height, dan nilai weight/line-height per tingkat (sejak 17:15:33 WIB).
- **Yang ditolak:** skala `11 / 13 / 15 px` (`tokens.css:43-46`) yang membuat `h1` = 15 px dan tidak punya hierarki.

### 2.2 Kondisi aktual & temuan konsistensi (bukti, bukan usulan perbaikan diam-diam)

| Temuan | Bukti | Label | Perlakuan di kontrak ini |
|---|---|---|---|
| Skala saat ini hanya 3 tingkat: `--font-size-sm:11px`, `--font-size-md:13px`, `--font-size-lg:15px` | `frontend/src/shared/tokens.css:43-46` | **Confirmed** | Perlu 5 tingkat; mekanisme = **`D-DS1 = A` (aditif, §2.4) — Ratified oleh PO** — token lama **dibiarkan**, bukan di-remap |
| `body` memakai `--font-size-md` = 13px | `tokens.css:66` | **Confirmed** | Menjadi 14px sesuai skala ratified |
| `button` hanya punya `transition: opacity`, tanpa hover/disabled/loading/error | `tokens.css:101-103` | **Confirmed** | §3 mendefinisikan 8 state |
| `:focus-visible` memakai `--color-chart-scatter-point` (token chart) untuk outline | `tokens.css:92-95` | **Confirmed** | **Tidak diubah** di sini (warna di luar amandemen); dicatat sebagai utang semantik |
| `DS-CORE-001` menyebut radius kontrol 6px / panel 8px; `tokens.css` punya `--radius-sm:4px`, `--radius-md:8px` | `DS-CORE-001:16` vs `tokens.css:40-41` | **Confirmed** | Tidak diselaraskan diam-diam; **`D-DS3 = A` (Ratified 17:15:33 WIB) menunda radius** — tetap utang, menunggu amandemen `DS-CORE-001` terpisah |
| `DS-CORE-001` menyebut spacing 4/8/16/24 dan token `status-info` + `accent`; `tokens.css` punya 4/8/12/16/24/32 dan **tidak** punya `--color-accent` / `--color-status-info` | `DS-CORE-001:9,11` vs `tokens.css:22-37` | **Confirmed** | **Dilarang** menambah token warna baru dalam amandemen `D-S4`; dicatat sebagai gap, bukan diperbaiki |
| Mockup disposable memakai `--fs-display:24px … --fs-cap:12px` | `prototypes/shell-v0/index.html` | **Likely** | Bukti bahwa skala tervisualisasi; **bukan** bukti PASS, bukan referensi kode |

### 2.3 Aturan pemakaian

- `display` maksimal **satu** per layar; app bar R1 tidak boleh memakai `display` (mengganggu kepadatan 900px).
- `caption` tidak boleh dipakai untuk aksi atau label kontrol yang dapat diklik — target minimum 36px dan keterbacaan mengikat.
- Tidak ada ukuran di luar 5 tingkat tanpa amandemen. Tidak ada `font-size` literal di TSX.
- Ellipsis + `title`/tooltip untuk nama panjang di R1/R5a, bukan penurunan ukuran font (SCREEN-SHELL-001 §3.3).

### 2.4 Mekanisme penulisan token — `[RATIFIED] D-DS1 = A` (2026-11-08 16:01:39 WIB, `RATIF-SHELL-002`)

**Sumber:** [DECISION-CARD-D-DS1.md](DECISION-CARD-D-DS1.md) §8 + [RATIF-SHELL-002](RATIFICATION-RECORD-D-DS1-2026-11-08.md) §2. Status **`Ratified oleh PO (2026-11-08 16:01:39 WIB)`**, sebelumnya `Diputus PO (15:34:53 WIB)`. **Bukan** tanda tangan digital.

Lima nilai skala ditulis sebagai **token baru berkategori shell**, bukan remap token global:

```css
/* TAMBAHAN SAJA — nilai lama tidak diubah. BELUM BOLEH DITERAPKAN (lihat batas di bawah). */
--shell-font-display: 24px;
--shell-font-title: 18px;
--shell-font-subtitle: 15px;
--shell-font-body: 14px;
--shell-font-caption: 12px;
```

| Aturan | Isi |
|---|---|
| Token lama | `--font-size-sm: 11px`, `--font-size-md: 13px`, `--font-size-lg: 15px` **dibiarkan apa adanya**, termasuk 16 deklarasi selector global di `tokens.css` yang memakainya |
| Pemakai | **Hanya selector milik shell R1–R7.** Selector fitur dilarang memakai `--shell-font-*` |
| `tokens.ts` | **Tidak diubah** oleh keputusan ini. Mirror numerik untuk canvas ECharts hanya disentuh bila kelak ada elemen canvas milik shell (saat ini tidak ada) |
| Warna / radius / spacing | Tidak tersentuh; tetap di luar amandemen `D-S4` (§0) |

**Tiga pengaman yang mengikat (bagian dari bunyi opsi A, bukan tambahan opsional):**

1. **Lint kepemilikan.** Selector fitur dilarang memakai `--shell-font-*`; selector shell dilarang memakai `--font-size-*`. Pelanggaran = temuan Critic, bukan perbaikan diam-diam.
2. **Diff aditif murni.** `git diff frontend/src/shared/tokens.css` kelak **hanya boleh menambah baris** — nol baris nilai lama yang diubah atau dihapus. Diverifikasi sebelum merge.
3. **Utang konvergensi dicatat.** Dua skala akan hidup berdampingan (`body` shell 14px vs fitur 13px; `caption` 12px vs 11px). Konsekuensi ini **bukan** cacat yang boleh diabaikan: ia dibuka sebagai keputusan resmi **`D-DS5`** — sekarang **Ratified oleh PO = A (17:15:33 WIB, `RATIF-SHELL-003`)**: konvergensi ditunda ke pasca-RC.

**Batas implementasi — dibaca ulang:** keputusan ini **tidak** mengizinkan satu pun baris ditulis ke `tokens.css` / `tokens.ts` sekarang. Prasyarat berurutan: ~~`D-DS2`…`D-DS5` diputus~~ ✅ **Ratified oleh PO (17:15:33 WIB, `RATIF-SHELL-003`)** → ~~`D-S7`~~ ✅ **Ratified oleh PO (17:15:33 WIB, `RATIF-SHELL-003`)** → `DS-SHELL-001` diratifikasi PO → G4 exit → **Independent Critic (G5) PASS dengan konteks segar**.

**Kejujuran baseline:** A **tidak** membuat 14 baseline tetap hijau. App bar, nav rail, dan stepper muncul di setiap screenshot; regenerasi baseline tetap wajib dan menunggu `D-DS4` + `D-S7`. Yang berubah hanyalah diff-nya menjadi sempit dan dapat diatribusi ke shell.


### 2.5 Weight & line-height per tingkat — `[RATIFIED] D-DS3 = A` (17:15:33 WIB, `RATIF-SHELL-003`)

**Sumber:** [SESSION-GUIDE-D-DS2-TO-D-S7.md](SESSION-GUIDE-D-DS2-TO-D-S7.md) §3 + bukti `tokens.css:84,108,113,118,318` (hanya `700` dan `600`, tidak ada per-level weight system), `tokens.css:245` (`line-height: 1.5` hanya sekali). Status **`Ratified oleh PO (2026-11-08 17:15:33 WIB, RATIF-SHELL-003)`**.

Enam nilai weight & line-height ditulis sebagai **token baru berkategori shell**, aditif seperti `D-DS1`:

```css
/* TAMBAHAN SAJA — BELUM BOLEH DITERAPKAN sampai G4 exit + G5 PASS. */
--shell-font-weight-display: 400;
--shell-font-weight-title: 600;
--shell-font-weight-subtitle: 400;
--shell-font-weight-body: 400;
--shell-font-weight-caption: 400;
--shell-line-height-display: 1.4;
--shell-line-height-title: 1.4;
--shell-line-height-subtitle: 1.5;
--shell-line-height-body: 1.5;
--shell-line-height-caption: 1.5;
```

| Aturan | Isi |
|---|---|
| Token lama | Tidak ada token weight/line-height lama yang diubah — `tokens.css` tidak punya `--font-weight-*` atau `--line-height-*` global |
| Radius | **TIDAK diubah.** `--radius-sm: 4px` tetap. Ketidaksesuaian dengan `DS-CORE-001` (6px) dicatat sebagai utang amandemen `DS-CORE-001` terpisah |
| Pemakai | Hanya selector shell R1–R7 |
| Bukti | `tokens.css`: `font-weight: 700` (4 deklarasi), `font-weight: 600` (1 deklarasi), `line-height: 1.5` (1 deklarasi di baris 245) — **Confirmed** |

**Yang ditolak:** B (weight + line-height + radius diselaraskan sekaligus — menyentuh `DS-CORE-001` dan 7 kontrak fitur), C (tunda semua sampai Critic).

---

## 3. State kontrol — `[RATIFIED] D-S4` (8 state)

Berlaku untuk **`button`, `input`, `select`** di layer shell. Setiap state wajib punya **perlakuan visual + semantik yang dapat dibaca**, bukan hanya perubahan warna.

| # | State | Pemicu | Perlakuan visual (tanpa token warna baru) | Semantik / ARIA | A11y |
|---|---|---|---|---|---|
| 1 | `default` | render awal | border 1px `--color-border-subtle`, radius, tinggi 36px, teks `--color-text` | — | kontras ≥ 4.5:1 |
| 2 | `hover` | pointer di atas kontrol, kontrolEnabled | `border` ditebalkan / `background: --color-surface-raised`; transisi ≤ `--duration-fast` | — | tidak boleh satu-satunya penanda status |
| 3 | `focus-visible` | keyboard Tab / focus programatik | `:focus-visible` 2px + `outline-offset: 2px` (perilaku `tokens.css:92-95` dipertahankan) | fokus tidak berpindah tanpa sebab | **wajib**, tidak boleh `outline:none` |
| 4 | `pressed` | pointer/Enter sedang ditekan | `transform`/`opacity` sesaat, kembali pada release | `aria-pressed` hanya untuk toggle | reduced-motion → tanpa animasi |
| 5 | `selected` | item nav aktif, tab, opsi radio | `font-weight` ditebalkan + border/indikator bentuk (bukan hanya warna) | `aria-current="page"` pada nav; `aria-checked` pada radio | status terbaca screen reader |
| 6 | `disabled` | prasyarat belum terpenuhi | visual jelas berbeda + kursor `not-allowed`; **bukan** sekadar opacity | `disabled` + `aria-disabled` bila perlu; **`disabled_reason` wajib terbaca** | alasan tidak boleh hilang; sediakan CTA jalan keluar (FLOW §2.4 `gate-blocked`) |
| 7 | `loading` | mutation / query pending | label berubah + indikator **indeterminate** berteks, kontrol dicegah submit ganda | `aria-busy="true"`, `role="status"` | tidak ada persentase buatan (SYS-015) |
| 8 | `error` | validasi gagal / kegagalan aksi | border berbeda **+ teks pesan inline** | `aria-invalid="true"`, `aria-describedby` ke pesan, `role="alert"` bila perlu | input valid dipertahankan setelah kegagalan yang bisa dipulihkan |

**Catatan per kontrol:**

| Kontrol | Tambahan wajib |
|---|---|
| `button` | `disabled_reason` dapat dibaca; `loading` mengunci klik tanpa menghilangkan label; tidak ada dua tombol primer bersaing |
| `input` | `error` wajib inline + `aria-describedby`; `required: true` tanpa `formState.errors` (`ProjectSetup.tsx:110,143`) adalah **defek**, bukan desain |
| `select` | `selected` wajib terbaca sebagai teks; opsi yang tidak tersedia tidak dihapus diam-diam (Doc07 §6.2:248) |

**Yang dilarang:** progress determinate buatan, status job dari klik cancel, `error.message` mentah, badge warna tanpa teks, kontrol < 36px, dan `outline:none` tanpa pengganti.

---

## 4. Inventaris komponen shell (R1–R7)

| Komponen | Region | Varian | Do | Don't |
|---|---|---|---|---|
| App bar | R1 | `default`, `degraded`, `loading`, `error` | nama proyek/dataset + fingerprint pendek + badge teks | menaruh judul `display` atau ID dokumen internal |
| Nav item | R2 | 8 state + `blocked` + `restricted` | `<a href="#…">`, `aria-current`, label utuh di 900px | `<button>` tanpa href; label di-`display:none`; item tergate dihapus tanpa alasan |
| Stepper stage | R3 | `not-started`, `ready`, `needs-attention`, `completed`, `blocked`, `unavailable` | status hanya dari sinyal sah; badge freshness berteks | `In Progress` per-stage, persentase, status karangan (D-F1 / D-S8) |
| CTA primer "Lanjut: …" | R3 | 8 state | **satu** per layar; selalu punya tujuan | dua tombol primer; `<button disabled>` tanpa CTA alternatif |
| Dataset card | R5a | `loading`, `empty`, `partial`, `stale`, `error`, `done` | border + `--color-surface-raised`, fingerprint 12 char | hash/byte count sebagai headline sukses |
| Job item | R5b | `running`, `terminal`, `failed`, `unavailable` | identitas stabil, progress indeterminate berlabel | Cancel/Retry palsu; "Belum ada job." saat `getEvents` gagal |
| Banner | R6 | `critical`, `warning`, `info`, `dismissed` | saluran per concern (FLOW §2.5); teks + alasan | `role="alertdialog"` pada banner non-modal; copy generik dari `error.message` |
| Toast | R6 | `success`, `error`, `action` | non-blocking, dedup by correlation id | dijadikan satu-satunya rekam jejak peristiwa penting |
| Drawer toggle | R1 (900px) | `collapsed`, `expanded` | `aria-expanded`, accessible name, badge jumlah job, `Esc` + focus return | toggle tak terlihat; `display:none` pada region berstatus |
| Version panel | R7 | `loading`, `error`, `done` | pesan error **hanya** di R7 | meneruskan kegagalan update check ke banner protokol |
| Badge status | semua | `success`, `warning`, `danger`, `info`, `stale` | selalu teks + warna | warna saja; makna hanya dari ikon |

---

## 5. Kartu, tabel, chart, dan alternatif teks

- **Kartu/panel:** `1px solid var(--color-border-subtle)` + `background: var(--color-surface-raised)`, radius `--radius-md`, padding `--space-4`; shadow minimal (DS-CORE-001 §Elevation).
- **Tabel:** wajib `<caption>` dan `<th scope="col">` pada **semua** tabel shell maupun fitur; wrapper `.table-scroll` untuk lebar berlebih; sel kosong bermakna, bukan blank; state loading/empty/error tersedia.
- **Chart:** judul, satuan, sumbu, legenda, empty/loading state, **ringkasan aksesibel berupa teks** (memakai `<details>` yang sudah ada); tooltip hover bukan satu-satunya sumber informasi; pembeda non-warna.
- **Badge:** teks selalu ada; kontras mengikuti `tokens.css:8-12`; status tidak boleh hanya dari warna.
- **Progress:** indeterminate + label "Sedang diproses…"; tidak ada angka sampai `JobEvent.progress` tersedia (`D-F5` Ratified (A, 17:38:27 WIB, `RATIF-SHELL-004`); nilai tetap tidak ada sampai kontrak backend diimplementasikan).

---

## 6. Responsif 900 / 1440

| Viewport | Tipografi | Kontrol | Larangan |
|---|---|---|---|
| **900px (minimum kontraktual)** | `display` diturunkan ke `title` bila perlu; `caption` tetap 12px, tidak lebih kecil | target ≥ 36px; rail berlabel ~176px; R5/R7 ke drawer | `display:none` pada region berstatus/aksi; rail ikon buta; scroll horizontal |
| 1200px | skala penuh | R5/R7 kembali ke kolom 240px | — |
| ≥1440px | skala penuh | grid `210px / 1fr / 240px` dipertahankan (SCREEN §3.2) | mengubah grid hanya untuk alasan estetika |

Mengikat lewat **`[RATIFIED] D-S3`**; bukti penerimaan (uji aksesibilitas 900px) **belum ada**. `prefers-reduced-motion` menonaktifkan transisi di semua viewport (`tokens.css:52-60`).

---

## 7. Aksesibilitas (WCAG 2.2 AA — bukan deferred)

| Aturan | Nilai / perilaku | Sumber |
|---|---|---|
| Kontras teks | ≥ 4.5:1; `--color-text` ≥ 16:1, `--color-text-muted` ≥ 7:1 | `tokens.css:8-12`, DS-CORE-001 |
| Fokus | `:focus-visible` 2px + offset 2px; kembali ke origin setelah drawer/dialog tutup | `tokens.css:92-95`, SCREEN §3.7 |
| Target | tinggi kontrol 36px | DS-CORE-001 |
| Landmark | `<header>/<nav>/<main>/<aside>` berlabel; skip link `#main-content` | SCREEN §3.7 |
| Status | tidak hanya warna; `aria-live="polite"`, critical `role="alert"` | SCREEN §3.7 |
| Motion | transisi ≤ 150ms; `prefers-reduced-motion` → 0 | `tokens.css:49,52-60` |
| Dialog | `role="alertdialog"` **hanya** untuk modal sungguhan dengan `aria-modal` + focus trap | SCREEN §3.7 |

---

## 8. Enforcement

1. **Satu stylesheet.** Semua nilai visual DOM di `frontend/src/shared/tokens.css`; tidak ada hex liar / `style=` inline di TSX (`status-register.md` P2-1: klaim "hex liar = 0" — label **`Likely`** per G5-06: output lint belum dilampirkan; menjadi `Confirmed` setelah QA B9 dieksekusi).
2. **Mirror numerik — dibatasi `D-DS1 = A` (Ratified).** ECharts canvas tidak bisa konsumsi `var()` → nilai numerik dimirror di `frontend/src/shared/tokens.ts` lewat `cssVar()` (P2-1). Namun **mekanisme aditif tidak menambah elemen canvas milik shell**, jadi `tokens.ts` **tidak berubah** oleh keputusan ini. Aturan "dua berkas konsisten" tetap berlaku **hanya** untuk perubahan pada token global `--font-size-*` — yang justru **dilarang** oleh `D-DS1 = A`. Bila kelak ada canvas shell, wajib amandemen §2.4 dulu.
3. **IPC tidak tersentuh.** Kontrak ini murni frontend; `generated.ts` tetap di-generate dari Pydantic, tidak di-hand-edit; tidak ada command/query baru.
4. **Lint / review:** cek tidak ada `font-size`/hex literal baru di TSX; cek setiap kontrol baru punya 8 state; cek tabel punya `<caption>` + `scope`.
5. **Visual review:** matriks `state × viewport (900, 1440) × region` dengan **seeded fixtures per state**, bukan `data:null` (`frontend/tests/helpers.ts:25-38`). **`D-S7 = A` (Ratified 17:15:33 WIB):** seeded fixtures per state + toleransi <=5% + rute Readiness masuk matriks — semua wajib sebelum baseline diregenerasi.
6. **Toleransi:** `maxDiffPixelRatio: 0.15` masih aktif; **`D-S7 = A` (Ratified 17:15:33 WIB)** menetapkan penurunan ke **≤5%** dengan seeded fixtures — tetapi **belum boleh diterapkan** sampai baseline diregenerasi (lihat `D-DS4`).
7. **Lint kepemilikan token (`D-DS1 = A`, Ratified).** Selector fitur dilarang memakai `--shell-font-*`; selector shell dilarang memakai `--font-size-*`. Dijalankan pada G6, diverifikasi dengan konteks segar.
8. **Diff aditif murni (`D-DS1 = A`, Ratified).** Saat implementasi kelak diizinkan, `git diff frontend/src/shared/tokens.css` wajib **hanya menambah baris**; nol pengubahan/penghapusan nilai lama. Bukti `git diff` dilampirkan ke `QA-SHELL-001`.
9. **Utang konvergensi (`D-DS5 = A`, Ratified 17:15:33 WIB).** Dua skala berdampingan **diterima sebagai utang teknis yang tercatat** — konvergensi **ditunda ke pasca-RC**. Menghapus token lama "karena sudah tidak dipakai" tanpa amandemen per fitur + Critic masing-masing = pelanggaran kontrak. **Tunda sah, tapi harus ada tenggat eksplisit dan kondisi pemicu (trigger) yang ditentukan PO.**


10. **Cakupan 8 state — shell saja (`D-DS2 = A`, Ratified 17:15:33 WIB).** Delapan state kontrol wajib untuk `button`/`input`/`select` di **layer shell R1–R7 saja**. Kontrak DS per fitur tetap authoritative di R4. Menerapkan 8 state global tanpa Critic per fitur = pelanggaran.

11. **Regenerasi baseline setelah D-S7 (`D-DS4 = A`, Ratified 17:15:33 WIB).** Baseline visual diregenerasi **setelah** `D-S7` selesai (seeded fixtures + toleransi ≤5%). `D-DS1 = A` tetap menggeser 28 baseline PNG (app bar/rail/stepper ada di setiap screenshot). Regenerasi tanpa fixtures = false confidence. **Urutan:** D-S7 fixtures → baseline baru → turunkan toleransi → verifikasi hijau.

12. **Rute Readiness wajib (`D-S7 = A`, Ratified 17:15:33 WIB).** `visual.spec.ts` saat ini tidak mengunjungi rute Readiness. Sejak `D-S7 = A`, rute Readiness **wajib** masuk matriks visual regression. `helpers.ts` mengembalikan `data:null` (baris 27, 34) — wajib diganti dengan seeded fixtures per state.

---

## 9. Keputusan mekanisme G4

> **Kartu & record:** [DECISION-CARD-D-DS1.md](DECISION-CARD-D-DS1.md) — opsi A/B/C, reasoning, bukti berlabel, argumen penentang A, dan **§8 record keputusan**. `D-DS1` **sudah diratifikasi PO (A, 16:01:39 WIB)** lewat [RATIF-SHELL-002](RATIFICATION-RECORD-D-DS1-2026-11-08.md). `D-DS2`…`D-DS5` + `D-S7` **sudah diratifikasi PO — A (17:15:33 WIB)** lewat [RATIF-SHELL-003](RATIFICATION-RECORD-D-DS2-TO-D-S7-2026-11-08.md). `D-F4`…`D-F8` + `D-S5`/`D-S6`/`D-S8` **sudah diratifikasi PO — A (17:38:27 WIB)** lewat [RATIF-SHELL-004](RATIFICATION-RECORD-D-F4-TO-D-S8-2026-11-08.md) (relevan di sini: `D-F8` urutan Phase 0/1/2, `D-F5` ekstensi `JobEvent`, `D-S8` `In Progress` ditunda, `D-F6` kanal error, `D-F7` stale lintas-route, `D-S5` copy deck, `D-S6` `Esc`/`Cmd+K`). Kontrak induk ini **belum diratifikasi**.

| ID | Pertanyaan | Status / rekomendasi | Catatan |
|---|---|---|---|
| `D-DS1` | **Mekanisme migrasi token**: aditif `--shell-*` atau remap global `--font-size-*`? | ✅ **RATIFIED OLEH PO — A (2026-11-08 16:01:39 WIB, `RATIF-SHELL-002`)**. Sebelumnya `Diputus PO` 15:34:53 WIB. 5 token `--shell-font-*` baru, token lama dibiarkan; 3 pengaman wajib | Ditranskrip ke **§2.4** dan **§8 butir 7–9**. **Ditolak:** B, C, Tunda. **Bukan** tanda tangan digital. Bukti lengkap & stop-rule reasoning ada di kartu §2/§4 |
| `D-DS2` | Apakah 8 state kontrol berlaku untuk kontrol **fitur** juga, atau shell saja? | ✅ **RATIFIED OLEH PO — A (17:15:33 WIB, `RATIF-SHELL-003`)**. Shell saja untuk RC; kontrak DS per fitur tetap authoritative di R4 | Ditranskrip ke §8 butir 10. **Ditolak:** B (global), C (amandemen per fitur bertahap). Bukti: 7 fitur sudah punya DS ratified |
| `D-DS3` | Nilai `font-weight` & line-height per tingkat; penyelarasan radius 4/6/8px | ✅ **RATIFIED OLEH PO — A (17:15:33 WIB, `RATIF-SHELL-003`)**. `title` 600, sisanya 400; line-height 1.4/1.5; **radius tidak diubah** | Ditranskrip ke **§2.5** dan **§8 butir 10**. Bukti: `tokens.css` hanya `700`/`600`, `line-height: 1.5` sekali — **Confirmed**. Radius = utang amandemen `DS-CORE-001` |
| `D-DS4` | Strategi regenerasi baseline visual saat skala berubah | ✅ **RATIFIED OLEH PO — A (17:15:33 WIB, `RATIF-SHELL-003`)**. Regenerasi **setelah D-S7** selesai (seeded fixtures + toleransi ≤5%) | Ditranskrip ke **§8 butir 11**. Bukti: 28 baseline PNG ter-commit; app bar/rail/stepper di setiap screenshot → pergeseran pasti. **Prasyarat D-S7 sudah diratifikasi (A, RATIF-SHELL-003).** |
| `D-DS5` | **Konvergensi dua skala tipografi** (konsekuensi langsung `D-DS1 = A`): kapan & bagaimana `--font-size-*` disatukan, atau dihapus? | ✅ **RATIFIED OLEH PO — A (17:15:33 WIB, `RATIF-SHELL-003`)**. Tunda konvergensi ke **pasca-RC**; dua skala berdampingan diterima sebagai utang teknis tercatat | Ditranskrip ke **§8 butir 9**. `body` shell 14px vs fitur 13px, `caption` 12px vs 11px = ketidakkonsistenan nyata. **Tunda sah, tapi wajib ada tenggat & trigger eksplisit.** |

> `D-DS1`–`D-DS5` adalah **keputusan mekanisme**, bukan pembukaan kembali nilai skala 24/18/15/14/12 yang sudah diratifikasi `D-S4`. Menyetujui `D-S4` tidak diam-diam menyetujui kelimanya; memutus `D-DS1 = A` juga tidak diam-diam memutus `D-DS2`…`D-DS5`.

---

## 10. Bukti G5 / G6 yang harus ada

- **Matriks state kontrol:** 8 state × 3 kontrol (`button`/`input`/`select`) × 2 viewport (900, 1440), dengan screenshot dan assertions pada `aria-*` serta `disabled_reason`.
- **Kontras:** pengukuran nyata untuk kelima tingkat pada `surface` dan `surface-raised`, termasuk `caption` 12px dan teks `muted`.
- **Keyboard:** jalur Tab lengkap R1→R7, focus return drawer, `Esc`, skip link, `:focus-visible` pada setiap state.
- **Axe:** 0 critical pada 8 route (termasuk **Readiness** yang saat ini tidak dikunjungi `visual.spec.ts:13-21`) + walkthrough screen reader untuk banner/drawer.
- **Fixtures:** populated / loading / error / stale / done / job-running / job-failed / degraded — bukan `data:null`.
- **Independent Critic (G5)** dengan konteks segar; temuan berlabel `Confirmed / Likely / Suggestion`.
- **"Test tidak dijalankan bukan PASS"** — screenshot prototipe disposable tidak diterima sebagai bukti penerimaan.

---

## 11. Exit G4 (belum terpenuhi)

- [ ] `D-DS1`…`D-DS5` + `D-S7` diputus PO. **Terpenuhi sebagai keputusan (Add-02 + Add-03 + Add-04 + Add-05, 2026-11-08):** `D-DS1 = A` ✅ **Ratified oleh PO (16:01:39 WIB, `RATIF-SHELL-002`)**; `D-DS2 = A`, `D-DS3 = A`, `D-DS4 = A`, `D-DS5 = A`, `D-S7 = A` ✅ **Ratified oleh PO (17:15:33 WIB, `RATIF-SHELL-003`)** — semua blocker *keputusan* terlepas. Ditambah **Add-06 (17:38:27 WIB, `RATIF-SHELL-004`):** `D-F4`…`D-F8` + `D-S5`/`D-S6`/`D-S8 = A` ✅ **Ratified oleh PO** — total **21 ratified, 0 Pending**, semua blocker *keputusan shell* terlepas. Tetapi kontrak belum diratifikasi, dan `D-S7` juga tercatat di `SCREEN-SHELL-001` (berkas bertanda tangan → lihat addendum). Kotak **tetap belum dicentang** karena ratifikasi kontrak belum terjadi.
- [ ] Dampak `D-DS1 = A` terhadap 28 komponen, `tokens.ts`, dan 28 baseline visual dinilai dan disetujui. **Sebagian terpenuhi (Add-04, diratifikasi Add-05):** `tokens.ts` diputus tidak berubah (§8 butir 2); `D-DS4 = A` menetapkan strategi regenerasi baseline (setelah D-S7); `D-S7 = A` menetapkan seeded fixtures + toleransi ≤5%. Tetapi bukti `git diff` aditif murni + regenerasi baseline aktual + bukti kontras terukur masih menunggu implementasi pasca-G5.
- [ ] Kelima tingkat tipografi punya weight/line-height final serta bukti kontras terukur. **Sebagian terpenuhi (Add-04, diratifikasi Add-05):** `D-DS3 = A` menetapkan weight (title 600, lainnya 400) dan line-height (display/title 1.4, lainnya 1.5). Tetapi bukti kontras terukur belum ada — menunggu implementasi pasca-G5.
- [ ] Kedelapan state kontrol punya perlakuan visual + semantik + uji untuk `button`/`input`/`select`.
- [ ] Konflik dengan DS per fitur ratified didaftarkan sebagai amandemen, bukan ditimpa.
- [ ] `DS-SHELL-001` diratifikasi PO; `APP-ARCH-001` / `JOB-SHELL-001` / `QA-SHELL-001` tersedia **dan diratifikasi**; G1/G2/G3 exit. **Sebagian terpenuhi (Add-01, 2026-11-08):** [APP-ARCH-001](APP-ARCH-001.md) dan [JOB-SHELL-001](JOB-SHELL-001.md) tersedia sebagai **DRAFT v0.1** — keduanya **belum diratifikasi**, `QA-SHELL-001` tersedia sebagai **DRAFT v0.1** (Add-07, 2026-11-08 — kontrak acceptance, bukti B1–B12 Belum ada), G1/G2/G3 belum exit. Kotak tetap belum dicentang.
- [ ] Independent Critic (G5) PASS dengan konteks segar — **baru** boleh menyentuh `tokens.css`.
- [ ] `D-S7` ditranskrip ke `SCREEN-SHELL-001.md` §3.10 — **berkas bertanda tangan**, tidak disunting; transkrip via addendum (Add-04).

---

## 12. Traceability

| Sumber | Bagian kontrak ini | Bukti di `QA-SHELL-001` |
|---|---|---|
| `RATIF-SHELL-001` §2 `D-S4` | §2 skala, §3 state, §5 kartu/tabel/chart | tabel keputusan + tanda tangan digital |
| `RATIF-SHELL-001` §3 `D-S3` | §6 responsif 900px | uji aksesibilitas 900px |
| `DS-CORE-001` §Tokens/Sizing/Elevation | §1, §5, §7 (tidak diubah) | pengukuran kontras & target kontrol |
| `SCREEN-SHELL-001` §3.2, §3.7, §3.9.7 | §4 inventaris, §6, §7 | matriks region × state × viewport |
| `FLOW-SHELL-001` §2.4, §2.5 | §3 `disabled`/`error`, §4 banner/toast | uji per concern + gate-blocked |
| `tokens.css:43-46, 92-103`, `tokens.ts` | §2.2 temuan, §8 enforcement | lint + `git diff --exit-code` generator |
| `DECISION-CARD-D-DS1.md` §8 (Add-02) + `RATIF-SHELL-002` (Add-03) | §2.4 mekanisme, §8 butir 7–9, §9 | lint kepemilikan + `git diff` aditif murni + status `D-DS5` |
| `frontend/tests/helpers.ts`, `visual.spec.ts` | §10 fixtures & baseline | seeded fixtures, toleransi sesuai `D-S7 = A` (Ratified 17:15:33 WIB) |
| Add-05 / `RATIF-SHELL-003` (5 keputusan D-DS2–D-DS5 + D-S7, 17:15:33 WIB) | header, §2.4 D-DS5, §2.5, §8 butir 5–6/9–12, §9, §11, §12 | naik status `Diputus PO` → `Ratified oleh PO` untuk 5 keputusan |
| Add-06 / `RATIF-SHELL-004` (8 keputusan D-F4–D-F8, D-S5, D-S6, D-S8, 17:38:27 WIB) | header, §0/§4/§5, §9, §11, §12 | `Pending` → `Ratified oleh PO` untuk 8 keputusan; total 21 ratified, 0 Pending; `FLOW-SHELL-001`/`SCREEN-SHELL-001` bertanda tangan (koreksi via addendum) |

---

**Status akhir:** DRAFT v0.5 — `D-DS1 = A` **Ratified oleh PO (16:01:39 WIB, `RATIF-SHELL-002`)**; `D-DS2 = A`, `D-DS3 = A`, `D-DS4 = A`, `D-DS5 = A`, `D-S7 = A` **Ratified oleh PO (17:15:33 WIB, `RATIF-SHELL-003`)**; `D-F4 = A`, `D-F5 = A`, `D-F6 = A`, `D-F7 = A`, `D-F8 = A`, `D-S5 = A`, `D-S6 = A`, `D-S8 = A` **Ratified oleh PO (17:38:27 WIB, `RATIF-SHELL-004`)**. Semua keputusan shell (21) sudah diratifikasi, ditranskrip (§0/§2.4, §2.5, §4/§5, §8, §9, §11, §12). Kontrak ini **menutup prasyarat *keputusan* G4**, bukan prasyarat *ratifikasi* G4. **Tidak ada kode produksi yang diizinkan; `tokens.css` dan `tokens.ts` tetap tidak boleh disentuh** sampai G4 exit + Independent Critic (G5) PASS dengan konteks segar.
