# Baseline Freeze Proposal — Step 1 (Draft for PO Decision)

**Tanggal:** 2026-11-05
**Status:** `Proposed` — menunggu keputusan Product Owner. Dokumen ini TIDAK meratifikasi apa pun; ia hanya memetakan.
**Dasar:** Approved Documentation Baseline v1.0 (WP-24, via Doc17 §2.1) mengesahkan dokumen 01–16 sebagai baseline, tetapi **persetujuan dokumen ≠ persetujuan baris keputusan Proposed/Deferred/OPEN**. Baris-baris itu tetap berstatus aslinya sampai diratifikasi di sini.
**Sudah Approved (tidak perlu diputuskan ulang):** BUILD-001–030 (Doc14), OBS-001–020 (Doc15), PLG-001–010, AI-001–012, SEC-001,002,003,005–010,014,015, IPC-006–009, FE-001,003,005,008,009, UX-001–008,011, REP-008,009,010, SYS-001–014, IN-A (Polars), IN-G (metadata.json derived), IN-B (WCAG 2.2 AA).

---

## Ringkasan blokir

| Milestone | Yang memblokir |
|---|---|
| **M1** | Dokumen Draft (governance); SYS-015 (JobManager authority), SYS-016 (kontrak IPC), SEC-004/SYS-017 (default-deny); IPC-001–005, IPC-010, IPC-011; FE-002, FE-004; deferred: DDL SQLite, UUID/ULID, ORM/repo, UoW, Parquet partitioning/kompresi, fingerprint, manifest schema; tooling OD-9 (type checker, TS strictness, generator Pydantic→TS); ES-4.10 (repo belum ada commit baseline) |
| **M2** | F-02 (Shared Provenance Envelope field-level, Phase 2); SYS-018 (audit≠provenance≠telemetry); FE-006, FE-007, FE-010, FE-011 (penuh), UX-009, UX-010; deferred Doc05 §21 (worker pool, scheduler fairness, cost model, method registry, cancellation, recovery); TST-002–005,008; OD-4, OD-5 (promosi) |
| **M3** | SEC-012 (audit), SEC-013/SYS-019 (export), REP-001–007,011,012; SEC-011 (network); backup incremental, enkripsi-at-rest; TST-009,010; gate merge OD-8; XLSX kriteria OD-12; target numerik perf/coverage |
| **Post-MVP** | PLG-011–013 + F-01–F-05, AI-013, AI-014 (detail), marketplace, remote exec, RAG, kolaborasi, cloud, full ML |

## Paket keputusan (OD register Doc17 §17.1)

| Paket | ID | Rekomendasi | Alternatif | Efek jika ditunda |
|---|---|---|---|---|
| **A. Fondasi IPC** | OD-1: IPC-001–005, IPC-010–012 + SYS-016 | **Ratifikasi sekarang.** Tanpa ini scaffold M1 tidak punya kontrak. | Ratifikasi sebagian (001–005 saja, tunda 010–012) | M1 blokir total |
| **B. Otoritas eksekusi** | SYS-015, SYS-018 | **Ratifikasi SYS-015 sekarang** (JobManager backend-authoritative). SYS-018 ratifikasi prinsip, detail envelope (F-02) Phase 2. | Tunda keduanya | M1 JobManager + M2 artifact tanpa otoritas |
| **C. Keamanan MVP** | SEC-004, SEC-012 dasar, SEC-011 | **Ratifikasi SEC-004 sekarang** (default-deny, fail-closed — wajib MVP Doc11 §19). SEC-012 ratifikasi struktur record, tunda mekanisme immutable/retensi. SEC-011 ratifikasi prinsip, tunda policy engine. | Tunda semua | M1 tanpa enforcement; risiko retrofit keamanan |
| **D. Frontend** | OD-4: FE-002, FE-004, FE-006, FE-007, FE-010, UX-009, UX-010 | **Ratifikasi FE-002 + FE-004 sekarang;** FE-006/007/010 + UX-009/010 ratifikasi arah, detail desain M2. | Tunda semua ke M2 | M1 scaffold form/state tanpa struktur |
| **E. Form & tooling** | FE-011 (React Hook Form), OD-9 A–D | **Ratifikasi FE-011.** OD-9: putuskan 4 pilihan independen sekarang — rekomendasi: Pyright (strict), TS strict penuh, generator `datamodel-codegen`/`openapi-typescript`-setara untuk Pydantic→TS. | Tunda tooling ke implementation ADR | M1 scaffold tanpa standar tipe |
| **F. Testing & gate** | OD-2: TST-001–011 + OD-8 (gate merge) | **Ratifikasi TST-001,002,003,005,006,010,011 sekarang;** TST-004,007,008,009 arah M2/M3. OD-8: precedence Doc14 (packaging) > Doc13 (test) > Doc15 (reliability), tidak ada waiver silang (IN-F). | Tunda | M1 tanpa gate; M3 tanpa kriteria rilis |
| **G. Promosi & tata kelola** | OD-5, OD-6, OD-10 | **Ratifikasi:** traceability Doc00 §8.3→MUST (ringan), SQLite WAL+FK→MUST, Zustand rule (global store hanya bila kompleksitas terjustifikasi), health vocabulary kanonis Doc15 §9.1 (IN-C), work-item register `P0-WPnn`. | Tunda | IN-C/IN-F tetap FLAG; drift implementasi |
| **H. Reporting/export** | OD-3: REP-001–007,011,012 | **Ratifikasi arah sekarang** (M3 butuh kontrak), detail renderer/template deferred. Tunda OD-12 (XLSX) dengan kriteria sementara: XLSX hanya bila round-trip test lolos. | Tunda ke M3 | M3 kontrak report/export belum ada |
| **I. Plugin & AI** | PLG-011–013, AI-013, AI-014, F-01–F-05 | **Kunci arah saja** (default-deny capability, provenance wajib, tool via controlled service); ratifikasi formal + penutupan F-01–F-05 pasca-MVP. | Ratifikasi penuh sekarang (berat) | Arah tidak terkunci; risiko desain plugin/AI menyimpang |
| **J. Detail teknis terbuka** | OD-11 (UUID/ULID, ORM, DDL, Parquet, fingerprint, cache, method registry, dst.) | **Delegasi ke ADR implementasi per modul** dengan batasan: UUID v7 untuk stable ID, SQLite stdlib + repository tanpa ORM berat (atau SQLAlchemy Core — dipilih di ADR P1), Parquet tanpa partisi kompleks di M1, fingerprint SHA-256 konten. Jangan ratifikasi detail di freeze ini. | Ratifikasi detail lengkap sekarang (lambat) | Detail memblokir implementasi modul spesifik, bukan M1 |

## Konstanta yang TIDAK diputuskan di freeze ini (sengaja)
Coverage threshold, perf budget numerik, payload limit per endpoint, retensi idempotency, tolerance epsilon statistik, CSP directive eksak, kuota observability, PDF engine — semua deferred ke benchmark/ADR (Doc13 §24, Doc12 §21, Doc10 §22). Freeze ini mengunci *kontrak & otoritas*, bukan angka.

## Langkah setelah keputusan
1. Tulis `BASELINE-FREEZE-v1.0.md` (register final: ID, keputusan, tanggal, penanggung jawab).
2. Tandai baris Proposed→Confirmed di dokumen pemilik (atau lampirkan ADR tracker di repo).
3. Commit baseline pertama — prasyarat ES-4.10 — sebelum scaffold M1.
