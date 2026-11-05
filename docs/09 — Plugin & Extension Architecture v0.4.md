# 09 — Plugin & Extension Architecture

**Project:** EDA Workbench  
**Document:** 09 — Plugin & Extension Architecture  
**Version:** 0.4  
**Status:** Draft for Review  
**Depends on:** Documents 01–08 and 11

---

## 1. Purpose

Dokumen ini mendefinisikan arsitektur extensibility EDA Workbench agar platform dapat dikembangkan melalui built-in capabilities, official plugins, third-party plugins, dan ad-hoc scripts tanpa mengorbankan security, reproducibility, dan system stability.

Plugin architecture harus mendukung:

- Custom data connectors.
    
- Additional profiling dan data quality checks.
    
- Statistical analysis methods.
    
- Transformation operations.
    
- Visualization extensions.
    
- Anomaly detection dan pattern discovery.
    
- Custom reports dan export formats.
    
- AI providers dan integrations.
    
- Custom workflows dan automation.
    

Tujuan utamanya adalah menyediakan extension ecosystem yang terkontrol, bukan sekadar mekanisme untuk menjalankan arbitrary Python code.

## 2. Extension Architecture Principles

|Principle|Description|
|---|---|
|Contract-first|Semua extensions mengikuti formal contracts|
|Capability-based|Plugin hanya memperoleh capabilities yang diizinkan|
|Least privilege|Default permission adalah deny|
|Isolation by default|Third-party code tidak berjalan langsung dalam core process|
|Reproducibility|Plugin version dan execution environment dicatat|
|Compatibility|Plugin memiliki API dan compatibility declarations|
|Controlled data access|Dataset diakses melalui controlled references|
|Failure containment|Plugin failure tidak boleh menjatuhkan seluruh aplikasi|
|User authority|Plugin tidak boleh melakukan destructive operations tanpa approval|
|Extensibility without core modification|Extension dapat menambah capabilities tanpa mengubah core modules|

## 3. Extension Model

EDA Workbench menggunakan hybrid extension architecture.

### 3.1 Extension Categories

|Extension Type|Purpose|Example|
|---|---|---|
|Data Connector|Import/connect data sources|PostgreSQL connector|
|Profiler|Custom profiling metrics|Specialized column profiler|
|Quality Rule|Additional quality checks|Domain-specific validation|
|Transformation|Custom data operations|Currency normalization|
|Analysis Method|Statistical or analytical methods|Specialized statistical test|
|Visualization|Custom chart or visualization|Domain-specific chart|
|Pattern Detector|Pattern and anomaly discovery|Time-series detector|
|Report Extension|Custom report sections/formats|Regulatory report|
|AI Provider|Additional model providers|Local model integration|
|Workflow Extension|Custom workflow steps|Industry-specific EDA process|

### 3.2 Extension Sources

|Source|Trust Model|Distribution|
|---|---|---|
|Built-in|Platform trusted|Bundled|
|Official plugin|Reviewed and signed|Official repository|
|Third-party plugin|External publisher|Public marketplace|
|Private plugin|Organization-controlled|Private repository|
|Ad-hoc script|User-provided|Local project or workspace|

Trust level must not be inferred solely from where a plugin was downloaded.

A signature establishes publisher identity and artifact integrity, not that the plugin is safe.

## 4. Plugin Architecture Overview

```
┌───────────────────────────────────────────────────┐
│                 Plugin Platform                   │
│                                                   │
│  Registry │ Discovery │ Installation │ Lifecycle  │
│  Permissions │ Compatibility │ Version Management │
└──────────────────────┬────────────────────────────┘
                       |
                       v
┌───────────────────────────────────────────────────┐
│                 Plugin SDK / Contracts            │
│                                                   │
│  Manifest │ Interfaces │ DTOs │ Capabilities      │
│  Events │ Results │ Errors │ Versioning           │
└──────────────────────┬────────────────────────────┘
                       |
                       v
┌───────────────────────────────────────────────────┐
│                 Plugin Runtime                    │
│                                                   │
│  Built-in Runtime │ Shared Official Runtime       │
│  Isolated Third-party Runtime │ Script Runtime    │
└──────────────────────┬────────────────────────────┘
                       |
                       v
┌───────────────────────────────────────────────────┐
│                 Controlled Host APIs              │
│                                                   │
│  Dataset Access │ Artifact Access │ Jobs           │
│  Logging │ Storage │ Events │ Permissions         │
└──────────────────────┬────────────────────────────┘
                       |
                       v
┌───────────────────────────────────────────────────┐
│                 Core Application                  │
│                                                   │
│  Domain Services │ Execution │ Persistence         │
└───────────────────────────────────────────────────┘
```

Plugin code must interact with the platform through SDK contracts and controlled host APIs, not by directly importing internal application modules.

## 5. Plugin Manifest

Every installable plugin must provide a manifest.

### 5.1 Manifest Responsibilities

The manifest declares:

- Plugin identity.
    
- Publisher.
    
