# 00 — Project Architecture & Documentation Guide

**Product:** EDA Workbench  
**Document:** 00  
**Version:** 0.2  
**Status:** Approved (header status unchanged — F-08C-01 owner action pending)

> **Revision note (WP-17):** v0.2 syncs §2.3 Technical Foundation only (Polars per IN-A closure WP-13; React Hook Form per IN-H closure WP-15). No status change.
**Purpose:** Official Project Entry Point  
**Documentation Baseline:** Documents 01–16

---

# 1. Introduction

## 1.1 Purpose

Dokumen ini merupakan entry point utama untuk keseluruhan EDA Workbench project documentation.

EDA Workbench memiliki 16 architecture, design, dan implementation documents yang mendefinisikan product vision, system architecture, domain model, technical infrastructure, application behavior, security, quality, dan implementation strategy.

Dokumen-dokumen tersebut saling berhubungan dan membentuk satu kesatuan architectural baseline.

Tanpa panduan navigasi, developer atau contributor harus membaca seluruh dokumen untuk memahami konteks proyek, mengetahui lokasi keputusan tertentu, dan memahami hubungan antar-komponen.

Document 00 menyelesaikan masalah tersebut dengan menyediakan:

- Unified project overview.
    
- Documentation index.
    
- Architecture navigation map.
    
- Document dependency relationships.
    
- Recommended reading paths.
    
- Decision traceability guidance.
    
- Development workflow reference.
    
- Documentation governance rules.
    

**Document 00 menjawab pertanyaan:**

1. Apa yang sedang kita bangun?
    
2. Bagaimana keseluruhan sistem dirancang?
    
3. Dokumen mana yang harus dibaca untuk memahami suatu area?
    
4. Bagaimana keputusan di satu dokumen memengaruhi dokumen lain?
    
5. Bagaimana menggunakan dokumentasi ini ketika mengimplementasikan fitur?
    
6. Bagaimana menjaga seluruh dokumentasi tetap konsisten?
    

## 1.2 Intended Audience

Dokumen ini ditujukan untuk:

- Product Owner.
    
- Software Architect.
    
- Backend Developer.
    
- Frontend Developer.
    
- Data/Analytics Engineer.
    
- QA Engineer.
    
- Security Engineer.
    
- DevOps/Release Engineer.
    
- Future contributors.
    

## 1.3 Document Authority

Document 00 merupakan navigational document, bukan pengganti canonical architecture documents.

Ketentuan:

- Documents 01–16 tetap menjadi sumber utama keputusan dan spesifikasi masing-masing domain.
    
- Document 00 memberikan overview dan referensi navigasi.
    
- Document 00 tidak boleh menciptakan atau mengubah architectural decisions.
    
- Jika terdapat perbedaan informasi, canonical document yang memiliki ownership atas topik tersebut menjadi rujukan utama.
    
- Perubahan architectural baseline harus mengikuti governance yang ditetapkan dalam Document 16.
    

---

# 2. Project Overview

## 2.1 Product Vision

**EDA Workbench is a guided, extensible, reproducible, local-first Exploratory Data Analysis platform.**

Platform ini membantu pengguna melakukan Exploratory Data Analysis secara sistematis, mulai dari memahami dataset hingga menghasilkan analytical findings dan reports.

EDA Workbench menggabungkan:

- Guided analytical workflows.
    
- Advanced analytical exploration.
    
- Data profiling and quality assessment.
    
- Non-destructive data preparation.
    
- Statistical analysis.
    
- Visualization.
    
- Pattern and anomaly discovery.
    
- Hypothesis exploration.
    
- Modeling readiness assessment.
    
- Insights and reporting.
    

## 2.2 Product Experience

Satu analytical engine mendukung dua pengalaman pengguna.

**Guided Mode**

- Step-by-step workflow.
    
- Contextual explanations.
    
- Intelligent recommendations.
    
- Guided data preparation.
    
- Result interpretation.
    

**Advanced Mode**

- Direct access to analytical methods.
    
- Custom parameters.
    
- Advanced statistics.
    
- Python and SQL/DuckDB workflows.
    
- Custom visualizations and reports.
    

Kedua mode berbagi domain model, execution engine, dan project state yang sama.

## 2.3 Technical Foundation

