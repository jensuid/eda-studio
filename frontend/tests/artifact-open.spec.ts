/**
 * artifact-open.spec.ts — FLOW-SHELL-001 §2.7 (PO ratified 2026-11-09).
 *
 * "Unduh/Buka" calls the backend command `artifact.open` via ipcClient
 * (identity: snapshot_id + fingerprint — no filesystem path crosses IPC);
 * the raw file_path is never shown; a mocked command error surfaces in the
 * feature channel (role=alert inside the section), never as the protocol
 * banner in App (D-F6).
 */
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mockBridge } from "./helpers";

async function setupWalkthrough(page: Page): Promise<void> {
  await mockBridge(page, { seeded: true });
  await page.goto("/");
  await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
  await page.getByLabel("Nama project").fill("Proyek Seed");
  await page.getByRole("button", { name: "Buat", exact: true }).click();
  await expect(page.getByText("Project dibuat")).toBeVisible();
  await page.getByLabel("Nama dataset").fill("seed_sales.csv");
  await page.getByRole("button", { name: "Import", exact: true }).click();
  await expect(page.getByText("Dataset diimport")).toBeVisible();
  await page.getByRole("link", { name: "Profil", exact: true }).click();
  await page.getByRole("button", { name: "Jalankan Profiling" }).click();
  await expect(page.getByText("Profiling selesai")).toBeVisible();
  await page.getByRole("link", { name: "Laporan", exact: true }).click();
}

test.describe("FLOW §2.7 — Unduh/Buka via artifact.open", () => {
  test("PDF: Unduh/Buka memanggil artifact.open dan path mentah tidak ditampilkan", async ({ page }) => {
    await setupWalkthrough(page);
    await page.getByRole("button", { name: "Buat PDF" }).click();
    await expect(page.getByText("PDF siap diunduh.")).toBeVisible({ timeout: 10000 });
    // Meaningful artifact name shown; raw seeded path (/tmp/report_seed.pdf) absent.
    await expect(page.getByText("eda-report-snap_see.pdf")).toBeVisible();
    await expect(page.locator("#main-content")).not.toContainText("/tmp/report_seed.pdf");
    await page.getByRole("button", { name: "Unduh/Buka" }).first().click();
    await expect(page.getByText("Artefak dibuka di aplikasi bawaan.")).toBeVisible();
  });

  test("HTML: Report siap tanpa path mentah, Unduh/Buka terbuka", async ({ page }) => {
    await setupWalkthrough(page);
    await page.getByRole("button", { name: "Buat Report HTML" }).click();
    await expect(page.getByText(/Report siap dibuka/)).toBeVisible({ timeout: 10000 });
    await expect(page.locator("#main-content")).not.toContainText("/tmp/report_seed.html");
    await page.getByRole("button", { name: "Unduh/Buka" }).first().click();
    await expect(page.getByText("Artefak dibuka di aplikasi bawaan.")).toBeVisible();
  });

  test("error artifact.open muncul sebagai error fitur, bukan banner protokol", async ({ page }) => {
    await mockBridge(page, { seeded: true, artifactOpenFail: true });
    await page.goto("/");
    await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
    await page.getByLabel("Nama project").fill("Proyek Seed");
    await page.getByRole("button", { name: "Buat", exact: true }).click();
    await expect(page.getByText("Project dibuat")).toBeVisible();
    await page.getByLabel("Nama dataset").fill("seed_sales.csv");
    await page.getByRole("button", { name: "Import", exact: true }).click();
    await expect(page.getByText("Dataset diimport")).toBeVisible();
    await page.getByRole("link", { name: "Profil", exact: true }).click();
    await page.getByRole("button", { name: "Jalankan Profiling" }).click();
    await expect(page.getByText("Profiling selesai")).toBeVisible();
    await page.getByRole("link", { name: "Laporan", exact: true }).click();
    await page.getByRole("button", { name: "Buat PDF" }).click();
    await expect(page.getByText("PDF siap diunduh.")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Unduh/Buka" }).first().click();
    await expect(page.getByText(/Artefak gagal dibuka/)).toBeVisible();
    // D-F6: no protocol banner for a feature command error.
    await expect(page.locator(".protocol-banner")).toHaveCount(0);
  });
});
