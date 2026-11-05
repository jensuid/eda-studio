# 10 — AI Architecture & Governance

**Project:** EDA Workbench  
**Document:** 10 — AI Architecture & Governance  
**Version:** 0.4  
**Status:** Draft for Review — Revised for Review (WP-16)

> **Revision note (WP-16):** v0.4 header/status alignment only (IN-D). No body changes; no decision status changes.  
**Depends on:** Documents 01–09

---

## 1. Purpose

Dokumen ini mendefinisikan bagaimana AI diintegrasikan ke dalam EDA Workbench sebagai intelligence layer yang membantu pengguna memahami data, merencanakan analisis, menginterpretasikan hasil, dan mengeksplorasi pertanyaan lanjutan.

AI bukan analytical source of truth. Perhitungan statistik, data transformations, profiling metrics, dan quantitative results tetap berasal dari deterministic analytical engine.

Arsitektur harus mendukung:

- Local AI models.
    
- Optional cloud AI providers.
    
- Model routing berdasarkan task dan capability.
    
- Context-aware AI assistance.
    
- AI-assisted analysis planning.
    
- Evidence-grounded interpretation.
    
- Privacy dan consent management.
    
- Cost dan resource management.
    
- Evaluation, audit, dan governance.
    
- Graceful degradation ketika AI tidak tersedia.
    

## 2. AI Architectural Principles

|Principle|Description|
|---|---|
|Deterministic truth|Quantitative results berasal dari analytical engine, bukan AI|
|Human authority|Pengguna tetap mengontrol keputusan dan perubahan data|
|Grounded generation|AI harus menggunakan evidence yang tersedia|
|Local-first privacy|Local processing menjadi pilihan utama ketika sesuai|
|Explicit cloud consent|Tidak ada cloud processing tanpa authorization|
|Context minimization|Hanya kirim context yang diperlukan|
|Provider abstraction|Core application tidak bergantung pada satu model/provider|
|Cost awareness|Model selection mempertimbangkan biaya dan resource|
|Transparent uncertainty|AI harus mengungkapkan keterbatasan evidence|
|Auditable execution|AI request dan output memiliki provenance yang sesuai|
|Graceful degradation|Core EDA tetap berjalan tanpa AI|

## 3. AI Capability Scope

AI digunakan sebagai assistance layer pada beberapa capabilities.

|Capability|AI Contribution|Deterministic Responsibility|
|---|---|---|
|Data Understanding|Menjelaskan schema dan kemungkinan semantic meaning|Schema dan profiling|
|Data Quality|Menjelaskan quality issues|Quality metrics dan validation|
|Analysis Planning|Mengusulkan analytical steps|Plan validation dan execution|
|Method Selection|Menjelaskan pilihan metode|Statistical method registry dan assumptions|
|Result Interpretation|Membantu menjelaskan hasil|Statistical computation|
|Pattern Discovery|Mengusulkan pola untuk diperiksa|Detection dan clustering algorithms|
|Hypothesis Assistance|Membantu merumuskan research questions|Evidence dan hypothesis lifecycle|
|Modeling Readiness|Menjelaskan preparation gaps|Readiness assessment rules|
|Visualization|Merekomendasikan chart yang relevan|Chart data dan specification validation|
|Reporting|Membantu menyusun narrative|Verified results dan artifact references|

AI boleh mengusulkan, menjelaskan, dan merangkum. AI tidak boleh menggantikan deterministic engine untuk menghitung quantitative truth.

## 4. AI Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Frontend                         │
│ Guided Assistant │ Advanced Assistant │ AI Settings │
└───────────────────────┬─────────────────────────────┘
                        |
                        v
┌─────────────────────────────────────────────────────┐
│                AI Application Layer                 │
│                                                     │
│ AI Use Cases │ Context Builder │ Output Validator   │
│ Consent Flow │ AI Session Management               │
└───────────────────────┬─────────────────────────────┘
                        |
                        v