|Area|Technology|
|---|---|
|Desktop Shell|PyWebView|
|Frontend|React + TypeScript|
|Frontend Build|Vite|
|Visualization|Apache ECharts|
|Backend|Python|
|IPC|PyWebView JavaScript-Python Bridge|
|Metadata Storage|SQLite|
|Analytical Storage|Parquet|
|Query Engine|DuckDB|
|Data Exchange|Apache Arrow|
|Frontend Server State|TanStack Query|
|Frontend Shared UI State|Zustand|
|Form State|React Hook Form (FE-011, Proposed)|
|Analytical Engine|Polars|

Architecture menggunakan modular monolith dengan domain-oriented modules.

Deployment bersifat local-first. Data tetap berada di lingkungan lokal secara default.

---

# 3. The Documentation Landscape

Enam belas dokumen dikelompokkan ke dalam enam architectural areas.

|Area|Documents|Primary Concern|
|---|---|---|
|Product & System Foundation|01–02|What we build and overall system structure|
|Domain & Data Foundation|03–04|Business concepts, data ownership, persistence|
|Application & Execution|05–06|How the application executes and communicates|
|User Experience & Extensibility|07–10|Frontend, UX, plugins, AI|
|Trust, Quality & Delivery|11–15|Security, reporting, testing, packaging, operations|
|Implementation Governance|16|How to build, validate, and release the product|

## 3.1 Complete Document Index

### Area A — Product & System Foundation

**Document 01 — Product Vision & Requirements**

<text color="secondary" size="sm">Product definition and requirements baseline.</text>

Defines:

- Product vision and principles.
    
- Target users and personas.
    
- EDA objectives.
    
- Ten-stage EDA workflow.
    
- Functional capabilities.
    
- Non-functional requirements.
    
- MVP scope and non-goals.
    
- Acceptance criteria and success metrics.
    

Use this document when answering:

- Why are we building this product?
    
- Who are the target users?
    
- What capabilities should the product provide?
    
- What belongs in the MVP?
    

**Document 02 — System Architecture**

<text color="secondary" size="sm">Overall system structure and architectural boundaries.</text>

Defines:

- System context.
    
- Architecture layers.
    
- Module boundaries.
    
- Runtime architecture.
    
- Desktop application structure.
    
- Communication mechanisms.
    
- Execution and concurrency.
    
- Persistence architecture.
    
- Security trust zones.
    
- Lifecycle and deployment.
    

Use this document when answering:

- How is the entire system structured?
    
- What are the major architectural components?
    
- How do components interact?
    
- Where should a new system capability belong?
    

### Area B — Domain & Data Foundation

**Document 03 — Domain Model**

<text color="secondary" size="sm">Business concepts, bounded contexts, and domain ownership.</text>

Defines:

- Bounded contexts.
    
- Domain entities and value objects.
    
- Aggregate boundaries.
    
- Domain invariants.
    
- Relationships between contexts.
    
- Domain events.
    
- State transitions.
    
- Cross-context integration.
    

Use this document when answering:

- What domain concepts exist?
    
- Who owns a particular entity?
    
- What rules must always remain true?
    
- How should domain modules communicate?
    

**Document 04 — Data & Persistence Architecture**

<text color="secondary" size="sm">Storage design and data lifecycle.</text>

Defines:

- SQLite metadata storage.
    
- Parquet analytical storage.
    
- Filesystem artifact storage.
    
- DuckDB query engine.
    
- Arrow data exchange.
    
- Project isolation.
    
- Snapshot management.
    
- Transactional persistence.
    
- Backup, restore, and migration.
    

Use this document when answering:

- Where should information be stored?
    
- How are datasets and artifacts persisted?
    
- How is data integrity maintained?
    
- How does project backup and recovery work?
    

### Area C — Application & Execution

**Document 05 — Processing & Execution Architecture**

<text color="secondary" size="sm">Analytical execution and processing engine.</text>

Defines:

- Execution request layer.
    
- Plan builder.
    
- Decision engine.
    
- Query planner.
    
- Execution planner.
    
- Resource manager.
    
- Job manager and scheduler.
    
- Transformation and analysis engines.
    
- Result validation.
    
- Artifact publication.
    

Use this document when answering:

- How does an analytical request become an executable plan?
    
- How are dependencies and execution DAGs handled?
    
- How are jobs scheduled and monitored?
    
- How are analytical results validated?
    

**Document 06 — Application & IPC Architecture**

<text color="secondary" size="sm">Application services and frontend/backend communication.</text>

Defines:

- Application use cases.
    
- Commands and queries.
    
