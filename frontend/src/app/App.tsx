/**
 * App.tsx — P2-2 application shell: komposisi grid mockup
 * (rail 210 | main | panel kanan 240; ≤900px rail 64, panel tersembunyi),
 * handshake protokol saat startup, ErrorBoundary per-route, Job Center.
 */
import { useEffect, useRef, useState } from "react";
import { ProjectProvider, useProject } from "./ProjectContext";
import { ROUTES, RouterProvider, hashFor, useRouter } from "./router";
import type { RouteId } from "./router";
import { ToastProvider } from "../shared/ui/Toaster";
import { ErrorBoundary } from "../shared/ui/ErrorBoundary";
import { JobCenter } from "../shared/job/JobCenter";
import { SHELL_COPY } from "../shared/copy/shellCopy";
import { describeConcernError } from "../shared/copy/errorCopy";
import type { ConcernError } from "../shared/copy/errorCopy";
import { DiagnosticDetail } from "../shared/ui/DiagnosticDetail";
import { ipcClient } from "../shared/ipc/ipcClient";
import type {
  AppInfoRecord,
  RecoveryStatusRecord,
  RestoreRecord,
  UpdateCheckRecord,
} from "../shared/ipc/generated";
import { ProjectSetup } from "../features/project/ProjectSetup";
import { DatasetExplorer } from "../features/project/DatasetExplorer";
import { ProfilingPage } from "../features/profiling/ProfilingPage";
import { QualityPage } from "../features/quality/QualityPage";
import { ReadinessPage } from "../features/readiness/ReadinessPage";
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
  readiness: ReadinessPage,
  bivariate: BivariatePage,
  cleaning: CleaningPage,
  report: ReportPage,
};

function RouteContent() {
  const { route } = useRouter();
  const Page = ROUTE_PAGES[route];
  const label = ROUTES.find((r) => r.id === route)?.label ?? route;
  // D-F6: key per-route supaya crash-state ErrorBoundary tidak terbawa
  // antar-route dan retry tidak loop dari crash route sebelumnya.
  return (
    <ErrorBoundary key={route} label={label}>
      <Page />
    </ErrorBoundary>
  );
}