┌─────────────────────────────────────────────────────┐
│                  AI Governance Layer                │
│                                                     │
│ Policy Engine │ Data Classification │ Permissions   │
│ Model Routing │ Budget Management │ Audit           │
└───────────────────────┬─────────────────────────────┘
                        |
                        v
┌─────────────────────────────────────────────────────┐
│                  Provider Abstraction               │
│                                                     │
│ Provider Registry │ Model Registry │ Adapters       │
└───────────────────────┬─────────────────────────────┘
                        |
              ┌─────────┴─────────┐
              v                   v
┌──────────────────────┐  ┌──────────────────────────┐
│     Local Runtime    │  │      Cloud Providers     │
│                      │  │                          │
│ Local Models         │  │ Authorized APIs          │
│ Local Inference      │  │ Remote Inference         │
└──────────────────────┘  └──────────────────────────┘
```

The AI architecture is part of the modular monolith. Provider adapters isolate external integrations from application and domain logic.

## 5. AI Bounded Context and Components

### 5.1 AI Platform Responsibilities

The AI Platform bounded context owns:

- Provider registration.
    
- Model metadata.
    
- Model capability definitions.
    
- Model routing.
    
- AI request orchestration.
    
- Context preparation.
    
- AI execution lifecycle.
    
- Token/resource budget tracking.
    
- AI execution provenance.
    
- AI governance policies.
    

### 5.2 Core Components

|Component|Responsibility|
|---|---|
|AI Application Service|Orchestrates AI use cases|
|AI Context Builder|Prepares minimum necessary context|
|AI Policy Engine|Evaluates privacy, permission, and execution policies|
|Provider Registry|Registers available providers|
|Model Registry|Stores model capabilities and metadata|
|Model Router|Selects suitable model/provider|
|Provider Adapter|Implements provider-specific communication|
|AI Runtime Manager|Manages local inference lifecycle|
|Prompt Manager|Maintains versioned prompt templates|
|Output Validator|Validates structured output and evidence references|
|Budget Manager|Tracks token, cost, and resource limits|
|AI Audit Service|Records execution metadata and governance decisions|
|Evaluation Service|Measures output quality and safety|

## 6. AI Provider Abstraction

### 6.1 Provider Types

|Provider Type|Execution Location|Privacy Characteristics|
|---|---|---|
|Local Model|User machine|Data remains local, subject to local runtime controls|
|Cloud Provider|External service|Requires explicit authorization|
|Organization Provider|Organization-managed infrastructure|Depends on organization security and data policy|

Provider abstraction allows new providers without modifying feature-specific application logic.

### 6.2 Provider Contract

Conceptual interface:

```
class AIProvider(Protocol):

    def describe(self) -> ProviderMetadata:
        ...

    def list_models(self) -> list[ModelMetadata]:
        ...

    async def generate(
        self,
        request: AIRequest
    ) -> AIResponse:
        ...

    async def health_check(self) -> ProviderHealth:
        ...
