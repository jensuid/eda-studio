# 08 — UX & Interaction Architecture

**Project:** EDA Workbench  
**Document:** 08 — UX & Interaction Architecture  
**Version:** 0.3  
**Status:** Draft — Revised for Review  
**Depends on:** Documents 01–07

---

## 1. Purpose

Dokumen ini mendefinisikan bagaimana pengguna berinteraksi dengan EDA Workbench untuk menyelesaikan exploratory data analysis secara terarah, transparan, dan reproducible.

Fokusnya bukan sekadar visual layout, tetapi juga:

- Bagaimana pengguna bergerak melalui EDA workflow.
    
- Bagaimana Guided Mode memberikan arahan tanpa membatasi eksplorasi.
    
- Bagaimana Advanced Mode memberikan kontrol langsung.
    
- Bagaimana sistem menyajikan recommendations dan analytical results.
    
- Bagaimana pengguna menyetujui transformations dan analysis plans.
    
- Bagaimana errors, warnings, stale artifacts, dan execution states dikomunikasikan.
    
- Bagaimana pengguna memahami provenance dan keterbatasan hasil analisis.
    

## 2. Core UX Principles

|Principle|UX Implication|
|---|---|
|Guided, not restrictive|Sistem memberi arahan, tetapi pengguna tetap dapat mengeksplorasi|
|Progressive disclosure|Detail teknis muncul ketika dibutuhkan|
|User authority|Perubahan data dan execution plans memerlukan persetujuan sesuai risikonya|
|Explainability|Recommendation harus menyertakan alasan|
|Non-destructive|Original data selalu dipertahankan|
|Reproducibility|Hasil dapat ditelusuri ke input, konfigurasi, dan execution|
|Context preservation|Navigasi tidak menghilangkan konteks pekerjaan|
|Honest uncertainty|Approximate, sampled, dan inconclusive results harus dinyatakan|
|Actionable feedback|Setiap status atau error harus membantu pengguna menentukan langkah berikutnya|

## 3. Experience Architecture

EDA Workbench memiliki dua experience modes di atas satu shared application foundation.

### 3.1 Guided Mode

Tujuan: membantu pengguna menjalankan EDA dengan pemahaman yang cukup pada setiap tahap.

Karakteristik:

- Stage-based workflow.
    
- Step-by-step guidance.
    
- Recommended next actions.
    
- Plain-language explanations.
    
- Contextual warnings.
    
- Insight-centric results.
    
- Controlled exposure terhadap advanced options.
    

### 3.2 Advanced Mode

Tujuan: memberi analis kontrol langsung atas metode, parameter, execution, dan artifacts.

Karakteristik:

- Artifact-centric workspace.
    
- Direct analysis access.
    
- Advanced parameter controls.
    
- SQL/DuckDB dan Python workflows.
    
- Detailed execution metadata.
    
- Flexible exploration tanpa harus mengikuti urutan workflow.
    

### 3.3 Shared Experience Foundation

Kedua mode berbagi:

- Project dan dataset context.
    
- Transformation history.
    
- Analysis plans.
    
- Jobs dan execution state.
    
- Results dan artifacts.
    
- Findings dan hypotheses.
    
- Lineage dan provenance.
    
- Application preferences.
    

Mode switching tidak boleh membuat duplikasi state atau kehilangan hasil.

## 4. Information Architecture

### 4.1 Primary Navigation

|Navigation Group|Purpose|
|---|---|
|Workspace|Project overview dan guided workflow|
|Data|Dataset explorer, schema, relationships|
|Preparation|Profiling, quality, transformations|
|Analysis|Statistical analysis dan visualization|
|Discovery|Patterns, anomalies, hypotheses, findings|
|Output|Artifacts dan reports|
|Extensions|Plugins dan AI capabilities|
|Settings|Application dan project preferences|

### 4.2 Contextual Navigation

Selain primary navigation, aplikasi menggunakan contextual navigation berdasarkan objek yang sedang dibuka.

Contoh:

- Dataset Detail → Overview, Schema, Quality, Profile, Lineage.
    
- Analysis Artifact → Results, Methodology, Parameters, Provenance.
    
- Finding → Evidence, Related Artifacts, Hypothesis, Report Usage.
    

Contextual navigation membantu pengguna berpindah antar-detail tanpa kehilangan konteks utama.

