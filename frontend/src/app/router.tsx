/**
 * router.tsx — P2-2 state-based router (nol dep react-router).
 * [D-F2 Ratified 2026-11-08] hash + history stack: route terikat ke
 * location.hash (`#/<route>`), Back/Forward browser mengembalikan route
 * tanpa membatalkan job (navigasi tidak memicu command domain).
 * URL tidak berubah selain hash; di pywebview hash tidak mengirim request.
 * Navigasi lewat konteks agar rail (App) dan halaman fitur tetap longgar.
 */
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type RouteId =
  | "setup"
  | "explorer"
  | "profiling"
  | "quality"
  | "readiness"
  | "bivariate"
  | "cleaning"
  | "report";

export interface RouteDef {
  id: RouteId;
  label: string;
}

export const ROUTES: RouteDef[] = [
  { id: "setup", label: "Setup" },
  { id: "explorer", label: "Dataset" },
  { id: "profiling", label: "Profiling" },
  { id: "quality", label: "Quality" },
  { id: "readiness", label: "Readiness" },
  { id: "bivariate", label: "Bivariat" },
  { id: "cleaning", label: "Cleaning" },
  { id: "report", label: "Report" },
];

const ROUTE_IDS = new Set<RouteId>(ROUTES.map((r) => r.id));

/** Hash kanonis untuk sebuah route (SCREEN-SHELL-001 §3.4). */
export function hashFor(route: RouteId): string {
  return `#/${route}`;
}

/** Parse location.hash → {route, unknown}. Tanpa hash → route tersimpan/setup. */
function parseHash(): { route: RouteId; unknown: boolean } {
  const raw = window.location.hash.replace(/^#\/?/, "");
  if (!raw) return { route: readStoredRoute() ?? "setup", unknown: false };
  if (ROUTE_IDS.has(raw as RouteId)) return { route: raw as RouteId, unknown: false };
  return { route: "setup", unknown: true };
}

const ROUTE_KEY = "eda-resume:route-v1";

function readStoredRoute(): RouteId | null {
  try {
    const v = window.localStorage.getItem(ROUTE_KEY);
    return v && ROUTE_IDS.has(v as RouteId) ? (v as RouteId) : null;
  } catch {
    return null;
  }
}

function storeRoute(route: RouteId): void {
  try {
    window.localStorage.setItem(ROUTE_KEY, route);
  } catch {
    /* storage unavailable (storage quota/privacy) — resume is best-effort */
  }
}

interface RouterValue {
  route: RouteId;
  navigate: (route: RouteId) => void;
  /** Hash tidak dikenal → fallback Setup + pesan (FLOW-SHELL-001 §2.9). */
  unknownHash: boolean;
}

const RouterContext = createContext<RouterValue>({
  route: "setup",
  navigate: () => {},
  unknownHash: false,
});

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<RouteId>(() => parseHash().route);
  const [unknownHash, setUnknownHash] = useState<boolean>(() => parseHash().unknown);

  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseHash();
      setRoute(parsed.route);
      setUnknownHash(parsed.unknown);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    storeRoute(route);
  }, [route]);

  const navigate = (next: RouteId) => {
    // Mengubah hash memicu hashchange → state disinkronkan satu arah.
    // Jika hash sudah sama, hashchange tidak terpicu → set langsung.
    if (window.location.hash === hashFor(next)) {
      setRoute(next);
      setUnknownHash(false);
    } else {
      window.location.hash = hashFor(next);
    }
  };

  return (
    <RouterContext.Provider value={{ route, navigate, unknownHash }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter(): RouterValue {
  return useContext(RouterContext);
}
