/**
 * BivariatePage.tsx — P2-2 route Bivariat: pembungkus tipis route atas
 * BivariateSection (logika fitur tetap di section-nya, satu fitur satu file).
 */
import { useProject } from "../../app/ProjectContext";
import { useRouter } from "../../app/router";
import { EmptyState } from "../../shared/ui/LoadingSkeleton";
import { COMMON_COPY, BIVARIAT_COPY } from "../../shared/copy/featureCopy";
import { BivariateSection } from "./BivariateSection";

export function BivariatePage() {
  const { projectId, dataset, savedProfile } = useProject();
  const { navigate } = useRouter();

  if (!projectId || !dataset) {
    return (
      <EmptyState title={BIVARIAT_COPY.emptyTitle}>
        <p>{COMMON_COPY.noActiveDataset}</p>
        <button type="button" onClick={() => navigate("setup")}>
          {COMMON_COPY.goToSetup}
        </button>
      </EmptyState>
    );
  }

  return (
    <BivariateSection projectId={projectId} dataset={dataset} savedProfile={savedProfile} />
  );
}