## 5. Guided Workflow Experience

Guided Mode mengikuti sepuluh tahapan EDA yang telah ditetapkan pada Document 01.

|Stage|User Goal|Primary Experience|
|---|---|---|
|1. Project Understanding|Memahami tujuan dan konteks analisis|Project brief|
|2. Data Ingestion|Memasukkan dataset|Import/connect wizard|
|3. Structure & Profiling|Memahami struktur data|Dataset profile|
|4. Data Quality|Mengidentifikasi masalah kualitas|Quality assessment|
|5. Cleaning & Preparation|Menyiapkan data|Transformation workspace|
|6. Univariate Analysis|Memahami distribusi variabel|Variable analysis|
|7. Relationship Analysis|Menilai hubungan variabel|Relationship explorer|
|8. Anomaly & Pattern Discovery|Menemukan pola dan anomali|Discovery workspace|
|9. Hypothesis & Modeling Readiness|Menilai pertanyaan dan kesiapan data|Research/readiness workspace|
|10. Insights & Reporting|Mengkomunikasikan hasil|Findings dan report builder|

### 5.1 Stage Structure

Setiap stage memiliki pola interaksi yang konsisten:

1. **Objective:** apa yang ingin dicapai.
    
2. **Context:** informasi yang relevan.
    
3. **Assessment:** kondisi dataset atau hasil sebelumnya.
    
4. **Recommendations:** tindakan yang disarankan.
    
5. **User Actions:** pilihan yang tersedia.
    
6. **Results:** hasil pekerjaan.
    
7. **Next Step:** rekomendasi kelanjutan.
    

Tidak semua stage harus diselesaikan secara linear. Pengguna dapat kembali ke tahap sebelumnya atau melakukan eksplorasi tambahan.

### 5.2 Workflow Status

Stage dapat memiliki status:

- Not Started
    
- Ready
    
- In Progress
    
- Needs Attention
    
- Completed
    
- Blocked
    

Status harus mencerminkan kondisi aktual. `Completed` tidak berarti hasilnya sempurna atau seluruh masalah telah diselesaikan.

## 6. Analysis Plan Review Experience

Decision Engine menghasilkan Analysis Plan yang dapat ditinjau pengguna sebelum execution.

### 6.1 Plan Review

Plan review menampilkan:

- Objective dan analytical question.
    
- Dataset dan snapshot yang digunakan.
    
- Proposed analysis steps.
    
- Methods dan parameter utama.
    
- Execution mode: Exact, Approximate, atau Sampled.
    
- Dependencies antar-task.
    
- Estimated resource requirements bila tersedia.
    
- Assumptions dan limitations.
    
- Expected artifacts.
    

### 6.2 Approval Interaction

Pengguna dapat:

- Approve plan.
    
- Reject plan.
    
- Edit supported parameters.
    
- Remove optional steps.
    
- Request a revised plan.
    

Approval berlaku untuk revision tertentu. Perubahan yang memengaruhi plan akan membatalkan approval sebelumnya.

### 6.3 Transformation Approval

Transformation approval dipisahkan dari analysis plan approval.

Pengguna harus dapat memeriksa:

- Operation yang akan dilakukan.
    
- Target dataset dan columns.
    
- Before/after preview.
    
- Expected impact.
    
- Potential information loss.
    
- Reversibility atau recovery options.
    

Tidak ada transformation yang boleh diterapkan hanya karena analysis plan disetujui.

## 7. Data Exploration Interaction

### 7.1 Dataset Explorer

Pengguna dapat:

- Melihat seluruh datasets dalam project.
    
- Membuka schema dan column metadata.
    
- Melihat profile dan quality summary.
    
- Membandingkan dataset snapshots.
    
- Melihat relationships dan lineage.
    
- Memilih dataset sebagai analysis context.
    

### 7.2 Data Preview

Preview harus:

- Menyediakan bounded row dan column display.
    
- Menunjukkan data types.
    
- Menyediakan sorting dan filtering yang sesuai.
    
- Menampilkan sampling/preview limitations.
    
- Memisahkan preview dari full analytical execution.
    

### 7.3 Column Exploration

Column detail menyajikan:

- Name dan semantic type.
    
- Physical data type.
    
- Missing-value summary.
    
- Distinct-value summary.
    
- Distribution preview.
    