```

Provider adapters must normalize:

- Request and response formats.
    
- Token usage.
    
- Model metadata.
    
- Error handling.
    
- Timeout behavior.
    
- Streaming support where available.
    
- Provider-specific limitations.
    

The provider contract must not expose provider-specific implementation details to domain modules.

### 6.3 Model Registry

Model metadata includes:

- Model ID.
    
- Provider ID.
    
- Model version.
    
- Context window.
    
- Supported modalities.
    
- Structured output capability.
    
- Tool-use capability.
    
- Estimated latency.
    
- Cost information when applicable.
    
- Local resource requirements.
    
- Availability status.
    
- Compatibility information.
    

Model capability claims should be validated where possible rather than blindly trusted from provider metadata.

## 7. Task-Based Model Routing

AI model selection is task-oriented, not based only on model popularity or size.

### 7.1 Task Categories

|Task|Preferred Capability|
|---|---|
|Short explanation|Low-latency language model|
|Schema interpretation|Structured reasoning and JSON output|
|Analysis planning|Strong reasoning and structured output|
|Statistical interpretation|Evidence-grounded reasoning|
|Report narrative|Long-context generation|
|Complex exploration|Strong reasoning and tool-use support|
|Embedding|Embedding-capable model|

### 7.2 Routing Criteria

The Model Router evaluates:

1. Task type.
    
2. Required capabilities.
    
3. Data classification.
    
4. User privacy preferences.
    
5. Provider authorization.
    
6. Model availability.
    
7. Context window.
    
8. Quality requirements.
    
9. Latency requirements.
    
10. Token/cost budget.
    
11. Local hardware/resource availability.
    

### 7.3 Routing Policy

Recommended priority:

1. Enforce privacy and permission constraints.
    
2. Filter incompatible models.
    
3. Evaluate local model availability.
    
4. Compare eligible providers against task requirements.
    
5. Apply user preferences and budget limits.
    
6. Select the best eligible model.
    
7. Explain fallback or unavailability when necessary.
    

A cloud provider must never be selected merely because local inference failed.

Cloud fallback requires explicit prior authorization for that provider and data category, or a new consent interaction.

## 8. AI Context Architecture

AI context should be constructed from controlled application data, not arbitrary access to the entire project.

### 8.1 Context Sources

Potential context includes:

- Project description.
    
- Dataset metadata.
    
- Schema and semantic types.
    
- Profiling summaries.
    
- Quality assessment results.
    
- Analysis plan.
    
- Statistical results.
    
- Artifact metadata.
    
- Findings and hypotheses.
    
- User-provided research questions.
    
- Relevant methodology and limitations.
    

### 8.2 Context Builder

The Context Builder is responsible for:

1. Identifying the task's information requirements.
    
2. Resolving authorized source references.
    
3. Retrieving relevant evidence.
    
4. Applying data classification.
    
5. Redacting or minimizing sensitive content.
    
6. Summarizing large inputs when appropriate.
    
7. Building a versioned context package.
    
8. Recording source references and context fingerprints.
    

### 8.3 Context Minimization

Default behavior:

- Prefer schema and metadata over raw data.
    
- Prefer aggregate summaries over individual records.
    
- Include only relevant columns.
    
- Limit row samples.
    
- Exclude unnecessary identifiers and sensitive attributes.
    
- Avoid transferring full datasets.
    
- Use artifact references for large analytical outputs.
    

Raw records must not be sent to cloud providers by default.

### 8.4 Context Provenance

Each AI execution should retain appropriate references to:

- Project and dataset.
    
- Snapshot IDs.
    
- Artifact IDs.
    
- Context package version.
    
- Relevant evidence references.
    
- Prompt template version.
    

Sensitive context payloads should not be retained in full unless explicitly required and authorized by policy.

## 9. AI Request and Response Contracts

### 9.1 AI Request

Conceptual request:

```
class AIRequest(BaseModel):
    request_id: UUID
    task_type: str
    context: AIContextReference
    constraints: AIExecutionConstraints
    output_schema: str | None
    model_preference: ModelPreference | None
```

The context is represented by controlled references and prepared content, not unrestricted access to the application.

### 9.2 AI Response

```
class AIResponse(BaseModel):
    request_id: UUID
    provider_id: str
    model_id: str
    output: dict | str
    evidence_refs: list[str]
    usage: AIUsage
    metadata: AIExecutionMetadata
