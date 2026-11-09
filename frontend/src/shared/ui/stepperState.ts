/**
 * stepperState.ts — D-F1 (FLOW-SHELL-001 §2.2 baris [RATIFIED] D-F1).
 *
 * Mapping MENTERNAH sinyal sah → status stepper. Tanpa React, tanpa IPC:
 * mudah diuji dan tidak bisa mengarang status.
 *
 * Tabel sinyal × status (diturunkan dari FLOW-SHELL-001 §2.2, bukan sinyal baru):
 *
 * | Tahap | Sinyal sah                             | Status |
 * |-------|----------------------------------------|--------|
 * | 1 Proyek    | `projectId != null`                 | done / belum |
 * | 2 Dataset   | `dataset != null`                   | done / belum |
 * | 3 Profil    | `savedProfile` + fingerprint cocok  | done / belum / stale |
 * | 4 Kualitas  | `qualityRecord` + fingerprint cocok | done / belum / stale |
 * | 9 Kesiapan  | `readinessRecord` + fingerprint cocok | done / belum / stale |
 *
 * `stale` ⟺ fingerprint artefak ≠ fingerprint dataset aktif (aturan sama
 * seperti D-F7; selanjutnya diformulasikan di FLOW §2.4 cabang `stale`).
 * DILARANG: status `In Progress` per tahap, persentase progres, dan status
 * karangan dari klik/state lokal (FLOW-SHELL-001 §2.2:53).
 *
 * Tahap 5 (Cleaning) punya sinyal snapshot untuk `Ready`, tapi BUKAN bagian
 * stepper 5 tahap yang dikontrakkan — tidak dipetakan di sini. Tahap 6, 7,
 * 10 tidak punya record lintas-route di `ProjectContext` (sinyal "belum
 * tersedia" — jujur ditandai, tidak dikarang); tahap 8 tidak punya route
 * dan tidak ditampilkan sebagai stage (gap tercatat di renderer).
 */
import type { RouteId } from "../../app/router";

/** Status stage yang BERSUMBER dari sinyal sah. `In Progress` dilarang. */
export type StepperStageStatus = "done" | "pending" | "stale";

/** Tahap yang dirender sebagai stage: hanya 5 (FLOW D-F1, opsi A). */
export type StepperStageId = 1 | 2 | 3 | 4 | 9;

export interface StepperStageDef {
  id: StepperStageId;
  /** Nomor tahap Doc08 (gap 5–8, 10 disengaja — bukan error). */
  n: number;
  /** Label UI tahap (kontrak D-F1). */
  name: string;
  route: RouteId;
}

export const STEPPER_STAGES: readonly StepperStageDef[] = [
  { id: 1, n: 1, name: "Proyek", route: "setup" },
  { id: 2, n: 2, name: "Dataset", route: "explorer" },
  { id: 3, n: 3, name: "Profil", route: "profiling" },
  { id: 4, n: 4, name: "Kualitas", route: "quality" },
  { id: 9, n: 9, name: "Kesiapan", route: "readiness" },
];

/**
 * Minimum sinyal yang dibutuhkan dari `ProjectContext`. Dipakai longgar
 * (hanya field fingerprint) supaya fungsi murni dan tidak terkait tipe
 * record spesifik.
 */
export interface StepperSignals {
  projectId: string | null;
  dataset: { fingerprint: string } | null;
  savedProfile: { fingerprint: string } | null;
  qualityRecord: { fingerprint: string } | null;
  readinessRecord: { fingerprint: string } | null;
}

export type StepperStageStates = Record<StepperStageId, StepperStageStatus>;

/** Status artefak vs fingerprint dataset aktif (D-F7: sama seperti banner stale). */
function artifactStatus(
  record: { fingerprint: string } | null,
  dataset: { fingerprint: string } | null,
): StepperStageStatus {
  if (!record || !dataset) return "pending";
  return record.fingerprint === dataset.fingerprint ? "done" : "stale";
}

/**
 * Total, tanpa efek samping. Setiap cabang kembali ke salah satu dari
 * tiga status turunan-sinyal; tidak ada `In Progress`/persentase.
 */
export function resolveStepperState(
  signals: StepperSignals,
): StepperStageStates {
  return {
    1: signals.projectId != null ? "done" : "pending",
    2: signals.dataset != null ? "done" : "pending",
    3: artifactStatus(signals.savedProfile, signals.dataset),
    4: artifactStatus(signals.qualityRecord, signals.dataset),
    9: artifactStatus(signals.readinessRecord, signals.dataset),
  };
}
