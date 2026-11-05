# 01 — Product Vision & Requirements

**Product:** EDA Workbench  
**Document Type:** Product Requirements Document (PRD)  
**Version:** 0.2  
**Status:** Draft for Review — Revised for Review (WP-17)

> **Revision note (WP-17):** v0.2 adds §8.6 cross-reference to Doc08 WCAG 2.2 AA baseline (IN-B full closure). No requirement changes.

---

## 1. Product Vision

### 1.1 Vision Statement

**EDA Workbench is a guided, extensible, and reproducible Exploratory Data Analysis platform that helps users transform raw datasets into trustworthy analytical insights through an integrated, intelligent, and local-first workflow.**

The platform combines guided analytical workflows, professional statistical capabilities, non-destructive data preparation, extensibility, and reproducible reporting in one desktop application.

### 1.2 Product Mission

Make comprehensive Exploratory Data Analysis accessible to beginners while providing professional analysts with the flexibility, control, and extensibility they require.

### 1.3 Core Product Principles

1. **Guided, not restrictive:** Help beginners without limiting experienced analysts.
    
2. **Analytically trustworthy:** Statistical correctness takes priority over convenience.
    
3. **Reproducible by design:** Every transformation and analytical result has traceable provenance.
    
4. **Non-destructive:** Original data remains immutable.
    
5. **Local-first:** User data remains local by default.
    
6. **Extensible:** Support built-in capabilities, plugins, and custom scripts.
    
7. **Progressively intelligent:** Provide recommendations and AI assistance without surrendering user control.
    
8. **Transparent:** Explain methods, assumptions, limitations, and execution decisions.
    

---

## 2. Problem Statement

Exploratory Data Analysis often requires users to combine multiple disconnected tools, scripts, libraries, and manual processes.

This creates several problems:

- Beginners struggle to determine which analytical methods to use.
    
- Data cleaning and analysis workflows are fragmented.
    
- Statistical assumptions and methodological limitations are easily overlooked.
    
- Transformations and analytical results are difficult to reproduce.
    
- Large datasets require different execution strategies.
    
- Insights are scattered across notebooks, charts, and reports.
    
- Sharing analytical results often requires manual documentation.
    
- Extending existing analytical tools can require substantial programming knowledge.
    

EDA Workbench addresses these problems through a unified, guided, reproducible analytical environment.

---

## 3. Target Users

### 3.1 Primary Personas

**Persona A — Beginner / Business Analyst**

Needs:

- Understand unfamiliar datasets.
    
- Identify data quality problems.
    
- Receive recommendations for suitable analyses.
    
- Clean data without extensive programming.
    
- Understand statistical results.
    
- Generate understandable reports.
    

Expected experience: Guided Mode.

**Persona B — Professional Data Analyst**

Needs:

- Direct access to statistical methods.
    
- Advanced parameter configuration.
    
- Control over execution strategies.
    
- Custom analysis and visualization.
    
- Reproducible workflows.
    
- Python and SQL/DuckDB integration.
    
- Extensible analytical capabilities.
    

Expected experience: Advanced Mode.

### 3.2 Shared Product Strategy

Both personas use the same analytical engine, domain model, data infrastructure, and project.

The distinction is interaction complexity, not analytical capability.

Users can switch between Guided and Advanced Mode without losing their current project context or work.

---

## 4. Product Objectives

EDA Workbench must support nine major analytical objectives:

1. **Understand the data:** Structure, schema, data types, semantic meanings, grain, identifiers, and data dictionary.
    
2. **Assess data quality:** Missing values, duplicates, incorrect types, inconsistent formats, and invalid values.
    
3. **Understand individual variables:** Distributions, central tendency, dispersion, and frequency.
    
4. **Explore relationships:** Associations and relationships between variables.
    
5. **Identify anomalies:** Outliers, unusual values, and contextual anomalies.
    
6. **Discover patterns:** Segments, clusters, trends, and recurring structures.
    
7. **Generate hypotheses:** Identify research questions and potential explanations for further investigation.
    
8. **Assess modeling readiness:** Evaluate data suitability and preparation requirements for subsequent modeling.
    
9. **Communicate insights:** Produce visualizations, findings, reports, and methodological documentation.
    

EDA is exploratory. Observed associations or patterns must not be presented as proof of causality or confirmatory evidence.

---

## 5. Core EDA Workflow

The product organizes analytical work into ten connected stages.

