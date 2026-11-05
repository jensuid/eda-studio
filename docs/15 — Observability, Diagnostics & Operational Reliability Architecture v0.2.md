# Document 15 — Observability, Diagnostics & Operational Reliability Architecture

**Project:** EDA Workbench  
**Document ID:** DOC-15  
**Version:** 0.2  
**Status:** Draft for Review — Revised for Review (WP-23)

> **Revision note (WP-23):** Adds IN-F gate ownership cross-references. No reliability-model changes.
**Decisions:** OBS-001 through OBS-020  
**Scope:** Observability, diagnostics, operational reliability, recovery, resource management, and incident response.

---

# 1. Purpose & Architectural Vision

## 1.1 Purpose

This document defines the architecture for observing, diagnosing, recovering, and maintaining the operational reliability of EDA Workbench.

It establishes a consistent system for:

- Understanding application health and runtime behavior.
    
- Detecting failures and performance degradation.
    
- Correlating logs, traces, metrics, and execution records.
    
- Diagnosing operational and infrastructure problems.
    
- Recovering safely from crashes and interrupted operations.
    
- Managing resource pressure without compromising analytical correctness.
    
- Providing actionable notifications and remediation.
    
- Preserving operational evidence and accountability.
    
- Verifying reliability through automated testing.
    

## 1.2 Architectural Vision

**Build a local-first, observable, self-diagnosing, and recovery-aware desktop application that prioritizes data integrity, analytical correctness, privacy, and predictable operation.**

The system must remain useful even when optional components fail.

Observability must not become a source of instability, excessive resource consumption, or privacy leakage.

## 1.3 Core Principles

1. **Local-first:** Operational data remains local by default.
    
2. **Privacy by design:** Sensitive data is excluded or redacted.
    
3. **End-to-end correlation:** Operational events must be traceable across system boundaries.
    
4. **Failure isolation:** Optional component failures should not unnecessarily disable the application.
    
5. **Safe recovery:** Never blindly resume interrupted or partially completed operations.
    
6. **Correctness before performance:** Resource optimization must not compromise analytical validity.
    
7. **Human accountability:** Risky and destructive remediation requires user approval.
    
8. **Evidence preservation:** Recovery and incident response must retain relevant diagnostic evidence.
    
9. **Bounded observability:** Storage and instrumentation overhead must be controlled.
    
10. **Reproducibility:** Incidents must be associated with their relevant runtime environment and application build.
    

---

# 2. Scope

## 2.1 Included

- Centralized observability infrastructure.
    
- Structured logging.
    
- Distributed tracing.
    
- Runtime and operational metrics.
    
- Component health and readiness.
    
- Diagnostics dashboard.
    
- Diagnostic bundle generation.
    
- Error taxonomy and recovery contracts.
    
- Job lifecycle monitoring and recovery.
    
- Application lifecycle orchestration.
    
- Crash-safe persistence and recovery journal.
    
- Resource monitoring and pressure management.
    
- Reliability SLOs.
    
- Event-driven notifications.
    
- Observability retention and storage governance.
    
- Self-diagnostics and automated remediation.
    
- Operational audit trail.
    
- Observability testing and failure injection.
    
- Incident response and operational runbooks.
    
- Runtime environment fingerprinting and compatibility diagnostics.
    

## 2.2 Excluded

- Remote centralized telemetry as a mandatory dependency.
    
- Automatic upload of diagnostic data.
    
- External monitoring services as a core requirement.
    
- Automatic destructive recovery without user approval.
    
- Automatic analytical method downgrades under resource pressure.
    
- General-purpose enterprise incident-management infrastructure.
    
- Replacement of existing application logging, persistence, security, or Job Manager architectures.
    

---

# 3. High-Level Architecture

## 3.1 Architecture Overview

Observability is implemented as a centralized platform service with instrumentation distributed across application components.

```
                    EDA WORKBENCH
                          |
       +------------------+------------------+
       |                  |                  |
    Frontend          Python Backend       Plugins
       |                  |                  |
       +------------------+------------------+
                          |
               Observability SDK
                          |
       +------------------+------------------+
       |          |         |         |       |
     Logging   Tracing   Metrics   Events  Health
       |          |         |         |       |
       +------------------+------------------+
                          |
                Observability Core
                          |
       +------------------+------------------+
       |                  |                  |
   Diagnostics       Alert Manager       Audit Trail
       |                  |                  |
       +------------------+------------------+
                          |
               Local Observability Storage
                          |
       +------------------+------------------+
       |                  |                  |
    Dashboard       Diagnostic Bundle    Recovery
```