- DTOs and typed contracts.
    
- Pydantic IPC schemas.
    
- TypeScript contract synchronization.
    
- PyWebView bridge.
    
- Request/response envelopes.
    
- Job and event communication.
    
- Error handling.
    
- IPC security and lifecycle.
    

Use this document when answering:

- How does the frontend invoke backend capabilities?
    
- How are requests and responses structured?
    
- How are long-running operations handled?
    
- How are frontend and backend contracts synchronized?
    

### Area D — User Experience & Extensibility

**Document 07 — Frontend Architecture**

<text color="secondary" size="sm">Frontend implementation architecture.</text>

Defines:

- React application structure.
    
- Feature-oriented organization.
    
- Design system.
    
- State management.
    
- IPC client.
    
- TanStack Query.
    
- Zustand.
    
- Visualization integration.
    
- Frontend testing and accessibility.
    

Use this document when answering:

- How should frontend code be organized?
    
- Where should a UI feature live?
    
- How should application state be managed?
    
- How should the frontend communicate with the backend?
    

**Document 08 — UX & Interaction Architecture**

<text color="secondary" size="sm">User workflows and interaction behavior.</text>

Defines:

- Guided and Advanced modes.
    
- Ten-stage EDA workflow.
    
- Analysis Plan review and approval.
    
- Transformation approval.
    
- Dataset exploration.
    
- Results, observations, and findings.
    
- Stale artifact behavior.
    
- Job feedback.
    
- Context preservation.
    

Use this document when answering:

- How should users navigate the EDA workflow?
    
- How does Guided Mode behave?
    
- When must users approve an operation?
    
- How should results and findings be presented?
    

**Document 09 — Plugin & Extension Architecture**

<text color="secondary" size="sm">Extensibility and third-party execution model.</text>

Defines:

- Plugin categories.
    
- Plugin manifests.
    
- Plugin SDK and contracts.
    
- Registry and lifecycle.
    
- Python environments.
    
- Permission model.
    
- Isolated execution.
    
- Dataset exchange.
    
- Plugin distribution.
    

Use this document when answering:

- How can the platform be extended?
    
- How should a plugin be developed?
    
- How are plugins isolated and authorized?
    
- How should third-party code access datasets?
    

**Document 10 — AI Architecture & Governance**

<text color="secondary" size="sm">AI integration and responsible AI execution.</text>

Defines:

- AI capabilities.
    
- Provider abstraction.
    
- Model routing.
    
- Context construction.
    
- Privacy and consent.
    
- Evidence-grounded interpretation.
    
- AI action governance.
    
- Cost management.
    
- Evaluation and audit.
    

Use this document when answering:

- Where can AI be used?
    
- How are AI providers selected?
    
- What data can be sent to external models?
    
- How are AI-generated insights validated?
    

### Area E — Trust, Quality & Delivery

**Document 11 — Security, Privacy & Threat Model**

<text color="secondary" size="sm">Security boundaries, threat analysis, and privacy controls.</text>

Defines:

- STRIDE threat model.
    
- Trust zones.
    
- Bridge security.
    
- Backend authorization.
    
- Plugin isolation.
    
- Secret management.
    
- Data classification.
    
- AI security.
    
- Audit and recovery.
    
- Security verification.
    

Use this document when answering:

- What are the system's security threats?
    
- Where are the trust boundaries?
    
- How are permissions enforced?
    
- How is sensitive data protected?
    

**Document 12 — Reporting & Export Architecture**

<text color="secondary" size="sm">Report generation and data/project export.</text>

Defines:

- Report types.
    
- Report Builder.
    
- Artifact-driven reporting.
    
- HTML/PDF rendering.
    
- Dataset export.
    
- Project export.
    
- Report export.
    
- Provenance and evidence.
    
- Export security.
    

Use this document when answering:

- How are reports generated?
    
- How are analytical claims linked to evidence?
    
- What is the difference between report, dataset, and project export?
    
- How are reports validated for freshness?
    

**Document 13 — Testing, Verification & Quality Engineering Architecture**

<text color="secondary" size="sm">Software verification and analytical correctness.</text>

Defines:

- Testing layers.
    
- Statistical reference testing.
    
- Differential and property-based testing.
    
- Persistence and IPC testing.
    
- Frontend and E2E testing.
    
- Plugin and AI testing.
    
- Security testing.
    
- Cross-platform validation.
    
- CI quality gates.
    

