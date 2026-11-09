/**
 * helpers.ts — P2-5: mock bridge pywebview untuk test Playwright.
 *
 * B1 (QA-SHELL-001 v1.0): `mockBridge(page, { seeded: true })` mengembalikan
 * data representatif deterministik untuk alur cold-start → ingest → orient →
 * run-stage → advance — bukan `data: null`. Tanpa `seeded`, perilaku lama
 * (command/query ok tanpa data, empty state deterministik) tetap dipakai
 * test lama. `events` mengisi `get_events` (bukti B6: job berlanjut saat
 * navigasi, progress indeterminate); `stale` membuat fingerprint hasil
 * cleaning/quality/bivariat usang vs dataset aktif (bukti B3 → state `Stale`).
 */
import type { Page } from "@playwright/test";

const FP_SEED =
  "fp_seed_0123456789abcdef0123456789abcdef0123456789abcdef0123456789";
const FP_OLD =
  "fp_old_0123456789abcdef0123456789abcdef0123456789abcdef0123456789";

const DATASET = {
  dataset_id: "ds_seed",
  project_id: "proj_seed",
  name: "seed_sales.csv",
  snapshot_id: "snap_seed",
  fingerprint: FP_SEED,
  row_count: 5000,
  columns: ["sales", "region", "qty"],
};

const PREVIEW = {
  dataset_id: DATASET.dataset_id,
  columns: ["sales", "region", "qty"],
  rows: [
    { sales: 1250.5, region: "Jakarta", qty: 42 },
    { sales: 970.0, region: "Bandung", qty: 31 },
    { sales: 1430.25, region: "Surabaya", qty: 55 },
    { sales: 640.0, region: "Medan", qty: 18 },
    { sales: 1105.75, region: "Jakarta", qty: 47 },
    { sales: 815.5, region: "Semarang", qty: 29 },
    { sales: 1320.0, region: "Bandung", qty: 51 },
    { sales: 590.25, region: "Medan", qty: 15 },
  ],
  total_rows: 5000,
  truncated: true,
};

const COLUMN_PROFILES = [
  {
    name: "sales",
    inferred_type: "numeric",
    missing_count: 0,
    missing_pct: 0,
    distinct_count: 4821,
    min_value: 12.5,
    max_value: 9840.0,
    mean_value: 1034.2,
    status: "ok",
  },
  {
    name: "region",
    inferred_type: "categorical",
    missing_count: 18,
    missing_pct: 0.36,
    distinct_count: 5,
    top_value: "Jakarta",
    status: "ok",
  },
  {
    name: "qty",
    inferred_type: "numeric",
    missing_count: 0,
    missing_pct: 0,
    distinct_count: 96,
    min_value: 1,
    max_value: 240,
    mean_value: 38.4,
    status: "ok",
  },
];

const PROFILE = {
  profile_id: "prof_seed",
  dataset_id: DATASET.dataset_id,
  snapshot_id: DATASET.snapshot_id,
  fingerprint: FP_SEED,
  row_count: DATASET.row_count,
  column_count: DATASET.columns.length,
  columns: COLUMN_PROFILES,
};

const PROFILE_SUMMARY = {
  profile_id: "prof_seed",
  dataset_id: DATASET.dataset_id,
  snapshot_id: DATASET.snapshot_id,
  fingerprint: FP_SEED,
  row_count: DATASET.row_count,
  column_count: DATASET.columns.length,
};

const SNAPSHOT_INFO = {
  snapshot_id: DATASET.snapshot_id,
  dataset_id: DATASET.dataset_id,
  dataset_name: DATASET.name,
  fingerprint: FP_SEED,
  row_count: DATASET.row_count,
};

const FINDING = {
  finding_id: "find_seed",
  project_id: DATASET.project_id,
  dataset_id: DATASET.dataset_id,
  title: "Missing pada region 0,36%",
  body: "18 baris tanpa region; stratifikasi per region masih aman.",
  status: "proposed",
  evidence_snapshot_id: DATASET.snapshot_id,
  evidence_fingerprint: FP_SEED,
  created_at: "2026-11-08T04:00:00Z",
  updated_at: "2026-11-08T04:00:00Z",
};

