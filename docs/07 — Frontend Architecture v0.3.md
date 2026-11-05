# 07 — Frontend Architecture

**Project:** EDA Workbench  
**Document:** 07 — Frontend Architecture  
**Version:** 0.3  
**Status:** Draft for Review — Revised for Review (WP-15)  
**Depends on:** Documents 01–06

> **Revision note (WP-15):** v0.3 adds FE-011 (React Hook Form, IN-H closure) with a decision row and technology-baseline entry. No structural changes.

---

## 1. Purpose

Dokumen ini mendefinisikan arsitektur frontend EDA Workbench menggunakan React, TypeScript, Vite, dan Apache ECharts.

Frontend bertanggung jawab atas:

- Menyediakan Guided Mode dan Advanced Mode.
    
- Mengelola navigation dan application state.
    
- Menampilkan dataset, analysis, artifacts, findings, dan reports.
    
- Mengomunikasikan user intent melalui typed IPC contracts.
    
- Menampilkan asynchronous jobs, progress, dan notifications.
    
- Menyediakan reusable component dan design system.
    
- Menjaga pengalaman pengguna tetap konsisten meskipun backend sedang degraded.
    

Frontend bukan tempat untuk menjalankan analytical computation atau menyimpan business rules.

## 2. Architecture Principles

|Principle|Description|
|---|---|
|Feature-oriented|Organisasi berdasarkan product capabilities|
|Type-safe|Strict TypeScript dan generated IPC contracts|
|Server-state separation|Backend-owned state dipisahkan dari UI state|
|Progressive disclosure|Kompleksitas ditampilkan sesuai kebutuhan|
|Shared capabilities|Guided dan Advanced menggunakan application services yang sama|
|Component consistency|Reusable design system dan component patterns|
|Responsive interaction|UI tidak menunggu long-running operations|
|Accessible by default|Keyboard, focus, contrast, dan semantic controls|
|Artifact-oriented|Analysis results dan visualizations direpresentasikan sebagai artifacts|

## 3. Technology Baseline

|Layer|Technology|
|---|---|
|UI Framework|React|
|Language|TypeScript|
|Build Tool|Vite|
|Desktop Host|PyWebView|
|Charting|Apache ECharts|
|Styling|CSS variables + CSS Modules atau equivalent scoped styling|
|IPC|Typed PyWebView bridge client|
|Contract Types|Generated TypeScript types from Pydantic schemas|
|Testing|Vitest + React Testing Library + Playwright|
|Package Management|npm-compatible package manager|
|Form State|React Hook Form (FE-011, Proposed)|

Versi library dan dependency lockfile ditentukan pada implementation setup.

## 4. Frontend Architectural Layers

```
┌─────────────────────────────────────────────┐
│                Application UI               │
│  Guided Mode / Advanced Mode / Navigation   │
├─────────────────────────────────────────────┤
│               Feature Modules                │
│ Project │ Dataset │ Analysis │ Insights      │
│ Quality │ Workflow │ Plugins │ Reporting     │
├─────────────────────────────────────────────┤
│             Shared UI & Design System        │
│ Components │ Tokens │ Layout │ Interaction   │
├─────────────────────────────────────────────┤
│              Application State              │
│ Server State │ UI State │ Session State      │
├─────────────────────────────────────────────┤
│              Frontend Services              │
│ IPC Client │ Job Client │ Event Client       │
├─────────────────────────────────────────────┤
│              PyWebView Bridge               │
└─────────────────────────────────────────────┘
```

### Layer Responsibilities

**Application UI**

- Application shell.
    
- Global navigation.
    
- Mode switching.
    
- Workspace layout.
    
- Global notifications.
    

**Feature Modules**

- Feature-specific screens, components, hooks, and state.
    
- User interaction dan feature workflows.
    
- Feature-specific data presentation.
    

**Shared UI**

- Reusable components.
    
- Design tokens.
    
- Layout primitives.
    
- Interaction patterns.
    

**Application State**

- Server state.
    
- UI state.
    
- Session state.
    

