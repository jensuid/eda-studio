# 12 — Reporting & Export Architecture

**Project:** EDA Workbench  
**Document:** 12 — Reporting & Export Architecture  
**Version:** 0.3  
**Status:** Draft for Review — Revised for Review (WP-16)  
**Depends on:** Documents 01–11

> **Revision note (WP-16):** v0.3 closes IN-G remainder by defining the required-section policy (Doc12 §10.2) and harmonizes export outcome terminology with Doc11 §15.2 (F-08B-04 follow-up). Corrects stale `Status: Draft` header (IN-D). No lifecycle or provenance-model changes.

---

## 1. Purpose

Dokumen ini mendefinisikan architecture untuk mengubah hasil exploratory data analysis menjadi output yang terstruktur, dapat dipahami, dapat dibagikan, dan reproducible.

Reporting & Export Architecture harus mendukung tiga kebutuhan berbeda:

1. **Communicate Insights** — menyampaikan temuan kepada business stakeholders.
    
2. **Document Analysis** — merekam metodologi, hasil, dan keterbatasan analisis.
    
3. **Export Data & Project** — menyediakan data atau workspace untuk penggunaan lebih lanjut.
    

Reporting bukan sekadar proses mengambil screenshot chart dan memasukkannya ke PDF. Reporting merupakan proses kurasi, validasi, rendering, dan packaging atas artifacts yang sudah dihasilkan oleh EDA Workbench.

## 2. Design Principles

|Principle|Description|
|---|---|
|Artifact-driven|Reports dibangun dari persisted artifacts|
|Evidence-grounded|Findings dan claims harus memiliki evidence references|
|Reproducible|Report mencatat sumber data dan execution provenance|
|User-controlled|User menentukan konten dan urutan report|
|Non-destructive|Export tidak mengubah project source|
|Format-aware|Setiap output menggunakan format yang sesuai|
|Privacy-first|Export mengikuti data classification|
|Staleness-aware|Report tidak boleh diam-diam menggunakan stale artifacts|
|Extensible|Format dan templates dapat diperluas|

## 3. Export Taxonomy

EDA Workbench membedakan tiga export categories.

### 3.1 Report Export

Tujuan: menyampaikan hasil analisis.

Contoh:

- Executive Report.
    
- Exploratory EDA Report.
    
- Technical Analysis Report.
    

Output:

- HTML.
    
- PDF.
    

### 3.2 Dataset Export

Tujuan: mengekspor data untuk penggunaan eksternal.

Contoh:

- Cleaned dataset.
    
- Filtered dataset.
    
- Joined dataset.
    
- Aggregated dataset.
    

Target formats:

- CSV.
    
- Parquet.
    
- Excel (XLSX).
    
- JSON (untuk kebutuhan interoperabilitas yang sesuai).
    

### 3.3 Project Export

Tujuan: memindahkan atau membagikan keseluruhan workspace.

Output:

- `.edaworkspace` portable package.
    
- Project backup package.
    

Project Export berbeda dari Report Export dan Dataset Export. Report Export tidak boleh secara implisit membawa original datasets atau keseluruhan project.

## 4. Reporting Architecture Overview

```
┌──────────────────────────────────────────────┐
│              Reporting Workspace            │
│                                              │
│ Report Builder / Template Selection          │
│ Section Ordering / Content Selection          │
└──────────────────────┬───────────────────────┘
                       v
┌──────────────────────────────────────────────┐
│             Report Specification             │
│                                              │
│ Report Metadata                              │
│ Sections / Layout / Style                    │
│ Artifact References                          │
│ Finding References                           │
└──────────────────────┬───────────────────────┘
                       v
┌──────────────────────────────────────────────┐
│             Report Validation                │
│                                              │
│ Reference Integrity                          │
│ Freshness Validation                          │
│ Evidence Validation                           │
│ Privacy / Export Policy                      │
└──────────────────────┬───────────────────────┘
                       v
┌──────────────────────────────────────────────┐
│              Report Renderer                 │
│                                              │
│ HTML Renderer                                │
│ PDF Renderer                                 │
│ Asset Resolver                               │
│ Template Engine                              │
└──────────────────────┬───────────────────────┘
                       v
┌──────────────────────────────────────────────┐
│              Export Manager                  │
│                                              │
│ Destination Validation                      │
│ Packaging / File Publication                │
│ Integrity Verification                      │
└──────────────────────┬───────────────────────┘
                       v
                 Export Artifact
```

