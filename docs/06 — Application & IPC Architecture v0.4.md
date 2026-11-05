# 06 — Application & IPC Architecture

**Project:** EDA Workbench  
**Document:** 06 — Application & IPC Architecture  
**Version:** 0.4  
**Status:** Draft for Review — Revised for Review (WP-15)  
**Depends on:** Documents 01–05; Document 15 §9.1 (canonical health vocabulary)

> **Revision note (WP-14):** v0.3 resolves IN-C: §14 replaces the local health-state list with the canonical two-axis model owned by Doc15 §9.1. Header status corrected (IN-D). No IPC contract changes.

---

## 1. Purpose

Dokumen ini mendefinisikan bagaimana React frontend berkomunikasi dengan Python backend melalui PyWebView, serta bagaimana application layer mengoordinasikan domain services, execution jobs, persistence, dan events.

Fokus utamanya:

- Mendefinisikan batas tanggung jawab frontend, bridge, dan backend.
    
- Menetapkan command/query contract yang typed dan versioned.
    
- Menjamin komunikasi aman dan thread-safe.
    
- Mendukung operasi singkat maupun long-running jobs.
    
- Menyediakan event delivery yang reliable.
    
- Menjaga IPC tetap kecil, eksplisit, dan tidak bergantung pada transport implementation.
    

**Architecture baseline:** PyWebView JS-Python bridge. FastAPI/REST bukan bagian dari MVP.

## 2. Architectural Principles

|Principle|Description|
|---|---|
|Narrow bridge|Hanya expose API yang diperlukan frontend|
|Typed contracts|Request dan response menggunakan schema terdefinisi|
|Explicit orchestration|Use case dikoordinasikan oleh application layer|
|Non-blocking UI|Operasi berat tidak berjalan pada UI/IPC thread|
|Versioned protocol|Perubahan kontrak harus kompatibel atau terversi|
|Bounded communication|Payload IPC dibatasi dan tidak mengirim dataset besar|
|Reliable events|Event penting dapat dipulihkan setelah reconnect|
|Least privilege|Setiap operasi memvalidasi capability dan permission|
|Transport independence|Business logic tidak bergantung pada PyWebView API|

## 3. Application Layer Architecture

Application layer menjadi orchestration boundary antara presentation dan domain.

### 3.1 Responsibilities

1. Menerima command dan query.
    
2. Memvalidasi input dan authorization.
    
3. Menjalankan use case.
    
4. Mengorkestrasi domain services dan repositories.
    
5. Membuat execution request untuk Job Manager.
    
6. Mengelola transaksi melalui Unit of Work.
    
7. Menghasilkan application-level results.
    
8. Mempublikasikan domain/application events.
    
9. Mengelola error translation menjadi stable error contracts.
    

Application layer tidak boleh:

- Menyimpan business rules yang seharusnya dimiliki domain.
    
- Mengakses SQLite atau Parquet secara langsung tanpa abstraction.
    
- Mengirim objek internal Python langsung ke frontend.
    
- Menjalankan heavy computation secara synchronous dalam IPC call.
    

### 3.2 Application Components

|Component|Responsibility|
|---|---|
|Command Handlers|Menangani operasi yang mengubah state|
|Query Handlers|Mengambil data tanpa mengubah state|
|Application Services|Mengorkestrasi use cases lintas domain|
|DTO / Contract Models|Menentukan struktur data antar-layer|
|Unit of Work|Mengelola batas transaksi|
|Authorization Service|Memeriksa permission dan capability|
|Job Application Service|Mengelola submission dan lifecycle jobs|
|Event Application Service|Mengelola event delivery dan reconciliation|

### 3.3 Command vs Query

**Command** menyatakan intent untuk melakukan perubahan atau memulai operasi.

Contoh:

- `CreateProject`
    
- `ImportDataset`
    
- `ApproveAnalysisPlan`
    
- `ApplyTransformation`
    
- `StartAnalysis`
    
- `CancelJob`
    

**Query** meminta informasi tanpa mengubah state.

Contoh:

- `GetProject`
    
- `ListDatasets`
    
- `GetDatasetProfile`
    
- `GetAnalysisPlan`
    
- `GetJobStatus`
    
- `GetArtifact`
    

Command dan query memiliki handler, validation, dan response contract masing-masing.

