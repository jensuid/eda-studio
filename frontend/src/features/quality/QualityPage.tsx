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

export function QualityPage() {
  const { projectId, dataset, savedProfile, qualityRecord, setQualityRecord } = useProject();
  const { navigate } = useRouter();
  const toast = useToast();

  const runQuality = useMutation({
    mutationFn: () => ipcClient.runQuality(projectId!, dataset!.dataset_id),
    onSuccess: (r) => {
      setQualityRecord(r);
      toast.success("Quality check selesai.");
    },
    onError: (e) => toast.error(`Quality check gagal: ${e.message}`),
  });

  if (!projectId || !dataset) {
    return (
      <EmptyState title="Quality">
        <p>Belum ada dataset aktif.</p>
        <button type="button" onClick={() => navigate("setup")}>
          Ke Setup
        </button>
      </EmptyState>
    );
  }

  if (!savedProfile) {
    return (
      <EmptyState title="Quality">
        <p>Jalankan profiling terlebih dahulu.</p>
        <button type="button" onClick={() => navigate("profiling")}>
          Ke Profiling
        </button>
      </EmptyState>
    );
  }

  return (
    <section>
      <h2>Quality Check</h2>
      <button onClick={() => runQuality.mutate()} disabled={runQuality.isPending}>
        {runQuality.isPending ? "Quality check berjalan…" : "Jalankan Quality Check"}
      </button>
      {qualityRecord && (
        <>
          <p>
            {qualityRecord.summary} ({qualityRecord.ok_count}/{qualityRecord.check_count} lolos,{" "}
            {qualityRecord.problem_count} bermasalah)
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>Aturan</th>
                  <th>Kolom</th>
                  <th>Severity</th>
                  <th>Temuan</th>
                  <th>Bukti</th>
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
