# Document 17 — Engineering Standards & Conventions

**Version:** 0.7 (alignment to Approved Documentation Baseline v1.0 and explicit F-02 flag)
**Status:** Draft for Review — aligned to Approved Documentation Baseline v1.0; contents not approved
**Owner:** Engineering
**Authority:** Cross-cutting engineering standards and conventions

> This document is **not approved**. It is submitted as Draft for Review.
> Nothing in this document is an architectural decision. Every standard below is
> either (a) a restatement of an approved baseline requirement with a source
> citation, (b) a **Proposed** engineering convention awaiting Product Owner
> approval, or (c) an **Open** decision recorded for Product Owner direction.
>
> This document is a **companion document** to Approved Documentation Baseline v1.0. It is **not part of that baseline** and does not amend any canonical document.

---

# 1. Document Purpose and Scope

## 1.1 Purpose

Document 17 translates the approved architectural requirements of Documents 00–16
into actionable engineering standards and conventions for implementing EDA Workbench.
It is the canonical collection point for cross-cutting coding, testing, security,
documentation, and workflow standards.

## 1.2 In Scope

- Repository, Git, and code-review standards.
- Python and TypeScript/React engineering standards.
- Architecture and dependency-management rules at the coding level.
- IPC and contract implementation standards.
- Data-integrity, persistence, analytical-correctness, and reproducibility coding rules.
- Testing and verification standards and CI gate structure.
- Security, privacy, error-handling, and observability coding standards.
- Dependency and supply-chain engineering standards.
- Documentation standards for implementers.
- A register of Proposed conventions, Open decisions, and known documentation
  inconsistencies.

## 1.3 Out of Scope

- Architecture or product decisions (owned by Documents 01–16).
- Concrete values that no canonical document establishes: tool selections not yet
  ratified, numerical thresholds (coverage, tolerances, payload limits, budgets),
  naming conventions, and configuration contents. These are recorded as Proposed
  standards or Open decisions, never invented.
- Implementation of any standard.
- Modifying canonical documents.

## 1.4 Discovery Basis

Content was developed from Documents 00–16, the Engineering Standards Discovery
Reports v0.1/v0.2, and the repository-level `AGENTS.md`. Discovery reports and
`AGENTS.md` are supporting inputs, not substitutes for canonical architecture
sources. Each entry identifies whether its authority is a canonical requirement,
a proposed interpretation, an operational instruction, or an unresolved item.

**Citation caveat:** The citations enumerated in §18.2 were line-verified during
the drafting/audit passes described there. Other citations were carried forward
from document-level extraction and have not all been independently re-opened
and line-checked in this revision. They remain subject to source verification
before ratification. A citation is not represented as independently verified
merely because it appears in this document.

---

# 2. Authority and Relationship to Documents 00–16

## 2.1 Governance Basis

- Documents 01–16 are governed by **Approved Documentation Baseline v1.0**
  (WP-24 approval record and archive). `AGENTS.md` §2 is an operational reference,
  not a substitute for that approval record. Document 00 is the approved entry
  point and navigation guide.
- Individual revision headers may still read `Draft for Review — Revised for Review`
  because the revision files record their work-package provenance. Baseline
  authority is established by the WP-24 approval record, not by rewriting those
  historical file headers.
- **Document approval does not approve individual decisions inside a document.**
  Decision rows explicitly marked `Proposed`, `Deferred`, or otherwise pending
  retain that status. This document preserves those statuses verbatim and never
  treats them as approved.
- Where a canonical document uses permissive language ("recommended", "should",
  "may"), this document does not promote it to a MUST. Promotion, where desirable,
  is recorded as a Proposed standard or Open decision.

## 2.2 Ownership Boundaries