function plan(status: string) {
  return {
    plan_id: "plan_seed",
    project_id: DATASET.project_id,
    dataset_id: DATASET.dataset_id,
    snapshot_id: DATASET.snapshot_id,
    fingerprint: FP_SEED,
    steps: [{ kind: "profile", status: "pending" }],
    status,
    created_at: "2026-11-08T04:07:00Z",
    updated_at: "2026-11-08T04:07:00Z",
  };
}

/** Peta command → data seeded (selalu fresh kecuali { stale } di mock). */
function seedMap(): Record<string, unknown> {
  return {
    "app.info": { version: "0.1.0", platform: "macos" },
    "app.update.check": {
      current_version: "0.1.0",
      latest_version: "0.1.0",
      update_available: false,
      checked_at: "2026-11-08T04:00:00Z",
    },
    "project.recovery.status": { unclean_previous: false },
    "project.create": { project_id: DATASET.project_id, name: "Proyek Seed" },
    // D-F4: read-only recent list (newest first). `project.open` and
    // `dataset.get` for recent ids are handled dynamically in `respond`.
    "project.list_recent": {
      projects: [
        { project_id: "proj_recent", name: "Proyek Recent", dataset_count: 1 },
        { project_id: DATASET.project_id, name: "Proyek Seed", dataset_count: 1 },
      ],
    },
    "project.open": { project_id: "proj_recent", name: "Proyek Recent", dataset: null },
    "dataset.import": DATASET,
    "dataset.get": DATASET,
    "dataset.snapshot.activate": DATASET,
    "dataset.preview": PREVIEW,
    "dataset.profile": PROFILE,
    "dataset.profile.run": PROFILE,
    "dataset.profile.get": PROFILE,
    "dataset.profiles.list": { profiles: [PROFILE_SUMMARY] },
    "dataset.snapshots.list": { snapshots: [SNAPSHOT_INFO] },
    "dataset.provenance": {
      project_id: DATASET.project_id,
      dataset_id: DATASET.dataset_id,
      dataset_name: DATASET.name,
      active_snapshot_id: DATASET.snapshot_id,
      active_fingerprint: FP_SEED,
      origin_snapshot_id: DATASET.snapshot_id,
      origin_fingerprint: FP_SEED,
      snapshots: [SNAPSHOT_INFO],
      profiles: [PROFILE_SUMMARY],
      lineage: [],
    },
    "dataset.quality.run": STAT_PATCHED.freshQuality,
    "dataset.readiness.run": STAT_PATCHED.freshReadiness,
    "dataset.bivariate.run": STAT_PATCHED.freshBivariate,
    "dataset.histogram.run": STAT_PATCHED.freshHistogram,
    "dataset.cleaning.preview": STAT_PATCHED.freshCleaningPreview,
    "dataset.cleaning.run": {
      id: "clean_seed",
      project_id: DATASET.project_id,
      dataset_id: DATASET.dataset_id,
      created_at: "2026-11-08T04:05:00Z",
      parent_snapshot_id: DATASET.snapshot_id,
      parent_fingerprint: FP_SEED,
      child_snapshot_id: "snap_seed_child",
      child_fingerprint: "fp_child_0123456789abcdef0123456789abcdef012345",
      operation: "drop_duplicates",
      columns: ["sales"],
      row_count_before: DATASET.row_count,
      row_count_after: 4997,
      affected_rows: 3,
    },
    "dataset.report.generate": {
      dataset_id: DATASET.dataset_id,
      snapshot_id: DATASET.snapshot_id,
      fingerprint: FP_SEED,
      scope: "all",
      sections: [
        { kind: "profile", record_id: "prof_seed", fingerprint: FP_SEED, stale: false },
      ],
      file_path: "/tmp/report_seed.html",
      file_size_bytes: 12345,
      renderer_version: "0.1.0",
      content_fingerprint: "fp_report_0123456789abcdef0123456789",
      is_final: true,
      validation_summary: "OK",
      created_at: "2026-11-08T04:06:00Z",
    },
    "dataset.pdf.generate": {
      dataset_id: DATASET.dataset_id,
      snapshot_id: DATASET.snapshot_id,
      fingerprint: FP_SEED,
      report_id: "rep_seed",
      sections: [],
      page_count: 3,
      file_path: "/tmp/report_seed.pdf",
      file_size_bytes: 54321,
      renderer_version: "0.1.0",
      pdf_fingerprint: "fp_pdf_0123456789abcdef0123456789",
      source_html_fingerprint: "fp_report_0123456789abcdef0123456789",
      is_final: true,
      validation_summary: "OK",
      created_at: "2026-11-08T04:06:00Z",
    },
    "artifact.open": { opened: true, kind: "pdf" },
    "dataset.export": {
      dataset_id: DATASET.dataset_id,
      snapshot_id: DATASET.snapshot_id,
      fingerprint: FP_SEED,
      format: "csv",
      file_path: "/tmp/seed_sales.csv",
      file_size_bytes: 54321,
      row_count: DATASET.row_count,
      file_fingerprint: "fp_export_0123456789abcdef0123456789",
      created_at: "2026-11-08T04:06:00Z",
    },
    "plan.create": plan("draft"),
    "plan.approve": plan("approved"),
    "plan.execute": plan("executed"),
    "plan.get": plan("draft"),
    "plan.list": { dataset_id: DATASET.dataset_id, plans: [] },
    "insight.findings.list": { dataset_id: DATASET.dataset_id, findings: [FINDING] },
    "insight.finding.create": FINDING,
    "insight.hypotheses.list": { dataset_id: DATASET.dataset_id, hypotheses: [] },
    "insight.hypothesis.create": {
      hypothesis_id: "hyp_seed",
      project_id: DATASET.project_id,
      dataset_id: DATASET.dataset_id,
      statement: "Sales berkorelasi dengan qty.",
      status: "proposed",
      created_at: "2026-11-08T04:08:00Z",
      updated_at: "2026-11-08T04:08:00Z",
    },
    "project.backup.create": {
      project_id: DATASET.project_id,
      file_path: "/tmp/backup_seed.zip",
      file_size_bytes: 54321,
      created_at: "2026-11-08T04:09:00Z",
      project_db_sha256: "sha256_seed_0123456789abcdef",
      version: "1",
    },
    "project.restore": {
      project_id: DATASET.project_id,
      dest_root: "/tmp/restored_seed",
      file_path: "/tmp/backup_seed.zip",
      project_db_sha256: "sha256_seed_0123456789abcdef",
      version: "1",
    },
    "project.export_portable": {
      project_id: DATASET.project_id,
      file_path: "/tmp/portable_seed.zip",
      file_size_bytes: 54321,
      created_at: "2026-11-08T04:09:00Z",
      project_db_sha256: "sha256_seed_0123456789abcdef",
      version: "1",
      kind: "portable",
    },
    "project.diagnostic.create": {
      bundle_id: "diag_seed",
      project_id: DATASET.project_id,
      path: "/tmp/diag_seed.zip",
      level: "basic",
      file_count: 3,
      paths_redacted: 2,
      created_at: "2026-11-08T04:09:00Z",
      sha256: "sha256_seed_0123456789abcdef",
    },
    "dialog.pick_file": { path: "/tmp/seed_sales.csv", available: true },
  };
}

