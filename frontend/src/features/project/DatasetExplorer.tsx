/**
 * DatasetExplorer.tsx — P2-2 route Dataset: preview snapshot aktif,
 * export CSV/Parquet, dan histogram. Guard bila belum ada dataset.
 */
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ipcClient } from "../../shared/ipc/ipcClient";
import type {
  ExportFormat,
  ExportRecord,
  HistogramRecord,
  PlanStep,
  PlanStepInput,
  PlanStepType,
  PlanStatus,
} from "../../shared/ipc/generated";
import { useProject } from "../../app/ProjectContext";
import { useRouter } from "../../app/router";
import { useToast } from "../../shared/ui/Toaster";
import { EmptyState, LoadingSkeleton } from "../../shared/ui/LoadingSkeleton";
import { HistogramChart } from "../histogram/HistogramChart";
import { FilePathInput } from "./FilePathInput";
import { DestructiveConfirmDialog } from "./DestructiveConfirmDialog";

const PLAN_STEP_TYPES: PlanStepType[] = [
  "profile",
  "histogram",
  "quality",
  "bivariate",
  "report",
  "pdf",
  "readiness",
];

const PLAN_STEP_DEFAULTS: Record<PlanStepType, Record<string, unknown>> = {
  profile: {},
  histogram: { column_name: "" },
  quality: {},
  bivariate: { column_a: "", column_b: "" },
  report: { scope: "all" },
  pdf: { scope: "all" },
  readiness: {},
};

function planStatusClass(status: PlanStatus): string {
  if (status === "executed") return "status-success";
  if (status === "approved") return "status-warning";
  return "";
}

function planStepStatusClass(status: PlanStep["status"]): string {
  if (status === "completed") return "status-success";
  if (status === "failed") return "status-danger";
  return "";
}