Dataset Export dan Project Export menggunakan Export Manager, tetapi memiliki pipeline dan validation rules tersendiri.

## 5. Reporting Bounded Context

Reporting menjadi bounded context tersendiri.

### 5.1 Core Components

|Component|Responsibility|
|---|---|
|Report Manager|Lifecycle dan report orchestration|
|Report Specification Manager|Menyimpan report structure|
|Report Builder|Mengatur section dan content|
|Template Registry|Menyediakan report templates|
|Content Resolver|Mengambil referenced artifacts|
|Report Validator|Validasi evidence, freshness, dan completeness|
|Report Renderer|HTML/PDF generation|
|Asset Resolver|Chart, image, dan attachment resolution|
|Export Manager|Mengatur output dan packaging|
|Export Policy Evaluator|Memeriksa privacy dan permission|
|Export History Manager|Mencatat hasil export|

### 5.2 Domain Ownership

Reporting owns:

- Report Specification.
    
- Report Section.
    
- Report Template Reference.
    
- Report Export Execution.
    
- Export History.
    
- Export Metadata.
    

Reporting does not own:

- Dataset contents.
    
- Statistical results.
    
- Visualization specifications.
    
- Findings.
    
- AI-generated interpretations.
    

Komponen tersebut tetap dimiliki bounded context masing-masing dan direferensikan melalui stable IDs.

## 6. Report Domain Model

### 6.1 Report

Representasi satu report yang disimpan dalam project.

Attributes:

- `report_id`
    
- `project_id`
    
- `title`
    
- `description`
    
- `report_type`
    
- `specification_version`
    
- `template_reference`
    
- `created_at`
    
- `updated_at`
    
- `created_by`
    
- `status`
    

### 6.2 Report Specification

Deklarasi struktur report.

Attributes:

- `specification_id`
    
- `report_id`
    
- `sections`
    
- `theme`
    
- `page_configuration`
    
- `language`
    
- `format_preferences`
    

Specification menyimpan references, bukan duplikasi isi artifacts.

### 6.3 Report Section

Contoh section types:

- Cover.
    
- Executive Summary.
    
- Business Context.
    
- Dataset Overview.
    
- Data Quality.
    
- Univariate Analysis.
    
- Relationship Analysis.
    
- Anomaly & Pattern Discovery.
    
- Findings.
    
- Recommendations.
    
- Methodology.
    
- Limitations.
    
- Appendix.
    

Setiap section dapat memuat references ke:

- Dataset.
    
- Analysis Artifact.
    
- Visualization Artifact.
    
- Observation.
    
- Finding.
    
- Approved narrative.
    

### 6.4 Report Execution

Setiap render/export menghasilkan execution record.

Attributes:

- `report_execution_id`
    
- `report_id`
    
- `specification_revision`
    
- `source_artifact_revisions`
    
- `rendered_at`
    
- `output_format`
    
- `output_location`
    
- `status`
    
- `validation_summary`
    
- `renderer_version`
    
- `content_fingerprint`
    

## 7. Report Types

### 7.1 Executive Report

Audience: business stakeholders dan decision makers.

Karakteristik:

- Concise.
    
- Insight-oriented.
    
- Business context first.
    
- Limited technical detail.
    
- Clear recommendations and caveats.
    

Typical sections:

1. Executive Summary.
    
2. Business Context.
    
3. Key Findings.
    
4. Important Visualizations.
    
5. Business Implications.
    
6. Limitations.
    
7. Recommended Next Steps.
    

### 7.2 Exploratory EDA Report

Audience: analysts dan cross-functional stakeholders.

Karakteristik:

- Broad coverage of EDA workflow.
    
- Visual and statistical evidence.
    
- Data quality context.
    
- Patterns and anomalies.
    
- Findings and open questions.
    

Typical sections:

1. Project Overview.
    
2. Dataset Overview.
    
3. Data Quality Assessment.
    
4. Cleaning and Preparation.
    
5. Univariate Analysis.
    
6. Relationship Analysis.
    
7. Anomaly and Pattern Discovery.
    
8. Findings.
    
9. Hypotheses.
    
10. Modeling Readiness.
    
11. Limitations.
    

### 7.3 Technical Analysis Report

Audience: data analysts, data scientists, and engineering teams.

Karakteristik:

- Methodology-oriented.
    
- Detailed execution metadata.
    
- Statistical assumptions.
    
- Query and transformation lineage.
    
- Reproducibility details.
    

Typical sections:

1. Technical Overview.
    
2. Dataset Schema and Snapshots.
    
3. Transformation History.
    