## 4. IPC Architecture

### 4.1 Communication Flow

```
React Frontend
     |
     | Typed command / query
     v
Frontend IPC Client
     |
     | window.pywebview.api
     v
PyWebView Bridge API
     |
     | Validate + dispatch
     v
IPC Dispatcher
     |
     v
Application Handlers
     |
     +---- Domain Services
     |
     +---- Repositories / Unit of Work
     |
     +---- Job Manager
     |
     +---- Event System
```

Response berjalan kembali melalui jalur yang sama.

Long-running jobs menggunakan jalur terpisah untuk progress dan completion events.

### 4.2 Bridge API

Frontend mengakses backend melalui exposed PyWebView methods:

```
window.pywebview.api.execute_command(
  request: CommandEnvelope
): Promise<ResponseEnvelope>;

window.pywebview.api.execute_query(
  request: QueryEnvelope
): Promise<ResponseEnvelope>;

window.pywebview.api.get_protocol_info(): Promise<ProtocolInfo>;

window.pywebview.api.get_events(
  request: EventReadRequest
): Promise<EventBatch>;
```

Nama dan bentuk method merupakan proposed public bridge contract. Implementasi Python dapat menggunakan internal dispatcher dan handler registry.

Bridge API harus tetap tipis. Tidak ada domain logic atau analytical computation di dalam bridge methods.

### 4.3 Frontend Readiness

Frontend tidak boleh memanggil bridge sebelum PyWebView bridge siap.

Urutan:

1. PyWebView membuat window dan mengekspos API.
    
2. Frontend memuat aplikasi.
    
3. Frontend menunggu `pywebviewready`.
    
4. IPC client melakukan protocol handshake.
    
5. Frontend memeriksa application health dan capability.
    
6. Aplikasi masuk ke state ready atau degraded.
    

Jika handshake gagal, frontend menampilkan connection error dan menyediakan mekanisme retry.

## 5. Request and Response Contracts

### 5.1 Request Envelope

Setiap command/query menggunakan envelope dengan metadata standar.

```
class RequestEnvelope(BaseModel):
    request_id: UUID
    protocol_version: str
    command: str
    payload: dict
    metadata: RequestMetadata | None = None
```

Query menggunakan contract yang sama, dengan identifier dan payload query yang sesuai.

`request_id` digunakan untuk correlation, tracing, dan deduplication pada operasi yang mendukung idempotency.

### 5.2 Response Envelope

```
class ResponseEnvelope(BaseModel):
    request_id: UUID
    success: bool
    data: dict | None = None
    error: ErrorContract | None = None
    metadata: ResponseMetadata | None = None
```

Aturan:

- `success=true` berarti request berhasil diproses.
    
- `success=false` harus menyertakan stable error contract.
    
- `data` berisi DTO, bukan internal domain object.
    
- `metadata` dapat berisi timing, pagination, trace ID, dan informasi tambahan.
    
- Response harus memiliki batas ukuran yang jelas.
    

### 5.3 Error Contract

```
class ErrorContract(BaseModel):
    code: str
    message: str
    category: str
    retryable: bool
    details: dict | None = None
    trace_id: str | None = None
```

Contoh error category:

|Category|Contoh|
|---|---|
|Validation|Invalid request, missing field|
|Not Found|Project atau dataset tidak ditemukan|
|Conflict|Revision mismatch, stale state|
|Permission|Capability atau permission ditolak|
|Resource|Memory atau disk budget terlampaui|
|Execution|Analysis atau transformation gagal|
|Infrastructure|Storage atau engine tidak tersedia|
|Internal|Unexpected backend error|

Error message harus aman untuk ditampilkan kepada pengguna. Stack trace dan internal diagnostics hanya masuk ke diagnostic logs.

## 6. Typed Contract Strategy

### 6.1 Python Contracts

Gunakan Pydantic sebagai canonical runtime schema untuk:

- Request models.
    
- Response DTOs.
    
- Event payloads.
    
- Job status.
    
- Error contracts.
    
- Plugin-facing IPC metadata.
    

### 6.2 TypeScript Contracts

Frontend menggunakan TypeScript types yang disinkronkan dengan Python contracts.

Strategi yang direkomendasikan:

- Python/Pydantic menjadi source of truth untuk shared IPC schemas.
    
