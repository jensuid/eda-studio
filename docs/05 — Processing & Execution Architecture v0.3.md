# 05 — Processing & Execution Architecture

**Product:** EDA Workbench  
**Document:** 05 — Processing & Execution Architecture  
**Version:** 0.3  
**Status:** Draft for Review — Revised for Review (WP-14)  
**Depends on:** Documents 01, 02 v0.3, 03 v0.2, and 04 v0.2

> **Revision note (WP-14):** v0.3 is a header/status correction only (IN-D): the `Draft` header status was stale for a document whose content had already been accepted as the canonical execution architecture in WP-08R. No body changes in this version.

---

## 1. Purpose

This document defines how EDA Workbench plans, schedules, executes, monitors, and records analytical operations.

It establishes a unified execution architecture for:

- Data ingestion and profiling.
    
- Data quality assessment.
    
- Cleaning and transformation pipelines.
    
- Joins and analytical views.
    
- Statistical analysis.
    
- Anomaly and pattern detection.
    
- Segmentation and aggregation.
    
- Visualization data preparation.
    
- Plugin and custom script execution.
    
- AI-assisted analytical tasks.
    

The architecture must support datasets ranging from small in-memory tables to very large datasets that require lazy execution, pushdown, streaming, or partitioned processing.

Primary objectives:

1. Efficient execution across different dataset sizes.
    
2. Reproducible and traceable results.
    
3. Predictable resource consumption.
    
4. Non-blocking desktop interaction.
    
5. Explicit handling of exact, approximate, and sampled execution.
    
6. Reliable failure, cancellation, and retry behavior.
    
7. Safe execution of third-party extensions.
    
8. Consistent execution contracts across analytical engines.
    

## 2. Processing Principles

1. **Declarative intent:** Express analytical work as specifications before selecting execution details.
    
2. **Adaptive execution:** Select an execution strategy based on data characteristics, operation requirements, and available resources.
    
3. **Correctness first:** Never silently trade correctness for performance.
    
4. **Explicit approximation:** Sampling and approximation must be visible and recorded.
    
5. **Reproducibility:** Capture inputs, configuration, engine versions, and execution metadata.
    
6. **Resource awareness:** CPU, memory, disk, and time must be managed explicitly.
    
7. **Non-blocking UI:** Long-running work must execute outside the UI and IPC request thread.
    
8. **Dependency awareness:** Tasks execute only when required inputs are available and valid.
    
9. **Failure isolation:** Independent tasks should be able to succeed even when another task fails.
    
10. **Safe extensibility:** Untrusted plugins and scripts must not execute with unrestricted access by default.
    

## 3. Execution Architecture Overview

The processing architecture consists of the following components:

|Component|Responsibility|
|---|---|
|Execution Request Layer|Receives validated execution requests|
|Plan Builder|Converts user intent into declarative plans|
|Decision Engine|Selects methods and evaluates requirements|
|Query Planner|Selects analytical execution strategies|
|Execution Planner|Builds task dependencies and execution order|
|Resource Manager|Allocates and enforces resource budgets|
|Job Manager|Coordinates background jobs and lifecycle|
|Scheduler|Dispatches tasks to suitable execution workers|
|Execution Adapters|Integrate DuckDB, Polars, Python and other engines|
|Transformation Engine|Executes cleaning operations|
|Analysis Engine|Executes statistical and analytical methods|
|Result Validator|Validates output contracts and execution status|
|Artifact Publisher|Persists results and provenance|
|Event Publisher|Reports progress and lifecycle events|

### 3.1 High-Level Flow

```
User Intent / Approved Plan
           |
           v
    Execution Request
           |
           v
      Plan Builder
           |
           v
     Decision Engine
           |
           v
      Query Planner
           |
           v
    Execution Planner
           |
           v
     Resource Manager
           |
           v
       Job Manager
           |
           v
       Scheduler
           |
    +------+------+-------+
    |             |       |
    v             v       v
 DuckDB        Polars   Python
    |             |       |
    +------+------+-------+
           |
           v
      Result Validation
           |
           v
     Artifact Publisher
           |
      +----+-----+
      |          |
      v          v
   Storage    Events/UI
```

The actual engine may differ by operation. Not every task passes through every component.

## 4. Execution Request and Specification

### 4.1 Execution Request

An execution request represents a user's or application service's intention to perform work.

