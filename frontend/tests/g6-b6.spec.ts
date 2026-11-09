/**
 * G6-B6 — Bukti QA-SHELL-001:90 (B6):
 * "Job tetap berjalan saat navigasi; progress indeterminate;
 * `jobProgress()` dihapus" (D-F2/D-F5/D-S8).
 *
 * Kontrak:
 * - JOB-SHELL-001:51 — "Frontend dilarang mengarang status;
 *   jobProgress() (JobClient.ts:39-60, Running→70%) harus dihapus,
 *   bukan dijadikan kontrak. Progress wajib indeterminate sampai
 *   backend mengekspos angka (D-F5 … Pydantic-dulu)."
 * - JOB-SHELL-001:122 — baris B6 ("Uji job tetap berjalan saat
 *   navigasi; progress indeterminate; jobProgress() dihapus").
 * - FLOW-SHELL-001:78 — "Progress di Job Center wajib
 *   indeterminate sampai backend mengekspos angka; jobProgress()
 *   … harus dihapus."
 * - FLOW-SHELL-001 §2.3 langkah 6 `monitor` — "job tetap berjalan
 *   (Doc07 §6.3:260-262); navigasi TIDAK membatalkan job",
 *   implementasi: "Job Center persisten, identitas job stabil".
 * - D-F2 (FLOW §2.3) — "Back/Forward mengembalikan route tanpa
 *   membatalkan job dan tanpa menghapus hasil."
 * - HARNESS-4: "Job lifecycle backend-authoritative; progress numeric
 *   hanya bila `JobEvent.progress` nyata (0..1), bila null →
 *   indeterminate." JobEvent kini membawa `command` + `progress?` opsional
 *   (D-F5 Pydantic-dulu, generated.ts — field BARU dari backend,
 *   bukan rekayasa frontend).
 *
 * Mock: `get_events` diisi via opts `events` helpers.ts:728-730 —
 * job Running injeksi adalah event backend yang dikonsumsi
 * `useJobPoller` (JobClient.ts:62-126); navigasi SPA tidak mengirim
 * pembatalan apa pun. Baris R1–R3 @900px + @1440px (JOB-SHELL-001:134
 * ambang B1–B6: 900px + 1440px), R4 scan sumber (node).
 */
import { expect, test, type Page } from "@playwright/test";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { mockBridge } from "./helpers";

const RUN_NULL = {
  event_id: "evt-run-null",
  job_id: "job-running-null-1",
  state: "Running",
  seq: 3,
  command: "dataset.profile.run",
  message: "Masih di backend",
  started_at: "2026-11-08T16:00:00Z",
  // progress: null (sengaja tidak dikirim) → wajib indeterminate
};

const RUN_REAL = {
  event_id: "evt-run-real",
  job_id: "job-deter-40-1", // slice(0,8)="job-dete" — unik dari job-runn
  state: "Running",
  seq: 2,
  command: "dataset.quality.run",
  progress: 0.4, // angka nyata backend → satu-satunya yang boleh determinate
};

const DONE_NULL = {
  event_id: "evt-done-null",
  job_id: "job-done-null-1",
  state: "Completed",
  seq: 1,
  command: "dataset.profile.run",
  finished_at: "2026-11-08T16:01:00Z",
  // progress null + terminal → complete (100%)
};

async function bootWithJobs(page: Page): Promise<void> {
  await mockBridge(page, {
    seeded: true,
    events: [RUN_NULL, RUN_REAL, DONE_NULL],
  });
  await page.goto("/");
  await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
  await page.getByLabel("Nama project").fill("Proyek B6");
  await page.getByRole("button", { name: "Buat", exact: true }).click();
  await page.waitForFunction(
    () => document.body.textContent?.includes("Project dibuat") ?? false,
  );
  await page.getByLabel("Nama dataset").fill("seed_sales.csv");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await page.waitForFunction(
    () => document.body.textContent?.includes("Dataset diimport") ?? false,
  );
}

/**
 * drawer: narrow (900–1199px) toggle diklik; wide (≥1200px) aside kolom
 * inline SELALU terbuka tanpa toggle (App.tsx:150 + tokens.css) —
 * Job Center persisten di kedua mode (FLOW §2.3 langkah 6).
 */
async function openDrawer(page: Page, width: number): Promise<void> {
  if (width >= 1200) {
    // wide: aside inline — pastikan job items sudah terlihat tanpa toggle
    await expect(page.locator("#job-center-aside")).toBeVisible();
    await expect(page.locator(".job-item").first()).toBeVisible();
    return;
  }
  const toggle = page.getByRole("button", { name: "Job Center" }).first();
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator("#job-center-aside")).toHaveAttribute("data-open", "true");
}

/** Identitas job Running-null persis (badge Running + potongan id). */
async function expectRunningNull(page: Page): Promise<string> {
  const item = page.locator(".job-item", {
    hasText: "job-runn",
  }).filter({ hasText: "Running" });
  // job_id "job-running-null-1" → slice(0,8) = "job-runn"
  await expect(item).toBeVisible();
  await expect(item).toContainText("job-runn");
  await expect(item).toContainText("Running");
  return "job-runn";
}