**Frontend Services**

- Typed IPC client.
    
- Job lifecycle client.
    
- Event retrieval and reconciliation.
    
- Error mapping.
    

## 5. Frontend Project Structure

Proposed structure:

```
frontend/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── AppProviders.tsx
│   │   ├── router.tsx
│   │   └── layouts/
│   │
│   ├── features/
│   │   ├── projects/
│   │   ├── datasets/
│   │   ├── profiling/
│   │   ├── data-quality/
│   │   ├── transformations/
│   │   ├── analysis/
│   │   ├── visualization/
│   │   ├── workflow/
│   │   ├── insights/
│   │   ├── hypotheses/
│   │   ├── plugins/
│   │   ├── ai/
│   │   └── reporting/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── data-display/
│   │   ├── charts/
│   │   └── feedback/
│   │
│   ├── services/
│   │   ├── ipc/
│   │   ├── jobs/
│   │   ├── events/
│   │   └── contracts/
│   │
│   ├── state/
│   │   ├── session/
│   │   ├── workspace/
│   │   └── preferences/
│   │
│   ├── hooks/
│   ├── design-system/
│   │   ├── tokens/
│   │   ├── themes/
│   │   └── styles/
│   │
│   ├── types/
│   └── utils/
│
├── public/
├── tests/
└── package.json
```

Feature modules own their internal implementation. Shared components must not depend on feature-specific business logic.

## 6. Application Shell and Navigation

### 6.1 Application Shell

The shell provides a stable frame for all application workflows.

Proposed layout:

```
┌──────────────────────────────────────────────────────────┐
│ Application Bar: Project / Mode / Global Actions         │
├──────────────┬───────────────────────────┬───────────────┤
│              │                           │               │
│ Primary      │       Main Workspace      │ Context       │
│ Navigation   │                           │ Panel         │
│              │                           │               │
│              │                           │               │
├──────────────┴───────────────────────────┴───────────────┤
│ Job / Activity / Status Area                              │
└──────────────────────────────────────────────────────────┘
```

The exact layout may adapt by feature. The shell should not force every screen into the same three-column arrangement.

### 6.2 Primary Navigation

Proposed navigation groups:

|Group|Destinations|
|---|---|
|Workspace|Overview, Workflow|
|Data|Datasets, Data Explorer, Relationships|
|Preparation|Data Quality, Transformations|
|Analysis|Univariate, Relationships, Anomaly & Patterns|
|Discovery|Hypotheses, Findings|
|Output|Visualizations, Reports|
|Extensions|Plugins, AI Settings|
|Settings|Application, Project, Preferences|

Navigation visibility may depend on project state and user mode, but feature availability must not be silently removed.

### 6.3 Navigation Principles

- Project context remains visible.
    
- Current location and navigation hierarchy are clear.
    
- Deep links to datasets, artifacts, and findings are supported where appropriate.
    
- Unsaved user changes trigger a clear confirmation flow.
    
- Long-running jobs continue when users navigate to another feature.
    
- Navigation does not implicitly cancel jobs.
    

## 7. Guided Mode and Advanced Mode

Both modes share the same backend, domain model, and artifact system.

### Guided Mode

Optimized for structured exploration.

Characteristics:

- Stage-based navigation.
    
- Step-by-step guidance.
    
- Explanations of analytical methods.
    
- Recommended next actions.
    
- Contextual validation and warnings.
    
- Insight-centric result presentation.
    
- Progressive disclosure of technical options.
    

### Advanced Mode

Optimized for direct control.

Characteristics:

- Artifact Explorer.
    
- Direct method and parameter access.
    
- SQL/DuckDB and Python workflows.
    
- Advanced statistical configuration.
    
- Custom visualization configuration.
    
- Detailed execution and lineage inspection.
    

### Mode Switching

Switching modes must preserve:

- Project and dataset selection.
    
- Existing artifacts.
    
- Transformation history.
    
- Analysis plans and approvals.
    
- Findings and hypotheses.
    
- Active job state.
    

