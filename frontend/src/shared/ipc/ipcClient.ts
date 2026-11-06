/**
 * Single IPC abstraction (FE-001, ES-6.x). The ONLY place that touches
 * `window.pywebview`. Server state is backend-authoritative (FE-003);
 * TanStack Query owns server cache, Zustand is for ephemeral UI state.
 */
import type {
  CleaningOperation,
  CleaningPreviewSummary,
  CleaningRecord,
  CleaningStrategy,
  DatasetRecord,
  HistogramRecord,
  JobEvent,
  PreviewRecord,
  ProfileListRecord,
  ProfileRecord,
  ProjectRecord,
  QualityRecord,
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
