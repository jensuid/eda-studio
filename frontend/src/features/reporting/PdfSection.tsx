/**
 * PdfSection — SCREEN-PDF-001 + FLOW-PDF-001.
 * Primary action "Buat PDF" (JobManager-wrapped dataset.pdf.generate via
 * ipcClient), PdfSummary after done, partial (stale) banner, draft badge,
 * error copy. Komposisi di ReportPage (P2-2).
 */
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ipcClient } from "../../shared/ipc/ipcClient";
import type { DatasetRecord, PdfRecord, ProfileRecord, ReportScope } from "../../shared/ipc/generated";

interface Props {
  projectId: string;
  dataset: DatasetRecord;
  savedProfile: ProfileRecord | null;
}

const COPY = {
  title: "PDF Report",
  primer: "Buat PDF",
  unduh: "Unduh PDF",
  loading: "Membuat PDF…",
  error: "PDF gagal dibuat. Silakan coba lagi.",
  emptyFirst: "Buat Report HTML terlebih dahulu.",
  partial: "Ada hasil usang — lihat daftar sebelum mengunduh.",
  done: "PDF siap diunduh.",
  stale: "Hasil mungkin usang — jalankan ulang.",
  draft: "Draft — bukan final export.",
} as const;

export function PdfSection({ projectId, dataset, savedProfile }: Props) {
  const [record, setRecord] = useState<PdfRecord | null>(null);
  const runPdf = useMutation({
    mutationFn: () => ipcClient.runPdf(projectId, dataset.dataset_id, "all"),
    onSuccess: (r) => setRecord(r),
  });

  const hasStale = !!record && record.sections.some((s) => s.stale);

  const unduhPdf = () => {
    if (!record) return;
    const a = document.createElement("a");
    a.href = record.file_path;
    a.download = `eda-report-${record.snapshot_id.slice(0, 8)}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <section>
      <h2>{COPY.title}</h2>
      {!savedProfile && (
        <>
          <p>{COPY.emptyFirst}</p>
          <p><button disabled>Buat Report HTML</button></p>
        </>
      )}
      {savedProfile && (
        <>
          {record && !record.is_final && <p role="alert">{COPY.partial}</p>}
          <button disabled={runPdf.isPending} onClick={() => runPdf.mutate()}>
            {COPY.primer}
          </button>
          {runPdf.isPending && <p role="status">{COPY.loading}</p>}
          {runPdf.isError && <p role="alert">{COPY.error} — {runPdf.error.message}</p>}
          {record && (
            <>
              <p aria-live="polite">
                {COPY.done} — {record.sections.length} section · {record.page_count} halaman ·
                pdf fingerprint {record.pdf_fingerprint.slice(0, 12)}… · sumber{" "}
                {record.source_html_fingerprint.slice(0, 12)}… · renderer {record.renderer_version} ·{" "}
                {record.file_size_bytes} bytes
              </p>
              <p>{record.validation_summary}</p>
              {record.is_final ? <p>Final.</p> : <p>{COPY.draft}</p>}
              {hasStale && <p>{COPY.stale}</p>}
              <button onClick={unduhPdf}>{COPY.unduh}</button>
              <p>{record.file_path}</p>
            </>
          )}
        </>
      )}
    </section>
  );
}