export function DatasetExplorer() {
  const { projectId, dataset } = useProject();
  const { navigate } = useRouter();
  const toast = useToast();
  const queryClient = useQueryClient();

  const preview = useQuery({
    queryKey: ["preview", projectId, dataset?.dataset_id],
    queryFn: () => ipcClient.getPreview(projectId!, dataset!.dataset_id),
    enabled: !!projectId && !!dataset,
  });

  // M3 P3 export CSV/Parquet (Doc04 §11): native save dialog; confirm first.
  const [exportPath, setExportPath] = useState("");
  const [confirmExport, setConfirmExport] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [exportRecord, setExportRecord] = useState<ExportRecord | null>(null);
  const doExport = useMutation({
    mutationFn: (v: { format: ExportFormat; dest: string }) =>
      ipcClient.exportDataset(projectId!, dataset!.dataset_id, v.format, v.dest),
    onSuccess: (r) => {
      setExportRecord(r);
      toast.success("Export selesai.");
    },
    onError: (e) => toast.error(`Export gagal: ${e.message}`),
  });

  const [histColumn, setHistColumn] = useState("");
  const [histRecord, setHistRecord] = useState<HistogramRecord | null>(null);
  const runHistogram = useMutation({
    mutationFn: (column: string) =>
      ipcClient.runHistogram(projectId!, dataset!.dataset_id, column),
    onSuccess: (r) => {
      setHistRecord(r);
      toast.success("Histogram selesai.");
    },
    onError: (e) => toast.error(`Histogram gagal: ${e.message}`),
  });

  // NXT-2 (gap G2): Analysis Plan — susun langkah, setujui, eksekusi sekuensial.
  const [planDraft, setPlanDraft] = useState<PlanStepInput[]>([
    { kind: "profile", params: {} },
  ]);
  const [newStepKind, setNewStepKind] = useState<PlanStepType>("profile");

  const addPlanStep = () => {
    setPlanDraft((prev) => [
      ...prev,
      { kind: newStepKind, params: { ...PLAN_STEP_DEFAULTS[newStepKind] } },
    ]);
  };
  const changePlanStepKind = (i: number, kind: PlanStepType) => {
    setPlanDraft((prev) =>
      prev.map((s, idx) => (idx === i ? { kind, params: { ...PLAN_STEP_DEFAULTS[kind] } } : s)),
    );
  };
  const setPlanStepParam = (i: number, key: string, value: string) => {
    setPlanDraft((prev) =>
      prev.map((s, idx) =>
        idx === i ? { ...s, params: { ...s.params, [key]: value } } : s,
      ),
    );
  };
  const removePlanStep = (i: number) => {
    setPlanDraft((prev) => prev.filter((_, idx) => idx !== i));
  };

  const plansQuery = useQuery({
    queryKey: ["plans", projectId, dataset?.dataset_id],
    queryFn: () => ipcClient.listPlans(projectId!, dataset!.dataset_id),
    enabled: !!projectId && !!dataset,
  });
  const approvePlan = useMutation({
    mutationFn: (planId: string) => ipcClient.approvePlan(projectId!, planId),
    onSuccess: () => {
      toast.success("Plan disetujui.");
      void queryClient.invalidateQueries({ queryKey: ["plans", projectId, dataset?.dataset_id] });
    },
    onError: (e) => toast.error(`Menyetujui plan gagal: ${e.message}`),
  });
  const executePlan = useMutation({
    mutationFn: (planId: string) => ipcClient.executePlan(projectId!, planId),
    onSuccess: () => {
      toast.success("Analysis plan dieksekusi.");
      void queryClient.invalidateQueries({ queryKey: ["plans", projectId, dataset?.dataset_id] });
    },
    onError: (e) => toast.error(`Eksekusi analysis plan gagal: ${e.message}`),
  });
  const createPlan = useMutation({
    mutationFn: () => ipcClient.createPlan(projectId!, dataset!.dataset_id, planDraft),
    onSuccess: () => {
      toast.success("Analysis plan dibuat.");
      setPlanDraft([{ kind: "profile", params: {} }]);
      void queryClient.invalidateQueries({ queryKey: ["plans", projectId, dataset?.dataset_id] });
    },
    onError: (e) => toast.error(`Membuat analysis plan gagal: ${e.message}`),
  });

  if (!projectId || !dataset) {
    return (
      <EmptyState title="Dataset">
        <p>Belum ada dataset aktif.</p>
        <button type="button" onClick={() => navigate("setup")}>
          Ke Setup
        </button>
      </EmptyState>
    );
  }

  return (
    <>
      <section>
        <h2>Histogram</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runHistogram.mutate(histColumn);
          }}
        >
          <input
            value={histColumn}
            onChange={(e) => setHistColumn(e.target.value)}
            placeholder="Nama kolom numerik"
            aria-label="Nama kolom numerik"
            required
          />
          <button type="submit" disabled={runHistogram.isPending || !histColumn}>
            {runHistogram.isPending ? "Menjalankan…" : "Jalankan Histogram"}
          </button>
        </form>
        {histRecord && <HistogramChart record={histRecord} />}
      </section>

      {/* NXT-2 (gap G2): Analysis Plan — susun langkah, setujui, eksekusi
          sekuensial lewat job path backend yang ada. Status per step ada di
          PlanRecord; lifecycle backend-authoritative (SYS-015). */}
      {projectId && dataset && (
        <section aria-labelledby="plan-heading">
          <h2 id="plan-heading">Analysis Plan</h2>
          <p>Susun rencana langkah analisis, setujui, lalu jalankan sekuensial.</p>
          {plansQuery.isPending && <LoadingSkeleton label="Memuat plan…" />}
          {plansQuery.data && (
            <ul>
              {plansQuery.data.plans.map((p) => (
                <li key={p.plan_id}>
                  <strong>{p.plan_id.slice(0, 8)}</strong>{" "}
                  <span className={planStatusClass(p.status)}>{p.status}</span>
                  <ul>
                    {p.steps.map((s, i) => (
                      <li key={i}>
                        {s.kind}
                        {s.status ? `: ${s.status}` : ""}
                        {s.error ? ` (${s.error})` : ""}
                      </li>
                    ))}
                  </ul>
                  {p.status === "draft" && (
                    <button type="button" onClick={() => approvePlan.mutate(p.plan_id)}>
                      Setujui
                    </button>
                  )}
                  {p.status === "approved" && (
                    <button type="button" onClick={() => executePlan.mutate(p.plan_id)}>
                      Jalankan
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!plansQuery.data?.plans?.length && !plansQuery.isPending && (
            <p>Belum ada plan untuk dataset ini.</p>
          )}
          <h3>Membuat Plan</h3>
          <ol>
            {planDraft.map((s, i) => (
              <li key={i}>
                <select
                  value={s.kind}
                  onChange={(e) => changePlanStepKind(i, e.target.value as PlanStepType)}
                  aria-label={`Jenis langkah ${i + 1}`}
                >
                  {PLAN_STEP_TYPES.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                {s.kind === "histogram" && (
                  <input
                    value={String(s.params?.column_name ?? "")}
                    onChange={(e) => setPlanStepParam(i, "column_name", e.target.value)}
                    placeholder="Nama kolom numerik"
                    aria-label={`Nama kolom untuk langkah ${i + 1}`}
                  />
                )}
                {s.kind === "bivariate" && (
                  <>
                    <input
                      value={String(s.params?.column_a ?? "")}
                      onChange={(e) => setPlanStepParam(i, "column_a", e.target.value)}
                      placeholder="Kolom pertama"
                      aria-label={`Kolom pertama untuk langkah ${i + 1}`}
                    />
                    <input
                      value={String(s.params?.column_b ?? "")}
                      onChange={(e) => setPlanStepParam(i, "column_b", e.target.value)}
                      placeholder="Kolom kedua"
                      aria-label={`Kolom kedua untuk langkah ${i + 1}`}
                    />
                  </>
                )}
                {s.kind === "report" && (
                  <select
                    value={String(s.params?.scope ?? "all")}
                    onChange={(e) => setPlanStepParam(i, "scope", e.target.value)}
                    aria-label={`Ruang laporan untuk langkah ${i + 1}`}
                  >
                    <option value="all">all</option>
                    <option value="profile-quality">profile-quality</option>
                    <option value="with-charts">with-charts</option>
                    <option value="with-visuals">with-visuals</option>
                  </select>
                )}
                {s.kind === "pdf" && (
                  <select
                    value={String(s.params?.scope ?? "all")}
                    onChange={(e) => setPlanStepParam(i, "scope", e.target.value)}
                    aria-label={`Ruang laporan untuk langkah ${i + 1}`}
                  >
                    <option value="all">all</option>
                    <option value="profile-quality">profile-quality</option>
                    <option value="with-charts">with-charts</option>
                    <option value="with-visuals">with-visuals</option>
                  </select>
                )}
                <button type="button" onClick={() => removePlanStep(i)}>
                  Hapus
                </button>
              </li>
            ))}
          </ol>
          <button type="button" onClick={addPlanStep}>
            Tambah Langkah
          </button>
          <button
            type="button"
            onClick={() => createPlan.mutate()}
            disabled={planDraft.length === 0 || createPlan.isPending}
          >
            Buat Plan
          </button>
        </section>
      )}

      <section>
        <h2>Export (Doc04 §11)</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setConfirmExport(true);
          }}
        >
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
            aria-label="Format export"
          >
            <option value="csv">CSV</option>
            <option value="parquet">Parquet</option>
          </select>
          <FilePathInput
            value={exportPath}
            onChange={setExportPath}
            mode="save"
            fileTypes={[exportFormat]}
            title="Simpan hasil export"
            placeholder={`Path file tujuan (.${exportFormat})`}
            disabled={doExport.isPending || confirmExport}
          />
          <button type="submit" disabled={!exportPath || doExport.isPending}>
            Export
          </button>
        </form>
        {exportRecord && (
          <p>
            Export: {exportRecord.file_path} · {(exportRecord.file_size_bytes / 1024).toFixed(1)} KB ·
            {exportRecord.row_count} rows
          </p>
        )}
      </section>
      {preview.isPending && <LoadingSkeleton label="Memuat preview…" />}
      {preview.data && (
        <section>
          <h2>
            Preview ({preview.data.total_rows} rows{preview.data.truncated ? ", truncated" : ""})
          </h2>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {preview.data.columns.map((c) => (
                    <th key={c}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.data.rows.map((r, i) => (
                  <tr key={i}>
                    {preview.data.columns.map((c) => (
                      <td key={c}>{String(r[c] ?? "")}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {confirmExport && (
        <DestructiveConfirmDialog
          title="Export dataset?"
          description={`Dataset akan di-export sebagai ${exportFormat.toUpperCase()} ke ${exportPath}. File tujuan yang sudah ada akan ditimpa.`}
          confirmLabel="Export"
          pending={doExport.isPending}
          onCancel={() => setConfirmExport(false)}
          onConfirm={() => {
            setConfirmExport(false);
            doExport.mutate({ format: exportFormat, dest: exportPath });
          }}
        />
      )}
    </>
  );
}