It should include:

- request_id
    
- project_id
    
- operation_type
    
- input_references
    
- configuration
    
- execution_preferences
    
- approval_reference, where required
    
- resource_constraints
    
- requested_execution_mode
    
- caller_context
    

Requests must be validated before entering the execution pipeline.

### 4.2 Declarative Query Specification

Common analytical operations should be represented by a declarative Query Spec.

Initial supported operations:

- Scan.
    
- Projection.
    
- Filter.
    
- Sort.
    
- Aggregation.
    
- Group by.
    
- Join.
    
- Sampling.
    
- Limit.
    
- Window operations where supported.
    

A Query Spec describes _what_ should be computed, not necessarily _how_ it should be executed.

The execution engine determines whether the specification can be pushed down, lazily evaluated, partitioned, or executed in memory.

Specialized algorithmic operations such as clustering, hypothesis tests, and anomaly detection may use dedicated method specifications.

### 4.3 Method Specification

Analytical methods should have explicit contracts:

- method_id
    
- method_version
    
- input requirements
    
- output schema
    
- parameter schema
    
- data type requirements
    
- assumptions
    
- resource characteristics
    
- execution capabilities
    
- supported execution modes
    
- limitations
    

This enables the Decision Engine to evaluate method suitability before execution.

## 5. Adaptive Query Planner

### 5.1 Purpose

The Adaptive Query Planner selects a suitable execution strategy based on:

- Dataset size and estimated cardinality.
    
- Schema and semantic types.
    
- Provider capabilities.
    
- Operation type.
    
- Pushdown availability.
    
- Expected intermediate data size.
    
- Available CPU, memory, and disk.
    
- Required correctness and precision.
    
- Execution history where available.
    

### 5.2 Supported Execution Strategies

|Strategy|Typical Use|
|---|---|
|In-memory|Small datasets and lightweight operations|
|Polars Lazy|Lazy transformations and columnar processing|
|DuckDB|Analytical SQL, joins, aggregations, Parquet queries|
|Source Pushdown|Operations executed by external providers|
|Streaming|Large sequential or bounded-memory processing|
|Partitioned|Large datasets that can be divided into independent work units|
|Sampling|Exploratory estimation where explicitly permitted|

These strategies are not mutually exclusive. A query plan may combine them.

### 5.3 Planning Process

1. Validate the Query Spec.
    
2. Resolve input dataset and snapshot references.
    
3. Inspect provider capabilities.
    
4. Estimate rows, columns, and intermediate data size.
    
5. Evaluate operation and method requirements.
    
6. Estimate CPU, memory, disk, and I/O cost.
    
7. Identify supported pushdown opportunities.
    
8. Select an execution strategy.
    
9. Validate resource constraints.
    
10. Produce an explainable execution plan.
    

### 5.4 Cost Estimation

The planner should consider:

- Estimated CPU cost.
    
- Peak memory requirement.
    
- Disk I/O.
    
- Intermediate materialization.
    
- Network transfer where applicable.
    
- Expected duration.
    
- Data movement between engines.
    

Estimates are advisory and may be inaccurate. Actual execution metrics should be recorded for future calibration.

### 5.5 Exact, Approximate and Sampled Execution

Execution modes must be explicit:

**Exact**

- Computes the requested result according to the method's exactness contract.
    
- Must not silently fall back to sampling or approximation.
    

**Approximate**

- Uses a documented approximation algorithm.
    
- Records method, parameters, and error characteristics where available.
    

**Sampled**

- Uses a selected subset of data.
    
- Records sampling strategy, sample size, and seed where applicable.
    

The system may recommend an alternative execution mode when resources are insufficient, but the user must approve a change that alters the requested result semantics.

### 5.6 Explainability

Every planned execution should provide an explanation containing:

- Selected backend.
    
- Selected strategy.
    
- Input references.
    
- Pushdown decisions.
    
- Sampling or approximation details.
    
- Estimated resource usage.
    
- Potential limitations.
    
- Alternative strategies considered where useful.
    

Advanced Mode may expose detailed execution plans. Guided Mode presents concise explanations and meaningful warnings.

## 6. Decision Engine and Analysis Planning

The Decision Engine evaluates analytical intent and proposes suitable operations.

Responsibilities:

- Recommend profiling and quality checks.
    
- Select candidate statistical methods.
    