Use this document when answering:

- How do we verify implementation correctness?
    
- How do we test statistical methods?
    
- What tests block a release?
    
- How should quality be measured?
    

**Document 14 — Build, Packaging, Distribution & Update Architecture**

<text color="secondary" size="sm">Application packaging and release distribution.</text>

Defines:

- Bundled Python runtime.
    
- PyInstaller packaging baseline.
    
- Windows/macOS/Linux packages.
    
- Signing.
    
- SBOM and provenance.
    
- Release channels.
    
- Update management.
    
- Compatibility manifest.
    
- Recovery and migration.
    

Use this document when answering:

- How is the desktop application packaged?
    
- How are releases signed and distributed?
    
- How are updates managed?
    
- How is compatibility verified?
    

**Document 15 — Observability, Diagnostics & Operational Reliability Architecture**

<text color="secondary" size="sm">Runtime visibility, diagnostics, and operational resilience.</text>

Defines:

- Structured logs.
    
- Tracing and metrics.
    
- Health and readiness.
    
- Diagnostic bundles.
    
- Error taxonomy.
    
- Job recovery.
    
- Lifecycle management.
    
- Crash-safe persistence.
    
- Resource monitoring.
    
- Operational audit.
    
- Incident response.
    

Use this document when answering:

- How can application health be inspected?
    
- How are runtime failures diagnosed?
    
- How are interrupted jobs recovered?
    
- How is operational reliability maintained?
    

### Area F — Implementation Governance

**Document 16 — Implementation Roadmap & Delivery Strategy**

<text color="secondary" size="sm">Engineering execution and delivery governance.</text>

Defines:

- Implementation phases.
    
- M1/M2/M3 milestones.
    
- Engineering workstreams.
    
- Dependency management.
    
- Work item standards.
    
- Prioritization.
    
- Risk and technical debt management.
    
- Git workflow.
    
- CI/CD.
    
- Release governance.
    
- Capacity planning.
    
- Progress tracking.
    
- MVP acceptance.
    
- Post-MVP roadmap.
    

Use this document when answering:

- What should be implemented first?
    
- How should work be decomposed?
    
- How should dependencies be managed?
    
- What is required before an MVP release?
    
- Who approves completion?
    

---

# 4. Unified Architecture Navigation Map

The following map illustrates how the 16 documents work together.

```
flowchart TD
    A["01 Product Vision & Requirements"]
    B["02 System Architecture"]

    C["03 Domain Model"]
    D["04 Data & Persistence"]

    E["05 Processing & Execution"]
    F["06 Application & IPC"]

    G["07 Frontend Architecture"]
    H["08 UX & Interaction"]
    I["09 Plugin Architecture"]
    J["10 AI Architecture"]

    K["11 Security & Privacy"]
    L["12 Reporting & Export"]
    M["13 Testing & Quality"]
    N["14 Build & Distribution"]
    O["15 Observability & Reliability"]

    P["16 Implementation Roadmap"]

    A --> B
    B --> C
    B --> D
    C --> E
    C --> F
    D --> E
    E --> F

    F --> G
    G --> H
    E --> I
    E --> J

    B --> K
    D --> L
    E --> L
    G --> M
    E --> M
    B --> N
    B --> O

    P -. governs implementation of .-> B
    P -. governs implementation of .-> E
    P -. governs implementation of .-> M
    P -. governs implementation of .-> N
```

**How to interpret the map:**

- Document 01 defines product intent and requirements.
    
- Document 02 translates product requirements into system architecture.
    
- Documents 03–06 establish domain, data, execution, and communication foundations.
    
- Documents 07–10 define user-facing architecture and extensibility.
    
- Documents 11–15 establish security, quality, reporting, packaging, and operational requirements.
    
- Document 16 governs how all these capabilities are implemented and delivered.
    

The arrows indicate conceptual dependencies, not a mandatory document-reading or implementation sequence.

---

# 5. Cross-Document Relationship Guide

Some architectural topics are intentionally distributed across multiple documents.

The following table identifies where to look when a topic crosses architectural boundaries.

