/**
 * CleaningPage.tsx — P2-2 route Cleaning: pembungkus tipis route atas
 * CleaningSection. onDatasetChange menulis ke konteks agar dataset baru
 * (snapshot cleaning) terlihat di route lain.
 */
import { useProject } from "../../app/ProjectContext";
import { useRouter } from "../../app/router";
import { EmptyState } from "../../shared/ui/LoadingSkeleton";
import { CLEANING_COPY, COMMON_COPY } from "../../shared/copy/featureCopy";
import { CleaningSection } from "./CleaningSection";

export function CleaningPage() {
  const { projectId, dataset, savedProfile, qualityRecord, setDataset } = useProject();
  const { navigate } = useRouter();

  if (!projectId || !dataset) {
    return (
      <EmptyState title={CLEANING_COPY.heading}>
        <p>{COMMON_COPY.noActiveDataset}</p>
        <button type="button" onClick={() => navigate("setup")}>
          {COMMON_COPY.goToSetup}
        </button>
      </EmptyState>
    );
  }

  return (
    <CleaningSection
      projectId={projectId}
      dataset={dataset}
      savedProfile={savedProfile}
      qualityRecord={qualityRecord}
      onDatasetChange={setDataset}
    />
  );
}