```

Response validation must check:

- Schema conformance.
    
- Required fields.
    
- Evidence reference validity.
    
- Output size.
    
- Allowed operations.
    
- Policy compliance.
    

Valid JSON does not imply that an AI response is factually correct.

## 10. AI-Assisted Analysis Planning

The AI layer may help generate candidate Analysis Plans.

Workflow:

1. User provides analytical objective.
    
2. Context Builder prepares dataset context.
    
3. AI suggests analysis steps and candidate methods.
    
4. Plan Builder converts suggestions into declarative plan specifications.
    
5. Decision Engine validates methods, assumptions, dependencies, and feasibility.
    
6. Planner identifies unsupported or invalid steps.
    
7. User reviews the complete plan.
    
8. User approves the plan revision.
    
9. Job Manager executes approved tasks.
    

AI-generated steps are proposals, not executable authority.

The AI must not bypass:

- Analysis Plan validation.
    
- User approval.
    
- Statistical method validation.
    
- Execution permissions.
    
- Transformation approval.
    

## 11. Evidence-Grounded Interpretation

### 11.1 Interpretation Contract

AI interpretations should distinguish:

- Directly observed facts.
    
- Statistical evidence.
    
- Possible explanations.
    
- Speculation or hypotheses.
    
- Unknown information.
    

Every quantitative statement should reference a deterministic result or artifact.

### 11.2 Evidence Validation

The Output Validator should:

- Check referenced artifacts exist.
    
- Verify referenced metrics are available.
    
- Detect unsupported numerical claims where feasible.
    
- Reject malformed structured responses.
    
- Identify claims that overstate association or causality.
    
- Mark interpretations with insufficient evidence.
    

Evidence references establish traceability, not automatic correctness of the interpretation.

### 11.3 Causality Constraints

AI must not describe correlation as causation without appropriate causal evidence and methodology.

Exploratory findings should use qualified language such as:

- "is associated with"
    
- "shows a pattern consistent with"
    
- "may indicate"
    
- "requires further investigation"
    

## 12. AI Tool Use and Action Governance

AI may request access to platform tools, but tool execution remains controlled by application services.

### 12.1 Tool Categories

|Tool Category|Example|Policy|
|---|---|---|
|Read-only|Retrieve schema summary|Permission checked|
|Analytical|Request a statistical analysis|Validated and scheduled|
|Planning|Generate candidate plan|User review required|
|Transformation|Propose data cleaning|Separate approval required|
|External|Access external service|Explicit capability and consent|
|Destructive|Delete or overwrite data|Prohibited by default|

### 12.2 Tool Execution Flow

```
AI proposes tool call
        |
        v
Tool schema validation
        |
        v
Permission and policy check
        |
        v
Application service validation
        |
        v
Approval check if required
        |
        v
Execution through Job Manager
        |
        v
