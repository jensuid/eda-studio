# Operational Runbook (M3 P2)

Operasional harian untuk pengguna/operator EDA Workbench.

## Backup & restore

- Backup: UI "Backup & Restore" → isi path file (mis. `backup.edaworkspace`) → **Buat Backup**.
  Format: ZIP berisi `project.db` (disalin via SQLite Backup API) + `snapshots/` + `manifest.json` dengan SHA-256 per-file (Doc04 §12).
- Restore: isi path backup + folder tujuan **baru/kosong** → **Restore**.
  Restore selalu ke lokasi baru; proyek asal tidak disentuh. Validasi manifest + checksum + `PRAGMA integrity_check`/`foreign_key_check` sebelum instal.
- Kegagalan umum: destinasi sudah ada / folder tujuan tidak kosong → pilih lokasi baru.

## Diagnostic bundle

- UI "Diagnostic Bundle" → isi path `diagnostic.zip` → **Buat Diagnostic**.
- Isi: `metadata.json`, `health.json`, `recent_errors.json`, `manifest.json` (Doc15 §10, Basic level).
- Redaction wajib: tanpa data mentah/sample rows, tanpa isi DB, tanpa kredensial, absolute paths di-redaksi. Bundle tidak di-upload ke mana-mana — pengguna yang membagikan.
- Jika bundle perlu dibagikan ke support: verifikasi checksum `manifest.json` terhadap file di dalam ZIP terlebih dahulu.

## SBOM & checksums

- Regenerate: `.venv/bin/python tools/generate_sbom.py [out_dir] [artefak ...]` → `sbom.json` (CycloneDX) + `checksums.txt`.
- Verifikasi artefak rilis: `shasum -a 256 -c checksums.txt`.

## Troubleshooting

| Gejala | Aksi |
|--------|------|
| Command gagal VALIDATION_ERROR | Baca `error.message` di IPC response; biasanya path tidak ada / payload kosong |
| NOT_FOUND | project/dataset/snapshot tidak ada di store; verifikasi `project_id`/`dataset_id` |
| CONFLICT | Transisi status Insight tidak sah menurut lifecycle; cek status saat ini |
| Backup/Restore gagal | Pastikan destinasi (baru) belum ada; restore tidak menimpa proyek asal |
| Diagnostic ditolak | Destinasi sudah ada → pilih path baru |
