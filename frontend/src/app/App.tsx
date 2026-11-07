/**
 * App.tsx — P2-2 application shell: komposisi grid mockup
 * (rail 210 | main | panel kanan 240; ≤900px rail 64, panel tersembunyi),
 * handshake protokol saat startup, ErrorBoundary per-route, Job Center.
 */
import { useEffect, useState } from "react";
import { ProjectProvider } from "./ProjectContext";
import { ROUTES, RouterProvider, useRouter } from "./router";
import type { RouteId } from "./router";
import { ToastProvider } from "../shared/ui/Toaster";
import { ErrorBoundary } from "../shared/ui/ErrorBoundary";
import { JobCenter } from "../shared/job/JobCenter";
import { ipcClient } from "../shared/ipc/ipcClient";
import { ProjectSetup } from "../features/project/ProjectSetup";
import { DatasetExplorer } from "../features/project/DatasetExplorer";
import { ProfilingPage } from "../features/profiling/ProfilingPage";
import { QualityPage } from "../features/quality/QualityPage";
import { BivariatePage } from "../features/bivariate/BivariatePage";
import { CleaningPage } from "../features/cleaning/CleaningPage";
import { ReportPage } from "../features/reporting/ReportPage";

/**
 * Revisi protokol yang diharapkan frontend. Cermin backend/contracts.py
 * `PROTOCOL_REVISION` (=1) — ubah bersamaan bila backend menaikkan revisi.
 */
export const EXPECTED_PROTOCOL_REVISION = 1;

const ROUTE_PAGES: Record<RouteId, () => React.JSX.Element> = {
  setup: ProjectSetup,
  explorer: DatasetExplorer,
  profiling: ProfilingPage,
  quality: QualityPage,
  bivariate: BivariatePage,
  cleaning: CleaningPage,
  report: ReportPage,
};

function RouteContent() {
  const { route } = useRouter();
  const Page = ROUTE_PAGES[route];
  const label = ROUTES.find((r) => r.id === route)?.label ?? route;
  return (
    <ErrorBoundary label={label}>
      <Page />
    </ErrorBoundary>
  );
}

function Shell() {
  const { route, navigate } = useRouter();
  const [protocolError, setProtocolError] = useState<string | null>(null);
  const [protocolChecked, setProtocolChecked] = useState(false);

  // Handshake startup: cocokkan protocol_revision backend vs yang diharapkan.
  useEffect(() => {
    let cancelled = false;
    ipcClient
      .getProtocolInfo()
      .then((info) => {
        if (cancelled) return;
        setProtocolChecked(true);
        const revision = info.protocol_revision;
        if (revision === undefined) {
          setProtocolError("Backend tidak mengirim protocol_revision.");
        } else if (revision !== EXPECTED_PROTOCOL_REVISION) {
          setProtocolError(
            `Versi protokol tidak cocok: backend revisi ${revision}, frontend mengharapkan ${EXPECTED_PROTOCOL_REVISION}.`,
          );
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setProtocolChecked(true);
        setProtocolError(
          `Backend tidak tersedia (${e instanceof Error ? e.message : String(e)}). Fitur yang butuh backend belum bisa dipakai.`,
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1>EDA Workbench</h1>
        {protocolChecked && protocolError && (
          <p className="protocol-banner" role="alert">
            {protocolError}
          </p>
        )}
      </header>
      <nav className="app-rail" aria-label="Navigasi utama">
        {ROUTES.map((r) => (
          <button
            key={r.id}
            type="button"
            className={r.id === route ? "nav-item nav-item-active" : "nav-item"}
            aria-current={r.id === route ? "page" : undefined}
            onClick={() => navigate(r.id)}
          >
            <span className="nav-label">{r.label}</span>
          </button>
        ))}
      </nav>
      <main className="app-main">
        <RouteContent />
      </main>
      <aside className="app-aside">
        <JobCenter />
      </aside>
    </div>
  );
}

export function App() {
  return (
    <ProjectProvider>
      <RouterProvider>
        <ToastProvider>
          <Shell />
        </ToastProvider>
      </RouterProvider>
    </ProjectProvider>
  );
}