Document 17 has decision ownership over **nothing** that Documents 01–16 own. It
restates and operationalizes. Where this document and a canonical document differ,
the canonical document that owns the topic governs (Doc 00 **§8.2 Conflict
Resolution**, line 1263). Note that §8.2 additionally prescribes a conflict
*procedure* — identify the owner, confirm the conflict is real, check approved
decisions and ADRs, do not choose unilaterally ("jangan memilih implementasi
secara sepihak"), architecture review, ADR, then update affected documents —
which this document follows rather than resolving conflicts itself.

| Subject | Owning document | Doc 17 role |
|---|---|---|
| System layering, modules, anti-patterns | 02 | Restate as coding rules |
| Domain model, invariants, domain error taxonomy | 03 | Restate as coding/testing rules |
| Persistence, snapshots, artifacts, migration | 04 | Restate as implementation rules |
| Execution, statistical correctness, reproducibility | 05 | Restate as implementation rules |
| IPC envelopes, events, jobs, bridge security | 06 | Restate; preserve Proposed decision rows |
| Frontend architecture and standards | 07 | Restate as coding rules |
| UX/interaction obligations on implementers | 08 | Restate as implementation rules |
| Plugin contracts and isolation | 09 | Restate as implementation rules |
| AI governance constraints on code | 10 | Restate as implementation rules |
| Security, privacy, threat model | 11 | Restate as mandatory controls |
| Reporting and export | 12 | Restate; preserve Proposed decision rows |
| Testing architecture and tools | 13 | Restate; preserve Proposed decision rows |
| Build, packaging, distribution, CI/CD gates | 14 | Restate as workflow rules |
| Observability, logging, diagnostics | 15 | Restate as implementation rules |
| Git workflow, work items, ADRs, toolchain, DoD | 16 | Restate as process rules |
| Reporting/export product and architecture requirements | 12 | Preserve the owning document's detailed requirements; record only cross-cutting implementation implications here |
| Cross-cutting engineering conventions | **17 (this document)** | Home |

## 2.3 Relationship to AGENTS.md

`AGENTS.md` remains the agent operating instruction set (repo-level behavior rules).
It is not a canonical architecture document and this document does not change it.
Where a row relies on `AGENTS.md` (for example, strict typing or operational
handling rules), that origin is stated explicitly. Such a row is not represented
as a restatement of Documents 01–16; it remains Proposed unless independently
supported by an approved canonical requirement.

---

# 3. Standard Classification and Approval Rules

Every normative line in this document carries one of four statuses:

| Status | Meaning | Binding on implementation? |
|---|---|---|
| **STANDARD** | Direct restatement of an approved requirement in the 01–16 baseline (body text of an approved document, no Proposed-decision dependency) | Yes, as approved |
| **PROPOSED** | A convention or baseline-document decision row explicitly marked Proposed; recommended, awaiting approval | No — advisory until ratified |
| **OPEN** | No canonical answer exists or a conflict prevents a definitive standard; requires Product Owner direction | No — must not be silently decided by implementers |
| **FLAG** | A documented inconsistency between canonical sources requiring reconciliation (reported per `AGENTS.md` §2; never silently resolved) | No — surface and hold |

Approval rules:

1. A PROPOSED standard becomes STANDARD only by explicit Product Owner approval
   (or by ratification of the underlying decision row it depends on).
2. An OPEN decision is resolved only by Product Owner direction, recorded via an
   ADR where it touches architecture, contracts, persistence, or security
   boundaries (Doc 16 §16, approved).
3. Standards restate sources; they never extend scope. If a standard appears to
   add obligation beyond its source, it must be reclassified PROPOSED.
4. Conflicts marked FLAG remain conflicts until the owning document is amended
   with approval.

Standard identifiers use the form `ES-<section>.<number>` and are referenced in
the traceability matrix (§18).

---

# 4. Repository and Git Standards

| ID | Standard | Status | Source |
|---|---|---|---|
| ES-4.1 | Use Trunk-Based Development with short-lived feature branches; keep `main` buildable and testable; use feature flags for unfinished user-facing features; integrate changes frequently. | STANDARD | Doc 16 §11.1 (lines 1126–1146) |
| ES-4.2 | Branch prefixes: `feature/…`, `fix/…`, `refactor/…`. Doc 16 §11.2 introduces these under "Contoh:" (*Example:*) — exemplified conventions, not mandates. Adoption as a binding naming standard requires approval. | PROPOSED | Doc 16 §11.2 (verbatim "Contoh:") |
| ES-4.3 | All changes enter `main` through a pull request with review; direct pushes to `main` are not used. | STANDARD | Doc 16 §11 |
| ES-4.4 | PRs that change behavior must update affected documentation in the same change (Documentation-as-Code). | STANDARD | Doc 16 §16 |
| ES-4.5 | Significant architecture changes require an ADR ("wajib memiliki ADR"); ADR fields: Context/problem, Decision, Alternatives considered, Consequences/trade-offs, Status (Proposed/Accepted/Superseded/Deprecated). Architecture review is required ("diperlukan") for cross-module, security-boundary, persistence, IPC, and extension-contract changes. Scope limits from the same source: "ADR **tidak diwajibkan** untuk setiap perubahan kode" (Doc 16 §16, line 1364). | STANDARD | Doc 16 §16 (verbatim modal force: wajib/diperlukan) |
| ES-4.6 | Release branches are protected; CI/CD release permissions restricted; signing credentials protected; release publication leaves an audit trail. | STANDARD | Doc 14 §8.2 |
| ES-4.7 | Stable release publication requires explicit human approval; build, test, packaging, and verification are automated. | STANDARD | Doc 14 §15; Doc 16 §12 |
| ES-4.8 | Commit message format and PR template conventions. | OPEN | Not specified in any canonical document (Discovery PS-6). Requires Product Owner adoption. |
| ES-4.9 | Code review checklist derived from the six-dimension Definition of Done (§16). | PROPOSED | Derivable obligation from Doc 16 §7.1 ("dapat direview secara independen"); concrete checklist not yet authored. |
| ES-4.10 | Repository state note: the project currently has zero commits and no committed baseline; a first-baseline commit of docs and instructions is a prerequisite for branch-protection enforcement. Recorded for awareness; no action taken by this document. | OPEN | Observed repository state (verified 2026-10-31); Doc 14 §8.2 prerequisites |

---

# 5. Python Engineering Standards

## 5.1 Architecture and modularity coding rules

| ID | Standard | Status | Source |
|---|---|---|---|
| ES-5.1 | Follow the six-layer architecture; dependency direction: domain ⇏ presentation, domain ⇏ infrastructure implementations, infrastructure implements defined contracts, no circular module dependencies, application services coordinate cross-module work, shared utilities must not become an uncontrolled shared domain model. | STANDARD | Doc 02 §4, §5.3 |
| ES-5.2 | Each module owns its models, business rules, application-facing interfaces, validation rules, persistence abstractions, domain events, and **its tests**. Modules must not reach into another module's implementation internals. | STANDARD | Doc 02 §5.2 |
| ES-5.3 | Cross-context interaction uses application services, typed commands/queries, domain events, and stable typed references. Prohibited: sharing mutable ORM entities across contexts, importing another context's internal repository, global mutable state as integration mechanism, circular domain dependencies. | STANDARD | Doc 03 §5.1–5.2 (lines 923–944) |
| ES-5.4 | Application layer: no business rules belonging to the domain, no direct SQLite/Parquet access without abstraction, no internal Python objects sent to the frontend, no synchronous heavy computation in IPC calls; validates, authorizes, and translates errors to stable contracts. | STANDARD | Doc 06 §3.1 |
| ES-5.5 | Use the Composition Root with constructor injection pattern. | STANDARD | Doc 02 §2 decision **SYS-010** ("Dependency management \| Composition Root + Constructor Injection"); SYS-012 is "Analytical query engine \| DuckDB + Adaptive Processing" (table re-quoted in audit) |
| ES-5.18 | Prohibition of ambient-global / service-locator resolution as an inferred corollary of SYS-010. | PROPOSED | Derived interpretation of Doc 02 SYS-010; no explicit canonical wording (audit C-1/F finding) |
| ES-5.6 | Prohibited anti-patterns (12-item list), notably: no unrestricted Python execution through IPC, no whole-DataFrame JSON transfer, no analytical work on UI/bridge threads, no arbitrary cross-module state mutation, cache is never the authoritative analytical truth, subprocess is never treated as sufficient sandboxing, no silent exact→approximate substitution. | STANDARD | Doc 02 §16 |

## 5.2 Threading and execution rules

| ID | Standard | Status | Source |
|---|---|---|---|
| ES-5.7 | Bridge handlers perform parsing, validation, and dispatch only; handlers must not assume sequential invocation. Shared state requires explicit synchronization. Project writes go through the serialized write coordinator. | STANDARD | Doc 02 §7.4; Doc 06 §11 |
| ES-5.8 | Never run expensive analytical work on the UI or IPC request thread; long-running work is delegated to the Job Manager; avoid unbounded task creation, uncontrolled nested parallelism, and oversubscription; release temporary resources after execution. | STANDARD | Doc 02 §8; Doc 05 §9.2; Doc 06 §11 |
| ES-5.9 | Concurrency model per workload follows the approved mapping: AsyncIO (I/O orchestration), threads (blocking I/O), ProcessPool with spawn (CPU-intensive trusted work), isolated subprocess (third-party plugins/scripts), direct execution only when safe. | STANDARD | Doc 02 §8; Doc 05 §9.1 |
| ES-5.10 | Cancellation is cooperative at safe checkpoints; retries only for transient, idempotent-safe operations; retries bounded and recorded; non-idempotent external operations must not be blindly retried. | STANDARD | Doc 06 §7; Doc 05 §14.3 |

## 5.3 Typing and language conventions

| ID | Standard | Status | Source |
|---|---|---|---|
| ES-5.11 | Full type annotations for public and contract-facing functions, and the corresponding strict-typing rule, originate in `AGENTS.md` §7. Doc 07 §2 establishes Strict TypeScript for the frontend but does not independently establish the Python annotation rule. | PROPOSED (operational origin; no independent canonical Python requirement identified) | `AGENTS.md` §7; Doc 07 §2 (frontend-only counterpart) |
| ES-5.12 | Selection of the Python type checker (mypy **or** Pyright — Doc 13 §21 lists both unresolved) and its strictness level. | OPEN | Doc 13 §21, §24; Discovery OD-9. Not selected here. |
| ES-5.13 | Python version pinning: manifest-driven, explicit versions in reproducible environments (`pyproject.toml` + lockfile; runtime deps separated from dev deps). | STANDARD | Doc 16 §19; Doc 14 §3.2 |
| ES-5.14 | Plugin/extension manifest declares `python: ">=3.12"` compatibility metadata; whether 3.12 is the application-wide minimum baseline is not stated by any approved document. | OPEN | Doc 09 §5.2 (manifest example); Discovery register — minimum-version ratification needed |
| ES-5.15 | Naming conventions for files, modules, classes, functions, constants. | OPEN | Absent from all canonical documents (Discovery PS-1). Not invented here. |
| ES-5.16 | Explicit error handling; never weaken validation or tests to make an implementation pass. Authority is `AGENTS.md` §7 — an agent operating instruction, **not canonical baseline content** (per §2.3); the "no bare `except`" rule has no canonical source at all, and Doc 13 §2 supports only determinism ("Hindari flaky tests"), not exception style. Proposed for adoption as a canonical standard. | PROPOSED (operational origin) | `AGENTS.md` §7; Doc 13 §2 (partial, determinism only) |
| ES-5.17 | Formatter and linter selection and configuration (Doc 13 §21 proposes Ruff as replaceable tool; "Tools are replaceable; test contracts and verification objectives are the architectural commitments"). | PROPOSED | Doc 13 §21 (Proposed baseline; ratification is OD-2) |

---

# 6. TypeScript and React Engineering Standards

## 6.1 Architecture rules

| ID | Standard | Status | Source |
|---|---|---|---|
| ES-6.1 | Frontend architecture is organized into Application UI, Feature Modules, Shared UI & Design System, Application State, Frontend Services, and PyWebView Bridge. The frontend is not the place for analytical computation or business rules. The diagram documents the layers; a separate CI enforcement mechanism is not specified. | STANDARD (layering and responsibility boundary) | Doc 07 §1, §4 |
| ES-6.2 | Feature modules own their internals. Shared components must not depend on feature-specific business logic; shared primitives stay domain-agnostic. | STANDARD | Doc 07 §5, §12.2 |
| ES-6.3 | Component tiering: Primitives / Composed Components / Domain-oriented Components. Domain-oriented components may understand feature DTOs; shared primitives remain domain-agnostic. | STANDARD | Doc 07 §12.2 |
| ES-6.4 | All backend communication flows through the frontend IPC client abstraction; feature modules must not call `window.pywebview.api` directly. The frontend waits for `pywebviewready` before invoking bridge methods. Generated TypeScript contract types are a separate Proposed mechanism under IPC-004, not a binding consequence of the IPC-client rule. | STANDARD (IPC-client boundary and readiness) / PROPOSED (generated contract mechanism) | Doc 07 §9; Doc 06 §4.3, §6.2, §17 (IPC-004 Proposed) |
| ES-6.5 | State-ownership rules: backend is the sole source of truth for domain state; "Server state must not become an independent source of truth in the frontend"; frontend cache never replaces artifact persistence; cache keys include project and resource identity; reload must rebuild state from the backend; library choice "tidak boleh mengubah ownership rules". | STANDARD | Doc 07 §8.1, §8.4 closing sentence, §8.5 |
| ES-6.18 | The server/UI/session separation model and the usage pattern for TanStack Query/Zustand remain Proposed: Doc 00 §2.3 lists both libraries in the technical foundation, but Doc 07 §8.4 describes their use conditionally (TanStack Query "dapat digunakan"; Zustand "jika kompleksitasnya membenarkan") and FE-004, "Separate server, UI, and session state", remains Proposed in Doc 07 §18. Technology inclusion does not ratify the state-ownership pattern or mandatory library usage. | PROPOSED — pending FE-004 ratification (OD-4) | Doc 00 §2.3; Doc 07 §8.4, §18 (FE-004); Doc 02 §4 (descriptive layer listing) |
| ES-6.6 | The decision rule for "when complexity justifies" a global store. | OPEN | Doc 07 §8.4 conditional wording; Discovery O-27 carried |
| ES-6.7 | Event handling: deduplicate by event ID/sequence, reconcile after reconnect, refetch authoritative state on gaps; event handlers contain no backend business logic; events are never the sole state source ("Event delivery tidak boleh menjadi satu-satunya sumber state", Doc 06 §8.4 — must-level). Dependency note: the event-driven **cache invalidation** aspect maps to FE-007 (**Proposed**, Doc 07 §18) and is not STANDARD. | STANDARD (dedupe/reconcile/no-sole-source) with Proposed dependency noted (invalidation = FE-007) | Doc 07 §10.3, §18; Doc 06 §8.4 |
| ES-6.8 | Chart configuration is stored as a versioned backend artifact, not only ephemeral component state. ECharts is the primary chart engine. | STANDARD | Doc 07 §11.2, §18 (FE-008/009 Confirmed) |
| ES-6.9 | Frontend performance: no unbounded dataset rendering, bounded payloads only, avoid unnecessary React re-renders; numeric budgets deferred. | STANDARD (rule) / OPEN (budgets) | Doc 07 §11.3, §19 |

## 6.2 Styling, tokens, accessibility

| ID | Standard | Status | Source |
|---|---|---|---|
| ES-6.10 | Design-system adoption as a reusable CSS-token system: the governing decision row **FE-010 "Reusable design system with CSS tokens" is Proposed** (Doc 07 §18, verbatim), and the §3 styling row is descriptive and permissive ("CSS variables + CSS Modules **atau equivalent** scoped styling"). The token *category list* (Color, Typography, Spacing, Radius, Elevation, Motion, Layout, Data visualization) is documented in §12.1, and "Gunakan CSS variables sebagai runtime token layer" is imperative body text — binding the structure requires FE-010 ratification. Token values: deferred (OPEN, §19). | PROPOSED (system adoption) / STANDARD (category documentation only) / OPEN (values) | Doc 07 §3 (styling row), §12.1, §18 (FE-010 Proposed), §19 |
| ES-6.11 | Every interactive component considers Default/Hover/Focus/Active/Disabled/Loading/Error/Empty/Selected states; destructive or irreversible operations require explicit confirmation. | STANDARD | Doc 07 §12.2–12.3; Doc 08 §9 (risk matrix) |
| ES-6.12 | Accessibility minimums (approved body text): keyboard navigation, visible focus, semantic HTML, screen-reader labels, sufficient contrast, status never color-only, accessible dialogs/tables, textual alternatives for charts/tables, reduced-motion support. **Conformance target: UNRESOLVED** — Doc 01 §8.6 states "Target WCAG 2.2 AA" while Doc 08 §19 lists "Accessibility conformance target" among deferred items. Per Doc 00 §8.2, conflicts must not be picked unilaterally ("jangan memilih implementasi secara sepihak") and require architecture review + ADR; this document does not presume that procedure has run and therefore does not bind implementers to either answer. Target selection: PROPOSED, pending §8.2 procedure. | STANDARD (minimums) / PROPOSED (target binding) + FLAG (IN-B) | Doc 07 §15; Doc 08 §16; Doc 01 §8.6 (line 505); Doc 08 §19 (line 706); Doc 00 §8.2 |
| ES-6.13 | Localization architecture: externalized UI strings, locale-aware number/date formatting, configurable separators. Initial language and rollout are deferred. | STANDARD (architecture) / OPEN (rollout) | Doc 07 §15, §19 |

## 6.3 TypeScript language standards

| ID | Standard | Status | Source |
|---|---|---|---|
| ES-6.14 | Strict TypeScript is an approved frontend principle. Generated IPC contract types are described in the recommended strategy, while IPC-004 remains Proposed; generation must not be represented as an approved implementation mechanism until ratified. | STANDARD (Strict TypeScript) / PROPOSED (generated IPC types) | Doc 07 §2; Doc 06 §6.2, §17 (IPC-004 Proposed) |
| ES-6.15 | Concrete `tsconfig` strictness flags, `any` policy, and `type: ignore`/`ts-ignore` policy. | OPEN | Not parameterized in any canonical document (Discovery PS-3) |
| ES-6.16 | Component/file naming conventions and React code-style conventions (hooks rules beyond eslint defaults, prop patterns). | OPEN | Absent from canonical documents (Discovery PS-1) |
| ES-6.17 | Router library and route map; component library adoption vs custom primitives; visual theme. | OPEN | Doc 07 §19 (explicitly deferred) |

---

# 7. Architecture and Dependency Management Standards

| ID | Standard | Status | Source |
|---|---|---|---|
| ES-7.1 | The system remains one modular monolith with explicit contracts; no microservice decomposition for MVP. | STANDARD | Doc 02 §1.1, §16 |
| ES-7.2 | A CI mechanism such as import-graph or module-boundary checks could enforce documented dependency direction and layer boundaries. The canonical documents describe architecture boundaries but do not explicitly require this CI enforcement mechanism. | PROPOSED (enforcement convention) / OPEN (tool and configuration) | Doc 02 §5.2–5.3; Doc 07 §4; Discovery PS-2 |
| ES-7.3 | Plugin and future-runtime integrations use SDK contracts and controlled host APIs rather than importing internal application modules or directly depending on internal domain models. This rule is scoped to extension/runtime boundaries; it is not a blanket rule that every backend module exposes only application services. | STANDARD (extension boundary) | Doc 03 §2(9), Doc 09 §4, §6.2 |
| ES-7.4 | Optional integrations (cloud AI, remote databases, plugin repositories) must not block core EDA; core functionality remains available without them. | STANDARD | Doc 02 §3.2, §16 |
| ES-7.5 | Dependency updates enter the repository only through reviewed PRs and automated tests ("Dependency updates dilakukan melalui reviewed PR dan automated tests", verbatim, under the "Ketentuan:" list of the toolchain requirements). | STANDARD | Doc 16 §19 |
| ES-7.6 | The documented technical foundation includes PyWebView; React + TypeScript + Vite; Python; Apache ECharts; SQLite; Parquet; DuckDB; Apache Arrow; TanStack Query; and Zustand. Polars is included in the analytical baseline in Docs 01/05 but absent from the Doc 00 §2.3 summary and `AGENTS.md` §3 (IN-A). The listing of TanStack Query/Zustand does not independently prescribe a mandatory usage pattern or state-ownership architecture; FE-004 remains Proposed. React Hook Form appears in Doc 02 §4 but not in Doc 00 §2.3 and has no explicit decision row; its baseline status remains open for clarification (IN-H). | STANDARD (explicit Doc 00 technical foundation; Polars inclusion supported by Docs 01/05) / FLAG (IN-A) / OPEN (React Hook Form status, IN-H) | Doc 00 §2.3; Docs 01 §8.2/§9, 02 §2/§4, 05 §9.1/§11.2, 07 §3; `AGENTS.md` §3 (summary comparison only) |
| ES-7.7 | New dependencies or alternative technologies outside the approved baseline require justification and Product Owner approval. Authority is `AGENTS.md` §3 — an operating instruction, not canonical baseline content; recorded here as a proposed process standard pending PO confirmation (per §2.3 and audit finding F-9). | PROPOSED (operational origin) | `AGENTS.md` §3; Doc 16 §19 (adjacent) |

---

# 8. IPC and Contract Standards

## 8.1 Status note (governing constraint for this entire section)

Doc 06 is an approved baseline document, but its decision register marks **IPC-001
through IPC-005 and IPC-010 through IPC-012 as `Proposed`** (Doc 06:714–725,
line-verified). Only IPC-006 (Job Manager for long-running operations), IPC-007
(durable critical events + ephemeral progress), IPC-008 (bounded JSON/Arrow/
artifact references), and IPC-009 (no FastAPI REST for MVP) are `Confirmed`.
Per §2.1, the contract-shape standards below are therefore **PROPOSED**, pending
Product Owner ratification (Open decision OD-1 in §17), even though the *need* for
typed, validated, versioned contracts itself is an approved requirement of Doc 02 §7.3.

| ID | Standard | Status | Source |
|---|---|---|---|
| ES-8.1 | Every bridge operation has typed input, validated parameters, defined output, stable error representation, authorization checks, version compatibility, and request correlation. | STANDARD | Doc 02 §7.3 |
| ES-8.2 | Commands (state change) and Queries (retrieval) are separated; long-running operations return a `job_id` instead of blocking the bridge. | STANDARD | Doc 02 §7.2–7.3; Doc 06 IPC-006 Confirmed |
| ES-8.3 | Request/Response/Error/Event envelope schemas: `RequestEnvelope{request_id, protocol_version, command, payload, metadata}`; `ResponseEnvelope{request_id, success, data(DTO only), error, metadata}`; `ErrorContract{code, message, category, retryable, details, trace_id}`; `EventEnvelope{event_id, event_type, event_version, aggregate_id, sequence_number, occurred_at, correlation_id, payload}`. | PROPOSED (depends IPC-001–005) | Doc 06 §5.1–5.3, §8.2 |
| ES-8.4 | Pydantic as the canonical runtime schema source; TypeScript types are machine-generated from it, never hand-edited; CI detects contract drift; runtime validation stays at the Python boundary; only public application DTOs become frontend types. | PROPOSED (depends IPC-003/004) | Doc 06 §6.1–6.2, §16 |
| ES-8.5 | Protocol versioning classes: Additive / Breaking (requires migration or version increment) / Deprecated (with removal schedule); startup compatibility check mandatory. | PROPOSED (depends IPC-010) | Doc 06 §6.3 |
| ES-8.6 | Bridge surface: exactly four methods (`execute_command`, `execute_query`, `get_protocol_info`, `get_events`), kept thin — no domain or analytical logic in bridge methods. Method names themselves are "proposed public bridge contract". | PROPOSED | Doc 06 §4.2 |
| ES-8.7 | Exact bridge method naming convention. | OPEN | Doc 06 §18 (explicitly deferred); Discovery PS-1 |
| ES-8.8 | Payload policy: never serialize whole DataFrames through JSON IPC; small metadata → JSON DTOs; previews → bounded rows/columns; medium/large exchange → Arrow IPC; large results → artifact references; file payloads → filesystem references with controlled access. Frontend receives references and validated metadata, never unvalidated internal storage paths; file access only through backend-controlled operations. | STANDARD | Doc 06 §9 (IPC-008 Confirmed); Doc 04 §10.3 |
| ES-8.9 | Pagination requires bounded default page sizes, endpoint-specific maximums, opaque cursors, and explicit sorting/filtering. The `PageRequest`/`PageResponse` schema is an example rather than a selected contract shape; heavy queries may be redirected to background jobs. | STANDARD (pagination constraints) / PROPOSED (contract shape) / OPEN (per-endpoint limits) | Doc 06 §10, §18 |
| ES-8.10 | Events: versioned schemas, idempotent consumers, sequence tracking and deduplication, reconnection via replay + state reconciliation; MVP transport is in-memory bus + SQLite event store (no external brokers). | STANDARD (requirements); delivery detail Proposed (IPC-012) | Doc 02 §9.2; Doc 06 §8.3–8.4 |
| ES-8.11 | Commands that may be repeated after timeout or reconnect must have an idempotency policy, and command semantics must state whether they are idempotent. Using `request_id` as the correlation identifier, requiring idempotency keys for resource-creating commands, and storing prior command results are listed as recommendations; the exact retention policy is deferred. | STANDARD (idempotency-policy requirement) / PROPOSED (recommended mechanisms) / OPEN (retention) | Doc 06 §5.1, §13, §18; IPC-005 envelope decision remains Proposed |
| ES-8.12 | Selected Pydantic→TypeScript generator tool. | OPEN | Doc 06 §18 (deferred); Discovery OD-1 adjacency |
| ES-8.13 | Thread-safety and security rules for the bridge (validation as untrusted input, command allowlist, path/reference validation, size limits, no stack-trace leakage) are stated in Doc 06 body text as mandatory controls and also independently approved in Doc 02 §11.2 and Doc 11 §6–§7. They are therefore STANDARD regardless of the IPC decision-row ratification. | STANDARD | Doc 02 §11.2; Doc 06 §11–12; Doc 11 §6.1, §7 |

---

# 9. Data Integrity and Persistence Standards

| ID | Standard | Status | Source |
|---|---|---|---|
| ES-9.1 | Committed snapshots and materialized artifacts are immutable: never modified in place; reruns create new artifacts; annotation stored separately from execution evidence; logical identity distinct from physical storage identity even under deduplication. | STANDARD | Doc 04 §2.3, §6.2–6.3, §7.3 |
| ES-9.2 | Persistence ownership: domain contexts never manipulate SQLite connections or filesystem paths directly; repositories hide physical storage and raise typed persistence errors. | STANDARD | Doc 04 §8 |
| ES-9.3 | Crash-safe write protocol for multi-resource writes: Prepare → stage temporary payload → validate + checksum → commit metadata transaction → finalize payload → mark complete → cleanup; implementation must account for crash points between steps; idempotent recovery; orphan detection; committed metadata never points to an unverified payload. | STANDARD | Doc 04 §9 |
| ES-9.4 | Mandatory SQLite rules: large raw datasets and analytical payloads must not be stored as ordinary SQLite records; the write coordinator must serialize writes and avoid long-running transactions; analytical execution must never hold a SQLite write transaction open. Unit of Work practices such as respecting aggregate versions and not pretending SQLite plus filesystem operations form one native ACID transaction are stated as `should` guidance and are not promoted here. | STANDARD (SQLite rules) / PROPOSED (Unit of Work recommendations) | Doc 04 §5.1, §5.3, §8.2; Doc 02 §7.4, §10.2; Doc 06 §11 |
| ES-9.5 | Items under the Doc 04 §5.3 list are introduced as "**Recommended baseline:**" — WAL journal mode; foreign-key enforcement; independent short-lived read operations; bounded busy timeout and retry policy; controlled WAL checkpointing; explicit transaction boundaries; optimistic concurrency for mutable aggregates (Doc 03 §9 further hedges: "where appropriate"); coordinated backup via SQLite Backup API. These are recommendations, not MUST-worded requirements, and are **not** promoted by this document. | PROPOSED (promotion pending) | Doc 04 §5.3 ("Recommended baseline:"; direct source check); Doc 03 §9 ("where appropriate"; direct source check); Doc 02 §10.2 (modal-free corroboration) |
| ES-9.6 | Migrations: SQLite schema changes only via versioned, ordered migrations with compatibility checks, backup before high-risk migration, post-migration integrity validation, documented rollback limits. Dataset schema evolution: new schema version per change, old snapshots preserved, change detection, downstream impact assessment, user review when semantics uncertain. | STANDARD | Doc 04 §14 |
| ES-9.7 | Fingerprints: content fingerprint (integrity/dedup) and schema fingerprint (schema-change detection) are both mandatory concepts; the algorithm is explicitly deferred. | STANDARD (concept) / OPEN (algorithm) | Doc 04 §6.3, §19 |
| ES-9.8 | Cache is disposable and never authoritative. Exact, approximate, and sampled results must not share an indistinguishable cache identity. Doc 04 says cache identity should include relevant dependencies such as snapshot/view revision, pipeline revision, query specification, method/parameters, schema/semantic version, engine/library versions, and execution mode; that recommended field list is not promoted to MUST. | STANDARD (non-authoritative cache and distinct execution-mode identity) / PROPOSED (recommended cache-key fields) | Doc 04 §11.2–11.3; Doc 05 §16 |
| ES-9.9 | Imported packages/files are untrusted: validate entries before extraction, prevent path traversal, enforce size/type limits, never auto-execute imported content, preserve the original package on failed import, portable relative paths as primary identity. | STANDARD | Doc 04 §13.3; Doc 11 §9.2 |
| ES-9.10 | Integrity detection duties: detect missing payloads, checksum mismatches, corrupt Parquet, invalid references, orphans, interrupted operations, incomplete migrations, and unclean shutdown; never silently overwrite known-good payloads or change a dataset source; preserve evidence, record recovery actions, and surface unresolved problems. Suspicious files may be quarantined where appropriate; quarantine is not an unconditional action for every integrity issue. | STANDARD (detection and recovery rules; quarantine is conditional) | Doc 04 §12.3, §15 |
| ES-9.11 | Project isolation: cross-project access is never implicit; per-project owned storage. | STANDARD | Doc 04 §4.1; Doc 02 §10.1 |
| ES-9.12 | Versioned ZIP-based `.edaworkspace` package is the export format; internal package layout details deferred; export profiles must state explicitly what is included/excluded. | STANDARD (format) / OPEN (internals) | Doc 04 §13.1–13.2; Doc 12 §13; Doc 12 §21 |

---

# 10. Analytical Correctness and Reproducibility Standards

| ID | Standard | Status | Source |
|---|---|---|---|
| ES-10.1 | Correctness first: never silently trade correctness for performance; no silent downgrade of exact work to approximate/sampled work; a semantics-altering execution-mode change requires user approval. | STANDARD | Doc 05 §2.3, §5.5, §10.3; Doc 15 §15.3; Doc 02 §16(11) |
| ES-10.2 | Approximation and sampling are explicit and recorded: method, parameters, error characteristics; sampling records strategy, size, and seed where applicable. | STANDARD | Doc 05 §2.4, §5.5, §15 |
| ES-10.3 | Statistical methods carry explicit contracts: method_id + version, input/output schemas, parameter schema, data-type requirements, statistical assumptions, exactness/approximation behavior, resource profile, limitations; a method must not silently change when an assumption fails. | STANDARD (rule) / OPEN (registry schema) | Doc 05 §13.1–13.2, §21 |
| ES-10.4 | Statistical result contract fields: statistic, p-value, effect size, confidence interval, sample size, degrees of freedom, method + version, assumption results, execution mode, multiple-testing adjustment, limitations, input provenance; unavailable/inapplicable values represented explicitly; statistical significance never presented as practical importance or causality. | STANDARD | Doc 05 §13.3 |
| ES-10.5 | Reproducibility is metadata-complete provenance: every completed execution records inputs, configuration, schema fingerprints, method + version, engine/library versions, backend, execution mode, seed, artifact references, and validation outcome. Bit-for-bit determinism is explicitly out of scope; seed-discipline guarantees beyond "where applicable" remain open. | STANDARD (record level) / OPEN (determinism guarantees) | Doc 05 §15; Discovery §3.9 note |
| ES-10.6 | Pipeline execution discipline: pipeline revision fixed per execution; operations run in declared dependency order; DAG cycles rejected; failures preserve the original input; dependent tasks blocked on failure; re-execution preserves logical-plan identity while creating new execution records. | STANDARD | Doc 05 §7.2, §12.2 |
| ES-10.7 | Approval discipline: approval binds to a specific plan revision; editing an approved plan invalidates approval; data-changing transformations require their own approval separate from plan approval; no silent execution of source-data-changing plans. | STANDARD | Doc 05 §6.2; Doc 08 §6.2–6.3 (UX-005/006 Confirmed) |
| ES-10.8 | Cache hits are observable in execution metadata and never presented as newly executed calculations; stale entries rejected and rebuilt. | STANDARD | Doc 05 §16 |
| ES-10.9 | Output schema validation is required for each transformation operation. Comparing row count and relevant quality metrics is optional (`may`). Whether additional quality checks beyond the required output-schema validation should be mandatory is not specified and remains open. | STANDARD (output-schema validation) / OPEN (additional universal quality checks) | Doc 05 §3, §12.2 |
| ES-10.10 | Numerical tolerance framework: method-appropriate tolerances distinguishing exact equality (discrete/deterministic), absolute tolerance (near zero), relative tolerance (scale-dependent); "Tolerance must not be so broad that incorrect results pass". Concrete epsilon values, per-method tolerance ownership, and versioning: none exist; the framework itself sits in proposed TST rows. | PROPOSED (framework) / OPEN (values, ownership) | Doc 13 §6.3 (TST-003 Proposed); Doc 05 §20; Discovery PS-5 |
| ES-10.11 | Reference-data validation obligation: "Statistical implementations must be validated against" established mathematical definitions, trusted reference implementations, and known expected outputs; exact vs approximate vs sampled behavior distinguished; method assumptions and edge cases covered. (Doc 05 §20 Correctness list — approved body text.) | STANDARD | Doc 05 §20 |
| ES-10.13 | Reference-test framework specifics (Doc 13 §6.1–6.2): reference-implementation choices, enumerated edge-case catalog, and the rule "Expected behavior must be explicit: valid result, warning, or controlled error" — governed by **TST-003 (Proposed)** (Doc 13 §23). | PROPOSED | Doc 13 §6.1–6.2, §23 |
| ES-10.12 | AI never computes quantitative truth: quantitative results come from the deterministic engine; AI output is distinguishable, evidence-referenced, never a security authorization, never silently a confirmed conclusion; AI never executes arbitrary generated code outside a controlled pathway. | STANDARD | Doc 10 §2, §10–§12, §17, §19 (AI-001–012 Confirmed); Doc 05 §18.1; Doc 03 §4.9 |

---

# 11. Testing and Verification Standards

## 11.1 Status note

Doc 13 is an approved baseline document whose **entire decision register
(TST-001 through TST-011) is marked `Proposed`** (Doc 13:1147–1157, line-verified)
and whose tool list is self-described "Proposed baseline… replaceable" (Doc 13 §21).
Accordingly, the testing architecture below is **PROPOSED** as decisions, while the
*testing obligations that Doc 05 §20, Doc 06 §16, Doc 07 §17, Doc 09 §17, and
Doc 11 §18 state in approved body text* are STANDARD as obligations. Ratification
of the testing package is Open decision OD-2.

## 11.2 Test-level obligations (cross-document)

| ID | Standard | Status | Source |
|---|---|---|---|
| ES-11.1 | Verification is a per-module responsibility; modules own and maintain verification for their behavior. The detailed test-layer taxonomy (unit, contract, integration, E2E, property-based, differential, performance, security, cross-platform, and manual exploratory) is a proposed testing-architecture package, not a binding layer mandate from this row. | STANDARD (module responsibility) / PROPOSED (test-layer taxonomy; TST-001) | Doc 02 §5.2; Doc 13 §4, §23 |
| ES-11.2 | CI obligation (must-worded, verbatim): "CI **harus** mendeteksi perubahan contract yang breaking dan memastikan generated TypeScript types tetap sinkron." Mechanism dependency: the generated-type sync presupposes IPC-004 (Generated TypeScript contract types = **Proposed**, Doc 06 §17); the obligation stands, the mechanism is conditional on OD-1 ratification. | STANDARD (obligation; mechanism conditional on OD-1) | Doc 06 §16, §6.2 |
| ES-11.21 | Nine-level IPC/bridge test matrix (contract, unit handlers, integration, bridge/thread-safety, events, jobs, security, E2E, recovery): Doc 06 §16 presents this as an unlabeled, modal-free table ("|Test Level|Focus|") — a documented expectation, not an explicit mandate. | PROPOSED | Doc 06 §16 |
| ES-11.3 | Critical frontend workflows must have E2E coverage: create/open project, import dataset, inspect profile, review quality, approve/apply transformation, run analysis, inspect findings/artifacts, and generate report. The unit/component/contract/integration/visual/performance/accessibility test-level table is a documented strategy without explicit mandatory modal force; retain it as Proposed test-architecture guidance. | STANDARD (critical-workflow E2E obligation) / PROPOSED (test-level taxonomy and tooling) | Doc 07 §17; Doc 13 §11 (TST-001 Proposed) |
| ES-11.4 | Analytical correctness suite: reference datasets, known outputs, tolerances, exact-vs-approx-vs-sampled distinctions, edge cases; differential testing (DuckDB vs Polars vs Python vs SQL-equivalent); property invariants (row-count preservation under sort/filter, serialization round-trip, deterministic repeat) with bounded inputs and reproducible seeds. | PROPOSED (TST-002/004/005) resting on approved Doc 05 §20 obligation | Doc 13 §6–§8; Doc 05 §20 |
| ES-11.5 | Proposed persistence/integrity test scenarios include migrations and rollback, WAL/concurrency/crash recovery, backup/restore, Parquet partial-write recovery, atomic publication, path-traversal rejection (including malicious archives), cache invalidation, and stale-reuse rejection. Doc 04 specifies integrity and recovery behaviors, but this entry does not infer a separate mandatory test-suite obligation from those detection/recovery requirements. | PROPOSED (test scenarios and suite design) | Doc 13 §9; Doc 04 §9, §15 (behavioral requirements only) |
| ES-11.6 | Security tests run **continuously during development and release validation** across the 12 enumerated areas; must include both expected-denial and valid-authorized-access paths. | STANDARD | Doc 11 §18; Doc 13 §15 |
| ES-11.7 | Plugin QA matrix covering contract, unit, integration, compatibility, isolation, resource, failure, security, and reproducibility tests is documented as a test-level matrix without explicit mandatory modal force. Official plugins should pass platform-defined compatibility and security checks before release; third-party plugins should display trust and verification status. | PROPOSED (test matrix and should-level release/display expectations) | Doc 09 §17 |
| ES-11.8 | E2E discipline: controlled sample datasets, isolated temp dirs, deterministic fixtures, mock AI providers; real external AI/network services not required for routine E2E. | PROPOSED (TST-008 + should-wording) | Doc 13 §16.2 |
| ES-11.9 | Cross-platform rule: a feature is not production-ready merely because it passes on one OS; Windows/macOS/Linux tested throughout development, not only before release. | STANDARD (Doc 02 §14.2 body) + PROPOSED (TST-009) | Doc 13 §17; Doc 02 §14.2 |
| ES-11.10 | Unit-test discipline: independent, deterministic inputs, no hidden shared state, no real network, success and failure paths, test externally observable behavior not implementation details, controlled fakes/mocks at seams. | PROPOSED (Doc 13 §5 should-rules) — consistent with approved Doc 06 §16 scope | Doc 13 §5.2–5.3 |
| ES-11.11 | Test-data governance: six fixture categories, no confidential production data, synthetic/licensed data preferred, fixture provenance recorded, generated datasets deterministic, fixtures separated from user data. | PROPOSED (Doc 13 §18 rules; register-level retention deferred §24) | Doc 13 §18, §24 |
| ES-11.12 | Tool baseline: pytest, Hypothesis, Ruff, mypy-or-Pyright, Vitest + React Testing Library, Playwright (PyWebView integration deferred), SciPy references, pip-audit, pytest-benchmark. Governing quote: "Tools are replaceable; test contracts and verification objectives are the architectural commitments." | PROPOSED — ratification required; the mypy/Pyright either-or remains OPEN | Doc 13 §21, §24; Discovery OD-2/OD-9 |
| ES-11.13 | Coverage thresholds: none approved; "Coverage percentage is a diagnostic metric, not proof of correctness" (TST-011 Proposed); §24 defers thresholds explicitly. Any numeric gate is a **new Product Owner decision**. | OPEN | Doc 13 §20.2, §24 |

## 11.3 CI verification gates

| ID | Standard | Status | Source |
|---|---|---|---|
| ES-11.14 | PR validation: lint/format, type checking, unit tests, security checks, relevant integration tests; critical analytical correctness tests must not be skipped. | STANDARD | Doc 16 §12; corroborated by Doc 13 §19.1 (Proposed detail) |
| ES-11.15 | Main-branch and release gates are defined in three overlapping lists (Doc 13 §19.2–19.3 Proposed; Doc 14 §15.2 Approved; Doc 15 §21.3 Approved) with no stated precedence. A single canonical merged gate table is proposed; precedence among the existing gate lists remains open. | Merged-table composition PROPOSED; precedence resolution OPEN | Doc 13 §19; Doc 14 §15.2; Doc 15 §21.3; Discovery OD-8 / IN-F |
| ES-11.16 | Approved release blockers (standalone): critical test failure, native dependency verification failure (PyWebView, DuckDB, Polars, Apache Arrow), package integrity or signing verification failure, incomplete compatibility manifest, required platform smoke-test failure. | STANDARD | Doc 14 §15.2–15.3, §4.2 |
| ES-11.17 | Approved observability-related release gates: recovery, data-integrity, redaction, audit-integrity, no-silent-downgrade, overhead within documented targets (or documented exception), graceful degradation. | STANDARD | Doc 15 §21.3 |
| ES-11.18 | Release block on unresolved critical analytical correctness or security failures. | PROPOSED as TST-010; directionally consistent with approved Doc 16 §12/§17 ("Security, data integrity, analytical correctness… tidak boleh dikorbankan") | Doc 13 §19.3; Doc 16 §12, §17 |

## 11.4 Verification quality targets

| ID | Standard | Status | Source |
|---|---|---|---|
| ES-11.19 | Documented initial engineering targets: warm application startup ≤ 5 seconds; basic IPC round-trip p95 ≤ 200 ms; observability overhead ≤ 5% CPU "on representative workloads"; silent data corruption "Zero known occurrences". Binding status: **documented targets and revalidation basis only** — verbatim: "These are initial engineering targets, not universal performance guarantees" (Doc 15 §16.2); §16.3 adds "Large-dataset execution must not be judged by a universal duration threshold." The "standard interactive UI action p95 ≤ 300 ms" figure is also explicitly listed in Doc 15 §16.2; all four numeric targets in this row are verified as initial targets, not universal guarantees or automatic pass/fail gates. | STANDARD (as documented targets, not pass/fail gates) | Doc 15 §16.2–16.3 |
| ES-11.20 | Performance budgets by dataset scale; product performance targets established via benchmark testing. | OPEN (deferred by own terms) | Doc 13 §24; Doc 01 §11.4, §12 |

---

# 12. Security and Privacy Standards

**Reporting/export ownership note:** Reporting and export behavior remains owned
by Doc 12. The few Doc 12-derived rows appearing elsewhere in this document are
cross-cutting constraints only; their presence is not an exhaustive extraction
of Doc 12's report-generation, renderer, format, or export-policy requirements.
Those detailed requirements must be implemented and verified against Doc 12
itself. Unresolved XLSX complexity wording is tracked as OD-12.

| ID | Standard | Status | Source |
|---|---|---|---|
| ES-12.1 | Every command and query is a security boundary; input is validated at IPC boundaries; frontend requests are treated as untrusted even though the frontend is bundled. Doc 11 §7 explicitly establishes the security boundary and required controls; Doc 06 §12 and Doc 02 §11.2 provide corroborating bridge-boundary controls. | STANDARD | Doc 11 §7; Doc 06 §12; Doc 02 §11.2 |
| ES-12.2 | Default deny and least privilege: access denied unless explicitly permitted; missing/invalid/absent authorization info ⇒ deny; frontend visibility/disabled controls are never authorization; capability grants are per-project/per-resource, never inferred from project membership. | STANDARD | Doc 11 §2, §7.1–7.2 |
| ES-12.3 | Trust is never inherited across boundaries; imported files, dataset contents, `.edaworkspace` packages, plugin outputs, web data, and AI-retrieved content are untrusted inputs; a signature proves identity/integrity, never safety. | STANDARD | Doc 11 §5; Doc 04 §13.3; Doc 09 §14.2; Doc 05 §18.2 |
| ES-12.4 | Bridge exposure: only explicit allowlisted methods, no arbitrary Python invocation, payload/execution scope bounded, errors never expose stack traces, privileged bridge reachable only by the trusted bundled UI; external navigation opens in the system browser. | STANDARD | Doc 11 §6.1–6.2; Doc 02 §6.2, §16 |
| ES-12.5 | No secrets/credentials in frontend code, project metadata (plaintext), logs, AI context, errors, or diagnostic bundles; secrets live in OS credential storage where available; rotation/revocation supported; secrets avoided in argv/env when safer mechanisms exist; never exposed to plugins unless explicitly authorized and technically isolated. | STANDARD | Doc 11 §10; Doc 04 §16 |
| ES-12.6 | Filesystem discipline through IPC: no arbitrary filesystem exposure; project-relative path validation, path-traversal prevention, writes restricted to approved project locations, no unvalidated internal paths across the boundary. | STANDARD | Doc 11 §9.1; Doc 06 §9, §12; `AGENTS.md` §9 |
| ES-12.7 | Privacy: data-classification levels Public/Internal/Confidential/Restricted; minimization (necessary columns/rows, prefer summaries); PII detection is advisory with explicit false-positive/negative honesty and user review; cloud transmission only through the 8-step gate — "No silent transmission is allowed"; no automatic cloud fallback when local inference fails. | STANDARD (classification SEC-008 Confirmed; fallback ban AI/Doc 02 Confirmed). Note: SEC-011 (controlled network access) and SEC-013 (export classification/warning) remain **Proposed** decision rows. | Doc 11 §11, §13; Doc 10 §7.3, §16 |
| ES-12.8 | Export security controls include resource-level authorization, classification evaluation, PII warnings, destination validation, no secret export, safe path handling, overwrite confirmation, audit-event generation, and redaction. Report exports must not silently include whole projects or original datasets. Doc 12 §17 also describes immutable export execution records, but REP-012 remains Proposed; the provenance mechanism must therefore remain approval-gated. REP-011 export-policy integration is also Proposed. | STANDARD (explicit export security controls) / PROPOSED (REP-011 policy integration and REP-012 provenance decision) | Doc 11 §15; Doc 12 §16–§17, §20 |
| ES-12.9 | Production frontend assets must follow a restrictive Content Security Policy. Exact directives and configuration remain OPEN pending validation against the selected PyWebView deployment model; Doc 11 §6.3 provides additional `should`-level security guidance. | STANDARD (restrictive CSP for production assets) / OPEN (exact directives and configuration) | Doc 14 §4.3 (line 196); Doc 11 §6.3; Doc 07 §16 |
| ES-12.10 | Plugin security engineering: isolation by default (dedicated subprocess + plugin-specific environment + bounded communication), permission checks on every relevant operation, quarantine triggers, output validation before artifact publication, "a subprocess alone is not a security sandbox" (OS-level controls required where isolation is claimed), no plugin permission gain via malformed requests or altered runtime context. | STANDARD | Doc 09 §2, §8.3, §14.2, §17; Doc 11 §8.3–8.4; Doc 05 §18.2 |
| ES-12.11 | AI security: instructions separated from retrieved data; tool calls validated and authorized by the AI Policy Engine; prompt instructions alone are never a security boundary; AI output never a security authorization decision; prompt-injection fixtures maintained as versioned adversarial evaluations. | STANDARD (SEC-015, AI-confirmed rows); adversarial fixture specifics PROPOSED per TST-007 | Doc 11 §12; Doc 10 §14; Doc 13 §13 |
| ES-12.12 | Doc 11 §16 provides an expected-behavior table for security failures (reject IPC requests, block and record permission denials, consider quarantine, reject or isolate malicious patterns, disable integrations when credentials are unavailable, block AI-policy violations, stop and recover on integrity failures, terminate safely under resource exhaustion, and block unauthorized navigation). The section introduces the table with `should produce explicit and safe outcomes`; do not promote the entire response table to mandatory Standard without a separate must-level source. | PROPOSED (should-level response model) | Doc 11 §16 |
| ES-12.14 | "A security failure **should** not silently degrade into a less secure execution mode" — should-level in source; proposed for adoption as MUST. | PROPOSED | Doc 11 §16 |
| ES-12.13 | Encryption-at-rest policy and key management; OS sandbox mechanisms per platform; audit-log retention duration; export redaction defaults; PII detection engine; plugin signing trust infrastructure. | OPEN (all explicitly deferred by owners) | Doc 11 §21; Doc 04 §19 |

---

# 13. Error Handling and Observability Standards

## 13.1 Error model

| ID | Standard | Status | Source |
|---|---|---|---|
| ES-13.1 | Domain error handling has three distinct source elements: Doc 03 §10 says errors should be typed and actionable and labels its 14 entries as `Initial categories` (not approved categories); Doc 03 also says errors should contain stable codes, safe messages, and structured diagnostic context; Doc 15 §11.3 specifies the operational typed-error fields. Separately, raw data values and secrets must not appear in error messages or logs by default. | STANDARD (confidentiality prohibition and Doc 15 operational error fields) / PROPOSED (should-level domain typing/actionability; initial taxonomy is not a ratified closed list) | Doc 03 §10; Doc 15 §11.1–11.4 |
| ES-13.2 | Application layer translates domain errors into stable IPC error contracts; the 8 IPC error categories and `ErrorContract` shape are defined but governed by Proposed rows IPC-004/005. | STANDARD (translation duty, Doc 06 §3.1(9)) / PROPOSED (shape) | Doc 06 §3.1, §5.3 |
| ES-13.3 | A single documented mapping between the initial domain taxonomy (14 categories), the IPC error categories, and the observability error categories, including retryability and recovery-action field alignment. The mapping itself remains Proposed and is not an approved taxonomy decision. | PROPOSED (PS-4; composition requires Product Owner approval) | Doc 03 §10; Doc 06 §5.3; Doc 15 §11 |
| ES-13.4 | Stack traces and internal diagnostics go only to diagnostic logs, never to user-visible errors or IPC responses. Conflict errors are returned so the frontend can refresh state; `RevisionConflict` is one of the initial domain error categories. | STANDARD (stack-trace handling and conflict response) | Doc 06 §5.3, §12–§13; Doc 03 §9–§10 |
| ES-13.5 | Stale and invalid states must be explicit (Doc 03). Failed jobs and blocked dependents must be distinguished in the UX; retry is offered only when the operation is safe to repeat (Doc 08). `Blocked` is an execution dependency outcome (Doc 05), not a state named in Doc 03 §9. | STANDARD (source-specific state and UX distinctions) | Doc 03 §9; Doc 05 §14.2; Doc 08 §11.1–11.3 |

## 13.2 Logging and observability

| ID | Standard | Status | Source |
|---|---|---|---|
| ES-13.6 | Log substrate: "Logs use structured JSON Lines (`.jsonl`)" (declarative); severity set DEBUG/INFO/WARNING/ERROR/CRITICAL with documented purposes; storage in rotating, bounded, retention-configurable local files with "Redaction before persistence"; event namespace list (`application.* project.* dataset.* analysis.* job.* plugin.* storage.* ipc.* security.* update.*`). | STANDARD | Doc 15 §6.1–6.4 (Approved-Finalized) |
| ES-13.15 | Nine-record-field schema (timestamp, severity, event name, component, message, correlation identifiers, operational context, error code, schema version): source states "Each record **should** contain:" (should-level, verbatim audit re-quote). Proposed adoption as the binding record schema. | PROPOSED | Doc 15 §6.1 |
| ES-13.7 | Correlation identifiers `request_id`, `trace_id`, `span_id`, `job_id`, `project_id`, `component_id` propagate across all enumerated boundary classes; every IPC request and job carries a correlation/trace ID; minimum per-request log fields per Doc 06 §15. | STANDARD | Doc 15 §5.3; Doc 06 §15 |
| ES-13.8 | Privacy in telemetry: never persist raw dataset contents, sampled rows, credentials/tokens, sensitive prompts, unredacted personal information, or unnecessary identifying paths; **redaction happens before data reaches persistent observability storage**; logs are not substitutes for domain events or audit records. | STANDARD | Doc 15 §4.3, §6.4; Doc 04 §18; Doc 05 §19 |
| ES-13.9 | Retention defaults and eviction (DEBUG 3d … aggregated metrics 90d; quotas; eviction order), with the absolute rule that job execution records and audit evidence are never evicted by ordinary observability eviction. Quota numeric sizes unspecified. | STANDARD (rules) / OPEN (sizes) | Doc 15 §18 |
| ES-13.10 | Audit-content prohibition, verbatim must-level: "Do not log raw datasets, credentials, secrets, or unnecessary personal information." Diagnostics must never include raw dataset values or credentials. | STANDARD | Doc 11 §14; Doc 04 §16 |
| ES-13.16 | Distinguish two audit-record domains. Security-relevant audit records in Doc 11 §14 are recommended (`should`) for generation, field structure, and protection; their adoption as binding requirements remains Proposed, with retention details Open. Separately, the operational audit trail in Doc 15 §20.2–§20.4 defines event coverage, record fields, append-only logical model, transactional persistence, and integrity checks as part of the approved observability architecture. Do not conflate the two scopes. | STANDARD (operational audit trail, Doc 15) / PROPOSED (security audit-record recommendations, Doc 11) / OPEN (retention specifics) | Doc 11 §14, §21; Doc 15 §20.2–§20.4 |
| ES-13.11 | Diagnostic bundles are user-initiated only, three collection levels, ten mandatory safeguards before generation/export (mandatory redaction, exclusion of raw datasets/credentials/DB contents/prompts, path de-identification, preview, explicit confirmation); sharing/upload is a separate user-controlled action. | STANDARD | Doc 15 §10; Doc 06 §15 |
| ES-13.12 | Instrumentation compatibility: source is should-level — "The instrumentation architecture **should** be OpenTelemetry-compatible" (verbatim audit re-quote); "Local exporters and storage are the default. External exporters are optional and require explicit configuration." A specific OTel SDK/logging library is not selected. | PROPOSED (compatibility requirement) / OPEN (library) | Doc 15 §5.2 |
| ES-13.13 | Metrics discipline: eight domains, counters/gauges/histograms only, no unbounded-cardinality labels, low instrumentation overhead. | STANDARD | Doc 15 §8 |
| ES-13.14 | Component health state vocabulary is inconsistent across three approved documents (Doc 02 §12.2 `Initializing/Ready/Degraded/Failed/Shutting Down`; Doc 06 §14 `Healthy/Degraded/Unavailable/Starting/ShuttingDown`; Doc 15 §9.1 `Healthy/Degraded/Unhealthy/Starting/Stopping/Disabled`). Canonical set cannot be declared by this document. Provisional working assumption for implementers: none — do not standardize until reconciled. | FLAG (IN-C) + OPEN | Docs 02 §12.2, 06 §14, 15 §9.1 (all three line-verified) |

---

# 14. Dependency and Supply Chain Standards

| ID | Standard | Status | Source |
|---|---|---|---|
| ES-14.1 | Direct **and** transitive dependencies are pinned; lockfiles are committed; versions of Python and Node.js are pinned; native compiler/toolchain versions recorded; dev and runtime dependencies separated; no uncontrolled dependency downloads during final packaging. | STANDARD | Doc 14 §3.2, §6; Doc 16 §19 |
| ES-14.2 | No dependency on globally installed Python or Node.js in production; the production app bundles a controlled Python runtime (PyInstaller approved MVP baseline, "subject to successful cross-platform validation"). | STANDARD | Doc 14 §4.1–4.2 (BUILD-016) |
| ES-14.3 | Vulnerability scanning, license review, SBOM generation, provenance recording, and controlled updates are mandatory release content (installer + release notes + SHA-256 checksums + signatures + SBOM + build provenance + compatibility manifest). Published release artifacts are immutable. | STANDARD | Doc 14 §6, §7–§8 |
| ES-14.4 | Authenticity rule: "A checksum alone does not prove publisher authenticity"; trusted signature or equivalent authenticated mechanism required; five pre-install verifications mandatory; "Unverified packages must never be installed." | STANDARD | Doc 14 §8.2–8.3 |
| ES-14.5 | Plugin environments: independent lockfiles from core, core dependencies never modified by plugin installation, conflicts must not break the application environment, application updates never silently modify plugin environments, environment fingerprints (Python, Platform API, SDK, lockfile hash, package versions) recorded. | STANDARD | Doc 09 §9.1–9.2; Doc 14 §4.4 |
| ES-14.6 | CI gates include dependency audit ("Known vulnerable packages") and secret scanning ("Accidental credential exposure"); these checks run continuously in development and release validation. | STANDARD (obligation) / PROPOSED (tools: pip-audit named only in replaceable Proposed list, Doc 13 §21) | Doc 11 §18; Doc 13 §19.1, §21 |
| ES-14.7 | Mechanism standards not yet defined: lockfile tooling (package manager choice), update cadence policy, vulnerability-response SLA, SBOM generation tool, secret-scanning tool, static-analysis tool selection. | OPEN (PS-7/PS-2 mechanisms) | Gap register — Doc 14 §6 mandates exist without mechanism |
| ES-14.8 | Baseline-list completeness: Polars is part of the approved analytical stack but absent from the `AGENTS.md` §3 summary and Doc 00 §2.3 technical foundation table. Implementers follow Docs 01/05; list reconciliation required. | FLAG (IN-A) | Doc 01:441/546, Doc 05 §9.1/§11.2 (line-verified); `AGENTS.md` §3 (read directly) |

---

# 15. Documentation Standards

| ID | Standard | Status | Source |
|---|---|---|---|
| ES-15.1 | Documentation-as-Code with lightweight ADRs; documentation maintenance is part of Definition of Done; every architectural change identifies its affected canonical document(s). | STANDARD | Doc 16 §16; Doc 00 §9.2, §9.4; `AGENTS.md` §6 |
| ES-15.2 | Do not modify canonical documents without explicit approval; report inconsistencies rather than silently resolving them; archived documents are historical reference only. These are repository/agent operating instructions, not requirements stated in Documents 00–16. | PROPOSED (operational origin; not a canonical baseline standard) | `AGENTS.md` §2, §6 only |
| ES-15.3 | Doc 00 §8.3 defines the traceability chain — Product Requirement → Architecture Decision → Design → Work Item → Source → Automated Tests → Execution Evidence → Acceptance — and states that each capability *idealnya* (ideally) be traceable through it. The chain structure is canonical; the obligation strength is permissive in the source. This document cites its sources accordingly as practice; treating the chain as a hard MUST is a promotion decision (OD-5). | PROPOSED (permissive source: "idealnya") | Doc 00 §8.3 |
| ES-15.4 | Document 17 is not currently listed in the Doc 00 §8.1 canonical ownership table. The table is an ownership/navigation map; it does not itself state that every canonical document must have a separate row. Adding Document 17 remains an approval-gated follow-up under the Product Owner-approved direction. | OPEN / approval-gated documentation update | Doc 00 §8.1; Product Owner-approved direction for Document 17 (recorded in project context) |
| ES-15.5 | Documentation language: canonical docs mix English and Indonesian; no language standard exists. Engineering-facing documents should state their language explicitly until a standard is adopted. | OPEN (PS-11) | Observed across Docs 03, 06, 11–15 (e.g., Doc 06:565 line-verified) |
| ES-15.6 | Stale status metadata: approved Documents 01–13 and 16 still display `Draft`/`Draft for Review` headers; Doc 00 contradicts itself (line 6 "Approved" vs §13 line 1501 "Draft for Review"). Per the Product Owner rule these headers are stale; header reconciliation is an approval-gated editorial action, and Doc 00's internal conflict needs PO confirmation that the waiver covers it. | FLAG (IN-D) | Verified line references (this document's §18.2) |