- Validate input compatibility.
    
- Evaluate assumptions.
    
- Identify missing prerequisites.
    
- Recommend alternative methods.
    
- Generate Analysis Plans.
    

### 6.1 Analysis Plan

An Analysis Plan consists of:

- Plan identity and revision.
    
- Input dataset/snapshot/view references.
    
- Ordered or dependency-linked steps.
    
- Method identifiers and versions.
    
- Parameters.
    
- Preconditions and assumptions.
    
- Expected outputs.
    
- Resource estimates.
    
- Warnings and limitations.
    

### 6.2 Approval Model

- Plans may be generated automatically.
    
- Users review and approve plans before execution.
    
- Approval applies to a specific plan revision.
    
- Editing an approved plan invalidates its approval.
    
- Transformations that change data require their own explicit approval.
    
- Read-only analytical tasks may be grouped into a reviewed plan.
    

The Decision Engine must not silently execute a plan that changes source data.

## 7. Execution Planner and Dependency Graph

The Execution Planner converts a plan into a Directed Acyclic Graph (DAG) of executable tasks.

### 7.1 Task Dependencies

A task may depend on:

- Input dataset availability.
    
- Snapshot existence and validation.
    
- Previous transformation output.
    
- Analysis prerequisite.
    
- Required schema or semantic type.
    
- External dependency availability.
    

Independent tasks may execute concurrently when resource limits permit.

### 7.2 Dependency Rules

- A task cannot execute until all mandatory prerequisites succeed.
    
- Failure blocks dependent tasks.
    
- Independent tasks continue where safe.
    
- Dependency cycles are rejected during planning.
    
- Every task has a stable identity within its execution plan.
    
- Re-execution must preserve the identity of the logical plan while creating new execution records.
    

### 7.3 Example DAG

```
Dataset Snapshot
       |
       +------------------+
       |                  |
       v                  v
  Profiling           Quality Check
       |                  |
       +--------+---------+
                |
                v
        Approved Cleaning
                |
                v
        Derived Dataset View
                |
        +-------+--------+
        |                |
        v                v
  Univariate       Bivariate Analysis
        |                |
        +-------+--------+
                |
                v
          Visualization
                |
                v
          Insight Review
```

This is an illustrative dependency graph. Actual task dependencies depend on the selected analysis.

## 8. Job Manager

### 8.1 Responsibility

The Job Manager is the central application service responsible for coordinating long-running operations.

It manages:

- Job creation and identity.
    
- Task scheduling.
    
- Progress reporting.
    
- Cancellation requests.
    
- Retry coordination.
    
- Resource allocation.
    
- Execution metadata.
    
- Failure handling.
    
- Recovery after application interruption.
    

### 8.2 Job Lifecycle

The Job Manager is the authoritative owner of job state.

```
Created → Queued → Preparing → Running
                              ├─→ Completed
                              ├─→ Failed
                              ├─→ Cancelling → Cancelled
                              └─→ Interrupted → Recovery Evaluation
```

`WaitingForResource` and `WaitingForApproval` are non-terminal waiting states. `PartiallyCompleted` is an outcome only where the job contract explicitly permits valid partial output; it must not be treated as `Completed`.

Terminal outcomes are `Completed`, `Failed`, `Cancelled`, and conditionally `PartiallyCompleted`. `Interrupted` records execution interrupted before a terminal outcome and initiates recovery evaluation; it is not evidence of successful completion.

#### 8.2.1 Canonical Durable Lifecycle Event Mapping

| State/transition | Required durable event | Meaning |
|---|---|---|
| Job created | `JobCreated` | Logical identity established |
| Accepted into queue | `JobQueued` | Accepted for scheduling |
| Execution begins | `JobStarted` | Active execution begins |
| Cancellation requested | `JobCancellationRequested` | Request recorded, not completion |
| Cancellation completed | `JobCancelled` | Safe termination/outcome recorded |
| Successful completion | `JobCompleted` | Completion criteria satisfied |
| Unsuccessful completion | `JobFailed` | Failure outcome recorded |
| Interrupted execution | `JobInterrupted` | Durable interruption record |
| Recovery resolved | `JobRecoveryCompleted` | Reports recovery outcome; does not imply success |

