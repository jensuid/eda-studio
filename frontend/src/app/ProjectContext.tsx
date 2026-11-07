/**
 * ProjectContext.tsx — P2-2 state lintas-route: project/dataset aktif plus
 * hasil analisis terakhir (profil + quality). State ini proyek frontend
 * (proyeksi), bukan otoritas — lifecycle job tetap backend-authoritative
 * (SYS-015). Konteks hidup di App agar pindah route tidak kehilangan dataset.
 */
import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import type {
  DatasetRecord,
  ProfileRecord,
  QualityRecord,
} from "../shared/ipc/generated";

interface ProjectValue {
  projectId: string | null;
  dataset: DatasetRecord | null;
  setProjectId: (id: string) => void;
  setDataset: (d: DatasetRecord) => void;
  savedProfile: ProfileRecord | null;
  setSavedProfile: (p: ProfileRecord) => void;
  qualityRecord: QualityRecord | null;
  setQualityRecord: (q: QualityRecord) => void;
}

const ProjectContext = createContext<ProjectValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [dataset, setDataset] = useState<DatasetRecord | null>(null);
  const [savedProfile, setSavedProfile] = useState<ProfileRecord | null>(null);
  const [qualityRecord, setQualityRecord] = useState<QualityRecord | null>(null);

  const value: ProjectValue = {
    projectId,
    dataset,
    setProjectId,
    setDataset,
    savedProfile,
    setSavedProfile,
    qualityRecord,
    setQualityRecord,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject(): ProjectValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within <ProjectProvider>");
  return ctx;
}
