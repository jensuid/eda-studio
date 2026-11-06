# DS-CLEAN-001 — Design System & Component Contract (M3 Cleaning)

**Status:** Ratified oleh PO (2026-11-05) · **Scope:** perluasan DS-CORE-001 + DS-QUAL-001 khusus Cleaning.
Token & komponen di DS-CORE-001 dan DS-QUAL-001 tetap berlaku; kontrak ini hanya menambah yang dibutuhkan cleaning.
**Sifat:** semua yang baru di bawah ini **Ratified** 2026-11-05 (lihat `01-po-ratifikasi.md`) — perubahan = perubahan kontrak → impact review.

## Tokens tambahan (semantic, bukan hex)

| Token | Penggunaan | Catatan |
|---|---|---|
| `cleaning-impact` | Teks/angka ringkasan dampak (preview + dialog) | `text-primary`, 13px tabular-nums; angka selalu berpasangan dengan label cakupan |
| `cleaning-operation-id` | Label operasi (`drop_duplicates`, `drop_missing`, `impute`) | Mono 12px, `text-secondary` — bukan warna, bukan ikon saja (mirip `quality-rule-id`) |
| `cleaning-danger-dialog` | Bingkai dialog konfirmasi destruktif | Reuse `surface-raised` + `border-subtle`; **tidak** menambah warna merah baru — status destruktif disampaikan lewat teks + `status-danger` DS-CORE |
| `cleaning-stale` | Banner stale setelah cleaning | Reuse `status-warning` DS-CORE-001; teks "Hasil mungkin usang — jalankan ulang." |

Larangan warisan DS-CORE-001: raw hex dilarang di komponen cleaning; radius 6/8px & spacing base 4px tetap; tidak ada kartu bertumpuk (LD-04).
Bila cleaning menampilkan severity Quality: wajib reuse token `status-ok`/`status-warning`/`status-error` DS-CORE-001 — jangan buat `cleaning-status-*` baru. Bila tidak menampilkan severity, kontrak menyatakan tidak ada tampilan severity (keputusan difinalkan per-varian komponen).

## Komponen baru

| Komponen | Varian | Do | Don't |
|---|---|---|---|
| `CleaningOperationPicker` | duplikat, hapus-missing, imputasi (mean/median/mode/konstanta) | Satu radio group operasi + pemilih kolom eksplisit per operasi; eligibility per FLOW F2 (mean/median vs mode vs konstanta; `empty` hanya konstanta) dijelaskan | Dropdown implisit; operasi tanpa temuan Quality yang diaktifkan |
| `CleaningImpactSummary` | preview, dialog, selesai | Baris terpengaruh (count + %), row_count sebelum → sesudah, fingerprint induk singkat (12 char), breakdown per-kolom untuk drop_missing, filled per kolom untuk impute; teks tabular | Diff baris penuh; angka tanpa label cakupan |
| `CleaningConfirmDialog` | destruktif (ketiga operasi) | `role="alertdialog"` focus-trapped + Escape; checkbox persetujuan eksplisit + dua tombol "Batal"(default focus) / "Terapkan cleaning" (SCREEN S1); max-height = viewport − 64px + scroll internal ringkasan/checkbox | Dialog tanpa dampak; Enter memicu Terapkan; focus di Terapkan |
| `CleaningStaleBanner` | stale (pasca-cleaning) | "Hasil mungkin usang — jalankan ulang." + CTA "Jalankan ulang Profiling" / "Jalankan ulang Quality Check" | Diam-diam (tanpa banner) atau memblokir tanpa penjelasan (FLOW C5) |
| `CleaningSkeleton` / `CleaningEmpty` / `CleaningError` | — | Skeleton pemilih operasi (LD-10), pesan literal per SCREEN-CLEAN-001 (termasuk preview-error, conflict, cancelled, zero-child) | Spinner tanpa label; tabel kosong tanpa teks |

## Aturan tampilan (mengikat implementasi)

1. **Angka + cakupan selalu berpasangan**: setiap angka dampak wajib disertai label cakupan (kolom / snapshot) + `%` dari snapshot induk (row_count_before) — tidak boleh tampil angka saja.
2. **Destruktif bukan warna saja**: dialog konfirmasi selalu berteks ("Terapkan cleaning?") + dampak teks; tidak hanya pewarnaan merah.
3. **Dialog adalah satu-satunya jalur tulis**: tidak ada jalur "terapkan langsung" yang melewati `CleaningConfirmDialog` (C2).
4. **Panjang konten**: pemilih kolom panjang scroll di dalam pane pemilih saja; ringkasan tetap terlihat (sticky header bila sederhana); dialog sendiri max-height + internal scroll agar tombol tetap terlihat di 900px.
5. **Aksesibilitas**: pemilih operasi = radio group native; dialog `role="alertdialog"` (assertive per spec) + live-region `aria-live="polite"` terpisah untuk status preview/applying; ringkasan berupa teks; focus management: dari preview (`role="status"`) → dialog (konfirmasi) → selesai (kembali ke picker dengan focus ke heading).
6. **Gerakan**: transisi ≤ 150ms, hormati reduced-motion; tidak ada animasi dekoratif.
7. **Tidak ada chart baru**: cleaning = pemilih + tabel ringkasan + dialog; histogram tetap memakai DS-HIST-001.
8. **ECharts-only** tetap berlaku untuk fitur yang memakai chart (LD-06); cleaning tidak memakai chart, jadi tidak ada konflik.
9. **Restricted N/A**: single-user local-first — alasan N/A dicatat di SCREEN; tidak ada komponen restricted khusus.

## Enforcement (G6)

- Review checklist: token `cleaning-*` terpakai di tema terpusat; tidak ada hex literal di komponen cleaning; pemilih operasi & ringkasan bukan `<div>` grid yang tidak dapat diakses keyboard; reuse token status DS-CORE-001 untuk severity.
- Uji aksesibel: pemilih operasi & dialog dapat diakses keyboard; status `aria-live` mengumumkan "Menghitung dampak…" / "Menerapkan cleaning…" / "Cleaning selesai".
- Screenshot 900px & 1440px pada state preview / dialog / selesai / stale / no-finding / ineligible untuk Critic (G5) — no-finding & ineligible wajib ikut karena itu jalur copy berisiko tertinggi.

## Exit G4 (Ratified 2026-11-05)

Token & komponen cleaning terkunci untuk slice G5. Perubahan operasi (C1), enum imputasi (F2), kontrak IPC (S3), atau persistensi `CleaningRecord` (S5) setelah G4 = perubahan kontrak → butuh impact review sebelum implementasi. Bila PO menolak persistensi S5 (menuntut recompute tanpa tabel), slice G5 berubah — keputusan itu tercatat sebelum coding.