Mode switching changes the presentation and available interaction depth, not the underlying project state.

## 8. State Management Architecture

Frontend state dibagi menjadi tiga domain kepemilikan yang berbeda: Server State, UI State, dan Session State. Klasifikasi ini menentukan siapa pemilik nilai, siapa yang berwenang mengubahnya, bagaimana nilainya disinkronkan, dan apakah salinan frontend dapat dipulihkan.

### 8.1 Server State

Server State adalah representasi sementara di frontend atas domain state dan data yang dimiliki backend. Backend tetap menjadi authoritative source of truth; cache frontend hanya salinan yang dapat stale, di-invalidasi, dibuang, dan dibangun kembali.

Contoh:

- Projects, datasets, dan dataset profiles.
- Analysis plans, artifacts, findings, dan plugin metadata.
- Job identity, lifecycle state, progress, cancellation outcome, dan execution result yang disediakan backend.
- Domain permissions atau capability outcomes yang dikembalikan backend untuk kebutuhan presentasi; bukan keputusan otorisasi yang dibuat frontend.

Ketentuan:

- Frontend tidak boleh mengubah domain truth hanya dengan memutakhirkan cache lokal.
- Mutasi domain harus melalui typed IPC command dan hasilnya dikonfirmasi oleh backend.
- Optimistic presentation, jika kelak digunakan, harus dapat direkonsiliasi dengan respons authoritative dan tidak boleh diperlakukan sebagai commit.
- Cache tidak boleh menggantikan persistence, provenance, atau reproducibility semantics.
- Server-state cache harus dapat dibuang dan direkonstruksi dari backend tanpa kehilangan domain state.

### 8.2 UI State

UI State adalah state presentasi/interaksi yang dimiliki frontend dan tidak menjadi domain truth.

Contoh:

- Open panels, selected tabs, expanded sections, dialog visibility.
- Active filters dan sorting yang hanya berlaku pada tampilan.
- Chart interaction state, hover/selection sementara, dan current navigation selection.
- Draft input yang belum dikirim sebagai domain mutation.

UI State ditempatkan sedekat mungkin dengan pemilik interaksinya. State hanya dinaikkan ke cakupan feature/application bila memang dibutuhkan lintas komponen. UI State tidak boleh digunakan sebagai pengganti status backend, termasuk job status, authorization result, atau artifact freshness.

### 8.3 Session State

Session State adalah konteks client-side lintas layar selama sesi kerja pengguna, yang tidak menggantikan identitas atau session authorization yang diverifikasi backend.

Contoh:

- Active project dan current dataset context.
- Selected workspace mode.
- Last visited location dan user presentation preferences.
- Context identifiers yang membantu pemulihan navigasi.

Persist hanya nilai yang memiliki manfaat kontinuitas yang jelas. Session State yang dipulihkan harus divalidasi terhadap backend sebelum digunakan sebagai dasar operasi. Logout, session expiry, account switch, atau perubahan akses harus membersihkan atau merevalidasi konteks yang relevan. Persistensi lokal tidak memberikan hak akses.

### 8.4 Ownership and Synchronization Rules

|State domain|Owner|Frontend role|Authority rule|
|---|---|---|---|
|Server State|Backend|Temporary cache and presentation|Backend response/reconciliation is authoritative|
|UI State|Frontend|Interaction and presentation|May be changed by UI interaction; never asserts domain mutation|
|Session State|Frontend context, subject to backend validation|Continuity across screens/reloads where appropriate|Must be revalidated; cannot grant access or override backend context|

Guided Mode dan Advanced Mode harus menggunakan domain state backend yang sama. Keduanya boleh memiliki UI State/presentation berbeda, tetapi pergantian mode tidak boleh membuat salinan domain state independen atau mengubah job lifecycle.

### 8.5 Recommended State Strategy

Gunakan pendekatan berdasarkan ownership, bukan berdasarkan pilihan library:

|State Type|Strategy|
|---|---|
|Server State|Dedicated query/cache boundary; reconstructible from backend|
|UI State|Component-local atau feature-level state sesuai cakupan penggunaan|
|Session State|Application-scoped client context dengan aturan validasi dan persistence eksplisit|
|Form state|Local draft state via React Hook Form (FE-011); commit melalui typed IPC|

TanStack Query dapat digunakan untuk server-state caching, request lifecycle, dan invalidation. Zustand dapat digunakan untuk shared client/session state bila kompleksitas membenarkannya. Keduanya tetap optional dan bukan keputusan implementasi final.

### 8.6 Cache Invalidation and Reconciliation

- Cache identity harus mencakup scope/resource identity yang diperlukan agar data antar-project, dataset, user, atau session tidak tercampur.
- Backend events adalah change signals, bukan domain truth atau perintah untuk menjalankan business logic di frontend.
- Event yang relevan dapat menandai cache entry sebagai stale atau memicu refetch terhadap resource yang ditunjuk.
- Setelah command/mutation, frontend harus menggunakan respons authoritative dan/atau melakukan refetch sesuai kontrak operasi; event yang datang tidak boleh dianggap sebagai satu-satunya bukti keberhasilan.
- Cache invalidation tidak boleh menghapus historical artifacts atau mengubah reproducibility semantics.
- Reload, reconnect, atau cache eviction harus memungkinkan frontend membangun kembali Server State dari backend.
- Jika freshness atau urutan perubahan tidak dapat dipastikan, tampilkan state yang belum terkonfirmasi dan lakukan reconciliation; jangan menyimpulkan nilai domain dari event yang hilang.


## 9. IPC Client Architecture

Semua backend communication melewati satu frontend IPC client abstraction.

Responsibilities:

- Menunggu bridge readiness.
    
- Melakukan protocol handshake.
    
- Mengirim typed commands dan queries.
    
- Menormalisasi error response.
    
- Mengelola request correlation.
    
- Menangani timeout dan retry sesuai command semantics.
    
- Menyediakan typed interfaces untuk feature modules.
    

Feature modules tidak boleh memanggil `window.pywebview.api` secara langsung.

Contoh penggunaan konseptual:

```
const result = await ipcClient.query(
  "GetDatasetProfile",
  { datasetId }
);

if (!result.success) {
  handleApplicationError(result.error);
}
```

Nama operation dan payload mengikuti generated IPC contracts dari Document 06.

## 10. Job and Event UI

Frontend menampilkan dan mengirimkan user intent terkait jobs, tetapi backend tetap menjadi pemilik dan pengelola job lifecycle. Job Client adalah adapter untuk membaca status dan mengirimkan command lifecycle yang diizinkan melalui typed IPC; bukan execution engine, scheduler, atau sumber status independen.

### 10.1 Job Center

Job Center menyediakan satu tempat lintas fitur untuk memantau dan membuka detail job. Data job harus berasal dari backend melalui typed IPC dan diperlakukan sebagai Server State.

Informasi yang ditampilkan, bila tersedia dari backend:

- Stable job ID dan job name/type.
- Source feature atau operation yang memulai job.
- Authoritative lifecycle status.
- Progress/current task beserta penanda apakah progress determinate atau indeterminate.
- Start time, elapsed/duration, dan completion time.
- Cancellation availability dan status permintaan cancellation.
- Error/failure summary dan recovery guidance yang disediakan atau disetujui backend.
- Result/artifact references dan navigasi ke konteks asal.

Job Center harus mendukung pemantauan queued, running, completed, failed, dan cancelled jobs sesuai status yang didefinisikan kontrak backend. Daftar/filter/pagination dan retention detail mengikuti kemampuan serta kebijakan backend; frontend tidak boleh mengarang status atau menganggap job lama tetap tersedia.

### 10.2 Job Lifecycle and Allowed Actions

