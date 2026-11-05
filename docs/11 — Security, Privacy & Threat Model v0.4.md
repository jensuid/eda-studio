# 11 — Security, Privacy & Threat Model

**Project:** EDA Workbench  
**Document:** 11 — Security, Privacy & Threat Model  
**Version:** 0.4  
**Status:** Draft for Review — Revised for Review (WP-16)  
**Depends on:** Documents 01–10

---

## 1. Purpose

Dokumen ini mendefinisikan security architecture, privacy controls, dan threat model untuk EDA Workbench.

Karena aplikasi memproses data analitis yang dapat mengandung confidential business information, PII, dan restricted datasets, security harus menjadi bagian dari setiap architectural boundary.

Tujuan:

- Melindungi project dan dataset pengguna.
    
- Mencegah unauthorized access.
    
- Mengisolasi third-party plugins dan scripts.
    
- Melindungi PyWebView bridge.
    
- Mengontrol akses filesystem dan network.
    
- Mengamankan AI context dan cloud transmission.
    
- Menjaga integrity dan confidentiality artifacts.
    
- Mendeteksi dan menangani security incidents.
    
- Mendukung audit, recovery, dan reproducibility.
    

## 2. Security Principles

|Principle|Description|
|---|---|
|Local-first privacy|Data tetap lokal secara default|
|Defense in depth|Security tidak bergantung pada satu control|
|Least privilege|Akses minimum yang diperlukan|
|Default deny|Akses ditolak kecuali secara eksplisit diizinkan|
|Zero implicit trust|Input dan extension tidak otomatis dipercaya|
|Explicit consent|External data transmission memerlukan authorization|
|Secure by boundary|Setiap architectural boundary memvalidasi akses|
|Data minimization|Hindari transfer dan penyimpanan data berlebihan|
|Immutable evidence|Execution dan provenance records dilindungi|
|Recoverability|Sistem dapat pulih dari kegagalan dan integrity issues|

## 3. Security Scope and Assets

### 3.1 Protected Assets

|Asset|Security Concern|
|---|---|
|Project metadata|Confidentiality and integrity|
|Original datasets|Confidentiality and integrity|
|Dataset snapshots|Integrity and access control|
|Transformation history|Integrity and reproducibility|
|Analysis artifacts|Integrity and confidentiality|
|Findings and reports|Confidentiality and integrity|
|AI prompts/context|Data leakage|
|Credentials and tokens|Secret exposure|
|Plugin packages|Supply-chain compromise|
|Python environments|Dependency compromise|
|IPC bridge|Unauthorized invocation|
|Application configuration|Tampering|
|Audit logs|Integrity and privacy|

### 3.2 Security Boundaries

Security boundaries include:

1. Frontend ↔ PyWebView bridge.
    
2. PyWebView host ↔ Python application.
    
3. Application ↔ persistence.
    
4. Application ↔ analytical execution workers.
    
5. Core application ↔ plugins.
    
6. Application ↔ local AI runtime.
    
7. Application ↔ cloud AI providers.
    
8. Application ↔ external connectors.
    
9. Application ↔ filesystem and OS resources.
    

Setiap boundary memiliki validation, authorization, dan failure-handling requirements.

## 4. Threat Model

EDA Workbench menggunakan STRIDE sebagai dasar threat classification.

### 4.1 STRIDE Categories

|Threat|Description|Example|
|---|---|---|
|Spoofing|Impersonating a trusted identity|Malicious plugin impersonates official plugin|
|Tampering|Unauthorized modification|Altering snapshot metadata|
|Repudiation|Denying an action occurred|Plugin denies destructive operation|
|Information Disclosure|Unauthorized data exposure|Dataset sent to unauthorized AI provider|
|Denial of Service|Resource exhaustion|Plugin consumes all available memory|
|Elevation of Privilege|Gaining unauthorized access|Web content invokes privileged bridge|

### 4.2 Threat Actors

Potential threat actors:

- Malicious or compromised plugins.
    
- Malicious imported files.
    
- Compromised external dependencies.
    
- Malicious or compromised AI providers.
    
- Malicious websites loaded accidentally into WebView.
    
- Local processes with access to application files.
    
- Users unintentionally granting excessive permissions.
    
- Accidental application misuse.
    

The primary security focus is protecting local project data and preventing untrusted extensions or content from crossing privileged boundaries.

