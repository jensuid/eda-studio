# 04 — Data & Persistence Architecture

**Product:** EDA Workbench  
**Document:** 04 — Data & Persistence Architecture  
**Version:** 0.2  
**Status:** Draft for Review — Revised for Review (WP-13)  
**Depends on:** Documents 01, 02 v0.2, 03 v0.2, 05 v0.2, 06 v0.2, 11 v0.3, 12 v0.2

> **Revision note (WP-13):** v0.2 defines `metadata.json` (IN-G closure), records the DuckDB/Polars/Arrow execution-vs-storage boundary (IN-A), separates persistence of security audit from execution provenance (SYS-018), and fixes §20 numbering. No new storage technology is selected.

---

## 1. Purpose

This document defines how EDA Workbench persists, organizes, retrieves, validates, backs up, and restores project data.

It translates the canonical domain model into a practical storage architecture.

Primary objectives:

- Preserve data integrity and reproducibility.
    
- Keep original data immutable.
    
- Support large analytical datasets without storing them inside SQLite.
    
- Separate transactional metadata from analytical data and generated artifacts.
    
- Provide reliable backup, restore, and project portability.
    
- Support efficient queries through DuckDB and Arrow.
    
- Keep storage local-first and project-scoped.
    

This document defines logical storage architecture and persistence contracts. Exact SQL DDL, indexes, and migration scripts belong to implementation specifications.

## 2. Persistence Principles

1. **Project isolation:** Each project owns its persistent data boundary.
    
2. **Local-first:** Project data remains local by default.
    
3. **Immutable snapshots:** Source snapshots and materialized outputs are never overwritten.
    
4. **Metadata/payload separation:** SQLite stores metadata and references; large data payloads live in analytical storage.
    
5. **Single source of truth:** Every persistent object has one authoritative owner.
    
6. **Reference-based composition:** Artifacts and reports reference datasets and other artifacts through stable IDs.
    
7. **Transactional file operations:** Multi-resource writes use staging, validation, commit, and cleanup.
    
8. **Recoverability:** Corruption, interrupted writes, and missing files must be detectable and recoverable where possible.
    
9. **Rebuildable cache:** Cache is disposable and never authoritative.
    
10. **Portability:** Project data should move across supported operating systems without depending on machine-specific absolute paths.
    

## 3. Storage Architecture Overview

EDA Workbench uses a polyglot persistence model.

|Storage Technology|Primary Responsibility|
|---|---|
|SQLite|Transactional project metadata and operational records|
|Parquet|Immutable analytical dataset snapshots and materialized data|
|Filesystem|Artifact payloads, reports, exports, attachments and plugin resources|
|DuckDB|Analytical query and execution engine|
|Apache Arrow|In-memory and inter-process analytical data exchange|
|Local cache|Reusable intermediate results and performance optimization|

### 3.1 Logical Architecture

```
                 EDA Workbench Project
                           |
             +-------------+-------------+
             |             |             |
             v             v             v
          SQLite        Parquet       Filesystem
        Metadata       Data Store     Payload Store
             |             |             |
             +-------------+-------------+
                           |
                           v
                    Persistence Layer
                           |
                 +---------+---------+
                 |                   |
                 v                   v
              DuckDB             Arrow IPC
          Query Execution      Data Exchange
                 |
                 v
          Analytical Results
                 |
                 v
          Typed Artifact Store
```

DuckDB and Arrow are processing/exchange components, not authoritative persistence stores.

## 4. Project Storage Boundary

### 4.1 One Project, One Persistence Boundary

Each project owns:

- One SQLite project database.
    
- Its managed dataset snapshots.
    
- Its analytical artifacts.
    
- Its reports and exports.
    
- Its project-specific configuration and metadata.
    
- Its local cache.
    

Application-level resources remain outside individual projects:

- Application preferences.
    
- Plugin registry.
    
- Shared plugin environments.
    
- Shared templates.
    
- Global diagnostics.
    
- Global provider registry.
    
- Shared reusable infrastructure.
    

Cross-project access is never implicit. A user or explicitly authorized application workflow must select the relevant project.

### 4.2 Recommended Directory Structure

