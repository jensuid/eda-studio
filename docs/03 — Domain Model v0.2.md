# 03 — Domain Model

**Product:** EDA Workbench  
**Document:** 03 — Domain Model  
**Version:** 0.2  
**Status:** Draft for Review — Revised for Review (WP-13)  
**Depends on:** Document 01 — Product Vision & Requirements; Document 02 v0.2 — System Architecture; Document 05 v0.2; Document 06 v0.2; Document 09 v0.4; Document 10 v0.3; Document 11 v0.3; Document 12 v0.2

> **Revision note (WP-13):** v0.2 fixes cross-document numbering in §12, aligns bounded-context ownership with Doc02 v0.2 layers and the revised Doc05/06/09/10/11/12, and distinguishes domain provenance from security audit (SYS-018). No new entities are introduced. The aggregation-engine choice (DuckDB/Polars) remains owned by Doc05 as an execution adapter, not by the domain model (IN-A).

---

## 1. Purpose

Dokumen ini menetapkan canonical domain model untuk EDA Workbench.

Tujuannya:

- Mengidentifikasi bounded contexts dan tanggung jawab masing-masing.
    
- Mendefinisikan core domain entities, value objects, dan aggregate boundaries.
    
- Menetapkan ownership atas data dan business invariants.
    
- Mendefinisikan hubungan antar-domain.
    
- Menentukan pola komunikasi dan integrasi lintas domain.
    
- Menjadi dasar untuk Data & Persistence Architecture dan Processing & Execution Architecture.
    

Domain model harus mendukung prinsip local-first, non-destructive, reproducible, extensible, dan progressively intelligent.

## 2. Domain Modeling Principles

1. **Domain ownership:** Setiap domain bertanggung jawab atas model dan business rules miliknya.
    
2. **Explicit boundaries:** Domain tidak boleh mengakses internal aggregate domain lain secara langsung.
    
3. **Stable identity:** Entitas menggunakan stable IDs, bukan nama atau posisi sebagai identitas.
    
4. **Immutable history:** Snapshot, execution record, dan generated artifacts tidak diubah setelah dibuat.
    
5. **Explicit state transitions:** Perubahan lifecycle harus melalui operasi domain yang tervalidasi.
    
6. **Reference over duplication:** Antar-domain menggunakan IDs dan typed references, bukan menyalin seluruh objek.
    
7. **Reproducibility:** Hasil analisis harus dapat ditelusuri ke dataset snapshot, configuration, method, dan execution.
    
8. **User authority:** Sistem dapat merekomendasikan tindakan, tetapi keputusan yang mengubah data tetap berada pada user.
    
9. **Extensible contracts:** Plugin dan future runtimes berinteraksi melalui public contracts, bukan internal domain models.
    

## 3. Bounded Contexts

Domain dibagi menjadi bounded contexts berikut:

|Bounded Context|Primary Responsibility|
|---|---|
|Project Management|Project lifecycle, settings, workspace identity|
|Data Management|Data sources, datasets, schemas, snapshots, relationships|
|Data Quality|Profiling, quality assessment, issue detection|
|Transformation|Cleaning pipelines, transformation operations, materialization|
|Analysis|Analysis plans, statistical methods, executions, results|
|Visualization|Chart specifications and visualization artifacts|
|Workflow|Guided stages, progress, task coordination|
|Insights|Observations, findings, hypotheses, interpretation|
|AI Platform|AI providers, model routing, AI tasks and governance|
|Plugin Platform|Plugin registration, contracts, permissions, lifecycle|
|Reporting|Report definitions, report generation and exports|
|Platform Services|Jobs, events, configuration, diagnostics and shared infrastructure|

### 3.1 Domain Classification

**Core domain**

- Data Management
    
- Transformation
    
- Analysis
    
- Insights
    

**Supporting domains**

- Data Quality
    
- Visualization
    
- Workflow
    
- Reporting
    

**Generic/platform domains**

- Project Management
    
- AI Platform
    
- Plugin Platform
    
- Platform Services
    

Classification ini merupakan architectural guidance. Domain yang mendukung core workflow tetap dapat memiliki kompleksitas dan aturan bisnis yang signifikan.

Ownership alignment (WP-13, canonical owners in revised documents):

- Job lifecycle and job aggregate state are owned by **Platform Services** via the backend-authoritative Job Manager (Doc05 §8, SYS-015); frontend state is a projection only.
    