## 5. Trust Zones

The system uses explicit trust zones.

```
┌──────────────────────────────────────────────┐
│              Trusted Application             │
│                                              │
│  React UI                                    │
│  PyWebView Host                              │
│  Python Core                                 │
│  Domain / Application Services               │
│  Persistence Layer                           │
└──────────────────────┬───────────────────────┘
                       |
                Controlled APIs
                       |
        ┌──────────────┼───────────────┐
        v              v               v
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Isolated     │ │ Local AI     │ │ External     │
│ Plugins      │ │ Runtime      │ │ Providers    │
└──────────────┘ └──────────────┘ └──────────────┘
        |
        v
┌──────────────────────────────────────────────┐
│          Untrusted External Content          │
│ Files │ Dataset Values │ Documents │ Web Data │
└──────────────────────────────────────────────┘
```

Trust is not inherited automatically across boundaries.

## 6. PyWebView and Frontend Security

### 6.1 Bridge Protection

The PyWebView bridge is a privileged interface and must expose a narrow API.

Requirements:

- Only explicit bridge methods are exposed.
    
- No arbitrary Python method invocation.
    
- No direct access to internal service objects.
    
- Every request is validated.
    
- Every operation checks authorization.
    
- Payload size and execution scope are bounded.
    
- Bridge methods do not execute heavy analytical operations.
    
- Bridge errors do not expose internal stack traces.
    

### 6.2 Trusted UI Origin

The privileged bridge must only be available to the trusted bundled frontend.

Production requirements:

- Load frontend assets through the controlled PyWebView internal server.
    
- Do not use arbitrary external websites as privileged application content.
    
- Restrict navigation to approved application resources.
    
- Open external links in the system browser.
    
- Prevent untrusted content from accessing the bridge.
    
- Treat development mode as a separate trusted local development environment.
    

### 6.3 Content Security Policy

Production frontend should use a restrictive Content Security Policy.

Policy should:

- Restrict script sources.
    
- Restrict object sources.
    
- Restrict external connections.
    
- Restrict frame embedding.
    
- Avoid unsafe dynamic script execution.
    
- Allow only required application resources.
    

Exact directives must be validated against the selected PyWebView deployment model.

### 6.4 Frontend Security

- No credentials or secrets in frontend code.
    
- No arbitrary `eval` or dynamic code execution.
    
- No unsafe HTML rendering of imported content.
    
- Validate URLs before privileged operations.
    
- Use typed IPC contracts.
    
- Treat backend response data as untrusted for rendering purposes.
    

## 7. Application and IPC Security

Every command and query is a security boundary. All protected operations must pass through the trusted application/service boundary before execution.

Required controls:

1. Schema validation and typed request contracts.
2. Command and operation allowlisting.
3. Authorization for the requested actor, action, resource, and context.
4. Project and resource ownership checks.
5. Revision and concurrency validation where applicable.
6. Resource limits and execution bounds.
7. Path and reference validation.
8. Security audit recording for security-relevant decisions and outcomes.

### 7.1 Authorization Model

The application uses capability-based and resource-level authorization. The authorization model applies across frontend IPC, application services, plugins, AI tools, network access, and other protected operations.

Each authorization decision must be based on trusted context sufficient to identify:

- **Actor / principal:** the user, application component, plugin, AI task, or other authenticated execution identity requesting the operation.
- **Action:** the operation being requested.
- **Resource:** the specific project, dataset, snapshot, artifact, credential, service, or other protected object.
- **Context:** relevant execution scope, session, purpose, policy state, and other attributes required by the applicable policy.

A request-supplied identifier or claim is not, by itself, proof of identity, ownership, or permission. The application must derive or validate security-relevant context through trusted application state.

Permissions must be scoped to the resource and operation required. Access to one resource must not imply access to other resources, and privileges must not be inherited implicitly across projects, datasets, snapshots, artifacts, plugins, or execution contexts.

### 7.2 Enforcement Boundary and Request Coverage

Authorization must be enforced at the trusted application or service boundary that protects the operation and resource. Frontend visibility, disabled controls, route guards, or other client-side checks may improve UX but must not be the decisive security control.

Every protected request must be checked, including requests originating from IPC, plugins, AI tools, background jobs, retries, and internal service calls that cross a trust boundary. Alternate entry points must not bypass the same authorization requirements.

