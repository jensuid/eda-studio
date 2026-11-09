/**
 * visual.spec.ts — P2-5 + B10 (QA-SHELL-001): screenshot per route
 * 900/1440 vs baseline PNG di `frontend/tests/__screenshots__/`.
 *
 * B10 [D-S7 Ratified]: baseline memakai fixture seeded per state
 * (bukan empty state) dan toleransi maxDiffPixelRatio 0.05 (≤5%).
 * Alur: Setup (project+import+profiling) → aksi khas tiap route →
 * screenshot. Screenshot memakan waktu sehingga daftar route ringkas
 * (8 route × 2 viewport = 16 test).
 */
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { setupWalkthrough } from "./helpers";

const ROUTES = [
  { label: "Proyek", file: "setup" },
  { label: "Dataset", file: "dataset" },
  { label: "Profil", file: "profiling" },
  { label: "Kualitas", file: "quality" },
  { label: "Pembersihan", file: "cleaning" },
  { label: "Hubungan", file: "bivariat" },
  { label: "Kesiapan", file: "readiness" },
  { label: "Laporan", file: "report" },
] as const;

const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "900", width: 900, height: 900 },
] as const;

/** Aksi khas route agar baseline menangkap state terisi (D-S7). */
async function routeAction(page: Page, label: string): Promise<void> {
  if (label === "Kualitas") {
    await page.getByRole("button", { name: "Jalankan Quality Check" }).click();
    await page.waitForFunction(
      () => document.body.textContent?.includes("Quality check selesai") ?? false,
    );
  } else if (label === "Kesiapan") {
    await page
      .getByRole("button", { name: "Jalankan Readiness Assessment" })
      .click();
    await page.waitForFunction(
      () =>
        document.body.textContent?.includes("Readiness assessment selesai") ??
        false,
    );
  } else if (label === "Hubungan") {
    await page.locator("#bivar-a").selectOption("sales");
    await page.locator("#bivar-b").selectOption("qty");
    await page
      .getByRole("button", { name: "Jalankan Analisis Bivariat" })
      .click();
    await page.waitForFunction(
      () => document.body.textContent?.includes("0.87") ?? false,
    );
  } else if (label === "Pembersihan") {
    await page.getByRole("link", { name: "Kualitas", exact: true }).click();
    await page.getByRole("button", { name: "Jalankan Quality Check" }).click();
    await page.waitForFunction(
      () => document.body.textContent?.includes("Quality check selesai") ?? false,
    );
    await page.getByRole("link", { name: "Pembersihan", exact: true }).click();
    await page.getByRole("button", { name: "Hitung dampak" }).click();
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll("button")).some((b) =>
          (b.textContent ?? "").includes("Terapkan cleaning"),
        ),
    );
  }
}

for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    test(`visual: ${route.file} @ ${vp.name}px`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await setupWalkthrough(page);
      if (route.label !== "Profil") {
        await page.getByRole("link", { name: route.label, exact: true }).click();
      }
      await routeAction(page, route.label);
      const main = page.locator("#main-content");
      await expect(main).toBeVisible();
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      const overflow = await page.evaluate(() => {
        const el = document.documentElement;
        return el.scrollWidth - el.clientWidth;
      });
      expect(overflow).toBeLessThanOrEqual(1);
      await expect(page).toHaveScreenshot(`${route.file}-${vp.name}.png`, {
        maxDiffPixelRatio: 0.05,
        animations: "disabled",
        caret: "hide",
      });
    });
  }
}