## 3.2 Core Components

|Component|Responsibility|
|---|---|
|Observability SDK|Unified instrumentation APIs|
|Logging Service|Structured application logs|
|Tracing Service|End-to-end execution tracing|
|Metrics Collector|Resource and operational metrics|
|Health Monitor|Component health and readiness|
|Alert Manager|Event-driven notifications|
|Diagnostics Service|Diagnostic checks and analysis|
|Job Diagnostics|Job lifecycle and recovery visibility|
|Resource Monitor|Resource pressure monitoring|
|Remediation Engine|Governed diagnostic remediation|
|Audit Service|Operational accountability records|
|Recovery Manager|Crash and interrupted-operation recovery|
|Environment Fingerprinter|Runtime and compatibility metadata|
|Observability Storage|Bounded local persistence|
|Diagnostics Dashboard|Operational visibility and controls|

---

# 4. Local-First Observability Foundation

## 4.1 Storage Policy

All observability data is stored locally by default.

The system must not require external telemetry services to function.

External monitoring integrations may be introduced as optional capabilities, requiring explicit user consent.

Diagnostic bundle generation is user-initiated.

## 4.2 Data Categories

The observability platform manages:

- Application logs.
    
- Distributed traces.
    
- Operational metrics.
    
- Health transition records.
    
- Alert history.
    
- Diagnostic results.
    
- Job execution references.
    
- Remediation history.
    
- Operational audit records.
    
- Environment fingerprints.
    

These categories remain logically distinct even when they share correlation identifiers.

## 4.3 Privacy Rules

Never persist the following in ordinary telemetry:

- Raw dataset contents.
    
- Sampled dataset rows.
    
- Credentials and API keys.
    
- Access tokens.
    
- Sensitive prompts or conversations.
    
- Unredacted personal information.
    
- Unnecessary identifying filesystem paths.
    

Redaction must happen before data reaches persistent observability storage.

---

# 5. Centralized Observability SDK

## 5.1 Instrumentation Architecture

All major components use a centralized observability SDK.

Supported components include:

- React frontend.
    
- PyWebView IPC bridge.
    
- Python application services.
    
- Job Manager.
    
- Execution adapters.
    
- DuckDB and analytical engines.
    
- Persistence infrastructure.
    
- Plugin runtime.
    
- AI Platform.
    

Instrumentation must follow consistent conventions.

## 5.2 OpenTelemetry Compatibility

The instrumentation architecture should be OpenTelemetry-compatible.

Local exporters and storage are the default.

External exporters are optional and require explicit configuration.

## 5.3 Context Propagation

The following correlation identifiers are used where applicable:

|Identifier|Purpose|
|---|---|
|`request_id`|Request correlation|
|`trace_id`|End-to-end execution correlation|
|`span_id`|Individual operation correlation|
|`job_id`|Background job correlation|
|`project_id`|Project context|
|`component_id`|Component identification|

Context must propagate across:

- Frontend interactions.
    
- IPC requests.
    
- Application services.
    
- Asynchronous execution.
    
- Background jobs.
    
- Worker processes.
    
- Plugins.
    
- Storage operations.
    

Plugin instrumentation must use controlled SDK APIs rather than directly accessing observability storage.

---

# 6. Structured Logging Architecture

## 6.1 Logging Format

Logs use structured JSON Lines (`.jsonl`).

Each record should contain:

- Timestamp.
    
- Severity.
    
- Event name.
    
- Component.
    
- Message.
    
- Correlation identifiers.
    
- Relevant operational context.
    
- Error code when applicable.
    
- Schema version.
    

## 6.2 Severity Levels

|Level|Purpose|
|---|---|
|DEBUG|Detailed diagnostic information|
|INFO|Normal operational events|
|WARNING|Potential problems or degraded conditions|
|ERROR|Failed operations|
|CRITICAL|Severe failures requiring immediate attention|

Log severity is distinct from operational incident severity.

## 6.3 Event Namespaces

Use consistent event namespaces:

- `application.*`
    
- `project.*`
    
- `dataset.*`
    
- `analysis.*`
    
- `job.*`
    
- `plugin.*`
    
- `storage.*`
    
- `ipc.*`
    
- `security.*`
    
- `update.*`
    

## 6.4 Storage

- Rotating local JSONL files.
    
- Bounded storage.
    
- Configurable retention.
    
- Redaction before persistence.
    
- Correlation identifiers included where available.
    

Logs are not substitutes for domain events or audit records.