Result returned to AI/user
```

AI must never invoke Python functions, SQL execution, filesystem access, or bridge methods through arbitrary generated code without the appropriate controlled execution pathway.

### 12.3 Controlled Application-Service Boundary

AI-generated tool requests are proposals, not executable authority. Every tool operation MUST be dispatched through an application-controlled service boundary. The model or generated content MUST NOT directly invoke application internals, operating-system facilities, database interfaces, IPC/bridge methods, or arbitrary code execution.

The controlled boundary is responsible for:

- Authenticating and resolving the initiating actor and active session.
- Binding the request to a specific AI task/execution and the intended project, dataset, artifact, or other resource.
- Validating the tool identifier, version, operation, typed input contract, and parameter constraints.
- Authorizing the exact action against the actor, resource, operation, context, and applicable policy.
- Enforcing capability scope and default-deny behavior; an omitted, unknown, or ambiguous capability is not permission.
- Applying risk-based approval requirements before execution.
- Executing only the validated operation through the relevant application service and returning a bounded, typed result.
- Recording security-relevant decisions and execution outcomes.

Client-side checks and model instructions are not authorization boundaries. Authorization MUST be enforced by trusted application/backend services at the point of operation. Tool outputs and external content are untrusted data and MUST be validated and treated as data, not instructions.

### 12.4 Capability and Authorization Controls

A tool capability MUST identify, at minimum, the permitted resource scope and operation. Permission to invoke a tool category does not imply unrestricted access to all resources or operations in that category.

The default is deny. The application MUST reject operations when the actor, session, task, resource, operation, capability, or authorization context cannot be established or validated. Capability grants MUST be limited to the minimum scope required for the requested task and MUST be revocable. Revocation MUST prevent subsequent operations under the revoked grant; handling of already accepted or in-flight operations must follow the applicable operation safety and consistency rules.

Tool contracts MUST be typed and constrained. Inputs MUST be validated before authorization and execution; outputs MUST be bounded and validated before being returned to the model or presented to the user. Arbitrary model-generated code is not an acceptable substitute for a registered tool contract.

### 12.5 Risk Classification and Human Approval

Tool operations MUST be assigned a risk class based on their effects, resource sensitivity, reversibility, and potential impact. The classification and corresponding approval requirements must be explicit in the tool/action contract or its governing policy.

Human approval is required for sensitive or consequential operations as determined by the risk classification and applicable policy. Approval MUST be bound to the exact proposed action, target resource, and material parameters. A material change to the action, target, or parameters invalidates the prior approval and requires a new decision.

Not every tool invocation requires human confirmation. Read-only or otherwise low-risk operations may proceed without an additional confirmation when they are within the actor's authorized capability and policy. Approval does not replace authorization: both must pass when both apply. Denied, missing, expired, or mismatched approval MUST prevent execution.

### 12.6 Isolation, Failure, and Audit

Tool execution MUST remain within the authority and resource scope of the controlled application service. A tool MUST NOT gain broader authority through model-generated instructions, chained calls, plugin output, or a different execution path.

Authorization failure, invalid contracts, untrusted or malformed outputs, policy denial, and approval failure MUST stop the affected operation safely. The application MUST preserve relevant state and expose a clear outcome. Security-relevant events MUST be recorded and correlated with the AI execution provenance described in §17 and the security audit requirements in Doc11 §14 (SEC-012).

This document does not select a specific agent framework, orchestration engine, gateway product, authorization engine, sandbox technology, or capability taxonomy.


## 13. Privacy and Consent Governance

### 13.1 Data Classification

AI requests follow the data classification model:

|Classification|Description|
|---|---|
|Public|Approved for public disclosure|
|Internal|Internal project information|
|Confidential|Sensitive business or analytical information|
|Restricted|Highly sensitive or regulated information|

Data classification is determined by project metadata, dataset assessment, and user review where needed.

Automatic classification is advisory until validated by applicable policy.

### 13.2 Local vs Cloud Processing

Local inference:

- Preferred when suitable and available.
    
- Uses local hardware and installed models.
    
- May still require resource and permission controls.
    

Cloud inference:

- Requires explicit authorization.
    
- Must identify the provider and relevant data categories.
    
- Must disclose what context will be transmitted.
    
- Must apply minimization and redaction.
    
- Must respect provider-specific retention and processing policies.
    

### 13.3 Consent Scope

Consent should be specific enough to distinguish:

- Provider.
    
- Project or scope.
    
- Data classification.
    
- Task category.
    
- Whether raw records may be transmitted.
    
- Whether context may be retained by the provider, according to available provider terms.
    

Revocation prevents future authorized transmissions. It cannot guarantee deletion of information already transmitted to an external provider.

## 14. AI Security and Prompt Injection Defense

AI context may contain untrusted content from:

- Dataset values.
    
- Column names.
    
- File metadata.
    
- Imported documents.
    
- Plugin outputs.
    
- External sources.
    
- User-provided text.
    

These inputs must be treated as data, not trusted instructions.

### Security Controls

1. Separate system instructions from retrieved data.
    
2. Clearly delimit untrusted context.
    
3. Validate all model-generated tool calls.
    
4. Enforce capabilities outside the model.
    
5. Apply least-privilege tool access.
    
6. Never expose secrets to model context.
    
7. Validate external content before use.
    
8. Limit tool invocation count and execution scope.
    
9. Record security-relevant events.
    
10. Require human approval for consequential operations.
    

Prompt injection defenses must be layered. Prompt instructions alone are not a security boundary.

## 15. Cost and Resource Management

### 15.1 Budget Dimensions

- Per-request token budget.
    
- Per-task cost budget.
    
- Per-project AI budget.
    
- Per-session budget.
    
- Local inference memory budget.
    
- Local inference CPU/GPU budget.
    
- Concurrency limits.
    
- Provider rate limits.
    

### 15.2 Budget Management

The Budget Manager should:

- Estimate request cost before cloud execution when pricing information is available.
    
- Track actual usage after execution.
    
- Enforce user-configured limits.
    
- Reject or request authorization for over-budget requests.
    
- Avoid uncontrolled retries.
    
- Record usage by task, project, and provider.
    

Cost estimates must be labeled as estimates because provider pricing and tokenization can vary.

### 15.3 Local Resource Management

Local models share system resources with analytical workloads.

AI inference should participate in Resource Manager admission control and must not starve core EDA execution.

Users should be able to configure AI resource preferences.

## 16. AI Failure and Graceful Degradation

AI is optional to the core EDA workflow.

|Failure|Expected Behavior|
|---|---|
|Local model unavailable|Explain unavailable capability|
|Cloud provider unavailable|Offer another authorized provider or continue without AI|
|Token budget exceeded|Stop request and explain budget limit|
|Invalid model output|Validate, reject, or retry within policy|
|Unsupported task|Explain limitation|
|Context too large|Request smaller scope or summarize under policy|
|AI timeout|Mark request failed and preserve application state|
|Consent unavailable|Do not transmit data|
|AI security violation|Reject operation and record event|

There must be no automatic cloud fallback without authorization.

## 17. AI Audit and Provenance

Every AI task/execution MUST have a unique, stable AI execution identifier that can be used to correlate its request, model activity, tool calls, outputs, failures, and related artifacts. Request IDs may remain useful for individual request/response correlation, but they do not replace the execution identifier when a task spans multiple requests or tool operations.

AI execution provenance conforms to the shared conceptual provenance envelope defined in Doc09 §13.2.2. The common field groups are record identity, actor/principal, session/context reference, timestamp, correlation identifiers, resource references, outcome, and integrity evidence. Doc10 owns the AI-specific extensions below; this reference does not make Doc09 the owner of AI execution semantics.

The AI execution provenance record should include, where applicable:

**Execution identity and context**
- Unique AI task/execution ID.
- Request/correlation ID or IDs.
- Initiating actor/principal and active session reference.
- Task type/purpose and execution entry point.
- Start, completion, and relevant event timestamps.
- Project, dataset, snapshot, and resource references required for traceability.

**Model and provider provenance**
- Provider identifier.
- Model identifier and version.
- Relevant model configuration and routing decision, including selected route/fallback outcome.
- Prompt template/version and context package version/fingerprint.
- Input references and evidence/artifact references; prefer references and fingerprints over copying raw input or sensitive context payloads.
- Data classification and applicable consent/authorization or policy decision references.

**Tool-use provenance**
- Tool identifier and version.
- Operation name and a safe, minimized representation of material parameters.
- Target resource references.
- Authorization/capability decision and outcome.
- Human approval requirement and outcome, including the approved action/resource/parameter binding where applicable.
- Tool execution result reference or bounded result summary, and execution timestamps.
- Correlation to the relevant application job or operation when one is created.

**Outcome, integrity, and failure**
- Execution outcome and validation status.
- Output/artifact references and lineage links to inputs, evidence, and tool results.
- Integrity information sufficient to detect unauthorized alteration according to the applicable integrity controls.
- Error, refusal, timeout, cancellation, policy-denial, and partial-completion information where applicable.
- Usage metadata such as tokens and cost when available.

Provenance MUST preserve the relationship between the AI execution, its inputs, model/provider configuration, tool operations, authorization and approval decisions, outputs, and resulting artifacts. It MUST distinguish AI-generated content from deterministic analytical artifacts and user-confirmed findings.

Records SHOULD minimize sensitive content. Raw prompts, dataset rows, secrets, credentials, and full tool payloads MUST NOT be copied into provenance by default. Store references, fingerprints, safe parameter summaries, and outcome metadata where sufficient. Any retention of sensitive payloads requires a documented purpose and authorization under applicable privacy, security, and retention policy.

AI execution provenance is distinct from the security audit record. Doc11 §14 (SEC-012) remains the canonical security audit requirement for actor/action/resource, policy decision, allow/deny reason, enforcement outcome, integrity, access, and critical-event handling. AI provenance MUST correlate to relevant security audit events using stable identifiers; it MUST NOT replace, redefine, or weaken SEC-012. Plugin execution provenance remains governed by Doc09 PLG-012 and should be correlated where AI invokes a plugin tool.

If provenance cannot be durably recorded, the system MUST apply a risk-appropriate safe failure behavior. Operations whose policy or risk classification requires provenance MUST NOT proceed without successful recording of the required provenance and security decision. For other operations, the system must not silently imply that complete provenance exists; it must record and expose the failure according to the applicable policy. The exact storage technology, retention duration, and cryptographic mechanism remain deferred.

## 18. AI Evaluation and Quality Governance

AI capabilities require ongoing evaluation, not only functional testing.

### 18.1 Evaluation Dimensions

|Dimension|Evaluation Focus|
|---|---|
|Factual Groundedness|Are claims supported by available evidence?|
|Numerical Accuracy|Are quantitative values correctly represented?|
|Reasoning Quality|Are interpretations logically justified?|
|Instruction Following|Does output satisfy task requirements?|
|Schema Validity|Does output conform to the expected contract?|
|Uncertainty Calibration|Does the model communicate uncertainty appropriately?|
|Privacy|Does it avoid exposing restricted information?|
|Security|Does it resist prompt injection and unauthorized tool use?|
|Consistency|Are equivalent inputs handled consistently?|
|Cost/Latency|Is quality appropriate for resource usage?|

### 18.2 Evaluation Dataset

Maintain versioned test cases for:

- Dataset explanation.
    
- Analysis plan generation.
    
- Statistical interpretation.
    
- Data quality explanation.
    
- Hypothesis assistance.
    
- Report narrative.
    
- Adversarial and prompt-injection scenarios.
    

Evaluation datasets should use synthetic or appropriately anonymized data where possible.

### 18.3 Release Governance

Before an AI capability is released:

1. Define its intended task.
    
2. Define expected evidence requirements.
    
3. Establish baseline evaluation cases.
    
4. Test normal and adversarial inputs.
    
5. Validate privacy and permissions.
    
6. Evaluate output quality and failure behavior.
    
7. Document known limitations.
    
8. Monitor production outcomes where consent and privacy policies permit.
    

## 19. AI UX Requirements

AI interactions must communicate:

- Whether the request uses local or cloud processing.
    
- Which provider/model is selected when relevant.
    
- Whether the output is generated or deterministic.
    
- Which evidence supports an interpretation.
    
- Whether the response contains uncertainty.
    
- Whether a tool action requires approval.
    
- Whether AI is unavailable or degraded.
    

The interface should distinguish visually and semantically:

|Content|Presentation Identity|
|---|---|
|Statistical result|Deterministic result|
|Rule-based observation|System-generated observation|
|AI interpretation|AI-generated interpretation|
|User-confirmed finding|User-owned finding|

AI output must not silently become a confirmed project conclusion.

## 20. MVP Scope

### Included

- Provider abstraction.
    
- Local-first AI integration architecture.
    
- Optional cloud provider support.
    
- Model and provider registry.
    
- Task-based model routing.
    
- Context Builder.
    
- Explicit cloud consent.
    
- Data minimization.
    
- AI-assisted analysis planning.
    
- Evidence-grounded interpretation.
    
- Structured output validation.
    
- Basic budget management.
    
- AI execution provenance.
    
- Graceful degradation.
    
- Initial evaluation framework.
    

### Deferred

- Advanced multi-model orchestration.
    
- Autonomous multi-step agent workflows.
    
- Automated model fine-tuning.
    
- Organization-wide centralized AI gateway.
    
- Advanced retrieval-augmented generation infrastructure.
    
- Automated provider benchmarking.
    
- Advanced AI feedback and learning systems.
    
- Complex multimodal AI workflows.
    

Autonomous execution of consequential data operations is explicitly outside the MVP scope.

## 21. Key Architecture Decisions

| ID     | Decision                                                         | Status    |
| ------ | ---------------------------------------------------------------- | --------- |
| AI-001 | Hybrid local-first and optional cloud AI                         | Confirmed |
| AI-002 | Provider abstraction and model registry                          | Confirmed |
| AI-003 | Task-based model routing                                         | Confirmed |
| AI-004 | Cloud execution requires explicit consent                        | Confirmed |
| AI-005 | Summaries/metadata preferred over raw data                       | Confirmed |
| AI-006 | Deterministic engine owns quantitative truth                     | Confirmed |
| AI-007 | AI-generated analysis plans require validation and user approval | Confirmed |
| AI-008 | Transformations require separate approval                        | Confirmed |
| AI-009 | No automatic unauthorized cloud fallback                         | Confirmed |
| AI-010 | Graceful degradation when AI is unavailable                      | Confirmed |
| AI-011 | Cost and resource budgets                                        | Confirmed |
| AI-012 | AI governance and evaluation framework                           | Confirmed |
| AI-013 | AI tool calls use controlled application services                | Proposed  |
| AI-014 | AI execution provenance is mandatory                             | Proposed  |

## 22. Deferred Decisions

- Specific local inference runtime.
    
- Initial local model selection.
    
- Initial cloud provider integrations.
    
- Provider-specific retention and data-processing configuration.
    
- Exact consent persistence model.
    
- Exact token and cost budget defaults.
    
- Prompt template management implementation.
    
- Evaluation metrics and acceptance thresholds.
    
- AI audit retention policy.
    
- Advanced RAG implementation.
    
- Model update and compatibility policy.
    

## 23. Traceability

|Related Document|Relationship|
|---|---|
|01 — Product Vision & Requirements|AI-assisted EDA objectives|
|02 — System Architecture|Modular monolith and runtime|
|03 — Domain Model|AI Platform bounded context|
|04 — Data & Persistence Architecture|Data classification and artifact storage|
|05 — Processing & Execution Architecture|Job execution and resource management|
|06 — Application & IPC Architecture|Typed contracts and controlled dispatch|
|07 — Frontend Architecture|AI interaction and state|
|08 — UX & Interaction Architecture|Consent, interpretation, and user authority|
|09 — Plugin & Extension Architecture|Provider and extension integration; PLG-012 plugin execution provenance correlation|
|11 — Security, Privacy & Threat Model|SEC-004 authorization foundation; SEC-012 security audit correlation|
|10 — AI Architecture & Governance|AI execution and governance|

## 24. Completion Criteria

Dokumen ini dianggap lengkap apabila:

- AI capabilities dan boundaries terdefinisi.
    
- Provider abstraction dan model registry dirancang.
    
- Task-based routing memiliki policy.
    
- Context construction dan minimization jelas.
    
- Cloud consent dan data classification terintegrasi.
    
- AI-generated plans melewati validation dan approval.
    
- Tool execution melewati controlled application-service boundary dengan typed contracts, backend authorization, default-deny capability scope, dan risk-based approval.
    
- Prompt injection defenses ditentukan.
    
- Budget dan resource controls tersedia.
    
- AI provenance mencakup identitas task/execution, actor/session, model/provider, input references, tool operations, authorization/approval, lineage, integrity, outcome, dan failure.
- AI provenance terhubung dengan security audit SEC-012 tanpa menggantikannya.
- AI provenance dan evaluation framework ditetapkan.
    
- Graceful degradation dipastikan.
    
- MVP dan deferred AI capabilities dipisahkan.