|Topic|Primary Document|Related Documents|
|---|---|---|
|Product requirements|01|08, 16|
|System module boundaries|02|03, 07|
|Domain ownership|03|02, 04, 05|
|Dataset persistence|04|03, 05, 11|
|Analytical execution|05|03, 04, 06, 13|
|Frontend/backend communication|06|02, 07, 11|
|Frontend state and components|07|06, 08|
|User workflow and approvals|08|01, 05, 07|
|Plugin execution|09|05, 11, 13|
|AI integration|10|05, 08, 11|
|Security and permissions|11|06, 09, 10, 14|
|Reporting and export|12|04, 05, 11, 13|
|Analytical correctness|13|05, 16|
|Packaging and updates|14|02, 11, 15, 16|
|Diagnostics and recovery|15|02, 04, 05, 14|
|Implementation sequencing|16|01–15|

## 5.1 Example: Implementing a New Statistical Analysis

Suppose we want to implement a correlation analysis capability.

Relevant documentation:

1. **Document 01:** Confirms the product requirement.
    
2. **Document 03:** Defines the domain concepts and ownership.
    
3. **Document 05:** Defines analysis planning and execution.
    
4. **Document 06:** Defines the IPC contract.
    
5. **Document 07:** Defines frontend integration.
    
6. **Document 08:** Defines user interaction and approval behavior.
    
7. **Document 13:** Defines analytical correctness tests.
    
8. **Document 15:** Defines execution observability.
    
9. **Document 16:** Defines implementation priority and work item delivery.
    

This prevents implementation decisions from being made in isolation.

## 5.2 Example: Adding a New Plugin

Relevant documentation:

1. Document 03 — Domain ownership.
    
2. Document 05 — Execution integration.
    
3. Document 09 — Plugin contract and runtime.
    
4. Document 11 — Permission and isolation.
    
5. Document 13 — Plugin verification.
    
6. Document 15 — Runtime diagnostics.
    
7. Document 16 — Scope and delivery governance.
    

---

# 6. Recommended Reading Paths

Not every contributor needs to read all 16 documents in sequence.

Use role-based reading paths.

## 6.1 New Contributor — Project Orientation

Recommended order:

1. Document 00 — Project Guide.
    
2. Document 01 — Product Vision.
    
3. Document 02 — System Architecture.
    
4. Document 16 — Implementation Roadmap.
    
5. Relevant technical documents for the assigned work.
    

Goal: understand the product, system boundaries, and implementation approach.

## 6.2 Software Architect

Recommended order:

1. Document 01.
    
2. Document 02.
    
3. Document 03.
    
4. Document 04.
    
5. Document 05.
    
6. Document 06.
    
7. Documents 09–11.
    
8. Document 16.
    

Goal: understand architectural consistency and cross-module dependencies.

## 6.3 Backend Developer

Recommended order:

1. Document 02.
    
2. Document 03.
    
3. Document 04.
    
4. Document 05.
    
5. Document 06.
    
6. Document 11.
    
7. Document 13.
    
8. Document 15.
    
9. Document 16.
    

Goal: understand domain ownership, persistence, execution, communication, and verification.

## 6.4 Frontend Developer

Recommended order:

1. Document 01.
    
2. Document 02.
    
3. Document 06.
    
4. Document 07.
    
5. Document 08.
    
6. Document 11.
    
7. Document 13.
    
8. Document 16.
    

Goal: understand frontend structure, UI state, user workflows, and backend integration.

## 6.5 Data & Analytics Engineer

Recommended order:

1. Document 01.
    
2. Document 03.
    
3. Document 04.
    
4. Document 05.
    
5. Document 08.
    
6. Document 12.
    
7. Document 13.
    
8. Document 15.
    
9. Document 16.
    

Goal: understand dataset lifecycle, analytical execution, statistical correctness, and evidence generation.

## 6.6 QA Engineer

Recommended order:

1. Document 01.
    
2. Document 02.
    
3. Document 05.
    
4. Document 08.
    
5. Document 11.
    
6. Document 13.
    
7. Document 14.
    
8. Document 15.
    
9. Document 16.
    

Goal: understand functional acceptance, analytical correctness, security, release gates, and reliability.

## 6.7 Release & Operations Engineer

Recommended order:

1. Document 02.
    
2. Document 04.
    
3. Document 11.
    
4. Document 13.
    
5. Document 14.
    
6. Document 15.
    
7. Document 16.
    

Goal: understand packaging, security, observability, recovery, and release governance.

---

# 7. How to Use the Documentation During Development

The documents should be used as an active engineering reference, not merely as design material.

## 7.1 Before Implementing a Feature

For each feature:

1. Identify the product requirement in Document 01.
    
2. Identify its system/module ownership in Document 02.
    