---

# 16. Code Review and Definition of Done

| ID | Standard | Status | Source |
|---|---|---|---|
| ES-16.1 | Every work item must carry ("Setiap work item harus memiliki"): scope + owner, acceptance criteria, test requirements, dependencies, affected modules, independent reviewability — this field list is mandatory in the source. The 1–5 engineering-day size is explicitly qualified: "Ukuran ini merupakan planning guideline, bukan batas mutlak" (a planning guideline, not an absolute limit), with items exceeding it "sebaiknya dipecah" (ideally split). The vertical-slice rule (each item produces one verifiable capability) is stated normatively in §7.2. | STANDARD (field list, vertical-slice) / guideline-qualified (size) | Doc 16 §7.1–7.2 |
| ES-16.2 | Definition of Done (canonical, six dimensions): Functional, Integration, Quality, Reliability, Security, Demonstrability; plus "no placeholders replacing unfinished functionality" and "analytical correctness is a mandatory gate for statistical features". Phases are not complete when mandatory quality gates are unmet (Doc 16 §2.1, line-verified); milestones require all mandatory items accepted, gates passed, no unresolved Critical/High defects (Doc 16 §7.4 — the section actually titled "Before Completing a Milestone", reached via Doc 00 §7.3–7.4). | STANDARD | Doc 16 §2.1, §2.3, §7.4 |
| ES-16.3 | `AGENTS.md` §11 defines a parallel seven-item operational DoD for agents. It is subordinate to the canonical six-dimension DoD in Doc 16 §2.3; this additional agent-specific checklist is an operational instruction, not a canonical engineering Standard. | PROPOSED (operational layer; AGENTS.md origin) | `AGENTS.md` §11; Doc 16 §2.3 |
| ES-16.4 | Before completing a work item, verify: acceptance criteria, automated tests, integration behavior, error/recovery handling, security requirements, documentation updates, demonstrable functionality. | STANDARD | Doc 00 §7.3 |
| ES-16.5 | A concrete per-PR review checklist and reviewer-authorization matrix are proposed artifacts. Doc 16 §7.1 requires work items to be independently reviewable; it does not explicitly require this particular checklist artifact or define reviewer authorization roles. | PROPOSED (checklist artifact) / OPEN (reviewer matrix) | Doc 16 §7.1; no canonical checklist or reviewer matrix specified |
| ES-16.6 | Standards-type work items (pure documentation deliverables such as this one) do not satisfy the vertical-slice Demonstrability dimension directly; a DoD interpretation carve-out for documentation work items. | OPEN (OD-6 adjacency) | Doc 16 §7.1 tension noted in Discovery §5.8; unresolved |