`JobProgressUpdated` and task-progress events are ephemeral unless separately specified as durable. `TaskStarted`, `TaskCompleted`, and `TaskFailed` are task-level events and do not replace the job-level terminal event.

Each durable transition event identifies `job_id`, resulting state, transition timestamp, event identity/version, and correlation context. State and event persistence must be consistent: consumers must not observe a durable terminal event for a transition that was not persisted. Ordering and replay follow Document 02 and Document 06.

### 8.3 Job vs Task

A Job represents a user-visible unit of work.

A Task represents an individual executable step within that job.

A job may contain multiple tasks, dependencies, retries, and partial results.

### 8.4 Job Metadata

Every job should record:

- job_id
    
- project_id
    
- job_type
    
- request_id
    
- plan_id and revision, where applicable
    
- input references
    
- task graph
    
- status
    
- progress
    
- start/end timestamps
    
- cancellation state
    
- retry history
    
- error information
    
- execution environment
    
- resource usage
    

Large results are stored as artifacts, not embedded in job metadata.

## 9. Concurrency and Execution Runtime

### 9.1 Execution Model

Use a hybrid concurrency architecture.

|Runtime|Primary Responsibility|
|---|---|
|AsyncIO|I/O orchestration and asynchronous coordination|
|Threads|Blocking I/O and compatible operations|
|ProcessPool with spawn|CPU-intensive trusted computations|
|Isolated subprocess|Third-party plugins and arbitrary scripts|
|DuckDB / Polars|Analytical query execution|

### 9.2 Execution Rules

- Never run expensive analytical work on the UI or IPC request thread.
    
- PyWebView bridge calls must remain short and thread-safe.
    
- Use explicit worker ownership and lifecycle management.
    
- Avoid unbounded task creation.
    
- Avoid uncontrolled nested parallelism.
    
- Prevent thread/process oversubscription.
    
- Propagate cancellation where the underlying operation supports it.
    
- Release temporary resources after execution.
    

### 9.3 Process Isolation

Trusted built-in operations may execute in-process or in managed workers according to their runtime characteristics.

Third-party plugins and arbitrary scripts execute in isolated subprocess environments by default.

A subprocess alone is not a complete security sandbox. Strong isolation requires OS-level controls, restricted filesystem access, process permissions, resource limits, and network restrictions where supported.

## 10. Resource Manager

### 10.1 Resource Dimensions

The Resource Manager monitors and controls:

- Memory.
    
- CPU workers.
    
- Disk capacity.
    
- Temporary storage.
    
- Concurrent jobs.
    
- Query execution budgets.
    
- Plugin execution budgets.
    
- AI token and cost budgets.
    

### 10.2 Resource Policies

- Global application budget.
    
- Per-project budget.
    
- Per-job budget.
    
- Per-plugin budget.
    
- Reserved capacity for essential application operations.
    

### 10.3 Admission Control

Before scheduling a task, evaluate:

- Estimated resource requirements.
    
- Current available resources.
    
- Project and application limits.
    
- Task priority.
    
- Required execution guarantees.
    

If resources are insufficient:

- Queue the task.
    
- Recommend an alternative strategy.
    
- Ask for user intervention where needed.
    
- Reject execution if safe operation is impossible.
    

Do not silently downgrade exact work to approximate work.

### 10.4 Resource Monitoring

Collect:

- CPU usage.
    
- Memory consumption and peak.
    
- Disk reads/writes.
    
- Temporary storage usage.
    
- Execution duration.
    
- Worker utilization.
    
- Cancellation and failure rates.
    

Resource monitoring must not capture raw dataset values.

## 11. Engine Adapter Architecture

Analytical engines must be accessed through controlled adapters.

### 11.1 Engine Adapter Contract

An adapter should expose:

- Supported operations.
    
- Capability discovery.
    
- Query execution.
    
- Explain-plan support where available.
    
- Cancellation support where available.
    
- Result metadata.
    
- Resource metrics where available.
    
- Engine and version information.
    
- Typed error translation.
    

### 11.2 Initial Engines

**DuckDB**

- Primary analytical SQL engine.
    
- Parquet queries.
    
- Joins and aggregations.
    
- Analytical views.
    
- Pushdown and query planning.
    

**Polars**

- Columnar transformations.
    
- Lazy execution.
    
- DataFrame-oriented analytical operations.
    

**Python**

- Statistical libraries.
    
- Specialized algorithms.
    