- Version.
    
- Description.
    
- Supported extension points.
    
- SDK compatibility.
    
- Python compatibility.
    
- Dependencies.
    
- Required capabilities.
    
- Runtime requirements.
    
- Entry points.
    
- Configuration schema.
    
- Signature and package integrity metadata.
    

### 5.2 Proposed Manifest

```
manifest_version: "1.0"

plugin:
  id: "com.example.custom-profiler"
  name: "Custom Profiler"
  version: "1.0.0"
  publisher: "Example Organization"
  description: "Additional dataset profiling methods"

compatibility:
  platform_api: "1.x"
  python: ">=3.12"

extensions:
  - type: "profiler"
    entry_point: "plugin:CustomProfiler"

dependencies:
  python:
    - "some-library>=1.0"

capabilities:
  - "dataset.read"
  - "artifact.create"

runtime:
  isolation: "isolated"
  environment: "plugin-specific"
```

Manifest validation occurs before installation and again before activation.

The manifest is declarative metadata, not proof that the implementation behaves safely.

## 6. Plugin SDK and Contracts

The SDK provides stable interfaces for plugin developers.

### 6.1 SDK Responsibilities

- Base extension interfaces.
    
- Typed input/output contracts.
    
- Dataset and artifact references.
    
- Controlled host service clients.
    
- Capability declarations.
    
- Structured logging.
    
- Cancellation support.
    
- Progress reporting.
    
- Error contracts.
    
- Version compatibility helpers.
    

### 6.2 Extension Contract

Conceptual interface:

```
class AnalysisPlugin(Protocol):

    def describe(self) -> PluginMetadata:
        ...

    def validate(
        self,
        request: AnalysisRequest
    ) -> ValidationResult:
        ...

    def execute(
        self,
        context: PluginExecutionContext,
        request: AnalysisRequest
    ) -> PluginResult:
        ...
```

The actual contract must specify:

- Input schema.
    
- Output schema.
    
- Execution semantics.
    
- Cancellation behavior.
    
- Resource requirements.
    
- Error behavior.
    
- Data access permissions.
    
- Reproducibility requirements.
    

Plugins must not depend on undocumented internal APIs.

### 6.3 SDK Versioning

Use explicit platform API and SDK versions.

Compatibility levels:

- Compatible.
    
- Compatible with warnings.
    
- Unsupported.
    

Breaking contract changes require a major API version or an explicit migration strategy.

## 7. Extension Point Architecture

Extension points must be registered explicitly.

### 7.1 Registry

The Extension Registry stores:

- Extension ID.
    
- Plugin ID and version.
    
- Extension type.
    
- Contract version.
    
- Activation status.
    
- Compatibility status.
    
- Declared capabilities.
    
- Runtime assignment.
    

The registry is the authoritative source of installed and registered extensions.

### 7.2 Extension Discovery

The platform discovers extensions through:

1. Plugin installation.
    
2. Manifest validation.
    
3. Compatibility checks.
    
4. Contract registration.
    
5. Permission evaluation.
    
6. Runtime assignment.
    
7. Activation.
    

An extension cannot become active merely because its Python module exists in the filesystem.

### 7.3 Extension Resolution

When a feature requests an extension:

1. Resolve extension ID.
    
2. Verify registration and activation.
    
3. Validate API compatibility.
    
4. Check permissions.
    
5. Resolve runtime and environment.
    
6. Validate input.
    
7. Submit execution.
    
8. Validate output.
    
9. Publish result artifacts.
    

## 8. Plugin Runtime Architecture

EDA Workbench uses a hybrid runtime model.

### 8.1 Built-in Runtime

For platform-maintained trusted extensions.

Characteristics:

- In-process execution where appropriate.
    
- Shared core environment.
    
- Direct use of approved internal services through defined integration boundaries.
    
- Strict internal interfaces and tests.
    

### 8.2 Official Plugin Runtime

For reviewed official plugins.

Characteristics:

- Shared official plugin environment where dependencies are compatible.
    
- Controlled host API access.
    
- Explicit resource and permission policies.
    
- Version and dependency tracking.
    

In-process execution is permitted only when the trust and operational requirements justify it.

### 8.3 Third-party Plugin Runtime

Third-party plugins are isolated by default.

Characteristics:

- Dedicated subprocess.
    
- Plugin-specific Python environment.
    
- Explicit host communication contract.
    
- Controlled dataset and artifact access.
    
- Resource limits where supported.
    
- Failure containment.
    
- Lifecycle management.
    

A subprocess is an execution boundary, not a complete security sandbox.

Strong isolation requires appropriate operating-system mechanisms, such as restricted users, filesystem permissions, process limits, and platform-specific sandboxing where available.

### 8.4 Ad-hoc Script Runtime

Ad-hoc scripts are treated as untrusted code.

They should:

- Run in an isolated subprocess.
    
- Use a declared input/output contract.
    
- Receive only explicitly granted capabilities.
    
- Have execution time and resource limits where enforceable.
    
