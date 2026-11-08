/**
 * Single IPC abstraction (FE-001, ES-6.x). The ONLY place that touches
 * `window.pywebview`. Server state is backend-authoritative (FE-003);
 * TanStack Query owns server cache, Zustand is for ephemeral UI state.
 */
import type {
  AppInfoRecord,
  BackupRecord,
  DiagnosticRecord,
  DialogPickFileRecord,
  PortableExportRecord,
  RecoveryStatusRecord,
  RestoreRecord,
  UpdateCheckRecord,
  BivariateRecord,
  CleaningOperation,
  CleaningPreviewSummary,
  CleaningRecord,
  CleaningStrategy,
  DatasetRecord,
  ExportFormat,
  ExportRecord,
  HistogramRecord,
  JobEvent,
  PreviewRecord,
  ProfileListRecord,
  PdfRecord,
  PlanListRecord,
  PlanRecord,
  PlanStepInput,
  ProfileRecord,
  ProjectRecord,
  OpenProjectRecord,
  ProjectRecentListRecord,
  ProvenanceRecord,
  FindingRecord,
  FindingListRecord,
  HypothesisRecord,
  HypothesisListRecord,
  FindingStatus,
  HypothesisStatus,
  QualityRecord,
  ReadinessRecord,
  ReportRecord,
  ReportScope,
  ProtocolInfo,
  SnapshotListRecord,
} from "./generated";

export interface BridgeResponse<T> {
  ok: boolean;
  data: T | null;
  error: { code: string; message: string; correlation_id: string | null } | null;
  protocol_version: string;
  correlation_id: string | null;
}

/**
 * PyWebView js_api calls are ALWAYS async (Promise). Every bridge call below
 * must be awaited — a non-awaited Promise has no `.ok` and fails silently.
 */
interface PywebviewBridge {
  get_protocol_info(): Promise<ProtocolInfo>;
  execute_command(req: unknown): Promise<BridgeResponse<unknown>>;
  execute_query(req: unknown): Promise<BridgeResponse<unknown>>;
  get_events(sinceSeq: number): Promise<JobEvent[]>;
}

/**
 * PyWebView exposes js_api under `window.pywebview.api` (NOT directly on
 * window.pywebview). Calling the bare object yields
 * "bridge().execute_command is not a function".
 */
declare global {
  interface Window {
    pywebview?: { api?: PywebviewBridge };
  }
}

let seq = 0;
function rid(): string {
  seq += 1;
  return `req-${Date.now()}-${seq}`;
}

function getApi(): PywebviewBridge | undefined {
  const api = window.pywebview?.api;
  // PyWebView creates `window.pywebview.api` as an EMPTY object first and only
  // populates its methods a moment later via _createApi. Checking `api`
  // truthiness is not enough — {} is truthy but has no methods, which made
  // the handshake fail with "get_protocol_info is not a function" in the fast
  // .app bundle. Only treat the bridge as ready once a real method exists.
  return typeof api?.get_protocol_info === "function" ? api : undefined;
}

/**
 * Tunggu bridge PyWebView siap. React effect (handshake startup) bisa jalan
 * sebelum PyWebView menyuntikkan `window.pywebview.api` — terutama di bundle
 * .app di mana halaman dimuat sangat cepat dari disk. Tanpa penantian ini
 * handshake gagal permanen ("Backend tidak tersedia") walau backend hidup.
 * Mendengarkan event `pywebviewready` + polling fallback.
 */
