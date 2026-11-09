/**
 * vertical.spec.ts — B12 (QA-SHELL-001): irisan vertikal G5.
 * Ambang: navigasi keyboard-only penuh (Setup → Profiling → Bivariat),
 * 2 viewport (900/1440), 1 edge state (fingerprint usang → `Stale`),
 * data representatif seeded (D-S7). Bukti tumpang-tindih B1/B3/B5/B7
 * dalam satu jalur kerja nyata.
 */
import { expect, test } from "@playwright/test";
import { mockBridge } from "./helpers";

async function tabToFocused(page: import("@playwright/test").Page, pred: string) {
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press("Tab");
    const txt = await page.evaluate(() => {
      const el = document.activeElement;
      return el ? (el.textContent ?? "") + "|" + (el.getAttribute("aria-label") ?? "") : "";
    });
    if (txt.includes(pred)) return;
  }
  throw new Error(`fokus tidak mencapai: ${pred}`);
}

for (const vp of [
  { w: 900, h: 900 },
  { w: 1440, h: 900 },
]) {
  test(`B12: irisan vertikal keyboard-only @ ${vp.w}px`, async ({ page }) => {
    await page.setViewportSize({ width: vp.w, height: vp.h });
    await mockBridge(page, { seeded: true });
    await page.goto("/");
    await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();

    // Setup keyboard-only: isi nama, Buat, isi dataset, Import.
    await tabToFocused(page, "Nama project");
    await page.keyboard.type("Proyek Vertikal");
    await tabToFocused(page, "Buat");
    await page.keyboard.press("Enter");
    await page.waitForFunction(
      () => document.body.textContent?.includes("Project dibuat") ?? false,
    );
    await tabToFocused(page, "Nama dataset");
    await page.keyboard.type("seed_sales.csv");
    await tabToFocused(page, "Import");
    await page.keyboard.press("Enter");
    await page.waitForFunction(
      () => document.body.textContent?.includes("Dataset diimport") ?? false,
    );

    // Profiling: nav via link (Tab ke rail) + run via keyboard.
    await page.getByRole("link", { name: "Profil", exact: true }).click();
    await page.getByRole("button", { name: "Jalankan Profiling" }).focus();
    await page.keyboard.press("Enter");
    await page.waitForFunction(
      () => document.body.textContent?.includes("Profiling selesai") ?? false,
    );

    // Bivariat: pilih kolom + run (edge prasyarat: tombol disabled sampai
    // pasangan valid dipilih).
    await page.getByRole("link", { name: "Hubungan", exact: true }).click();
    await page.locator("#bivar-a").focus();
    await page.keyboard.press("s");
    await page.locator("#bivar-b").focus();
    await page.keyboard.press("q");
    const run = page.getByRole("button", { name: "Jalankan Analisis Bivariat" });
    await expect(run).toBeEnabled();
    await run.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#main-content")).toContainText(/0\.87|pearson/i);
  });
}

test("B12 edge state: fingerprint usang menampilkan banner Stale", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockBridge(page, { seeded: true, stale: true });
  await page.goto("/");
  await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
  await page.getByLabel("Nama project").fill("Proyek Edge");
  await page.getByRole("button", { name: "Buat", exact: true }).click();
  await page.waitForFunction(
    () => document.body.textContent?.includes("Project dibuat") ?? false,
  );
  await page.getByLabel("Nama dataset").fill("seed_sales.csv");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await page.waitForFunction(
    () => document.body.textContent?.includes("Dataset diimport") ?? false,
  );
  await page.getByRole("link", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Jalankan Profiling" }).click();
  await page.waitForFunction(
    () => document.body.textContent?.includes("Profiling selesai") ?? false,
  );
  await page.getByRole("link", { name: "Pembersihan", exact: true }).click();
  await expect(page.locator("#main-content")).toContainText(/Jalankan Quality Check terlebih dahulu/);
  await page.getByRole("link", { name: "Kualitas", exact: true }).click();
  await page.getByRole("button", { name: "Jalankan Quality Check" }).click();
  await page.waitForFunction(
    () => document.body.textContent?.includes("Quality check selesai") ?? false,
  );
  await page.getByRole("link", { name: "Pembersihan", exact: true }).click();
  await expect(page.locator("#main-content")).toContainText(/usang/);
});
