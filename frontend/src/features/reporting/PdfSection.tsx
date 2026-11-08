/**
 * PdfSection — SCREEN-PDF-001 + FLOW-PDF-001.
 * Primary action "Buat PDF" (JobManager-wrapped dataset.pdf.generate via
 * ipcClient), PdfSummary after done, partial (stale) banner, draft badge,
 * error copy. "Unduh/Buka" opens host-side via artifact.open (FLOW §2.7) —
 * never a raw file_path href. Komposisi di ReportPage (P2-2).
 */
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ipcClient } from "../../shared/ipc/ipcClient";
import type { DatasetRecord, PdfRecord, ProfileRecord } from "../../shared/ipc/generated";
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

  // FLOW §2.7: host-side open via artifact.open — never a raw-path href.
  // Identity: (snapshot_id, pdf_fingerprint); the backend resolves and
  // verifies the artifact strictly under <project root>/reports.
  const openArtifact = useMutation({
    mutationFn: () =>
      record
        ? ipcClient.openArtifact(
            projectId,
            dataset.dataset_id,
            "pdf",
            record.snapshot_id,
            record.pdf_fingerprint,
          )
        : Promise.reject(new Error("no record")),
  });

  const hasStale = !!record && record.sections.some((s) => s.stale);

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
              <p>{`eda-report-${record.snapshot_id.slice(0, 8)}.pdf`}</p>
              <p>{record.validation_summary}</p>
              {record.is_final ? <p>{PDF_COPY.final}</p> : <p>{PDF_COPY.draft}</p>}
              {hasStale && <p>{PDF_COPY.stale}</p>}
              <button
                type="button"
                disabled={openArtifact.isPending}
                onClick={() => openArtifact.mutate()}
              >
                {openArtifact.isPending ? PDF_COPY.opening : PDF_COPY.unduh}
              </button>
              {openArtifact.isSuccess && <p role="status">{PDF_COPY.opened}</p>}
              {openArtifact.isError && (
                <p role="alert">{PDF_COPY.openError(openArtifact.error.message)}</p>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}
