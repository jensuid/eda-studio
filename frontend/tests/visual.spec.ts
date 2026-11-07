/**
 * visual.spec.ts — P2-5: screenshot 900/1440 per route vs baseline PNG
 * di `frontend/tests/__screenshots__/` (baseline pertama dibuat Playwright
 * saat run awal; CI membandingkan terhadap baseline ter-commit).
 * Toleransi maxDiffPixelRatio 0.15: menahan regresi layout kasar, mentolerir
 * anti-aliasing font lintas OS (macOS lokal vs Ubuntu CI).
 * Plus: assert tidak ada scroll horizontal pada kedua viewport (P2-4).
 */
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mockBridge } from "./helpers";

const ROUTES = [
  { label: "Setup", file: "setup" },
  { label: "Dataset", file: "dataset" },
  { label: "Profiling", file: "profiling" },
  { label: "Quality", file: "quality" },
  { label: "Bivariat", file: "bivariat" },
  { label: "Cleaning", file: "cleaning" },
  { label: "Report", file: "report" },
] as const;

const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "900", width: 900, height: 900 },
] as const;

for (const route of ROUTES) {
  for (const vp of VIEWPORTS) {
    test(`visual: ${route.file} @ ${vp.name}px`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await mockBridge(page);
      await page.goto("/");
      await page
        .getByRole("navigation", { name: "Navigasi utama" })
        .waitFor();
      if (route.label !== "Setup") {
        await page.getByRole("button", { name: route.label }).click();
      }
      const main = page.locator("#main-content");
      await expect(main).toBeVisible();
      // Stabilisasi render sebelum screenshot (font/async layout).
      await page.waitForLoadState("networkidle");
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(300);
      // P2-4: tidak ada scroll horizontal pada 900px.
      const overflow = await page.evaluate(() => {
        const el = document.documentElement;
        return el.scrollWidth - el.clientWidth;
      });
      expect(overflow).toBeLessThanOrEqual(1);
      await expect(page).toHaveScreenshot(`${route.file}-${vp.name}.png`, {
        maxDiffPixelRatio: 0.15,
        animations: "disabled",
        caret: "hide",
      });
    });
  }
}
