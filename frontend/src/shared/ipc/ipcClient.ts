/**
 * Single IPC abstraction (FE-001, ES-6.x). The ONLY place that touches
 * `window.pywebview`. Server state is backend-authoritative (FE-003);
 * TanStack Query owns server cache, Zustand is for ephemeral UI state.
 */
import type {
  DatasetRecord,
  JobEvent,
  PreviewRecord,
  ProjectRecord,
  ProtocolInfo,
} from "./generated";

export interface BridgeResponse<T> {
  ok: boolean;
  data: T | null;
  error: { code: string; message: string; correlation_id: string | null } | null;
  protocol_version: string;
  correlation_id: string | null;
}

interface PywebviewBridge {
  get_protocol_info(): ProtocolInfo;
  execute_command(req: unknown): BridgeResponse<unknown>;
  execute_query(req: unknown): BridgeResponse<unknown>;
  get_events(sinceSeq: number): JobEvent[];
}

declare global {
  interface Window {
    pywebview?: PywebviewBridge;
  }
}

let seq = 0;
function rid(): string {
  seq += 1;
  return `req-${Date.now()}-${seq}`;
}

function bridge(): PywebviewBridge {
  if (!window.pywebview) {
    throw new Error("pywebview bridge unavailable — run inside the desktop shell (demo mode: use `pnpm dev` with a mock)");
  }
  return window.pywebview;
}

export const ipcClient = {
  getProtocolInfo(): ProtocolInfo {
    return bridge().get_protocol_info();
  },
  async createProject(name: string): Promise<ProjectRecord> {
    const res = bridge().execute_command({
      request_id: rid(), command: "project.create", payload: { name },
    }) as BridgeResponse<ProjectRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "createProject failed");
    return res.data;
  },
  async importDataset(projectId: string, sourcePath: string, datasetName: string): Promise<DatasetRecord> {
    const res = bridge().execute_command({
      request_id: rid(), command: "dataset.import",
      payload: { project_id: projectId, source_path: sourcePath, dataset_name: datasetName },
    }) as BridgeResponse<DatasetRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "importDataset failed");
    return res.data;
  },
  async getPreview(projectId: string, datasetId: string, limit = 20): Promise<PreviewRecord> {
    const res = bridge().execute_query({
      request_id: rid(), command: "dataset.preview",
      payload: { project_id: projectId, dataset_id: datasetId, limit },
    }) as BridgeResponse<PreviewRecord>;
    if (!res.ok || !res.data) throw new Error(res.error?.message ?? "getPreview failed");
    return res.data;
  },
  async getEvents(sinceSeq = 0): Promise<JobEvent[]> {
    return bridge().get_events(sinceSeq);
  },
};