/**
 * Varian fingerprint: `fresh*` dipakai default; `stale*` untuk bukti B3
 * (hasil analisis bertanda fingerprint lama vs dataset aktif → `Stale`).
 */
const STAT_PATCHED = {
  freshQuality: {
    dataset_id: DATASET.dataset_id,
    snapshot_id: DATASET.snapshot_id,
    fingerprint: FP_SEED,
    row_count: DATASET.row_count,
    findings: [
      {
        rule_id: "not_null",
        column_name: "region",
        severity: "warn",
        message: "18 baris tanpa region",
        evidence_count: 18,
        evidence_pct: 0.36,
        evidence_detail: "contoh: baris 12, 87, 130",
      },
    ],
    ok_count: 3,
    check_count: 4,
    problem_count: 1,
    summary: "1 peringatan: missing pada region.",
  },
  staleProfile: {
    profile_id: "prof_seed",
    dataset_id: DATASET.dataset_id,
    snapshot_id: DATASET.snapshot_id,
    fingerprint: FP_OLD,
    row_count: DATASET.row_count,
    column_count: DATASET.columns.length,
    columns: COLUMN_PROFILES,
  },
  staleQuality: {
    dataset_id: DATASET.dataset_id,
    snapshot_id: DATASET.snapshot_id,
    fingerprint: FP_OLD,
    row_count: DATASET.row_count,
    findings: [],
    ok_count: 4,
    check_count: 4,
    problem_count: 0,
    summary: "Hasil dari snapshot sebelumnya.",
  },
  freshReadiness: {
    dataset_id: DATASET.dataset_id,
    snapshot_id: DATASET.snapshot_id,
    fingerprint: FP_SEED,
    row_count: DATASET.row_count,
    column_count: DATASET.columns.length,
    numeric_count: 2,
    categorical_count: 1,
    items: [
      {
        check_id: "numeric_columns",
        category: "structure",
        status: "ok",
        message: "2 kolom numerik terdeteksi",
        evidence_count: 2,
        evidence_pct: 100,
        evidence_detail: "sales, qty",
      },
      {
        check_id: "missing_values",
        category: "quality",
        status: "warn",
        message: "18 baris tanpa region",
        evidence_count: 18,
        evidence_pct: 0.36,
        evidence_detail: "contoh: baris 12, 87, 130",
      },
    ],
    ok_count: 1,
    check_count: 2,
    problem_count: 1,
    score: 92,
    summary: "Siap untuk analisis bivariat dengan 1 peringatan.",
  },
  staleReadiness: {
    dataset_id: DATASET.dataset_id,
    snapshot_id: DATASET.snapshot_id,
    fingerprint: FP_OLD,
    row_count: DATASET.row_count,
    column_count: DATASET.columns.length,
    numeric_count: 2,
    categorical_count: 1,
    items: [],
    ok_count: 0,
    check_count: 0,
    problem_count: 0,
    score: 0,
    summary: "Hasil dari snapshot sebelumnya.",
  },
  freshBivariate: {
    dataset_id: DATASET.dataset_id,
    snapshot_id: DATASET.snapshot_id,
    fingerprint: FP_SEED,
    column_a: "sales",
    column_b: "qty",
    mode: "num-num",
    type_a: "numeric",
    type_b: "numeric",
    pearson_r: 0.87,
    spearman_rho: 0.86,
    scatter_points: [
      { x: 1250.5, y: 42 },
      { x: 970.0, y: 31 },
      { x: 1430.25, y: 55 },
      { x: 640.0, y: 18 },
      { x: 1105.75, y: 47 },
      { x: 815.5, y: 29 },
      { x: 1320.0, y: 51 },
      { x: 590.25, y: 15 },
    ],
    n_pairs: 4982,
    missing_pairs: 18,
    sampled: false,
    sample_size: 4982,
  },
  staleBivariate: {
    dataset_id: DATASET.dataset_id,
    snapshot_id: DATASET.snapshot_id,
    fingerprint: FP_OLD,
    column_a: "sales",
    column_b: "qty",
    mode: "scatter",
    type_a: "numeric",
    type_b: "numeric",
    n_pairs: 0,
    missing_pairs: 0,
    sampled: false,
    sample_size: 0,
  },
  freshHistogram: {
    dataset_id: DATASET.dataset_id,
    snapshot_id: DATASET.snapshot_id,
    fingerprint: FP_SEED,
    column_name: "sales",
    inferred_type: "numeric",
    kind: "numeric",
    bins: [
      { label: "0–1000", count: 2100 },
      { label: "1000–2000", count: 1900 },
      { label: "2000+", count: 1000 },
    ],
    bin_method: "freedman-diaconis",
    missing_pct: 0,
    min_value: 12.5,
    max_value: 9840.0,
    mean_value: 1034.2,
    value_count: 5000,
  },
  staleHistogram: {
    dataset_id: DATASET.dataset_id,
    snapshot_id: DATASET.snapshot_id,
    fingerprint: FP_OLD,
    column_name: "sales",
    inferred_type: "numeric",
    kind: "numeric",
    bins: [],
    bin_method: "freedman-diaconis",
    missing_pct: 0,
    value_count: 0,
  },
  freshCleaningPreview: {
    operation: "drop_duplicates",
    columns: ["sales"],
    parent_fingerprint: FP_SEED,
    row_count_before: DATASET.row_count,
    row_count_after: 4997,
    affected_rows: 3,
    affected_pct: 0.06,
    per_column_affected: [{ column: "sales", affected_rows: 3 }],
  },
  staleCleaningPreview: {
    operation: "drop_duplicates",
    columns: ["sales"],
    parent_fingerprint: FP_OLD,
    row_count_before: DATASET.row_count,
    row_count_after: 4997,
    affected_rows: 3,
    affected_pct: 0.06,
    per_column_affected: [{ column: "sales", affected_rows: 3 }],
  },
};

