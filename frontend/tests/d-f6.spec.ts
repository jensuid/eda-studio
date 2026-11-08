/**
 * d-f6.spec.ts — D-F6 (FLOW-SHELL-001 §2.5): satu kanal error per concern.
 *
 * Assertion kunci: TIDAK ADA cross-contamination antar kanal —
 * kegagalan update tidak muncul sebagai banner protokol, kegagalan
 * recovery muncul di main (bukan app bar), load job gagal tidak
 * disamarkan sebagai "Belum ada job", dan crash render memakai copy
 * generik (bukan pesan mentah).
 */
import { expect, test } from "@playwright/test";
import { mockBridge } from "./helpers";

test("D-F6 protocol: revisi salah → banner persisten app bar saja", async ({ page }) => {
  await mockBridge(page, { protocolMismatch: true });
  await page.goto("/");
  const banner = page.locator(".protocol-banner").first();
  await expect(banner).toContainText("Versi protokol tidak cocok");
  await expect(banner).toContainText("backend revisi 2");
  // headline tidak memuat pesan mentah / code internal
  await expect(banner).not.toContainText("INTERNAL");
  // tidak ada banner recovery/update di main
  await expect(page.locator(".app-main").getByRole("alert")).toHaveCount(0);
  await expect(page.locator(".version-panel")).not.toContainText("Pemeriksaan update gagal");
});

test("D-F6 update: check gagal → hanya region versi, bukan banner protokol", async ({ page }) => {
  await mockBridge(page, { updateFail: true });
  await page.goto("/");
  await page.getByRole("button", { name: "Periksa update" }).click();
  const versionPanel = page.locator(".version-panel");
  await expect(versionPanel).toContainText("Pemeriksaan update tidak menemukan rilis terbaru.");
  // code-branching: headline generik per code NOT_FOUND, pesan mentah hanya di detail
  await expect(versionPanel.locator("p").first()).not.toContainText("feed rilis tidak ditemukan di backend");
  await expect(versionPanel.locator("pre")).toContainText("feed rilis tidak ditemukan di backend");
  // tidak ada cross-contamination ke banner protokol app bar
  await expect(page.locator(".protocol-banner")).toHaveCount(0);
  // info-level, dapat di-dismiss di region versi
  await expect(versionPanel.getByRole("button", { name: "Tutup" })).toBeVisible();
});

test("D-F6 recovery: restore gagal → banner di main dengan Tutup, bukan app bar", async ({ page }) => {
  await mockBridge(page, { recoveryAvailable: true, recoveryRestoreFail: true });
  await page.goto("/");
  await page.getByRole("button", { name: "Pulihkan autosave" }).click();
  const mainAlert = page.locator(".app-main").getByRole("alert");
  await expect(mainAlert).toContainText("Autosave pemulihan tidak ditemukan.");
  await expect(mainAlert.locator("h2")).not.toContainText("autosave hilang di backend");
  await expect(mainAlert.locator("pre")).toContainText("autosave hilang di backend");
  await expect(page.locator(".protocol-banner")).toHaveCount(0);
  await expect(mainAlert.getByRole("button", { name: "Tutup" })).toBeVisible();
  await mainAlert.getByRole("button", { name: "Tutup" }).click();
  await expect(mainAlert).toHaveCount(0);
});

test("D-F6 jobs: get_events gagal → load-failed, bukan 'Belum ada job'", async ({ page }) => {
  await mockBridge(page, { eventsFail: true });
  await page.goto("/");
  const jobCenter = page.locator("section[aria-label='Job Center']");
  await expect(jobCenter).toContainText("Daftar job tidak dapat dimuat.");
  await expect(jobCenter).not.toContainText("Belum ada job");
  await expect(jobCenter.getByRole("button", { name: "Coba lagi" })).toBeVisible();
});

test("D-F6 jobs: get_events sehat → empty state tetap 'Belum ada job'", async ({ page }) => {
  await mockBridge(page);
  await page.goto("/");
  const jobCenter = page.locator("section[aria-label='Job Center']");
  await expect(jobCenter).toContainText("Belum ada job. Jalankan analisis dari fitur mana pun.");
  await expect(jobCenter).not.toContainText("Daftar job tidak dapat dimuat");
});

test("D-F6 crash-render: copy generik, Coba lagi + Kembali ke Setup, retry tidak loop", async ({ page }) => {
  await mockBridge(page, { crashRecent: true });
  await page.goto("/");
  const boundary = page.locator(".error-boundary");
  await expect(boundary).toContainText("Terjadi kesalahan di");
  await expect(boundary).toContainText("Halaman ini tidak dapat ditampilkan.");
  // pesan mentah TypeError tidak boleh ada di headline/body, hanya di detail
  await expect(boundary.locator("h2, p").first()).not.toContainText("is not a function");
  await expect(boundary.locator("pre")).toContainText("is not a function");
  await expect(boundary.getByRole("button", { name: "Coba lagi" })).toBeVisible();
  // retry sekali pada crash deterministik → tombol retry hilang (tidak loop)
  await boundary.getByRole("button", { name: "Coba lagi" }).click();
  await expect(boundary.getByRole("button", { name: "Coba lagi" })).toHaveCount(0);
  await expect(boundary.getByRole("button", { name: "Kembali ke Setup" })).toBeVisible();
  await boundary.getByRole("button", { name: "Kembali ke Setup" }).click();
  await expect(page).toHaveURL(/#\/setup$/);
});