4. Analysis Methods.
    
5. Statistical Results.
    
6. Validation and Assumptions.
    
7. Execution Provenance.
    
8. Limitations.
    
9. Technical Appendix.
    

Ketiga report types menggunakan shared Report Specification model, bukan tiga independent rendering systems.

## 8. Report Builder Architecture

Report Builder menyediakan dua cara menyusun report:

### 8.1 Template-Based

User memilih template dan sistem menghasilkan initial report structure.

Contoh:

- Executive EDA Template.
    
- Comprehensive EDA Template.
    
- Technical EDA Template.
    

### 8.2 Custom Builder

User dapat:

- Menambah atau menghapus sections.
    
- Mengatur urutan.
    
- Memilih findings.
    
- Memilih charts dan analysis artifacts.
    
- Mengedit narrative.
    
- Mengatur theme dan page layout.
    
- Menambahkan notes dan limitations.
    

### 8.3 Content Ownership

Report dapat menyimpan authored narrative dan curated content.

Namun:

- Statistical values harus berasal dari artifacts.
    
- AI-generated text harus memiliki provenance.
    
- Finding references harus tetap mengarah ke Findings Manager.
    
- Report tidak boleh mengubah underlying analysis artifacts.
    

## 9. Artifact Resolution and Evidence Validation

Sebelum rendering, Content Resolver mengambil seluruh references.

Validation checks:

1. Reference existence.
    
2. Artifact revision.
    
3. Dataset snapshot compatibility.
    
4. Execution success.
    
5. Evidence availability.
    
6. Permission and classification.
    
7. Asset availability.
    

### 9.1 Evidence Requirements

Quantitative claims harus memiliki reference ke deterministic analysis artifacts.

Contoh:

- Mean, median, and standard deviation.
    
- Correlation coefficients.
    
- Statistical test results.
    
- Sample size.
    
- Confidence intervals.
    
- Outlier counts.
    

AI-generated interpretations tidak boleh menjadi sumber tunggal numerical claims.

### 9.2 Missing References

Jika sebuah artifact tidak ditemukan:

- Mark section as incomplete.
    
- Show validation warning.
    
- Allow user to remove or replace the reference.
    
- Block export jika required evidence tidak terpenuhi.
    

## 10. Freshness and Staleness Validation

Report harus mempertimbangkan artifact freshness.

### 10.1 Validation States

|State|Meaning|
|---|---|
|Current|Semua referenced artifacts sesuai dengan revision yang diharapkan|
|Stale|Source atau dependency berubah|
|Missing|Referenced artifact tidak tersedia|
|Invalid|Artifact gagal integrity atau validation checks|
|Incomplete|Report masih memiliki required content yang belum terpenuhi|

### 10.2 Export Policy

- Current: boleh diekspor.
    
- Stale: warning dan explicit user confirmation.
    
- Missing: user harus memperbaiki atau menghapus reference.

### 10.2.1 Required-Section Policy (IN-G closure, WP-16)

A report type definition (Doc12 §7) declares its **required sections**: the minimum set of sections that must be present and pass validation (`Current`) before a report may be published as a final export. The policy is:

- **Final export is blocked unless every required section of the report type is present, non-empty, and in `Current` state.** Required sections are fixed per report type in the report-type definition; a report instance cannot waive them.
- A report with any `Missing`/`Invalid` required section, or any section in `Incomplete` state, yields validation outcome `Incomplete` and may only be exported as an explicitly marked draft.
- Optional sections (per report-type definition) do not block final export; their absence or `Stale` state is disclosed in the export provenance record.
- The set of required sections applied is recorded in the export provenance record (Doc12 §17) so the decision is auditable.
- Changing a report type's required-section set is a report-specification revision (new `specification_version`), never a silent edit.
    
- Invalid: block affected content atau export.
    
- Incomplete: allow draft export hanya jika user memahami statusnya dan report clearly marked as draft/incomplete; **final export mengikuti required-section policy** (§10.2.1).
    

Report execution harus merekam exact source revisions yang digunakan. Dengan demikian, exported report tetap dapat ditelusuri walaupun project berkembang setelahnya.

## 11. Rendering Architecture

### 11.1 HTML Renderer

HTML menjadi primary rendering target.

Keuntungan:

- Native browser rendering.
    
- Flexible layout.
    
- Responsive presentation.
    
- Interactive chart support.
    
- Easier preview.
    
- Reusable report templates.
    

### 11.2 PDF Renderer

PDF menjadi presentation dan distribution format.

Requirements:

- Consistent page layout.
    
- Headers and footers.
    
- Page numbering.
    
- Table pagination.
    
- Image and chart embedding.
    
- Font handling.
    
- Metadata.
    
- Print-friendly styles.
    

PDF output harus diuji terhadap chart clipping, broken page breaks, missing fonts, dan layout overflow.

### 11.3 Chart Rendering

Charts berasal dari persisted Visualization Specifications dan referenced analysis artifacts.

Rendering harus:

- Resolve chart data and configuration.
    
- Preserve chart labels and units.
    
- Provide static representation for PDF.
    
- Preserve source attribution where applicable.
    
- Avoid relying on live application state.
    

### 11.4 Template Engine

Templates harus versioned dan declarative.

Template metadata:

- `template_id`
    
- `template_version`
    
- `supported_report_types`
    
- `supported_sections`
    
- `renderer_requirements`
    
- `compatibility`
    

Untrusted templates tidak boleh mengeksekusi arbitrary application code.

## 12. Dataset Export Architecture

Dataset Export menggunakan declarative Export Specification.

### 12.1 Export Specification

- Dataset reference.
    
- Snapshot reference.
    
- Optional transformation/view reference.
    
- Selected columns.
    
- Optional filters.
    
- Output format.
    
- Encoding and delimiter.
    
- Null representation.
    
- Destination.
    

### 12.2 Supported Formats

|Format|Intended Use|
|---|---|
|CSV|Broad interoperability|
|Parquet|Analytical workflows|
|XLSX|Spreadsheet-oriented workflows|
|JSON|Structured interchange|

### 12.3 Export Validation

Sebelum export:

- Validate source snapshot.
    
- Validate transformations.
    
- Validate output format constraints.
    
- Estimate output size.
    
- Check destination permissions.
    
- Evaluate classification.
    
- Warn about sensitive columns.
    
- Confirm overwrite behavior.
    

### 12.4 Large Dataset Export

Large datasets harus diproses melalui execution engine, bukan dimuat seluruhnya ke frontend memory.

Requirements:

- Streaming or partitioned export.
    
- Resource-aware execution.
    
- Progress reporting.
    
- Cancellation.
    
- Temporary staging.
    
- Atomic publication where supported.
    
- Integrity verification.
    

## 13. Project Export Architecture

Project Export menghasilkan portable `.edaworkspace` package.

Package dapat mencakup:

- Project metadata.
    
- Dataset snapshots yang dipilih.
    
- Transformation history.
    
- Analysis artifacts.
    
- Visualization specifications.
    
- Findings and observations.
    
- Report specifications.
    
- Required project configuration.
    

### 13.1 Export Profiles

Proposed profiles:

|Profile|Contents|
|---|---|
|Metadata Only|Project structure and references|
|Analysis Workspace|Metadata and selected analytical artifacts|
|Full Portable Project|Metadata and selected or all required data payloads|

Profile harus menjelaskan secara eksplisit apa yang disertakan dan dikecualikan.

### 13.2 Integrity and Portability

- Include manifest.
    
- Include format/schema versions.
    
- Include content checksums.
    
- Validate package before import.
    
- Prevent path traversal.
    
- Avoid including credentials and secrets.
    
- Provide compatibility checks.
    
- Report missing optional dependencies.
    

Project Export harus mengikuti format versioning dan migration policy dari Document 04.

## 14. Export Manager

Export Manager mengorkestrasi semua export jobs.

Responsibilities:

- Validate Export Specification.
    
- Resolve source references.
    
- Check permissions and policies.
    
- Estimate resource requirements.
    
- Submit export job.
    
- Track progress.
    
- Publish output safely.
    
- Verify output integrity.
    
- Record export history.
    

Export Manager menggunakan Job Manager dan Processing Architecture yang telah didefinisikan pada Document 05.

Long-running exports tidak boleh berjalan di UI atau IPC thread.

## 15. Export Lifecycle

```
Draft → Content Selection and Resolution → Validation
      → Final Payload Preparation
      → Policy Evaluation (bound to final payload and destination)
      → Resource Planning → Execution → Staging
      → Integrity Verification → Publication → Completed
```

Possible terminal states are `Completed`, `Failed`, `Cancelled`, `Blocked`, and `PartiallyCompleted` only where the export type explicitly permits partial output and discloses it.

Policy evaluation occurs after export content, resource set, output format/options, and destination category are resolved sufficiently to identify the exact payload subject to publication. The decision is bound to that evaluated payload and context, not to a detached export request.