---

# 7. Distributed Tracing

## 7.1 Trace Architecture

Tracing must provide end-to-end visibility across the execution lifecycle.

Example:

```
User Interaction
    |
    v
Frontend Action
    |
    v
PyWebView IPC
    |
    v
Application Service
    |
    v
Job Manager
    |
    v
Execution Planner
    |
    v
Execution Adapter
    |
    v
Analytical Engine
    |
    v
Persistence
    |
    v
Artifact Publisher
```

## 7.2 Important Measurements

Capture durations for:

- Request processing.
    
- IPC round-trip.
    
- Job queue wait.
    
- Planning.
    
- Resource allocation.
    
- Execution.
    
- Storage reads and writes.
    
- Artifact publication.
    
- Retry operations.
    

## 7.3 Sampling

Use bounded local trace storage and configurable sampling.

Prioritize:

- Failed operations.
    
- Critical operations.
    
- Slow operations.
    
- Recovery workflows.
    

Avoid recording sensitive execution payloads.

---

# 8. Metrics & Diagnostics Dashboard

## 8.1 Metrics Domains

|Domain|Metrics|
|---|---|
|Application|Startup duration, uptime, health|
|System|CPU, memory, disk|
|Job Manager|Queue length, active jobs, completion rate|
|Execution Engine|Duration, utilization, throughput|
|Storage|Database size, disk usage, I/O latency|
|IPC|Request latency, failures|
|Plugins|Execution duration, failure rate|
|Frontend|Responsiveness, rendering latency|

## 8.2 Metric Types

Support:

- Counters.
    
- Gauges.
    
- Histograms.
    

Avoid unbounded-cardinality labels such as arbitrary user-generated identifiers.

## 8.3 Diagnostics Dashboard

The initial dashboard includes:

- Application health.
    
- CPU and memory usage.
    
- Disk availability.
    
- Job states.
    
- Execution durations.
    
- Storage utilization.
    
- Recent errors.
    
- Resource pressure warnings.
    
- Component health.
    

Instrumentation overhead must remain low.

---

# 9. Component Health & Graceful Degradation

## 9.1 Health States

Each component supports:

- `Healthy`
    
- `Degraded`
    
- `Unhealthy`
    
- `Starting`
    
- `Stopping`
    
- `Disabled`
    

## 9.2 Hierarchical Health Model

Health is evaluated at component level.

Dependency relationships determine whether failures propagate to dependent capabilities.

For example:

- A failed optional AI provider should not disable core EDA.
    
- A failed plugin should not disable unrelated plugins.
    
- Storage integrity failure may prevent project readiness.
    
- Job Manager failure may disable background execution capabilities.
    

## 9.3 Readiness

Readiness is distinct from health.

The application can be operational but partially degraded.

Core dependency failures prevent readiness; optional failures should produce graceful degradation when possible.

Health transitions must be observable and visible in diagnostics.

---

# 10. Diagnostic Bundle Architecture

## 10.1 Collection Levels

|Level|Contents|
|---|---|
|Basic|Environment metadata, health status, recent errors|
|Standard|Basic + relevant logs, traces, metrics|
|Extended|Standard + execution diagnostics|

## 10.2 Bundle Structure

The bundle is packaged as ZIP and may contain:

- Metadata JSON.
    
- Structured JSONL logs.
    
- Trace exports.
    
- Metrics exports.
    
- Diagnostic results.
    
- Manifest.
    
- Redaction summary.
    
- Environment fingerprint, if approved.
    

## 10.3 Mandatory Safeguards

Before generation/export:

1. Scan for sensitive data.
    
2. Apply mandatory redaction.
    
3. Exclude raw datasets and sample rows.
    
4. Exclude credentials and API keys.
    
5. Exclude database contents.
    
6. Exclude sensitive prompts and conversations.
    
7. Exclude personal files.
    
8. Remove identifying absolute paths by default.
    
9. Present a user preview.
    
10. Require explicit confirmation.
    

Uploading or sharing is a separate user-controlled action.

---

# 11. Error Taxonomy & Recovery-Aware Handling

## 11.1 Error Categories

|Category|Examples|
|---|---|
|Validation|Invalid request or parameters|
|User Action|Cancelled operation|
|Data|Invalid or inconsistent dataset|
|Execution|Analytical execution failure|
|Resource|Insufficient memory or disk|
|Storage|Database or filesystem failure|
|IPC|Communication failure|
|Plugin|Extension execution failure|
|Security|Permission violation|
|System|Unexpected infrastructure failure|

