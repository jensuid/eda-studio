/**
 * UIUX-05 acceptance: DatasetCard (nama + rows/cols + fingerprint 12 char +
 * aksi cepat) dan banner jujur JobCenter saat getEvents gagal (dilarang
 * "Belum ada job." — DS-SHELL-001 §6 Job item R5b; D-F5/D-F6).
 */
import { expect, test } from "@playwright/test";
import { mockBridge, setupWalkthrough } from "./helpers";

test.describe("UIUX-05 — DatasetCard", () => {
  test("kartu dataset: nama, baris×kolom, fingerprint 12 char, aksi cepat navigasi nyata", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupWalkthrough(page);
    await page.goto("/#/setup");

    const card = page.locator(".dataset-card");
    await expect(card).toBeVisible();
    await expect(card).toContainText("seed_sales.csv");
    await expect(card).toContainText("5000 baris × 3 kolom");
    // FP_SEED "fp_seed_0123456789…" → hanya 12 char pertama yang tampil.
    await expect(card).toContainText("sha256 fp_seed_0123…");

    await page.getByRole("link", { name: "Profil dataset" }).click();
    await expect(page).toHaveURL(/#\/profiling$/);
    await expect(page.locator("#main-content")).toContainText("Profil");
  });

  test("aksi cepat 'Buka dataset' menuju explorer", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setupWalkthrough(page);
    await page.goto("/#/setup");

    await page.getByRole("link", { name: "Buka dataset" }).click();
    await expect(page).toHaveURL(/#\/explorer$/);
  });
});

test.describe("UIUX-05 — JobCenter loadFailed jujur", () => {
  test("getEvents gagal → banner per-concern, TANPA 'Belum ada job' palsu", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockBridge(page, { seeded: true, eventsFail: true });
    await page.goto("/#/setup");
    await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();

    const banner = page.locator(".job-load-failed");
    await expect(banner).toBeVisible();
    await expect(banner).toContainText("Daftar job tidak dapat dimuat.");
    // D-F6: loadFailed bukan "Belum ada job".
    await expect(page.locator(".app-aside")).not.toContainText("Belum ada job");
    await expect(
      page.getByRole("button", { name: "Coba lagi" }),
    ).toBeVisible();
  });
});