The policy-evaluation subject includes, at minimum:
- Initiating actor/principal and relevant authorization context.
- Selected source resources and artifact references, including relevant revisions/snapshot identifiers.
- Included content/sections/columns/fields and applicable filtering/minimization choices.
- Data classifications and sensitive-data labels applicable to selected content.
- Output format, renderer/exporter identity and version, and material export options.
- Destination category and validated destination reference/attributes.
- Applicable policy identity/version and decision outcome.

Any material change after evaluation—including resource set, included content, filtering, classification, output format/options, renderer behavior that changes the payload, actor/authorization context, or destination—invalidates the prior decision and requires re-evaluation before publication. Mandatory policy controls fail closed if they cannot be evaluated or reliably bound to the final payload.

The execution record preserves the policy evaluation identity and payload/context fingerprint. A policy decision must not be reused for a materially different payload or destination.

If publication fails, temporary output is cleaned up or retained in an explicit recovery state. Export must not leave a final file that appears valid but is incomplete.

## 16. Export Security and Privacy

Export integrates with Document 11 and the security authorization foundation.

Required controls:
- Resource-level authorization for the actor and selected resources.
- Data classification evaluation over the content actually selected for export.
- Data minimization and exclusion of content unnecessary for the export purpose.
- PII/sensitive-data warnings or restrictions as required by policy.
- Explicit destination validation and destination-category binding.
- No secret export.
- Safe path handling and overwrite confirmation.
- Policy evaluation against the final payload as defined in §15.
- Audit event generation correlated with export provenance.
- Diagnostic and error redaction.
- Fail-closed behavior when mandatory authorization/classification/export restrictions cannot be evaluated or enforced.

The policy decision identifies one of the Doc11 §15.2 outcomes — allow, allow with user acknowledgement/confirmation, allow with additional authorization, or deny — with policy identity/version and an auditable reason/reference. `Restricted/conditional` (used descriptively elsewhere in this document) means exactly one of acknowledgement-conditional or additional-authorization-conditional and must never be read as authorization by itself: an acknowledgement is not authorization (Doc11 §15.2). Authorization is bound to the initiating actor/principal, requested operation, resource set, final payload subject, and destination context.

Approval, when required by policy, is bound to the exact export action and evaluated payload/context. A changed payload, destination, or material option requires new approval/policy evaluation. This document does not define a new role model, policy engine, DLP product, or enforcement technology.

Sensitive export audit records identify actor, operation, resources by reference, format, destination category, policy outcome, and correlation identifiers without recording raw exported data. Security audit ownership and event integrity follow Document 11; export provenance remains a separate domain record.

## 17. Export History and Provenance

Each export execution produces a retained provenance record. Immutability means retained execution evidence is not silently rewritten; corrections or later verification results are appended as linked records/events according to the owning persistence and audit architecture. This does not guarantee that an external destination file remains unchanged after publication.

The provenance record captures, where applicable:
- Unique `export_id` and export execution/job/attempt identity.
- Initiating actor/principal and session or request context sufficient for attribution.
- Creation, policy-evaluation, execution, publication, and verification timestamps.
- Export type and exact output format.
- Export specification identity and revision.
- Source resource/artifact references and relevant source revisions/snapshot identifiers.
- Selected content scope, material filtering/minimization choices, and material export parameters/options.
- Renderer/exporter identity and version.
- Destination category and safe destination reference/descriptor; no secrets or credentials.
- Policy identity/version, decision identity/reference, outcome, and reason/reference.
- Approval reference and action/payload/context binding when approval was required.
- Correlation reference to the separate security audit event (Doc11/SEC-012).
- Validation outcome, execution status, and failure/recovery references where applicable.
- Output integrity evidence, such as a content fingerprint/check result for the produced artifact at publication, with subject and verification time identified.

The output integrity reference establishes evidence about the artifact as produced or verified at a stated time. It does not prove the artifact remains unchanged after it leaves the application-controlled publication boundary. Later verification, if supported, records a new result linked to the original export record rather than mutating the historical result.

Export provenance and security audit are distinct records with distinct ownership. The export record captures domain execution lineage; the security audit record captures security-relevant actor/action/resource/policy enforcement. They are correlated by stable references, not collapsed into one record.

This architecture does not select WORM storage, blockchain, a cryptographic algorithm, a particular fingerprint implementation, or a storage product. Those choices remain subject to separate decisions and threat-model review.

## 18. UX Integration

### 18.1 Reporting Workspace

Guided Mode:

- Recommend report template.
    