## 11.2 Error Severity

Use:

- Low.
    
- Medium.
    
- High.
    
- Critical.
    

Severity is separate from log levels.

## 11.3 Typed Error Contract

Errors align with the Document 06 IPC response contract.

Each error includes:

- Stable error code.
    
- Category.
    
- Severity.
    
- Safe user-facing message.
    
- Retryability.
    
- Recovery action.
    
- Correlation identifiers.
    

## 11.4 Recovery Rules

Recovery decisions must account for:

- Idempotency.
    
- Existing side effects.
    
- User confirmation.
    
- Dependency state.
    
- Data integrity.
    
- Graceful degradation.
    

No blanket automatic retries.

---

# 12. Persistent Job Records & Interrupted-Job Recovery

## 12.1 Job Lifecycle

Supported states:

```
QUEUED
  |
  v
SCHEDULED
  |
  v
RUNNING
  |
  +----> SUCCEEDED
  |
  +----> FAILED
  |
  +----> CANCELLED
  |
  +----> INTERRUPTED
              |
              v
       RECOVERY_REQUIRED
              |
       +------+------+
       |             |
       v             v
     RETRY       BLOCKED
```

Additional states:

- `RETRY_PENDING`
    
- `BLOCKED`
    

## 12.2 Persistent Job Records

Persist:

- Job identity and type.
    
- State.
    
- Progress.
    
- Start and end timestamps.
    
- Trace correlation.
    
- Dependencies.
    
- Retry history.
    
- Error references.
    
- Artifact references.
    

## 12.3 Startup Recovery

When the application restarts:

1. Detect jobs previously marked RUNNING.
    
2. Mark them INTERRUPTED.
    
3. Inspect checkpoints and persistence state.
    
4. Evaluate idempotency and resume safety.
    
5. Evaluate dependent-job impact.
    
6. Present recovery recommendations.
    
7. Require appropriate user approval.
    

Never blindly resume interrupted jobs.

## 12.4 Diagnostics UI

Show:

- Active and queued jobs.
    
- Failed and interrupted jobs.
    
- Duration and progress.
    
- Dependencies.
    
- Retry history.
    
- Recovery recommendations.
    

Detailed execution history remains bounded according to project history policy.

---

# 13. Lifecycle Orchestration

## 13.1 Startup Sequence

```
Environment Validation
        |
        v
Observability Initialization
        |
        v
Persistence Initialization
        |
        v
Core Services
        |
        v
Job Manager
        |
        v
Optional Services
        |
        v
Health Assessment
        |
        v
Interrupted Operation Recovery
        |
        v
Application Readiness
```

## 13.2 Shutdown Sequence

1. Stop accepting new work.
    
2. Apply job-specific cancellation/checkpoint policies.
    
3. Complete or preserve critical sections safely.
    
4. Flush critical events.
    
5. Persist job states.
    
6. Close storage resources.
    
7. Release workers and processes.
    
8. Write clean-shutdown marker.
    

No heavy work on UI or IPC threads.

## 13.3 Failure Handling

- Core failures may block readiness.
    
- Optional failures should degrade gracefully.
    
- Storage integrity takes priority.
    
- Resource ownership and cleanup must be deterministic.
    

---

# 14. Crash-Safe Persistence & Recovery Journal

## 14.1 Crash Detection

Use:

- Startup/shutdown markers.
    
- Last clean shutdown timestamp.
    
- Persistent job records.
    
- Transaction state.
    
- Recovery journal.
    

## 14.2 Recovery Journal

The journal coordinates operations involving multiple persistence resources.

It does not replace SQLite transaction logs.

## 14.3 Recovery Policies

|Operation|Recovery policy|
|---|---|
|Disposable cache rebuild|Automatic|
|Safe temporary-file cleanup|Automatic|
|Incomplete staged publication|Validate before recovery|
|Metadata repair|User approval when consequential|
|Destructive rollback|Explicit confirmation|

## 14.4 Integrity Safeguards

- SQLite integrity checks.
    
- Staged and atomic file publication where supported.
    
- Backup verification.
    
- Immutable snapshot preservation.
    
- Rebuildable cache.
    
- Recovery audit records.
    

---

# 15. Adaptive Resource Monitoring

## 15.1 Monitored Resources

Monitor:

- CPU utilization and saturation.
    
- RSS and peak memory.
    
- Allocation pressure.
    
- Disk free space.
    
- Disk read/write throughput and latency.
    
- SQLite, Parquet, and cache footprint.
    