- Produce structured results.
    
- Be recorded as reproducible execution artifacts.
    

Arbitrary script execution must never be silently promoted to trusted in-process execution.

## 9. Python Environment Management

EDA Workbench uses multiple Python environments.

|Environment|Purpose|
|---|---|
|Core|Platform runtime and core dependencies|
|Official Shared|Compatible official plugin dependencies|
|Isolated Plugin|Third-party plugin-specific dependencies|
|Script Environment|User-provided script dependencies|

### 9.1 Dependency Isolation

- Core dependencies must not be changed by installing third-party plugins.
    
- Plugin dependency conflicts must not break the application environment.
    
- Shared environments are used only when dependency compatibility is established.
    
- Plugin-specific environments use independent lockfiles.
    
- Environment creation and dependency installation are managed by the platform.
    

### 9.2 Environment Fingerprints

Record:

- Python version.
    
- Platform API version.
    
- Plugin SDK version.
    
- Dependency lockfile hash.
    
- Relevant package versions.
    
- Runtime configuration.
    

This information supports reproducibility and debugging.

## 10. Plugin Data Exchange

Plugin communication uses a hybrid data exchange model.

|Data Size / Use Case|Exchange Method|
|---|---|
|Metadata and configuration|JSON|
|Small/medium tabular data|Arrow IPC|
|Large datasets|Controlled dataset reference|
|Analytical query|DuckDB pushdown|
|Large outputs|Artifact reference|
|Execution status|Typed events|

### 10.1 Controlled Dataset References

A dataset reference must not expose unrestricted filesystem access.

It should identify:

- Dataset ID.
    
- Snapshot ID.
    
- Schema version.
    
- Authorized columns or partitions.
    
- Access mode.
    
- Permission context.
    

The host validates the reference before fulfilling data access.

### 10.2 Data Access Modes

Capabilities may distinguish:

- Metadata read.
    
- Column/schema read.
    
- Data preview.
    
- Bounded row access.
    
- Full dataset read.
    
- Transformation output.
    
- Artifact creation.
    

Access should be scoped to the minimum necessary data.

## 11. Capability and Permission Model

Plugin permissions use an explicit, resource- and operation-scoped capability model. A capability declaration describes what a plugin requests; it does not itself grant authority. Authorization is decided and enforced by trusted application services in accordance with the application-wide authorization foundation in Doc11 §7 (SEC-004).

### 11.1 Capability Examples

|Capability|Description|
|---|---|
|`dataset.metadata.read`|Read authorized dataset metadata|
|`dataset.preview.read`|Read a bounded, authorized preview|
|`dataset.read`|Read dataset content within an explicit scope|
|`artifact.create`|Create an artifact through the approved artifact service|
|`artifact.read`|Read authorized artifacts|
|`transformation.propose`|Propose a transformation without executing it|
|`transformation.execute`|Execute an authorized transformation through the approved pipeline|
|`network.access`|Request outbound network access subject to destination policy|
|`filesystem.read`|Read explicitly authorized filesystem locations, where supported|
|`filesystem.write`|Write explicitly authorized filesystem locations, where supported|
|`ai.provider.use`|Use an AI provider through an authorized host service|

This list is illustrative, not a finalized capability taxonomy. Each capability exposed by an implementation must identify the protected resource category and permitted operation precisely enough for authorization to evaluate both. Broad labels must not be treated as blanket access to every resource or operation.

### 11.2 Capability Declaration and Grant

1. A plugin declares its required capabilities in its manifest before activation.
2. The platform validates the declaration against capabilities supported by the host and the plugin's declared extension points.
3. The platform presents the requested access and its scope for review through the applicable permission experience.
4. Only an explicit grant authorizes the requested scope. A declaration, installation, publisher signature, or UI contribution is not a grant.
5. The platform records the granted capability and its resource scope. Requested and granted capabilities remain distinguishable.
6. The host evaluates authorization for every protected operation at the trusted application/service boundary.
7. A user or authorized administrator may revoke a grant in accordance with application policy.
8. Revocation takes effect for new authorization decisions immediately after the authoritative grant state changes. Handling of already queued or running work follows §11.5.

### 11.3 Scope Semantics and Least Privilege

A grant is limited to the minimum resource and operation scope required. Scopes may include application, project, dataset, snapshot, execution, resource category, or a narrower supported resource identifier. A grant for one project, dataset, or operation does not implicitly authorize another. No privilege is inherited merely because two resources share a category or because a plugin has access to a related resource.

The following semantic rules apply regardless of the eventual manifest or policy representation:

