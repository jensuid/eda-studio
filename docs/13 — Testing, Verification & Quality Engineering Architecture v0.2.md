# 13 — Testing, Verification & Quality Engineering Architecture

**Project:** EDA Workbench  
**Document:** 13 — Testing, Verification & Quality Engineering Architecture  
**Version:** 0.2  
**Status:** Draft for Review — Revised for Review (WP-23)  
**Depends on:** Documents 01–12

> **Revision note (WP-23):** Adds IN-F gate ownership cross-references. No test strategy changes.

---

## 1. Purpose

Dokumen ini mendefinisikan testing strategy, verification framework, dan quality engineering practices untuk EDA Workbench.

Tujuan utama:

- Memastikan domain logic dan application behavior benar.
    
- Memastikan statistical computations akurat.
    
- Memastikan analytical results reproducible.
    
- Memastikan execution engine memilih strategi yang benar.
    
- Memastikan storage dan artifact integrity terjaga.
    
- Memastikan frontend dan backend berkomunikasi secara konsisten.
    
- Memastikan plugins dan AI tidak melanggar security boundaries.
    
- Memastikan aplikasi berfungsi pada Windows, macOS, dan Linux.
    
- Mendeteksi regression sebelum release.
    

Testing harus menjadi bagian dari architecture dan development workflow, bukan aktivitas terakhir sebelum release.

## 2. Quality Engineering Principles

|Principle|Description|
|---|---|
|Correctness first|Analytical correctness lebih penting daripada performa|
|Test at boundaries|Setiap module dan trust boundary harus diuji|
|Reproducibility|Hasil harus dapat diverifikasi ulang|
|Deterministic tests|Hindari flaky tests|
|Risk-based testing|Prioritaskan komponen dengan risiko tertinggi|
|Independent verification|Critical results diverifikasi dengan independent references|
|Continuous validation|Testing berjalan sepanjang development|
|Observable failures|Failure harus dapat didiagnosis|
|Cross-platform confidence|Platform differences diuji secara eksplisit|

## 3. Quality Dimensions

EDA Workbench menggunakan beberapa quality dimensions.

|Dimension|Quality Objective|
|---|---|
|Functional correctness|Fitur bekerja sesuai requirements|
|Analytical correctness|Statistical results benar|
|Reproducibility|Hasil dapat diulang dengan kondisi yang sama|
|Data integrity|Data dan artifacts tidak rusak|
|Reliability|Sistem menangani failure dengan aman|
|Performance|Execution memenuhi resource constraints|
|Security|Unauthorized access dan data leakage dicegah|
|Usability|Workflow dapat digunakan dan dipahami|
|Compatibility|Komponen dan project versions kompatibel|
|Portability|Aplikasi berjalan di target OS|

## 4. Testing Architecture

Testing menggunakan layered architecture.

```
┌─────────────────────────────────────────────┐
│              Quality Gates                  │
│ Build / Release / Security / Performance    │
└──────────────────────┬──────────────────────┘
                       |
┌──────────────────────v──────────────────────┐
│                E2E Tests                    │
│ Complete user workflows                    │
└──────────────────────┬──────────────────────┘
                       |
┌──────────────────────v──────────────────────┐
│           Integration Tests                 │
│ IPC / Storage / Engine / Plugins / AI        │
└──────────────────────┬──────────────────────┘
                       |
┌──────────────────────v──────────────────────┐
│                Contract Tests               │
│ API / Events / Plugin SDK / Schemas          │
└──────────────────────┬──────────────────────┘
                       |
┌──────────────────────v──────────────────────┐
│                  Unit Tests                 │
│ Domain / Application / Statistical Logic    │
└─────────────────────────────────────────────┘
```

Additional verification layers:

- Property-based testing.
    
- Differential testing.
    
- Performance and stress testing.
    
- Security testing.
    
- Cross-platform testing.
    
- Manual exploratory testing.
    

## 5. Unit Testing

Unit tests validate isolated components without requiring the full application runtime.

### 5.1 Domain Tests

Test:

- Aggregate invariants.
    
- Value object validation.
    
- State transitions.
    