|Stage|Name|Primary Outcome|
|---|---|---|
|01|Project & Business Understanding|Project context and analytical objectives|
|02|Data Ingestion & Connection|Accessible datasets|
|03|Data Structure & Profiling|Dataset understanding|
|04|Data Quality Assessment|Quality issues and assessment|
|05|Data Cleaning & Preparation|Prepared dataset views|
|06|Univariate Analysis|Individual variable insights|
|07|Bivariate & Multivariate Analysis|Relationships and associations|
|08|Anomaly & Pattern Discovery|Anomalies and discovered patterns|
|09|Hypothesis & Modeling Readiness|Research questions and readiness assessment|
|10|Insights & Reporting|Findings and shareable reports|

The workflow is connected but not strictly linear.

Users may revisit stages, explore alternative approaches, and perform additional analyses.

---

## 6. Product Capabilities

### 6.1 Project Management

- Create, open, close, and manage projects.
    
- Support multiple datasets within one project.
    
- Persist project metadata and analytical context.
    
- Support backup, restore, and portable project packages.
    
- Recover user work after application interruption.
    

### 6.2 Data Ingestion & Management

- Import CSV, Excel, and Parquet.
    
- Support external data references.
    
- Infer and inspect schemas.
    
- Maintain immutable dataset snapshots.
    
- Explore datasets, relationships, and lineage.
    
- Support optional remote database connections through explicit configuration.
    

### 6.3 Data Profiling & Quality

- Schema and semantic profiling.
    
- Statistical summaries.
    
- Missing value analysis.
    
- Duplicate detection.
    
- Invalid and inconsistent value detection.
    
- Type and format assessment.
    
- Context-aware quality recommendations.
    

### 6.4 Data Cleaning & Preparation

- Non-destructive transformation pipelines.
    
- Configurable cleaning operations.
    
- Preview before execution.
    
- User approval before applying transformations.
    
- Pipeline versioning and provenance.
    
- Virtual views and optional materialization.
    
- Validation and rollback support.
    

### 6.5 Statistical Analysis

- Descriptive statistics.
    
- Distribution analysis.
    
- Univariate analysis.
    
- Bivariate and multivariate analysis.
    
- Statistical tests and association analysis.
    
- Assumption validation.
    
- Effect sizes and confidence intervals where applicable.
    
- Alternative methods when assumptions are not satisfied.
    

### 6.6 Anomaly & Pattern Discovery

- Statistical and contextual anomaly detection.
    
- Segmentation and clustering.
    
- Aggregation and association mining.
    
- Temporal pattern discovery.
    
- Suitability assessment and limitations.
    

### 6.7 Insights & Hypotheses

- Separate statistical results, observations, and findings.
    
- Maintain research questions and hypothesis lifecycle.
    
- Provide AI-assisted interpretation when enabled.
    
- Preserve supporting evidence and provenance.
    
- Avoid unsupported causal conclusions.
    

### 6.8 Visualization

- Semantic chart recommendations.
    
- Interactive visualizations.
    
- Configurable chart specifications.
    
- Reusable visualization artifacts.
    
- Accessible chart alternatives.
    
- Exportable visualizations.
    

### 6.9 Reporting

- Executive reports.
    
- Exploratory EDA reports.
    
- Technical reports.
    
- HTML and PDF export.
    
- Findings, visualizations, methodology, and limitations.
    
- Data and analytical provenance.
    

### 6.10 Extensibility

- Python plugin SDK.
    
- Custom analytical methods.
    
- Cleaning operations.
    
- Connectors.
    
- Visualizations.
    
- Report extensions.
    
- Ad-hoc scripts.
    
- Controlled execution and permissions.
    

### 6.11 AI Assistance

- Local and optional cloud AI providers.
    
- Statistical interpretation.
    
- Analytical recommendations.
    
- Research question assistance.
    
- Contextual explanations.
    
- Explicit consent and privacy controls.
    
- Deterministic analytical engine remains authoritative for quantitative results.
    

---

## 7. User Experience Strategy

### 7.1 Guided Mode

Designed for users who need analytical guidance.

Characteristics:

- Stage-based workflow.
    
- Step-by-step instructions.
    
- Contextual explanations.
    
- Recommended methods and actions.
    
- Preview and approval interactions.
    
- Statistical assumptions and limitations.
    
- Insight-centric workspace.
    

### 7.2 Advanced Mode

Designed for users who need direct analytical control.

