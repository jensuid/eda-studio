/**
 * ReportPage.tsx — P2-2 route Report: ReportSection + PdfSection
 * (section tetap file terpisah; komposisi di sini).
 */
import { useProject } from "../../app/ProjectContext";
import { useRouter } from "../../app/router";
import { EmptyState } from "../../shared/ui/LoadingSkeleton";
import { COMMON_COPY, REPORT_COPY } from "../../shared/copy/featureCopy";
import { PdfSection } from "./PdfSection";
import { ReportSection } from "./ReportSection";

export function ReportPage() {
  const { projectId, dataset, savedProfile } = useProject();
  const { navigate } = useRouter();

  if (!projectId || !dataset) {
    return (
      <EmptyState title={REPORT_COPY.emptyTitle}>
        <p>{COMMON_COPY.noActiveDataset}</p>
        <button type="button" onClick={() => navigate("setup")}>
          {COMMON_COPY.goToSetup}
        </button>
      </EmptyState>
    );
  }

  return (
    <>
      <ReportSection projectId={projectId} dataset={dataset} savedProfile={savedProfile} />
      <PdfSection projectId={projectId} dataset={dataset} savedProfile={savedProfile} />
    </>
  );
}