- Domain policies.
    
- Revision and version checks.
    
- Relationship constraints.
    
- Artifact lifecycle rules.
    
- Domain event creation.
    

Examples:

- A transformation cannot modify an immutable original snapshot.
    
- An unapproved Analysis Plan cannot execute.
    
- A stale plan revision cannot reuse an earlier approval.
    
- A Finding cannot reference a nonexistent Observation.
    
- Invalid lifecycle transitions are rejected.
    

### 5.2 Application Tests

Test:

- Use-case orchestration.
    
- Authorization decisions.
    
- Dependency interactions.
    
- Transaction boundaries.
    
- Error mapping.
    
- Job lifecycle.
    
- Retry and cancellation behavior.
    

External dependencies should be replaced with controlled fakes or mocks where appropriate.

### 5.3 Unit Test Rules

- Tests should be independent.
    
- Avoid hidden shared state.
    
- Avoid real network access.
    
- Use deterministic inputs.
    
- Test success and failure paths.
    
- Verify externally observable behavior, not implementation details.
    

## 6. Analytical Correctness Testing

Analytical correctness is a first-class testing concern.

### 6.1 Statistical Reference Tests

Statistical implementations must be validated against:

- Established mathematical definitions.
    
- Trusted reference implementations.
    
- Hand-calculated small datasets.
    
- Published reference datasets where applicable.
    

Test coverage should include:

- Descriptive statistics.
    
- Distribution metrics.
    
- Correlation.
    
- Statistical tests.
    
- Confidence intervals.
    
- Effect sizes.
    
- Outlier detection.
    
- Missing value analysis.
    
- Clustering and segmentation.
    
- Association analysis.
    

### 6.2 Edge Cases

Every statistical method should test relevant edge cases:

- Empty dataset.
    
- Single observation.
    
- Constant values.
    
- All-null column.
    
- Insufficient sample size.
    
- Duplicate observations.
    
- Highly skewed distributions.
    
- Extreme values.
    
- Non-finite values.
    
- Mixed or invalid data types.
    

Expected behavior must be explicit: valid result, warning, or controlled error.

### 6.3 Numerical Tolerance

Floating-point results should use method-appropriate tolerances.

Tests should distinguish:

- Exact equality for discrete values and deterministic metadata.
    
- Absolute tolerance for values near zero.
    
- Relative tolerance for scale-dependent numerical results.
    

Tolerance must not be so broad that incorrect results pass.

### 6.4 Assumption Validation

Statistical tests must verify that:

- Assumptions are evaluated.
    
- Failed assumptions are reported.
    
- Alternative methods are selected only through explicit planning.
    
- The engine does not silently change methods.
    
- Results retain sample size, assumptions, and limitations.
    

### 6.5 Statistical Result Contract

Tests must verify that statistical results include the required fields:

- Method identifier and version.
    
- Input snapshot and column references.
    
- Sample size.
    
- Statistic and p-value where applicable.
    
- Effect size where applicable.
    
- Confidence interval where applicable.
    
- Assumption validation.
    
- Execution mode.
    
- Limitations and warnings.
    
- Provenance metadata.
    

A mathematically correct number without sufficient context is not a complete analytical result.

## 7. Differential and Property-Based Testing

### 7.1 Differential Testing

Where multiple implementations are available, compare results across independent engines.

Examples:

- DuckDB vs Polars.
    
- Python implementation vs trusted statistical library.
    
- Exact execution vs equivalent SQL computation.
    
- Alternative implementations of the same transformation.
    

Differences must be interpreted according to:

- Numerical precision.
    
- Null semantics.
    
- Type conversion.
    
- Sorting and grouping semantics.
    
- Approximation behavior.
    

A difference does not automatically imply a bug; it must be explained and documented.

### 7.2 Property-Based Testing

Use generated inputs to verify general properties.

Examples:

- Sorting preserves row count.
    
- Filtering never increases row count.
    
- Deduplication does not increase unique-key count.
    
- A no-op transformation preserves values.
    
- Reordering independent columns does not change column-wise statistics.
    
- Serialization followed by deserialization preserves valid metadata.
    
