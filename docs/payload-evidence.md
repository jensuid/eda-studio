# Bukti Pengukuran Payload IPC — Trigger ADR-003 (NXT-3)

Tanggal: 2026-11-07 · Sesuai roadmap: ukur dulu sebelum putuskan G5 (Arrow IPC).

## Metode

`tools/benchmark.py --payloads [rows] [out_json]` — menjalankan skenario
sandbox dari `make_bridge` (sama seperti `test_ipc_*`) pada dataset
sintetis deterministik (`id, x, y, cat`, seed 42) dan mengukur bytes
**envelope respons serialised** (`len(json.dumps(res).encode("utf-8"))`),
yaitu persis yang melintasi boundary pywebview ke frontend. Jalur yang
diukur: semua query/command payload-aggregate yang ada — `preview`
(cap 200 baris), `histogram` (cap 30 bin), `bivariate` (cap scatter
2000), `quality`, `readiness`, `cleaning.preview`, `export`, `report`,
`provenance`, `profiles`, `snapshots`, `findings`, `chart.spec.list`,
`plan.list`.

Trigger yang dibandingkan: **>100 KB dalam satu respons IPC**
(`TRIGGER_BYTES = 100 * 1024` di `tools/benchmark.py` — konvensi KiB
repo, konsisten dengan `PLAN_MAX_SPEC_BYTES = 50 * 1024`).

## Hasil (10.000 baris, = skala CI)

| Respons | Bytes | % trigger |
|---|---:|---:|
| dataset.bivariate.run (scatter ≤2000) | 101,404 | 99.0% |
| dataset.preview (limit 200) | 15,986 | 15.6% |
| dataset.readiness.run | 4,385 | 4.3% |
| dataset.quality.run | 3,181 | 3.1% |
| dataset.histogram.run | 1,476 | 1.4% |
| dataset.report.generate | 1,286 | 1.3% |
| dataset.profile.run / .get | 1,262 | 1.2% |
| dataset.provenance | 1,097 | 1.1% |
| dataset.export (csv) | 586 | 0.6% |
| sisanya 11 jalur | ≤ 410 | ≤ 0.4% |

## Hasil (100.000 baris, 10× lipat)

**Ukuran praktis datar** — hanya berubah ±30 B (variasi shortest-repr
float dari sampling): scatter 101,405 B, preview 15,987 B, readiness
4,403 B, quality 3,207 B, histogram 1,793 B. Payload agregat tidak
tumbuh seiring baris karena cap sudah menahan semua jalur.

## Verdict: trigger TIDAK terpenuhi (sempit), G5 tetap ditunda

- Max terukur **101,405 B** < trigger 102,400 B — margin hanya **995 B
  (0.97%)**.
- **Peringatan structural**: payload scatter ≈ 101 KB adalah nilai
  *tetap struktural* (cap 2000 titik × ±50 B/titik JSON shortest-repr) —
  ia duduk **di batas trigger by-design**. Setiap penambahan kecil
  (cap scatter naik sedikit, atau data float dengan repr lebih panjang)
  langsung menembus trigger. Jalur lain jauh dari trigger (≤16%).
- Implikasi untuk G5: ketika trigger benar-benar terpenuhi, Arrow IPC
  hanya perlu untuk **jalur scatter** — bukan migrasi umum. Sampai itu
  terjadi, pengukur ini menjaga trigger tetap teramati (step CI
  `Payload measurement` di job `benchmark`, mengunggah
  `dist/payload.json`).
- Catatan ambiguitas: jika "100 KB" diartikan desimal (100,000 B),
  trigger sudah terpenuhi di 10k/100k (±1,4% di atas). Dokumen ini memakai
  konvensi KiB repo; verdict formal di atas memakai angka itu. Perbedaan
  interpretasi dicatat agar pemilik dapat memutuskan.

## Reproduksi

```bash
.venv/bin/python tools/benchmark.py --payloads 10000 /tmp/p.json
.venv/bin/python tools/benchmark.py --payloads 100000 /tmp/p.json
```

## Addendum NXT-4 (2026-11-07): cap scatter 2000 → 1500

Mitigasi pemilik: cap scatter bivariate diturunkan ke 1500 titik
(`backend/bivariate.py` `_SAMPLE_MAX`, `backend/contracts.py`
`_BIVAR_SAMPLE_MAX`). Re-ukur 10.000 baris:

- scatter ≤1500: **76,182 B (74.4% trigger)**, margin kini **26,218 B**
- Jalur lain tidak berubah (preview 15,986 B adalah terbesar berikutnya)

Margin trigger kembali nyaman (≈26 KB, bukan <1 KB). Cap adalah kontrak:
menurunkannya tidak memerlukan amandemen ADR-003. Catatan: bentuk endpoint
tidak berubah — `sampled` flag dan `sample_size` tetap mengumumkan
sampling, tidak ada downgrade diam-diam.
