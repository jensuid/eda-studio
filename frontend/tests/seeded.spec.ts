/**
 * seeded.spec.ts — bukti eksekusi B1, B3, B6 (QA-SHELL-001 v1.0, Phase 0).
 *
 * B1: seeded fixtures menampilkan state populated pada setiap route,
 *     alur UI nyata (buat project → import → navigasi keyboard).
 * B3: fingerprint usang → banner "Hasil mungkin usang" (state `Stale`).
 * B6: event job non-terminal → progress indeterminate TANPA aria-valuenow
 *     (D-F5/D-S8: `JobEvent` belum membawa progress; `jobProgress()` dihapus);
 *     job berlanjut saat navigasi (polling tidak terikat route).
 *
 * Nilai ekspektasi dari fixture deterministik di helpers.ts — bukan benar
 * secara analitik, hanya membuktikan permukaan menampilkan data.
 */
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mockBridge } from "./helpers";

async function setupWalkthrough(
  page: Page,
  opts: { stale?: boolean; stalePreview?: boolean } = {},
): Promise<void> {
  await mockBridge(page, { seeded: true, stale: opts.stale ?? false, stalePreview: opts.stalePreview ?? false });
  await page.goto("/");
  await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
  await page.getByLabel("Nama project").fill("Proyek Seed");
  await page.getByRole("button", { name: "Buat", exact: true }).click();
  await expect(page.getByText("Project dibuat")).toBeVisible();
  await page.getByLabel("Nama dataset").fill("seed_sales.csv");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expect(page.getByText("Dataset diimport")).toBeVisible();
  // Gate lintas-route: Quality/Readiness/Bivariat butuh savedProfile.
  await page.getByRole("link", { name: "Profiling" }).click();
  await page.getByRole("button", { name: "Jalankan Profiling" }).click();
  await expect(page.getByText("Profiling selesai")).toBeVisible();
}

test.describe("B1 — seeded walkthrough cold-start → orient → run-stage", () => {
  test("buat project → import → route Profiling menampilkan kolom seeded", async ({ page }) => {
    await setupWalkthrough(page);
    // Pasca-run: tabel profil menampilkan kolom seeded.
    await expect(page.locator("#main-content")).toContainText("sales");
    await expect(page.locator("#main-content")).toContainText("region");
    await expect(page.locator("#main-content")).toContainText("5000");
  });

  test("route Quality menampilkan finding seeded (1 peringatan)", async ({ page }) => {
    await setupWalkthrough(page);
    await page.getByRole("link", { name: "Quality" }).click();
    await page.getByRole("button", { name: "Jalankan Quality Check" }).click();
    await expect(page.getByText("Quality check selesai")).toBeVisible();
    await expect(page.locator("#main-content")).toContainText("18 baris tanpa region");
  });

  test("route Readiness menampilkan ringkasan seeded + skor", async ({ page }) => {
    await setupWalkthrough(page);
    await page.getByRole("link", { name: "Readiness" }).click();
    await page.getByRole("button", { name: "Jalankan Readiness Assessment" }).click();
    await expect(page.getByText("Readiness assessment selesai")).toBeVisible();
    await expect(page.locator("#main-content")).toContainText(
      "Siap untuk analisis bivariat dengan 1 peringatan",
    );
  });

  test("route Bivariat menampilkan r = 0.87 (mode num-num)", async ({ page }) => {
    await setupWalkthrough(page);
    await page.getByRole("link", { name: "Bivariat" }).click();
    await page.selectOption("#bivar-a", "sales");
    await page.selectOption("#bivar-b", "qty");
    await page.getByRole("button", { name: "Jalankan Analisis Bivariat" }).click();
    await expect(page.locator("#main-content")).toContainText("0.87");
  });

  test("walkthrough dapat diselesaikan keyboard-only", async ({ page }) => {
    await mockBridge(page, { seeded: true });
    await page.goto("/");
    await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
    // Tab berurutan sampai input Nama project menerima fokus.
    // (Cap 25: urutan Tab mencakup tombol palet perintah global di app-bar.)
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
      if (focused === "Nama project") break;
    }
    await page.keyboard.type("Proyek Seed");
    // Tab ke tombol Buat lalu Enter.
    for (let i = 0; i < 15; i++) {
      await page.keyboard.press("Tab");
      const focused = await page.evaluate(() => document.activeElement?.textContent?.trim());
      if (focused === "Buat") break;
    }
    await page.keyboard.press("Enter");
    await expect(page.getByText("Project dibuat")).toBeVisible();
  });
});

