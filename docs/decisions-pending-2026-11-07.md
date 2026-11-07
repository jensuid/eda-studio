# Dokumen Keputusan Tertunda — P4-4 (Signing) + G6 (Phase 6 lanjutan)

Tanggal: 2026-11-07 · Sesuai roadmap: tidak ada kartu actionable untuk agent
mandiri. Dokumen ini membekukan opsi + rekomendasi agar pemilik tinggal
pilih. **Peringatan:** layanan web search tidak tersedia saat penulisan —
harga/ketentuan di bawah ini fakta mapan, verifikasi ulang saat pembelian.

## Keputusan 1 — P4-4 Signing/notarisasi

Yang dibutuhkan: `tools/build_packaging.py --sign` per OS + checklist
`docs/release-checklist.md` ditandatangani. Tanpa ini, Beta bisa jalan
(unsigned, ada peringatan Gatekeeper/SmartScreen) tapi Stable tidak boleh.

### macOS

| Opsi | Biaya* | Trade-off |
|---|---|---|
| **A. Apple Developer Program (individual)** — Developer ID Application cert → sign + `notarytool`. Distribusi luar App Store tanpa warning. | ±US$99/tahun | Wajib untuk jalur mana pun di luar App Store. Butuh akun Apple ID. Notarisasi lanjutannya gratis. |
| B. App Store distribution | sama | Sandbox App Store menghambat akses file lokal & model pywebview — tidak cocok untuk EDA local-first. ❌ |
| C. Unsigned (kondisi sekarang) | 0 | Gatekeeper block; hanya untuk tester internal dengan instruksi. Cukup untuk Beta. |

**Rekomendasi: A** — satu-satunya jalur yang benar untuk aplikasi desktop
di luar App Store; beli duluan karena menjadi prasyarat segalanya di macOS.

### Windows

| Opsi | Biaya* | Trade-off |
|---|---|---|
| **A. Microsoft Azure Trusted Signing** — sertifikat cloud, tanpa USB token; cocok untuk CI. | ±US$9.99/bulan (±US$120/tahun) | Butuh akun Azure; pendaftaran baru bisa diminta validasi identitas pemerintah + kartu kredit. Integrasi dengan `signtool` mudah. Kursi ideal untuk indie/small team. |
| B. OV code signing cert (SSL.com/DigiCert) | ±US$200–400/tahun | Token hardware wajib (CA/B Forum) → gesekan di CI; setup lebih rumit. |
| C. EV code signing cert | mahal | Tidak perlu untuk aplikasi desktop. ❌ |
| D. Unsigned | 0 | SmartScreen warning ("Unknown publisher"); untuk Beta internal saja. |

**Rekomendasi: A** bila anggaran ≥US$120/tahun diterima; bila belum, D untuk
Beta lalu A begitu Stable didekati. Jangan B kecuali ada alasan khusus
(OV token tidak cocok untuk pipeline CI mandiri).

### Tindakan pemilik (P4-4)

1. Beli Apple Developer Program (US$99/tahun) → buat Developer ID cert.
2. Pilih opsi Windows (A/D) di atas.
3. Sediakan rahasia CI: Apple cert (p12 + password + notary profile),
   dan/atau akun Azure Trusted Signing. Rahasia **tidak** masuk repo.
4. Beri tahu agent → kartu P4-4 `in_progress` (build bertanda tangan per
   OS + checklist ditandatangani + bukti di `cross-platform-evidence.md`).

### Urutan yang benar

macOS dulu (lebih murah & prasyarat tunggal) → Windows menyusul. Keduanya
independen; boleh paralel. Beta tidak terblokir di antaranya.

## Keputusan 2 — G6 Update management (kanal update)

| Opsi | Trade-off |
|---|---|
| **A. Velopack** (open source, aktif; mendukung Python) di atas GitHub Releases | Delta update, channel wajib; repo sudah di GitHub. Biaya 0. Kerja implementasi: sedang. |
| B. Tanpa auto-update — unduh manual + `Release Compatibility Manifest` (Doc14 §13/BUILD-030) | Compliant dengan Doc14, UX buruk, user tertinggal versi. |
| C. Squirrel | Proyek mati (±2023); jangan. ❌ |

**Rekomendasi: A** — satu-satunya opsi modern yang hidup. Prasyarat: manifest
kompatibilitas rilis diterbitkan per rilis (sebagian sudah ada via SBOM).

## Keputusan 3 — G6 Crash-recovery & portable export

Keduanya lebih dekat ke pekerjaan implementasi daripada keputusan produk
berat, tapi formatnya perlu disepakati:

- **Crash-recovery:** flag "unclean shutdown" di `project.db` → startup
  tawarkan restore dari backup terakhir (mekanisme backup/restore sudah ada,
  P0 done). Perlu keputusan UX kecil: dialog tawar-restore vs otomatis.
- **Portable project export:** format yang diusulkan = ZIP berisi
  `project.db` + file sumber + manifest (konsisten dengan format backup
  existing), bukan bundle Parquet. Perlu persetujuan format sebelum G6 mulai.

## Rekomendasi urutan keseluruhan

1. **Pemilik push manual** (3 commit tertunda; hulu repo sudah tuntas).
2. **Beli Apple Developer Program** (US$99) — membuka P4-4 macOS.
3. **Pilih opsi Windows** → P4-4 `in_progress`.
4. **Setujui G6** (Velopack + format portable export ZIP) → NXT/G6 card mulai.
5. G5 Arrow IPC **tidak** masuk daftar — trigger terukur tidak terpenuhi,
   margin 26 KB, ratchet NXT-3 memantau.

Sampai pemilik memilih, tidak ada kode yang perlu ditulis — posisi saat
ini (Beta-ready unsigned, JSON IPC, ratchet aktif) adalah posisi stabil.