- Report/Export aggregate lifecycle is owned by **Reporting** per Doc12 §§14–17; export execution uses the Job Manager and payload-bound policy (SYS-019).
    
- Plugin and AI provenance records follow the Shared Provenance Envelope concept (Doc09 §13.2.2; Doc10); field-level mapping remains open (F-02) and is not defined here.
    
- Security audit is **not** a domain aggregate: it is owned by the security layer (Doc11 §14, SEC-012 Proposed) and correlated with domain provenance by stable identifiers (SYS-018).

## 4. Aggregate and Entity Model

### 4.1 Project Management Context

**Aggregate Root: Project**

Entities:

- Project
    
- ProjectConfiguration
    
- ProjectMembership — reserved for future collaboration
    

Value Objects:

- ProjectId
    
- ProjectName
    
- ProjectLocation
    
- ProjectSettings
    
- ProjectVersion
    

Responsibilities:

- Create, open, close, archive, and restore projects.
    
- Manage project-level configuration.
    
- Coordinate project lifecycle and persistence boundaries.
    

Invariants:

- ProjectId must be unique.
    
- A project must have a valid persistence location.
    
- Project operations must respect project lifecycle state.
    
- Project-specific entities must not silently cross project boundaries.
    

### 4.2 Data Management Context

**Aggregate Root: Dataset**

Entities:

- Dataset
    
- DataSource
    
- DatasetSnapshot
    
- DatasetView
    
- SchemaVersion
    
- ColumnDefinition
    
- DatasetRelationship
    

Value Objects:

- DatasetId
    
- DataSourceId
    
- SnapshotId
    
- ColumnId
    
- SchemaFingerprint
    
- ContentFingerprint
    
- PhysicalDataType
    
- SemanticDataType
    
- ColumnRole
    
- RelationshipDefinition
    

Responsibilities:

- Register and manage datasets.
    
- Connect datasets to their sources.
    
- Maintain schema and schema evolution history.
    
- Create and manage immutable snapshots.
    
- Provide dataset preview and query references.
    
- Infer candidate relationships and manage user confirmation.
    

Invariants:

- Dataset identity remains stable across snapshots.
    
- A snapshot is immutable after successful creation.
    
- Every snapshot belongs to exactly one dataset.
    
- Column identity must not depend solely on its display name or position.
    
- Schema changes must be versioned and impact-assessed.
    
- Inferred relationships remain candidates until confirmed by the user.
    
- External source references must expose availability and freshness status.
    

**Important distinction:**

- `DataSource` describes where/how data is accessed.
    
- `Dataset` describes a logical tabular resource.
    
- `DatasetSnapshot` represents an immutable point-in-time state.
    
- `DatasetView` represents a derived logical representation.
    

### 4.3 Data Quality Context

Aggregate Roots:

- ProfilingRun
    
- QualityAssessment
    

Entities:

- ColumnProfile
    
- QualityRule
    
- QualityIssue
    
- QualityFinding
    

Value Objects:

- MetricValue
    
- MissingnessSummary
    
- DuplicateSummary
    
- DistributionSummary
    
- QualitySeverity
    
- AssessmentScope
    

Responsibilities:

- Calculate profiling metrics.
    
- Detect missing values, duplicates, invalid values, type inconsistencies, and other quality issues.
    
- Evaluate quality rules.
    
- Produce evidence-backed quality assessments.
    

Invariants:

- Every profiling run references a specific dataset and snapshot or view revision.
    
- Metrics must identify their calculation scope and execution mode.
    
- Exact, approximate, and sampled metrics must be distinguishable.
    
- A detected issue must include evidence and an identifiable scope.
    
- Quality assessment must not modify source data.
    
- Quality findings must preserve method and execution provenance.
    

### 4.4 Transformation Context

Aggregate Root:

- CleaningPipeline
    

Entities:

- TransformationOperation
    
- OperationConfiguration
    
- TransformationExecution
    
- TransformationPreview
    
- MaterializationRecord
    

Value Objects:

- PipelineId
    
- PipelineRevision
    
- OperationId
    
- TransformationSpec
    
- TransformationStatus
    
- ValidationResult
    

Responsibilities:

- Define ordered cleaning operations.
    
- Validate operation configuration and dependencies.
    
- Generate previews.
    