---

# 17. Open Decisions Register

## 17.1 OD — Open decisions requiring Product Owner direction

| ID | Decision | Blocking scope | Source |
|---|---|---|---|
| OD-1 | Ratify or amend Doc 06 decision rows IPC-001–005, IPC-010–012 (bridge transport, typed contracts, Pydantic canonical schemas, generated TS types, envelope shapes, versioned protocol, thread-safe dispatch, replay/reconnect). | §8 (IPC standards), §13.1 (error shape), §11.2 (generated-type synchronization obligation) | Doc 06 §17 (line-verified) |
| OD-2 | Ratify or amend Doc 13 decision rows TST-001–011 and the §21 tool baseline. | §11 (testing), §14.6 (CI tools), gate merge | Doc 13 §23, §21 (line-verified) |
| OD-3 | Ratify or amend Doc 12 decision rows REP-001–007, REP-011, REP-012 (bounded context, shared spec, artifact-referencing, HTML primary, PDF distribution, freshness validation, deterministic evidence, export-policy integration, immutable export provenance). | §9.12, §12.8 | Doc 12 §20 (line-verified) |
| OD-4 | Ratify remaining scattered Proposed rows: FE-002/004/006/007/010; UX-009/010; PLG-012/013; SEC-011/013; AI-013/014. Existing ES relationships are partial: FE-004 (ES-6.18), FE-007 (dependency noted in ES-6.7), FE-010 (ES-6.10), SEC-011/013 (ES-12.7). Other listed decisions have no explicit ES mapping identified in this draft; do not infer coverage. | Existing ES dependencies: ES-6.7, ES-6.10, ES-6.18, ES-12.7. Unmapped decisions remain source-register items; §6.8 and §10.7 are not blocking references for this set. | Doc 07 §18; Doc 08 §18; Doc 09 §18; Doc 10 §21; Doc 11 §20 |
| OD-5 | Promotion decisions for permissive baseline wording: Doc 00 §8.3 traceability chain → mandatory traceability?; Doc 04 §5.3 "Recommended baseline" SQLite settings → MUST?; Doc 07 §8.4 Zustand adoption rule. The XLSX complexity criterion from Doc 12 §19 is tracked separately as OD-12. | ES-15.3, ES-9.5, ES-6.6 | Discovery O-25–O-27; Doc 00 §8.3; Doc 04 §5.3; Doc 07 §8.4 |