- Schema atau type definitions dihasilkan melalui automated generation.
    
- Generated TypeScript types tidak diedit manual.
    
- CI memeriksa contract drift.
    
- Runtime validation tetap dilakukan di Python boundary.
    

Tidak perlu memaksakan semua domain models diekspos sebagai frontend types. Hanya public application DTOs yang menjadi IPC contract.

### 6.3 Contract Versioning

Setiap protocol memiliki `protocol_version`.

Perubahan contract dibagi menjadi:

- **Additive:** penambahan optional field yang kompatibel.
    
- **Breaking:** perubahan nama, tipe, atau semantics yang membutuhkan migration atau version increment.
    
- **Deprecated:** field lama tetap didukung sementara dengan jadwal removal yang jelas.
    

Frontend dan backend harus memeriksa kompatibilitas protocol saat startup.

## 7. Long-Running Job Communication

Operasi seperti import besar, profiling, cleaning, analysis, join, dan report generation tidak boleh menahan IPC request sampai selesai.

### 7.1 Submission Flow

```
Frontend
   |
   | StartAnalysis
   v
IPC Bridge
   |
   v
Application Handler
   |
   v
Job Manager
   |
   +---- Create Job
   |
   +---- Schedule Tasks
   |
   +---- Return job_id
   |
   v
Frontend receives job_id
   |
   +---- Subscribe / poll status
   |
   +---- Receive progress events
   |
   +---- Retrieve final result
```

Command untuk operasi long-running mengembalikan `job_id` setelah job berhasil diterima, bukan menunggu seluruh proses selesai.

### 7.2 Job APIs

Proposed operations:

|Operation|Purpose|
|---|---|
|`submit_job`|Create a logical job; accepts an idempotency key to prevent duplicate submission|
|`get_job`|Return authoritative job state and revision|
|`list_jobs`|List jobs|
|`cancel_job`|Request cooperative cancellation|
|`retry_job`|Request a new attempt for an eligible logical job under Doc05|
|`get_job_result`|Retrieve job result|
|`get_job_tasks`|Retrieve task status in the DAG|

Job lifecycle, terminal states, retry eligibility, attempt identity, and recovery outcomes follow Document 05. This API must not define a competing state machine.

#### Retry command contract

`retry_job` carries:
- `job_id` — logical job to retry.
- `expected_job_revision` — optimistic concurrency guard.
- `retry_scope` — whole job or explicit retryable task IDs.
- `idempotency_key` — caller-generated key for this retry request.
- `reason` — structured reason where required by the operation contract.

The backend validates authorization, current state/revision, retry eligibility, and operation safety before scheduling. Successful acceptance returns the existing logical `job_id`, a distinct `attempt_id`, attempt number, and accepted job revision. Rejection returns a typed conflict, validation, or authorization error and creates no attempt.

The same idempotency key with the same canonical request returns the original acceptance/result. The same key with materially different request content returns a conflict. The idempotency key is distinct from `request_id` and `correlation_id`.

Cancellation is cooperative. A cancellation request is not completion. The UI reflects `Cancelling` until the backend reports a durable `JobCancelled` outcome or another explicit terminal outcome.

## 8. Event Communication

Event system menyampaikan perubahan state dan progress dari backend ke frontend.

### 8.1 Event Categories

|Event Type|Delivery|Example|
|---|---|---|
|Critical domain events|Durable|DatasetImported, PlanApproved|
|Job lifecycle events|Durable|JobCreated, JobQueued, JobStarted, JobCancellationRequested, JobCancelled, JobCompleted, JobFailed, JobInterrupted, JobRecoveryCompleted|
|Progress events|Ephemeral|TaskProgressUpdated|
|UI notifications|Ephemeral|NotificationRequested|
|Health events|Reconciled|EngineUnavailable|

Critical events disimpan di SQLite sesuai kebijakan event architecture. Progress events tidak harus disimpan secara permanen.

### 8.2 Event Envelope

```
class EventEnvelope(BaseModel):
    event_id: UUID
    event_type: str
    event_version: str
    aggregate_id: str | None
    sequence_number: int
    occurred_at: datetime
    correlation_id: UUID | None
    payload: dict
```

Event payload harus typed dan terversi. Event yang membawa informasi sensitif harus mengikuti data classification policy.

