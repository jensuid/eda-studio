/**
 * commandRegistry.ts — Phase 2 (FLOW-SHELL-001 §2.8, D-S6): registry
 * perintah global untuk Cmd+K. SATU-SATUNYA sumber daftar perintah palet:
 * tiap entri memetakan ke aksi yang SUDAH ada — navigasi route existing
 * (ROUTES) atau domain command existing via ipcClient dengan payload
 * existing. DILARANG entri karangan (command/backend baru, label yang
 * tidak dipakai di UI, shortcut yang tidak ada).
 *
 * Perintah yang butuh argumen bebas (bivariat: kolom A/B; report/PDF:
 * scope; cleaning: strategi/operasi; histogram: kolom) SENGAJA tidak
 * masuk registry — palet hanya memuat aksi yang dapat dijalankan dengan
 * konteks aktif (projectId + dataset) tanpa parameter inventaris.
 *
 * Perintah yang gagal validasi (tanpa dataset aktif / tanpa profil
 * tersimpan untuk quality) tetap tampil sebagai DISABLED beralasan,
 * bukan dieksekusi lalu error (fail-closed, mirror gating EmptyState
 * halaman fitur).
 */
import type { RouteId } from "./router";
import { ROUTES } from "./router";
import { ipcClient } from "../shared/ipc/ipcClient";
import { SHELL_COPY } from "../shared/copy/shellCopy";
import type {
  DatasetRecord,
  ProfileRecord,
  QualityRecord,
  ReadinessRecord,
} from "../shared/ipc/generated";

/** Konteks aktif saat palet dibuka — proyeksi frontend, bukan otoritas. */
export interface PaletteContext {
  projectId: string | null;
  dataset: DatasetRecord | null;
  savedProfile: ProfileRecord | null;
  navigate: (route: RouteId) => void;
  setSavedProfile: (r: ProfileRecord) => void;
  setQualityRecord: (r: QualityRecord) => void;
  setReadinessRecord: (r: ReadinessRecord) => void;
}

export interface PaletteCommand {
  id: string;
  label: string;
  category: string;
  /** Kata kunci pencarian (label + varian bahasa), comma-free. */
  keywords: string;
  /** Alasan nonaktif; null bila dapat dijalankan. */
  disabledReason: string | null;
  run: (ctx: PaletteContext) => Promise<void> | void;
}

function needsDataset(ctx: PaletteContext): string | null {
  return ctx.projectId && ctx.dataset ? null : SHELL_COPY.paletteNeedsDataset;
}

function needsProfileToo(ctx: PaletteContext): string | null {
  if (needsDataset(ctx)) return SHELL_COPY.paletteNeedsDataset;
  return ctx.savedProfile ? null : SHELL_COPY.paletteNeedsProfile;
}

/**
 * Bangun daftar perintah dari konteks aktif. Dipanggil sekali per render
 * palet agar status disabled selalu mencerminkan konteks terkini.
 */
export function buildCommands(ctx: PaletteContext): PaletteCommand[] {
  const nav: PaletteCommand[] = ROUTES.map((r) => ({
    id: `nav-${r.id}`,
    label: `Buka ${r.label}`,
    category: SHELL_COPY.paletteCategoryNavigate,
    keywords: `buka ${r.label.toLowerCase()} ${r.id} navigasi pindah`,
    disabledReason: null,
    run: () => ctx.navigate(r.id),
  }));

  const commands: PaletteCommand[] = [
    {
      id: "run-profile",
      label: "Jalankan Profiling",
      category: SHELL_COPY.paletteCategoryCommand,
      keywords: "jalankan profiling profil run profil dataset.profile.run",
      disabledReason: needsDataset(ctx),
      run: async (c) => {
        const r = await ipcClient.runProfile(c.projectId!, c.dataset!.dataset_id);
        c.setSavedProfile(r);
        c.navigate("profiling");
      },
    },
    {
      id: "run-quality",
      label: "Jalankan Quality Check",
      category: SHELL_COPY.paletteCategoryCommand,
      keywords: "jalankan quality check kualitas run dataset.quality.run",
      // Mirror QualityPage: butuh profil tersimpan, bukan sekadar dataset.
      disabledReason: needsProfileToo(ctx),
      run: async (c) => {
        const r = await ipcClient.runQuality(c.projectId!, c.dataset!.dataset_id);
        c.setQualityRecord(r);
        c.navigate("quality");
      },
    },
    {
      id: "run-readiness",
      label: "Jalankan Readiness",
      category: SHELL_COPY.paletteCategoryCommand,
      keywords: "jalankan readiness kesiapan run dataset.readiness.run",
      disabledReason: needsDataset(ctx),
      run: async (c) => {
        const r = await ipcClient.runReadiness(c.projectId!, c.dataset!.dataset_id);
        c.setReadinessRecord(r);
        c.navigate("readiness");
      },
    },
  ];

  return [...nav, ...commands];
}

/** Filter substring atas label + keywords + kategori (case-insensitive). */
export function filterCommands(commands: PaletteCommand[], query: string): PaletteCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return commands;
  return commands.filter((c) =>
    `${c.label} ${c.keywords} ${c.category}`.toLowerCase().includes(q),
  );
}
