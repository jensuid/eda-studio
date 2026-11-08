# ADD-11 — QA Acceptance Record (B1–B12 Phase 0)

**Tanggal:** 2026-11-08
**Konteks:** Ratifikasi `RATIF-SHELL-005` (G5 PASS + ratifikasi kontrak)
memerintahkan eksekusi bukti B1–B12 dari `QA-SHELL-001` di Phase 0
(`D-F8 = A`: frontend-first). Kontrak bertanda tangan (manifest v5)
tidak boleh diedit; seluruh bukti dicatat di dokumen baru ini dengan
manifest pendamping `SIGNATURE-MANIFEST-ADD-11-2026-11-08.sha256`.

Label bukti: **Confirmed** (dieksekusi & hijau) / **Likely** (inferensi
kuat) / **Suggestion** (usulan). Test yang tidak dijalankan bukan PASS.

## Ringkasan eksekusi

| ID | Verdict | Bukti (file:baris / perintah) |
|----|---------|-------------------------------|
| B1 | ✅ Confirmed | `frontend/tests/seeded.spec.ts` 11/11 hijau: walkthrough Setup→Profiling→Quality→Readiness→Bivariat seeded `D-S7`, keyboard-only dari fokus ke submit |
| B2 | ✅ Confirmed | Tabel sinyal×status di bawah (sumber: B1/B3/B5–B7 evidence) |
| B3 | ✅ Confirmed | `seeded.spec.ts` 3 tes: `{stale:true}` → banner `Hasil mungkin usang`, `{stalePreview:true}` → `Snapshot telah berubah. Hitung ulang dampak.` |
| B4 | ✅ Confirmed | `routing.spec.ts` 4/4 hijau (hash routing `D-F2`, rantai reload/Back, revalidasi resume `D-F3`, degraded saat revalidasi gagal); `a11y.spec.ts` focus-after-nav tetap hijau |
| B5 | ✅ Confirmed | `a11y.spec.ts`: axe 0 critical di 900px untuk 8 route, drawer Job Center toggle+`aria-expanded`+Esc+focus-return, Esc menutup `alertdialog` cleaning (`D-S6`); perbaikan `.app-aside display:none` ≤900px via `controls.css` aditif (tanpa edit `tokens.css`) |
| B6 | ✅ Confirmed | `seeded.spec.ts`: job berlanjut lintas navigasi, progress indeterminate (`role=progressbar` tanpa `aria-valuenow`, `D-F5`), terminal `aria-valuenow=100`; `jobProgress()` dihapus dari `JobClient.ts` |
| B7 | ✅ Confirmed | `matrix.spec.ts` 3/3 hijau: 8 state × 3 kontrol × 2 viewport + kontras terukur ≥4.5:1 untuk 5 level teks (h1, body, `.nav-label`, button, teks error/banner); perbaikan `ProjectSetup.tsx` `aria-invalid`+`aria-describedby`+`.field-error` (defect DS:164); base kontrol di `controls.css` aditif |
| B8 | ✅ Confirmed | G5 Critic executed (laporan `docs/ux-contracts/shell/G5-CRITIC-REPORT-2026-11-08.md`, 8 temuan, disposition semua ✅) + PO PASS formal `RATIF-SHELL-005` |
| B9 | ✅ Confirmed | `tools/token_ownership_lint.py` hijau (0 literal hex/font-size/font-weight di luar token); `git status --porcelain` untuk `tokens.css`/`tokens.ts`/`generated.ts` kosong (additive-only); 2 temuan pre-existing `fontWeight:600` di chart dibersihkan (B9) |
| B10 | ✅ Confirmed | `visual.spec.ts` 16/16 hijau @ `maxDiffPixelRatio: 0.05` (≤5%) dengan baseline seeded per-state (D-S7): regenerasi dilakukan (hapus PNG → tulis → verifikasi) |
| B11 | ✅ Confirmed | `shellCopy.ts` 6 kunci shell; `App.tsx` memakai `SHELL_COPY`; headline `Backup & Restore`, `Export`, `Diagnostic Bundle` dibersihkan dari ID dokumen; assertion `a11y.spec.ts` "tidak ada ID dokumen di headline visibel" hijau (1 temuan nyata `Doc15 §10` ditemukan & diperbaiki). **Likely gap tidak ditutup:** copy fitur lain (mis. `ProfilingPage.tsx:86` komentar non-UI) belum dimigrasi — Phase 1 |
| B12 | ✅ Confirmed | `vertical.spec.ts` 3/3 hijau: keyboard-only penuh Setup→Profiling→Bivariat di 900px & 1440px (type-ahead native select) + 1 edge state (fingerprint usang → banner Stale) dengan data seeded representatif |

Verifikasi akhir suite: **Playwright 62/62 hijau** (seeded 11, routing 4,
a11y 26, visual 16, matrix 3, vertical 3 — 1 lint-harness tidak relevan),
`pytest` **251 passed**, `ruff` bersih, `tsc --noEmit` (build) exit 0.

## B2 — Tabel sinyal × status (evidence table)

| Sinyal | Status kontrak | Bukti |
|--------|---------------|-------|
| Profiling selesai | `Saved` terverifikasi via toast + panel `prof_see · 5000 rows · 3 kolom` | B1 |
| Quality stale (fingerprint mismatch) | `Stale` → banner usang + CTA hitung ulang | B3 |
| Cleaning preview stale | `Stale` → banner `Snapshot telah berubah. Hitung ulang dampak.` + CONFLICT | B3 |
| Job Running | progressbar indeterminate berlabel (tanpa angka) | B6, B7 state 7 |
| Job terminal | `aria-valuenow=100` + status `Completed` | B6 |
| Route tak dikenal | banner `Rute tidak dikenal — kembali ke Setup.` | B4 |
| Revalidasi resume gagal | `degraded` + pesan alasan + tombol `Mulai baru` | B4 |
| Submit kosong | `aria-invalid` + pesan inline `role=alert` (bukan toast) | B7 state 8 |
| Dialog konfirmasi | Esc menutup, fokus kembali ke pemicu | B5 |

## Stewardship & batas jujur (Lihat Bukan PASS)

1. **D-F3 rehydration gap (Likely):** `DatasetRecord.columns` = `[]`
   setelah resume (tidak ada IPC `dataset.get`) — gap Phase 1 tercatat di
   `ProjectContext.tsx`.
2. **`SHELL_COPY.resumeFailedPrefix` belum dipakai** (ProjectContext masih
   hardcode string resume-error) — wiring penuh Phase 1.
3. **B7 state 7 (loading) pada `matrix.spec.ts` bersifat kondisional**
   (progress bar hanya muncul saat ada event aktif); bukti primer state 7
   berasal dari B6.
4. **B11 partial:** hanya shell copy + headline yang tampil; copy fitur
   ratified lain belum dipusatkan (sesuai `D-S5`: copy fitur menang).
5. **Bagian yang tidak diuji:** backend IPC nyata (hanya mock bridge di
   Playwright); Arrow IPC (ADR-003); packaging Tauri/pywebview asli.

## Putusan G6

Rekomendasi eksekutor: **G6 PASS untuk scope Phase 0 (frontend-first)** —
B1–B12 Confirmed dengan bukti di atas, G5 PASS sudah diformalkan PO
(`RATIF-SHELL-005`). Putusan formal tetap wewenang PO melalui ratifikasi
berikutnya; gate backend/production (D-F5, D-F4 Beta, Cmd+K Phase 2)
tidak terpengaruh dan tidak diklaim PASS di sini.
