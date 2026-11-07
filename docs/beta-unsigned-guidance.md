# Panduan Tester — Beta unsigned (keputusan pemilik 2026-11-07)

Keputusan pemilik 2026-11-07: **macOS + Windows unsigned untuk Beta**;
signing/notarisasi (P4-4) ditunda ke Stable (Apple Developer Program
±US$99/tahun / Azure Trusted Signing ±US$120/tahun — lihat
`docs/decisions-pending-2026-11-07.md`). Dokumen ini adalah panduan yang
diberikan ke tester beta. **Bukan untuk distribusi publik.**

## macOS — Gatekeeper

Aplikasi ini **belum** ditandatangani/di-notarisasi, sehingga macOS akan
memblokir apabila file diunduh lewat browser (atribut karantina).

Cara menjalankan (pilih salah satu):

1. **Klik-kanan → Open** pada aplikasi, lalu konfirmasi **Open** pada
   dialog. Cara ini paling aman dan hanya perlu sekali per build.
2. Atau buka **System Settings → Privacy & Security** → baris
   "…was blocked from use" → **Open Anyway**.
3. Atau (terminal): `xattr -dr com.apple.quarantine <path-aplikasi>`

Apabila aplikasi dibuka dari folder yang tidak diunduh via browser
(mis. dari USB), biasanya langsung jalan tanpa peringatan.

## Windows — SmartScreen

Aplikasi ini **belum** ditandatangani sehingga SmartScreen menampilkan
"Unknown publisher". Cara lanjut:

1. Pada dialog biru SmartScreen, klik **More info**.
2. Klik **Run anyway**.

Ini aman hanya untuk build yang diterima **langsung dari pemilik**
(jangan jalankan file `.exe`/installer dari sumber lain).

## Batasan Beta unsigned

- Peringatan di atas muncul setiap kali build baru diganti.
- Tidak ada mekanisme auto-update bertanda tangan (P4-4/G6) — build baru
  diganti manual oleh pemilik bila ada.
- Jangan bagikan build ke pihak luar tim beta.

## Skenario validasi

Gunakan skenario di `docs/beta-validation-script.md` (7 skenario) +
`docs/bug-report-template.md` untuk laporan bug.