Characteristics:

- Direct access to analytical methods.
    
- Advanced parameter configuration.
    
- SQL/DuckDB and Python integration.
    
- Custom visualizations.
    
- Execution details and Explain Plan.
    
- Artifact Explorer.
    
- Flexible analytical exploration.
    

### 7.3 Shared Experience

Both modes share:

- Project and dataset context.
    
- Analytical engine.
    
- Transformation pipelines.
    
- Analysis plans.
    
- Artifacts and provenance.
    
- Findings and reports.
    

Switching modes must preserve the underlying work and context.

---

## 8. Non-Functional Requirements

### 8.1 Architecture

- Python-based modular monolith.
    
- PyWebView desktop shell.
    
- React, TypeScript, and Vite frontend.
    
- Apache ECharts visualization engine.
    
- Typed JavaScript-Python bridge.
    
- Domain-oriented modular architecture.
    
- Explicit dependency injection and service boundaries.
    

### 8.2 Data & Performance

- Support small through very large datasets.
    
- Adaptive query execution.
    
- DuckDB and Polars integration.
    
- Avoid transferring entire datasets through JSON IPC.
    
- Use bounded previews, Arrow IPC, and artifact references.
    
- Background execution for expensive operations.
    
- Resource-aware scheduling and caching.
    

### 8.3 Reproducibility

- Immutable original data and snapshots.
    
- Versioned transformations.
    
- Versioned analytical artifacts.
    
- Execution parameters and method versions.
    
- Dataset and snapshot references.
    
- Dependency-aware invalidation.
    
- Traceable analytical lineage.
    

### 8.4 Security & Privacy

- Local-first data handling.
    
- Strict IPC validation.
    
- Least-privilege execution.
    
- Plugin isolation.
    
- Secure credential storage.
    
- Explicit cloud AI consent.
    
- Opt-in product telemetry.
    
- No raw dataset upload by default.
    

### 8.5 Reliability

- Transactional autosave.
    
- Crash recovery.
    
- Persistent project metadata.
    
- Backup and restore.
    
- Safe job failure handling.
    
- Cross-platform compatibility.
    

### 8.6 Accessibility & Localization

- Target WCAG 2.2 AA (baseline defined in Doc08; IN-B closed).
    
- English as default technical language.
    
- Indonesian as initial additional locale.
    
- Locale-aware presentation.
    
- Locale-independent analytical calculations.
    

---

## 9. Deployment & Operating Model

EDA Workbench is a local-first desktop application.

**Default operating model:**

- Project data stored locally.
    
- Analytical execution performed locally.
    
- No mandatory cloud account.
    
- No mandatory internet connection for core EDA.
    
- Optional external database and cloud AI integrations.
    
- User-controlled project export and sharing.
    

**Technology baseline:**

|Layer|Technology|
|---|---|
|Desktop Host|PyWebView|
|Frontend|React + TypeScript + Vite|
|Backend|Python|
|IPC|PyWebView JavaScript-Python Bridge|
|Analytical Query Engine|DuckDB|
|Data Processing|Polars and specialized Python libraries|
|Analytical Storage|Parquet|
|Metadata Storage|SQLite|
|Data Exchange|Apache Arrow|
|Visualization|Apache ECharts|

---

## 10. Product Scope

### 10.1 Overall Product Scope

The long-term product includes:

- Comprehensive core EDA.
    
- Guided and advanced analytical workflows.
    
- Multi-dataset project management.
    
- Data quality and non-destructive cleaning.
    
- Statistical analysis and anomaly detection.
    
- Pattern discovery and modeling readiness.
    
- Findings, hypotheses, and reporting.
    
- AI-assisted interpretation.
    
- Extensible plugin ecosystem.
    
- Local-first and optional remote integrations.
    

### 10.2 MVP Scope

The MVP must deliver a complete, usable core EDA workflow.

**Included:**

1. Create and open projects.
    
2. Import CSV, Excel, and Parquet.
    
3. Dataset preview and schema inference.
    
4. Data profiling.
    
5. Data quality assessment.
    
6. Missing value, duplicate, and type issue detection.
    
7. Non-destructive cleaning pipeline.
    
8. Basic univariate and bivariate analysis.
    
9. Core statistical summaries.
    
10. ECharts visualizations.
    
11. Analytical artifacts and provenance.
    
12. HTML report export.
    
13. Project backup and restore.
    
