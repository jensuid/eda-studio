/**
 * ReportSection — SCREEN-REPORT-001 + FLOW-REPORT-001.
 * Scope radio + source list, JobManager-wrapped generate via ipcClient
 * (mutation-driven feedback, never query isPending), 8 states, stale
 * banner, draft/final badge. Komposisi di ReportPage (P2-2).
 */
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { ipcClient } from "../../shared/ipc/ipcClient";
import type { DatasetRecord, ProfileRecord, ReportRecord, ReportScope } from "../../shared/ipc/generated";
import { COMMON_COPY, REPORT_COPY } from "../../shared/copy/featureCopy";

interface Props {
  projectId: string;
  dataset: DatasetRecord;
  savedProfile: ProfileRecord | null;
}

const SCOPES: { value: ReportScope; label: string }[] = [
  { value: "all", label: REPORT_COPY.scopeAll },
  { value: "profile-quality", label: REPORT_COPY.scopeProfileQuality },
  { value: "with-charts", label: REPORT_COPY.scopeWithCharts },
  { value: "with-visuals", label: REPORT_COPY.scopeWithVisuals },
];

export function ReportSection({ projectId, dataset, savedProfile }: Props) {
  const [scope, setScope] = useState<ReportScope>("all");
  const [record, setRecord] = useState<ReportRecord | null>(null);

  const runReport = useMutation({
    mutationFn: () => ipcClient.runReport(projectId, dataset.dataset_id, scope),
    onSuccess: (r) => setRecord(r),
  });

  // FLOW §2.7: host-side open via artifact.open — never a raw-path href.
  const openArtifact = useMutation({
    mutationFn: () =>
      record
        ? ipcClient.openArtifact(
            projectId,
            dataset.dataset_id,
            "html",
            record.snapshot_id,
            record.content_fingerprint,
          )
        : Promise.reject(new Error("no record")),
  });

  const hasStale = !!record && record.sections.some((s) => s.stale);

  return (
    <section>
      <h2>{REPORT_COPY.heading}</h2>
      {!savedProfile && (
        <>
          <p>{COMMON_COPY.runProfilingFirst}</p>
          <p><button disabled>{REPORT_COPY.create}</button></p>
        </>
      )}
      {savedProfile && (
        <>
          <fieldset>
            <legend>{REPORT_COPY.scopeLegend}</legend>
            {SCOPES.map((s) => (
              <label key={s.value} className="form-label-block">
                <input
                  type="radio"
                  name="report-scope"
                  value={s.value}
                  checked={scope === s.value}
                  onChange={() => setScope(s.value)}
                />{" "}
                {s.label}
              </label>
            ))}
          </fieldset>
          <ul>
            <li>{REPORT_COPY.profilingFingerprint(savedProfile.fingerprint.slice(0, 12))}</li>
            {savedProfile.fingerprint !== dataset.fingerprint && <li>{REPORT_COPY.staleSource}</li>}
          </ul>
          {hasStale && <p>{REPORT_COPY.staleList}</p>}
          <button disabled={runReport.isPending} onClick={() => runReport.mutate()}>
            {REPORT_COPY.create}
          </button>
          {runReport.isPending && <p role="status">{REPORT_COPY.creating}</p>}
          {runReport.isError && <p role="alert">{REPORT_COPY.toastFail(runReport.error.message)}</p>}
          {record && (
            <>
              <p aria-live="polite">
                {REPORT_COPY.ready(
                  record.sections.length,
                  record.fingerprint.slice(0, 12),
                  record.file_size_bytes,
                )}
              </p>
              <button
                type="button"
                disabled={openArtifact.isPending}
                onClick={() => openArtifact.mutate()}
              >
                {openArtifact.isPending ? REPORT_COPY.opening : REPORT_COPY.open}
              </button>
              {openArtifact.isSuccess && (
                <p role="status">{REPORT_COPY.opened}</p>
              )}
              {openArtifact.isError && (
                <p role="alert">
                  {REPORT_COPY.openError(openArtifact.error.message)}
                </p>
              )}
              <p>{record.validation_summary}</p>
              <p>{record.is_final ? REPORT_COPY.final : REPORT_COPY.draft}</p>
            </>
          )}
        </>
      )}
    </section>
  );
}