let bridgeWaitPromise: Promise<PywebviewBridge> | null = null;
function waitForBridge(timeoutMs = 10000): Promise<PywebviewBridge> {
  const ready = getApi();
  if (ready) return Promise.resolve(ready);
  if (bridgeWaitPromise) return bridgeWaitPromise;
  bridgeWaitPromise = new Promise<PywebviewBridge>((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      bridgeWaitPromise = null;
      reject(new Error(
        "pywebview bridge unavailable (window.pywebview.api not found) — run inside the desktop shell",
      ));
    }, timeoutMs);
    const succeed = (api: PywebviewBridge) => {
      cleanup();
      resolve(api);
    };
    const onReady = () => {
      const api = getApi();
      if (api) succeed(api);
    };
    const poll = setInterval(onReady, 50);
    const cleanup = () => {
      clearTimeout(timer);
      clearInterval(poll);
      window.removeEventListener("pywebviewready", onReady);
    };
    window.addEventListener("pywebviewready", onReady);
  });
  return bridgeWaitPromise;
}

async function bridge(): Promise<PywebviewBridge> {
  return waitForBridge();
}

/** Error thrown by every ipcClient method. P4-5: backend error messages
 *  are generic by code (no internal details), so UI must branch on `code`,
 *  never on message text. `code` is the ErrorContract code (e.g. CONFLICT). */
export class IpcError extends Error {
  code: string;
  /** Correlation id dari ErrorContract (D-F6: identity untuk dedup). */
  correlationId: string | null;
  constructor(message: string, code: string, correlationId: string | null = null) {
    super(message);
    this.name = "IpcError";
    this.code = code;
    this.correlationId = correlationId;
  }
}

function ipcError<T>(res: BridgeResponse<T>, fallback: string): IpcError {
  return new IpcError(
    res.error?.message ?? fallback,
    res.error?.code ?? "INTERNAL",
    res.error?.correlation_id ?? res.correlation_id ?? null,
  );
}