- Repeated deterministic execution produces equivalent results.
    

Property tests should use bounded input sizes and reproducible seeds.

## 8. Execution Engine Testing

Test the execution planner and adapters independently.

### 8.1 Query Planner

Verify:

- Correct strategy selection.
    
- Capability compatibility.
    
- Resource-aware planning.
    
- Pushdown eligibility.
    
- Streaming and partitioning decisions.
    
- Exact/approximate/sampled mode preservation.
    
- No silent execution downgrade.
    

### 8.2 DAG Execution

Verify:

- Independent tasks can execute concurrently.
    
- Dependent tasks wait for prerequisites.
    
- Failed prerequisites block dependents.
    
- Successful tasks are preserved after partial failure.
    
- Selective retry does not rerun unaffected tasks.
    
- Cancellation propagates correctly.
    
- Resource limits are enforced.
    

### 8.3 Job Manager

Verify lifecycle transitions:

- Queued.
    
- Running.
    
- Completed.
    
- Failed.
    
- Cancelled.
    
- Blocked.
    

Also verify:

- Progress event ordering.
    
- Recovery after application restart.
    
- Retry behavior.
    
- Duplicate request handling.
    
- Resource cleanup.
    

### 8.4 Performance and Resource Tests

Test representative workloads for:

- Memory consumption.
    
- CPU utilization.
    
- Disk throughput.
    
- Query latency.
    
- Startup overhead.
    
- Cancellation responsiveness.
    
- Concurrent job admission.
    

Performance tests should record environment details and dataset characteristics.

## 9. Data and Persistence Testing

### 9.1 SQLite

Test:

- Schema migrations.
    
- Transaction rollback.
    
- WAL behavior.
    
- Concurrent read/write coordination.
    
- Foreign key constraints.
    
- Crash recovery.
    
- Backup and restore.
    

### 9.2 Parquet and Filesystem

Test:

- Snapshot integrity.
    
- Schema compatibility.
    
- Content fingerprint consistency.
    
- Partial write recovery.
    
- Atomic publication.
    
- Missing and corrupted payload detection.
    
- Path traversal prevention.
    
- Cross-platform filesystem behavior.
    

### 9.3 Project Portability

Verify:

- Export/import round trip.
    
- Manifest validation.
    
- Version compatibility.
    
- Missing optional dependencies.
    
- Integrity checksums.
    
- Preservation of IDs and lineage.
    
- Rejection of malicious archive paths.
    

### 9.4 Cache Testing

Verify:

- Correct cache key generation.
    
- Dependency-aware invalidation.
    
- No reuse of stale results.
    
- Cache corruption recovery.
    
- Cache rebuildability.
    

## 10. IPC and Contract Testing

IPC contracts are a critical boundary between React and Python.

Tests must verify:

- Pydantic schema validation.
    
- TypeScript contract compatibility.
    
- Request and response envelope.
    
- Stable error codes.
    
- Request ID correlation.
    
- Pagination and bounded payloads.
    
- Job ID lifecycle.
    
- Event sequence handling.
    
- Reconnect and replay behavior.
    
- Unauthorized command rejection.
    

Contract tests should detect incompatible schema changes before frontend/backend integration.

## 11. Frontend Testing

### 11.1 Component Tests

Test:

- Rendering.
    
- User interactions.
    
- Validation feedback.
    
- Loading and error states.
    
- Accessibility semantics.
    
- Empty and partial states.
    

### 11.2 Feature Tests

Test complete feature behavior:

- Dataset selection.
    
- Profiling display.
    
- Transformation review.
    
- Analysis Plan approval.
    
- Chart interaction.
    
- Finding creation.
    
- Report configuration.
    
- Export review.
    

### 11.3 Frontend State Tests

Verify:

- TanStack Query server-state behavior.
    
- Zustand session/UI state.
    
- Local component state.
    
- Cache invalidation.
    
- Event-driven updates.
    
- Context preservation across mode switching.
    
- Recovery after WebView reload.
    

### 11.4 Visual Regression

Use selective visual regression tests for:

- Main application shell.
    
- Guided workflow.
    
