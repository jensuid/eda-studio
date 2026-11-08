/**
 * ProjectContext.tsx — P2-2 state lintas-route: project/dataset aktif plus
 * hasil analisis terakhir (profil + quality). State ini proyek frontend
 * (proyeksi), bukan otoritas — lifecycle job tetap backend-authoritative
 * (SYS-015). Konteks hidup di App agar pindah route tidak kehilangan dataset.
 *
 * [D-F3 Ratified 2026-11-08] Resume: hanya {projectId, datasetId} yang
 * disimpan di localStorage. Saat boot, keduanya DIVALIDASI ke backend
 * (dataset.snapshots.list) sebelum ditampilkan; gagal → resumeError
 * (state degraded beralasan di App), bukan empty state. Record analisis
 * TIDAK disimpan (anti artefak usang disajikan sebagai valid).
 * Rehidrasi kolom: DatasetRecord lengkap (termasuk `columns`) dimuat
 * via IPC query `dataset.get` (D-F3 — kolom dari metadata snapshot
 * terdaftar di backend, tanpa whole-DataFrame JSON).
 */
import { createContext, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type {
  DatasetRecord,
  ProfileRecord,
  QualityRecord,
  ReadinessRecord,
} from "../shared/ipc/generated";
import { ipcClient } from "../shared/ipc/ipcClient";
import { SHELL_COPY } from "../shared/copy/shellCopy";

const PROJECT_KEY = "eda-resume:project-v1";

interface StoredResume {
  projectId: string;
  datasetId: string;
}

function readStoredResume(): StoredResume | null {
  try {
    const raw = window.localStorage.getItem(PROJECT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredResume>;
    if (typeof parsed.projectId === "string" && typeof parsed.datasetId === "string") {
      return { projectId: parsed.projectId, datasetId: parsed.datasetId };
    }
    return null;
  } catch {
    return null;
  }
}

function storeResume(projectId: string | null, datasetId: string | null): void {
  try {
    if (projectId && datasetId) {
      window.localStorage.setItem(PROJECT_KEY, JSON.stringify({ projectId, datasetId }));
    } else {
      window.localStorage.removeItem(PROJECT_KEY);
    }
  } catch {
    /* storage unavailable — resume is best-effort */
  }
}

export function clearStoredResume(): void {
  try {
    window.localStorage.removeItem(PROJECT_KEY);
  } catch {
    /* ignore */
  }
}

interface ProjectValue {
  projectId: string | null;
  dataset: DatasetRecord | null;
  setProjectId: (id: string | null) => void;
  setDataset: (d: DatasetRecord) => void;
  savedProfile: ProfileRecord | null;
  setSavedProfile: (p: ProfileRecord) => void;
  qualityRecord: QualityRecord | null;
  setQualityRecord: (q: QualityRecord) => void;
  readinessRecord: ReadinessRecord | null;
  setReadinessRecord: (r: ReadinessRecord) => void;
  /** Revalidasi resume gagal → degraded beralasan (D-F3), bukan empty state. */
  resumeError: string | null;
  /** Hapus simpanan resume + reset konteks (peringatan di App). */
  resetResume: () => void;
}

const ProjectContext = createContext<ProjectValue | null>(null);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [projectId, setProjectId] = useState<string | null>(null);
  const [dataset, setDataset] = useState<DatasetRecord | null>(null);
  const [savedProfile, setSavedProfile] = useState<ProfileRecord | null>(null);
  const [qualityRecord, setQualityRecord] = useState<QualityRecord | null>(null);
  const [readinessRecord, setReadinessRecord] = useState<ReadinessRecord | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [booted, setBooted] = useState(false);
  // Dibaca sekali sebelum efek persist apa pun menghapusnya (StrictMode
  // memanggil efek setup→cleanup→setup; ref dipertahankan di antara setup).
  const storedRef = useRef<StoredResume | null | undefined>(undefined);

  // Boot: pulihkan {projectId, datasetId} lalu validasi ke backend.
  useEffect(() => {
    if (storedRef.current === undefined) storedRef.current = readStoredResume();
    const stored = storedRef.current;
    if (!stored) {
      setBooted(true);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const list = await ipcClient.listSnapshots(stored.projectId);
        const snap = list.snapshots.find((s) => s.dataset_id === stored.datasetId);
        if (!snap) throw new Error("Dataset tidak ditemukan di project tersimpan.");
        // D-F3: rehidrasi DatasetRecord lengkap incl. columns dari backend.
        const full = await ipcClient.getDataset(stored.projectId, stored.datasetId);
        if (cancelled) return;
        setProjectId(stored.projectId);
        setDataset(full);
        setBooted(true);
      } catch (e) {
        if (cancelled) return;
        clearStoredResume();
        setResumeError(
          `${SHELL_COPY.resumeFailedPrefix} — ${e instanceof Error ? e.message : String(e)}`,
        );
        setBooted(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Simpan {projectId, datasetId} saja — record analisis tidak disimpan.
  // Hanya setelah boot agar mount pertama (null) tidak menghapus simpanan.
  useEffect(() => {
    if (!booted) return;
    storeResume(projectId, dataset?.dataset_id ?? null);
  }, [projectId, dataset, booted]);

  const resetResume = () => {
    clearStoredResume();
    setResumeError(null);
    setProjectId(null);
    setDataset(null);
    setSavedProfile(null);
    setQualityRecord(null);
    setReadinessRecord(null);
  };

  const value: ProjectValue = {
    projectId,
    dataset,
    setProjectId,
    setDataset,
    savedProfile,
    setSavedProfile,
    qualityRecord,
    setQualityRecord,
    readinessRecord,
    setReadinessRecord,
    resumeError,
    resetResume,
  };

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject(): ProjectValue {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within <ProjectProvider>");
  return ctx;
}