- Quality issues.
    
- Related analysis artifacts.
    

## 8. Results and Insights Experience

EDA Workbench membedakan tiga tingkat informasi:

**Result → Observation → Finding**

|Level|Meaning|Example|
|---|---|---|
|Result|Output perhitungan atau analysis|Correlation coefficient|
|Observation|Interpretasi deskriptif berbasis evidence|Dua variabel menunjukkan hubungan positif|
|Finding|Kesimpulan eksploratif yang dipilih pengguna|Hubungan ini layak diteliti lebih lanjut|

### 8.1 Result Presentation

Setiap result yang relevan harus menyertakan:

- Method dan parameters.
    
- Dataset/snapshot reference.
    
- Sample size.
    
- Statistical values.
    
- Effect size dan confidence interval bila tersedia.
    
- Assumption checks.
    
- Execution mode.
    
- Limitations.
    
- Provenance.
    

### 8.2 Observation Presentation

Observation menjelaskan apa yang ditunjukkan oleh evidence.

Observation harus:

- Terhubung dengan satu atau lebih results.
    
- Menggunakan bahasa yang tidak melebih-lebihkan.
    
- Membedakan association dari causation.
    
- Menampilkan uncertainty bila relevan.
    

### 8.3 Finding Management

Pengguna dapat:

- Accept observation sebagai finding.
    
- Edit wording.
    
- Add supporting evidence.
    
- Link ke hypothesis.
    
- Add notes.
    
- Include dalam report.
    
- Archive finding.
    

AI-generated interpretation tidak otomatis menjadi confirmed finding.

## 9. Recommendation and Decision UX

Recommendations harus dapat dipahami dan dievaluasi.

Setiap recommendation idealnya menampilkan:

1. Suggested action.
    
2. Why it is recommended.
    
3. Supporting evidence.
    
4. Expected benefit.
    
5. Risks atau limitations.
    
6. Available alternatives.
    
7. Required user approval.
    

Gunakan risk-sensitive interaction:

|Risk Level|UX Behavior|
|---|---|
|Low|Informasi dan opsi melanjutkan|
|Medium|Warning dan preview|
|High|Explicit confirmation|
|Critical|Block atau authorized override|

Contoh:

- Menghitung missing-value summary: low risk.
    
- Mengubah data type: medium risk.
    
- Menghapus rows: high risk.
    
- Menimpa original data: prohibited by default.
    

## 10. Stale Artifact and Data Change UX

Artifacts dapat menjadi stale ketika input, transformation, atau upstream dependencies berubah.

UI harus membedakan:

- Current
    
- Stale
    
- Failed
    
- Blocked
    
- Refresh Available
    

Ketika artifact stale:

1. Tampilkan alasan perubahan.
    
2. Identifikasi upstream dependency yang berubah.
    
3. Jelaskan kemungkinan dampaknya.
    
4. Rekomendasikan refresh.
    
5. Minta persetujuan pengguna sebelum refresh.
    

Jangan mengubah artifact lama secara diam-diam. Historical artifacts tetap dapat diakses untuk reproducibility.

## 11. Job and Execution Feedback

### 11.1 Global Job Center

Job Center adalah pengalaman global lintas fitur untuk memantau pekerjaan asynchronous dan membuka konteks asalnya. Job Center merupakan monitoring dan interaction surface; bukan execution engine, scheduler, atau sumber lifecycle state yang independen. Backend tetap menjadi authority untuk job identity, lifecycle, progress, hasil, dan action availability. Semantik serta kontrak teknis job/event mengikuti Document 05 dan Document 06; perilaku frontend mengikuti Document 07.

**Informasi minimum yang ditampilkan, sejauh tersedia dari authoritative backend contract:**

- Stable job ID serta nama/jenis job.
- Source feature atau operation yang memulai job.
- Lifecycle status authoritative (misalnya queued, running, completed, failed, atau cancelled, sesuai vocabulary backend).
- Progress atau current task, termasuk apakah progress determinate atau indeterminate.
- Waktu mulai, elapsed/duration, dan waktu selesai bila tersedia.
- Status permintaan cancellation dan availability action.
- Ringkasan failure/error dan recovery guidance yang disediakan atau disetujui backend.
- Result/artifact references serta navigasi kembali ke konteks asal.

**Organisasi dan penemuan job:**

