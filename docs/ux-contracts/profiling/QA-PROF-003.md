# QA-PROF-003 — Critic Visual QA: history + snapshots (close O3)

## Scope
- Screenshot evidence (PO-supplied desktop, 2026-11-05): `history-snapshots.png`
  — sections Profiling, Riwayat Profiling (2), Snapshots (1).
- Closes O3 di QA-QUAL-001.

## Findings (Critic)

| # | Check | Result |
|---|-------|--------|
| 1 | Profiling table: 3 kolom (id/region/sales), status `ok` teks | **PASS** — sel kosong sesuai tipe (numeric: Top kosong; categorical: Min/Max/Mean kosong) |
| 2 | "Riwayat Profiling (2)": 2 entri, masing-masing tombol Buka | **PASS** — setiap run menambah riwayat (terverifikasi PO) |
| 3 | Fingerprint terlihat untuk perbandingan (identik `8870677b56a7…` di kedua entri) | **PASS** — mudah dibaca sebagai snapshot sama |
| 4 | "Snapshots (1)": nama dataset + snapshot id + rows + fingerprint | **PASS** |
| 5 | Layout single column, section berurutan jelas, tidak ada overflow | **PASS** |

## Observations (non-blocking, sama keluarga O1/O2)

- Tabel profiling juga gaya default browser: header center, status teks
  polos (belum badge DS-CORE), kolom numerik tidak rata kanan. Polish
  bertoken di M3 bersama QA-QUAL-001 O1.
- Entri riwayat yang fingerprint-nya identik tampil sebagai 2 baris
  terpisah tanpa penanda "sama dengan sebelumnya". Bukan bug (setiap run
  adalah record tersendiri); pertimbangkan label pembanding di iterasi
  berikut bila PO menginginkan.

## Verdict
**G6 visual PASS** untuk history + snapshots. O3 **CLOSED**.