14. Guided Mode as the primary experience.
    
15. Basic Advanced Mode for parameter configuration and exploration.
    

### 10.3 Explicit MVP Non-Goals

The following are not release prerequisites:

- AI interpretation.
    
- Public plugin marketplace.
    
- Team collaboration.
    
- Cloud workspace.
    
- Full machine learning training.
    
- Exhaustive coverage of every statistical method.
    
- Advanced segmentation and pattern discovery.
    

These capabilities remain part of the long-term product roadmap.

---

## 11. MVP Acceptance Criteria

### 11.1 Functional Acceptance

A user must be able to complete this workflow without manual backend intervention:

**Import → Snapshot → Profile → Assess Quality → Clean → Analyze → Visualize → Report**

Additional requirements:

- Original data remains immutable.
    
- Pipeline changes produce new revisions.
    
- Artifacts identify their dataset, snapshot, method, and execution context.
    
- Failed operations do not corrupt successful results.
    

### 11.2 Analytical Correctness

- Statistical results pass reference dataset tests.
    
- Edge cases are handled.
    
- Exact and approximate results are clearly distinguished.
    
- Method assumptions and limitations are presented.
    
- No fabricated statistical values.
    
- No unsupported causal claims.
    

### 11.3 Reliability

- Autosave works.
    
- Crash recovery works.
    
- Backup can be restored.
    
- Interrupted jobs are detected.
    
- Corrupt or missing artifacts are handled safely.
    

### 11.4 Performance

Benchmark against defined hardware and dataset tiers:

- **Small:** Interactive operations should feel responsive.
    
- **Medium:** Background execution must preserve UI responsiveness.
    
- **Large:** Adaptive execution, progress reporting, and bounded memory must work.
    

Specific numerical performance targets will be established through benchmark testing.

### 11.5 Security & Privacy

- Strict IPC validation.
    
- Protected secrets.
    
- No arbitrary third-party plugin execution in MVP.
    
- Product telemetry remains opt-in.
    
- No raw dataset upload by default.
    
- Project and report exports are validated.
    

### 11.6 Release Quality

- Unit, integration, and E2E tests pass.
    
- Statistical reference tests pass.
    
- Backup/restore tests pass.
    
- Cross-platform smoke tests pass.
    
- Critical security issues are resolved.
    
- Known limitations are documented.
    
- Sample project and onboarding are available.
    

---

## 12. Product Success Metrics

Success should be evaluated through measurable product outcomes, not feature count alone.

|Dimension|Success Indicator|
|---|---|
|Workflow Completion|Users can complete the core EDA workflow end-to-end|
|Analytical Correctness|Reference statistical tests pass|
|Reproducibility|Results can be regenerated from recorded inputs and configurations|
|Data Integrity|Original snapshots remain immutable|
|Reliability|Autosave, recovery, and restore work correctly|
|Usability|Beginners can complete common EDA tasks in Guided Mode|
|Professional Utility|Analysts can configure and execute supported methods in Advanced Mode|
|Performance|Dataset tiers meet defined benchmark budgets|
|Extensibility|Future extensions can use stable public contracts|
|Privacy|No unauthorized dataset or telemetry transmission|

Quantitative targets and measurement procedures will be established during implementation planning and benchmarking.

---

## 13. Product Constraints

1. Desktop-first deployment.
    
2. Local-first data ownership.
    
3. Python is the primary backend language.
    
4. Core EDA must work without cloud AI.
    
5. MVP prioritizes comprehensive foundational EDA over advanced AI capabilities.
    
6. Large datasets require adaptive execution.
    
7. Original data and analytical artifacts must remain reproducible.
    
8. Third-party execution requires explicit governance and isolation.
    
9. Windows, macOS, and Linux are target platforms.
    
10. Core product functionality must not depend on telemetry.
    

---

## 14. Definition of Product Success

EDA Workbench is successful when:

- Beginners can perform meaningful EDA without extensive coding.
    
- Professional analysts retain sufficient analytical control.
    
- Data preparation is safe and non-destructive.
    
- Statistical outputs are trustworthy.
    
- Analytical workflows are reproducible.
    
- Results can be communicated through understandable reports.
    
- The platform can evolve through governed extensions.
    
- Users retain control over their data and privacy.
    

**Final Product Principle:**

Build a trustworthy analytical workspace that makes rigorous EDA easier, more accessible, reproducible, and extensible—without sacrificing analytical correctness or user control.