```
project-name.edaworkspace/
│
├── project.db
│
├── datasets/
│   └── <dataset_id>/
│       ├── metadata.json
│       └── snapshots/
│           ├── <snapshot_id>.parquet
│           └── <snapshot_id>.parquet
│
├── artifacts/
│   ├── profiling/
│   ├── quality/
│   ├── analysis/
│   ├── visualization/
│   ├── anomaly/
│   ├── segmentation/
│   ├── insights/
│   └── reports/
│
├── reports/
│   ├── generated/
│   └── attachments/
│
├── exports/
│
├── cache/
│
└── manifest.json
```

This is a logical layout. Internal directory organization may evolve without changing public domain contracts.

SQLite remains the authoritative metadata source. Filesystem metadata files are optional indexes or portability aids, not competing sources of truth.

#### 4.2.1 `metadata.json` definition (IN-G closure)

Each `datasets/<dataset_id>/metadata.json` is a **portability index** regenerated from `project.db`; it is never edited independently and never overrides SQLite. Minimum schema:

| Field | Meaning |
|---|---|
| `dataset_id` | Stable domain identifier (Doc03 §6) |
| `snapshot_refs[]` | Snapshot IDs + relative Parquet paths + content fingerprint |
| `schema_summary` | Column names/types only — no raw data values |
| `classification` | Effective data classification label (Doc11 §15, SEC-013 Proposed) |
| `provenance_refs[]` | References to execution/provenance records, not copies |
| `schema_version` | Version of this file format |

Rules: (1) on conflict, SQLite wins and the file is regenerated; (2) the file must not contain raw dataset values, secrets, or credentials; (3) `manifest.json` at project root follows the same rule (project-level portability index, SQLite authoritative).

## 5. SQLite Metadata Architecture

### 5.1 Responsibilities

SQLite stores transactional and relational metadata, including:

- Project identity and configuration.
    
- Dataset and data source metadata.
    
- Dataset schema and column definitions.
    
- Snapshot metadata and storage references.
    
- Relationship definitions.
    
- Pipeline definitions and revisions.
    
- Transformation operation configurations.
    
- Analysis plans and revisions.
    
- Execution metadata and job references.
    
- Artifact metadata and dependencies.
    
- Findings, hypotheses, and annotations.
    
- Workflow progress.
    
- Report definitions and generation metadata.
    
- Domain event records.
    
- Persistence operation records.
    
- Migration and recovery metadata.
    

SQLite must not store large raw datasets, complete DataFrames, or large analytical payloads as ordinary database records.

### 5.2 Logical Metadata Groups

|Logical Group|Main Records|
|---|---|
|Project|projects, project_settings|
|Data|data_sources, datasets, dataset_columns, schema_versions|
|Snapshots|dataset_snapshots, snapshot_checksums|
|Relationships|dataset_relationships|
|Transformation|pipelines, pipeline_revisions, operations, transformation_executions|
|Analysis|analysis_plans, plan_revisions, analysis_executions|
|Artifacts|artifacts, artifact_dependencies|
|Insights|findings, observations, hypotheses, annotations|
|Workflow|workflows, workflow_stages, workflow_progress|
|Reporting|reports, report_generations|
|Jobs & Events|jobs, domain_events, event_consumers|
|Persistence|file_operations, migrations, recovery_records|

These are logical groupings, not final table names or a mandatory one-table-per-entity design.

### 5.3 SQLite Configuration

Recommended baseline:

- WAL journal mode.
    
- Foreign key enforcement enabled.
    
- Serialized write coordinator per project.
    
- Independent short-lived read operations.
    
- Bounded busy timeout and retry policy.
    
- Controlled WAL checkpointing.
    
- Explicit transaction boundaries.
    
- Optimistic concurrency for mutable aggregates.
    
- Coordinated backup through SQLite Backup API.
    

SQLite supports concurrent readers but only one writer at a time. The write coordinator must serialize writes and avoid long-running transactions.

Analytical execution must never hold a SQLite write transaction open.

### 5.4 Metadata Consistency

- Stable primary IDs for domain entities.
    
- Foreign keys for internal relational integrity.
    
- Unique constraints for identity and version rules.
    
- Explicit schema version and migration history.
    
