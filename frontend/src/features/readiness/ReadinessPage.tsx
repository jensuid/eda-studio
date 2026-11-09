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
import { describeFeatureError } from "../../shared/copy/errorCopy";
import { StaleRefreshBanner } from "../../shared/ui/StaleRefreshBanner";

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
    onError: (e) =>
      toast.error(
        describeFeatureError(
          e,
          READINESS_COPY.readinessFail.byCode,
          READINESS_COPY.readinessFail.generic,
        ).headline,
      ),
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

  // D-F7 / FLOW §2.4 `stale`: fingerprint artefak vs snapshot aktif.
  const stale = !!readinessRecord && readinessRecord.fingerprint !== dataset.fingerprint;

  return (
    <section>
      <h2>{READINESS_COPY.heading}</h2>
      <button onClick={() => runReadiness.mutate()} disabled={runReadiness.isPending}>
        {runReadiness.isPending ? READINESS_COPY.assessing : READINESS_COPY.runNow}
      </button>
      {stale && (
        <StaleRefreshBanner
          copy={{ ...READINESS_COPY, staleDependency: READINESS_COPY.staleDependency(dataset.name) }}
          onRefresh={() => runReadiness.mutate()}
          isPending={runReadiness.isPending}
          pendingLabel={READINESS_COPY.assessing}
        />
      )}
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