function staleMap(): Record<string, unknown> {
  return {
    "dataset.profile.run": STAT_PATCHED.staleProfile,
    "dataset.quality.run": STAT_PATCHED.staleQuality,
    "dataset.readiness.run": STAT_PATCHED.staleReadiness,
    "dataset.bivariate.run": STAT_PATCHED.staleBivariate,
    "dataset.histogram.run": STAT_PATCHED.staleHistogram,
    "dataset.cleaning.preview": STAT_PATCHED.staleCleaningPreview,
  };
}

export interface MockBridgeOptions {
  seeded?: boolean;
  events?: unknown[];
  stale?: boolean;
  /** hanya dataset.cleaning.preview yang fingerprint-nya usang (uji previewStale) */
  stalePreview?: boolean;
  /** dataset.snapshots.list gagal → revalidasi resume gagal (D-F3 degraded) */
  resumeFail?: boolean;
  /** D-F6: get_protocol_info mengembalikan revision salah */
  protocolMismatch?: boolean;
  /** D-F6: app.update.check gagal (NOT_FOUND) */
  updateFail?: boolean;
  /** D-F6: recovery tersedia (unclean + autosave) */
  recoveryAvailable?: boolean;
  /** D-F6: project.recovery.restore gagal (NOT_FOUND) */
  recoveryRestoreFail?: boolean;
  /** D-F6: get_events throw → Job Center load-failed */
  eventsFail?: boolean;
  /** D-F6: project.list_recent shape rusak → crash render di Setup */
  crashRecent?: boolean;
  /** FLOW §2.7: artifact.open gagal (NOT_FOUND) → error kanal fitur */
  artifactOpenFail?: boolean;
}