### 8.3 Event Delivery

MVP menggunakan mekanisme hybrid:

- In-memory event bus untuk komunikasi runtime.
    
- SQLite event store untuk critical events.
    
- Frontend melakukan event retrieval melalui IPC.
    
- Frontend menyimpan cursor/sequence terakhir yang telah diproses.
    
- Event ID digunakan untuk deduplication.
    
- Sequence number membantu mendeteksi event yang terlewat.
    

Tidak diperlukan Kafka, RabbitMQ, atau message broker eksternal untuk MVP.

### 8.4 Reconnection and Reconciliation

Jika WebView reload atau frontend reconnect:

1. Frontend menginisialisasi ulang IPC client.
    
2. Frontend mengirim last-known event cursor.
    
3. Backend mengembalikan durable events yang belum diterima.
    
4. Frontend melakukan deduplication.
    
5. Frontend mengambil ulang current job/project state bila diperlukan.
    
6. Event progress yang sudah hilang tidak perlu direplay; current status menjadi sumber kebenaran.
    

Event delivery tidak boleh menjadi satu-satunya sumber state aplikasi.

For job lifecycle events, Document 05 is the canonical state/event mapping. `JobFailed` is a required durable terminal event; `JobInterrupted` records interruption; and `JobRecoveryCompleted` reports a resolved recovery outcome without implying successful job completion. `JobCancelled` is emitted only after the cancellation outcome is durably recorded. Frontend consumers reconcile against current backend job state after replay and must not derive authoritative state solely from event arrival order.

## 9. Payload and Data Transfer Policy

IPC hanya mengirim data yang sesuai untuk komunikasi UI.

|Data|Transfer Strategy|
|---|---|
|Small metadata|JSON DTO|
|Dataset preview|Bounded JSON rows|
|Schema/profile summary|JSON DTO|
|Large analytical result|Artifact reference|
|Medium/large data exchange|Arrow IPC|
|Large dataset operations|Dataset reference + DuckDB execution|
|File/report payload|Filesystem reference + controlled access|

Aturan penting:

- Jangan mengirim seluruh DataFrame melalui JSON IPC.
    
- Preview harus memiliki row limit dan column limit.
    
- Pagination wajib untuk collection besar.
    
- Hasil besar disimpan sebagai artifact atau snapshot.
    
- Frontend menerima reference dan metadata, bukan internal storage path yang tidak tervalidasi.
    
- File access harus melalui backend-controlled operations.
    

## 10. Pagination and Query Contracts

Collection query menggunakan pagination yang konsisten.

Contoh:

```
class PageRequest(BaseModel):
    limit: int = 50
    cursor: str | None = None

class PageResponse(BaseModel):
    items: list
    next_cursor: str | None = None
    has_more: bool
```

Ketentuan:

- Default page size dibatasi.
    
- Maximum page size ditentukan per endpoint.
    
- Cursor harus opaque bagi frontend.
    
- Sorting dan filtering harus eksplisit.
    
- Query berat dapat dialihkan menjadi background job.
    

## 11. Thread Safety and Execution Boundaries

PyWebView exposed methods dapat dipanggil pada thread berbeda. Karena itu, bridge dan application services harus dirancang thread-safe.

Aturan:

1. Bridge methods hanya melakukan parsing, validation, dan dispatch.
    
2. Shared mutable state tidak boleh diakses tanpa synchronization.
    
3. SQLite writes diserialisasi melalui persistence coordination.
    
4. Job Manager mengatur background execution.
    
5. AsyncIO, threads, dan ProcessPool mengikuti kebijakan Document 05.
    
6. Tidak ada heavy computation pada UI thread atau IPC handler thread.
    
7. Event delivery harus aman terhadap concurrent publishers.
    
8. GUI framework operations tetap mengikuti thread-affinity requirements platform.
    

Application handlers tidak boleh mengasumsikan bahwa request datang secara serial.

## 12. Security and Authorization Boundary

Setiap request dari frontend diperlakukan sebagai untrusted input, meskipun frontend merupakan bundled application.

Kontrol minimum:

- Pydantic validation di bridge boundary.
    
- Command allowlist; tidak ada arbitrary method invocation.
    
- Permission/capability check sebelum operasi.
    
- Project context dan resource ownership validation.
    
- File reference validation dan path traversal protection.
    
