/**
 * ReadinessPage.tsx — G3 route Readiness: anomaly + modeling-readiness
 * assessment atas snapshot aktif (deterministik, read-only, tanpa
 * persistensi). Tidak butuh profil tersimpan — snapshot saja cukup.
 */
import { useMutation } from "@tanstack/react-query";
import { ipcClient } from "../../shared/ipc/ipcClient";
import { useProject } from "../../app/ProjectContext";
import { useRouter } from "../../app/router";
import { useToast } from "../../shared/ui/Toaster";
import { EmptyState } from "../../shared/ui/LoadingSkeleton";
import { COMMON_COPY, READINESS_COPY } from "../../shared/copy/featureCopy";

export function ReadinessPage() {
  const { projectId, dataset, readinessRecord, setReadinessRecord } = useProject();
  const { navigate } = useRouter();
  const toast = useToast();

  const runReadiness = useMutation({
    mutationFn: () => ipcClient.runReadiness(projectId!, dataset!.dataset_id),
    onSuccess: (r) => {
      setReadinessRecord(r);
      toast.success(READINESS_COPY.toastDone);
    },
    onError: (e) => toast.error(READINESS_COPY.toastFail(e.message)),
  });

  if (!projectId || !dataset) {
    return (
      <EmptyState title={READINESS_COPY.emptyTitle}>
        <p>{COMMON_COPY.noActiveDataset}</p>
        <button type="button" onClick={() => navigate("setup")}>
          {COMMON_COPY.goToSetup}
        </button>
      </EmptyState>
    );
  }

  return (
    <section>
      <h2>{READINESS_COPY.heading}</h2>
      <button onClick={() => runReadiness.mutate()} disabled={runReadiness.isPending}>
        {runReadiness.isPending ? READINESS_COPY.assessing : READINESS_COPY.runNow}
      </button>
      {readinessRecord && (
        <>
          <p>
            {READINESS_COPY.summary(
              readinessRecord.summary,
              readinessRecord.ok_count,
              readinessRecord.check_count,
              readinessRecord.problem_count,
              readinessRecord.row_count,
              readinessRecord.column_count,
              readinessRecord.numeric_count,
              readinessRecord.categorical_count,
            )}
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>{READINESS_COPY.thCheck}</th>
                  <th>{READINESS_COPY.thCategory}</th>
                  <th>{READINESS_COPY.thColumn}</th>
                  <th>{READINESS_COPY.thStatus}</th>
                  <th>{READINESS_COPY.thResult}</th>
                  <th>{READINESS_COPY.thEvidence}</th>
                </tr>
              </thead>
              <tbody>
                {readinessRecord.items.map((it, i) => (
                  <tr key={`${it.check_id}-${it.column_name ?? "all"}-${i}`}>
                    <td>{it.check_id}</td>
                    <td>{it.category}</td>
                    <td>{it.column_name ?? "—"}</td>
                    <td className={it.status === "problem" ? "status-danger" : it.status === "check" ? "status-warning" : ""}>
                      {it.status}
                    </td>
                    <td>{it.message}</td>
                    <td>
                      {it.evidence_count} ({it.evidence_pct.toFixed(1)}%) — {it.evidence_detail}
                      {(it.example_row_indexes?.length ?? 0) > 0 && (
                        <> {READINESS_COPY.exampleRows(it.example_row_indexes!.join(", "))}</>
                      )}
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
