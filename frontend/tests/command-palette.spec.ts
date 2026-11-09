/**
 * command-palette.spec.ts — Phase 2 (FLOW-SHELL-001 §2.8, D-S6): palet
 * perintah global Cmd+K / Ctrl+K.
 * - dibuka via chord (Meta+K dan Control+K) dan via tombol app-bar berhint ⌘K;
 * - membuka palet tidak menjalankan perintah apa pun;
 * - filter + ↑/↓ + Enter menavigasi; Esc menutup + fokus kembali ke pemicu;
 * - perintah tanpa dataset tampil disabled beralasan (fail-closed);
 * - chord dilewati saat fokus di field editable (guard pengetikan);
 * - axe 0 critical saat palet terbuka.
 */
import { expect, test } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { mockBridge, setupWalkthrough } from "./helpers";

const palette = (page: Page) =>
  page.getByRole("dialog", { name: "Palet perintah" });
const trigger = (page: Page) =>
  page.getByRole("button", { name: "Buka palet perintah (Control+K)" });
const search = (page: Page) =>
  palette(page).getByRole("combobox", { name: "Cari perintah" });
const option = (page: Page, id: string) =>
  palette(page).locator(`[data-command-id="${id}"]`);

test("hint ⌘K terlihat di app-bar dengan aria-keyshortcuts", async ({ page }) => {
  await mockBridge(page);
  await page.goto("/");
  await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
  await expect(trigger(page)).toBeVisible();
  await expect(trigger(page)).toContainText("⌘K");
  await expect(trigger(page)).toHaveAttribute(
    "aria-keyshortcuts",
    "Meta+K Control+K",
  );
});

test("Control+K membuka palet tanpa menjalankan perintah", async ({ page }) => {
  await mockBridge(page);
  await page.goto("/");
  await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
  await page.keyboard.press("Control+k");
  await expect(palette(page)).toBeVisible();
  await expect(search(page)).toBeFocused();
  // Tidak ada perintah terpicu saat sekadar dibuka: hash tetap kosong/setup
  // (router default), tidak ada error, tidak ada toast sukses.
  await expect.poll(() => page.url()).toMatch(/\/(#\/setup)?$/);
  await expect(palette(page).getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".toast-success")).toHaveCount(0);
});

test("Meta+K membuka palet; filter + ↑/↓ + Enter navigasi", async ({ page }) => {
  await mockBridge(page);
  await page.goto("/");
  await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
  await page.keyboard.press("Meta+k");
  await expect(palette(page)).toBeVisible();
  // Roving ↑/↓ melompati opsi disabled: tanpa dataset, satu-satunya opsi
  // enabled untuk "quality" adalah nav-quality (run-quality disabled).
  await search(page).fill("quality");
  await expect(option(page, "nav-quality")).toBeVisible();
  await expect(option(page, "nav-profiling")).toHaveCount(0);
  await expect(search(page)).toHaveAttribute(
    "aria-activedescendant",
    "palette-opt-nav-quality",
  );
  await page.keyboard.press("ArrowDown");
  // Wrap: hanya satu enabled → aktif tetap.
  await expect(search(page)).toHaveAttribute(
    "aria-activedescendant",
    "palette-opt-nav-quality",
  );
  // Pindah ke opsi kedua via filter lain: "buka" (semua nav enabled).
  await search(page).fill("buka");
  await expect(search(page)).toHaveAttribute(
    "aria-activedescendant",
    "palette-opt-nav-setup",
  );
  await page.keyboard.press("ArrowDown");
  await expect(search(page)).toHaveAttribute(
    "aria-activedescendant",
    "palette-opt-nav-explorer",
  );
  await page.keyboard.press("ArrowUp");
  await expect(search(page)).toHaveAttribute(
    "aria-activedescendant",
    "palette-opt-nav-setup",
  );
  await search(page).fill("quality");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/quality$/);
  await expect(palette(page)).toHaveCount(0);
  // Navigasi via perintah: fokus diserahkan ke main (R3/R4).
  await expect(page.locator("#main-content")).toBeFocused();
});

test("Esc menutup palet dan mengembalikan fokus ke pemicu", async ({ page }) => {
  await mockBridge(page);
  await page.goto("/");
  await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
  await page.keyboard.press("Control+k");
  await expect(palette(page)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(palette(page)).toHaveCount(0);
  await expect(trigger(page)).toBeFocused();
});

test("tombol app-bar membuka palet; Tab terjebak di dialog", async ({ page }) => {
  await mockBridge(page);
  await page.goto("/");
  await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
  await trigger(page).click();
  await expect(palette(page)).toBeVisible();
  await expect(search(page)).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(search(page)).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(search(page)).toBeFocused();
});

test("perintah tanpa dataset disabled beralasan dan tidak dapat dijalankan", async ({
  page,
}) => {
  await mockBridge(page);
  await page.goto("/");
  await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
  await page.keyboard.press("Control+k");
  await expect(palette(page)).toBeVisible();
  const runProfile = option(page, "run-profile");
  await expect(runProfile).toContainText("Butuh dataset aktif");
  await expect(runProfile).toHaveAttribute("aria-disabled", "true");
  // Enter pada filter yang hanya berisi perintah disabled: tidak navigasi,
  // tidak error, palet tetap terbuka.
  await search(page).fill("jalankan profiling");
  await expect(option(page, "run-profile")).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(palette(page)).toBeVisible();
  await expect.poll(() => page.url()).toMatch(/\/(#\/setup)?$/);
  await expect(palette(page).getByRole("alert")).toHaveCount(0);
});

test("guard pengetikan: Ctrl+K di field editable tidak membuka palet", async ({
  page,
}) => {
  await mockBridge(page);
  await page.goto("/");
  await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
  const nameInput = page.getByLabel("Nama project").first();
  await expect(nameInput).toBeVisible();
  await nameInput.click();
  await page.keyboard.press("Control+k");
  await expect(palette(page)).toHaveCount(0);
  // Field tetap fokus — chord tidak dibajak.
  await expect(nameInput).toBeFocused();
});

test("palette terdaftar: semua route + 3 perintah run tampil", async ({ page }) => {
  await mockBridge(page);
  await page.goto("/");
  await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
  await page.keyboard.press("Control+k");
  await expect(palette(page)).toBeVisible();
  for (const id of [
    "nav-setup",
    "nav-explorer",
    "nav-profiling",
    "nav-quality",
    "nav-readiness",
    "nav-bivariate",
    "nav-cleaning",
    "nav-report",
    "run-profile",
    "run-quality",
    "run-readiness",
  ]) {
    await expect(option(page, id)).toHaveCount(1);
  }
});

test("run-profile via palette: dataset aktif, sukses → navigasi profiling", async ({
  page,
}) => {
  await setupWalkthrough(page);
  await page.keyboard.press("Control+k");
  await expect(palette(page)).toBeVisible();
  await search(page).fill("jalankan profiling");
  const runProfile = option(page, "run-profile");
  await expect(runProfile).toBeVisible();
  await expect(runProfile).not.toHaveAttribute("aria-disabled", "true");
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#\/profiling$/);
  await expect(palette(page)).toHaveCount(0);
  await expect(page.locator(".toast-success", { hasText: "Profiling selesai" })).toBeVisible();
});

test("axe: palet terbuka — 0 critical", async ({ page }) => {
  await mockBridge(page);
  await page.goto("/");
  await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
  await page.keyboard.press("Control+k");
  await expect(palette(page)).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(["wcag2aa"]).analyze();
  const critical = results.violations.filter((v) => v.impact === "critical");
  expect(critical, JSON.stringify(critical, null, 2)).toEqual([]);
});