- Dataset explorer.
    
- Analysis workspace.
    
- Report preview.
    
- Critical dialogs.
    

Visual tests should avoid brittle snapshots of frequently changing dynamic data.

## 12. Plugin Security and Compatibility Testing

Test:

- Manifest validation.
    
- SDK compatibility.
    
- Permission enforcement.
    
- Runtime isolation.
    
- Invalid plugin output.
    
- Timeout and cancellation.
    
- Crash containment.
    
- Resource exhaustion.
    
- Filesystem and network restrictions.
    
- Dependency conflicts.
    
- Signature and package integrity validation.
    

A plugin must not gain additional permissions through malformed requests or altered runtime context.

## 13. AI Testing and Evaluation

AI testing must separate language quality from factual and policy correctness.

### 13.1 Functional AI Tests

Test:

- Context construction.
    
- Model routing.
    
- Provider adapter behavior.
    
- Timeout and retry.
    
- Structured output validation.
    
- Fallback policy.
    
- Budget enforcement.
    

### 13.2 Groundedness Tests

Verify:

- Numerical claims match deterministic artifacts.
    
- Unsupported claims are rejected or qualified.
    
- Evidence references resolve.
    
- Facts and interpretations are distinguished.
    
- Causal claims are not inferred from correlation alone.
    
- Limitations are retained.
    

### 13.3 Security Tests

Test:

- Prompt injection from dataset values.
    
- Malicious imported documents.
    
- Unauthorized tool requests.
    
- Attempts to reveal secrets.
    
- Attempts to bypass permissions.
    
- Cloud consent enforcement.
    
- Data classification enforcement.
    

### 13.4 Evaluation Dataset

Maintain a versioned evaluation dataset containing:

- Representative EDA scenarios.
    
- Expected statistical facts.
    
- Known limitations.
    
- Adversarial inputs.
    
- Prompt injection examples.
    
- Expected policy outcomes.
    

AI quality should be evaluated against versioned scenarios, not subjective impressions alone.

## 14. Reporting and Export Testing

Verify:

- Report specification validation.
    
- Artifact reference integrity.
    
- Staleness detection.
    
- Evidence traceability.
    
- HTML/PDF rendering.
    
- Page breaks and chart embedding.
    
- Dataset export correctness.
    
- Project export/import round trip.
    
- Export policy enforcement.
    
- File publication integrity.
    
- Export history and provenance.
    

Generated reports should be checked for missing evidence, clipped visualizations, broken assets, and unintended sensitive data.

## 15. Security Testing

Security testing should cover the controls defined in Document 11.

Areas:

- IPC authorization.
    
- WebView navigation and bridge exposure.
    
- Path traversal.
    
- Malformed file handling.
    
- Plugin isolation.
    
- Dependency vulnerability scanning.
    
- Secret scanning.
    
- AI prompt injection.
    
- Unauthorized external transmission.
    
- Export privacy controls.
    

Security tests must include both expected denial and valid authorized access paths.

## 16. End-to-End Testing

E2E tests validate complete user workflows through the desktop application.

### 16.1 Core E2E Scenarios

**Scenario A — Basic EDA**

1. Create project.
    
2. Import dataset.
    
3. Inspect schema.
    
4. Run profiling.
    
5. Review data quality.
    
6. Generate visualizations.
    
7. Create findings.
    
8. Export report.
    

**Scenario B — Non-Destructive Cleaning**

1. Import source dataset.
    
2. Create transformation.
    
3. Review transformation plan.
    
4. Approve transformation.
    
5. Execute transformation.
    
6. Verify derived snapshot.
    
7. Verify original remains unchanged.
    

**Scenario C — Analysis Plan**

1. Select dataset.
    
2. Generate Analysis Plan.
    
3. Review proposed tasks.
    
4. Approve plan revision.
    
5. Execute plan.
    
6. Inspect artifacts.
    
7. Retry a failed independent task.
    

**Scenario D — Plugin Execution**

1. Install a test plugin.
    
2. Review requested capabilities.
    
3. Grant restricted permissions.
    
4. Execute plugin.
    
5. Validate output.
    