- Active threads and processes.
    
- Worker queue saturation.
    
- Job wait and execution durations.
    
- Frontend responsiveness and IPC latency.
    

Resource measurements should correlate with `job_id`, `trace_id`, execution engine, and workload type.

## 15.2 Resource States

- Normal.
    
- Elevated.
    
- Critical.
    

Thresholds must be configurable and capacity-aware rather than relying exclusively on universal fixed values.

## 15.3 Resource Pressure Management

Possible responses:

- Reduce execution concurrency.
    
- Defer non-priority jobs.
    
- Warn before risky operations.
    
- Select a more resource-efficient strategy only when analytically valid.
    
- Use disk-backed processing when appropriate.
    

### Non-Negotiable Constraints

- Never silently downgrade exact execution to sampled execution.
    
- Never cancel user work without an explicit policy.
    
- Preserve analytical correctness.
    
- Provide transparent warnings and recommendations.
    

## 15.4 Performance Diagnostics

The dashboard should expose:

- Per-job resource usage.
    
- Slow operations.
    
- Worker and queue pressure.
    
- Engine utilization.
    
- Resource warnings.
    
- Aggregated performance history.
    

High-frequency raw samples have short retention.

---

# 16. Reliability SLOs

## 16.1 Reliability Domains

Reliability is evaluated independently across:

1. Startup reliability.
    
2. Application responsiveness.
    
3. Job execution reliability.
    
4. Data integrity and recovery.
    
5. Observability overhead.
    

## 16.2 Initial Engineering Targets

|Metric|Initial target|
|---|---|
|Warm application startup|≤ 5 seconds|
|Basic IPC round-trip|p95 ≤ 200 ms|
|Standard interactive UI action|p95 ≤ 300 ms|
|Observability overhead|≤ 5% CPU on representative workloads|
|Automatic job resume|Only after safety validation|
|Silent data corruption|Zero known occurrences|
|Background job progress|Exposed through Job Manager|

These are initial engineering targets, not universal performance guarantees.

## 16.3 Benchmarking Rules

- Use documented reference hardware.
    
- Separate interactive, startup, and background workloads.
    
- Test representative dataset sizes.
    
- Record execution engine and workload characteristics.
    
- Prioritize correctness over speed.
    
- Revise targets using empirical evidence.
    

Large-dataset execution must not be judged by a universal duration threshold.

---

# 17. Operational Alerts & Notifications

## 17.1 Alert Categories

- Application health.
    
- Resource pressure.
    
- Job execution.
    
- Data integrity.
    
- Plugin failures.
    
- Storage.
    
- Security.
    

## 17.2 Severity Policy

|Severity|Behavior|
|---|---|
|Info|Non-intrusive notification|
|Warning|In-app alert with recommendation|
|Error|Persistent notification until handled or dismissed|
|Critical|Prominent alert when action is needed to prevent damage or data loss|

## 17.3 Noise Control

- Deduplicate alerts with the same cause and scope.
    
- Group repeated alerts with occurrence counts.
    
- Apply cooldown.
    
- Auto-resolve when conditions normalize.
    
- Maintain alert history.
    

Alerts correlate with job, trace, component, and recovery references where available.

## 17.4 User Controls

- Notification Center.
    
- Configurable categories and severities.
    
- OS notifications are opt-in.
    
- Critical data-integrity and security alerts cannot be suppressed by ordinary notification settings when user action is necessary.
    

No automatic external notification.

---

# 18. Retention & Storage Governance

## 18.1 Default Retention

|Data|Default retention|
|---|---|
|DEBUG logs|3 days|
|INFO logs|14 days|
|WARNING / ERROR / CRITICAL logs|30 days|
|Traces|7 days|
|High-frequency raw metrics|24 hours|
|Aggregated metrics|90 days|
|Alert history|90 days|
|Job execution records|Project history policy|

Retention periods are configurable.

## 18.2 Quota Management

- Dedicated observability storage quota.
    
- Global quota and per-project quota.
    
- Separate from datasets and project artifacts.
    
- Disk-pressure monitoring.
    
- Background cleanup.
    

## 18.3 Priority-Aware Eviction

Eviction order:

1. Expired DEBUG logs.
    
2. Expired raw high-frequency metrics.
    
3. Obsolete trace samples.
    
4. Other expired telemetry according to retention policy.
    

Preserve important error records within their retention period.

Never evict job execution records or audit evidence through ordinary observability eviction.

Additional safeguards:

- Warn when storage approaches quota.
    
- Protect data currently used by diagnostic bundle generation.
    
