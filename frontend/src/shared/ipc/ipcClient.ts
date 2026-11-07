/**
 * Single IPC abstraction (FE-001, ES-6.x). The ONLY place that touches
 * `window.pywebview`. Server state is backend-authoritative (FE-003);
 * TanStack Query owns server cache, Zustand is for ephemeral UI state.
 */
import type {
  BackupRecord,
  DiagnosticRecord,
  DialogPickFileRecord,
  RestoreRecord,
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
  ProfileRecord,
  ProjectRecord,
  ProvenanceRecord,
  FindingRecord,
  FindingListRecord,
  HypothesisRecord,
  HypothesisListRecord,
  FindingStatus,
  HypothesisStatus,
  QualityRecord,
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

function bridge(): PywebviewBridge {
  const api = window.pywebview?.api;
  if (!api) {
    throw new Error(
      "pywebview bridge unavailable (window.pywebview.api not found) — run inside the desktop shell",
    );
  }
  return api;
}

export const ipcClient = {
  async getProtocolInfo(): Promise<ProtocolInfo> {
    return bridge().get_protocol_info();
  },
  /** Native file dialog via registered command (P2-3), NOT a 5th bridge
   *  method: returns { path: null } when the user cancels. */
  async pickFile(mode: "open" | "save", fileTypes: string[], title?: string): Promise<DialogPickFileRecord> {
    const res = await bridge().execute_command({
      request_id: rid(), command: "dialog.pick_file",
      payload: { mode, file_types: fileTypes, title: title ?? null },
    }) as BridgeResponse<DialogPickFileRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "pickFile failed");
    return res.data;
  },
  async createProject(name: string): Promise<ProjectRecord> {
    const res = await bridge().execute_command({
      request_id: rid(), command: "project.create", payload: { name },
    }) as BridgeResponse<ProjectRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "createProject failed");
    return res.data;
  },
  async importDataset(projectId: string, sourcePath: string, datasetName: string): Promise<DatasetRecord> {
    const res = await bridge().execute_command({
      request_id: rid(), command: "dataset.import",
      payload: { project_id: projectId, source_path: sourcePath, dataset_name: datasetName },
    }) as BridgeResponse<DatasetRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "importDataset failed");
    return res.data;
  },
  async getPreview(projectId: string, datasetId: string, limit = 20): Promise<PreviewRecord> {
    const res = await bridge().execute_query({
      request_id: rid(), command: "dataset.preview",
      payload: { project_id: projectId, dataset_id: datasetId, limit },
    }) as BridgeResponse<PreviewRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "getPreview failed");
    return res.data;
  },
  async getProfile(projectId: string, datasetId: string): Promise<ProfileRecord> {
    const res = await bridge().execute_query({
      request_id: rid(), command: "dataset.profile",
      payload: { project_id: projectId, dataset_id: datasetId },
    }) as BridgeResponse<ProfileRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "getProfile failed");
    return res.data;
  },
  async runProfile(projectId: string, datasetId: string): Promise<ProfileRecord> {
    const res = await bridge().execute_command({
      request_id: rid(), command: "dataset.profile.run",
      payload: { project_id: projectId, dataset_id: datasetId },
    }) as BridgeResponse<ProfileRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "runProfile failed");
    return res.data;
  },
  async listProfiles(projectId: string, datasetId: string): Promise<ProfileListRecord> {
    const res = await bridge().execute_query({
      request_id: rid(), command: "dataset.profiles.list",
      payload: { project_id: projectId, dataset_id: datasetId },
    }) as BridgeResponse<ProfileListRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "listProfiles failed");
    return res.data;
  },
  async getProfileById(projectId: string, profileId: string): Promise<ProfileRecord> {
    const res = await bridge().execute_query({
      request_id: rid(), command: "dataset.profile.get",
      payload: { project_id: projectId, profile_id: profileId },
    }) as BridgeResponse<ProfileRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "getProfileById failed");
    return res.data;
  },
  async listSnapshots(projectId: string): Promise<SnapshotListRecord> {
    const res = await bridge().execute_query({
      request_id: rid(), command: "dataset.snapshots.list",
      payload: { project_id: projectId },
    }) as BridgeResponse<SnapshotListRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "listSnapshots failed");
    return res.data;
  },
  async getProvenance(projectId: string, datasetId: string): Promise<ProvenanceRecord> {
    const res = await bridge().execute_query({
      request_id: rid(), command: "dataset.provenance",
      payload: { project_id: projectId, dataset_id: datasetId },
    }) as BridgeResponse<ProvenanceRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "getProvenance failed");
    return res.data;
  },
  async createFinding(projectId: string, datasetId: string, title: string, body: string, evidenceSnapshotId: string, evidenceFingerprint: string): Promise<FindingRecord> {
    const res = await bridge().execute_command({
      request_id: rid(), command: "insight.finding.create",
      payload: { project_id: projectId, dataset_id: datasetId, title, body, evidence_snapshot_id: evidenceSnapshotId, evidence_fingerprint: evidenceFingerprint },
    }) as BridgeResponse<FindingRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "createFinding failed");
    return res.data;
  },
  async transitionFinding(projectId: string, findingId: string, toStatus: FindingStatus): Promise<FindingRecord> {
    const res = await bridge().execute_command({
      request_id: rid(), command: "insight.finding.transition",
      payload: { project_id: projectId, finding_id: findingId, to_status: toStatus },
    }) as BridgeResponse<FindingRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "transitionFinding failed");
    return res.data;
  },
  async listFindings(projectId: string, datasetId: string): Promise<FindingListRecord> {
    const res = await bridge().execute_query({
      request_id: rid(), command: "insight.findings.list",
      payload: { project_id: projectId, dataset_id: datasetId },
    }) as BridgeResponse<FindingListRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "listFindings failed");
    return res.data;
  },
  async createHypothesis(projectId: string, datasetId: string, statement: string): Promise<HypothesisRecord> {
    const res = await bridge().execute_command({
      request_id: rid(), command: "insight.hypothesis.create",
      payload: { project_id: projectId, dataset_id: datasetId, statement },
    }) as BridgeResponse<HypothesisRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "createHypothesis failed");
    return res.data;
  },
  async transitionHypothesis(projectId: string, hypothesisId: string, toStatus: HypothesisStatus): Promise<HypothesisRecord> {
    const res = await bridge().execute_command({
      request_id: rid(), command: "insight.hypothesis.transition",
      payload: { project_id: projectId, hypothesis_id: hypothesisId, to_status: toStatus },
    }) as BridgeResponse<HypothesisRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "transitionHypothesis failed");
    return res.data;
  },
  async listHypotheses(projectId: string, datasetId: string): Promise<HypothesisListRecord> {
    const res = await bridge().execute_query({
      request_id: rid(), command: "insight.hypotheses.list",
      payload: { project_id: projectId, dataset_id: datasetId },
    }) as BridgeResponse<HypothesisListRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "listHypotheses failed");
    return res.data;
  },
  async runHistogram(projectId: string, datasetId: string, columnName: string): Promise<HistogramRecord> {
    const res = await bridge().execute_command({
      request_id: rid(), command: "dataset.histogram.run",
      payload: { project_id: projectId, dataset_id: datasetId, column_name: columnName },
    }) as BridgeResponse<HistogramRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "runHistogram failed");
    return res.data;
  },
  async runQuality(projectId: string, datasetId: string): Promise<QualityRecord> {
    const res = await bridge().execute_command({
      request_id: rid(), command: "dataset.quality.run",
      payload: { project_id: projectId, dataset_id: datasetId },
    }) as BridgeResponse<QualityRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "runQuality failed");
    return res.data;
  },
  async runBivariate(projectId: string, datasetId: string, columnA: string, columnB: string): Promise<BivariateRecord> {
    const res = await bridge().execute_command({
      request_id: rid(), command: "dataset.bivariate.run",
      payload: { project_id: projectId, dataset_id: datasetId, column_a: columnA, column_b: columnB },
    }) as BridgeResponse<BivariateRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "runBivariate failed");
    return res.data;
  },
  async runReport(projectId: string, datasetId: string, scope: ReportScope): Promise<ReportRecord> {
    const res = await bridge().execute_command({
      request_id: rid(), command: "dataset.report.generate",
      payload: { project_id: projectId, dataset_id: datasetId, scope },
    }) as BridgeResponse<ReportRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "runReport failed");
    return res.data;
  },
  async runPdf(projectId: string, datasetId: string, scope: ReportScope): Promise<PdfRecord> {
    const res = await bridge().execute_command({
      request_id: rid(), command: "dataset.pdf.generate",
      payload: { project_id: projectId, dataset_id: datasetId, scope },
    }) as BridgeResponse<PdfRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "runPdf failed");
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
    const res = await bridge().execute_query({
      request_id: rid(), command: "dataset.cleaning.preview",
      payload: {
        project_id: projectId, dataset_id: datasetId, operation, columns,
        strategy: strategy ?? null, constant_value: constantValue ?? null,
      },
    }) as BridgeResponse<CleaningPreviewSummary>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "previewCleaning failed");
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
    const res = await bridge().execute_command({
      request_id: rid(), command: "dataset.cleaning.run",
      payload: {
        project_id: projectId, dataset_id: datasetId, operation, columns,
        strategy: strategy ?? null, constant_value: constantValue ?? null,
        expected_parent_fingerprint: expectedParentFingerprint,
      },
    }) as BridgeResponse<CleaningRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "runCleaning failed");
    return res.data;
  },
  async createBackup(projectId: string, destPath: string): Promise<BackupRecord> {
    const res = await bridge().execute_command({
      request_id: rid(), command: "project.backup.create",
      payload: { project_id: projectId, dest_path: destPath },
    }) as BridgeResponse<BackupRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "createBackup failed");
    return res.data;
  },
  async createDiagnostic(projectId: string, destPath: string): Promise<DiagnosticRecord> {
    const res = await bridge().execute_command({
      request_id: rid(), command: "project.diagnostic.create",
      payload: { project_id: projectId, dest_path: destPath },
    }) as BridgeResponse<DiagnosticRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "createDiagnostic failed");
    return res.data;
  },
  async restoreProject(archivePath: string, destRoot: string): Promise<RestoreRecord> {
    const res = await bridge().execute_command({
      request_id: rid(), command: "project.restore",
      payload: { archive_path: archivePath, dest_root: destRoot },
    }) as BridgeResponse<RestoreRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "restoreProject failed");
    return res.data;
  },
  async exportDataset(projectId: string, datasetId: string, format: ExportFormat, destPath: string): Promise<ExportRecord> {
    const res = await bridge().execute_command({
      request_id: rid(), command: "dataset.export",
      payload: { project_id: projectId, dataset_id: datasetId, format, dest_path: destPath },
    }) as BridgeResponse<ExportRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "exportDataset failed");
    return res.data;
  },
  async activateSnapshot(projectId: string, datasetId: string, snapshotId: string): Promise<DatasetRecord> {
    const res = await bridge().execute_command({
      request_id: rid(), command: "dataset.snapshot.activate",
      payload: { project_id: projectId, dataset_id: datasetId, snapshot_id: snapshotId },
    }) as BridgeResponse<DatasetRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "activateSnapshot failed");
    return res.data;
  },
  async getEvents(sinceSeq = 0): Promise<JobEvent[]> {
    return bridge().get_events(sinceSeq);
  },
};
