/**
 * d-f1.spec.ts — D-F1: Stepper 5 tahap bersinyal sah
 * (FLOW-SHELL-001 §2.2 baris [RATIFIED] D-F1; SCREEN-SHELL-001 §3).
 *
 * Bukti penerimaan:
 * - Stepper = 5 tahap (1 Proyek, 2 Dataset, 3 Profil, 4 Kualitas, 9 Kesiapan);
 *   status NOLLOH dari sinyal sah (tanpa dataset → tahap 2 "Belum";
 *   setelah import → tahap 2 "Selesai").
 * - Fingerprint mismatch → stage terkait "Perlu diperbarui" (stale), bukan
 *   "Selesai" (FLOW §2.4 cabang `stale`).
 * - 6/7/10 "Belum tersedia" dan tidak bisa diklik; stage 8 tidak muncul.
 * - Terlihat di 900px dan 1440px (tidak `display:none`), axe 0 critical.
 * - Keyboard navigable; `aria-current` pada stage route aktif; klik stepper
 *   hanya navigasi (tidak memicu command domain).
 */
import { expect, test } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { mockBridge, setupWalkthrough } from "./helpers";

function stepper(page: Page) {
  return page.getByRole("navigation", { name: "Alur analisis" });
}

const stageLink = (page: Page, n: number, name: string) =>
  stepper(page).getByRole("link", { name: new RegExp(`${n} · ${name}`) });