- Execute approved transformations.
    
- Record execution history.
    
- Produce derived views or immutable materialized snapshots.
    

Invariants:

- Original dataset snapshots are never modified.
    
- Pipeline revisions are versioned.
    
- An execution references an explicit pipeline revision and input snapshot.
    
- A transformation cannot execute without required validation and approval.
    
- Failed operations must not silently produce a valid output.
    
- Undoing a configuration change does not erase execution history.
    
- Materialization creates a new immutable snapshot.
    

Pipeline lifecycle:

`Draft → Configured → Previewed → Validated → Approved → Executed → Materialized (optional)`

Operation lifecycle:

`Draft → Ready → Running → Succeeded / Failed / Skipped / Stale`

### 4.5 Analysis Context

Aggregate Roots:

- AnalysisPlan
    
- AnalysisExecution
    

Entities:

- AnalysisStep
    
- AnalysisMethod
    
- MethodConfiguration
    
- MethodAssumption
    
- StatisticalResult
    
- AnalysisExecutionRecord
    

Value Objects:

- AnalysisPlanId
    
- AnalysisPlanRevision
    
- AnalysisMethodId
    
- AnalysisParameters
    
- StatisticalMetric
    
- EffectSize
    
- ConfidenceInterval
    
- SampleSize
    
- ExecutionMode
    
- Limitation
    

Responsibilities:

- Define analysis plans.
    
- Register and resolve analysis methods.
    
- Validate method requirements and assumptions.
    
- Execute analysis steps.
    
- Record statistical results and provenance.
    
- Support independent execution and selective retry.
    

Invariants:

- An approved plan is bound to a specific plan revision.
    
- Editing an approved plan invalidates its approval.
    
- Every execution references explicit inputs, method versions, parameters, and execution mode.
    
- Statistical results must identify sample size and relevant limitations.
    
- Assumption failures must be visible.
    
- Alternative methods may be recommended but must not be silently substituted.
    
- Exact and approximate results must remain distinguishable.
    
- Statistical support does not establish causality.
    

### 4.6 Visualization Context

Aggregate Root:

- VisualizationArtifact
    

Entities:

- ChartSpecification
    
- ChartInteractionConfiguration
    
- VisualizationExecution
    

Value Objects:

- VisualizationId
    
- ChartType
    
- AxisDefinition
    
- EncodingDefinition
    
- VisualizationTheme
    

Responsibilities:

- Define chart specifications.
    
- Validate chart configuration.
    
- Render charts from analysis or dataset references.
    
- Preserve chart configuration and provenance.
    
- Support chart interactions and export.
    

Invariants:

- A visualization references identifiable data or analysis inputs.
    
- Chart specifications must be validated before rendering.
    
- Visualization configuration must not mutate analytical source data.
    
- Changes to upstream dependencies can mark a visualization stale.
    
- Visualization artifacts remain reproducible through their specification and input references.
    

### 4.7 Workflow Context

Aggregate Root:

- ProjectWorkflow
    

Entities:

- WorkflowStage
    
- WorkflowTask
    
- WorkflowProgress
    
- WorkflowCheckpoint
    

Value Objects:

- WorkflowId
    
- StageId
    
- TaskId
    
- CompletionStatus
    

Responsibilities:

- Represent the ten-stage EDA workflow.
    
- Track user progress and checkpoints.
    
- Coordinate stage-level recommendations and prerequisites.
    
- Provide Guided Mode navigation and context.
    

Invariants:

- Workflow progress belongs to a project.
    
- A stage cannot be marked complete when mandatory requirements remain unmet.
    
- Progress must not falsely imply analytical correctness.
    
- Advanced Mode actions may update relevant workflow progress.
    
- Switching UX modes must preserve underlying project and workflow state.
    

Workflow stages:

1. Project & Business Understanding
    
2. Data Ingestion & Connection
    
3. Data Structure & Profiling
    
4. Data Quality Assessment
    
5. Data Cleaning & Preparation
    
6. Univariate Analysis
    
7. Bivariate & Multivariate Analysis
    
8. Anomaly & Pattern Discovery
    
9. Hypothesis & Modeling Readiness
    
10. Insights & Reporting
    

### 4.8 Insights Context

Aggregate Roots:

- Finding
    
- Hypothesis
    

Entities:

- Observation
    
- Interpretation
    
- SupportingEvidence
    