- **Canonical resource identity:** authorization is evaluated against the canonical identity of the target resource, not a display name, user-supplied label, path fragment, or unvalidated alias.
- **Explicit operation:** each grant identifies the permitted operation or a documented operation set. Read, create, update, delete, execute, publish, and network access are distinct actions unless an approved contract explicitly defines otherwise.
- **Exact scope matching:** a grant applies only to the resource(s) and operation(s) it names. Parent scope does not automatically imply access to every child resource; child scope does not imply access to its parent or siblings.
- **No implicit wildcard:** omitted scope, empty scope, unknown scope, malformed scope, and wildcard-like values do not broaden access. Any future wildcard semantics require an explicit, separately reviewed contract and must remain least-privilege.
- **Unresolvable identity:** if a resource identifier cannot be resolved unambiguously to an authorized canonical resource, the request is denied.
- **Scope changes:** moving, replacing, cloning, or otherwise changing a resource identity does not silently transfer a grant. The host must re-evaluate authorization against the resulting canonical resource.
- **Compound requests:** each protected resource/operation pair in a multi-resource request must be authorized. Partial success is allowed only where the operation contract explicitly defines safe partial behavior; otherwise the request is denied as a whole.

The canonical scope schema, serialization, and identifier format remain implementation-contract work and are not selected by this document.

### 11.4 Enforcement and Failure Behavior

- Authorization is enforced by trusted host/application services, not solely by plugin UI, client-side checks, or manifest declarations.
- Every protected plugin operation must pass through the authorization boundary defined by SEC-004. Alternate IPC, service, filesystem, or network paths must not bypass that boundary.
- Outbound network requests additionally comply with Doc11 §13 (SEC-011), including destination validation; `network.access` is not unrestricted internet access.
- UI extension registration does not confer authority to invoke domain services or access protected data.
- Unspecified, ungranted, expired, revoked, unresolved, malformed, or out-of-scope capabilities are denied by default.
- If authorization or capability-policy evaluation cannot be completed reliably, the protected operation fails closed. The plugin must not continue as though access were granted.
- Security-relevant grants, denials, revocations, and enforcement outcomes are recorded through the security audit mechanism in Doc11 §14 (SEC-012), with correlation to plugin execution provenance where applicable.

### 11.5 Revocation and In-Flight Work

Revocation must prevent new protected operations from being admitted under the revoked grant. The host must apply the following stage-aware behavior:

|Work state when revocation takes effect|Required behavior|
|---|---|
|Not submitted / not admitted|Deny the operation.|
|Queued but not started|Remove or invalidate the queued operation; do not start it under the revoked grant.|
|Running, with safe cancellation support|Request cancellation, stop further protected actions, and record the cancellation outcome.|
|Running, not safely cancellable|Do not authorize additional protected actions. The operation may reach only a safe stopping point; it must not publish, commit, or expose protected outputs without a fresh authorization check.|
|At commit, publish, or other externally visible side-effect boundary|Re-authorize against current grant state immediately before the side effect. If authorization is absent or cannot be established, deny the side effect and preserve a safe, traceable outcome.|

A stale UI state or cached grant must never override the authoritative grant state. The host must define how revocation is propagated to active executions and must prevent a revoked plugin from starting follow-on work. Any safe completion exception must be explicitly defined by the operation contract, bounded to the minimum necessary action, and auditable; it must not be treated as continuing authorization.

### 11.6 Verification Requirements

Verification must include positive and negative tests for resource/operation scope, canonical identity resolution, default-deny behavior, implicit wildcard rejection, parent/child and sibling resource boundaries, compound requests, alternate-path bypass attempts, revocation at each work stage, authorization-service failure, and correlation of security-relevant decisions. The final capability catalogue, permission UI, policy engine, scope serialization, and sandbox implementation remain deferred decisions; this section does not select them.

## 12. Plugin Lifecycle

### 12.1 Lifecycle States

```
Discovered
    |
    v
Installed
    |
    v
Validated
    |
    v
Permission Pending
    |
    v
Ready
    |
    v
Active
    |
    +----> Disabled
    |
    +----> Failed
    |
    +----> Quarantined
    |
    +----> Uninstalled
```

### 12.2 Lifecycle Operations

- Discover.
    
- Install.
    
- Validate.
    
- Configure.
    
- Grant permissions.
    
- Activate.
    
- Deactivate.
    
- Update.
    
- Roll back.
    
- Quarantine.
    
- Uninstall.
    

### 12.3 Failure Handling

Plugin failure must not compromise core application stability.

On failure:

- Capture structured error information.
    
- Mark the relevant execution failed.
    
- Preserve successful independent work.
    
- Prevent invalid output publication.
    
- Release runtime resources.
    
- Quarantine when repeated failures or security indicators justify it.
    

A plugin crash must not automatically mark the entire application unavailable.

## 13. Plugin Execution and Reproducibility

Each plugin execution attempt must have a traceable execution record. The record supports reproducibility, operational investigation, and correlation with the security audit trail. Plugin execution provenance is distinct from the security audit event stream: the records serve different purposes and are correlated rather than merged.

### 13.1 Required Execution Record