- Trusted built-in analytical methods.
    
- Custom method integration.
    

Additional engines may be introduced through governed adapters and extension contracts.

### 11.3 Engine Selection

Engine selection must be capability-driven, not based only on dataset size.

A method may require a particular library or algorithm even when another engine is faster.

The planner must preserve method semantics when choosing an engine.

## 12. Transformation Execution

Transformation execution follows the non-destructive pipeline architecture.

### 12.1 Execution Lifecycle

```
Detect
  |
Recommend
  |
Configure
  |
Preview
  |
Validate
  |
Approve
  |
Execute
  |
Validate Output
  |
Record Execution
  |
Optional Materialization
```

### 12.2 Execution Requirements

- Input snapshot or view revision is explicit.
    
- Pipeline revision is fixed for each execution.
    
- Operations execute in declared order and dependency sequence.
    
- Each operation has a typed input/output contract.
    
- Output schema is validated.
    
- Row count and relevant quality metrics may be compared.
    
- Failures preserve the original input.
    
- Successful output is represented as a derived view or new snapshot.
    

### 12.3 Materialization

Default behavior is virtual execution where practical.

Options:

- Virtual View.
    
- Cached Result.
    
- Materialized Snapshot.
    

Materialization creates an immutable output and must use the persistence protocol defined in Document 04.

## 13. Statistical and Analytical Execution

### 13.1 Method Registry

Each method should define:

- Method identity and version.
    
- Input schema requirements.
    
- Parameter schema.
    
- Statistical assumptions.
    
- Exactness and approximation behavior.
    
- Output contract.
    
- Resource profile.
    
- Limitations.
    

### 13.2 Assumption Validation

Before execution:

- Validate input types.
    
- Evaluate relevant statistical assumptions.
    
- Identify missing prerequisites.
    
- Recommend alternatives where necessary.
    

Assumption checks may be advisory or mandatory depending on the method.

A method must not silently change because an assumption fails.

### 13.3 Result Contract

Statistical results should preserve, where applicable:

- Statistic.
    
- P-value.
    
- Effect size.
    
- Confidence interval.
    
- Sample size.
    
- Degrees of freedom.
    
- Method and version.
    
- Assumption results.
    
- Execution mode.
    
- Multiple-testing adjustment.
    
- Limitations.
    
- Input provenance.
    

Not every method produces every field. The result schema must represent unavailable or inapplicable values explicitly.

Statistical significance must not be presented as practical importance or causality.

## 14. Execution Failure, Retry and Cancellation

### 14.1 Failure Classification

Initial categories:

- InputUnavailable.
    
- InvalidConfiguration.
    
- DependencyFailed.
    
- ResourceExhausted.
    
- EngineFailure.
    
- MethodFailure.
    
- PluginFailure.
    
- PermissionDenied.
    
- PersistenceFailure.
    
- Cancelled.
    
- UnexpectedInternalError.
    

### 14.2 Failure Handling

- Preserve successful independent tasks.
    
- Block dependent tasks when prerequisites fail.
    
- Record failure details and safe diagnostics.
    
- Keep partial results only when their validity is explicit.
    
- Do not publish incomplete outputs as successful artifacts.
    
- Allow selective retry of failed tasks.
    
- Preserve successful execution records.
    

### 14.3 Retry Policy

A retry is a new execution attempt for an existing logical job unless the operation contract explicitly requires a new logical job. A retry never overwrites or erases the original attempt record.

Retry is permitted only when:
- The source job is `Failed` or another explicitly retryable state.
- The failure is potentially transient or the failed task is independently retryable.
- The operation is safe to retry or idempotent.
- Inputs, source revisions, authorization, and configuration remain valid.
- Resource limits and the configured retry bound permit another attempt.

A retry request identifies the logical `job_id`, retry scope (whole job or explicitly retryable task set), expected current job revision/state, and caller-generated idempotency key. The backend authorizes the retry and rejects stale state/revision or an ineligible source state.

Each attempt receives a distinct `attempt_id` and monotonically increasing attempt number within the logical job. The logical `job_id` remains stable for retries of that work. Each attempt links to its predecessor and records retry reason, scope, initiating actor, timestamp, idempotency-key reference, and outcome. A retry that intentionally creates a new logical job uses a new `job_id` and explicit `retry_of_job_id`.