export const ipcClient = {
  async getProtocolInfo(): Promise<ProtocolInfo> {
    return (await bridge()).get_protocol_info();
  },
  /** Native file dialog via registered command (P2-3), NOT a 5th bridge
   *  method: returns { path: null } when the user cancels. */
  async pickFile(mode: "open" | "save", fileTypes: string[], title?: string): Promise<DialogPickFileRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "dialog.pick_file",
      payload: { mode, file_types: fileTypes, title: title ?? null },
    }) as BridgeResponse<DialogPickFileRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "pickFile failed");
    return res.data;
  },
  async createProject(name: string): Promise<ProjectRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "project.create", payload: { name },
    }) as BridgeResponse<ProjectRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "createProject failed");
    return res.data;
  },
  /** D-F4: command `project.open` — validate + active dataset if stored. */
  async openProject(projectId: string): Promise<OpenProjectRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "project.open", payload: { project_id: projectId },
    }) as BridgeResponse<OpenProjectRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "openProject failed");
    return res.data;
  },
  /** D-F4: query `project.list_recent` — read-only, newest first. */
  async listRecent(limit = 10): Promise<ProjectRecentListRecord> {
    const res = await (await bridge()).execute_query({
      request_id: rid(), command: "project.list_recent", payload: { limit },
    }) as BridgeResponse<ProjectRecentListRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "listRecent failed");
    return res.data;
  },
  async importDataset(projectId: string, sourcePath: string, datasetName: string): Promise<DatasetRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "dataset.import",
      payload: { project_id: projectId, source_path: sourcePath, dataset_name: datasetName },
    }) as BridgeResponse<DatasetRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "importDataset failed");
    return res.data;
  },
  async getPreview(projectId: string, datasetId: string, limit = 20): Promise<PreviewRecord> {
    const res = await (await bridge()).execute_query({
      request_id: rid(), command: "dataset.preview",
      payload: { project_id: projectId, dataset_id: datasetId, limit },
    }) as BridgeResponse<PreviewRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "getPreview failed");
    return res.data;
  },
  async getProfile(projectId: string, datasetId: string): Promise<ProfileRecord> {
    const res = await (await bridge()).execute_query({
      request_id: rid(), command: "dataset.profile",
      payload: { project_id: projectId, dataset_id: datasetId },
    }) as BridgeResponse<ProfileRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "getProfile failed");
    return res.data;
  },
  async runProfile(projectId: string, datasetId: string): Promise<ProfileRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "dataset.profile.run",
      payload: { project_id: projectId, dataset_id: datasetId },
    }) as BridgeResponse<ProfileRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "runProfile failed");
    return res.data;
  },
  async listProfiles(projectId: string, datasetId: string): Promise<ProfileListRecord> {
    const res = await (await bridge()).execute_query({
      request_id: rid(), command: "dataset.profiles.list",
      payload: { project_id: projectId, dataset_id: datasetId },
    }) as BridgeResponse<ProfileListRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "listProfiles failed");
    return res.data;
  },
  async getProfileById(projectId: string, profileId: string): Promise<ProfileRecord> {
    const res = await (await bridge()).execute_query({
      request_id: rid(), command: "dataset.profile.get",
      payload: { project_id: projectId, profile_id: profileId },
    }) as BridgeResponse<ProfileRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "getProfileById failed");
    return res.data;
  },
  async getDataset(projectId: string, datasetId: string): Promise<DatasetRecord> {
    const res = await (await bridge()).execute_query({
      request_id: rid(), command: "dataset.get",
      payload: { project_id: projectId, dataset_id: datasetId },
    }) as BridgeResponse<DatasetRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "getDataset failed");
    return res.data;
  },
  async listSnapshots(projectId: string): Promise<SnapshotListRecord> {
    const res = await (await bridge()).execute_query({
      request_id: rid(), command: "dataset.snapshots.list",
      payload: { project_id: projectId },
    }) as BridgeResponse<SnapshotListRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "listSnapshots failed");
    return res.data;
  },
  async getProvenance(projectId: string, datasetId: string): Promise<ProvenanceRecord> {
    const res = await (await bridge()).execute_query({
      request_id: rid(), command: "dataset.provenance",
      payload: { project_id: projectId, dataset_id: datasetId },
    }) as BridgeResponse<ProvenanceRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "getProvenance failed");
    return res.data;
  },
  async createFinding(projectId: string, datasetId: string, title: string, body: string, evidenceSnapshotId: string, evidenceFingerprint: string): Promise<FindingRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "insight.finding.create",
      payload: { project_id: projectId, dataset_id: datasetId, title, body, evidence_snapshot_id: evidenceSnapshotId, evidence_fingerprint: evidenceFingerprint },
    }) as BridgeResponse<FindingRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "createFinding failed");
    return res.data;
  },
  async transitionFinding(projectId: string, findingId: string, toStatus: FindingStatus): Promise<FindingRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "insight.finding.transition",
      payload: { project_id: projectId, finding_id: findingId, to_status: toStatus },
    }) as BridgeResponse<FindingRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "transitionFinding failed");
    return res.data;
  },
  async listFindings(projectId: string, datasetId: string): Promise<FindingListRecord> {
    const res = await (await bridge()).execute_query({
      request_id: rid(), command: "insight.findings.list",
      payload: { project_id: projectId, dataset_id: datasetId },
    }) as BridgeResponse<FindingListRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "listFindings failed");
    return res.data;
  },
  async createHypothesis(projectId: string, datasetId: string, statement: string): Promise<HypothesisRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "insight.hypothesis.create",
      payload: { project_id: projectId, dataset_id: datasetId, statement },
    }) as BridgeResponse<HypothesisRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "createHypothesis failed");
    return res.data;
  },
  async transitionHypothesis(projectId: string, hypothesisId: string, toStatus: HypothesisStatus): Promise<HypothesisRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "insight.hypothesis.transition",
      payload: { project_id: projectId, hypothesis_id: hypothesisId, to_status: toStatus },
    }) as BridgeResponse<HypothesisRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "transitionHypothesis failed");
    return res.data;
  },
  async listHypotheses(projectId: string, datasetId: string): Promise<HypothesisListRecord> {
    const res = await (await bridge()).execute_query({
      request_id: rid(), command: "insight.hypotheses.list",
      payload: { project_id: projectId, dataset_id: datasetId },
    }) as BridgeResponse<HypothesisListRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "listHypotheses failed");
    return res.data;
  },
  async runHistogram(projectId: string, datasetId: string, columnName: string): Promise<HistogramRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "dataset.histogram.run",
      payload: { project_id: projectId, dataset_id: datasetId, column_name: columnName },
    }) as BridgeResponse<HistogramRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "runHistogram failed");
    return res.data;
  },
  async runQuality(projectId: string, datasetId: string): Promise<QualityRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "dataset.quality.run",
      payload: { project_id: projectId, dataset_id: datasetId },
    }) as BridgeResponse<QualityRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "runQuality failed");
    return res.data;
  },
  async runReadiness(projectId: string, datasetId: string): Promise<ReadinessRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "dataset.readiness.run",
      payload: { project_id: projectId, dataset_id: datasetId },
    }) as BridgeResponse<ReadinessRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "runReadiness failed");
    return res.data;
  },
  async runBivariate(projectId: string, datasetId: string, columnA: string, columnB: string): Promise<BivariateRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "dataset.bivariate.run",
      payload: { project_id: projectId, dataset_id: datasetId, column_a: columnA, column_b: columnB },
    }) as BridgeResponse<BivariateRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "runBivariate failed");
    return res.data;
  },
  async runReport(projectId: string, datasetId: string, scope: ReportScope): Promise<ReportRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "dataset.report.generate",
      payload: { project_id: projectId, dataset_id: datasetId, scope },
    }) as BridgeResponse<ReportRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "runReport failed");
    return res.data;
  },
  async runPdf(projectId: string, datasetId: string, scope: ReportScope): Promise<PdfRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "dataset.pdf.generate",
      payload: { project_id: projectId, dataset_id: datasetId, scope },
    }) as BridgeResponse<PdfRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "runPdf failed");
    return res.data;
  },
  // NXT-2: Analysis Plan + DAG execution (gap G2) — backend-authoritative
  // plan lifecycle: draft -> approve -> execute (sequential, per-step status).
  async createPlan(projectId: string, datasetId: string, steps: PlanStepInput[]): Promise<PlanRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "plan.create",
      payload: { project_id: projectId, dataset_id: datasetId, steps },
    }) as BridgeResponse<PlanRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "createPlan failed");
    return res.data;
  },
  async approvePlan(projectId: string, planId: string): Promise<PlanRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "plan.approve",
      payload: { project_id: projectId, plan_id: planId },
    }) as BridgeResponse<PlanRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "approvePlan failed");
    return res.data;
  },
  async executePlan(projectId: string, planId: string): Promise<PlanRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "plan.execute",
      payload: { project_id: projectId, plan_id: planId },
    }) as BridgeResponse<PlanRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "executePlan failed");
    return res.data;
  },
  async getPlan(projectId: string, planId: string): Promise<PlanRecord> {
    const res = await (await bridge()).execute_query({
      request_id: rid(), command: "plan.get",
      payload: { project_id: projectId, plan_id: planId },
    }) as BridgeResponse<PlanRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "getPlan failed");
    return res.data;
  },
  async listPlans(projectId: string, datasetId: string): Promise<PlanListRecord> {
    const res = await (await bridge()).execute_query({
      request_id: rid(), command: "plan.list",
      payload: { project_id: projectId, dataset_id: datasetId },
    }) as BridgeResponse<PlanListRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "listPlans failed");
    return res.data;
  },
  async previewCleaning(
    projectId: string,
    datasetId: string,
    operation: CleaningOperation,
    columns: string[],
    strategy?: CleaningStrategy,
    constantValue?: string,
  ): Promise<CleaningPreviewSummary> {
    const res = await (await bridge()).execute_query({
      request_id: rid(), command: "dataset.cleaning.preview",
      payload: {
        project_id: projectId, dataset_id: datasetId, operation, columns,
        strategy: strategy ?? null, constant_value: constantValue ?? null,
      },
    }) as BridgeResponse<CleaningPreviewSummary>;
    if (!res.ok || !res.data) throw ipcError(res, "previewCleaning failed");
    return res.data;
  },
  async runCleaning(
    projectId: string,
    datasetId: string,
    operation: CleaningOperation,
    columns: string[],
    expectedParentFingerprint: string,
    strategy?: CleaningStrategy,
    constantValue?: string,
  ): Promise<CleaningRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "dataset.cleaning.run",
      payload: {
        project_id: projectId, dataset_id: datasetId, operation, columns,
        strategy: strategy ?? null, constant_value: constantValue ?? null,
        expected_parent_fingerprint: expectedParentFingerprint,
      },
    }) as BridgeResponse<CleaningRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "runCleaning failed");
    return res.data;
  },
  async createBackup(projectId: string, destPath: string): Promise<BackupRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "project.backup.create",
      payload: { project_id: projectId, dest_path: destPath },
    }) as BridgeResponse<BackupRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "createBackup failed");
    return res.data;
  },
  async createDiagnostic(projectId: string, destPath: string): Promise<DiagnosticRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "project.diagnostic.create",
      payload: { project_id: projectId, dest_path: destPath },
    }) as BridgeResponse<DiagnosticRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "createDiagnostic failed");
    return res.data;
  },
  async restoreProject(archivePath: string, destRoot: string): Promise<RestoreRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "project.restore",
      payload: { archive_path: archivePath, dest_root: destRoot },
    }) as BridgeResponse<RestoreRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "restoreProject failed");
    return res.data;
  },
  async recoveryStatus(): Promise<RecoveryStatusRecord> {
    const res = await (await bridge()).execute_query({
      request_id: rid(), command: "project.recovery.status", payload: {},
    }) as BridgeResponse<RecoveryStatusRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "recoveryStatus failed");
    return res.data;
  },
  async recoveryRestore(): Promise<RestoreRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "project.recovery.restore", payload: {},
    }) as BridgeResponse<RestoreRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "recoveryRestore failed");
    return res.data;
  },
  async exportPortable(projectId: string, destPath: string): Promise<PortableExportRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "project.export_portable",
      payload: { project_id: projectId, dest_path: destPath },
    }) as BridgeResponse<PortableExportRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "exportPortable failed");
    return res.data;
  },
  async appInfo(): Promise<AppInfoRecord> {
    const res = await (await bridge()).execute_query({
      request_id: rid(), command: "app.info", payload: {},
    }) as BridgeResponse<AppInfoRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "appInfo failed");
    return res.data;
  },
  async checkUpdate(feedUrl?: string): Promise<UpdateCheckRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "app.update.check",
      payload: { feed_url: feedUrl ?? null },
    }) as BridgeResponse<UpdateCheckRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "checkUpdate failed");
    return res.data;
  },
  async exportDataset(projectId: string, datasetId: string, format: ExportFormat, destPath: string): Promise<ExportRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "dataset.export",
      payload: { project_id: projectId, dataset_id: datasetId, format, dest_path: destPath },
    }) as BridgeResponse<ExportRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "exportDataset failed");
    return res.data;
  },
  async activateSnapshot(projectId: string, datasetId: string, snapshotId: string): Promise<DatasetRecord> {
    const res = await (await bridge()).execute_command({
      request_id: rid(), command: "dataset.snapshot.activate",
      payload: { project_id: projectId, dataset_id: datasetId, snapshot_id: snapshotId },
    }) as BridgeResponse<DatasetRecord>;
    if (!res.ok || !res.data) throw ipcError(res, "activateSnapshot failed");
    return res.data;
  },
  async getEvents(sinceSeq = 0): Promise<JobEvent[]> {
    return (await bridge()).get_events(sinceSeq);
  },
};