- Record cleanup and eviction events.
    

---

# 19. Self-Diagnostics & Remediation

## 19.1 Diagnostic Checks

Support checks for:

- SQLite integrity.
    
- Metadata consistency.
    
- Snapshot and artifact references.
    
- File integrity.
    
- Plugin compatibility.
    
- Runtime availability.
    
- Python environment and dependency conflicts.
    
- DuckDB and storage availability.
    
- Resource pressure and worker saturation.
    
- Interrupted jobs.
    
- Incomplete persistence operations.
    
- Configuration validity.
    
- Component dependency health.
    

## 19.2 Risk-Tiered Remediation

|Risk|Policy|Examples|
|---|---|---|
|Low|Automatic|Rebuild disposable cache|
|Medium|Automatic only when policy allows|Retry safe idempotent check|
|High|User approval|Rebuild consequential derived artifacts|
|Critical|Explicit confirmation|Delete, overwrite, rollback, alter original/project data|

## 19.3 Remediation Safeguards

Every remediation must define:

- Preconditions.
    
- Expected outcome.
    
- Risk classification.
    
- Required approval.
    
- Post-action validation.
    
- Backup, journal, or checkpoint requirements where relevant.
    

If remediation fails:

- Stop the sequence.
    
- Preserve diagnostic evidence.
    
- Report the failure.
    
- Avoid unverified follow-up actions.
    

Maintain remediation history with cause, action, approval, result, and correlation identifiers.

AI may explain diagnoses and recommend remediation but must not bypass the policy engine.

## 19.4 System Health & Diagnostics Center

Provide:

- Component health overview.
    
- Diagnostic results.
    
- Root-cause hypotheses clearly separated from confirmed facts.
    
- Remediation recommendations.
    
- Risk levels.
    
- Approval controls.
    
- Remediation history.
    

---

# 20. Operational Audit Trail

## 20.1 Purpose

Maintain a dedicated record of important operational actions and accountability.

## 20.2 Audit Events

Include:

- Startup/shutdown and recovery decisions.
    
- Job retry, cancellation, resume, and recovery approvals.
    
- Diagnostic remediation and user approvals.
    
- Operational settings and retention/resource-policy changes.
    
- Plugin enable/disable, isolation, and permission changes.
    
- Diagnostic bundle creation and export.
    
- Security-relevant operational events.
    
- Manual recovery/remediation overrides.
    

## 20.3 Record Structure

Each record includes:

- `audit_event_id`
    
- `timestamp`
    
- `actor_type`
    
- `actor_id`, when relevant
    
- `action`
    
- `target_type`
    
- `target_id`
    
- `outcome`
    
- `reason` or approval reference
    
- `request_id`, `job_id`, `trace_id`, when available
    
- `schema_version`
    

## 20.4 Integrity & Retention

- Append-only logical model.
    
- Transactional persistence.
    
- Integrity checks.
    
- Separate logical storage from logs, traces, metrics, and job records.
    
- Policy-based retention balancing investigation, storage, and privacy.
    
- Export requires permission checks and redaction.
    

Never store credentials, sensitive payloads, or raw dataset contents.

---

# 21. Testing & Verification Strategy

## 21.1 Dedicated Test Domains

|Domain|Testing focus|
|---|---|
|Logging|Schema, rotation, redaction, retention|
|Tracing|Context propagation and span relationships|
|Metrics|Accuracy, cardinality, overhead|
|Health|Dependency propagation and recovery|
|Alerts|Severity, deduplication, cooldown|
|Diagnostic bundles|Content correctness and redaction|
|Job recovery|Interrupted states and resume safety|
|Persistence|Journal replay and integrity|
|Remediation|Risk policy and approval enforcement|
|Audit|Append-only behavior and integrity|
|Resource management|Thresholds and pressure response|

## 21.2 Failure Injection

Simulate:

- Application crash during active job.
    
- Forced termination during file publication.
    
- Disk full or storage unavailable.
    
- SQLite contention or corruption.
    
- Plugin crash or hang.
    
- Worker process termination.
    
- Missing or delayed IPC events.
    
- Lost trace context across asynchronous boundaries.
    
- Interrupted diagnostic bundle generation.
    
- Partial remediation failure.
    

## 21.3 Release Gates

Mandatory release gates:

1. Critical recovery tests pass.
    
2. Critical data-integrity tests pass.
    
3. Sensitive-data redaction tests pass.
    
4. Audit integrity tests pass.
    
5. Resource pressure does not cause silent analytical downgrade.
    