|Field group|Required information|
|---|---|
|Execution identity|Unique plugin execution ID for each attempt; correlation/trace ID where available|
|Plugin identity|Plugin ID, version, extension ID, publisher identity|
|Trust evidence|Package/signature verification result, signer identity or key reference, verification time; record unavailable/not-applicable states explicitly|
|Actor context|Initiating actor/principal and a privacy-preserving session reference|
|Execution context|Execution timestamp, environment fingerprint, execution mode, entry point, SDK/API version|
|Authorization|Requested capabilities, granted capabilities, resource/operation scopes, policy decision and enforcement outcome|
|Input lineage|Input dataset, snapshot, configuration, and artifact references; avoid copying raw sensitive data into the record|
|Result|Success, failure, cancellation, rejection, or other defined terminal outcome; safe error classification|
|Output lineage|Output artifact references and links to the applicable lineage records|
|Integrity and persistence|Record integrity/tamper-detection evidence; record creation, durable-commit, retry, and persistence-failure outcome|

### 13.2 Recording and Correlation Requirements

- Generate a unique execution ID for every execution attempt, including attempts rejected before plugin code runs when the attempt is security-relevant. Retries of the same persistence operation retain the execution ID; a new plugin execution attempt receives a new execution ID.
- Preserve correlation identifiers across the host request, plugin execution, resulting job/artifacts, and related SEC-012 security audit events where the relevant systems support correlation.
- Record requested capabilities separately from granted capabilities. Record the policy decision and the actual enforcement outcome separately; a request or grant alone does not prove that an operation occurred.
- Attribute execution to the initiating actor/principal. Where a background or system-initiated execution has no interactive actor, record the responsible system identity and initiation context rather than inventing a user.
- Capture publisher/signature verification evidence as a verification result and signer reference. Never store private signing keys, credentials, access tokens, or other secrets in provenance.

- Record input and output references sufficient to trace lineage without duplicating full dataset contents, secrets, or unnecessary personal data.
- Record success, failure, cancellation, rejection, and safe error classification. Do not expose sensitive implementation details in user-facing errors or broadly accessible records.
- Protect provenance records against unauthorized access and modification. Integrity controls must make unauthorized alteration detectable; the concrete mechanism remains a deferred implementation decision.

### 13.2.1 Package Trust and Signature Outcomes

Package verification outcomes must be explicit and must not be collapsed into a generic “trusted” flag:

|Verification outcome|Required activation treatment|
|---|---|
|Valid signature and signer accepted by applicable trust policy|May proceed to the remaining compatibility, capability, and authorization checks; a valid signature is not proof that the plugin is safe.|
|Invalid signature, integrity mismatch, or signer known to be revoked|Reject activation. Do not execute plugin code.|
|Unsigned package|Do not treat as verified or trusted. Activation is denied by default unless an explicit distribution/trust policy defines a controlled exception with clear user/admin disclosure, restricted capabilities, and an auditable decision.|
|Signature status unavailable or cannot be verified|Treat as unverifiable, not valid. Deny activation by default; any exception must be explicit, risk-bounded, and auditable under the applicable trust policy.|
|Signature not applicable for a defined package class|Record not-applicable and the reason; apply that package class's separately defined trust policy. Do not imply signature verification occurred.|

Trust policy must distinguish package source/distribution class where relevant and must define the decision owner, user-facing status, and audit evidence for any exception. A package's source location alone does not establish trust. Signing infrastructure, certificate/key technology, revocation feed, and marketplace governance remain deferred.

### 13.2.2 Shared Provenance Envelope — Common Conceptual Fields

Plugin and AI execution provenance use a shared conceptual envelope so records can be correlated consistently. This is a semantic contract, not a prescribed serialized schema, storage model, event format, or implementation technology. The common field groups are:

|Common field group|Meaning|
|---|---|
|Record identity|Stable identifier for the provenance record; domain execution identity remains unique for each plugin attempt or AI task/execution as defined by its owning document.|
|Actor/principal|Initiating user, service, or system principal attributable to the operation; do not fabricate an interactive user for system-initiated work.|
|Session/context reference|Privacy-preserving reference to the relevant session or execution context, when applicable.|
|Timestamp|Relevant event time(s), with the time representation defined by the owning contract.|
|Correlation identifiers|Request, job, task, artifact, and related security-audit correlation identifiers where applicable.|
|Resource references|Stable references to relevant projects, datasets, snapshots, artifacts, targets, or other resources; avoid duplicating raw sensitive payloads.|
|Outcome|Explicit operation/execution outcome, distinguishing policy decision from actual enforcement or execution result.|
|Integrity evidence|Information needed to detect or investigate unauthorized alteration, using the mechanism selected by implementation governance.|

The envelope does not collapse plugin provenance, AI provenance, and security audit into one record. Each domain document owns its domain-specific fields, lifecycle, durability requirements, access rules, and failure semantics. SEC-012 remains the canonical security audit responsibility and is correlated with, but does not replace, either provenance record.

### 13.3 Provenance Durability and Failure Semantics

The execution record has a defined durability boundary: for an execution class that requires provenance before code execution, the host must obtain confirmation that the initial execution record has been durably committed before starting plugin code. A record held only in volatile memory or an unconfirmed buffer does not satisfy this boundary.

