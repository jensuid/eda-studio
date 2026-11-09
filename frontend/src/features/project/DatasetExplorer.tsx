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
import { CHART_COPY, COMMON_COPY, DATASET_COPY } from "../../shared/copy/featureCopy";
import { describeFeatureError } from "../../shared/copy/errorCopy";
import { StaleRefreshBanner } from "../../shared/ui/StaleRefreshBanner";
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
      toast.success(DATASET_COPY.toastExportDone);
    },
    onError: (e) =>
      toast.error(
        describeFeatureError(
          e,
          DATASET_COPY.datasetExportFail.byCode,
          DATASET_COPY.datasetExportFail.generic,
        ).headline,
      ),
  });

  const [histColumn, setHistColumn] = useState("");
  const [histRecord, setHistRecord] = useState<HistogramRecord | null>(null);
  const runHistogram = useMutation({
    mutationFn: (column: string) =>
      ipcClient.runHistogram(projectId!, dataset!.dataset_id, column),
    onSuccess: (r) => {
      setHistRecord(r);
      toast.success(DATASET_COPY.toastHistogramDone);
    },
    onError: (e) =>
      toast.error(
        describeFeatureError(e, DATASET_COPY.histogramFail.byCode, DATASET_COPY.histogramFail.generic)
          .headline,
      ),
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
      toast.success(DATASET_COPY.toastPlanApproved);
      void queryClient.invalidateQueries({ queryKey: ["plans", projectId, dataset?.dataset_id] });
    },
    onError: (e) =>
      toast.error(
        describeFeatureError(
          e,
          DATASET_COPY.planApproveFail.byCode,
          DATASET_COPY.planApproveFail.generic,
        ).headline,
      ),
  });
  const executePlan = useMutation({
    mutationFn: (planId: string) => ipcClient.executePlan(projectId!, planId),
    onSuccess: () => {
      toast.success(DATASET_COPY.toastPlanExecuted);
      void queryClient.invalidateQueries({ queryKey: ["plans", projectId, dataset?.dataset_id] });
    },
    onError: (e) =>
      toast.error(
        describeFeatureError(
          e,
          DATASET_COPY.planExecuteFail.byCode,
          DATASET_COPY.planExecuteFail.generic,
        ).headline,
      ),
  });
  const createPlan = useMutation({
    mutationFn: () => ipcClient.createPlan(projectId!, dataset!.dataset_id, planDraft),
    onSuccess: () => {
      toast.success(DATASET_COPY.toastPlanCreated);
      setPlanDraft([{ kind: "profile", params: {} }]);
      void queryClient.invalidateQueries({ queryKey: ["plans", projectId, dataset?.dataset_id] });
    },
    onError: (e) =>
      toast.error(
        describeFeatureError(e, DATASET_COPY.planCreateFail.byCode, DATASET_COPY.planCreateFail.generic)
          .headline,
      ),
  });

  if (!projectId || !dataset) {
    return (
      <EmptyState title={DATASET_COPY.emptyTitle}>
        <p>{COMMON_COPY.noActiveDataset}</p>
        <button type="button" onClick={() => navigate("setup")}>
          {COMMON_COPY.goToSetup}
        </button>
      </EmptyState>
    );
  }

  return (
    <>
      <section>
        <h2>{DATASET_COPY.histogramTitle}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            runHistogram.mutate(histColumn);
          }}
        >
          <input
            value={histColumn}
            onChange={(e) => setHistColumn(e.target.value)}
            placeholder={DATASET_COPY.numericColumnPlaceholder}
            aria-label={DATASET_COPY.numericColumnLabel}
            required
          />
          <button type="submit" disabled={runHistogram.isPending || !histColumn}>
            {runHistogram.isPending ? DATASET_COPY.running : DATASET_COPY.runHistogram}
          </button>
        </form>
        {histRecord && !!dataset && histRecord.fingerprint !== dataset.fingerprint && (
          <StaleRefreshBanner
            copy={{ ...CHART_COPY, staleDependency: CHART_COPY.staleDependency(dataset.name) }}
            onRefresh={() => runHistogram.mutate(histRecord.column_name)}
            isPending={runHistogram.isPending}
            pendingLabel={DATASET_COPY.running}
          />
        )}
        {histRecord && <HistogramChart record={histRecord} />}
      </section>

      {/* NXT-2 (gap G2): Analysis Plan — susun langkah, setujui, eksekusi
          sekuensial lewat job path backend yang ada. Status per step ada di
          PlanRecord; lifecycle backend-authoritative (SYS-015). */}
      {projectId && dataset && (
        <section aria-labelledby="plan-heading">
          <h2 id="plan-heading">{DATASET_COPY.planTitle}</h2>
          <p>{DATASET_COPY.planIntro}</p>
          {plansQuery.isPending && <LoadingSkeleton label={DATASET_COPY.loadingPlans} />}
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
                      {DATASET_COPY.approveAction}
                    </button>
                  )}
                  {p.status === "approved" && (
                    <button type="button" onClick={() => executePlan.mutate(p.plan_id)}>
                      {DATASET_COPY.executeAction}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!plansQuery.data?.plans?.length && !plansQuery.isPending && (
            <p>{DATASET_COPY.noPlansYet}</p>
          )}
          <h3>{DATASET_COPY.makePlanTitle}</h3>
          <ol>
            {planDraft.map((s, i) => (
              <li key={i}>
                <select
                  value={s.kind}
                  onChange={(e) => changePlanStepKind(i, e.target.value as PlanStepType)}
                  aria-label={DATASET_COPY.stepKindLabel(i + 1)}
                >
                  {PLAN_STEP_TYPES.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                {s.kind === "histogram" && (
                  <input
                    value={String(s.params?.column_name ?? "")}
                    onChange={(e) => setPlanStepParam(i, "column_name", e.target.value)}
                    placeholder={DATASET_COPY.numericColumnPlaceholder}
                    aria-label={DATASET_COPY.stepColumnLabel(i + 1)}
                  />
                )}
                {s.kind === "bivariate" && (
                  <>
                    <input
                      value={String(s.params?.column_a ?? "")}
                      onChange={(e) => setPlanStepParam(i, "column_a", e.target.value)}
                      placeholder={DATASET_COPY.firstColumnPlaceholder}
                      aria-label={DATASET_COPY.firstColumnLabel(i + 1)}
                    />
                    <input
                      value={String(s.params?.column_b ?? "")}
                      onChange={(e) => setPlanStepParam(i, "column_b", e.target.value)}
                      placeholder={DATASET_COPY.secondColumnPlaceholder}
                      aria-label={DATASET_COPY.secondColumnLabel(i + 1)}
                    />
                  </>
                )}
                {s.kind === "report" && (
                  <select
                    value={String(s.params?.scope ?? "all")}
                    onChange={(e) => setPlanStepParam(i, "scope", e.target.value)}
                    aria-label={DATASET_COPY.stepScopeLabel(i + 1)}
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
                    aria-label={DATASET_COPY.stepScopeLabel(i + 1)}
                  >
                    <option value="all">all</option>
                    <option value="profile-quality">profile-quality</option>
                    <option value="with-charts">with-charts</option>
                    <option value="with-visuals">with-visuals</option>
                  </select>
                )}
                <button type="button" onClick={() => removePlanStep(i)}>
                  {DATASET_COPY.removeStep}
                </button>
              </li>
            ))}
          </ol>
          <button type="button" onClick={addPlanStep}>
            {DATASET_COPY.addStep}
          </button>
          <button
            type="button"
            onClick={() => createPlan.mutate()}
            disabled={planDraft.length === 0 || createPlan.isPending}
          >
            {DATASET_COPY.createPlan}
          </button>
        </section>
      )}

      <section>
        <h2>{DATASET_COPY.exportTitle}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setConfirmExport(true);
          }}
        >
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as ExportFormat)}
            aria-label={DATASET_COPY.exportFormatLabel}
          >
            <option value="csv">{DATASET_COPY.formatCsv}</option>
            <option value="parquet">{DATASET_COPY.formatParquet}</option>
          </select>
          <FilePathInput
            value={exportPath}
            onChange={setExportPath}
            mode="save"
            fileTypes={[exportFormat]}
            title={DATASET_COPY.saveExportFile}
            placeholder={DATASET_COPY.exportDestPlaceholder(exportFormat)}
            disabled={doExport.isPending || confirmExport}
          />
          <button type="submit" disabled={!exportPath || doExport.isPending}>
            {DATASET_COPY.exportAction}
          </button>
        </form>
        {exportRecord && (
          <p>
            {DATASET_COPY.exportResult(exportRecord.file_path, (exportRecord.file_size_bytes / 1024).toFixed(1), exportRecord.row_count)}
          </p>
        )}
      </section>
      {preview.isPending && <LoadingSkeleton label={DATASET_COPY.loadingPreview} />}
      {preview.data && (
        <section>
          <h2>
            {DATASET_COPY.previewTitle(preview.data.total_rows, preview.data.truncated)}
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
          title={DATASET_COPY.confirmExportTitle}
          description={DATASET_COPY.confirmExportDesc(exportFormat.toUpperCase(), exportPath)}
          confirmLabel={DATASET_COPY.exportAction}
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
