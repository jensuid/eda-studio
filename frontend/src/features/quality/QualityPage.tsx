/**
 * QualityPage.tsx — P2-2 route Quality: quality check atas snapshot aktif,
 * hasil disimpan ke konteks (dipakai Cleaning). Butuh profil tersimpan.
 */
import { useMutation } from "@tanstack/react-query";
import { ipcClient } from "../../shared/ipc/ipcClient";
import { useProject } from "../../app/ProjectContext";
import { useRouter } from "../../app/router";
import { useToast } from "../../shared/ui/Toaster";
import { EmptyState } from "../../shared/ui/LoadingSkeleton";
import { COMMON_COPY, QUALITY_COPY } from "../../shared/copy/featureCopy";

export function QualityPage() {
  const { projectId, dataset, savedProfile, qualityRecord, setQualityRecord } = useProject();
  const { navigate } = useRouter();
  const toast = useToast();

  const runQuality = useMutation({
    mutationFn: () => ipcClient.runQuality(projectId!, dataset!.dataset_id),
    onSuccess: (r) => {
      setQualityRecord(r);
      toast.success(QUALITY_COPY.toastDone);
    },
    onError: (e) => toast.error(QUALITY_COPY.toastFail(e.message)),
  });

  if (!projectId || !dataset) {
    return (
      <EmptyState title={QUALITY_COPY.emptyTitle}>
        <p>{COMMON_COPY.noActiveDataset}</p>
        <button type="button" onClick={() => navigate("setup")}>
          {COMMON_COPY.goToSetup}
        </button>
      </EmptyState>
    );
  }

  if (!savedProfile) {
    return (
      <EmptyState title={QUALITY_COPY.emptyTitle}>
        <p>{COMMON_COPY.runProfilingFirst}</p>
        <button type="button" onClick={() => navigate("profiling")}>
          {COMMON_COPY.goToProfiling}
        </button>
      </EmptyState>
    );
  }

  return (
    <section>
      <h2>{QUALITY_COPY.heading}</h2>
      <button onClick={() => runQuality.mutate()} disabled={runQuality.isPending}>
        {runQuality.isPending ? QUALITY_COPY.running : QUALITY_COPY.runNow}
      </button>
      {qualityRecord && (
        <>
          <p>
            {QUALITY_COPY.summary(
              qualityRecord.summary,
              qualityRecord.ok_count,
              qualityRecord.check_count,
              qualityRecord.problem_count,
            )}
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{QUALITY_COPY.thRule}</th>
                  <th>{QUALITY_COPY.thColumn}</th>
                  <th>{QUALITY_COPY.thSeverity}</th>
                  <th>{QUALITY_COPY.thFinding}</th>
                  <th>{QUALITY_COPY.thEvidence}</th>
                </tr>
              </thead>
              <tbody>
                {qualityRecord.findings.map((f, i) => (
                  <tr key={`${f.rule_id}-${i}`}>
                    <td>{f.rule_id}</td>
                    <td>{f.column_name ?? "—"}</td>
                    <td className={f.severity === "error" ? "status-danger" : "status-warning"}>
                      {f.severity}
                    </td>
                    <td>{f.message}</td>
                    <td>
                      {f.evidence_count} ({f.evidence_pct.toFixed(1)}%) — {f.evidence_detail}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