- Suggest relevant findings and charts.
    
- Explain missing evidence.
    
- Highlight stale artifacts.
    
- Guide final review.
    

Advanced Mode:

- Direct report specification editing.
    
- Detailed section and artifact selection.
    
- Export parameters.
    
- Technical provenance configuration.
    

### 18.2 Export Experience

User harus dapat:

- Preview output.
    
- Review included content.
    
- Review warnings.
    
- Select destination.
    
- Monitor progress.
    
- Cancel supported jobs.
    
- Open completed output.
    
- Inspect export history.
    

### 18.3 User Confirmation

Confirmation diperlukan untuk:

- Overwriting existing files.
    
- Exporting sensitive data.
    
- Exporting stale content.
    
- Creating full portable project packages.
    
- Any export action with material privacy implications.
    

## 19. MVP Scope

### Required for MVP

- Shared Report Specification model.
    
- Executive, Exploratory EDA, and Technical templates.
    
- Custom section ordering and content selection.
    
- HTML report generation.
    
- PDF report generation.
    
- Dataset export to CSV and Parquet.
    
- XLSX export if implementation complexity remains manageable.
    
- Portable Project Export with manifest and integrity checks.
    
- Artifact reference validation.
    
- Stale artifact warnings.
    
- Export Manager and Job Manager integration.
    
- Progress and cancellation.
    
- Export history and provenance.
    
- Classification and permission checks.
    

### Deferred

- Rich interactive online report hosting.
    
- Collaborative report editing.
    
- Scheduled report generation.
    
- Automated email distribution.
    
- Advanced report analytics.
    
- Organization-wide template marketplace.
    
- Advanced document formats.
    
- External publishing integrations.
    

## 20. Key Architecture Decisions

|ID|Decision|Status|
|---|---|---|
|REP-001|Reporting is a dedicated bounded context|Proposed|
|REP-002|Shared Report Specification across report types|Proposed|
|REP-003|Reports reference artifacts rather than duplicate source data|Proposed|
|REP-004|HTML is the primary rendering target|Proposed|
|REP-005|PDF is a distribution format|Proposed|
|REP-006|Report freshness validation is mandatory|Proposed|
|REP-007|Quantitative claims require deterministic evidence|Proposed|
|REP-008|Dataset Export is separate from Report Export|Confirmed in product scope|
|REP-009|Project Export is separate from Report and Dataset Export|Confirmed in product scope|
|REP-010|All long-running exports use Job Manager|Confirmed|
|REP-011|Export policy integrates with security and data classification|Proposed|
|REP-012|Export executions retain immutable provenance|Proposed|

## 21. Deferred Decisions

- Exact PDF rendering technology.
    
- Exact HTML template technology.
    
- XLSX library and formatting capabilities.
    
- `.edaworkspace` package internals.
    
- Export size limits.
    
- Default report template contents.
    
- Localization and font strategy.
    
- Export retention and cleanup.
    
- Template compatibility and migration policy.
    
- Whether report narratives are versioned independently from report specifications.
    

## 22. Traceability

|Related Document|Relationship|
|---|---|
|01 — Product Vision & Requirements|Reporting and export requirements|
|02 — System Architecture|Reporting module and runtime|
|03 — Domain Model|Report and export domain ownership|
|04 — Data & Persistence Architecture|Storage and portable workspace|
|05 — Processing & Execution Architecture|Export execution and jobs|
|06 — Application & IPC Architecture|Export commands, queries, and events|
|07 — Frontend Architecture|Reporting workspace UI|
|08 — UX & Interaction Architecture|Guided reporting and confirmation|
|09 — Plugin & Extension Architecture|Future custom exporters and templates|
|10 — AI Architecture & Governance|AI-generated narrative governance|
|11 — Security, Privacy & Threat Model|Export authorization and privacy|

## 23. Completion Criteria

Dokumen ini dianggap lengkap apabila:

- Report, Dataset, dan Project Export dibedakan dengan jelas.
    
- Report Specification dan Report Execution model didefinisikan.
    
- Report types dan templates memiliki shared architecture.
    
- Evidence dan freshness validation tersedia.
    
- HTML/PDF rendering lifecycle didefinisikan.
    
- Dataset Export mendukung scalable execution.
    
- Project Export memiliki manifest dan integrity checks.
    
- Export Manager terintegrasi dengan Job Manager.
    
- Privacy, permissions, dan audit terintegrasi.
    
- Export provenance dapat ditelusuri.
    
- MVP scope dan deferred capabilities jelas.