/**
 * DatasetExplorer.tsx — P2-2 route Dataset: preview snapshot aktif,
 * export CSV/Parquet/Excel, dan histogram. Guard bila belum ada dataset.
 */
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ipcClient } from "../../shared/ipc/ipcClient";
import type { ExportFormat, ExportRecord, HistogramRecord } from "../../shared/ipc/generated";
import { useProject } from "../../app/ProjectContext";
import { useRouter } from "../../app/router";
import { useToast } from "../../shared/ui/Toaster";
import { EmptyState, LoadingSkeleton } from "../../shared/ui/LoadingSkeleton";
import { HistogramChart } from "../histogram/HistogramChart";

export function DatasetExplorer() {
  const { projectId, dataset } = useProject();
  const { navigate } = useRouter();
  const toast = useToast();

  const preview = useQuery({
    queryKey: ["preview", projectId, dataset?.dataset_id],
    queryFn: () => ipcClient.getPreview(projectId!, dataset!.dataset_id),
    enabled: !!projectId && !!dataset,
  });

  // M3 P3 export CSV/Parquet/Excel (Doc04 §11): dest path text input; single-record download.
  const [exportPath, setExportPath] = useState("");
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
            required
          />
          <button type="submit" disabled={runHistogram.isPending || !histColumn}>
            {runHistogram.isPending ? "Menjalankan…" : "Jalankan Histogram"}
          </button>
        </form>
        {histRecord && <HistogramChart record={histRecord} />}
      </section>
      <section>
        <h2>Export (Doc04 §11)</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            doExport.mutate({ format: exportFormat, dest: exportPath });
          }}
        >
          <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as ExportFormat)}>
            <option value="csv">CSV</option>
            <option value="parquet">Parquet</option>
            <option value="excel">Excel</option>
          </select>
          <input
            value={exportPath}
            onChange={(e) => setExportPath(e.target.value)}
            placeholder="Path file tujuan (.csv/.parquet/.xlsx)"
            required
          />
          <button type="submit" disabled={doExport.isPending}>
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
        </section>
      )}
    </>
  );
}