6. Instrumentation overhead meets targets or has a documented exception.
    
7. Graceful degradation and recovery behavior are verified.
    

Analytical correctness and data integrity take priority over performance.

**Gate ownership (IN-F, WP-16):** This section owns reliability gates. Doc13 owns test-execution gates and Doc14 owns packaging/signing gates. A release requires all three layers to pass; no layer may waive another layer's gate.

---

# 22. Incident Response & Operational Runbooks

## 22.1 Incident Classification

|Level|Meaning|Response|
|---|---|---|
|P1 — Critical|Risk of data loss, corruption, or security breach|Stop affected operation and preserve evidence|
|P2 — High|Core capability unavailable|Isolate, diagnose, restore|
|P3 — Moderate|Optional capability degraded|Graceful degradation and guided remediation|
|P4 — Low|Non-blocking issue|Record, monitor, maintenance|

## 22.2 Initial Runbook Catalog

1. Application startup failure.
    
2. Project/database integrity failure.
    
3. Dataset snapshot or artifact corruption.
    
4. Stuck, failed, or interrupted jobs.
    
5. Disk or memory exhaustion.
    
6. Plugin crash or suspected unsafe behavior.
    
7. Python environment or dependency failure.
    
8. IPC/WebView communication failure.
    
9. Update failure and rollback.
    
10. Diagnostic bundle generation failure.
    

## 22.3 Standard Runbook Structure

Every runbook defines:

1. Symptoms and detection signals.
    
2. Impact and affected components.
    
3. Diagnostic steps.
    
4. Safe containment actions.
    
5. Recovery and remediation steps.
    
6. Verification criteria.
    
7. Escalation conditions.
    
8. Evidence and audit requirements.
    

## 22.4 Incident Response Principles

- Preserve evidence before attempting recovery.
    
- Do not perform destructive recovery without approval.
    
- Isolate faulty components when feasible.
    
- Prioritize data integrity over availability.
    
- Align runbooks with error taxonomy, health states, recovery policies, and audit records.
    

---

# 23. Environment Fingerprinting & Compatibility Diagnostics

## 23.1 Purpose

Operational incidents must be associated with their relevant application and runtime environment.

This helps distinguish application defects from environment mismatches.

## 23.2 Environment Fingerprint

Capture:

|Category|Metadata|
|---|---|
|Application|Version, build ID, release channel|
|Operating system|OS, architecture, runtime|
|Python|Version and environment fingerprint|
|Dependencies|Core dependency versions|
|WebView|Runtime and version|
|Analytical engines|DuckDB and engine versions|
|Plugins|IDs, versions, compatibility status|
|Project|Schema version and migration status|

## 23.3 Compatibility Diagnostics

Compare the environment against the application compatibility manifest.

Detect:

- Unsupported runtime.
    
- Dependency conflicts.
    
- Incompatible plugins.
    
- Missing runtime dependencies.
    
- Project schema or migration incompatibility.
    

Distinguish environment mismatch from application defects.

Provide recommendations without silently modifying runtime environments or dependencies.

## 23.4 Privacy

Exclude:

- Usernames.
    
- Personal directory paths.
    
- Credentials.
    
- Machine identifiers.
    

Include environment fingerprints in diagnostic bundles only after preview and explicit user consent.

No automatic external transmission.

## 23.5 Incident Reproducibility

Incident records and diagnostic bundles should associate failures with:

- Application build.
    
- Relevant environment fingerprint.
    
- Component version.
    
- Correlation identifiers.
    

This provides a reproducible operational context without collecting unnecessary personal information.

---

# 24. Cross-Document Integration

Document 15 extends and operationalizes the following architecture documents:

|Document|Integration|
|---|---|
|02 — System Architecture|Health, lifecycle, observability infrastructure|
|04 — Data & Persistence Architecture|Integrity checks, recovery journal, storage governance|
|05 — Processing & Execution Architecture|Job diagnostics, resource monitoring, recovery|
|06 — Application & IPC Architecture|Error contracts, correlation, IPC diagnostics|
|07 — Frontend Architecture|Diagnostics dashboard and notifications|
|09 — Plugin & Extension Architecture|Plugin health, failure diagnostics, compatibility|
|10 — AI Architecture & Governance|AI remediation recommendations under policy control|
|11 — Security, Privacy & Threat Model|Redaction, audit, incident evidence, permission controls|
|13 — Testing & Quality Engineering|Failure injection and reliability release gates|
|14 — Build, Packaging & Distribution|Environment fingerprinting and compatibility manifest|

