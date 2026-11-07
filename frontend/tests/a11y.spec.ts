/**
 * a11y.spec.ts — P2-5: axe (Playwright) per route, target 0 critical.
 * Bridge pywebview dimock per test (addInitScript): protokol OK,
 * command/query ok tanpa data (empty state deterministik), events kosong.
 */
import { expect, test } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { mockBridge } from "./helpers";

const ROUTE_LABELS = [
  "Setup",
  "Dataset",
  "Profiling",
  "Quality",
  "Bivariat",
  "Cleaning",
  "Report",
] as const;

async function gotoAndNavigate(page: Page, label: string): Promise<void> {
  await mockBridge(page);
  await page.goto("/");
  await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
  if (label !== "Setup") {
    await page.getByRole("button", { name: label }).click();
  }
  await expect(page.locator("#main-content")).toBeVisible();
}

for (const label of ROUTE_LABELS) {
  test(`axe: route ${label} — 0 critical`, async ({ page }) => {
    await gotoAndNavigate(page, label);
    const results = await new AxeBuilder({ page }).withTags(["wcag2aa"]).analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  });
}

test("skip link adalah Tab pertama dan menuju #main-content", async ({
  page,
}) => {
  await gotoAndNavigate(page, "Setup");
  await page.keyboard.press("Tab");
  const skip = page.locator(".skip-link");
  await expect(skip).toBeFocused();
  await expect(skip).toHaveAttribute("href", "#main-content");
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

test("landmark: banner, nav berlabel, main, complementary berlabel", async ({
  page,
}) => {
  await gotoAndNavigate(page, "Setup");
  await expect(page.locator("header.app-header")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Navigasi utama" }),
  ).toBeVisible();
  await expect(
    page.getByRole("main", { name: "Konten utama" }),
  ).toBeVisible();
  await expect(
    page.getByRole("complementary", { name: "Panel samping" }),
  ).toBeVisible();
});

test("heading: tepat satu h1 (shell)", async ({ page }) => {
  await gotoAndNavigate(page, "Setup");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("h1")).toHaveText("EDA Workbench");
});

test("fokus dipindah ke main setelah navigasi route", async ({ page }) => {
  await gotoAndNavigate(page, "Setup");
  await page.getByRole("button", { name: "Profiling" }).click();
  await expect(page.locator("#main-content")).toBeFocused();
});

test("fokus terlihat (focus-visible): outline tidak none", async ({
  page,
}) => {
  await gotoAndNavigate(page, "Setup");
  await page.keyboard.press("Tab");
  const outline = await page.locator(".skip-link").evaluate((el) => {
    const s = getComputedStyle(el);
    return { width: s.outlineWidth, style: s.outlineStyle };
  });
  expect(outline.style).not.toBe("none");
  expect(outline.width).not.toBe("0px");
});

test("viewport 900px: tombol rail tetap punya accessible name (0 critical)", async ({
  page,
}) => {
  await page.setViewportSize({ width: 900, height: 900 });
  await gotoAndNavigate(page, "Dataset");
  const results = await new AxeBuilder({ page }).withTags(["wcag2aa"]).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  await expect(
    page.getByRole("button", { name: "Dataset" }),
  ).toBeVisible();
});
