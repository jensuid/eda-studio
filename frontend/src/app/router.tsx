/**
 * router.tsx — P2-2 state-based router (nol dep react-router).
 * Route dipilih lewat state; URL tidak berubah (desktop shell pywebview).
 * Navigasi lewat konteks agar rail (App) dan halaman fitur tetap longgar.
 */
import { createContext, useContext, useState } from "react";
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

interface RouterValue {
  route: RouteId;
  navigate: (route: RouteId) => void;
}

const RouterContext = createContext<RouterValue>({ route: "setup", navigate: () => {} });

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<RouteId>("setup");
  return (
    <RouterContext.Provider value={{ route, navigate: setRoute }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter(): RouterValue {
  return useContext(RouterContext);
}
