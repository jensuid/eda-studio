/**
 * BivariatePage.tsx — P2-2 route Bivariat: pembungkus tipis route atas
 * BivariateSection (logika fitur tetap di section-nya, satu fitur satu file).
 */
import { useProject } from "../../app/ProjectContext";
import { useRouter } from "../../app/router";
import { EmptyState } from "../../shared/ui/LoadingSkeleton";
import { BivariateSection } from "./BivariateSection";

export function BivariatePage() {
  const { projectId, dataset, savedProfile } = useProject();
  const { navigate } = useRouter();

  if (!projectId || !dataset) {
    return (
      <EmptyState title="Bivariat">
        <p>Belum ada dataset aktif.</p>
        <button type="button" onClick={() => navigate("setup")}>
          Ke Setup
        </button>
      </EmptyState>
    );
  }

  return (
    <BivariateSection projectId={projectId} dataset={dataset} savedProfile={savedProfile} />
  );
}