| OD-6 | Two separate decisions: (A) define a formal work-item register and identifier convention (`P0-WPnn` is not specified in Doc 16; §7.1–7.2 does provide required work-item fields and a template); (B) determine how the Demonstrability dimension of the DoD applies to pure documentation/standards work items (ES-16.6). The claim that no populated repository catalog exists is not re-verified in this revision. | Project process; ES-16.6 | Doc 16 §2.1, §7.1–7.2; repository catalog existence requires a fresh repository inspection |
| OD-7 | Add Document 17 to the Doc 00 §8.1 ownership table (approval-gated amendment). | §15.4 | Doc 00 §8.1 |
| OD-8 | Merge the three release-gate lists (Doc 13 §19.3 Proposed ∪ Doc 14 §15.2 Approved ∪ Doc 15 §21.3 Approved) into one canonical table with stated precedence. | ES-11.15 | Doc 13/14/15 |
| OD-9 | Resolve four independent tooling/configuration choices: (A) Python type checker (mypy or Pyright); (B) Python strictness level; (C) TypeScript strictness flags; (D) Pydantic-to-TypeScript generator. Approval of one choice does not imply approval of the others. | ES-5.12 (A–B), ES-6.15 (C), ES-8.12 (D) | Doc 13 §21, §24 (A–B); Doc 07 §2 / ES-6.15 (C); Doc 06 §6.2, §18 (D) |
| OD-10 | Health-state vocabulary reconciliation (IN-C). | ES-13.14 | Docs 02/06/15 |
| OD-11 | Maintain a source-owned inventory of (A) unresolved technical decisions, (B) deferred implementation details where a normative principle may already exist, and (C) deferred product/platform capabilities. Do not treat these categories as interchangeable or promote them into binding standards. The inventory below is a verified source-section index, not a claim that every deferred item has been exhaustively enumerated: **A — open technical decisions:** UUID/ULID and serialization; ORM/repository approach; Parquet partitioning/compression; cache serialization and incremental backup; encryption-at-rest/key management; method registry schema; assumption-classification rule; cost-model formulas; worker-pool sizing; router/component-library/theme choices; plugin package/manifest/signing/UI extension contracts; report renderers and `.edaworkspace` internals; AI runtime/provider/evaluation choices. **B — deferred implementation details:** SQLite DDL/indexes; per-OS sandbox mechanisms; CSP directives/configuration (restrictive CSP for production assets is already STANDARD in ES-12.9); audit-retention duration; observability quota values (policy/eviction principles are separately standardized); CI provider, Playwright integration, fuzzing scope, test-data retention; export limits and cleanup. **C — deferred product/platform capabilities:** marketplace governance/automation, remote execution and future SDKs; advanced deployment/update/rollback capabilities; advanced AI/RAG and model lifecycle capabilities. Each item must retain its owning source section and original status; where the source does not explicitly label an item deferred/open, do not classify it as source-confirmed deferred. | Non-blocking for baseline architecture; implementation details may block individual module specifications. ES overlaps: ES-9.6–9.7, ES-12.9–12.13, ES-13.9; preserve only unresolved detail, not already-established requirements. | Docs 03 §11, 04 §19, 05 §21, 06 §18, 07 §19, 08 §19, 09 §20, 10 §22, 11 §21, 12 §21, 13 §24, 14 §18; item-level status requires source-section verification |
| OD-12 | Clarify the intended decision/acceptance criterion for XLSX export complexity (Doc 12 §19: "complexity remains manageable"). This draft records the unresolved criterion but does not translate it into a binding engineering threshold or infer a specific meaning. | §12 (report/export standards; no corresponding ES row assigned) | Doc 12 §19 (line-verified in the full-source audit) |

