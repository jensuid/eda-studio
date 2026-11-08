/**
 * BivariateSection — SCREEN-BIVAR-001 + FLOW-BIVAR-001.
 * Two-column selector + mode label, JobManager-wrapped run via ipcClient
 * (mutation-driven feedback, never query isPending), 8 states, stale
 * banner, exact/sampled badge. Komposisi di BivariatePage (P2-2).
 */
import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ipcClient } from "../../shared/ipc/ipcClient";
import type { BivariateRecord, DatasetRecord, ProfileRecord } from "../../shared/ipc/generated";
import { BIVARIAT_COPY, COMMON_COPY } from "../../shared/copy/featureCopy";
import { BivariateChart } from "./BivariateChart";

interface Props {
  projectId: string;
  dataset: DatasetRecord;
  savedProfile: ProfileRecord | null;
}

function modeLabel(typeA: string, typeB: string): string {
  if (typeA === "numeric" && typeB === "numeric") return BIVARIAT_COPY.modeNumNum;
  if (typeA === "categorical" && typeB === "numeric") return BIVARIAT_COPY.modeCatNum;
  if (typeA === "numeric" && typeB === "categorical") return BIVARIAT_COPY.modeNumCat;
  if (typeA === "categorical" && typeB === "categorical") return BIVARIAT_COPY.modeCatCat;
  return BIVARIAT_COPY.modeUnsupported;
}

export function BivariateSection({ projectId, dataset, savedProfile }: Props) {
  const [columnA, setColumnA] = useState("");
  const [columnB, setColumnB] = useState("");
  const [record, setRecord] = useState<BivariateRecord | null>(null);

  const typeByName = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of savedProfile?.columns ?? []) m[c.name] = c.inferred_type;
    return m;
  }, [savedProfile]);

  const valid = !!columnA && !!columnB && columnA !== columnB;
  const pairError = columnA && columnB && columnA === columnB ? BIVARIAT_COPY.pairError : "";
  const typeA = columnA ? (typeByName[columnA] ?? "") : "";
  const typeB = columnB ? (typeByName[columnB] ?? "") : "";
  const label = columnA && columnB && typeA && typeB ? modeLabel(typeA, typeB) : "";

  const runBivariate = useMutation({
    mutationFn: () => ipcClient.runBivariate(projectId, dataset.dataset_id, columnA, columnB),
    onSuccess: (r) => setRecord(r),
  });

  const stale = !!record && record.fingerprint !== dataset.fingerprint;

  return (
    <section>
      <h2>{BIVARIAT_COPY.heading}</h2>
      {!savedProfile && (
        <>
          <p>{COMMON_COPY.runProfilingFirst}</p>
          <p><button disabled>{BIVARIAT_COPY.run}</button></p>
        </>
      )}
      {savedProfile && (
        <>
          <label htmlFor="bivar-a">{BIVARIAT_COPY.columnALabel}</label>{" "}
          <select id="bivar-a" value={columnA} onChange={(e) => setColumnA(e.target.value)}>
            <option value="">{BIVARIAT_COPY.choosePlaceholder}</option>
            {dataset.columns.map((c) => <option key={`a-${c}`} value={c}>{c}</option>)}
          </select>{" "}
          <label htmlFor="bivar-b">{BIVARIAT_COPY.columnBLabel}</label>{" "}
          <select id="bivar-b" value={columnB} onChange={(e) => setColumnB(e.target.value)}>
            <option value="">{BIVARIAT_COPY.choosePlaceholder}</option>
            {dataset.columns.map((c) => <option key={`b-${c}`} value={c}>{c}</option>)}
          </select>{" "}
          {label && <p>{label}</p>}
          {pairError && <p role="alert">{pairError}</p>}
          {label === BIVARIAT_COPY.modeUnsupported && <p role="alert">{BIVARIAT_COPY.unsupportedPair}</p>}
          <button
            disabled={runBivariate.isPending || !valid || label === BIVARIAT_COPY.modeUnsupported}
            onClick={() => runBivariate.mutate()}
          >
            {BIVARIAT_COPY.run}
          </button>
          {runBivariate.isPending && <p role="status">{BIVARIAT_COPY.running}</p>}
          {runBivariate.isError && <p role="alert">{BIVARIAT_COPY.toastFail(runBivariate.error.message)}</p>}
          {record && stale && <p>{BIVARIAT_COPY.stale}</p>}
          {record && record.constant_columns && record.constant_columns.length > 0 && (
            <p>{BIVARIAT_COPY.constantColumn}</p>
          )}
          {record && record.mode === "num-num" && (record.pearson_r == null || record.spearman_rho == null) && (
            <p>{BIVARIAT_COPY.undefinedCorrelation}</p>
          )}
          {record && record.mode !== "empty" && <BivariateChart record={record} />}
          {record && record.mode === "empty" && <p>{BIVARIAT_COPY.noPairs}</p>}
        </>
      )}
    </section>
  );
}