- Backend adalah satu-satunya authority untuk menerima, menjadwalkan, menjalankan, membatalkan, menyelesaikan, atau menandai kegagalan job.
- Frontend menampilkan lifecycle status yang dikembalikan backend dan tidak membuat transisi status domain secara lokal.
- Cancellation adalah command/request kepada backend. UI membedakan permintaan cancellation, acknowledgement, cancellation in progress, dan terminal outcome hanya bila backend contract menyediakan pembedaan tersebut.
- Retry hanya ditawarkan bila backend menyatakan operasi/job dapat diulang dan menyediakan kontrak retry yang sesuai. Frontend tidak boleh mengulang command secara otomatis dengan mengasumsikan idempotency.
- Action visibility dan enabled state mengikuti capability/authorization result dari backend untuk actor, job, dan konteks terkait. Pemeriksaan UI hanya untuk UX; backend tetap melakukan enforcement.
- Setelah action, frontend menampilkan hasil authoritative dan merekonsiliasi cache/job detail. Kegagalan atau timeout tidak boleh ditampilkan sebagai keberhasilan.
- Job yang tetap berjalan setelah navigasi atau mode switching harus tetap merepresentasikan job backend yang sama, bukan job baru.

### 10.3 Progress Presentation

Progress tidak boleh memberikan kesan presisi yang tidak tersedia.

- Gunakan percentage hanya jika backend menyediakan estimasi yang valid dan kontrak menjelaskan maknanya.
- Jika tidak tersedia atau tidak bermakna, tampilkan indeterminate progress atau status tahap.
- Tampilkan task-level progress untuk DAG execution bila backend menyediakannya.
- Jangan mengasumsikan progress selalu monoton untuk semua jenis job.
- Bedakan progress dari lifecycle status; progress 100% tidak dengan sendirinya membuktikan job telah berhasil diselesaikan.

### 10.4 Event Handling and Reconciliation

Backend events merupakan sinyal perubahan yang membantu frontend menjaga cache tetap segar. Event bukan command, bukan sumber domain truth yang berdiri sendiri, dan bukan bukti final bahwa operasi berhasil.

Frontend event client harus:

1. Menerima/mengambil event melalui typed IPC contract.
2. Memvalidasi event envelope, event ID, resource/job identity, dan sequence/cursor sesuai kontrak Document 06.
3. Mendeteksi dan mengabaikan duplicate event secara aman.
4. Menangani event out-of-order tanpa menerapkan perubahan yang dapat menurunkan state ke versi yang lebih lama.
5. Mendeteksi missing event, sequence gap, cursor invalidation, atau kondisi ordering yang tidak dapat dipastikan.
6. Menggunakan event yang relevan untuk menandai cache/resource stale atau meminta refetch; jangan menjalankan domain business logic dari event handler.
7. Melakukan reconciliation terhadap authoritative backend state setelah reconnect, sequence gap, atau kondisi ambigu.
8. Menjaga idempotency pada pemrosesan sinyal event agar redelivery tidak menghasilkan efek samping ganda.

Jika event hilang, terlambat, duplikat, atau tidak berurutan, frontend harus memilih safe reconciliation/refetch daripada menebak urutan domain state. Detail sequence, cursor, replay, acknowledgement, dan recovery protocol tetap mengikuti Document 06 dan perlu diverifikasi lintas dokumen sebelum implementasi.

Event handler tidak boleh menjalankan business logic, memulai ulang job, atau menyimpulkan authorization outcome yang seharusnya diputuskan backend.

## 11. Visualization Architecture

Apache ECharts menjadi chart rendering engine utama.

### 11.1 Visualization Components

- Chart container.
    
- Chart specification editor.
    
- Semantic chart recommendation display.
    
- Axis, legend, tooltip, dan annotation controls.
    
- Interactive filters dan selections.
    
- Export controls.
    

### 11.2 Chart Specification

Chart configuration disimpan sebagai versioned artifact, bukan hanya ephemeral component state.

Frontend bertanggung jawab untuk:

- Rendering.
    
- User interaction.
    
- Visual configuration editing.
    
- Preview.
    

Backend bertanggung jawab untuk:

- Data preparation.
    
- Aggregation.
    
- Statistical computation.
    
- Artifact persistence.
    
- Provenance.
    