The same idempotency key and same canonical retry request within its defined retention scope return the previously recorded result rather than scheduling a duplicate attempt. Reuse of the same key with materially different request content returns a conflict. The exact retention duration remains an implementation decision but must cover the supported client retry/reconnect window.

Retries are bounded and recorded. Non-idempotent external operations require operation-specific reconciliation or human intervention and must not be blindly retried. A retry must not silently repeat externally visible side effects.

### 14.4 Cancellation

Cancellation is cooperative where possible. The system should:
1. Record the cancellation request.
2. Stop scheduling new dependent work.
3. Signal active workers.
4. Wait for safe termination.
5. Clean temporary resources.
6. Record final status.

If an engine cannot cancel immediately, the UI must distinguish cancellation requested from cancellation completed.

### 14.5 Observable Recovery Contract

Recovery algorithms and scheduling strategies remain implementation decisions. The observable contract is not deferred:

- On startup, the Job Manager identifies persisted jobs whose last durable state indicates active execution or interruption.
- Each affected job enters `Interrupted` or a separately represented recovery-evaluation condition before resumed execution is exposed as running.
- Recovery evaluation produces one explicit outcome: `Resumed`, `Restarted`, `RequiresUserAction`, `MarkedFailed`, or `RecoveryAborted`.
- `Resumed` and `Restarted` require declared safety/idempotency and checkpoint rules. Non-idempotent side effects must be reconciled before replay.
- `RequiresUserAction` preserves the job and evidence without silently rerunning work.
- `MarkedFailed` records that safe recovery is not possible with a stable failure classification.
- `RecoveryAborted` records that recovery itself could not complete and remains distinguishable from the original execution failure.
- Recovery outcome, resulting job state, attempt identity, timestamps, and diagnostic references are durably recorded before the frontend is told recovery is complete.

The frontend-visible contract exposes authoritative job state, whether recovery is being evaluated, the resolved recovery outcome, and permitted user actions. Progress may be unavailable after restart and need not be reconstructed. Persisted job state is authoritative; the event stream is a change/replay mechanism.

An interrupted job must not be represented as `Completed` without evidence that completion criteria were met.

## 15. Reproducibility and Execution Provenance

Every completed analytical execution must capture sufficient metadata to understand and reproduce its result.

Recommended execution record:

- execution_id
    
- project_id
    
- job_id
    
- input dataset/snapshot/view references
    
- schema fingerprints
    
- query or method specification
    
- parameters
    
- method version
    
- engine and library versions
    
- execution backend
    
- exact/approximate/sampled mode
    
- sampling seed and strategy, where applicable
    
- relevant resource configuration
    
- start/end timestamps
    
- result artifact references
    
- warnings and limitations
    
- validation outcome
    

Reproducibility means preserving the inputs, configuration, methods, and environment information needed to explain or rerun an operation. Bit-for-bit identical output may depend on library, hardware, parallelism, and floating-point behavior.

## 16. Cache and Execution Reuse

The execution planner may reuse valid cached results.

Before reuse:

- Verify input snapshot and view revision.
    
- Verify query/method and parameter identity.
    
- Verify relevant engine and library versions.
    
- Verify exactness and sampling mode.
    
- Verify dependency validity.
    

Cache hits must be observable in execution metadata.

A cache hit must never be presented as a newly executed calculation.

Invalid or stale cache entries must be rejected and rebuilt where possible.

## 17. Execution Events and Progress

Jobs and tasks publish lifecycle events.

Initial event types:

- JobCreated.
    
- JobQueued.
    
- JobStarted.
    
- JobProgressUpdated.
    
- TaskStarted.
    
- TaskCompleted.
    
- TaskFailed.
    
- JobCancellationRequested.
    
- JobCancelled.
    
- JobCompleted.
    
- JobInterrupted.
    
- JobRecoveryCompleted.
    

Progress events may be ephemeral.

Critical lifecycle transitions and execution records must be persisted according to the event architecture in Document 02.

Frontend consumers must support reconnect, deduplication, and state reconciliation.

Progress should be meaningful and must not imply false precision when task duration is unknown.

## 18. AI and Plugin Execution Integration

### 18.1 AI Tasks

AI operations use the same job coordination infrastructure where they are long-running.

AI execution additionally enforces:

- Provider authorization.
    
- Data classification.
    
- Explicit cloud consent.
    
