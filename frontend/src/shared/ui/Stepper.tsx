/**
 * Stepper.tsx — D-F1 (FLOW-SHELL-001 §2.2 baris [RATIFIED] D-F1, opsi A).
 *
 * Stepper 5 tahap bersinyal sah: 1 Proyek, 2 Dataset, 3 Profil, 4 Kualitas,
 * 9 Kesiapan. Status NOLLOH dari sinyal sah di `ProjectContext`
 * (lihat `stepperState.ts` — termasuk tabel sinyal × status turunan
 * FLOW §2.2 yang wajib tidak berubah tanpa ratifikasi).
 *
 * Aturan kontrak yang dipatuhi di sini:
 * - Tahap 6/7/10 ditandai "Belum tersedia" dan TIDAK dapat diklik
 *   (sinyal "belum tersedia" — jujur, tidak dikarang dari state lokal).
 * - Tahap 8 TIDAK ditampilkan sebagai stage (gap tercatat — FLOW D-F1).
 * - Tahap 5 juga bukan stage stepper (sinyal `Ready` untuk cleaning di
 *   FLOW §2.2 bukan `Completed`; ia bagian daftar lengkap, bukan 5 tahap).
 * - Klik stage HANYA navigasi (hash); tidak pernah memicu command domain.
 * - `In Progress` per tahap, persentase progres, status karangan: DILARANG.
 * - Stale = badge "Perlu diperbarui" + alasan di STEPPER saja; banner
 *   empat-elemen tetap tinggal di halaman fitur (D-F7).
 * - Visible di 900px (tidak disembunyikan) dan 1440px; `aria-current`
 *   pada stage route aktif; keyboard navigable (link `<a href>` biasa).
 * - CTA primer tunggal "Lanjut: …" selalu punya tujuan (FLOW §2.2
 *   orient/advance; DS-SHELL-001 §3; cabang no-project/no-dataset).
 *
 * tokens.css beku (D-F1 tidak menyentuh): tata letak di sini inline-style
 * seperti preseden `AppRail`, mengeksploitasi `status-*` class yang sudah
 * ada agar badge tetap teks + warna (DS-CORE-001).
 */
import type { CSSProperties } from "react";
import { useProject } from "../../app/ProjectContext";
import { hashFor, useRouter } from "../../app/router";
import type { RouteId } from "../../app/router";
import { SHELL_COPY } from "../copy/shellCopy";
import {
  STEPPER_STAGES,
  resolveStepperState,
} from "./stepperState";
import type {
  StepperStageDef,
  StepperStageId,
  StepperStageStatus,
} from "./stepperState";

const statusLabel: Record<StepperStageStatus, string> = {
  done: SHELL_COPY.stepperStatusDone,
  pending: SHELL_COPY.stepperStatusPending,
  stale: SHELL_COPY.stepperStatusStale,
};

const statusBadgeClass: Record<StepperStageStatus, string> = {
  done: "status-success",
  pending: "",
  stale: "status-warning",
};

const navStyle: CSSProperties = {
  display: "block",
  marginBottom: "var(--space-4)",
  padding: "var(--space-3)",
  border: "1px solid var(--color-border-subtle)",
  borderRadius: "var(--radius-md)",
  background: "var(--color-surface-raised)",
};

const listStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "var(--space-2)",
  margin: 0,
  paddingLeft: 0,
  listStyle: "none",
};

const chipStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--space-2)",
  // Target sentuh ≥36px (roadmap UIUX-04): token --space-7: 40px.
  minHeight: "var(--space-7)",
  padding: "var(--space-2) var(--space-3)",
  border: "1px solid var(--color-border-subtle)",
  borderRadius: "var(--radius-md)",
  fontSize: "var(--shell-font-body)",
  textDecoration: "none",
  color: "inherit",
};

const chipActiveStyle: CSSProperties = {
  borderColor: "var(--color-chart-scatter-point)",
  background: "var(--color-surface)",
};

const chipDisabledStyle: CSSProperties = {
  // DS-SHELL-001:155 — visual jelas berbeda + kursor not-allowed, bukan
  // sekadar opacity: bingkai putus-putus menandai non-klik.
  borderStyle: "dashed",
  opacity: 0.6,
  cursor: "not-allowed",
};

// CTA primer R3 (UIUX-04): satu tombol primer selalu terlihat di dalam
// <nav> Stepper, di luar <ol> agar hitungan stage tidak berubah.
const ctaStyle: CSSProperties = {
  marginTop: "var(--space-3)",
};