## 17.2 PS — Proposed standards from the Discovery Report and their disposition

| PS id | Topic | Disposition in this document |
|---|---|---|
| PS-1 | Naming conventions | Not invented. Recorded OPEN: ES-5.15, ES-6.16, ES-8.7 |
| PS-2 | Static-analysis toolchain + dependency-direction enforcement | ES-5.17 (PROPOSED), ES-7.2 (PROPOSED obligation/OPEN mechanism), OD-2 (toolchain ratification) |
| PS-3 | Type-strictness configurations | ES-5.12, ES-6.15 (OPEN), OD-9 |
| PS-4 | Error-taxonomy mapping standard | ES-13.3 (PROPOSED composition) |
| PS-5 | Numerical tolerance values/ownership | ES-10.10 (PROPOSED framework / OPEN values) |
| PS-6 | Commit format, PR template, review checklist | ES-4.8 (OPEN), ES-4.9 & ES-16.5 (PROPOSED artifacts); ES-16.6 / OD-6 is an adjacent DoD interpretation issue, not part of the review-checklist decision itself |
| PS-7 | Dependency mechanisms | ES-14.7 (OPEN) |
| PS-8 | Coverage stance | ES-11.13 (OPEN); TST-011 ratification remains within OD-2 |
| PS-9 | Test-fixture standard artifacts | ES-11.11 (PROPOSED rules; artifact formats OPEN within OD-11) |
| PS-10 | Accessibility automation | ES-6.12 (minimums STANDARD; conformance target UNRESOLVED per IN-B); automation tooling and CI gate remain unselected within OD-2 scope |
| PS-11 | Documentation language standard | ES-15.5 (OPEN) |
| PS-12 | Canonical home for Engineering Standards | Approved by PO; table registration pending ES-15.4 / OD-7 |