- Request size dan pagination limits.
    
- Resource admission control untuk jobs.
    
- Plugin operations mengikuti permission model Document 09 §11 (PLG-011, Proposed) enforced under the security architecture of Document 11 (SEC-004, Proposed).
    
- Error response tidak membocorkan stack trace, credential, atau internal path.
    
- Bridge hanya tersedia untuk trusted bundled UI.
    

External websites tidak boleh memperoleh akses ke exposed Python bridge.

## 13. Idempotency and Concurrency

Identifiers have distinct responsibilities:

| Identifier | Responsibility |
|---|---|
| `request_id` | Identifies one IPC request/response exchange for diagnostics and correlation |
| `correlation_id` | Links related commands, events, and downstream operations |
| `idempotency_key` | Identifies a logical command submission whose duplicate delivery must not repeat its effect |
| `aggregate_revision` | Detects stale writes or commands against an outdated aggregate |

Commands that create jobs/resources or perform externally visible mutations must declare whether an idempotency key is required. Where required:
- The key is scoped to the authenticated actor/principal and command/operation boundary, with project/resource scope where applicable.
- The backend stores the canonical request fingerprint and resulting acceptance/result for the documented retention window.
- Repeating the same key with the same canonical request returns the prior result without repeating the effect.
- Reusing the key with materially different canonical request content returns a typed conflict.
- Expired keys do not provide indefinite deduplication; a new key is used only for an intentionally new operation.
- The exact retention duration and storage implementation remain deferred, but the chosen duration must cover the supported timeout/reconnect retry window.

`request_id` is not an idempotency key: a transport retry may use a new request ID while preserving the same idempotency key. `correlation_id` is not an idempotency key either.

Commands that mutate an aggregate carry an expected revision where concurrent updates are possible. Stale revisions return a typed conflict and do not partially apply the command. Job retry semantics are defined in §7.2 and Document 05.

## 14. Startup, Health, and Shutdown

### Startup

1. Initialize application composition root.
    
2. Load configuration dan secure credentials.
    
3. Initialize persistence dan migrations.
    
4. Initialize event system.
    
5. Initialize engine adapters dan plugin registry.
    
6. Initialize Job Manager.
    
7. Expose bridge API.
    
8. Start PyWebView window.
    
9. Frontend melakukan readiness handshake.
    
10. Application melaporkan health dan capabilities.
    

### Health States (canonical — WP-14, IN-C resolution)

Health vocabulary is owned by Document 15 §9.1 (Observability). This document references it; it does not define a competing list. Two distinct axes:

**Health axis** (component state): `Starting`, `Healthy`, `Degraded`, `Unhealthy`, `Stopping`, `Disabled`.

- `Starting` — component initializing, not yet serving.
- `Healthy` — operating normally within policy.
- `Degraded` — operating with reduced capability or performance.
- `Unhealthy` — failed or unable to perform its function (terminal until recovery).
- `Stopping` — controlled shutdown in progress.
- `Disabled` — intentionally disabled by policy/configuration (distinct from failure).

**Availability axis** (readiness/capability, Doc15 §9.3): a component may be `Ready`/`Available` or `Unavailable` for a capability. `Unavailable` is not a health state: an AI provider being unavailable does not make the application `Unhealthy`; core EDA continues (graceful degradation).

Mapping from legacy terms in earlier versions: `Starting` ≡ former `Initializing`; `Stopping` ≡ former `ShuttingDown`/`Shutting Down`; `Unhealthy` ≡ former `Failed` (health) — while former `Unavailable` moves to the availability axis; former `Ready` is readiness, not health.

Health transitions must be observable in diagnostics (§15) and correlated by `correlation_id` with related job/command events where applicable.


### Shutdown

1. Stop accepting new jobs.
    
2. Request cooperative cancellation sesuai shutdown policy.
    
3. Wait untuk task yang dapat diselesaikan dengan aman.
    
4. Persist job dan event state.
    
5. Flush pending writes.
    
6. Release DuckDB, worker, dan subprocess resources.
    
7. Close persistence connections.
    
8. Close application window.
    

Interrupted jobs harus dapat dikenali saat startup berikutnya dan mengikuti recovery policy Document 05.

## 15. Observability and Diagnostics

Setiap IPC request dan job harus memiliki correlation/trace identifier.

