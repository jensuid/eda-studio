/**
 * g6-b5.spec.ts — G6-B5: Uji aksesibilitas 900px (QA-SHELL-001:89).
 *
 * Baris B5: "Uji aksesibilitas 900px: rail berlabel, drawer, focus return,
 * `Esc`, skip link; axe 0 critical 8 route" — kontrak pengunci `D-S3`/`D-S6`
 * (ratified PO 2026-11-08).
 *
 * - `D-S3` (DS-SHELL-001 §6, :199-207): 900px adalah minimum kontraktual —
 *   "rail berlabel ~176px"; target ≥36px; larangan "display:none pada region
 *   berstatus/aksi; rail ikon buta; scroll horizontal". §6 juga: "R5/R7 ke
 *   drawer" di 900px.
 * - `D-S6` (`Esc`/Cmd+K, RATIF-SHELL-004) + DS-SHELL-001 §10 Bukti G5/G6
 *   (:266): "Keyboard: jalur Tab lengkap R1→R7, focus return drawer, `Esc`,
 *   skip link, `:focus-visible` pada setiap state" + "Axe: 0 critical pada
 *   8 route…" — dan DS-SHELL-001:216: fokus "kembali ke origin setelah
 *   drawer/dialog tutup" (focus return berlaku untuk dialog juga).
 * - Traceability DS-SHELL-001:292: "D-S3 → §6 responsif 900px → uji
 *   aksesibilitas 900px".
 *
 * Setiap baris matriks = satu klausa:
 *   R1  Rail berlabel @900px (D-S3 §6 :203 + DS-SHELL-001:176 "label utuh di
 *       900px") — nav "Navigasi utama" tampil; tiap 8 link route visible
 *       dengan teks label utuh (bukan ikon-only, bukan display:none);
 *       lebar rail ~176px (dihitung dari getBoundingClientRect nav);
 *       tidak ada scroll horizontal (scrollWidth ≤ innerWidth).
 *   R2  Drawer Job Center @900px (DS-SHELL-001:183 "aria-expanded, accessible
 *       name, Esc + focus return" + §6 "R5/R7 ke drawer") — toggle
 *       terjangkau keyboard (Enter), aria-expanded "true", landmark
 *       complementary "Panel samping" visible berisi konten R5/R7 saat
 *       terbuka; Esc menutup dan fokus kembali ke toggle (focus return).
 *   R3  Dialog konfirmasi cleaning @900px (DS-SHELL-001:216 focus return
 *       dialog; DS-SHELL-001:221 alertdialog modal + focus trap) — Esc
 *       menutup dialog DAN fokus kembali ke tombol pemicu "Terapkan
 *       cleaning" (origin). Sel ini menambah assert focus return pasca-
 *       dialog yang belum ada di a11y.spec.ts (yang hanya assert count 0
 *       @1440px).
 *   R4  Skip link (DS-SHELL-001:218 "skip link #main-content") — Tab pertama
 *       adalah `.skip-link` (href #main-content), Enter memindahkan fokus
 *       ke #main-content; diverifikasi @900px (minimum kontraktual).
 *   R5  Axe 0 critical pada 8 route @900px (D-S6/§10 :266) — wcag2aa,
 *       termasuk rute Readiness; tidak ada scroll horizontal per route.
 *
 * Celah yang ditutup kartu ini vs bukti yang sudah ada:
 * - a11y.spec.ts "B5 axe @900px" (8 route), "drawer Job Center @900px —
 *   toggle, Esc, focus return", "Esc menutup dialog cleaning (D-S6)" @1440px
 *   TANPA focus-return, "skip link" @viewport default,
 *   "tombol rail tetap punya accessible name" @900px (hanya route Dataset).
 *   Kartu ini: rail berlabel untuk 8 route dengan lebar terukur ~176px +
 *   bukan display:none (R1 — kolom belum ada), focus return pasca-dialog
 *   (R3 — DS-SHELL-001:216), Esc dialog @900px (R3 — B5 adalah kartu 900px),
 *   skip link @900px (R4). Overlap lain (R2, R5) disengaja sebagai bukti
 *   independen B5 dengan seeded fixtures penuh.
 *
 * Semua test memakai seeded fixtures (mockBridge) — dialog cleaning butuh
 * p=1 (profiling) + q=1 (quality) aktif agar tombol aksi tampil.
 */
import { expect, test } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { mockBridge, setupWalkthrough } from "./helpers";

const WIDTH_900 = 900;

const ROUTE_LABELS = [
  "Proyek",
  "Dataset",
  "Profil",
  "Kualitas",
  "Hubungan",
  "Pembersihan",
  "Kesiapan",
  "Laporan",
] as const;

async function gotoAndSetup(page: Page): Promise<void> {
  await mockBridge(page);
  await page.goto("/");
  await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
}

/** Tutup semua toast yang menumpuk; jumlah tombol tutup = jumlah toast. */
async function dismissAllToasts(page: Page): Promise<void> {
  const closes = page.getByRole("button", { name: "Tutup notifikasi" });
  // eslint-disable-next-line no-constant-condition
  while ((await closes.count()) > 0) {
    await closes.first().click();
  }
}