- Pengguna dapat memindai job lintas fitur dan membedakan active work dari terminal outcomes.
- Search, filter, sorting, grouping, pagination, serta historical visibility hanya ditawarkan sesuai query/capability dan retention contract backend; UI tidak boleh menyiratkan cakupan histori yang tidak tersedia.
- Setiap item harus mempertahankan identitas job yang stabil saat pengguna berpindah halaman, workspace, atau Guided/Advanced mode.
- Memilih item membuka detail job dan/atau konteks sumber tanpa kehilangan pekerjaan aktif pengguna.
- Empty, loading, stale, unavailable, dan partial-result states harus dibedakan. Kegagalan memuat daftar tidak boleh ditampilkan sebagai daftar kosong.

**Action dan authorization boundary:**

- Action yang tersedia ditentukan oleh authoritative capability/authorization result untuk actor, job, dan konteks terkait.
- UI hanya menyembunyikan/menonaktifkan action untuk membantu pengalaman; backend tetap wajib mengotorisasi setiap command.
- Cancellation dan retry dikirim sebagai user intent melalui kontrak backend. UI tidak mengasumsikan command diterima atau berhasil sebelum memperoleh hasil authoritative.
- Retry hanya ditawarkan jika backend menyatakan operasi aman/eligible untuk diulang dan menyediakan kontraknya.
- Job Center tidak mengubah job state secara lokal dan tidak membuat transisi lifecycle sendiri.

**Hubungan dengan notifikasi:** Job Center adalah tempat pemantauan dan penelusuran job yang persisten dalam aplikasi. Notification surface berfungsi sebagai attention cue atau ringkasan peristiwa yang relevan, bukan salinan kedua dari job lifecycle. Notifikasi job harus merujuk pada stable job ID dan membuka detail/konteks job yang tepat. Menghapus atau men-dismiss notifikasi tidak membatalkan, menghapus, atau mengubah job. Job status tetap dapat diperiksa melalui Job Center sesuai availability dan retention backend.

### 11.2 Execution Detail

Detail execution mencakup:

- Overall job status.
    
- Task DAG.
    
- Task status.
    
- Progress.
    
- Execution duration.
    
- Engine dan strategy.
    
- Resource usage bila tersedia.
    
- Error dan retry history.
    

### 11.3 Cancellation and Retry

- Cancellation harus menjelaskan bahwa operasi mungkin memerlukan waktu untuk mencapai safe checkpoint.
- UI membedakan user intent/request, acknowledgement, cancellation in progress, dan terminal outcome hanya jika backend contract mengekspos status tersebut.
- Jangan menyajikan job sebagai cancelled hanya karena pengguna menekan tombol cancel; tampilkan hasil authoritative backend.
- Retry hanya tersedia jika operation/job dinyatakan eligible oleh backend. UI tidak boleh melakukan automatic retry dengan mengasumsikan idempotency.
- Failed tasks dan blocked dependents harus dibedakan.
- Successful independent tasks tetap dipertahankan dan ditampilkan sesuai hasil authoritative.
- Bila command timeout atau respons ambigu, tampilkan status belum terkonfirmasi dan lakukan reconciliation; jangan mengirim ulang command secara membabi buta.


## 12. Error and Notification UX

### 12.1 Notification Categories

|Category|Example|
|---|---|
|Success|Import completed|
|Information|New artifact available|
|Warning|Analysis assumptions not fully met|
|Error|Job failed|
|Critical|Project storage integrity issue|

### 12.2 Notification Principles

Notifikasi membantu pengguna mengetahui peristiwa yang relevan tanpa memutus alur kerja secara tidak perlu.

**Purpose and priority**

- Setiap notifikasi harus memiliki tujuan yang jelas, kategori, tingkat urgensi, dan tindakan/tujuan navigasi yang relevan.
- Bedakan informasi yang hanya perlu tersedia untuk ditinjau kemudian dari kondisi yang membutuhkan perhatian segera.
- Informasi kritis harus tetap terlihat melalui mekanisme persisten yang sesuai; jangan mengandalkan toast sementara untuk kondisi yang memerlukan tindakan.
- Toast digunakan untuk feedback singkat dan non-blocking, bukan sebagai satu-satunya rekam jejak peristiwa penting.
- Hindari notifikasi untuk setiap perubahan kecil. Kelompokkan atau ringkas peristiwa berulang yang memiliki makna sama bila hal tersebut tidak menghilangkan informasi penting.