for (const vp of [
  { width: 900, height: 800 },
  { width: 1440, height: 900 },
]) {
  test(`R1 (@${vp.width}px): job tetap berjalan & identitas stabil saat navigasi antar-route`, async ({ page }) => {
    await page.setViewportSize(vp);
    await bootWithJobs(page);
    await openDrawer(page, vp.width);
    await expectRunningNull(page);
    // Navigasi bebas antar route (FLOW §2.3 monitor): drawer tetap terbuka,
    // job item tetap ada dengan id + state yang sama — tidak dibatalkan.
    for (const name of ["Profil", "Kualitas", "Dataset"] as const) {
      await page.getByRole("link", { name, exact: true }).click();
      if (vp.width < 1200) {
        await expect(page.locator("#job-center-aside")).toHaveAttribute("data-open", "true");
      }
      await expectRunningNull(page);
      const item = page.locator(".job-item").filter({ hasText: "Running" }).first();
      await expect(item).not.toContainText("Cancelling");
      await expect(item).not.toContainText("Dibatalkan");
    }
    // Item Running-null + Running-real + Completed tetap 3 (tidak ada yang hilang).
    await expect(page.locator(".job-item")).toHaveCount(3);
  });
}

test("R2 (@900px): Back/Forward tidak membatalkan job yang berjalan", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 800 });
  await bootWithJobs(page);
  await openDrawer(page, 900);
  await expectRunningNull(page);
  await page.getByRole("link", { name: "Profil", exact: true }).click();
  await page.getByRole("link", { name: "Kualitas", exact: true }).click();
  await page.goBack();
  await expectRunningNull(page);
  await page.goForward();
  await expectRunningNull(page);
  // Terminal job tetap utuh (hasil tidak dihapus navigasi).
  await expect(page.locator(".job-item").filter({ hasText: "Completed" })).toBeVisible();
});

for (const vp of [
  { width: 900, height: 800 },
  { width: 1440, height: 900 },
]) {
  test(`R3 (@${vp.width}px): progress null = indeterminate; hanya angka nyata yang determinate`, async ({ page }) => {
    await page.setViewportSize(vp);
    await bootWithJobs(page);
    await openDrawer(page, vp.width);
    // Job Running tanpa progress: progressbar indeterminate —
    // TIDAK ada aria-valuenow, tidak ada teks persen karangan.
    const runItem = page.locator(".job-item").filter({ hasText: "job-runn" });
    await expect(runItem).toBeVisible();
    const runBar = runItem.locator('[role="progressbar"]');
    await expect(runBar).toHaveAttribute("aria-valuetext", "Sedang berjalan: Running");
    expect(await runBar.getAttribute("aria-valuenow")).toBeNull();
    await expect(runItem).not.toContainText("%");
    // Job Running dengan progress nyata 0.4: determinate 40 — satu-satunya
    // angka yang boleh tampil (D-F5/HARNESS-4).
    const realItem = page.locator(".job-item").filter({ hasText: "job-dete" });
    const realBar = realItem.locator('[role="progressbar"]');
    await expect(realBar).toHaveAttribute("aria-valuenow", "40");
    // Job terminal tanpa progress: complete 100.
    const doneItem = page.locator(".job-item").filter({ hasText: "Completed" });
    const doneBar = doneItem.locator('[role="progressbar"]');
    await expect(doneBar).toHaveAttribute("aria-valuenow", "100");
    // Tidak ada progressbar determinate lain berbasis karangan.
    await expect(page.locator('[role="progressbar"][aria-valuenow]')).toHaveCount(2);
  });
}

test("R4: jobProgress() dihapus dari src/; tidak ada persentase rekayasa", () => {
  const srcRoot = join(process.cwd(), "src");
  const hits: string[] = [];
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name);
      if (statSync(p).isDirectory()) {
        walk(p);
      } else if (/\.(ts|tsx)$/.test(name)) {
        const body = readFileSync(p, "utf8");
        if (/jobProgress/.test(body)) hits.push(p);
        // pola lama: Running→70% rekayasa (JobClient.ts:39-60 lama)
        if (/Running[\s\S]{0,120}70/.test(body)) hits.push(`${p} (pola Running→70)`);
      }
    }
  };
  walk(srcRoot);
  expect(hits).toEqual([]);
  // Proyeksi jujur tetap ada: JobClient memetakan progress number→null,
  // JobCenter determinate hanya dari angka nyata (JobCenter.tsx:29-30).
  const client = readFileSync(join(srcRoot, "shared/job/JobClient.ts"), "utf8");
  expect(client).toContain("typeof e.progress === \"number\"");
  const center = readFileSync(join(srcRoot, "shared/job/JobCenter.tsx"), "utf8");
  expect(center).toContain("tidak mengarang persentase");
});