The component enforcing an operation remains responsible for enforcing the applicable authorization result. A policy decision or capability token must not be treated as sufficient unless its scope, integrity, freshness, and binding to the requested action and resource are validated.

### 7.3 Default Deny and Failure Semantics

Authorization is default-deny. Access is granted only when an explicit applicable policy permits the requested actor, action, resource, and context.

If authorization information is missing, invalid, stale where freshness is required, contradictory, or unavailable, the protected operation must be denied. Failure to evaluate a mandatory policy must fail closed; the application must not silently fall back to a less restrictive path.

Denials and security-relevant authorization outcomes must be recorded through the security audit mechanism defined in §14, subject to privacy and data-minimization requirements. Audit correlation does not replace enforcement.

### 7.4 Verification Requirements

Automated tests must cover at least:

- Missing, malformed, or forged actor, action, resource, and context values.
- Cross-project and cross-resource access attempts.
- Direct invocation that bypasses frontend controls.
- Alternate IPC, plugin, AI, background-job, and retry entry points.
- Revoked or changed permissions and stale authorization context.
- Policy evaluation errors, timeouts, and unavailable authorization data.
- Confirmation that denial leaves no unauthorized partial side effect.

The specific authorization framework, policy language, policy engine, and RBAC/ABAC/ReBAC model are not selected by this document.

## 8. Plugin and Script Security

Third-party plugins and ad-hoc scripts are untrusted by default.

### 8.1 Isolation Requirements

- Dedicated subprocess execution.
    
- Plugin-specific Python environment.
    
- Explicit IPC contract.
    
- Controlled filesystem access.
    
- Controlled network access.
    
- CPU and memory limits where supported.
    
- Execution timeout and cancellation.
    
- Restricted dataset and artifact references.
    
- Structured error handling.
    

### 8.2 OS-Level Isolation

A subprocess alone is not a security sandbox.

Stronger isolation may require:

- Dedicated OS user or restricted process identity.
    
- Filesystem permissions.
    
- Resource limits.
    
- Network restrictions.
    
- Platform-specific sandbox mechanisms.
    
- Restricted environment variables.
    
- Minimal inherited handles and permissions.
    

Security guarantees must be documented separately for Windows, macOS, and Linux.

### 8.3 Plugin Supply Chain

Before installation:

- Validate package structure.
    
- Verify package integrity.
    
- Verify publisher signatures where available.
    
- Check dependency metadata.
    
- Check SDK compatibility.
    
- Review requested capabilities.
    
- Warn about unknown publishers.
    

A signed plugin is not automatically safe.

### 8.4 Plugin Quarantine

A plugin may be quarantined when:

- It violates permission boundaries.
    
- It repeatedly crashes.
    
- It produces malformed or suspicious output.
    
- Its package integrity fails verification.
    
- Security policy detects suspicious behavior.
    

Quarantine should prevent new executions while preserving relevant diagnostic evidence.

## 9. Filesystem and Storage Security

### 9.1 Project Isolation

Each project should have an isolated workspace boundary.

Requirements:

- Validate all project-relative paths.
    
- Prevent path traversal.
    
- Restrict writes to approved project locations.
    
- Prevent unauthorized cross-project references.
    
- Validate artifact and snapshot ownership.
    
- Avoid exposing arbitrary filesystem paths through IPC.
    

### 9.2 File Import Security

Imported files are untrusted inputs.

Controls:

- Validate file type and content.
    
- Apply file size limits.
    
- Avoid executing imported content.
    
- Validate archive entries before extraction.
    
- Prevent path traversal during extraction.
    
- Apply bounded parsing and resource controls.
    
- Handle malformed and oversized files safely.
    

### 9.3 Storage Integrity

- Use transactional metadata updates.
    
- Stage file operations before publication.
    
- Validate snapshots and artifact references.
    
- Use content fingerprints where appropriate.
    
- Detect missing or corrupted payloads.
    
- Provide backup and restore mechanisms.
    
- Preserve immutable originals.
    

### 9.4 Data at Rest

Sensitive project data should be protected using OS-supported storage controls and appropriate filesystem permissions.

Optional encryption-at-rest may be introduced where required by the target deployment environment.

The application must clearly distinguish:

- Application-level encryption.
    
- OS/disk-level encryption.
    
- Credential encryption.
    

Encryption guarantees depend on key management and the underlying OS.