- **Before execution:** if required initial provenance cannot be durably committed, do not start the plugin execution. Return a safe failure state and retain whatever failure evidence can be recorded once persistence is available.
- **During execution:** update the record with terminal outcome and lineage. Do not represent an execution as fully auditable until required terminal provenance is durably committed.
- **Persistence retry:** retrying persistence for the same execution attempt must be idempotent and must not create a second execution identity or falsely imply that plugin code ran twice.
- **Persistence outage after start:** stop admitting new executions that require the unavailable provenance path. For an already running execution, prevent additional privileged or externally visible side effects where the required audit/provenance evidence cannot be secured; move the execution to a safe, traceable failure or interrupted state according to its operation contract.
- **Recovery:** after persistence becomes available, reconcile pending records using the original execution ID and correlation context. Do not fabricate missing fields or infer success from the absence of a failure record.
- **Security-critical paths:** fail safely when required provenance cannot be established. Any narrowly scoped exception must be explicitly authorized by the applicable security policy, risk-bounded, and separately auditable.

The exact storage system, transaction mechanism, retry schedule, immutable-storage technology, and retention duration remain deferred implementation decisions. This section defines the required observable semantics, not a technology choice.

### 13.4 Reproducibility and Artifact Lineage

Plugin outputs follow the same artifact identity, lineage, and publication rules as built-in operations. Plugins cannot bypass the Transformation Pipeline or approved artifact publication mechanisms. The execution record captures the plugin and environment versions and the references/configuration needed to interpret the result; it does not guarantee bit-for-bit reproducibility when external state, nondeterminism, or unavailable dependencies prevent it. Such limitations must be represented rather than implying reproducibility that has not been established.

### 13.5 Relationship to Security Audit

Plugin execution provenance (PLG-012) records the execution context and lineage. Security audit (SEC-012) records security-relevant actions and policy/enforcement outcomes. The two records share correlation and identity vocabulary where applicable, but neither replaces the other. Provenance must not become a substitute for the authoritative security audit trail.

## 14. Plugin Marketplace and Distribution

### 14.1 Distribution Channels

- Built-in plugins.
    
- Official marketplace.
    
- Public third-party marketplace.
    
- Private organizational repository.
    
- Local plugin packages.
    

### 14.2 Package Validation

Before installation:

- Validate package structure.
    
- Validate manifest.
    
- Verify package integrity.
    
- Verify publisher signature where available.
    
- Check compatibility.
    
- Inspect declared dependencies.
    
- Evaluate requested capabilities.
    
- Warn about untrusted publishers.
    

A valid signature confirms package identity and integrity, not safety.

### 14.3 Update Strategy

Plugin updates must:

- Display version changes.
    
- Check compatibility.
    
- Review permission changes.
    
- Preserve previous version information.
    
- Support rollback where technically feasible.
    
- Avoid silently changing active project behavior.
    

Existing artifacts remain linked to the plugin version that generated them.

## 15. Frontend Plugin Integration

Plugins may contribute UI capabilities only through host-controlled, registered extension points. The host owns the extension-point registry and controls validation, registration, activation, mounting, monitoring, deactivation, and cleanup. A plugin contribution is a presentation/integration capability; it does not grant authority to invoke protected domain operations.

Examples include:

- Custom analysis configuration panels.
- Additional result renderers.
- Custom chart types.
- Additional workflow steps.
- Plugin settings pages.

### 15.1 Controlled UI Extension Lifecycle

1. **Discover and register:** discover the declared contribution and validate its manifest, extension-point identifier, and required contract metadata against the host registry.
2. **Validate compatibility and capabilities:** check the supported extension API/schema version and confirm that the plugin is eligible for the requested contribution. Capability declarations and grants are evaluated independently; registration does not grant protected-operation permissions.
3. **Activate and mount:** activate only approved contributions in the designated host-controlled slot and through the supported extension contract.
4. **Monitor and contain failures:** detect rendering, lifecycle, and contract failures; contain them so that a plugin contribution does not destabilize unrelated host UI or compromise host security.
5. **Deactivate and clean up:** remove the contribution, release subscriptions/resources, and prevent further contribution activity. Cleanup must be safe when activation was only partially completed.

### 15.2 Host and Plugin Responsibilities

- Core navigation and the extension-point registry remain platform-controlled.
- Plugins may contribute only to explicitly registered extension points; arbitrary modification of host screens or navigation is not permitted.
- The host validates extension identifiers, API/schema compatibility, and contribution contracts before activation and when compatibility changes.
- Plugin UI runs within the controlled extension host. Direct Python bridge access and direct access to internal application modules are not permitted.
- Backend communication uses approved typed contracts and controlled host services.
- Any protected operation requested by UI code is independently authorized under PLG-011 and SEC-004. Hiding or disabling a UI control is not an authorization control.
- A UI contribution cannot independently grant dataset, artifact, filesystem, network, AI, or other domain-service authority.
- Contributions follow the host design-system/token contract (Doc07) and UX/accessibility requirements (Doc08), including WCAG 2.2 AA.