/** Seed lengkap B1/B12: project → import → Profiling run.
 *  Bridge wajib dipasang SEBELUM goto (reload akan menghapus konteks). */
export async function setupWalkthrough(
  page: Page,
  opts?: { stale?: boolean },
): Promise<void> {
  await mockBridge(page, { seeded: true, stale: opts?.stale ?? false });
  await page.goto("/");
  await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
  await page.getByLabel("Nama project").fill("Proyek Seed");
  await page.getByRole("button", { name: "Buat", exact: true }).click();
  await page.waitForFunction(
    () =>
      document.body.textContent?.includes("Project dibuat") ?? false,
  );
  await page.getByLabel("Nama dataset").fill("seed_sales.csv");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await page.waitForFunction(
    () =>
      document.body.textContent?.includes("Dataset diimport") ?? false,
  );
  await page.getByRole("link", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Jalankan Profiling" }).click();
  await page.waitForFunction(
    () =>
      document.body.textContent?.includes("Profiling selesai") ?? false,
  );
}

/** Protokol OK; tanpa seeded: command/query ok tanpa data (empty state). */
export async function mockBridge(
  page: Page,
  opts: MockBridgeOptions = {},
): Promise<void> {
  const { seeded = false, events = [], stale = false, stalePreview = false, resumeFail = false, protocolMismatch = false, updateFail = false, recoveryAvailable = false, recoveryRestoreFail = false, eventsFail = false, crashRecent = false, artifactOpenFail = false } = opts;
  const cfg = {
    seeded,
    events,
    stale,
    resumeFail,
    protocolMismatch,
    updateFail,
    recoveryAvailable,
    recoveryRestoreFail,
    eventsFail,
    crashRecent,
    artifactOpenFail,
    fresh: seeded ? seedMap() : {},
    staleMap: seeded && stale ? staleMap() : {},
    stalePreviewMap: seeded && stalePreview
      ? { "dataset.cleaning.preview": staleMap()["dataset.cleaning.preview"] }
      : {},
  };
  await page.addInitScript(
    (c: {
      seeded: boolean;
      events: unknown[];
      resumeFail: boolean;
      protocolMismatch: boolean;
      updateFail: boolean;
      recoveryAvailable: boolean;
      recoveryRestoreFail: boolean;
      eventsFail: boolean;
      crashRecent: boolean;
      artifactOpenFail: boolean;
      fresh: Record<string, unknown>;
      staleMap: Record<string, unknown>;
      stalePreviewMap: Record<string, unknown>;
    }) => {
      const respond = (req: unknown) => {
        const command =
          (req as { command?: string } | null)?.command ?? "";
        if (c.updateFail && command === "app.update.check") {
          return {
            ok: false,
            data: null,
            error: { code: "NOT_FOUND", message: "feed rilis tidak ditemukan di backend" },
            protocol_version: 1,
            correlation_id: "corr-update-1",
          };
        }
        if (c.recoveryAvailable && command === "project.recovery.status") {
          return {
            ok: true,
            data: { unclean_previous: true, has_autosave: true, autosave_created_at: "2026-11-08T04:00:00Z", autosave_path: "/tmp/autosave.zip" },
            error: null,
            protocol_version: 1,
            correlation_id: null,
          };
        }
        if (c.recoveryRestoreFail && command === "project.recovery.restore") {
          return {
            ok: false,
            data: null,
            error: { code: "NOT_FOUND", message: "autosave hilang di backend" },
            protocol_version: 1,
            correlation_id: "corr-recovery-1",
          };
        }
        if (c.crashRecent && command === "project.list_recent") {
          return {
            ok: true,
            data: { projects: "boom-bukan-array" },
            error: null,
            protocol_version: 1,
            correlation_id: null,
          };
        }
        if (c.artifactOpenFail && command === "artifact.open") {
          return {
            ok: false,
            data: null,
            error: { code: "NOT_FOUND", message: "artefak tidak ditemukan di backend" },
            protocol_version: 1,
            correlation_id: "corr-artifact-1",
          };
        }
        if (c.resumeFail && command === "dataset.snapshots.list") {
          return {
            ok: false,
            data: null,
            error: { code: "NOT_FOUND", message: "project hilang di backend" },
            protocol_version: 1,
            correlation_id: null,
          };
        }
        // D-F4 dynamic handlers: echo the requested project/dataset so
        // opening a recent project yields matching columns.
        if (c.seeded && (command === "project.open" || command === "dataset.get")) {
          const payload = ((req as { payload?: Record<string, unknown> } | null)
            ?.payload ?? {}) as Record<string, unknown>;
          const pid = String(payload.project_id ?? "proj_recent");
          if (pid !== "proj_seed") {
            const ds = {
              dataset_id: `ds_${pid}`,
              project_id: pid,
              name: "recent_sales.csv",
              snapshot_id: `snap_${pid}`,
              fingerprint: "fp_recent_0123456789abcdef0123456789abcdef012345",
              row_count: 123,
              columns: ["recent_col_a", "recent_col_b"],
            };
            const data =
              command === "project.open"
                ? { project_id: pid, name: "Proyek Recent", dataset: ds }
                : ds;
            return {
              ok: true,
              data,
              error: null,
              protocol_version: 1,
              correlation_id: null,
            };
          }
        }
        let data: unknown = null;
        if (c.seeded) {
          data =
            c.stalePreviewMap[command] ??
            c.staleMap[command] ??
            c.fresh[command] ??
            null;
        }
        return {
          ok: true,
          data,
          error: null,
          protocol_version: 1,
          correlation_id: null,
        };
      };
      const w = window as unknown as {
        pywebview: {
          api: {
            get_protocol_info: () => Promise<unknown>;
            execute_command: (req: unknown) => Promise<unknown>;
            execute_query: (req: unknown) => Promise<unknown>;
            get_events: () => Promise<unknown[]>;
          };
        };
      };
      w.pywebview = {
        api: {
          get_protocol_info: async () => ({
            app_name: "EDA Workbench",
            app_version: "0.1.0",
            protocol_revision: c.protocolMismatch ? 2 : 1,
            protocol_version: 1,
          }),
          execute_command: async (req: unknown) => respond(req),
          execute_query: async (req: unknown) => respond(req),
          get_events: async () => {
            if (c.eventsFail) throw new Error("get_events putus");
            return c.events;
          },
        },
      };
    },
    cfg,
  );
}
