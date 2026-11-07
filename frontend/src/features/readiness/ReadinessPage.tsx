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

export function ReadinessPage() {
  const { projectId, dataset, readinessRecord, setReadinessRecord } = useProject();
  const { navigate } = useRouter();
  const toast = useToast();

  const runReadiness = useMutation({
    mutationFn: () => ipcClient.runReadiness(projectId!, dataset!.dataset_id),
    onSuccess: (r) => {
      setReadinessRecord(r);
      toast.success("Readiness assessment selesai.");
    },
    onError: (e) => toast.error(`Readiness assessment gagal: ${e.message}`),
  });

  if (!projectId || !dataset) {
    return (
      <EmptyState title="Readiness">
        <p>Belum ada dataset aktif.</p>
        <button type="button" onClick={() => navigate("setup")}>
          Ke Setup
        </button>
      </EmptyState>
    );
  }

  return (
    <section>
      <h2>Modeling Readiness</h2>
      <button onClick={() => runReadiness.mutate()} disabled={runReadiness.isPending}>
        {runReadiness.isPending ? "Assessing…" : "Jalankan Readiness Assessment"}
      </button>
      {readinessRecord && (
        <>
          <p>
            {readinessRecord.summary} ({readinessRecord.ok_count}/{readinessRecord.check_count} lolos,{" "}
            {readinessRecord.problem_count} bermasalah) — {readinessRecord.row_count} baris,{" "}
            {readinessRecord.column_count} kolom ({readinessRecord.numeric_count} numerik,{" "}
            {readinessRecord.categorical_count} kategorikal)
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Check</th>
                  <th>Kategori</th>
                  <th>Kolom</th>
                  <th>Status</th>
                  <th>Hasil</th>
                  <th>Bukti</th>
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
                        <> — baris: {it.example_row_indexes!.join(", ")}</>
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