6. Verify isolation and cleanup.
    

**Scenario E — Portable Project**

1. Build a project with datasets and artifacts.
    
2. Export `.edaworkspace`.
    
3. Validate manifest and checksums.
    
4. Import into a separate workspace.
    
5. Verify lineage and references.
    

### 16.2 E2E Test Environment

E2E tests should use:

- Controlled sample datasets.
    
- Isolated temporary project directories.
    
- Deterministic fixtures.
    
- Controlled plugin packages.
    
- Mock AI providers where appropriate.
    
- Dedicated test configuration.
    

Real external AI or network services should not be required for routine E2E tests.

## 17. Cross-Platform Testing

Target platforms:

- Windows.
    
- macOS.
    
- Linux.
    

Test differences in:

- PyWebView runtime.
    
- WebView engine behavior.
    
- Filesystem permissions.
    
- Path conventions.
    
- Process spawning.
    
- Credential storage.
    
- Font rendering.
    
- Native dialogs.
    
- Application packaging.
    
- OS-level plugin isolation.
    

A feature is not considered production-ready merely because it passes on one operating system.

## 18. Test Data Management

Test data must be controlled and versioned.

Categories:

|Dataset Type|Purpose|
|---|---|
|Small synthetic|Fast unit and integration tests|
|Statistical reference|Numerical correctness|
|Realistic medium|Workflow and performance tests|
|Large synthetic|Scalability and resource tests|
|Edge-case fixtures|Boundary and failure handling|
|Adversarial fixtures|Security testing|

Rules:

- Avoid committing confidential production data.
    
- Prefer synthetic or appropriately licensed public data.
    
- Record fixture provenance.
    
- Keep generated datasets deterministic.
    
- Separate test fixtures from application user data.
    

## 19. CI/CD Quality Gates

### 19.1 Pull Request Gates

Required checks:

- Formatting and linting.
    
- Type checking.
    
- Unit tests.
    
- Critical contract tests.
    
- Dependency and secret scanning.
    
- Build verification.
    
- Focused integration tests.
    

### 19.2 Main Branch Gates

Additional checks:

- Full integration suite.
    
- Analytical reference tests.
    
- Persistence and migration tests.
    
- Frontend feature tests.
    
- Plugin contract tests.
    
- AI policy tests.
    
- Selected E2E tests.
    

### 19.3 Release Gates

Required:

- Full regression suite.
    
- Cross-platform smoke tests.
    
- Packaging validation.
    
- Project export/import verification.
    
- Security scan.
    
- Performance baseline comparison.
    
- Critical analytical correctness suite.
    
- Release artifact integrity checks.
    

No release should proceed with unresolved critical analytical correctness or security failures.

**Gate ownership (IN-F, WP-16):** This section owns test-execution gates. Doc14 owns packaging/signing gates and Doc15 owns reliability gates. A release requires all three layers to pass; no layer may waive another layer's gate.

## 20. Defect Severity and Quality Metrics

### 20.1 Defect Severity

|Severity|Meaning|
|---|---|
|Critical|Data loss, unauthorized disclosure, or fundamentally incorrect analytical results|
|High|Major workflow failure or incorrect results affecting important use cases|
|Medium|Limited feature failure or degraded behavior with workaround|
|Low|Minor usability or presentation defect|

### 20.2 Quality Metrics

Track:

- Unit and integration test pass rates.
    
- Critical-path E2E pass rates.
    
- Analytical reference test coverage.
    
- Regression defect rate.
    
- Flaky test rate.
    
- Crash and failed-job rates.
    
- Performance benchmark changes.
    
- Security finding counts.
    
- Cross-platform release pass rate.
    
- Export/import integrity success.
    

Coverage percentage is a diagnostic metric, not proof of correctness.

## 21. Testing Tools and Frameworks

Proposed baseline:

|Area|Candidate|
|---|---|
|Python unit/integration|pytest|
|Property-based testing|Hypothesis|
|Python linting|Ruff|
|Python typing|mypy or Pyright|
|Frontend unit/component|Vitest + React Testing Library|
|Browser/E2E|Playwright where compatible with desktop integration|
|Statistical reference|SciPy and independent mathematical fixtures|
|Dependency security|pip-audit and ecosystem-appropriate scanners|
|Frontend security|Dependency and static analysis tools|
|Performance|pytest-benchmark and workload-specific benchmarks|