Document 15 does not replace the responsibilities of these documents. It defines their operational observability and reliability integration.

---

# 25. Implementation Priorities

## 25.1 MVP Foundation

Implement:

- Centralized Observability SDK.
    
- Structured logging.
    
- Basic tracing and correlation.
    
- Core operational metrics.
    
- Component health monitoring.
    
- Job execution records.
    
- Error taxonomy.
    
- Safe startup/shutdown and interrupted-job recovery.
    
- Crash-safe persistence safeguards.
    
- Basic diagnostics dashboard.
    
- Local retention and quota management.
    
- Critical failure and redaction tests.
    

## 25.2 Extended Operational Capabilities

Implement:

- Full distributed tracing.
    
- Advanced resource monitoring.
    
- Event-driven Notification Center.
    
- Diagnostic bundle collection levels.
    
- Self-diagnostics.
    
- Risk-tiered remediation.
    
- Operational audit trail.
    
- Environment fingerprinting.
    
- Full incident runbook catalog.
    
- Advanced failure-injection testing.
    

## 25.3 Future Enhancements

Potential extensions:

- Optional external OpenTelemetry exporters.
    
- Advanced performance regression analysis.
    
- More sophisticated root-cause analysis.
    
- Additional platform-specific diagnostics.
    
- Extended operational automation.
    

These enhancements must preserve the local-first, privacy, and user-approval principles.

---

# 26. Architecture Decisions Register

All decisions below are approved and form the Document 15 baseline v0.1.

|ID|Decision|Status|
|---|---|---|
|OBS-001|Local-First Observability|Approved|
|OBS-002|Centralized Observability SDK + OpenTelemetry Compatibility|Approved|
|OBS-003|Structured JSON Logging|Approved|
|OBS-004|End-to-End Distributed Tracing|Approved|
|OBS-005|Multi-Domain Metrics + Local Dashboard|Approved|
|OBS-006|Hierarchical Health + Dependency-Aware Readiness|Approved|
|OBS-007|User-Initiated Diagnostic Bundles + Redaction|Approved|
|OBS-008|Centralized Error Taxonomy + Recovery-Aware Handling|Approved|
|OBS-009|Persistent Job Records + Safe Interrupted-Job Recovery|Approved|
|OBS-010|Dependency-Aware Lifecycle Orchestration|Approved|
|OBS-011|Crash-Safe Persistence + Recovery Journal|Approved|
|OBS-012|Adaptive Resource Monitoring + Workload-Aware Diagnostics|Approved|
|OBS-013|Tiered Reliability SLOs + Evidence-Based Acceptance Criteria|Approved|
|OBS-014|Event-Driven Alerts + Severity Escalation|Approved|
|OBS-015|Tiered Retention + Quota-Based Storage Governance|Approved|
|OBS-016|Rule-Based Self-Diagnostics + Risk-Tiered Remediation|Approved|
|OBS-017|Dedicated Operational Audit Trail|Approved|
|OBS-018|Observability Testing + Failure Injection|Approved|
|OBS-019|Operational Runbooks + Incident Response|Approved|
|OBS-020|Environment Fingerprinting + Compatibility Diagnostics|Approved|

---

# 27. Final Architectural Guarantees

The Document 15 architecture establishes these non-negotiable guarantees:

1. Observability works without mandatory external services.
    
2. Sensitive data is excluded or redacted before persistence.
    
3. Operational activity is correlated across system boundaries.
    
4. Optional component failures do not unnecessarily disable core EDA capabilities.
    
5. Interrupted jobs are never blindly resumed.
    
6. Recovery respects idempotency, dependencies, and persistence integrity.
    
7. Resource pressure never silently changes analytical correctness.
    
8. Destructive remediation requires explicit approval.
    
9. Audit evidence is logically separate from ordinary telemetry.
    
10. Observability storage and resource overhead remain bounded.
    
11. Critical reliability and integrity tests are release gates.
    
12. Operational incidents retain sufficient environment and execution context for diagnosis.
    

---

# 28. Approval & Baseline

**Document:** DOC-15 — Observability, Diagnostics & Operational Reliability Architecture

**Version:** 0.1

**Status:** Approved — Finalized

**Decision Register:** OBS-001 through OBS-020

**Architecture Role:** Defines the operational visibility, diagnostic, reliability, recovery, and incident-response foundation for EDA Workbench.

This document is the approved baseline for subsequent detailed design and implementation.

Changes to these architectural decisions must be explicitly reviewed and versioned.