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
import { BivariateChart } from "./BivariateChart";

interface Props {
  projectId: string;
  dataset: DatasetRecord;
  savedProfile: ProfileRecord | null;
}

function modeLabel(typeA: string, typeB: string): string {
  if (typeA === "numeric" && typeB === "numeric") return "Korelasi (numerik × numerik)";
  if (typeA === "categorical" && typeB === "numeric") return "Grup (kategorikal × numerik)";
  if (typeA === "numeric" && typeB === "categorical") return "Grup (numerik × kategorikal)";
  if (typeA === "categorical" && typeB === "categorical") return "Silang (kategorikal × kategorikal)";
  return "Tipe tidak didukung";
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
  const pairError = columnA && columnB && columnA === columnB ? "Pilih dua kolom yang berbeda." : "";
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
      <h2>Analisis Bivariat</h2>
      {!savedProfile && (
        <>
          <p>Jalankan profiling terlebih dahulu.</p>
          <p><button disabled> Jalankan Analisis Bivariat</button></p>
        </>
      )}
      {savedProfile && (
        <>
          <label htmlFor="bivar-a">Kolom A</label>{" "}
          <select id="bivar-a" value={columnA} onChange={(e) => setColumnA(e.target.value)}>
            <option value="">— pilih —</option>
            {dataset.columns.map((c) => <option key={`a-${c}`} value={c}>{c}</option>)}
          </select>{" "}
          <label htmlFor="bivar-b">Kolom B</label>{" "}
          <select id="bivar-b" value={columnB} onChange={(e) => setColumnB(e.target.value)}>
            <option value="">— pilih —</option>
            {dataset.columns.map((c) => <option key={`b-${c}`} value={c}>{c}</option>)}
          </select>{" "}
          {label && <p>{label}</p>}
          {pairError && <p role="alert">{pairError}</p>}
          {label === "Tipe tidak didukung" && <p role="alert">Pasangan tipe ini tidak didukung untuk analisis bivariat.</p>}
          <button
            disabled={runBivariate.isPending || !valid || label === "Tipe tidak didukung"}
            onClick={() => runBivariate.mutate()}
          >
            Jalankan Analisis Bivariat
          </button>
          {runBivariate.isPending && <p role="status">Menghitung bivariat…</p>}
          {runBivariate.isError && <p role="alert">Analisis bivariat gagal. Silakan coba lagi. — {runBivariate.error.message}</p>}
          {record && stale && <p>Hasil mungkin usang — jalankan ulang.</p>}
          {record && record.constant_columns && record.constant_columns.length > 0 && (
            <p>Kolom ini konstan.</p>
          )}
          {record && record.mode === "num-num" && (record.pearson_r == null || record.spearman_rho == null) && (
            <p>Korelasi tidak terdefinisi untuk kolom konstan.</p>
          )}
          {record && record.mode !== "empty" && <BivariateChart record={record} />}
          {record && record.mode === "empty" && <p>Tidak ada pasangan nilai untuk dihitung.</p>}
        </>
      )}
    </section>
  );
}
