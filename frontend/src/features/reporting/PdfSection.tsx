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
import { PDF_COPY, REPORT_COPY } from "../../shared/copy/featureCopy";

interface Props {
  projectId: string;
  dataset: DatasetRecord;
  savedProfile: ProfileRecord | null;
}

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
      <h2>{PDF_COPY.title}</h2>
      {!savedProfile && (
        <>
          <p>{PDF_COPY.emptyFirst}</p>
          <p><button disabled>{REPORT_COPY.create}</button></p>
        </>
      )}
      {savedProfile && (
        <>
          {record && !record.is_final && <p role="alert">{PDF_COPY.partial}</p>}
          <button disabled={runPdf.isPending} onClick={() => runPdf.mutate()}>
            {PDF_COPY.primer}
          </button>
          {runPdf.isPending && <p role="status">{PDF_COPY.loading}</p>}
          {runPdf.isError && <p role="alert">{PDF_COPY.error} — {runPdf.error.message}</p>}
          {record && (
            <>
              <p aria-live="polite">
                {PDF_COPY.ready(
                  record.sections.length,
                  record.page_count,
                  record.pdf_fingerprint.slice(0, 12),
                  record.source_html_fingerprint.slice(0, 12),
                  record.renderer_version,
                  record.file_size_bytes,
                )}
              </p>
              <p>{record.validation_summary}</p>
              {record.is_final ? <p>{PDF_COPY.final}</p> : <p>{PDF_COPY.draft}</p>}
              {hasStale && <p>{PDF_COPY.stale}</p>}
              <button onClick={unduhPdf}>{PDF_COPY.unduh}</button>
              <p>{record.file_path}</p>
            </>
          )}
        </>
      )}
    </section>
  );
}