// Target CTA: tahap sah paling awal yang belum `done` (pending = Ready,
// stale = Blocked — FLOW §2.2 orient). Tanpa proyek / tanpa dataset ikut
// cabang FLOW §2.4. Semua `done` (keputusan gap kontrak): tahap sah
// terakhir (Kesiapan) sebagai target tinjau agar CTA selalu punya tujuan.
function resolveNextCta(
  stages: readonly StepperStageDef[],
  state: Record<StepperStageId, StepperStageStatus>,
  signals: { projectId: string | null; dataset: object | null },
): { label: string; route: RouteId } {
  const next = stages.find((st) => state[st.id] !== "done");
  if (!next) {
    const last = stages[stages.length - 1] as StepperStageDef;
    return {
      label: SHELL_COPY.stepperNextCta(SHELL_COPY.stepperStageName(last.n, last.name)),
      route: last.route,
    };
  }
  if (next.id === 1 && signals.projectId == null) {
    return { label: SHELL_COPY.stepperNextCreateProject, route: next.route };
  }
  if (next.id === 2 && signals.dataset == null) {
    return { label: SHELL_COPY.stepperNextImportDataset, route: next.route };
  }
  return {
    label: SHELL_COPY.stepperNextCta(SHELL_COPY.stepperStageName(next.n, next.name)),
    route: next.route,
  };
}

export function Stepper() {
  const { projectId, dataset, savedProfile, qualityRecord, readinessRecord } =
    useProject();
  const state = resolveStepperState({
    projectId,
    dataset,
    savedProfile,
    qualityRecord,
    readinessRecord,
  });
  const { route, navigate } = useRouter();
  const datasetName = dataset?.name ?? "";
  const nextCta = resolveNextCta(STEPPER_STAGES, state, { projectId, dataset });

  return (
    <nav aria-label={SHELL_COPY.stepperTitle} style={navStyle}>
      <ol aria-label={SHELL_COPY.stepperStageListLabel} style={listStyle}>
        {STEPPER_STAGES.map((stage) => {
          const status = state[stage.id];
          const isCurrent = route === stage.route;
          const label = SHELL_COPY.stepperStageName(stage.n, stage.name);
          // Alasan stale tampil dalam accessible name link (bukan hanya warna).
          const ariaLabel =
            status === "stale"
              ? `${label} — ${SHELL_COPY.stepperStaleReason(datasetName)}`
              : undefined;
          return (
            <li key={stage.id}>
              <a
                href={hashFor(stage.route)}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={ariaLabel}
                style={
                  isCurrent
                    ? { ...chipStyle, ...chipActiveStyle }
                    : chipStyle
                }
              >
                <span>{label}</span>
                <span className={statusBadgeClass[status]}>
                  {statusLabel[status]}
                </span>
              </a>
            </li>
          );
        })}
        {/* Tahap 6/7/10: "Belum tersedia" — jelas non-klik, alasan tertera.
            Tahap 8 TIDAK dirender sama sekali (gap tercatat FLOW D-F1). */}
        {(
          [
            [6, SHELL_COPY.stepperUnavailableName[6]],
            [7, SHELL_COPY.stepperUnavailableName[7]],
            [10, SHELL_COPY.stepperUnavailableName[10]],
          ] satisfies ReadonlyArray<readonly [number, string]>
        ).map(([n, name]) => (
          <li key={n}>
            <span
              aria-disabled="true"
              aria-label={`${SHELL_COPY.stepperStageName(n, name)} — ${SHELL_COPY.stepperUnavailableReason}`}
              style={{ ...chipStyle, ...chipDisabledStyle }}
            >
              <span>{SHELL_COPY.stepperStageName(n, name)}</span>
              <span>{SHELL_COPY.stepperUnavailable}</span>
            </span>
          </li>
        ))}
      </ol>
      {/* CTA primer "Lanjut: …" (FLOW §2.2 orient/advance): <button> agar
          tidak mengotori hitungan link stage dan regex nama stage;
          klik → navigate(route), fokus ke #main-content via efek P2-5
          di App.tsx. Selalu satu, selalu punya tujuan. */}
      <button type="button" style={ctaStyle} onClick={() => navigate(nextCta.route)}>
        {nextCta.label}
      </button>
    </nav>
  );
}
