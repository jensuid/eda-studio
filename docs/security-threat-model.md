# Security Threat Model — Path Handling (P4-2)

Tahun: 2026-11-07 — Kartu P4-2 (K7 path hardening).

## Asumsi ancaman

- **Desktop lokal, single-user.** Aplikasi adalah aplikasi desktop yang
  dijalankan oleh pengguna itu sendiri (bukan server multi-user). Penyerang
  jaringan tidak dapat memanggil IPC bridge dari luar proses; zona IPC
  (`backend/ipc.py`, 4 metode bridge) diasumsikan hanya dapat diakses oleh
  frontend yang berjalan di proses desktop yang sama.
- **Path dari dialog vs input manual.** `dialog.pick_file` (PyWebView native
  dialog) dianggap sebagai *user authorization*: path yang dikembalikan
  dialog adalah pilihan sadar pengguna, karena pengguna sendiri yang
  memilih file di file manager OS. Path yang diketik manual (kolom path)
  adalah *input tak-terverifikasi* — dapat berasal dari salah ketik,
  copy-paste dari dokumen, atau konten jahat (mis. URL/`../` yang
  ditempel dari dokumen lain).
- Persistensi allowlist in-memory saja: reput sukses dialog tidak
  survive restart; pengguna harus memilih ulang lewat dialog.

## Vektor & mitigasi

| Vektor | Dampak | Mitigasi |
|---|---|---|
| `source_path`/`dest_path` absolut di luar root | Baca/tulis file di luar root (mis. `/etc/passwd`, penulisan timpa data pengguna lain) | Allowlist: absolut hanya lolos bila di dalam root proyek, root ter-trust, atau path hasil `dialog.pick_file` yang sudah terotorisasi |
| Traversal `..` (mis. `proj/../../etc/x`) | Lolos dari root check via komponen relatif | Komponen `..` ditolak fail-closed sebelum cek ekstensi/keberadaan, termasuk symlink yang resolve keluar root |
| Path relatif ambigu `(cwd)` | Bergantung direktori kerja prose | Path relatif di-resolve terhadap root proyek dan harus tetap di dalam root |
| Ekstensi salah / path kosong / NUL | Format tidak didukung, crash, atau bypass | `validate_path_input` (P2-3) — dipertahankan; K7 menambah allowlist di titik integrasi yang sama |
| Menyalahkan dialog | Dialog mengembalikan path di luar root — dianggap aman | Hasil dialog didaftarkan ke allowlist (`authorize_path`) saat `dialog.pick_file` sukses di bridge |

## Batasan yang disengaja (anti-over-engineer)

- Tidak ada sandbox filesystem OS-level (chroot/app sandbox): di luar
  kebutuhan kartu untuk desktop single-user.
- Tidak ada daftar "path sistem terlarang" hardcoded. Allowlist
  proyek+dialog cukup; mengecualikan `/etc/` secara eksplisit tidak
  menambah keamanan karena semua path luar-root sudah ditolak kecuali
  dialog yang dipilih pengguna.
- Tidak ada mekanisme persisten / beberapa sesi; allowlist sifatnya
  in-memory per proses.

## Kriteria keberterimaan (kartu P4-2)

- Test traversal + absolut-luar-root ditolak (`VALIDATION_ERROR`).
- Path dari dialog tetap lolos (import sukses setelah
  `dialog.pick_file` mengotorisasi).
- Gate §10 hijau.
