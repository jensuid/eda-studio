/**
 * error-branch.spec.ts — UIUX-06 (D-S2 tunggal / D-F7 copy tunggal + error branch).
 *
 * Bukti acceptance kartu UIUX-06:
 * 1. Body sukses recovery TIDAK memuat ID dokumen internal (project_id) —
 *    sebelum UIUX-06, banner pulih menampilkan "Project proj_seed dipulihkan…".
 * 2. Headline error fitur di-branch dari error.code (NOT_FOUND → "tidak
 *    ditemukan"); pesan mentah backend hanya di dalam `<details>`
 *    diagnostik, tidak pernah di `<p role="alert">`.
 *
 * Test 3 di d-f6.spec.ts dan error fitur di artifact-open.spec.ts tetap
 * menjadi penjaga existing; spec ini membuktikan delta UIUX-06.
 */
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mockBridge } from "./helpers";

test.describe("UIUX-06 — copy tunggal + error branch (D-F7)", () => {
  test("body sukses recovery bebas ID dokumen internal (project_id)", async ({ page }) => {
    await mockBridge(page, {
      seeded: true,
      recoveryAvailable: true,
      recoveryRestoreOk: true,
    });
    await page.goto("/");
    await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
    const dialog = page.getByRole("alertdialog", { name: "Pemulihan crash" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Pulihkan autosave" }).click();

    const done = page.locator('.recovery-banner[role="status"]');
    await expect(done).toContainText("Autosave dipulihkan ke /tmp/restored_seed.");
    // project_id internal ("proj_seed") tidak lagi dirender di body sukses.
    await expect(done).not.toContainText("proj_seed");
  });

  test("headline error fitur di-branch dari code; pesan mentah hanya di diagnostik", async ({ page }) => {
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

    // Headline = cabang NOT_FOUND dari failByCode (copy fitur menang atas shell).
    const alert = page.locator("p[role='alert']", { hasText: "Artefak gagal dibuka" });
    await expect(alert).toBeVisible();
    await expect(alert).toContainText("tidak ditemukan");
    // Pesan mentah backend TIDAK boleh di headline.
    await expect(alert).not.toContainText("artefak tidak ditemukan di backend");
    // Pesan mentah hanya di detail diagnostik yang dapat disalin.
    const diag = page.locator(".diagnostic-detail pre");
    await expect(diag).toContainText("artefak tidak ditemukan di backend");
    // Bukan banner protokol (D-F6).
    await expect(page.locator(".protocol-banner")).toHaveCount(0);
  });
});