### 11.3 Performance

- Jangan render seluruh dataset tanpa batas.
    
- Gunakan aggregation atau sampling yang dinyatakan eksplisit.
    
- Gunakan bounded data payloads.
    
- Hindari unnecessary React re-render.
    
- Gunakan ECharts update mechanisms secara efisien.
    
- Tampilkan data mode dan limitations pada chart bila relevan.
    

## 12. Design System

Design system menjaga konsistensi visual dan interaction patterns.

### 12.1 Design Tokens

Kelompok token:

|Category|Examples|
|---|---|
|Color|Background, surface, text, border, semantic status|
|Typography|Font family, size, weight, line height|
|Spacing|Consistent spacing scale|
|Radius|Small, medium, large|
|Elevation|Surface depth and shadows|
|Motion|Duration and easing|
|Layout|Sidebar, panel, content constraints|
|Data visualization|Chart semantic colors and status palette|

Gunakan CSS variables sebagai runtime token layer.

### 12.2 Component Hierarchy

**Primitives**

- Button
    
- Input
    
- Select
    
- Checkbox
    
- Radio
    
- Tooltip
    
- Dialog
    
- Badge
    

**Composed Components**

- Data Table
    
- Filter Bar
    
- Property Panel
    
- Status Indicator
    
- Empty State
    
- Progress Panel
    
- Confirmation Dialog
    

**Domain-oriented Components**

- Dataset Card
    
- Column Profile
    
- Quality Issue
    
- Transformation Step
    
- Analysis Result
    
- Finding Card
    
- Artifact Preview
    

Domain-oriented components boleh memahami feature DTOs, tetapi shared primitives harus tetap domain-agnostic.

### 12.3 Interaction States

Setiap interactive component harus mempertimbangkan:

- Default.
    
- Hover.
    
- Focus.
    
- Active.
    
- Disabled.
    
- Loading.
    
- Error.
    
- Empty.
    
- Selected.
    

Destructive atau irreversible operations harus menggunakan explicit confirmation dan menjelaskan dampaknya.

## 13. Data Exploration UI Patterns

EDA Workbench membutuhkan beberapa reusable patterns:

**Data Table**

- Virtualized rendering.
    
- Column visibility.
    
- Sorting dan filtering.
    
- Bounded pagination atau viewport.
    
- Data type indicators.
    

**Profile View**

- Summary metrics.
    
- Distribution preview.
    
- Missing-value indicators.
    
- Semantic type information.
    
- Profiling limitations.
    

**Analysis Result**

- Statistical result.
    
- Effect size dan confidence interval bila relevan.
    
- Assumption checks.
    
- Sample size.
    
- Methodology dan limitations.
    
- Provenance reference.
    

**Artifact Explorer**

- Artifact type.
    
- Source dataset/snapshot.
    
- Execution status.
    
- Freshness status.
    
- Lineage.
    
- Open/export actions.
    

Semua pattern harus mengutamakan interpretability dan provenance, bukan hanya visual density.

## 14. Error, Loading, and Empty States

Frontend harus membedakan:

|State|UI Behavior|
|---|---|
|Loading|Skeleton atau progress indicator|
|Empty|Penjelasan dan relevant next action|
|Validation error|Field-level guidance|
|Conflict|Jelaskan stale state dan opsi refresh|
|Execution failure|Error summary dan retry jika aman|
|Permission denied|Jelaskan capability yang diperlukan|
|Backend unavailable|Connection state dan retry|
|Degraded|Tampilkan fitur yang tetap tersedia|

Error tidak boleh ditampilkan hanya sebagai generic toast jika pengguna perlu melakukan tindakan untuk menyelesaikannya.

## 15. Accessibility and Internationalization

Minimum accessibility requirements:

- Keyboard navigation.
    
- Visible focus states.
    
- Semantic HTML.
    
- Screen-reader labels.
    
- Sufficient contrast.
    
- Non-color-only status indicators.
    
- Accessible dialogs dan tables.
    
- Reduced-motion support.
    