Tools are replaceable; test contracts and verification objectives are the architectural commitments.

## 22. MVP Testing Priorities

### Required for MVP

1. Domain and application unit tests.
    
2. Statistical reference tests for supported methods.
    
3. Transformation and snapshot integrity tests.
    
4. Execution DAG and Job Manager tests.
    
5. IPC contract tests.
    
6. SQLite migration and recovery tests.
    
7. Plugin permission and isolation tests.
    
8. AI policy and groundedness tests.
    
9. Report and export validation tests.
    
10. Core E2E workflows.
    
11. Windows, macOS, and Linux smoke tests.
    
12. CI quality gates.
    

### Deferred or Advanced

- Large-scale distributed performance testing.
    
- Formal verification of selected algorithms.
    
- Continuous fuzzing infrastructure.
    
- Extensive visual regression coverage.
    
- Enterprise compliance test automation.
    
- Long-running reliability soak tests.
    

## 23. Key Architecture Decisions

|ID|Decision|Status|
|---|---|---|
|TST-001|Layered testing architecture|Proposed|
|TST-002|Analytical correctness is a first-class quality dimension|Proposed|
|TST-003|Statistical methods require independent reference tests|Proposed|
|TST-004|Differential and property-based testing for critical transformations and engines|Proposed|
|TST-005|Exact, approximate, and sampled execution modes are tested distinctly|Proposed|
|TST-006|IPC and plugin contracts require automated contract tests|Proposed|
|TST-007|AI requires groundedness and security evaluation|Proposed|
|TST-008|Core workflows require desktop E2E tests|Proposed|
|TST-009|Windows, macOS, and Linux require explicit validation|Proposed|
|TST-010|Critical analytical and security failures block release|Proposed|
|TST-011|Coverage percentage is not a standalone quality measure|Proposed|

## 24. Deferred Decisions

- Exact CI provider and runner strategy.
    
- Minimum test coverage thresholds.
    
- Exact supported statistical method reference suites.
    
- Performance budgets by dataset scale.
    
- Playwright integration approach for PyWebView.
    
- Fuzzing scope and schedule.
    
- AI evaluation scoring thresholds.
    
- Supported OS and WebView version matrix.
    
- Release quality dashboard.
    
- Test data retention and artifact management.
    

## 25. Traceability

|Related Document|Relationship|
|---|---|
|01 — Product Vision & Requirements|Product acceptance criteria|
|02 — System Architecture|Layer and runtime tests|
|03 — Domain Model|Invariants and state transition tests|
|04 — Data & Persistence Architecture|Storage integrity and recovery|
|05 — Processing & Execution Architecture|Planner, execution, and job tests|
|06 — Application & IPC Architecture|Contract and event tests|
|07 — Frontend Architecture|Component and feature tests|
|08 — UX & Interaction Architecture|Workflow and usability tests|
|09 — Plugin & Extension Architecture|Isolation and compatibility tests|
|10 — AI Architecture & Governance|AI evaluation and policy tests|
|11 — Security, Privacy & Threat Model|Security verification|
|12 — Reporting & Export Architecture|Report and export verification|

## 26. Completion Criteria

Dokumen ini dianggap lengkap apabila:

- Quality dimensions didefinisikan.
    
- Layered testing strategy tersedia.
    
- Analytical correctness memiliki verification approach.
    
- Statistical edge cases dan numerical tolerances diatur.
    
- Execution planner dan DAG behavior diuji.
    
- Persistence integrity dan recovery diuji.
    
- IPC dan plugin contracts diuji.
    
- AI groundedness dan security dievaluasi.
    
- Reporting dan export memiliki validation suite.
    
- Core E2E scenarios ditentukan.
    
- Cross-platform testing diwajibkan.
    
- CI/CD quality gates didefinisikan.
    
- Critical release-blocking conditions jelas.