**Content and navigation**

- Utamakan ringkasan yang menjelaskan apa yang terjadi, objek/fitur terkait, dan mengapa pengguna perlu memperhatikannya.
- Pengguna dapat membuka sumber notifikasi atau konteks yang tepat; deep link harus mengarah ke resource yang relevan, bukan sekadar membuka halaman awal aplikasi.
- Notifikasi yang terkait job harus membawa stable job reference. Notification action tidak boleh mengubah job lifecycle kecuali tindakan tersebut secara eksplisit merupakan command terotorisasi dan dikonfirmasi melalui backend.
- Tampilkan waktu dan status read/unread secara konsisten bila didukung oleh notification contract.

**Delivery, deduplication, and user control**

- Duplicate notifications harus dihindari melalui identity/correlation semantics yang ditetapkan oleh kontrak sumber; UI tidak boleh menggabungkan item berbeda hanya karena teksnya mirip.
- Notifikasi yang terlambat, berulang, atau diterima setelah reconnect tidak boleh menurunkan state atau memicu aksi domain.
- Delivery failure atau notification feed yang belum tersinkron tidak boleh disamarkan sebagai tidak ada notifikasi.
- Preferensi, batching, grouping, retention, dan dismissal semantics harus konsisten dengan kebijakan produk/backend yang berlaku. Retention policy tetap deferred sampai ditetapkan.
- Dismiss/mark-as-read hanya memengaruhi state notifikasi sesuai kontrak; tidak menghapus artifact, audit record, job, atau hasil analisis yang dirujuk.
- Notifikasi harus menghormati authorization dan privacy boundary. Preview tidak boleh membocorkan data sensitif di luar konteks yang diizinkan.

**Relationship to Job Center**

Job Center adalah sumber pengalaman pemantauan job; notification surface adalah mekanisme perhatian dan navigasi. Notifikasi tidak menggantikan Job Center, tidak menjadi sumber authoritative lifecycle status, dan tidak menentukan apakah job berhasil. Jika status job berubah setelah notifikasi dibuat, detail job menampilkan status authoritative terbaru.

### 12.3 Error Recovery

Jika memungkinkan, error UI menyediakan:

- Cause summary.
    
- Impact.
    
- Suggested recovery.
    
- Retry availability.
    
- Link ke diagnostic details.
    

## 13. AI Interaction UX

AI merupakan assistant untuk eksplorasi, bukan sumber kebenaran kuantitatif.

UI harus membedakan:

- Deterministic statistical result.
    
- Rule-based observation.
    
- AI-generated interpretation.
    
- User-confirmed finding.
    

AI interaction harus:

- Menunjukkan data context yang akan digunakan.
    
- Meminta consent sebelum cloud processing.
    
- Menjelaskan ketika AI tidak tersedia.
    
- Tidak melakukan transformation tanpa approval.
    
- Tidak mengubah analytical results.
    
- Menyediakan traceability terhadap generated interpretation.
    

Jika AI unavailable, core EDA workflows tetap berfungsi.

## 14. Guided-to-Advanced Progressive Disclosure

Advanced controls tidak harus selalu terlihat di Guided Mode.

Contoh:

|Guided Presentation|Advanced Expansion|
|---|---|
|Distribution summary|Histogram configuration dan binning|
|Relationship overview|Statistical method dan parameters|
|Missing values|Missingness tests dan assumptions|
|Outlier warning|Detection method dan thresholds|
|Suggested chart|Full chart specification|
|Recommended cleaning|Transformation pipeline configuration|

Advanced controls harus memperluas kontrol, bukan mengubah semantics hasil secara diam-diam.

## 15. Workspace Context and Continuity

Aplikasi harus mempertahankan konteks kerja:

- Active project.
    
- Current dataset/snapshot.
    
- Selected columns.
    
- Current analysis context.
    
- Active filters.
    
- Current artifact.
    
- Running jobs.
    

Perubahan konteks yang berpotensi memengaruhi pekerjaan harus dikomunikasikan.

Contoh: berpindah dataset saat sedang mengedit transformation draft harus menghasilkan konfirmasi atau mekanisme draft preservation.

## 16. Accessibility and Interaction Standards