test.describe("B3 — fingerprint mismatch → state Stale (bukan skor rendah)", () => {
  async function setupStaleWalkthrough(page: Page): Promise<void> {
    await setupWalkthrough(page, { stale: true });
  }

  test("Cleaning: quality usang vs dataset aktif ditandai", async ({ page }) => {
    await setupStaleWalkthrough(page);
    await page.getByRole("link", { name: "Quality" }).click();
    await page.getByRole("button", { name: "Jalankan Quality Check" }).click();
    await expect(page.getByText("Quality check selesai")).toBeVisible();
    await page.getByRole("link", { name: "Cleaning" }).click();
    // quality fingerprint usang → banner di CleaningSection (state Stale,
    // bukan skor rendah — hasil tetap ditampilkan dengan penanda).
    await expect(page.locator("#main-content")).toContainText("usang");
  });

  test("Bivariat dengan fingerprint usang menampilkan banner usang", async ({ page }) => {
    await setupStaleWalkthrough(page);
    await page.getByRole("link", { name: "Bivariat" }).click();
    await page.selectOption("#bivar-a", "sales");
    await page.selectOption("#bivar-b", "qty");
    await page.getByRole("button", { name: "Jalankan Analisis Bivariat" }).click();
    await expect(page.locator("#main-content")).toContainText("usang");
  });

  test("Cleaning preview usang: 'Snapshot telah berubah. Hitung ulang dampak.'", async ({ page }) => {
    await setupWalkthrough(page, { stalePreview: true });
    await page.getByRole("link", { name: "Quality" }).click();
    await page.getByRole("button", { name: "Jalankan Quality Check" }).click();
    await expect(page.getByText("Quality check selesai")).toBeVisible();
    await page.getByRole("link", { name: "Cleaning" }).click();
    await page.getByRole("button", { name: "Hitung dampak" }).click();
    await expect(page.locator("#main-content")).toContainText(
      "Snapshot telah berubah. Hitung ulang dampak.",
    );
  });
});

test.describe("B6 — job berlanjut saat navigasi, progress indeterminate", () => {
  const runningEvents = [
    { seq: 1, job_id: "job_seed_running", state: "Running", message: "Memproses", at: "2026-11-08T04:10:00Z" },
  ];
  const completedEvents = [
    { seq: 2, job_id: "job_seed_running", state: "Completed", message: "Selesai", at: "2026-11-08T04:10:05Z" },
  ];
  // D-F5/D-S8: event ekstensi backend-first membawa perintah + progress nyata.
  const progressEvents = [
    { seq: 1, job_id: "job_seed_running", state: "Running", message: "Memproses", command: "history.run", progress: 0.42, started_at: "2026-11-08T04:10:00Z", finished_at: null },
  ];

  test("event Running: progressbar TANPA aria-valuenow (indeterminate, D-F5)", async ({ page }) => {
    await mockBridge(page, { seeded: true, events: runningEvents });
    await page.goto("/");
    await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
    const bar = page.getByRole("progressbar");
    await expect(bar).toBeVisible();
    await expect(bar).not.toHaveAttribute("aria-valuenow", /.*/);
    await expect(bar).toHaveAttribute("aria-valuetext", /Running/);
  });

  test("job tetap tampil setelah navigasi antar route", async ({ page }) => {
    await mockBridge(page, { seeded: true, events: runningEvents });
    await page.goto("/");
    await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
    await expect(page.getByText("Running")).toBeVisible();
    await page.getByRole("link", { name: "Dataset", exact: true }).click();
    await expect(page.locator("#main-content")).toBeVisible();
    await expect(page.getByText("Running")).toBeVisible();
    await page.getByRole("link", { name: "Profiling" }).click();
    await expect(page.getByText("Running")).toBeVisible();
  });

  test("D-F5: progress nyata tampil determinate aria-valuenow=42", async ({ page }) => {
    await mockBridge(page, { seeded: true, events: progressEvents });
    await page.goto("/");
    await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
    const bar = page.getByRole("progressbar");
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute("aria-valuenow", "42");
  });

  test("D-S8: command ada → label In Progress + nama perintah tampil", async ({ page }) => {
    await mockBridge(page, { seeded: true, events: progressEvents });
    await page.goto("/");
    await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
    await expect(page.getByText("In Progress")).toBeVisible();
    await expect(page.getByText("history.run")).toBeVisible();
  });

  // D-S8 pelengkap: saat job dengan command mencapai state terminal,
  // label "In Progress" hilang (perintah tetap ditampilkan tanpa label).
  test("D-S8: job selesai → label In Progress hilang, perintah tetap tampil", async ({ page }) => {
    const finishedWithCommand = [
      { seq: 1, job_id: "job_seed_running", state: "Running", message: "Memproses", command: "history.run", progress: 0.42, started_at: "2026-11-08T04:10:00Z", finished_at: null },
      { seq: 2, job_id: "job_seed_running", state: "Completed", message: "Selesai", command: "history.run", progress: 1, started_at: "2026-11-08T04:10:00Z", finished_at: "2026-11-08T04:10:05Z" },
    ];
    await mockBridge(page, { seeded: true, events: finishedWithCommand });
    await page.goto("/");
    await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
    await expect(page.getByText("Completed")).toBeVisible();
    await expect(page.getByText("In Progress")).toHaveCount(0);
    await expect(page.getByText("history.run")).toBeVisible();
  });

  test("event Completed: progressbar terminal aria-valuenow=100", async ({ page }) => {
    await mockBridge(page, { seeded: true, events: completedEvents });
    await page.goto("/");
    await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
    const bar = page.getByRole("progressbar");
    await expect(bar).toBeVisible();
    await expect(bar).toHaveAttribute("aria-valuenow", "100");
  });
});