Log minimum:

- Request ID.
    
- Command/query name.
    
- Duration.
    
- Outcome.
    
- Error code.
    
- Job ID jika ada.
    
- Relevant aggregate ID.
    
- Protocol version.
    

Larangan:

- Logging raw dataset contents.
    
- Logging credentials atau secrets.
    
- Logging full AI prompts yang mengandung data sensitif.
    
- Mengirim diagnostic data keluar tanpa consent.
    

Diagnostic bundle harus melalui proses redaction dan persetujuan pengguna.

## 16. Testing Strategy

|Test Level|Focus|
|---|---|
|Contract tests|Python ↔ TypeScript schema compatibility|
|Unit tests|Handlers, validators, error mapping|
|Integration tests|Application services, repositories, UoW|
|Bridge tests|Dispatch, serialization, thread safety|
|Event tests|Ordering, deduplication, replay, reconnect|
|Job tests|Submission, progress, cancellation, retry|
|Security tests|Invalid input, permission bypass, path traversal|
|E2E tests|Frontend ↔ PyWebView ↔ backend|
|Recovery tests|Reload, interrupted jobs, shutdown/restart|

CI harus mendeteksi perubahan contract yang breaking dan memastikan generated TypeScript types tetap sinkron.

## 17. Key Architecture Decisions

|ID|Decision|Status|
|---|---|---|
|IPC-001|PyWebView JS-Python bridge sebagai MVP transport|Proposed|
|IPC-002|Typed command/query contracts|Proposed|
|IPC-003|Pydantic sebagai canonical Python schema|Proposed|
|IPC-004|Generated TypeScript contract types|Proposed|
|IPC-005|Standard request/response envelope|Proposed|
|IPC-006|Long-running operations menggunakan Job Manager|Confirmed from Doc 05|
|IPC-007|Durable critical events + ephemeral progress|Confirmed from Docs 02–03|
|IPC-008|Bounded JSON, Arrow, dan artifact references|Confirmed from Docs 02, 04, 05|
|IPC-009|No FastAPI REST API for MVP|Confirmed|
|IPC-010|Versioned protocol dan compatibility handshake|Proposed|
|IPC-011|Thread-safe bridge dan centralized dispatch|Proposed|
|IPC-012|Reconnection menggunakan replay dan state reconciliation|Proposed|

## 18. Deferred Decisions

Hal berikut belum perlu dikunci dalam dokumen ini:

- Detail generator Pydantic-to-TypeScript yang dipilih.
    
- Exact bridge method naming convention.
    
- Event polling interval atau transport optimization.
    
- IPC payload limits per endpoint.
    
- Exact idempotency retention policy.
    
- Exact protocol compatibility window.
    
- Future remote API transport jika diperlukan.
    

Keputusan tersebut dapat dibuat saat implementation design tanpa mengubah prinsip arsitektur.

## 19. Traceability

|Related Document|Relationship|
|---|---|
|01 — Product Vision & Requirements|Guided/Advanced UX dan product requirements|
|02 — System Architecture|PyWebView, modular monolith, concurrency, lifecycle|
|03 — Domain Model|Aggregate ownership, events, domain boundaries|
|04 — Data & Persistence Architecture|SQLite, Unit of Work, Arrow, artifact references|
|05 — Processing & Execution Architecture|Job Manager, DAG, cancellation, execution events|
|06 — Application & IPC Architecture|Application orchestration dan frontend/backend contracts|

## 20. Completion Criteria

Dokumen ini dianggap lengkap apabila:

- Frontend/backend communication boundary jelas.
    
- Command/query contract terdefinisi.
    
- Request/response/error envelope konsisten.
    
- Long-running jobs tidak memblokir UI.
    
- Event replay dan reconciliation dirancang.
    
- Payload limits dan large-data transfer strategy jelas.
    
- Thread safety dan security boundary ditetapkan.
    
- Startup, shutdown, dan recovery terintegrasi.
    
- Contract testing strategy tersedia.
    
- Tidak ada business logic yang bergantung langsung pada PyWebView transport.

### WP-08R Contract Clarification Note

This revision aligns IPC job APIs, durable lifecycle events, retry identity, and idempotency semantics with Document 05. It does not select a transport replacement, broker, idempotency-store technology, or retention duration.