## 17.3 IN — Documentation inconsistencies (FLAG; reported, not resolved)

| IN id | Inconsistency | Status of this document's handling |
|---|---|---|
| IN-A | Polars present in approved baseline (Docs 01/05), absent from `AGENTS.md` §3 and Doc 00 §2.3 summaries | Flagged ES-14.8/ES-7.6; canonical docs govern; summary lists need PO-approved reconciliation |
| IN-B | WCAG 2.2 AA target (Doc 01 §8.6) vs Doc 08 §19 deferring "accessibility conformance target" | **Unresolved conflict — retained.** This document does not select a side. Doc 00 §8.2 requires architecture review and an ADR before resolution; ES-6.12 records the conformance target as UNRESOLVED/PROPOSED pending that procedure, citing both sources. |
| IN-C | Three divergent health-state vocabularies (Docs 02 §12.2 / 06 §14 / 15 §9.1) | ES-13.14: implementers must not standardize; OD-10 |
| IN-D | Stale Draft headers in approved 01–13/16; Doc 00 internal status conflict (line 6 vs line 1501) | ES-15.6; PO waiver covers 01–13/16; Doc 00 self-conflict awaits PO confirmation |
| IN-E | Misdelegated canonical ownership references: Doc 06 §12 points plugin permissions to Doc 05 instead of Doc 09; Doc 02 §11.2 points security threat models/controls to Doc 10 instead of Doc 11; Doc 02 §17 maps Extensibility, AI, and Security to Docs 08/09/10 rather than the Doc 00 owners 09/10/11. | Cross-document reference defects recorded; no source-document correction made. Doc 00 §8.1 ownership table governs until the owning documents are amended with approval. |
| IN-F | Overlapping release-gate lists with mixed approval status and no precedence | ES-11.15; OD-8 |
| IN-G | Unresolved particulars verified in source files: Doc 02 §8.2 includes `Failed → Retryable` without defining a Retryable transition/state contract in Doc 05; Doc 12 §10.2 invokes an undefined "required-section policy"; Doc 04 §4.2 shows `metadata.json` in the directory tree without reconciling it with the SQLite metadata ownership model. | Recorded as implementation-spec/documentation questions within OD-11 or source-owner review; no resolution made. |
| IN-H | React Hook Form appears in Doc 02 §4 Layer 1 technology listing but is absent from the Doc 00 §2.3 technical foundation and has no explicit SYS decision row; its status as an adopted baseline dependency is unclear. | OPEN; Product Owner clarification required before treating it as a selected dependency. |
| IN-I | Doc 16 §3 says the implementation roadmap is divided into six phases, while the separately approved product roadmap baseline uses four phases and nine milestones. The two structures may represent different planning levels, but the source document does not explicitly distinguish them. | FLAG / OPEN; confirm whether Doc 16's six implementation phases are subordinate workstreams or a conflicting phase model. Do not rewrite Doc 16 or the approved roadmap here. |
| F-02 | Field-level Shared Provenance Envelope mapping remains open. Envelope semantics, audit/provenance separation, and correlation are established, but implementers must not invent a field-level mapping and claim it is standardized here. | FLAG / OPEN; ES rows that cite envelope semantics remain limited to the established semantics. Field-level mapping requires source-owner definition, then a Doc17 revision. |

---

# 18. Source Traceability Matrix

## 18.1 Standards-by-source index

| Source | Standards in this document derived from it |
|---|---|
| Doc 00 §2.3, §7.3–7.4, §8.1–8.3, §9.2–9.4, §13 | ES-7.6, ES-15.1, ES-15.3–15.4, ES-15.6, ES-16.4, ES-6.12, ES-6.18, IN-D (Sections 2.1–2.2 in this document describe governance; they are not ES identifiers) |
| Doc 01 §8.2–8.6, §11, §12 | ES-6.12 (target contested — IN-B), ES-7.6, ES-11.20, ES-12.7, ES-14.8 |
| Doc 02 §1–§2, §4–§12, §14–§17 | ES-5.1–5.2, ES-5.5–5.9, ES-5.18, ES-6.4, ES-6.18, ES-7.1–7.2, ES-7.4, ES-7.6, ES-8.1–8.2, ES-8.10, ES-8.13, ES-9.4–9.5, ES-9.11, ES-10.1, ES-11.1, ES-11.9, ES-12.1, ES-12.4, ES-13.14, IN-C, IN-E, IN-G, IN-H |
| Doc 03 §2, §4–§11 | ES-5.3, ES-7.3, ES-9.5 (hedge quote), ES-10.7, ES-13.1, ES-13.3–13.5, ES-10.12, OD-11 |
| Doc 04 §2–§19 | ES-8.8, ES-9.1–9.12, ES-11.5, ES-12.3, ES-12.5–12.6, ES-12.13, ES-13.8, ES-13.10, IN-G |
| Doc 05 §2–§21 | ES-5.8–5.10, ES-9.8, ES-10.1–10.12, ES-11.4, ES-12.3, ES-12.10, ES-13.5, ES-13.8, ES-14.8 |
| Doc 06 §1–§20 | ES-5.4, ES-5.7–5.8, ES-5.10, ES-6.4, ES-6.7, ES-8.2–8.13, ES-9.4, ES-11.2, ES-11.21, ES-12.1, ES-12.6, ES-13.2–13.4, ES-13.7, ES-13.11, ES-6.14, ES-15.5, IN-C, IN-E, IN-G |
| Doc 07 §1–§19 | ES-5.11 (frontend strict-typing counterpart only), ES-6.1–6.18, ES-7.2, ES-11.3, ES-12.9, ES-13.5 |
| Doc 08 §2–§19 | ES-6.11–6.12, ES-10.7, ES-13.5 |
| Doc 09 §2–§20 | ES-5.14, ES-7.3, ES-11.7, ES-12.3, ES-12.10, ES-14.5, IN-E |
| Doc 10 §2–§22 | ES-10.12, ES-12.7, ES-12.11 |
| Doc 11 §2–§21 | ES-8.13, ES-9.9, ES-11.6, ES-12.1–12.14, ES-13.10, ES-13.16, ES-14.6, IN-E |
| Doc 12 §3–§21 | ES-9.12, ES-12.8, OD-12; this is the limited set of Doc 12-derived rows currently extracted into Doc 17, not a claim that Doc 12 has no other implementation requirements |
| Doc 13 §4–§24 | ES-5.12, ES-5.16–5.17, ES-10.10, ES-10.13, ES-11.1, ES-11.3–11.6, ES-11.8–11.15, ES-11.18, ES-11.20, ES-12.11, ES-14.6 |
| Doc 14 §1–§19 | ES-4.6–4.7, ES-4.10, ES-5.13, ES-11.15–11.16, ES-12.9, ES-14.1–14.5, ES-14.7 |
| Doc 15 §4–§27 (incl. §5.2) | ES-10.1, ES-11.15, ES-11.17, ES-11.19, ES-13.1, ES-13.3, ES-13.6–13.9, ES-13.11–13.16, IN-C, IN-F |
| Doc 16 §2–§26 | ES-4.1–4.5, ES-4.7, ES-4.9, ES-5.13, ES-7.5, ES-7.7, ES-11.14, ES-11.18, ES-14.1, ES-15.1, ES-16.1–16.3, ES-16.5–16.6, IN-I |
| `AGENTS.md` §2–§3, §7, §9–§11 (operational-support origin; not canonical Docs 01–16) | ES-5.11, ES-5.16, ES-6.18, ES-7.7, ES-12.6, ES-14.8, ES-15.1–15.2, ES-16.3; plus IN-A and the governance statement in §2.1 (not an ES identifier) |