- HypothesisEvaluation
    
- Annotation
    

Value Objects:

- FindingId
    
- HypothesisId
    
- EvidenceReference
    
- ConfidenceDescription
    
- HypothesisStatus
    

Responsibilities:

- Convert analytical evidence into structured observations.
    
- Manage user-reviewed findings.
    
- Track hypotheses and their investigation lifecycle.
    
- Associate findings with supporting artifacts.
    
- Preserve user annotations and interpretations.
    

Invariants:

- A Finding must reference supporting evidence.
    
- Observations must be distinguishable from interpretations.
    
- AI-generated interpretations must be identified as AI-generated.
    
- Statistical facts must originate from validated analytical results.
    
- Findings must not imply causality without an appropriate research design.
    
- User annotations are mutable, but execution evidence remains immutable.
    

Hypothesis lifecycle:

`Proposed → Accepted → Investigating → Supported / Not Supported / Inconclusive → Archived`

"Supported" means supported by available evidence, not proven universally or causally.

### 4.9 AI Platform Context

Aggregate Roots:

- AIProviderConfiguration
    
- AIExecution
    

Entities:

- ModelDefinition
    
- RoutingPolicy
    
- AITask
    
- AIRequestRecord
    
- AIResponseRecord
    
- ConsentRecord
    

Value Objects:

- ProviderId
    
- ModelId
    
- AITaskType
    
- PrivacyClassification
    
- TokenBudget
    
- CostBudget
    

Responsibilities:

- Register local and cloud AI providers.
    
- Route AI tasks according to policy.
    
- Enforce privacy and consent requirements.
    
- Track model usage and cost.
    
- Preserve AI execution metadata.
    

Invariants:

- Cloud AI access requires explicit authorization.
    
- No unauthorized fallback to cloud providers.
    
- Sensitive data must follow classification and redaction policies.
    
- AI must not invent statistical values.
    
- AI-generated content must remain distinguishable from deterministic results.
    
- Provider/model/version and relevant prompt configuration must be traceable.
    

### 4.10 Plugin Platform Context

Aggregate Root:

- Plugin
    

Entities:

- PluginManifest
    
- PluginVersion
    
- PluginDependency
    
- PluginPermission
    
- PluginExecution
    
- PluginTrustRecord
    

Value Objects:

- PluginId
    
- PluginVersionNumber
    
- PluginCapability
    
- PermissionGrant
    
- RuntimeEnvironment
    

Responsibilities:

- Register and discover plugins.
    
- Validate manifests and compatibility.
    
- Manage dependencies and runtime environments.
    
- Enforce permissions and execution policies.
    
- Track plugin lifecycle and failures.
    

Invariants:

- Plugin execution requires compatible contracts and granted permissions.
    
- Third-party plugins are isolated by default.
    
- A signature verifies identity and integrity, not safety.
    
- Plugin failures must not corrupt project state.
    
- Plugin updates must respect compatibility and user-controlled update policy.
    

### 4.11 Reporting Context

Aggregate Root:

- Report
    

Entities:

- ReportSection
    
- ReportTemplate
    
- ReportGeneration
    
- ReportExport
    

Value Objects:

- ReportId
    
- ReportFormat
    
- ReportProfile
    
- ReportVersion
    

Responsibilities:

- Define report structure and templates.
    
- Compose findings and artifact references.
    
- Generate HTML/PDF outputs.
    
- Track report provenance and freshness.
    

Invariants:

- A report must identify its source project and referenced evidence.
    
- Stale artifacts must be detected and surfaced.
    
- Report generation must not silently replace the previous valid report.
    
- Export must preserve relevant methodology and limitations.
    
- Report packages must distinguish embedded data from external references.
    

### 4.12 Platform Services Context

This context provides technical capabilities rather than owning EDA business entities.

Core services:

- Job Manager
    
- Event Infrastructure
    
- Configuration Service
    
- Diagnostics and Logging
    
- Persistence Coordination
    
- Backup and Recovery
    
- Resource Management
    
- Access and Permission Enforcement
    

Platform Services must not become a general-purpose owner of business rules belonging to other contexts.

## 5. Cross-Context Relationships

High-level relationship:

```
Project Management
       |
       v
Data Management
       |
       +----------------------+
       |                      |
       v                      v
Data Quality             Transformation
       |                      |
       +----------+-----------+
                  |
                  v
               Analysis
                  |
          +-------+--------+
          |                |
          v                v
    Visualization       Insights
          |                |
          +-------+--------+
                  |
                  v
               Reporting

Workflow coordinates the user journey across these contexts.

AI Platform provides optional interpretation and assistance.
Plugin Platform extends approved capabilities.
Platform Services provide execution, events, persistence and diagnostics.
```

### 5.1 Ownership Rules

|Data / Capability|Owning Context|
|---|---|
|Project identity and settings|Project Management|
|Dataset, schema, snapshot|Data Management|
|Profiling and quality metrics|Data Quality|
|Cleaning pipeline and operations|Transformation|
|Analysis plans and statistical results|Analysis|
|Chart specifications|Visualization|
|Workflow progress|Workflow|
|Findings and hypotheses|Insights|
|AI provider and execution records|AI Platform|
|Plugin metadata and permissions|Plugin Platform|
|Report definitions and exports|Reporting|
|Jobs, event transport, diagnostics|Platform Services|

A context may reference another context's entities but must not directly mutate them.

### 5.2 Cross-Context Interaction

Use:

- Application services for orchestrating multi-context use cases.
    
- Typed commands and queries for explicit requests.
    
- Domain events for notifying other contexts about completed state changes.
    
- Stable IDs and typed references for cross-context relationships.
    

Do not:

- Share mutable ORM entities across contexts.
    
- Import another context's internal repository implementation.
    
- Use global mutable state as an integration mechanism.
    
- Create circular dependencies between domain modules.
    

## 6. Core Domain Identity and References

All primary entities use stable identifiers.

Recommended ID types:

|Entity|Identifier|
|---|---|
|Project|ProjectId|
|Dataset|DatasetId|
|Data Source|DataSourceId|
|Snapshot|SnapshotId|
|Column|ColumnId|
|Pipeline|PipelineId|
|Analysis Plan|AnalysisPlanId|
|Analysis Execution|AnalysisExecutionId|
|Artifact|ArtifactId|
|Finding|FindingId|
|Hypothesis|HypothesisId|
|Job|JobId|
|Plugin|PluginId|
|Report|ReportId|

ID implementation may use UUID/ULID or another collision-resistant scheme. The exact encoding is a technical decision for the implementation specification.

IPC correlation identifiers (`request_id`, `correlation_id`, `idempotency_key`) are **not** domain entity IDs (Doc06 §13, SYS-016): `request_id` identifies one IPC exchange, `correlation_id` links related commands/events/downstream operations, and `idempotency_key` identifies a logical command submission. Domain references must not reuse these values as entity identity, and vice versa. Referencing them in event payloads for correlation is permitted and, for critical events, required.

References should include sufficient context to prevent ambiguity, for example:

- DatasetReference: project_id + dataset_id
    
- SnapshotReference: dataset_id + snapshot_id
    
- ArtifactReference: project_id + artifact_id
    
- ExecutionReference: execution_id + execution version
    

Names and display labels are not identifiers.

## 7. Domain Events

Domain events communicate meaningful state changes.

Initial event catalog:

|Event|Owner|Example Consumers|
|---|---|---|
|ProjectCreated|Project Management|Workflow|
|DatasetRegistered|Data Management|Workflow, Data Quality|
|DatasetSnapshotCreated|Data Management|Data Quality, Transformation|
|DatasetSchemaChanged|Data Management|Transformation, Analysis|
|QualityAssessmentCompleted|Data Quality|Workflow, Insights|
|PipelineRevisionCreated|Transformation|Workflow|
|TransformationExecuted|Transformation|Data Management, Analysis|
|AnalysisPlanApproved|Analysis|Workflow|
|AnalysisExecutionCompleted|Analysis|Visualization, Insights|
|ArtifactCreated|Owning artifact context|Insights, Reporting|
|FindingCreated|Insights|Workflow, Reporting|
|HypothesisStatusChanged|Insights|Workflow, Reporting|
|ReportGenerated|Reporting|Workflow|
|PluginStateChanged|Plugin Platform|Platform Services|

Events should carry stable identifiers and versioned payloads, not large dataset contents.

