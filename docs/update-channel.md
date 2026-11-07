# Update channel — G6-3

Tanggal: 2026-11-07 · Keputusan pemilik: Velopack di atas GitHub Releases.

## Status implementasi (0.1.0, Beta unsigned)

Yang tersedia sekarang adalah **lapisan versi + pemeriksaan update**,
bukan pengunduhan/penerapan paket:

- `app.info` — melaporkan versi aplikasi (`backend.__version__`),
  platform, dan feed update yang efektif.
- `app.update.check` — mengambil JSON feed rilis kecil (default:
  GitHub Releases `releases/latest` untuk `jensuid/eda-studio`),
  membandingkan tag rilis dengan versi berjalan memakai urutan
  semver, dan melaporkan `update_available`.
- Feed dapat dioverride lewat variabel lingkungan `EDA_UPDATE_FEED`
  atau argumen `feed_url` per panggilan.
- Pemeriksaan **tidak pernah melempar exception ke startup**:
  kegagalan jaringan/timeout/body malformed menghasilkan
  `latest_version=null` dan `update_available=false`.
- Frontend menampilkan versi serta tombol "Periksa update" di panel
  samping.

## Full Velopack packaging (ditunda ke Stable)

Pengunduhan, verifikasi, dan swap biner Velopack belum diaktifkan.
Itu harus diaktifkan bersama jalur rilis bertanda tangan per OS
(P4-4), ketika paket Velopack per OS dapat dibuat, ditandatangani,
dan diterbitkan ke GitHub Releases dengan channel wajib.

Prasyarat sebelum mengaktifkan auto-apply:

1. Rilis dibuat via `tools/build_packaging.py` per OS dengan opsi
   Velopack (`--velopack` atau flag setara pada panduan build).
2. Setiap rilis menerbitkan manifest/SBOM kompatibilitas
   (Doc14 §13/BUILD-030) dan aset channel Velopack.
3. Kredensial signing per OS tersedia di pemilik (P4-4).
4. Penguji Beta memvalidasi alur update pada macOS dan Windows
   dari kanal rilis nyata.

Sampai semua prasyarat terpenuhi, aplikasi 0.1.0 tetap dibagikan
sebagai artefak unsigned Beta per `docs/beta-build-guide.md`, dan
`app.update.check` berfungsi hanya sebagai pemberitahuan versi.