- Token and cost budgets.
    
- Request/response provenance.
    
- Task-specific timeout and retry policy.
    

AI output is not a substitute for deterministic analytical computation.

### 18.2 Plugin Tasks

Plugins use governed execution adapters and declared contracts.

Requirements:

- Manifest and compatibility validation.
    
- Permission checks before execution.
    
- Runtime environment resolution.
    
- Resource budgets.
    
- Input/output validation.
    
- Isolated execution by default for third-party code.
    
- Safe error translation.
    
- Execution audit records.
    

Plugin output must pass validation before it can be registered as an artifact.

## 19. Observability

Capture structured execution telemetry:

- Queue wait time.
    
- Planning duration.
    
- Execution duration.
    
- Backend selection.
    
- Estimated versus actual resource usage.
    
- Cache hit/miss.
    
- Task success/failure.
    
- Retry and cancellation rates.
    
- Peak memory.
    
- Data volume processed.
    
- Approximation and sampling usage.
    

Logs and metrics must not include raw dataset values, secrets, or sensitive user content by default.

## 20. Testing and Quality Requirements

Execution architecture must be validated through:

**Correctness**

- Reference analytical datasets.
    
- Known expected outputs.
    
- Numerical tolerances.
    
- Exact versus approximate behavior.
    
- Method assumptions and edge cases.
    

**Planner**

- Capability-based engine selection.
    
- Pushdown correctness.
    
- Cost estimation behavior.
    
- Resource-constrained planning.
    
- Explain-plan validation.
    

**Concurrency**

- Worker limits.
    
- Cancellation.
    
- Deadlock prevention.
    
- Thread/process lifecycle.
    
- Oversubscription prevention.
    

**Reliability**

- Task failure isolation.
    
- Dependency blocking.
    
- Selective retry.
    
- Interrupted job recovery.
    
- Partial result validation.
    

**Reproducibility**

- Execution metadata completeness.
    
- Input revision binding.
    
- Method and engine version tracking.
    
- Cache identity validation.
    

**Security**

- Plugin isolation.
    
- Permission enforcement.
    
- Resource limits.
    
- Malicious input handling.
    
- Subprocess termination and cleanup.
    

## 21. Deferred Decisions

The following details are intentionally deferred:

- Exact worker pool sizing and tuning.
    
- Detailed scheduler priority and fairness algorithm.
    
- Concrete cost-model formulas.
    
- Engine-specific query translation.
    
- Full method registry schema.
    
- Exact cancellation guarantees by engine.
    
- Process isolation implementation per OS.
    
- Execution resource limit defaults.
    
- Detailed job recovery algorithms.
    
- Benchmark-derived performance thresholds.
    

These will be refined through technical ADRs and implementation specifications.

## 22. Traceability

|Related Document|Contribution|
|---|---|
|01 — Product Vision & Requirements|EDA workflow and analytical correctness|
|02 — System Architecture|Runtime, Job Manager and concurrency baseline|
|03 — Domain Model|Analysis, transformation and execution domain entities|
|04 — Data & Persistence Architecture|Snapshot, artifact, cache and persistence contracts|
|06 — Application & IPC Architecture|Execution commands, jobs and events|
|08 — Plugin & Extension Architecture|Plugin execution and isolation|
|09 — AI Architecture & Governance|AI task execution and policy|
|10 — Security & Privacy Architecture|Resource, permission and execution controls|
|12 — Artifact, Insight & Reporting Architecture|Result publication and provenance|
|13 — Testing & Quality Strategy|Analytical and execution validation|

## 23. Completion Criteria

Document 05 is ready for approval when:

- Execution responsibilities and component boundaries are explicit.
    
- Declarative specifications and adaptive planning are defined.
    
- Exact, approximate, and sampled modes are distinguished.
    
- Job and task lifecycles are explicit.
    
- Concurrency and resource controls are defined.
    
- Engine adapters preserve method semantics.
    
- Failure, retry, and cancellation behavior is defined.
    
- Reproducibility metadata is specified.
    
- Plugin and AI execution are integrated under governance.
    
- The architecture remains consistent with Documents 01–04.

### WP-08R Contract Clarification Note

This revision clarifies observable job/event, retry, and recovery contracts. It does not select a queue, persistence engine, scheduler, retry framework, recovery algorithm, or event broker.
