# Baseline Freeze v1.0 — Decision Register

**Status: `Ratified (PO)` — 2026-11-05**
**Dasar:** Approved Documentation Baseline v1.0 (WP-24). Register ini meratifikasi baris-baris Proposed/OPEN per keputusan PO di Step 1. Baris yang tidak disebut di bawah tetap berstatus aslinya (Proposed/Deferred/OPEN) dan TIDAK dianggap confirmed.
**Sumber inventaris:** ekstraksi penuh docs 00–17 (2026-11-05). Proposal: `docs/BASELINE-FREEZE-PROPOSAL.md`.

## Register ratifikasi

| Paket | ID yang diratifikasi | Keputusan | Berlaku |
|---|---|---|---|
| A | IPC-001, IPC-002, IPC-003, IPC-004, IPC-005, IPC-010, IPC-011, IPC-012, SYS-016 (OD-1) | Bridge PyWebView = transport MVP; kontrak typed; Pydantic kanonis; TS digenerate (never hand-edit); envelope standar; handshake versi; dispatch terpusat thread-safe; reconnect via replay+rekonsiliasi | M1 |
| B | SYS-015, SYS-018 (prinsip) | JobManager backend-authoritative (frontend proyeksi); audit ≠ provenance ≠ telemetry, dikorelasikan by ID. Detail envelope field-level (F-02) = Phase 2 | M1 (015), M2 (018 detail) |
| C | SEC-004; SEC-012 (struktur record); SEC-011 (prinsip) (OD-4 sebagian) | Default-deny + fail-closed di trusted service boundary. Audit record terstruktur; mekanisme immutable/retensi deferred. Outbound terkendali; policy engine deferred | M1 (004), M1/M2 (012), M2 (011) |
| D | FE-002, FE-004, FE-006, FE-007, FE-010, UX-009, UX-010 (OD-4) | Struktur feature-oriented; server/UI/session state terpisah; Job Center; invalidasi event-driven; design system+token; notifikasi terpisah; progressive disclosure. Detail desain M2 | M1 (002,004), M1/M2 (lainnya) |
| E | FE-011; OD-9 A–D | React Hook Form. Type checker: **Pyright (strict)**; TS: **strict penuh**; generator Pydantic→TS: dipilih di ADR P1 dari `datamodel-codegen`-setara (kriteria: round-trip test + CI gate) | M1 |
| F | TST-001, TST-002, TST-003, TST-005, TST-006, TST-010, TST-011; TST-004, TST-007, TST-008, TST-009 (arah); OD-8 | Lapisan test; analytical correctness first-class; reference test statistik; mode exact/approx/sampled terbedakan; contract test IPC/plugin; failure kritis blokir rilis; coverage ≠ bukti kualitas. Gate merge: packaging (Doc14) ∧ test (Doc13) ∧ reliability (Doc15), tanpa waiver silang (IN-F) | M1–M3 |
| G | OD-5, OD-6, OD-10 | Traceability Doc00 §8.3 → MUST; SQLite WAL+FK → MUST; global store hanya bila kompleksitas terjustifikasi; health vocabulary kanonis = Doc15 §9.1 (IN-C resolved); work-item register `P0-WPnn` | M1 |
| H | REP-001–007, REP-011, REP-012 (OD-3) | Reporting = bounded context; shared spec; referensi artifact; HTML primer; PDF distribusi; freshness wajib; klaim kuantitatif bukti deterministik; export policy+klasifikasi; provenance immutable. Detail renderer/template deferred. XLSX (OD-12): hanya bila round-trip test lolos | M3 |
| I | PLG-011, PLG-012, PLG-013, AI-013, AI-014 (arah); F-01–F-05 | Capability default-deny; provenance eksekusi plugin; lifecycle UI host-controlled; AI tool via controlled service; AI provenance wajib. Ratifikasi formal + penutupan F-01–F-05 pasca-MVP | M3/post-MVP |

## Delegasi (J / OD-11) — ADR implementasi per modul, dengan batasan
UUID v7 untuk stable ID · SQLite stdlib + repository ringan (SQLAlchemy Core hanya bila ADR P1 membenarkan) · Parquet tanpa partisi kompleks di M1 · fingerprint SHA-256 konten · DDL/migrasi ditulis per modul di P1/P2. Angka numerik (coverage, perf budget, payload limit, retensi idempotency, tolerance epsilon, CSP, kuota) tetap Deferred sampai benchmark/ADR.

## Yang tetap TIDAK diratifikasi (berstatus asal)
SEC-013/SYS-019 detail, SEC-012 mekanisme immutable/retensi, semua Deferred Doc03 §11 / Doc04 §19 / Doc05 §21 / Doc09 §20 / Doc10 §22 / Doc12 §21 / Doc13 §24 selain yang disebut di atas, ES PROPOSED/OPEN di Doc17 §17 (kecuali yang promosinya diratifikasi di G), OD-7, OD-11 detail, OD-12 threshold final.

## Langkah berikut (Step 2, menunggu instruksi)
1. Commit baseline pertama (ES-4.10) — repo saat ini belum punya commit.
2. Scaffold M1: monorepo `backend/{domain,application,execution,infra,api}` + `frontend/src` + `tests/` sesuai kontrak yang baru diratifikasi (JobManager lifecycle Doc05 §8.2, ErrorContract, envelope IPC).
3. ADR P1 pertama: generator Pydantic→TS + ORM/repo + DDL modul Project/Dataset.