## 10. Secrets and Credential Management

Secrets include:

- Cloud AI API keys.
    
- Database credentials.
    
- External connector tokens.
    
- Private repository credentials.
    
- Other integration credentials.
    

Requirements:

- Store secrets in OS credential storage where available.
    
- Never store plaintext secrets in project metadata.
    
- Never include secrets in logs or AI context.
    
- Do not expose secrets to plugins unless explicitly authorized and technically isolated.
    
- Redact secrets from errors and diagnostic bundles.
    
- Support credential rotation and revocation.
    
- Avoid placing secrets in command-line arguments or environment variables when safer mechanisms are available.
    

## 11. Data Privacy and Classification

### 11.1 Classification Levels

|Classification|Description|Default Handling|
|---|---|---|
|Public|Approved for public disclosure|Normal local processing|
|Internal|Internal project information|Local-first|
|Confidential|Sensitive business or analytical data|Restricted sharing|
|Restricted|Highly sensitive or regulated information|Strictest controls|

Classification may be assigned through project policy, dataset metadata, and authorized user review. The effective classification of a derived dataset, artifact, finding, or report must account for the classifications of its contributing sources and any applicable policy.

### 11.2 Classification Inheritance and Declassification

Unless an authorized policy explicitly defines a valid declassification process, a derived resource must inherit the highest applicable classification of its contributing source resources. Selecting, filtering, aggregating, transforming, or summarizing data does not automatically lower its classification.

A lower classification may be assigned only through an explicitly authorized declassification decision. That decision must identify the responsible actor, affected resource, resulting classification, applicable rationale or policy basis, and timestamp, and must be auditable. The detailed declassification authority and rules remain an open policy decision; no automatic declassification is implied.

### 11.3 PII Detection

The application may detect:

- Names.
- Email addresses.
- Phone numbers.
- Identification-like values.
- Address-like values.
- Sensitive identifiers.

Detection must account for false positives and false negatives. The system should present findings for user review rather than claiming perfect PII detection. Detection output is evidence for policy evaluation, not an authorization decision by itself.

### 11.4 Data Minimization

- Process only necessary columns and rows.
- Prefer summaries over raw records where suitable.
- Avoid storing unnecessary copies.
- Separate metadata from analytical payloads.
- Use controlled references for large datasets.
- Redact sensitive values where appropriate.

### 11.5 Cloud Transmission

Before cloud AI or other external data transmission:

1. Identify the destination provider and service.
2. Determine the effective data classification.
3. Identify the exact data and context proposed for transmission.
4. Apply minimization and applicable redaction.
5. Evaluate the applicable authorization and transmission policy.
6. Obtain explicit authorization or consent where required by policy.
7. Record the decision and relevant evidence without retaining unnecessary raw data.
8. Execute only within the approved scope.

No silent transmission is allowed. A user consent prompt does not override a policy denial or grant permissions beyond the scope presented and authorized.

## 12. AI Security

AI introduces risks from prompt injection, hallucination, tool misuse, and data leakage.

Controls:

- Treat dataset contents and imported documents as untrusted data.
    
- Separate instructions from retrieved content.
    
- Apply centralized AI Policy Engine checks.
    
- Validate generated tool calls.
    
- Restrict tool capabilities.
    
- Require approval for consequential actions.
    
- Validate numerical claims against deterministic artifacts.
    
- Do not expose secrets to model context.
    
- Do not allow AI to bypass project or plugin permissions.
    
- Record security-relevant AI decisions.
    

AI output must never be treated as a security authorization decision.

## 13. Network and External Connectivity

Network access is optional and controlled by explicit application authorization. Potential network consumers include:

- Cloud AI providers.
- Database connectors.
- Plugin repositories.
- Marketplace services.
- External data sources.
- Plugins and other application integrations.

### 13.1 Outbound Authorization

Outbound access must be denied by default. Each outbound request must be authorized for its actor or component, purpose, destination, protocol, port, and applicable execution context. A plugin's network access must be covered by its explicitly granted capability and enforced at a trusted application/service boundary; a plugin declaration or UI permission state alone is not enforcement.

Network permission must be scoped to the required destination and operation. A grant for one host or service must not implicitly authorize arbitrary destinations or protocols. Authorization must be re-evaluated when the destination, redirect target, purpose, or relevant policy context changes.