- Timestamps stored in a consistent machine-readable format.
    
- Structured JSON only for flexible metadata, not as a substitute for relational integrity.
    
- Large payloads stored externally with references and checksums.
    

## 6. Analytical Data Storage

### 6.1 Parquet as Default Managed Format

Parquet is the default format for managed analytical snapshots.

Reasons:

- Columnar storage.
    
- Efficient analytical reads.
    
- Compression support.
    
- Broad ecosystem compatibility.
    
- Efficient projection and predicate-oriented workloads.
    
- Suitable integration with DuckDB and Arrow.
    

Snapshot metadata should include:

- snapshot_id
    
- dataset_id
    
- created_at
    
- content_fingerprint
    
- schema_fingerprint
    
- row_count
    
- storage_format
    
- storage_location
    
- source_version
    
- engine_version
    
- validation_status
    

### 6.2 Immutable Snapshot Lifecycle

```
Created
   |
   v
Validated
   |
   v
Active
   |
   v
Superseded
   |
   v
Archived
```

Rules:

- A committed snapshot is never modified in place.
    
- New content produces a new logical snapshot.
    
- Identical physical content may be deduplicated.
    
- Logical snapshot identity and provenance remain separate from physical storage identity.
    
- Retention and deletion must respect references and recovery policies.
    

### 6.3 Content-Aware Snapshot Identity

Use two distinct fingerprints:

**Content fingerprint**

- Represents dataset content.
    
- Used for integrity verification and physical deduplication.
    

**Schema fingerprint**

- Represents schema structure.
    
- Used to detect schema-only changes and assess compatibility.
    

A preliminary fingerprint may be used during import or change detection. Full content verification is performed when required by integrity or lifecycle policy.

Deduplication must not erase logical snapshot history, source identity, or provenance.

### 6.4 External References

External Reference datasets point to user-managed sources rather than copying all source data.

The system must retain:

- Source URI or connection reference.
    
- Connector type and configuration reference.
    
- Last known schema and source metadata.
    
- Last successful validation.
    
- Availability and freshness status.
    

External source data is not copied by default during backup or project packaging.

If an external source becomes unavailable, the dataset must be marked unavailable or stale. The system must not silently substitute another source or snapshot.

## 7. Artifact Payload Storage

### 7.1 Metadata and Payload Separation

Artifact metadata belongs in SQLite.

Artifact payloads are stored according to their type:

|Artifact Type|Preferred Payload|
|---|---|
|Profiling|JSON|
|Quality assessment|JSON|
|Statistical results|JSON|
|Tabular analytical results|Parquet|
|Large analytical exchange|Arrow IPC|
|Visualization|ECharts-compatible JSON specification|
|AI interpretation|Structured JSON|
|Reports|HTML/PDF files|
|Attachments|Original file format|

The artifact record must reference its payload location and integrity information.

### 7.2 Artifact Metadata

Every artifact should have:

- artifact_id
    
- project_id
    
- artifact_type
    
- dataset_id, where applicable
    
- snapshot_id or view reference, where applicable
    
- execution_id
    
- method and version
    
- parameters
    
- status
    
- created_at
    
- provenance
    
- dependency references
    
- payload location
    
- payload checksum
    

### 7.3 Immutable Artifact Lifecycle

```
Created → Validated → Available
                       |
                       +→ Stale
                       +→ Invalid
                       +→ Superseded
                       +→ Archived
```

Rules:

- Existing artifacts are not overwritten by reruns.
    
- Rerunning an analysis creates a new artifact.
    
- User annotations are stored separately from immutable execution evidence.
    
- Dependency changes may mark artifacts stale or invalid.
    
- Payload deduplication may share physical bytes but must preserve logical artifact identity.
    

## 8. Persistence Layer and Repository Contracts

Domain contexts must not directly manipulate SQLite connections or filesystem paths.

Use a layered persistence abstraction:

```
Domain Model
     |
     v
Application Services
     |
     v
Repository / Persistence Contracts
     |
     v
Persistence Implementations
     |
     +---- SQLite Metadata Store
     +---- Parquet Snapshot Store
     +---- Artifact Payload Store
     +---- Report / Export Store
     +---- Cache Store
```

### 8.1 Repository Responsibilities

