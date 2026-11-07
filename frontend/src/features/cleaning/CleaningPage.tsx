/**
 * CleaningPage.tsx — P2-2 route Cleaning: pembungkus tipis route atas
 * CleaningSection. onDatasetChange menulis ke konteks agar dataset baru
 * (snapshot cleaning) terlihat di route lain.
 */
import { useProject } from "../../app/ProjectContext";
import { useRouter } from "../../app/router";
import { EmptyState } from "../../shared/ui/LoadingSkeleton";
import { CleaningSection } from "./CleaningSection";

export function CleaningPage() {
  const { projectId, dataset, savedProfile, qualityRecord, setDataset } = useProject();
  const { navigate } = useRouter();

  if (!projectId || !dataset) {
    return (
      <EmptyState title="Cleaning">
        <p>Belum ada dataset aktif.</p>
        <button type="button" onClick={() => navigate("setup")}>
          Ke Setup
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