### 15.3 Failure Containment and Measurable Acceptance Criteria

The host must isolate plugin-contribution failures from unrelated application UI and maintain a safe recovery path. For every supported extension contribution type, verification must demonstrate the following observable outcomes:

1. **Host availability:** a plugin render, lifecycle, or contract failure does not crash or permanently block the host shell, core navigation, or unrelated non-plugin UI.
2. **Contribution containment:** the failing contribution can be disabled or removed without requiring a full application restart, unless a documented platform limitation makes restart necessary for safe recovery.
3. **Privileged API boundary:** plugin UI cannot directly access internal application modules, privileged bridges, or protected services outside approved typed host contracts. Protected operations still pass through PLG-011 and SEC-004.
4. **Subscription and resource cleanup:** deactivation releases registered event subscriptions, listeners, timers, and host-managed resources; repeated activation/deactivation does not accumulate duplicate contributions or callbacks.
5. **Partial initialization:** if mounting fails partway through, the host rolls back completed registration steps and leaves the surrounding UI in a safe, usable state.
6. **Compatibility failure:** an unsupported or invalid extension API/schema version is not mounted; the host presents a safe, actionable status without weakening security checks.
7. **Recovery visibility:** the host records a safe failure classification and exposes sufficient status for the user or operator to identify, disable, or retry the contribution without exposing secrets.

“Isolation” in this section means the observable containment outcomes above; it does not claim that a UI component boundary alone is a process or OS security sandbox. The implementation must not treat rendering isolation as a substitute for backend authorization or runtime isolation.

### 15.4 Verification Requirements

Tests must cover invalid/unregistered extension points, incompatible API/schema versions, unauthorized protected operations initiated from plugin UI, activation/deactivation and cleanup, partial initialization, host availability, contribution removal, subscription/resource cleanup, repeated lifecycle operations, and failure recovery. Accessibility and design-system conformance must be evaluated for each supported contribution type.

For MVP, plugin UI contributions remain limited to controlled React extension components and predefined slots. Arbitrary remote HTML/JavaScript injection is not supported. The final extension-slot catalogue, UI extension API, and framework-level implementation remain deferred decisions.

## 16. Plugin Observability

The platform records:

- Installation and update activity.
    
- Activation and deactivation.
    
- Permission grants and revocations.
    
- Runtime health.
    
- Execution duration.
    
- Resource usage where available.
    
- Failure rates.
    
- Dependency conflicts.
    
- Security and compatibility warnings.
    

Logs must follow privacy and data-classification policies.

Raw dataset contents and credentials must not be included in plugin logs.

## 17. Plugin Testing and Quality Assurance

|Test Level|Focus|
|---|---|
|Contract tests|SDK compliance|
|Unit tests|Plugin business logic|
|Integration tests|Host API and data exchange|
|Compatibility tests|Platform API and Python versions|
|Isolation tests|Process and permission boundaries|
|Resource tests|Memory, CPU, execution limits|
|Failure tests|Crash and timeout containment|
|Security tests|Unauthorized access and malicious inputs|
|Reproducibility tests|Environment and output consistency|

Official plugins should pass platform-defined compatibility and security checks before release.

Third-party plugins should display their trust and verification status clearly.

## 18. MVP Scope

### Included

- Formal plugin manifest.
    
- Plugin SDK and core contracts.
    
- Extension registry.
    
- Built-in extension support.
    
- Python SDK for external plugins.
    
- Isolated subprocess execution.
    
- Plugin-specific environments.
    
- Capability declaration and permission checks.
    
- Controlled dataset and artifact references.
    
- Plugin lifecycle management.
    
- Execution provenance.
    
- Local plugin installation.
    

### Deferred

- Public marketplace infrastructure.
    
- Private organization marketplace.
    
- Automated plugin review pipeline.
    
- Advanced OS sandbox implementation for every supported platform.
    
- Rich third-party frontend extension framework.
    
- Remote plugin execution.
    
- Multi-language plugin SDKs.
    

## 19. Key Architecture Decisions

|ID|Decision|Status|
|---|---|---|
|PLG-001|Hybrid formal plugins + ad-hoc scripts|Confirmed|
|PLG-002|Formal SDK and extension contracts|Confirmed|
|PLG-003|Built-in trusted extensions may run in-process|Confirmed|
|PLG-004|Third-party plugins isolated by default|Confirmed|
|PLG-005|Subprocess alone is not a complete sandbox|Confirmed|
|PLG-006|Hybrid JSON, Arrow, dataset references, and DuckDB exchange|Confirmed|
|PLG-007|Core, shared official, and isolated plugin environments|Confirmed|
|PLG-008|Hybrid local, official, public, and private distribution|Confirmed|
|PLG-009|Signatures establish identity/integrity, not safety|Confirmed|
|PLG-010|Python SDK is the MVP extension SDK|Confirmed|
|PLG-011|Resource- and operation-scoped capability authorization with default deny and trusted host enforcement|Proposed — PO revision direction approved; verification and ratification pending|
|PLG-012|Plugin execution provenance with unique attempt identity, actor attribution, authorization evidence, lineage, and integrity|Proposed — PO revision direction approved; verification and ratification pending|
|PLG-013|Host-controlled frontend extension-point lifecycle with compatibility, capability separation, and failure containment|Proposed — PO revision direction approved; verification and ratification pending|