### 13.2 Destination Validation and SSRF Protection

Before establishing an outbound connection, validate the destination URL and its components, including scheme, hostname, port, and resolved IP addresses. Reject malformed or unsupported schemes and destinations prohibited by policy.

Destination controls must prevent unauthorized access to loopback, private, link-local, multicast, unspecified, reserved, and other internal or sensitive address ranges, including cloud or service metadata endpoints, unless an explicitly approved application use case requires them.

DNS resolution must not create a time-of-check/time-of-use gap. The connection must use an address that has been validated under the applicable destination policy; a second unvalidated DNS resolution must not be allowed to change the actual connection target. Validate all relevant A and AAAA results and apply policy to retries and fallback connections.

Automatic redirects must not bypass destination authorization. Either redirects are disabled for the relevant request or each redirect hop is parsed, resolved, validated, and authorized before the next connection is made. Changes in scheme, host, port, or resolved address require revalidation.

### 13.3 Transport and Request Limits

- External connections must use secure transport appropriate to the protocol.
- TLS certificates and host identity must be validated; certificate errors must not be silently ignored.
- Apply connection and response timeouts.
- Apply response-size and resource limits.
- Avoid leaking local filesystem paths, credentials, project identifiers, or project data through unnecessary requests.
- Do not forward credentials or authorization headers across a redirect to a different origin unless explicitly authorized and safe.

### 13.4 Failure Handling and Audit

If destination parsing, DNS resolution, IP validation, policy evaluation, TLS validation, or redirect validation fails, the connection must not proceed. The application must fail closed rather than retrying through a less restrictive path.

Record security-relevant outbound authorization decisions and outcomes, including sufficient destination and correlation information for investigation, while avoiding secrets, sensitive query values, and unnecessary personal or project data. Correlate relevant plugin or AI activity with the security audit model in §14.

### 13.5 Verification Requirements

Automated tests must cover unauthorized hosts, prohibited IP ranges, IPv4 and IPv6 representations, DNS rebinding/time-of-check-to-time-of-use behavior, redirect chains to prohibited destinations, retries and fallback resolution, unsupported schemes, TLS validation failures, response limits, and policy evaluation failures.

This section does not select a proxy, firewall, network gateway, policy engine, destination allowlist product, or specific HTTP client implementation. It does not prohibit all internet access; permitted access remains subject to explicit policy and enforcement.

## 14. Audit and Security Logging

Security-relevant actions must produce structured audit events. Audit is a security evidence mechanism; it does not replace authorization enforcement, application provenance, or operational telemetry.

### 14.1 Audit Event Identity and Content

Each audit event must have a unique event identifier and timestamp. Where relevant, records must include:

- **Actor/principal:** attributable user, service, plugin, AI task, or component identity.
- **Action:** operation or security-relevant event.
- **Resource:** protected resource reference, using stable identifiers where available.
- **Decision:** allow, deny, not-applicable, or policy/evaluation failure as appropriate.
- **Reason/outcome:** safe, structured reason code and enforcement result.
- **Policy context:** applicable policy identifier/version or decision reference where available.
- **Correlation:** request, job, plugin execution, AI task, or export correlation identifiers as applicable.
- **Timestamp:** event time with a defined time representation.

The record must distinguish a policy decision from the actual enforcement outcome. For example, a permitted decision followed by a failed operation must not be represented as a successful action.

### 14.2 Event Triggers and Correlation

Audit events must cover security-relevant permission grants and revocations, authorization allow/deny outcomes for protected operations, plugin installation or quarantine, external data transmission, cloud AI authorization, sensitive exports, credential configuration changes, integrity failures, and other security-sensitive actions.

Plugin and AI provenance records use the shared conceptual provenance envelope defined by Doc09 §13.2.2, with domain-specific extensions owned by Doc09 (plugin) and Doc10 (AI). They may share correlation identifiers and compatible identity semantics with security audit events, but remain distinct records with distinct ownership and purposes. SEC-012 owns the security audit event identity, actor/action/resource, policy decision, enforcement outcome, integrity, access, privacy, and audit-failure semantics; it does not own or replace plugin/AI execution provenance.

### 14.3 Integrity, Access, and Privacy

Audit records must be protected against unauthorized modification and deletion through appropriate application and storage controls. Access to audit records must be restricted to authorized purposes. The system must be able to detect or otherwise identify integrity failures according to the selected storage and verification design.