- Load and persist domain aggregates.
    
- Enforce mapping between domain models and storage models.
    
- Apply optimistic concurrency checks.
    
- Coordinate transactions where appropriate.
    
- Return typed persistence errors.
    
- Hide physical storage implementation from domain logic.
    

### 8.2 Unit of Work

Unit of Work coordinates short transactional changes within a project database.

It should:

- Begin a transaction.
    
- Track metadata changes.
    
- Commit atomically.
    
- Roll back on failure.
    
- Respect aggregate version checks.
    

It should not attempt to make SQLite and arbitrary filesystem operations appear as one native ACID transaction. Cross-resource consistency is handled by the staged file-operation protocol.

## 9. Transactional File Operations

Filesystem and SQLite changes cannot be assumed to share one atomic transaction.

Use an explicit staged protocol:

```
1. Prepare
   |
2. Write temporary payload
   |
3. Validate payload and checksum
   |
4. Commit metadata transaction
   |
5. Finalize payload location
   |
6. Mark operation complete
   |
7. Cleanup temporary files
```

Implementation must account for crash points between steps.

Required capabilities:

- Unique operation IDs.
    
- Temporary staging locations.
    
- Durable operation status.
    
- Idempotent recovery.
    
- Orphan detection.
    
- Missing-payload detection.
    
- Safe cleanup.
    
- Reconciliation between metadata references and physical files.
    

The exact ordering and recovery protocol must ensure that a committed metadata record never silently points to an unverified or missing payload.

## 10. Query and Data Exchange

### 10.1 DuckDB

DuckDB is the primary local analytical query engine.

Responsibilities:

- Query Parquet snapshots.
    
- Execute filtering, projection, aggregation, and joins.
    
- Support analytical views.
    
- Push down supported operations.
    
- Support larger-than-memory analytical workloads where feasible.
    
- Provide query execution and explain-plan information.
    

DuckDB is not the authoritative owner of project metadata.

### 10.2 Apache Arrow

Arrow is the preferred analytical interchange format.

Polars (IN-A record): Polars is an **execution adapter** (Doc05), zero-copy interoperable with Arrow; it is not a storage format and does not own persistence. Parquet remains the managed storage format (§6.1); Arrow is the interchange format; DuckDB is the primary query engine; Polars executes lazy/columnar transformations where the execution planner selects it. This resolves IN-A at the architecture level: the summary documents (Doc00 §2.3) should list Polars as an execution adapter, not omit it — Doc00 itself is revised only in WP-17.

Use it for:

- In-process columnar data exchange.
    
- Inter-process analytical payload transfer.
    
- Plugin data exchange.
    
- Bounded result transfer to frontend services.
    
- Efficient conversion between compatible analytical engines.
    

### 10.3 IPC Data Transfer Rules

Do not serialize complete DataFrames to JSON for ordinary IPC.

Use:

- Bounded JSON for metadata, status, configuration, and small summaries.
    
- JSON previews for limited row/column display.
    
- Arrow IPC or controlled references for analytical payloads.
    
- Dataset/artifact references for large data.
    
- DuckDB query pushdown when moving data would be expensive.
    

All frontend previews must be bounded by configurable row, column, and payload limits.

## 11. Cache Persistence

Cache is a performance optimization, not authoritative project data.

### 11.1 Cache Levels

- L1: frontend/session memory.
    
- L2: local disk cache.
    
- L3: reusable analytical artifacts.
    

### 11.2 Cache Key

Cache identity should include relevant dependencies:

- Dataset and snapshot identity.
    
- View or pipeline revision.
    
- Query specification.
    
- Analysis method and parameters.
    
- Schema and semantic type version.
    
- Engine and library versions.
    
- Exact, approximate, or sampled execution mode.
    

### 11.3 Cache Lifecycle

- LRU default eviction.
    
- Optional TTL for temporary entries.
    
- Per-project and global size budgets.
    
- Pin active entries when appropriate.
    
- Dependency-aware invalidation.
    
- Corrupt or incompatible entries are discarded.
    
- Cache can be rebuilt after restore.
    

Exact and approximate results must never share an indistinguishable cache identity.

## 12. Backup and Recovery