Internationalization architecture harus mendukung:

- Externalized UI strings.
    
- Locale-aware number formatting.
    
- Date/time formatting.
    
- Configurable decimal dan thousands separators.
    

Bahasa awal dan localization rollout dapat ditentukan pada implementation planning.

## 16. Frontend Security

- Tidak menyimpan secrets dalam frontend.
    
- Tidak mempercayai data dari UI tanpa backend validation.
    
- Tidak menggunakan arbitrary dynamic code execution.
    
- Tidak membuka arbitrary external URLs melalui privileged bridge.
    
- External links dibuka melalui system browser.
    
- Gunakan strict Content Security Policy yang kompatibel dengan production deployment.
    
- Hindari unsafe HTML rendering.
    
- Plugin UI harus mengikuti extension permission boundary.
    
- Frontend hanya memperoleh data dan capabilities yang diperlukan.
    

## 17. Testing Strategy

|Test Level|Focus|
|---|---|
|Unit|Hooks, reducers, utilities, components|
|Component|Interaction, accessibility, state transitions|
|Contract|Generated TypeScript compatibility|
|Integration|Feature modules with mocked IPC|
|Visual|Critical layouts and chart rendering|
|E2E|Guided and Advanced workflows|
|Performance|Large tables, chart updates, state rendering|
|Accessibility|Keyboard, focus, semantic structure|

Critical user workflows harus memiliki E2E coverage:

- Create/open project.
    
- Import dataset.
    
- Inspect dataset profile.
    
- Review data quality.
    
- Approve and apply transformation.
    
- Run analysis.
    
- Inspect findings and artifacts.
    
- Generate report.
    

## 18. Key Architecture Decisions

|ID|Decision|Status|
|---|---|---|
|FE-001|React + TypeScript + Vite|Confirmed|
|FE-002|Feature-oriented frontend structure|Proposed|
|FE-003|Guided and Advanced share the same backend and domain state|Confirmed|
|FE-004|Separate server, UI, and session state|Proposed|
|FE-005|All backend access through typed IPC client|Confirmed by Doc 06|
|FE-006|Job Center for long-running operations|Proposed|
|FE-007|Event-driven cache invalidation and reconciliation|Proposed|
|FE-008|Apache ECharts as primary chart engine|Confirmed|
|FE-009|Versioned chart specifications as artifacts|Confirmed by product architecture|
|FE-010|Reusable design system with CSS tokens|Proposed|
|FE-011|React Hook Form for form state and validation, committed through typed IPC|Proposed — pending PO ratification (IN-H)|

## 19. Deferred Decisions

- Final state-management library selection.
    
- Final server-state caching library configuration.
    
- Router library and exact route map.
    
- Component library adoption versus custom components.
    
- Visual theme and detailed design tokens.
    
- Exact responsive breakpoints.
    
- Chart theme and color palette.
    
- Localization rollout.
    
- Frontend performance budgets.
    

## 20. Traceability

|Related Document|Relationship|
|---|---|
|01 — Product Vision & Requirements|Guided/Advanced experience|
|02 — System Architecture|Frontend/backend boundaries|
|03 — Domain Model|Domain-owned concepts and state|
|04 — Data & Persistence Architecture|Dataset and artifact references|
|05 — Processing & Execution Architecture|Jobs, DAG progress, execution results|
|06 — Application & IPC Architecture|Typed IPC, events, errors, protocol|
|07 — Frontend Architecture|UI structure and interaction architecture|

## 21. Completion Criteria

Dokumen ini dianggap lengkap apabila:

- Frontend layers dan feature boundaries jelas.
    
- Application shell dan navigation principles ditetapkan.
    
- Guided dan Advanced Mode menggunakan shared state.
    
- Server, UI, dan session state dibedakan.
    
- IPC access terpusat.
    
- Job dan event UI dirancang.
    
- Visualization architecture terdefinisi.
    
- Design system responsibilities jelas.
    
- Accessibility, security, dan testing requirements tersedia.
    
- Deferred implementation decisions tercatat.