Do not log raw datasets, credentials, secrets, full sensitive prompts, or unnecessary personal information. Use resource references, safe summaries, and redaction where possible. Audit content, access, and retention must follow data-minimization and applicable classification requirements.

The specific append-only or tamper-evidence mechanism, storage technology, retention duration, and audit export format remain implementation and policy decisions; this document does not select them.

### 14.4 Audit Failure Semantics

Failure to record a security-critical event must not silently permit a protected operation to proceed when the applicable policy requires that evidence. The operation must fail safely or enter an explicitly defined controlled state. For non-critical diagnostic events, bounded buffering or deferred delivery may be considered only where it does not weaken a mandatory security control. Any deferred or failed audit delivery must be detectable and recoverable.

### 14.5 Verification Requirements

Tests must verify unique event identity, actor attribution, decision-versus-enforcement distinction, correlation across plugin/AI/export flows, redaction, access restrictions, integrity detection, and the behavior of security-critical operations when audit persistence is unavailable.

## 15. Export and Sharing Security

Exports may contain sensitive information. Export security must combine source classification, authorization, destination policy, and evidence of the actual export outcome.

### 15.1 Classification and Payload Scope

Before export, identify the source datasets and artifacts, effective classifications, included sensitive columns or fields, destination, format, and the exact content intended for release. Derived content inherits the highest applicable source classification unless an authorized declassification process has explicitly approved a lower classification under §11.2.

Distinguish:

- Project Export.
- Dataset Export.
- Report Export.
- Diagnostic Bundle.

Exporting a report must not silently export the entire project, original datasets, or unrelated artifacts. The export scope must be explicit and reviewable.

### 15.2 Authorization Bound to the Actual Payload

The export policy decision must apply to the actual final payload that will be generated, not merely to the initial export request or an earlier selection. If content, source references, destination, format, or other policy-relevant parameters change after evaluation, the policy must be evaluated again before release.

The policy outcome may require allow, user acknowledgement/confirmation, additional authorization, or deny, according to the applicable policy. Doc12 §16 uses `restricted/conditional` as a descriptive umbrella for the acknowledgement-conditional and additional-authorization-conditional outcomes; the governing policy must state which one applies. A warning or acknowledgement is not itself authorization and must not override a deny decision. The actor must not be able to alter the payload after approval without triggering re-evaluation.

### 15.3 Enforcement, Redaction, and Failure

Before releasing an export:

- Apply applicable authorization and classification policy.
- Apply required redaction or field/column restrictions.
- Identify external destinations and apply any destination restrictions.
- Preserve required classification and provenance metadata where supported by the export format.
- Ensure the generated output corresponds to the payload that was evaluated.

If policy evaluation, required authorization, redaction, or payload verification fails, the export must not be released. A fallback format or alternate destination must be evaluated under its own applicable policy; it must not be treated as automatically authorized.

### 15.4 Provenance and Audit

Record a security audit event for sensitive export decisions and outcomes. The reporting/export architecture owns the detailed export provenance record, including export identity, report specification and artifact references, actor, timestamp, format and parameters, policy version/result, and integrity evidence. Doc12 defines the REP-011 and REP-012 implementation details; this section defines the security requirements and cross-document boundary.

Provenance and audit records must not contain raw sensitive payloads or credentials unless explicitly required and separately authorized. Prefer stable references and minimized metadata. The audit event and export provenance should be correlated without conflating their responsibilities.

### 15.5 Verification Requirements

Tests must cover classification inheritance, unauthorized declassification, sensitive-field detection and redaction, payload changes after authorization, destination changes, policy denial, acknowledgement versus authorization, export failure, alternate-format behavior, and correlation between export provenance and security audit.

## 16. Security Failure Handling

Security failures should produce explicit and safe outcomes.

|Failure|Expected Behavior|
|---|---|
|Invalid IPC request|Reject request|
|Permission denied|Block operation and record event|
|Plugin boundary violation|Reject call and consider quarantine|
|Malicious file pattern|Reject or isolate input|
|Credential unavailable|Disable dependent integration|
|AI policy violation|Block request|
|Integrity failure|Stop affected operation and initiate recovery|
|Resource exhaustion|Reject or terminate affected task safely|
|Unauthorized navigation|Block navigation or open externally|

A security failure should not silently degrade into a less secure execution mode.