Domain events are provenance-adjacent evidence of domain state changes. They do not replace security audit events (Doc11 §14): a domain event records what changed in the domain; an audit event records actor, policy decision vs enforcement outcome, and correlation for security-relevant actions. Shared Provenance Envelope fields (actor, timestamps, input references, outcome) may be carried by domain events where defined by the owning context; the canonical field-level mapping is deferred (F-02).

Critical events must be durably recorded according to the event architecture in Document 02. Ephemeral progress notifications remain separate.

## 8. Aggregate Boundary Guidance

Aggregates should remain small and enforce local invariants.

Recommended initial boundaries:

- Project is not a container for every project entity in one giant aggregate.
    
- Dataset owns logical dataset identity and snapshot coordination, but snapshot payload storage is external to the aggregate.
    
- CleaningPipeline owns operation ordering and revision rules.
    
- AnalysisPlan owns plan structure and approval revision.
    
- AnalysisExecution is an independently persisted execution record.
    
- Finding and Hypothesis have separate lifecycles.
    
- Report owns its definition and generation lifecycle, not the artifacts it references.
    

Cross-aggregate consistency should use explicit application orchestration and domain events rather than oversized transactions.

## 9. State, Versioning and Concurrency

- Mutable aggregates use optimistic concurrency where appropriate.
    
- Immutable records use append-only creation semantics.
    
- Configuration changes create new revisions.
    
- Approval records bind to a specific revision.
    
- Execution records capture the exact input and configuration versions.
    
- Stale and invalid states must be explicit.
    
- Cross-context updates must be idempotent where event delivery may be retried.
    

Project-level SQLite transactions should remain short and coordinated by the persistence layer.

## 10. Domain Error Model

Errors should be typed and actionable.

Initial categories:

- `EntityNotFound`
    
- `InvalidStateTransition`
    
- `InvariantViolation`
    
- `RevisionConflict`
    
- `ApprovalRequired`
    
- `DependencyNotSatisfied`
    
- `SnapshotUnavailable`
    
- `SchemaCompatibilityError`
    
- `MethodAssumptionViolation`
    
- `PermissionDenied` — default-deny at trusted service boundaries (SEC-004, Proposed; enforcement is not a domain-rule substitute)
    
- `ResourceLimitExceeded`
    
- `ExecutionFailed`
    
- `ArtifactStale`
    
- `ExternalDependencyUnavailable`
    

Errors should contain stable error codes, safe user-facing messages, and structured diagnostic context. Raw data values and secrets must not appear in error messages or logs by default.

## 11. Explicitly Deferred Decisions

The following details are intentionally not finalized here:

- Complete field-level schemas for every entity.
    
- Exact UUID/ULID strategy and serialization.
    
- ORM and repository implementation.
    
- Full domain event payload schemas.
    
- Exact transaction and Unit of Work implementation.
    
- Detailed statistical method catalog.
    
- Plugin-specific domain object schemas.
    
- Collaboration and multi-user authorization model.
    
- Full physical database schema and migrations.
    

These belong in subsequent architecture and implementation specifications.

## 12. Traceability

|Related Document|Domain Model Contribution|
|---|---|
|01 — Product Vision & Requirements|Product capabilities and EDA workflow|
|02 — System Architecture|Module boundaries and architectural layers|
|04 — Data & Persistence Architecture|Entity persistence and storage mapping|
|05 — Processing & Execution Architecture|Pipeline, analysis, and job execution|
|06 — Application & IPC Architecture|Commands, queries, contracts, events|
|09 — Plugin & Extension Architecture v0.4|Plugin domain contracts|
|10 — AI Architecture & Governance v0.3|AI execution and governance|
|08 — UX & Interaction Architecture v0.3|Workflow and user-facing lifecycle|
|12 — Reporting & Export Architecture v0.2|Artifact, finding, hypothesis, report relationships|

## 13. Completion Criteria

Document 03 is ready for approval when:

- Every bounded context has a clear responsibility.
    
- Core entities and value objects are identified.
    
- Aggregate boundaries and invariants are explicit.
    
- Ownership and cross-context references are unambiguous.
    
- Domain events have an initial catalog.
    
- No circular domain dependencies are required.
    
- The model is consistent with Documents 01 and 02.
    
- Deferred implementation decisions are clearly separated from canonical domain rules.
    
- Ownership aligns with Doc02 v0.2 layers and revised Doc05/06/09/10/11/12; no Proposed decision is promoted.
    
- Domain provenance and security audit are documented as distinct evidence types (SYS-018).