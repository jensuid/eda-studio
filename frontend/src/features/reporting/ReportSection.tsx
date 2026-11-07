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

interface Props {
  projectId: string;
  dataset: DatasetRecord;
  savedProfile: ProfileRecord | null;
}

const SCOPES: { value: ReportScope; label: string }[] = [
  { value: "all", label: "Semua analisis yang ada" },
  { value: "profile-quality", label: "Profiling + Quality saja" },
  { value: "with-charts", label: "+ Histogram" },
  { value: "with-visuals", label: "+ Bivariate" },
];

export function ReportSection({ projectId, dataset, savedProfile }: Props) {
  const [scope, setScope] = useState<ReportScope>("all");
  const [record, setRecord] = useState<ReportRecord | null>(null);

  const runReport = useMutation({
    mutationFn: () => ipcClient.runReport(projectId, dataset.dataset_id, scope),
    onSuccess: (r) => setRecord(r),
  });

  const hasStale = !!record && record.sections.some((s) => s.stale);

  return (
    <section>
      <h2>Report HTML</h2>
      {!savedProfile && (
        <>
          <p>Jalankan profiling terlebih dahulu.</p>
          <p><button disabled>Buat Report HTML</button></p>
        </>
      )}
      {savedProfile && (
        <>
          <fieldset>
            <legend>Cakupan</legend>
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
            <li>Profiling · fingerprint {savedProfile.fingerprint.slice(0, 12)}…</li>
            {savedProfile.fingerprint !== dataset.fingerprint && <li>Usang — Jalankan ulang.</li>}
          </ul>
          {hasStale && <p>Ada hasil usang — lihat daftar sebelum mengunduh.</p>}
          <button disabled={runReport.isPending} onClick={() => runReport.mutate()}>
            Buat Report HTML
          </button>
          {runReport.isPending && <p role="status">Membuat report…</p>}
          {runReport.isError && <p role="alert">Report gagal dibuat. Silakan coba lagi. — {runReport.error.message}</p>}
          {record && (
            <>
              <p aria-live="polite">
                Report siap diunduh. {record.sections.length} section · fingerprint{" "}
                {record.fingerprint.slice(0, 12)}… · {record.file_size_bytes} bytes ·{" "}
                {record.file_path}
              </p>
              <p>{record.validation_summary}</p>
              <p>{record.is_final ? "Final." : "Draft — bukan final export."}</p>
            </>
          )}
        </>
      )}
    </section>
  );
}