## 17. Backup, Recovery, and Incident Response

### 17.1 Recovery Requirements

- Validate project integrity on demand.
    
- Detect interrupted transactions.
    
- Recover staged file operations.
    
- Restore metadata and payload consistency.
    
- Preserve original snapshots.
    
- Reconcile job state after restart.
    
- Keep recovery actions auditable.
    

### 17.2 Incident Response

For a suspected security incident:

1. Contain affected plugin, provider, or execution.
    
2. Revoke relevant permissions or credentials.
    
3. Preserve diagnostic evidence.
    
4. Determine affected projects and artifacts.
    
5. Assess potential data exposure.
    
6. Restore trusted application state where needed.
    
7. Record remediation actions.
    

The MVP should provide practical local containment and diagnostics, even if it does not include an enterprise security incident management system.

## 18. Security Testing Strategy

|Test Level|Focus|
|---|---|
|Static analysis|Dependency and code security|
|IPC tests|Unauthorized commands, malformed payloads, and direct invocation paths|
|Authorization tests|Actor/action/resource/context checks, default-deny, cross-resource isolation, and failure behavior|
|WebView tests|Navigation and bridge exposure|
|Plugin isolation tests|Filesystem, network, capability, and process boundaries|
|Network security tests|Destination validation, prohibited IP ranges, DNS rebinding, redirects, TLS, retries, and response limits|
|File import tests|Malformed and hostile inputs|
|Storage tests|Path traversal and integrity|
|AI security tests|Prompt injection, tool authorization, approval binding, and unauthorized tool use|
|Audit tests|Attribution, correlation, integrity, privacy, and audit-failure behavior|
|Export security tests|Classification inheritance, actual-payload authorization, redaction, and export provenance correlation|
|Secret scanning|Accidental credential exposure|
|Dependency audits|Known vulnerable packages|
|Recovery tests|Corruption and interrupted writes|
|Cross-platform tests|OS-specific security behavior|

Security tests must run continuously during development and release validation. Critical authorization, network-boundary, audit, and export-policy failures must be treated according to the project's release-blocking severity policy; the detailed severity model and exception process remain governed by the relevant release/security decision and must not be inferred here.

## 19. MVP Security Baseline

### Required for MVP

- Narrow PyWebView bridge and trusted bundled UI boundary.
- Strict input validation and command allowlisting.
- Application-wide authorization using trusted actor, action, resource, and context.
- Default-deny enforcement at trusted application/service boundaries for every protected request.
- Fail-closed behavior when mandatory authorization or policy evaluation is unavailable.
- Project and filesystem isolation.
- Secure credential storage.
- Local-first data handling and explicit cloud authorization.
- Plugin subprocess isolation by default and capability-scoped network access.
- Outbound destination validation, including resolved IP and redirect handling, for network-capable MVP features.
- Dependency and package integrity checks.
- Safe file import.
- Structured security audit events with actor attribution, decision/outcome distinction, and correlation.
- Audit privacy, access control, and integrity protections.
- Classification-aware export controls bound to the actual export payload.
- Diagnostic redaction.
- Storage integrity and recovery.
- Security-focused automated tests for authorization, network boundaries, audit, and export controls.

### Deferred or Advanced

- Comprehensive OS sandboxing on every platform.
- Enterprise identity and SSO.
- Centralized security monitoring.
- Advanced data loss prevention.
- Hardware-backed key management.
- Formal security certification.
- Organization-wide policy administration.
- Specific centralized authorization engine or policy service.
- Specific proxy/firewall/network gateway product.
- Specific immutable audit storage technology and retention duration.

Deferred implementation choices do not justify weakening the required MVP security baseline. Any MVP network or export feature must still satisfy the applicable security requirements before release.

## 20. Key Architecture Decisions