## 20. Deferred Decisions

- Exact plugin package format.
    
- Final manifest schema.
    
- SDK packaging and release strategy.
    
- Plugin signing infrastructure.
    
- Marketplace governance.
    
- Exact OS sandbox implementation per platform.
    
- Resource quotas per plugin type.
    
- Plugin update and rollback UX.
    
- Plugin UI extension API.
    
- Future Rust/WASM/external-service SDKs.
    

## 21. Traceability

|Related Document|Relationship|
|---|---|
|01 — Product Vision & Requirements|Extensibility requirements|
|02 — System Architecture|Modular monolith and runtime|
|03 — Domain Model|Plugin and extension ownership|
|04 — Data & Persistence Architecture|Dataset and artifact references|
|05 — Processing & Execution Architecture|Job execution and isolation|
|06 — Application & IPC Architecture|Typed communication contracts and trusted host-service boundary|
|07 — Frontend Architecture|Plugin UI integration, host design-system/token contract, and frontend isolation boundaries|
|08 — UX & Interaction Architecture|Permission, lifecycle, progressive-disclosure, and accessibility interactions|
|11 — Security, Privacy & Threat Model|SEC-004 authorization foundation; SEC-011 outbound network controls; SEC-012 security audit; data classification, privacy, and retention requirements|
|09 — Plugin & Extension Architecture|Extension ecosystem|

## 22. Completion Criteria

Dokumen ini dianggap lengkap apabila:

- Extension types dan sources didefinisikan.
- Plugin manifest dan SDK boundaries tersedia.
- Extension registry dan lifecycle jelas.
- Runtime isolation strategy ditetapkan.
- Python environment management dirancang.
- Data exchange dan access permissions terdefinisi, termasuk resource identity, operation scope, dan revocation semantics.
- Plugin execution provenance memiliki identity, actor, lineage, integrity, dan durability/failure semantics.
- Plugin UI lifecycle memiliki compatibility checks, measurable failure-containment criteria, dan cleanup behavior.
- Distribution dan signature trust model jelas.
- MVP dan deferred capabilities dipisahkan.
- Cross-document security, frontend, UX, and AI provenance contracts telah direkonsiliasi dengan source owners.

## 23. Revision History

|Version|Status|Changes|Decision state|
|---|---|---|---|
|0.1|Draft|Initial plugin and extension architecture baseline.|Baseline; not final ratification.|
|0.2|Draft for Review|Expanded PLG-011 capability enforcement and revocation; PLG-012 execution provenance and audit correlation; PLG-013 controlled UI extension lifecycle; updated cross-document traceability and deferred decisions.|PO revision directions approved; verification, source-owner review, and ratification pending.|
|0.4|Draft for Review|Added conceptual Shared Provenance Envelope common field groups and explicit ownership boundary with AI provenance and SEC-012.|
|0.3|Draft for Review|Targeted clarifications for F-01–F-05: canonical resource/scope semantics and wildcard handling; stage-aware revocation; trust/signature outcome policy; provenance durability and persistence failure behavior; measurable UI failure-containment criteria.|PLG-011, PLG-012, and PLG-013 remain Proposed; verification, source-owner review, and ratification pending.|

## 24. Revision and Verification Notes

Version 0.3 is a targeted clarification revision responding to WP-02 verification findings F-01 through F-05. It clarifies semantic and observable requirements without selecting implementation technologies that remain deferred.

PLG-011, PLG-012, and PLG-013 remain **Proposed — PO revision direction approved; verification and ratification pending**. This revision does not convert them to Approved/Confirmed and does not assert that implementation, automated, runtime, integration, accessibility, or security tests have passed.

The following implementation choices remain intentionally unselected: capability taxonomy and final permission UI; canonical scope serialization and identifier format; policy engine; signing infrastructure and package-verification technology; sandbox implementation; provenance database, transaction mechanism, immutable-storage technology, retry schedule, and retention duration; plugin UI extension API and framework-level isolation mechanism.

The WP-02 v0.2 static-content verification result was Pass with Follow-up. Version 0.3 addresses the document-clarification aspects of F-01–F-05. The findings are not considered technically closed until the specified contracts are implemented where applicable, evidence is produced, and verification is repeated. Cross-document reconciliation remains required with Doc11 (SEC-004, SEC-011, SEC-012), Doc07 (frontend design-system/token contract), Doc08 (UX and accessibility), and Doc10 (shared provenance vocabulary and identifier relationships for AI-014). Final status changes require source-owner review and explicit PO ratification under the project documentation status model.