3. Check the relevant domain model in Document 03.
    
4. Review data and persistence requirements in Document 04.
    
5. Review execution behavior in Document 05.
    
6. Review application/IPC contracts in Document 06.
    
7. Review frontend and UX behavior in Documents 07–08.
    
8. Review security and privacy requirements in Document 11.
    
9. Review verification requirements in Document 13.
    
10. Identify implementation priority and dependencies in Document 16.
    

Not every feature requires every document. Consult the relevant documents according to the feature's architectural impact.

## 7.2 During Implementation

Developers should:

- Follow canonical contracts.
    
- Respect domain ownership.
    
- Avoid bypassing application boundaries.
    
- Reuse established infrastructure.
    
- Implement required error handling and diagnostics.
    
- Add tests according to Document 13.
    
- Update affected documentation.
    
- Record significant architecture changes through ADRs.
    

## 7.3 Before Completing a Work Item

Verify:

- Acceptance criteria.
    
- Relevant automated tests.
    
- Integration behavior.
    
- Error and recovery handling.
    
- Security requirements.
    
- Documentation updates.
    
- Demonstrable functionality.
    

Use Document 16's six-dimension Definition of Done.

## 7.4 Before Completing a Milestone

Verify:

- All mandatory work items accepted.
    
- Dependencies resolved.
    
- Quality gates passed.
    
- Critical risks addressed.
    
- No unresolved Critical/High defects.
    
- Required compatibility and performance evidence available.
    
- Milestone acceptance evidence documented.
    

---

# 8. Decision Traceability & Source of Truth

## 8.1 Canonical Ownership

Setiap dokumen memiliki ownership atas area tertentu.

|Decision Area|Canonical Source|
|---|---|
|Product requirements|Document 01|
|System architecture|Document 02|
|Domain definitions|Document 03|
|Persistence|Document 04|
|Processing and execution|Document 05|
|Application and IPC|Document 06|
|Frontend implementation|Document 07|
|UX behavior|Document 08|
|Plugins|Document 09|
|AI|Document 10|
|Security and privacy|Document 11|
|Reporting and export|Document 12|
|Testing and verification|Document 13|
|Packaging and updates|Document 14|
|Observability and operations|Document 15|
|Implementation and delivery|Document 16|

## 8.2 Conflict Resolution

Jika terdapat dua dokumen yang tampak memberikan aturan berbeda:

1. Identifikasi topik dan canonical owner.
    
2. Periksa apakah perbedaan tersebut memang konflik atau hanya perbedaan perspektif.
    
3. Periksa approved architecture decisions dan ADRs.
    
4. Jika konflik belum terselesaikan, jangan memilih implementasi secara sepihak.
    
5. Lakukan architecture review.
    
6. Catat keputusan melalui ADR.
    
7. Perbarui seluruh dokumen yang terdampak.
    

**Important:** Dokumen dengan nomor lebih besar tidak otomatis mengalahkan dokumen dengan nomor lebih kecil. Ownership, approval status, dan explicit decision history menentukan authoritative source.

## 8.3 Traceability Chain

Setiap capability idealnya dapat ditelusuri melalui rantai:

```
Product Requirement
        |
        v
Architecture Decision
        |
        v
Domain / Technical Design
        |
        v
Implementation Work Item
        |
        v
Source Code
        |
        v
Automated Tests
        |
        v
Execution Evidence
        |
        v
Acceptance
```

Tujuannya adalah memastikan setiap implemented capability memiliki alasan, desain, implementasi, dan bukti verifikasi yang dapat ditelusuri.

---

# 9. Documentation Governance

## 9.1 Documentation Types

Dokumentasi proyek dibedakan menjadi:

|Type|Purpose|
|---|---|
|Product Documents|Product intent and requirements|
|Architecture Documents|System structure and technical decisions|
|Implementation Documents|Engineering execution and delivery|
|ADRs|Significant architecture decisions|
|Technical References|API, schema, contracts, and module references|
|Operational Documents|Build, release, diagnostics, and recovery procedures|

## 9.2 Change Management

Setiap perubahan yang memengaruhi architecture baseline harus:

1. Mengidentifikasi dokumen yang terdampak.
    
2. Memeriksa downstream dependencies.
    
3. Menentukan apakah ADR diperlukan.
    
4. Memperbarui canonical documentation.
    
5. Memastikan implementasi dan dokumentasi tetap konsisten.
    