test.describe("D-F1 — 5 tahap bersinyal sah", () => {
  test("boot: 5 tahap 'Belum', aria-current di Proyek (Setup)", async ({
    page,
  }) => {
    await mockBridge(page, { seeded: true });
    await page.goto("/");
    const s = stepper(page);
    await expect(s).toBeVisible();
    for (const [n, name] of [
      [1, "Proyek"],
      [2, "Dataset"],
      [3, "Profil"],
      [4, "Kualitas"],
      [9, "Kesiapan"],
    ] as const) {
      const link = stageLink(page, n, name);
      await expect(link).toBeVisible();
      await expect(link).toContainText("Belum");
      await expect(link).not.toContainText("In Progress");
      await expect(link).not.toContainText("Selesai");
    }
    const current = s.locator('[aria-current="step"]');
    await expect(current).toHaveCount(1);
    await expect(current).toContainText("1 · Proyek");
  });

  test("'Belum tersedia' (6/7/10) non-klik; stage 8 tidak ada", async ({
    page,
  }) => {
    await mockBridge(page, { seeded: true });
    await page.goto("/");
    const s = stepper(page);
    await expect(s.locator("ol > li")).toHaveCount(8);
    const disabled = s.locator("[aria-disabled='true']");
    await expect(disabled).toHaveCount(3);
    for (const [n, name] of [
      [6, "Visualisasi"],
      [7, "Hubungan"],
      [10, "Laporan"],
    ] as const) {
      const item = s
        .locator("[aria-disabled='true']", { hasText: `${n} · ${name}` })
        .first();
      await expect(item).toContainText("Belum tersedia");
      await expect(item).toHaveAttribute("aria-disabled", "true");
      await expect(item).not.toHaveAttribute("href", /.*/);
    }
    await expect(s).not.toContainText("8 ·");
    // Klik pada "Belum tersedia" tidak berpindah route.
    const before = page.url();
    await disabled.first().click({ force: true });
    await expect(page).toHaveURL(before);
  });

  test("sinyal-driven: tanpa dataset tahap 2 'Belum' → setelah import 'Selesai'; profiling → tahap 3 'Selesai'", async ({
    page,
  }) => {
    await mockBridge(page, { seeded: true });
    await page.goto("/");
    await expect(stageLink(page, 2, "Dataset")).toContainText("Belum");

    await page.getByLabel("Nama project").fill("Proyek Seed");
    await page.getByRole("button", { name: "Buat", exact: true }).click();
    await page.waitForFunction(
      () => document.body.textContent?.includes("Project dibuat") ?? false,
    );
    await expect(stageLink(page, 1, "Proyek")).toContainText("Selesai");
    await expect(stageLink(page, 2, "Dataset")).toContainText("Belum");

    await page.getByLabel("Nama dataset").fill("seed_sales.csv");
    await page.getByRole("button", { name: "Import", exact: true }).click();
    await page.waitForFunction(
      () => document.body.textContent?.includes("Dataset diimport") ?? false,
    );
    await expect(stageLink(page, 2, "Dataset")).toContainText("Selesai");
    await expect(stageLink(page, 3, "Profil")).toContainText("Belum");

    await page.getByRole("link", { name: "Profiling" }).click();
    await page.getByRole("button", { name: "Jalankan Profiling" }).click();
    await page.waitForFunction(
      () => document.body.textContent?.includes("Profiling selesai") ?? false,
    );
    await expect(stageLink(page, 3, "Profil")).toContainText("Selesai");

    // Quality + Readiness (fresh) → tahap 4 & 9 'Selesai'.
    await page.getByRole("link", { name: "Quality" }).click();
    await page.getByRole("button", { name: "Jalankan Quality Check" }).click();
    await expect(stageLink(page, 4, "Kualitas")).toContainText("Selesai");

    await page.getByRole("link", { name: "Readiness" }).click();
    await page
      .getByRole("button", { name: "Jalankan Readiness Assessment" })
      .click();
    await expect(stageLink(page, 9, "Kesiapan")).toContainText("Selesai");

    // Semua tahap 5 sah-statis; tidak ada persen/progress di stepper.
    await expect(stepper(page)).not.toContainText("In Progress");
    await expect(stepper(page)).not.toContainText(/%|persen/);
  });

  test("fingerprint mismatch → stage terkait 'Perlu diperbarui' (stale), bukan 'Selesai'", async ({
    page,
  }) => {
    await setupWalkthrough(page, { stale: true });

    const stage3 = stageLink(page, 3, "Profil");
    await expect(stage3).toContainText("Perlu diperbarui");
    await expect(stage3).not.toContainText("Selesai");
    await expect(stage3).toHaveAttribute(
      "aria-label",
      /berubah sejak hasil ini dibuat/,
    );

    await page.getByRole("link", { name: "Quality" }).click();
    await page.getByRole("button", { name: "Jalankan Quality Check" }).click();
    const stage4 = stageLink(page, 4, "Kualitas");
    await expect(stage4).toContainText("Perlu diperbarui");
    await expect(stage4).not.toContainText("Selesai");

    await page.getByRole("link", { name: "Readiness" }).click();
    await page
      .getByRole("button", { name: "Jalankan Readiness Assessment" })
      .click();
    const stage9 = stageLink(page, 9, "Kesiapan");
    await expect(stage9).toContainText("Perlu diperbarui");
    await expect(stage9).not.toContainText("Selesai");

    // Tahap tanpa artefak tetap 'Belum'; tahap 1/2 tetap 'Selesai'.
    await expect(stageLink(page, 1, "Proyek")).toContainText("Selesai");
    await expect(stageLink(page, 2, "Dataset")).toContainText("Selesai");
  });

  test("klik stepper hanya navigasi — tidak memicu run/mutasi", async ({
    page,
  }) => {
    await mockBridge(page, { seeded: true });
    await page.goto("/");
    const profil = stageLink(page, 3, "Profil");
    await profil.click();
    await expect(page).toHaveURL(/#\/profiling/);
    // EmptyState halaman profil, bukan hasil run.
    await expect(page.getByText("Profiling selesai")).toHaveCount(0);
    await expect(page.locator("main")).toContainText(/Belum ada/);
  });

  test("keyboard: tab mencapai link stepper; Enter navigasi + aria-current pindah", async ({
    page,
  }) => {
    await mockBridge(page, { seeded: true });
    await page.goto("/");
    const target = stageLink(page, 2, "Dataset");
    let found = false;
    for (let i = 0; i < 40 && !found; i++) {
      const focused = await page.evaluate(
        () => document.activeElement?.tagName === "A",
      );
      if (focused) {
        const text = await page.evaluate(
          () => document.activeElement?.textContent ?? "",
        );
        if (text.includes("2 · Dataset")) found = true;
      }
      if (!found) await page.keyboard.press("Tab");
    }
    expect(found, "link stepper '2 · Dataset' tidak dapat dicapai via Tab").toBe(true);
    await expect(target).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#\/explorer/);
    await expect(page.locator("#main-content")).toBeFocused();
    const current = stepper(page).locator('[aria-current="step"]');
    await expect(current).toHaveCount(1);
    await expect(current).toContainText("2 · Dataset");
  });

  for (const width of [900, 1440]) {
    test(`terlihat di viewport ${width}px (tanpa display:none)`, async ({
      page,
    }) => {
      await setupWalkthrough(page);
      await page.setViewportSize({ width, height: 900 });
      const s = stepper(page);
      await expect(s).toBeVisible();
      const widthOfPage = await page.evaluate(
        () => document.documentElement.scrollWidth,
      );
      expect(widthOfPage).toBeLessThanOrEqual(width);
      const bb = await s.boundingBox();
      expect(bb).not.toBeNull();
      expect(bb!.width).toBeLessThanOrEqual(width);
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2aa"])
        .analyze();
      const critical = results.violations.filter(
        (v) => v.impact === "critical",
      );
      expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
    });
  }
});

test.describe("D-F1 — tidak ada regresi rail 900px", () => {
  test("link rail 'Dataset' (exact) tetap satu-satunya dengan nama persis itu", async ({
    page,
  }) => {
    await mockBridge(page, { seeded: true });
    await page.goto("/");
    const exact = page.getByRole("link", { name: "Dataset", exact: true });
    await expect(exact).toHaveCount(1);
  });
});