// ---------------------------------------------------------------- R1: rail
test("R1: rail berlabel @900px — 8 link rute visible teks utuh, lebar ~176px", async ({
  page,
}) => {
  await page.setViewportSize({ width: WIDTH_900, height: 900 });
  await gotoAndSetup(page);

  const nav = page.getByRole("navigation", { name: "Navigasi utama" });
  await expect(nav).toBeVisible();

  // Lebar rail terukur: ~176px berlabel (DS-SHELL-001 §6 :203). Band toleransi
  // [140, 220] membedakan rail berlabel dari rail ikon-buta (~48-64px).
  const navBox = await nav.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { width: r.width };
  });
  expect(navBox.width, `lebar rail ${navBox.width}px bukan ~176px`).toBeGreaterThan(140);
  expect(navBox.width, `lebar rail ${navBox.width}px bukan ~176px`).toBeLessThan(220);

  // Tiap link rute: visible dengan teks label utuh (bukan ikon-only, bukan
  // display:none) — DS-SHELL-001:176 "label utuh di 900px".
  for (const label of ROUTE_LABELS) {
    const link = nav.getByRole("link", { name: label, exact: true });
    await expect(link).toBeVisible();
    const box = await link.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { width: r.width, display: getComputedStyle(el).display };
    });
    expect(box.display).not.toBe("none");
    expect(box.width, `link "${label}" tidak punya label visible`).toBeGreaterThan(0);
    const text = (await link.textContent()) ?? "";
    expect(text).toContain(label);
  }

  // Larangan §6: tidak ada scroll horizontal di 900px.
  const noHScroll = await page.evaluate(
    () => document.documentElement.scrollWidth <= window.innerWidth,
  );
  expect(noHScroll).toBe(true);
});

// --------------------------------------------------------------- R2: drawer
test("R2: drawer Job Center @900px — toggle keyboard, complementary terlihat, Esc + focus return", async ({
  page,
}) => {
  await page.setViewportSize({ width: WIDTH_900, height: 900 });
  await gotoAndSetup(page);

  const toggle = page.getByRole("button", { name: "Job Center" }).first();
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-expanded", "false");

  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(toggle).toHaveAttribute("aria-expanded", "true");

  // §6 "R5/R7 ke drawer" di 900px: landmark complementary berlabel tampil
  // beserta kontennya saat drawer terbuka.
  const aside = page.locator("#job-center-aside");
  await expect(aside).toHaveAttribute("data-open", "true");
  const panel = page.getByRole("complementary", { name: "Panel samping" });
  await expect(panel).toBeVisible();
  await expect(panel).toContainText(/Job/i);

  await page.keyboard.press("Escape");
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await expect(toggle).toBeFocused();
});

// --------------------------------------------------------------- R3: dialog
test("R3: dialog cleaning @900px — Esc menutup + focus return ke pemicu", async ({
  page,
}) => {
  await page.setViewportSize({ width: WIDTH_900, height: 900 });
  await setupWalkthrough(page);
  await dismissAllToasts(page);

  await page.getByRole("link", { name: "Kualitas", exact: true }).click();
  await page.getByRole("button", { name: "Jalankan Quality Check" }).click();
  await page.waitForFunction(
    () => document.body.textContent?.includes("Quality check selesai") ?? false,
  );
  await dismissAllToasts(page);

  await page.getByRole("link", { name: "Pembersihan", exact: true }).click();
  await page.getByRole("button", { name: "Hitung dampak" }).click();
  const applyButton = page.getByRole("button", { name: "Terapkan cleaning" });
  await expect(applyButton).toBeVisible();
  await applyButton.focus();
  await applyButton.click();

  const dlg = page.locator('[role="alertdialog"]');
  await expect(dlg).toBeVisible();
  await dlg.locator("button").first().focus();

  await page.keyboard.press("Escape");
  await expect(dlg).toHaveCount(0);

  // DS-SHELL-001:216 — fokus kembali ke origin (tombol pemicu) setelah
  // dialog tutup.
  await expect(applyButton).toBeFocused();
});

// ------------------------------------------------------------ R4: skip link
test("R4: skip link @900px — Tab pertama menuju #main-content", async ({
  page,
}) => {
  await page.setViewportSize({ width: WIDTH_900, height: 900 });
  await gotoAndSetup(page);

  await page.keyboard.press("Tab");
  const skip = page.locator(".skip-link");
  await expect(skip).toBeFocused();
  await expect(skip).toHaveAttribute("href", "#main-content");
  await page.keyboard.press("Enter");
  await expect(page.locator("#main-content")).toBeFocused();
});

// ----------------------------------------------------------------- R5: axe
for (const label of ROUTE_LABELS) {
  test(`R5: axe 0 critical @900px — route ${label}`, async ({ page }) => {
    await page.setViewportSize({ width: WIDTH_900, height: 900 });
    await gotoAndSetup(page);
    if (label !== "Proyek") {
      await page.getByRole("link", { name: label, exact: true }).click();
      await expect(page.locator("#main-content")).toBeVisible();
    }

    const noHScroll = await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    );
    expect(noHScroll).toBe(true);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2aa"])
      .analyze();
    const critical = results.violations.filter((v) => v.impact === "critical");
    expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
  });
}