### 12.1 Backup Scope

Include:

- Project SQLite database.
    
- Managed dataset snapshots.
    
- Pipeline definitions and revisions.
    
- Analysis plans and execution metadata.
    
- Artifact payloads.
    
- Findings, annotations, and hypotheses.
    
- Reports and attachments.
    
- Project configuration and manifest.
    

Exclude by default:

- Rebuildable cache.
    
- Temporary execution files.
    
- External source data not managed by the project.
    

### 12.2 Backup Strategy

Support:

- Full backup.
    
- Incremental backup.
    
- Manual backup.
    
- Optional scheduled backup.
    
- Configurable retention and storage budgets.
    

Backup consistency requires:

- SQLite Backup API or equivalent coordinated database snapshot.
    
- Capture of immutable file references.
    
- Coordination with in-progress file operations.
    
- Manifest and checksums.
    
- Validation before finalization.
    

### 12.3 Restore Strategy

Default restore target is a new project location.

Restore must:

1. Validate the backup manifest.
    
2. Verify checksums and required files.
    
3. Check application/schema compatibility.
    
4. Restore metadata and payloads.
    
5. Reconcile references.
    
6. Identify missing external dependencies.
    
7. Rebuild disposable cache.
    
8. Verify project integrity.
    

The original project remains untouched until the restored copy has passed validation.

Never silently replace missing or corrupt source data with an unrelated copy.

## 13. Project Portability

### 13.1 Package Format

Use a versioned ZIP-based `.edaworkspace` package.

The package contains:

- Manifest.
    
- Project database.
    
- Selected managed snapshots.
    
- Artifact payloads.
    
- Pipelines and configuration.
    
- Reports and attachments.
    
- Compatibility metadata.
    

### 13.2 Export Profiles

|Profile|Contents|
|---|---|
|Complete Project|Project metadata and all selected managed data and artifacts|
|Project Without Data|Metadata and analysis structure without managed source snapshots|
|Analysis Package|Selected datasets/snapshots and relevant analysis artifacts|
|Report Package|Reports and their required evidence/attachments|

### 13.3 Import Validation

Import flow:

`Select → Inspect → Validate → Compatibility Check → Review Dependencies → Import → Verify`

Security requirements:

- Prevent archive path traversal.
    
- Validate manifest and checksums.
    
- Enforce archive size and resource limits.
    
- Validate paths and file types.
    
- Do not automatically execute imported plugins or scripts.
    
- Require approval for external dependencies.
    
- Preserve the original package on failed import.
    

Paths must be portable and relative where possible. Machine-specific absolute paths must not be the primary identity mechanism.

## 14. Schema Evolution and Migrations

SQLite schema changes must use versioned migrations.

Requirements:

- Ordered and identifiable migrations.
    
- Compatibility checks before migration.
    
- Backup before high-risk migrations.
    
- Transactional migration where supported.
    
- Migration failure recovery.
    
- Post-migration integrity validation.
    
- Documented upgrade and rollback limitations.
    

Dataset schema evolution is separate from SQLite schema evolution.

Dataset schema changes must:

- Create a new schema version.
    
- Preserve old snapshots.
    
- Identify added, removed, renamed, and type-changed columns where detectable.
    
- Assess downstream pipeline and artifact impact.
    
- Require user review where semantic interpretation is uncertain.
    

## 15. Integrity and Recovery Controls

The persistence layer must detect:

- Missing snapshot payloads.
    
- Missing artifact payloads.
    
- Checksum mismatches.
    
- Corrupt Parquet files.
    
- Invalid metadata references.
    
- Orphaned payloads.
    
- Interrupted file operations.
    
- Incomplete migrations.
    
- Unclean shutdown and interrupted jobs.
    

Persistence of evidence (SYS-018): execution provenance records and security audit records are persisted as **distinct record families** with distinct ownership (Doc11 §14 / SEC-012; Doc12 §17). They share correlation identifiers (`job_id`, `request_id`, `correlation_id`, `export_id`) but neither family is derived from, overwritten by, or stored as a copy of the other. Audit record integrity, access restriction, and redaction follow Doc11 §14.3; provenance immutability/correction-by-append follows Doc12 §17.

Recovery rules:

- Never silently overwrite a known-good payload.
    
- Never silently change a dataset's source.
    
- Preserve recoverable metadata and evidence.
    
- Quarantine suspicious files where appropriate.
    
- Record recovery actions.
    
- Surface unresolved integrity problems to the user.
    

## 16. Security and Privacy

- Project storage is local by default.
    
- Secrets and credentials belong in OS credential storage, not project.db as plaintext.
    
- External connection secrets are stored by reference.
    
- Filesystem paths and metadata are validated.
    
- Project package imports are treated as untrusted input.
    
- Diagnostic logs must not include raw dataset values or credentials.
    
- Cloud backup or synchronization requires explicit user choice.
    
- Export operations must surface sensitive-data warnings where appropriate.
    
- Audit failure semantics (Doc11 §14.4): failure to record a security-critical event must block or safely fail the protected operation where policy requires that evidence; it must not silently proceed.
    
- Default-deny authorization at service boundaries (SEC-004, Proposed) is enforced above the persistence layer; the repository layer additionally validates project ownership of every referenced resource.
    

## 17. Performance and Resource Management

Persistence and query operations must respect configurable resource budgets.

Consider:

- SQLite transaction duration.
    
- Parquet file size and partition strategy.
    
- Query memory consumption.
    
- Disk-space availability.
    
- Concurrent background jobs.
    
- Cache size and eviction.
    
- Backup and restore throughput.
    
- Large project import/export.
    

Large data operations must run outside the UI and IPC request thread.

Performance targets should be established through representative benchmarks rather than arbitrary assumptions.

## 18. Observability

Record structured metadata for:

- Storage operations.
    
- Snapshot creation and verification.
    
- Artifact persistence.
    
- Query execution.
    
- Cache hit/miss and invalidation.
    
- Backup and restore.
    
- Migration.
    
- Recovery and integrity checks.
    

Diagnostics should include operation IDs, durations, storage status, and safe error categories.

Do not log raw dataset contents, credentials, or sensitive project values by default.

## 19. Deferred Decisions

The following are intentionally deferred:

- Exact SQLite DDL and indexes.
    
- ORM selection and repository implementation.
    
- Detailed Parquet partitioning strategy.
    
- Compression and encoding defaults.
    
- Content fingerprint algorithm.
    
- Deduplication garbage collection implementation.
    
- Cache serialization details.
    
- Incremental backup algorithm.
    
- Encryption-at-rest policy and key management details.
    
- Detailed storage quotas and benchmark thresholds.
    
- Exact package manifest schema.
    

These should be resolved during implementation planning and relevant technical ADRs.

## 20. Traceability

|Related Document|Contribution|
|---|---|
|01 — Product Vision & Requirements|Local-first, non-destructive and reproducible product requirements|
|02 — System Architecture|Persistence components and technology boundaries|
|03 — Domain Model|Entity ownership, identities, aggregate boundaries|
|05 — Processing & Execution Architecture|Query execution, jobs and materialization|
|06 — Application & IPC Architecture|Persistence-facing application contracts|
|09 — Plugin & Extension Architecture v0.4|Plugin data exchange and storage access|
|11 — Security, Privacy & Threat Model v0.3|Data protection and import/export security|
|12 — Reporting & Export Architecture v0.2|Artifact and report payload persistence|
|13 — Testing, Verification & Quality Engineering Architecture|Integrity, migration, backup and recovery validation|
|14 — Build, Packaging, Distribution & Update Architecture|Project portability and application upgrades|

## 21. Completion Criteria

Document 04 is ready for approval when:

- Storage responsibilities are unambiguous.
    
- SQLite, Parquet, filesystem, DuckDB, and Arrow boundaries are explicit.
    
- Snapshot and artifact immutability are preserved.
    
- Cross-resource write recovery is defined.
    
- Project isolation and portability are addressed.
    
- Backup and restore cover authoritative project data.
    
- Cache remains disposable.
    
- Integrity and migration requirements are explicit.
    
- The design remains consistent with Documents 01–03.
    
- `metadata.json`/`manifest.json` are defined as derived portability indexes with SQLite authoritative.
    
- Audit and provenance persistence are documented as distinct record families (SYS-018).