### Version 0.7 revision notes

- Aligned §2.1 to the WP-24 Approved Documentation Baseline v1.0 approval record and archive; `AGENTS.md` remains an operational reference only.
- Clarified that individual revised-file headers such as `Draft for Review — Revised for Review` record revision provenance and do not by themselves reduce WP-24 baseline authority.
- Added F-02 as an explicit FLAG / OPEN item for field-level Shared Provenance Envelope mapping.
- Kept the document outside Approved Documentation Baseline v1.0; no canonical document was modified and no Proposed/Open/Deferred decision was promoted.

### Version 0.6 revision notes

- Corrected OD-1 blocking-scope description; it refers to generated-type synchronization, not tooling selection.
- Rebuilt OD-4 dependency notes to distinguish mapped ES dependencies from source Proposed decisions without explicit ES mapping.
- Clarified OD-5 ES references; split OD-6 into register/identifier and documentation-DoD questions; separated OD-9 into four independent choices.
- Reclassified OD-11 into open technical decisions, deferred implementation details, and deferred product/platform capabilities. The register is explicitly a source-section index, not an assertion of exhaustive item-level verification. Established requirements (for example restrictive CSP) are not relabelled as undecided.
- Corrected PS-2, PS-6, PS-8, and PS-10 cross-register relationships.
- Corrected six missing entries in the standards-by-source index: ES-6.12, ES-6.18, ES-10.12, ES-6.14, ES-13.3, and ES-5.11.
- Corrected ES-11.15 so the merged gate table is Proposed rather than mandatory; precedence remains Open.
- No source document 00–16 was modified. No Proposed/Open/Deferred decision was promoted. Status remains Draft for Review.

## 18.2 Line-verified citations (this drafting pass)

The following were verified against file lines during the discovery reassessment,
the v0.1 drafting pass, and the v0.2 audit revision, and may be cited with
confidence:

- `AGENTS.md`:32–44 (Baseline Approval Status)
- Doc 00:5–6, 1244–1260 (the seven-step §8.2 conflict-resolution procedure), 1263 (the separate rule that higher-numbered documents do not automatically override lower-numbered documents), 1330–1345, 1497–1503 (ownership rule and status conflict)
- Doc 06:714–725 (IPC-001–012 statuses); 565 (IN-E mis-citation)
- Doc 13:1089 (mypy-or-Pyright); 1147–1157 (TST-001–011 Proposed)
- Doc 14:6, 156, 188–198 (production asset requirements, including restrictive CSP at line 196), 423, 440, 927 (Approved Baseline; PyInstaller)
- Doc 15:1747–1753 (Approved — Finalized); 548–562 (health states)
- Doc 16:1706 (finalization rule)
- Doc 01:441, 505, 546 (Polars; WCAG 2.2 AA)
- Doc 05:96, 135, 276, 628, 784 (Polars)
- Doc 08:706 (deferred conformance target)
- Doc 02:894–908 (health states)
- Doc 09:901–910 (PLG statuses); Doc 12:1057–1068 (REP statuses)

Added by the v0.2 audit revision — the following passages were re-read verbatim
and their exact modality ("must"/"harus"/"wajib" vs "should"/"recommended"/
"idealnya"/"dianjurkan"/"boleh"/"dapat", and exemplifying "Contoh:") was captured
for the reclassifications in §§4–16:

- Doc 16 §2 (phase gates, §2.1 line-118 sentence), §7 (work-item "harus" fields,
  size as "planning guideline, bukan batas mutlak"), §11 ("Contoh:" branch
  prefixes), §12, §16 (ADR "wajib" + "ADR tidak diwajibkan untuk setiap
  perubahan kode"), §17, §19 (dependency updates via reviewed PR/automated tests)
- Doc 00 §7.3–7.4, §8.1 (ownership table), §8.2 (conflict procedure, line 1263),
  §8.3 ("idealnya" traceability wording)
- Doc 02 §2 (SYS-003 = React+TS+Vite; SYS-010 = Composition Root; SYS-012 =
  DuckDB), §4–§16 items cited above
- Doc 04 §5 ("must serialize writes" / "must never hold a SQLite write
  transaction open" vs the §5.3 list introduced verbatim by
  "**Recommended baseline:**"), §9 ("where appropriate" hedge)
- Doc 06 §6.2, §11, §12, §16 (CI "harus mendeteksi…" obligation; the surrounding
  nine-level table is unlabeled as normative)
- Doc 07 §3, §18 (FE-004/FE-007/FE-010 = Proposed; FE-005 "Confirmed by Doc 06")
- Doc 11 §14 (all should-worded except "Do not log raw datasets…"), §18
  ("Security tests must run continuously")
- Doc 13 §2, §4–§6.3, §19 (§19.3 "No release should proceed"), §21, §23
- Doc 14 §4.2, §6.2, §8, §15
- Doc 15 §5.2 ("should be OpenTelemetry-compatible"), §6.1 ("Each record should
  contain"), §16.2 ("not universal performance guarantees"), §16.3, §18.3, §21.3
- Doc 10 §18

Verified directly against the supplied Archive.zip during the v0.4 full-source audit:

- Doc 03 §9–§10 (state rules, initial 14 domain-error categories, `RevisionConflict`).
- Doc 04 §5.1–§5.4, §8.1–§8.2, §9, §11, §12.3, §14–§16 (SQLite MUST rules vs recommended baseline, Unit of Work SHOULD wording, cache-key SHOULD wording, integrity/recovery qualifiers).
- Doc 05 §3, §12.1–§12.2, §14.1–§14.4, §18.2, §20 (Result Validator, mandatory output-schema validation vs optional metrics comparison, blocked-task behavior, statistical correctness obligations).
- Doc 06 §5.1–§5.3, §6.2, §8.2–§8.4, §10–§13, §16–§18 (contract wording, idempotency recommendations, test matrix, decision statuses).
- Doc 07 §1–§4, §8.1–§8.5, §9, §11.3, §12.2–§12.3, §15–§19 (frontend boundaries, state recommendations, test matrix, CSP-related references).
- Doc 08 §9, §11.1–§11.3, §16, §18–§19 (risk UX, failed/blocked/retry behavior, accessibility conflict).
- Doc 09 §4, §6.2, §11, §17, §19–§20 (plugin permission model, QA matrix and modal strength, PLG statuses).
- Doc 11 §6.3, §7, §14, §16, §18, §20–§21 (CSP SHOULD, audit-record SHOULD, failure-response SHOULD, security-test MUST, decision statuses).
- Doc 12 §10.2, §16–§17, §19–§21 (undefined required-section policy, export controls, immutable export record, REP statuses, XLSX complexity condition).
- Doc 15 §5.2, §6.1, §11.1–§11.4, §16.2–§16.3, §20.2–§20.4, §21.3 (OTel SHOULD, log fields SHOULD, error taxonomy, performance targets, operational audit trail, release gates).
- Doc 16 §3, §7.1–§7.2, §7.4, §11.1–§11.2, §12, §16, §19 (six-phase implementation roadmap, work-item field requirements, DoD, Git strategy including feature flags and frequent integration, and dependency rules).

The earlier Doc 03 §9 hedge quote and Doc 15 §20 audit-trail citation are no longer unverified; both have been checked directly. Other citations outside the passages enumerated above remain subject to spot-checking before ratification.

All other section citations derive from full-document extraction passes
(six-agent complete reads with per-document section enumeration) that were
cross-consistent and uncontradicted, but not individually line-verified here
(see §1.4 caveat). Ratification reviewers should spot-check them.

---

# Appendix — Document Status Declaration

This document is **Draft for Review v0.7** (aligned to Approved Documentation Baseline v1.0 as a companion document; contents not approved). The Product
Owner has approved the *canonical home* of cross-cutting engineering standards to
be Document 17; the *contents* of this draft are not approved. No PROPOSED
standard becomes binding, no OPEN decision is resolved, and no canonical document
has been modified by or in this draft. Approval of this document (in whole or
per-section) is the next required human action.

## Revision note — v0.5

This revision consolidates the v0.4 full-source audit findings and traceability corrections:

- Removed invalid pseudo-identifiers that had incorrectly used the `ES-` prefix
  for section references in the source index.
- Corrected OD-5's scope and moved the XLSX complexity question to a separate
  OD-12 entry, without inventing an acceptance threshold.
- Reclassified ES-11.5 so persistence/integrity test scenarios remain Proposed;
  behavioral integrity requirements are not treated as proof of a mandatory
  test-suite obligation.
- Separated the approved technology-baseline listing (ES-7.6) from the Proposed
  TanStack Query/Zustand state-separation pattern (ES-6.18).
- Clarified ES-11.1: per-module verification ownership is distinct from the
  Proposed detailed testing-layer taxonomy.
- Clarified Doc 12 ownership and the limited scope of Doc 12-derived rows in this
  cross-cutting standards document.
- Corrected source-index descriptions, added Doc 00 as the direct source for the TanStack Query/Zustand technology listing, and registered missing cross-document ownership, React Hook Form, and roadmap-structure flags.
- Corrected normative overstatements in ES-5.11, ES-6.1/6.3/6.4/6.14, ES-7.2/7.3, ES-8.11, ES-9.4/9.8/9.10, ES-10.9, ES-11.3/11.7, ES-12.8/12.9/12.12, ES-13.1/13.3/13.4/13.5, ES-15.2/15.4, and ES-16.3/16.5.
- Resolved the ambiguity in ES-10.9: output-schema validation is required; comparison of row count and quality metrics is optional. Removed this item from OD-5.
- Verified Doc 15 §20 audit-trail references and Doc 12 §19 XLSX complexity citation; updated the verification ledger.
- Updated ES-4.1 to include the feature-flag and frequent-integration requirements explicitly stated in Doc 16 §11.1.
- Removed the unsupported closed-list word “only” from ES-5.3; the listed interaction mechanisms and explicit prohibitions remain.
- Replaced the stale discovery-pass annotation in ES-9.5 with direct-source wording while retaining the `where appropriate` qualification for optimistic concurrency.
- Reclassified restrictive CSP for production frontend assets in ES-12.9 as STANDARD based on Doc 14 §4.3; exact directives/configuration remain OPEN.
- Added ES-6.7 to the Doc 06 source index and ES-12.9 to the Doc 14 source index.
- Corrected Doc 00 §8.2 line references in §18.2, separating the procedure (1244–1260) from the Important authority note (1263).
- Preserved all 162 existing ES identifiers and kept the document status Draft for Review.

No source documents were modified. Citations not listed as line-verified in
§18.2 remain subject to verification against Documents 00–16 before ratification.