function Shell() {
  const { route, unknownHash } = useRouter();
  const { resumeError, resetResume } = useProject();
  // D-F6 (FLOW §2.5): satu kanal per concern — tidak ada lagi satu
  // `protocolError` untuk handshake + recovery + update sekaligus.
  const [protocolError, setProtocolError] = useState<ConcernError | null>(null);
  const [protocolChecked, setProtocolChecked] = useState(false);
  const [recovery, setRecovery] = useState<RecoveryStatusRecord | null>(null);
  const [recoveryError, setRecoveryError] = useState<ConcernError | null>(null);
  const [restored, setRestored] = useState<RestoreRecord | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [appInfo, setAppInfo] = useState<AppInfoRecord | null>(null);
  const [update, setUpdate] = useState<UpdateCheckRecord | null>(null);
  const [updateError, setUpdateError] = useState<ConcernError | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const prevRoute = useRef(route);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const drawerToggleRef = useRef<HTMLButtonElement>(null);

  // B5 [D-S6]: Esc menutup drawer + focus return ke toggle.
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        drawerToggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  // P2-5: fokus dipindah ke konten utama setelah navigasi route (dynamic
  // update) agar pengguna keyboard/screen reader tidak tertinggal di rail.
  // Mount pertama tidak dipindah; ref prevRoute kebal terhadap double-effect
  // StrictMode (nilai route sama dibesarkan, tidak difokuskan).
  useEffect(() => {
    if (prevRoute.current === route) return;
    prevRoute.current = route;
    mainRef.current?.focus({ preventScroll: true });
  }, [route]);

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
          setProtocolError({
            headline: SHELL_COPY.protocolRevisionMissing,
            detail: `code: PROTOCOL_REVISION_MISSING\nmessage: Backend tidak mengirim protocol_revision.`,
            code: "PROTOCOL_REVISION_MISSING",
            correlationId: null,
            fingerprint: "protocol:PROTOCOL_REVISION_MISSING:",
          });
        } else if (revision !== EXPECTED_PROTOCOL_REVISION) {
          setProtocolError({
            headline: SHELL_COPY.protocolMismatch(revision, EXPECTED_PROTOCOL_REVISION),
            detail: `code: PROTOCOL_MISMATCH\nmessage: backend revisi ${revision}, frontend mengharapkan ${EXPECTED_PROTOCOL_REVISION}.`,
            code: "PROTOCOL_MISMATCH",
            correlationId: null,
            fingerprint: "protocol:PROTOCOL_MISMATCH:",
          });
        }
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setProtocolChecked(true);
        // Handshake tanpa IpcError: pseudo-code BACKEND_UNAVAILABLE,
        // pesan mentah hanya di detail diagnostik.
        const raw = e instanceof Error ? e.message : String(e);
        setProtocolError({
          headline: SHELL_COPY.backendUnavailable,
          detail: `code: BACKEND_UNAVAILABLE\nmessage: ${raw}`,
          code: "BACKEND_UNAVAILABLE",
          correlationId: null,
          fingerprint: "protocol:BACKEND_UNAVAILABLE:",
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // G6-1/G6-3 startup state: clean up silently when the backend is absent.
  useEffect(() => {
    let cancelled = false;
    ipcClient.appInfo().then((info) => {
      if (!cancelled) setAppInfo(info);
    }).catch(() => undefined);
    ipcClient.recoveryStatus().then((status) => {
      if (!cancelled && status.unclean_previous && status.has_autosave) {
        setRecovery(status);
      }
    }).catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const restoreRecovery = async () => {
    setRestoring(true);
    try {
      const record = await ipcClient.recoveryRestore();
      setRestored(record);
      setRecovery(null);
      setRecoveryError(null);
    } catch (e) {
      // D-F6 kanal recovery: banner di main, bukan banner app bar.
      setRecoveryError(describeConcernError(e, "recovery"));
    } finally {
      setRestoring(false);
    }
  };

  const runUpdateCheck = async () => {
    setCheckingUpdate(true);
    try {
      setUpdate(await ipcClient.checkUpdate());
      setUpdateError(null);
    } catch (e) {
      // D-F6 kanal update: region versi saja, tidak boleh jadi banner protokol.
      setUpdateError(describeConcernError(e, "update"));
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        {SHELL_COPY.skipToMain}
      </a>
      <header className="app-header">
        <h1>{SHELL_COPY.appTitle}</h1>
        <button
          type="button"
          className="drawer-toggle"
          ref={drawerToggleRef}
          aria-expanded={drawerOpen}
          aria-controls="job-center-aside"
          aria-label={SHELL_COPY.jobCenterToggle}
          onClick={() => setDrawerOpen((v) => !v)}
        >
          {SHELL_COPY.jobCenterToggle}
        </button>
        {protocolChecked && protocolError && (
          <div className="protocol-banner" role="alert">
            <p>{protocolError.headline}</p>
            <DiagnosticDetail detail={protocolError.detail} />
          </div>
        )}
      </header>
      <nav className="app-rail" aria-label="Navigasi utama">
        {ROUTES.map((r) => (
          <a
            key={r.id}
            href={hashFor(r.id)}
            className={r.id === route ? "nav-item nav-item-active" : "nav-item"}
            aria-current={r.id === route ? "page" : undefined}
            // P2-5: aria-label wajib — .nav-label disembunyikan di ≤900px
            // (P2-4), tanpa ini link rail kehilangan accessible name.
            // textDecoration/color inline: token CSS beku sampai G6
            // (tokens.css), jembatan Phase 0 untuk <a> nav D-F2.
            aria-label={r.label}
            style={{ textDecoration: "none", color: "inherit" }}
          >
            <span className="nav-label">{r.label}</span>
          </a>
        ))}
      </nav>
      {unknownHash && (
        <p className="protocol-banner" role="alert">
          {SHELL_COPY.unknownRoute}
        </p>
      )}
      {resumeError && (
        <div className="protocol-banner" role="alert">
          <p>{resumeError}</p>
          <button type="button" onClick={resetResume}>
            {SHELL_COPY.startFresh}
          </button>
        </div>
      )}
      <main
        className="app-main"
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        aria-label="Konten utama"
      >
        {recoveryError && (
          <section className="recovery-banner" role="alert">
            <h2>{recoveryError.headline}</h2>
            <DiagnosticDetail detail={recoveryError.detail} />
            <button type="button" onClick={() => setRecoveryError(null)}>
              {SHELL_COPY.close}
            </button>
          </section>
        )}
        {recovery && (
          <section className="recovery-banner" role="alertdialog" aria-label="Pemulihan crash">
            <h2>{SHELL_COPY.recoveryTitle}</h2>
            <p>{SHELL_COPY.recoveryBody}</p>
            <p>
              {SHELL_COPY.recoveryCreatedAt} {recovery.autosave_created_at ?? "—"} · {SHELL_COPY.recoveryPath} {recovery.autosave_path ?? "—"}
            </p>
            <div>
              <button type="button" onClick={restoreRecovery} disabled={restoring}>
                {restoring ? SHELL_COPY.restoring : SHELL_COPY.restoreAction}
              </button>
              <button type="button" onClick={() => setRecovery(null)} disabled={restoring}>
                {SHELL_COPY.close}
              </button>
            </div>
          </section>
        )}
        {restored && (
          <section className="recovery-banner" role="status">
            <h2>{SHELL_COPY.recoveryDone}</h2>
            <p>{SHELL_COPY.recoveryDoneBody(restored.project_id, restored.dest_root)}</p>
            <button type="button" onClick={() => setRestored(null)}>
              {SHELL_COPY.ok}
            </button>
          </section>
        )}
        <RouteContent />
      </main>
      <aside
        className="app-aside"
        id="job-center-aside"
        aria-label="Panel samping"
        data-open={drawerOpen}
      >
        <JobCenter />
        <section className="version-panel" aria-label={SHELL_COPY.versionPanelLabel}>
          <p>{SHELL_COPY.versionLabel} {appInfo?.version ?? "—"} · {appInfo?.platform ?? ""}</p>
          <button type="button" onClick={runUpdateCheck} disabled={checkingUpdate}>
            {checkingUpdate ? SHELL_COPY.checkingUpdate : SHELL_COPY.checkUpdate}
          </button>
          {updateError && (
            <div role="status">
              <p>{updateError.headline}</p>
              <DiagnosticDetail detail={updateError.detail} />
              <button type="button" onClick={() => setUpdateError(null)}>
                {SHELL_COPY.close}
              </button>
            </div>
          )}
          {update && !updateError && (
            <p>
              {update.latest_version
                ? `${SHELL_COPY.latestRelease(update.latest_version)} ${update.update_available ? SHELL_COPY.updateAvailable : SHELL_COPY.upToDate}`
                : SHELL_COPY.releaseFeedUnreadable}
            </p>
          )}
        </section>
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