Gunakan Document 16 sebagai acuan governance.

## 9.3 Document Status

Gunakan status berikut:

- Draft for Review.
    
- Approved.
    
- Superseded.
    
- Deprecated.
    

Hanya dokumen yang telah disetujui yang menjadi approved baseline.

Draft tidak boleh diperlakukan sebagai approved architectural decision.

## 9.4 Documentation Maintenance

Dokumentasi harus diperbarui ketika:

- Approved architecture decisions berubah.
    
- Domain ownership berubah.
    
- IPC contracts berubah.
    
- Persistence schemas berubah.
    
- Plugin contracts berubah.
    
- Security boundaries berubah.
    
- Release procedures berubah.
    
- Implementation roadmap berubah.
    

Documentation maintenance merupakan bagian dari Definition of Done.

---

# 10. Suggested Documentation Repository Structure

Struktur dokumentasi yang direkomendasikan:

```
docs/
│
├── README.md
│
├── 00-project-guide/
│   └── 00-project-architecture-and-documentation-guide.md
│
├── 01-product/
│   └── 01-product-vision-and-requirements.md
│
├── 02-system-architecture/
│   └── 02-system-architecture.md
│
├── 03-domain/
│   └── 03-domain-model.md
│
├── 04-data/
│   └── 04-data-and-persistence-architecture.md
│
├── 05-processing/
│   └── 05-processing-and-execution-architecture.md
│
├── 06-application/
│   └── 06-application-and-ipc-architecture.md
│
├── 07-frontend/
│   └── 07-frontend-architecture.md
│
├── 08-ux/
│   └── 08-ux-and-interaction-architecture.md
│
├── 09-plugins/
│   └── 09-plugin-and-extension-architecture.md
│
├── 10-ai/
│   └── 10-ai-architecture-and-governance.md
│
├── 11-security/
│   └── 11-security-privacy-and-threat-model.md
│
├── 12-reporting/
│   └── 12-reporting-and-export-architecture.md
│
├── 13-quality/
│   └── 13-testing-verification-and-quality-engineering.md
│
├── 14-build-release/
│   └── 14-build-packaging-distribution-and-update.md
│
├── 15-operations/
│   └── 15-observability-diagnostics-and-operational-reliability.md
│
├── 16-implementation/
│   └── 16-implementation-roadmap-and-delivery-strategy.md
│
└── adr/
    └── README.md
```

The root `README.md` should link to Document 00 as the primary entry point.

The directory names are organizational suggestions. They do not change the canonical document numbering.

---

# 11. Quick Navigation Reference

Use this section as a fast lookup table.

|If you want to understand...|Read|
|---|---|
|Product purpose|01|
|Overall architecture|02|
|Domain concepts|03|
|Storage and datasets|04|
|Analytical execution|05|
|IPC and backend services|06|
|Frontend code organization|07|
|User workflow|08|
|Plugins|09|
|AI|10|
|Security and privacy|11|
|Reports and exports|12|
|Testing and correctness|13|
|Packaging and releases|14|
|Logs, diagnostics, and recovery|15|
|Implementation roadmap|16|
|Overall project navigation|00|

---

# 12. Final Guidance

EDA Workbench documentation should be treated as one connected architectural knowledge base.

The intended relationship is:

- **Document 01** explains why the product exists and what it must deliver.
    
- **Document 02** explains how the system is structured.
    
- **Documents 03–06** explain the domain, data, execution, and communication foundations.
    
- **Documents 07–10** explain the user-facing experience and extensibility.
    
- **Documents 11–15** explain how the system remains secure, correct, reliable, distributable, and operational.
    
- **Document 16** explains how the system will be built, validated, and released.
    
- **Document 00** explains how to navigate and use the complete documentation set.
    

The documentation set is not a collection of independent specifications. It is a coordinated system of architectural decisions, technical contracts, quality requirements, and implementation guidance.

**The guiding rule:**

> Every implementation decision should be traceable to the product intent, consistent with the approved architecture, verifiable through explicit quality criteria, and reflected in the canonical documentation.

---

# 13. Document Status & Approval

**Document:** 00 — Project Architecture & Documentation Guide  
**Version:** 0.1  
**Status:** Draft for Review

**Related Baseline:** Documents 01–16, approved baseline.

**Next Step:** Review this guide for completeness and navigation clarity. Once approved, designate Document 00 as the official entry point for EDA Workbench project documentation.