|ID|Decision|Status|
|---|---|---|
|SEC-001|STRIDE-based risk assessment|Confirmed|
|SEC-002|Defense-in-depth security model|Confirmed|
|SEC-003|Narrow trusted PyWebView bridge|Confirmed|
|SEC-004|Application-wide authorization at trusted service boundaries; default-deny for every protected operation|Proposed — PO revision direction approved; verification and ratification pending|
|SEC-005|Third-party plugin isolation by default|Confirmed|
|SEC-006|Subprocess is not a complete sandbox|Confirmed|
|SEC-007|Local-first privacy and explicit cloud consent|Confirmed|
|SEC-008|Public/Internal/Confidential/Restricted classification|Confirmed|
|SEC-009|PII detection with user review|Confirmed|
|SEC-010|OS credential store for secrets|Confirmed|
|SEC-011|Controlled outbound network access with destination and resolved-address validation|Proposed — PO revision direction confirmed; verification and ratification pending|
|SEC-012|Structured security audit events with actor attribution, policy decision, enforcement outcome, correlation, integrity, and privacy controls|Proposed — PO revision direction approved; verification and ratification pending|
|SEC-013|Classification-aware export protection and payload-bound policy enforcement|Proposed — PO revision direction approved; verification and ratification pending|
|SEC-014|Storage integrity and recovery|Confirmed|
|SEC-015|AI tool execution cannot bypass application policy|Confirmed|

`Proposed — PO revision direction approved` records a direction to revise; it does not mean the decision is finally approved or ratified. Final status must follow the canonical status model in Doc00 §13 after source-owner review and verification.

## 21. Deferred Decisions

The following implementation and policy choices remain open and must not be treated as selected by this document:

- Exact OS sandbox technology per platform.
- Exact credential storage abstraction.
- Encryption-at-rest requirements.
- Audit retention duration and immutable/tamper-evidence storage mechanism.
- Exact PII detection engine.
- Network policy implementation, proxy/firewall, gateway, and destination allowlist mechanism.
- Authorization policy engine, policy language, and RBAC/ABAC/ReBAC model.
- Export redaction defaults and detailed declassification authority/rules.
- Plugin signing trust infrastructure.
- Formal security review cadence.
- Security incident severity model and exception process.

These open choices do not defer the normative security outcomes defined in §§7, 13, 14, and 15.

## 22. Traceability

|Related Document|Relationship|
|---|---|
|01 — Product Vision & Requirements|Privacy and reliability requirements|
|02 — System Architecture|Trust zones and application runtime|
|03 — Domain Model|Permissions and audit ownership|
|04 — Data & Persistence Architecture|Storage integrity and backup|
|05 — Processing & Execution Architecture|Worker isolation and resource control|
|06 — Application & IPC Architecture|Bridge validation and authorization|
|07 — Frontend Architecture|WebView and UI security|
|08 — UX & Interaction Architecture|Consent and confirmation|
|09 — Plugin & Extension Architecture|Plugin trust and permissions|
|10 — AI Architecture & Governance|AI privacy and security|
|11 — Security, Privacy & Threat Model|Security baseline|

## 23. Completion Criteria

Dokumen ini dianggap siap untuk final ratification apabila:

- Protected assets dan security boundaries teridentifikasi.
- STRIDE threat model tersedia.
- Trust zones didefinisikan.
- PyWebView bridge protection jelas.
- Authorization model, trusted enforcement boundary, request coverage, default-deny, dan fail-closed behavior ditetapkan.
- Plugin isolation dan supply-chain controls dijelaskan.
- Filesystem dan storage protections tersedia.
- Secret management ditentukan.
- Data classification, inheritance, declassification governance, dan cloud consent terintegrasi.
- Outbound destination controls mencakup DNS/IP validation, redirect handling, retries, dan SSRF verification.
- Audit event identity, actor attribution, decision/outcome semantics, correlation, integrity, privacy, and failure handling ditetapkan.
- Export authorization terikat pada actual final payload dan terhubung dengan Doc12 REP-011/REP-012.
- AI security dan prompt injection defenses tersedia.
- Incident response dan recovery dirancang.
- MVP security baseline dipisahkan dari deferred implementation choices.
- Automated verification evidence tersedia untuk authorization, network, audit, dan export controls.
- Cross-document references dan ownership konsisten dengan Doc00 §8.1.
- Decision status dan approval history konsisten dengan Doc00 §13.
- Source-owner review selesai dan unresolved audit findings memiliki disposition eksplisit.

## 24. Revision History

|Version|Date|Change|Status|
|---|---|---|---|
|0.1|2026-10-31|Initial security architecture and threat model baseline|Draft|
|0.2|2026-11-01|Incorporated PO-approved revision directions for SEC-004, SEC-011, SEC-012, and SEC-013; expanded authorization, outbound network, audit, export, testing, and completion requirements|Draft — source-owner review and verification pending|