- Keyboard navigation untuk primary workflows.
    
- Focus management pada dialogs.
    
- Semantic labels untuk controls.
    
- Status tidak hanya dibedakan melalui warna.
    
- Tables dan charts menyediakan alternatif informasi yang dapat diakses.
    
- Confirmation dialogs menjelaskan konsekuensi.
    
- Motion tidak boleh menghambat pengguna.
    
- Empty states harus menjelaskan apa yang dapat dilakukan berikutnya.
    

## 17. UX Testing Strategy

|Test Type|Focus|
|---|---|
|Usability testing|Guided workflow comprehension|
|Task-based testing|Import, quality, cleaning, analysis|
|Mode-switch testing|State preservation|
|Recommendation testing|Understandability and trust|
|Risk interaction testing|Approval and confirmation|
|Recovery testing|Failed jobs and stale artifacts|
|Accessibility testing|Keyboard and screen readers|
|Performance testing|Large data previews and charts|

Metrik evaluasi yang relevan:

- Task completion rate.
    
- Time to complete core workflows.
    
- Error recovery rate.
    
- Recommendation acceptance rate.
    
- User understanding of statistical limitations.
    
- Accidental destructive action rate.
    
- Ability to reproduce previous analysis.
    

## 18. Key Architecture Decisions

|ID|Decision|Status|
|---|---|---|
|UX-001|Guided and Advanced modes share the same application state|Confirmed|
|UX-002|Guided Mode uses stage-based workflows|Confirmed|
|UX-003|Advanced Mode uses artifact-centric exploration|Confirmed|
|UX-004|Results, Observations, and Findings are separate concepts|Confirmed|
|UX-005|Analysis plan approval is revision-bound|Confirmed|
|UX-006|Transformation approval is separate|Confirmed|
|UX-007|Risk-based confirmation|Confirmed|
|UX-008|Stale artifacts require visible status and user-approved refresh|Confirmed|
|UX-009|Global Job Center with backend-authoritative job information, lifecycle-aware interactions, and a distinct notification boundary|Proposed|
|UX-010|Progressive disclosure of advanced controls|Proposed|
|UX-011|AI interpretation is visibly distinguished from deterministic results|Confirmed|

## 19. Deferred Decisions

- Final screen-by-screen layouts.
    
- Exact navigation labels and ordering.
    
- Detailed design tokens and visual theme.
    
- Empty-state illustrations and onboarding content.
    
- Notification retention policy.
    
- Final Job Center screen layout, detailed interaction design, and visual treatment.
    
- Exact notification grouping, batching, preference controls, and delivery presentation.
    
- Detailed accessibility implementation techniques, test procedures, evidence templates, and release-specific conformance reporting. The project conformance baseline itself is WCAG 2.2 Level AA and is not deferred.
    
- User research and usability testing protocol.
    

## 20. Traceability

|Related Document|Relationship|
|---|---|
|01 — Product Vision & Requirements|EDA workflow and personas|
|02 — System Architecture|Application runtime|
|03 — Domain Model|Projects, artifacts, findings, jobs|
|04 — Data & Persistence Architecture|Snapshots and lineage|
|05 — Processing & Execution Architecture|Plans, jobs, DAG, execution states|
|06 — Application & IPC Architecture|Commands, queries, events|
|07 — Frontend Architecture|React structure, state, navigation|
|11 — Security, Privacy & Threat Model|Authorization, protected information, and audit/privacy boundaries for job and notification interactions|
|08 — UX & Interaction Architecture|User workflows and interaction semantics|

## 21. Completion Criteria

Dokumen ini dianggap lengkap apabila:

- Guided dan Advanced experiences didefinisikan.
    
- Information architecture konsisten.
    
- Workflow stage interactions jelas.
    
- Analysis plan dan transformation approvals terpisah.
    
- Result, Observation, dan Finding dibedakan.
    
- Recommendation dan risk interactions dijelaskan.
    
- Stale artifact handling dirancang.
    
- Job Center responsibilities, backend-authoritative status presentation, lifecycle-aware actions, and source-context navigation are defined.
    
- Notification purpose, urgency, deduplication, navigation, privacy, and separation from job lifecycle are defined.
    
- Job feedback dan error recovery ditentukan.
    
- AI interactions memiliki transparency dan consent.
    
- Accessibility dan UX testing requirements tersedia.