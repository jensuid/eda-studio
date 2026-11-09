/**
 * d-f7.spec.ts — D-F7 (FLOW-SHELL-001 §2.4 cabang `stale` + `context-switch`):
 * Quality & Readiness kini memeriksa fingerprint artefak vs snapshot aktif.
 *
 * Skenario: import → profiling → quality/readiness run (record usang) →
 * banner stale berisi 4 elemen (alasan, dependency berubah, dampak,
 * rekomendasi) + CTA persetujuan eksplisit → artefak lama tetap terlihat →
 * navigasi lintas-route TIDAK me-refresh otomatis → klik CTA → refresh
 * berjalan (toast sukses muncul).
 */
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mockBridge } from "./helpers";

async function setupWalkthrough(page: Page): Promise<void> {
  await mockBridge(page, { seeded: true, stale: true });
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
}

/** Tutup semua toast yang menumpuk agar assertion berikutnya bersih. */
async function dismissAllToasts(page: Page): Promise<void> {
  const closes = page.getByRole("button", { name: "Tutup notifikasi" });
  // eslint-disable-next-line no-constant-condition
  while ((await closes.count()) > 0) {
    await closes.first().click();
  }
}

async function expectStaleBanner(page: Page, texts: string[]): Promise<void> {
  const banner = page.locator(".cleaning-stale");
  await expect(banner).toBeVisible();
  for (const t of texts) {
    await expect(banner).toContainText(t);
  }
}

test("D-F7 Quality: stale → banner 4 elemen → artefak lama terlihat → CTA refresh hanya setelah klik", async ({ page }) => {
  await setupWalkthrough(page);
  await page.getByRole("link", { name: "Kualitas", exact: true }).click();
  await page.getByRole("button", { name: "Jalankan Quality Check" }).click();
  await expect(page.getByText("Quality check selesai.")).toBeVisible();
  await dismissAllToasts(page);

  await expectStaleBanner(page, [
    "Hasil quality check mungkin usang",
    "Dataset aktif telah berubah sejak quality check ini dijalankan.",
    "Dependency yang berubah: dataset seed_sales.csv aktif",
    "Dampak: temuan di bawah ini mungkin tidak mewakili data saat ini",
    "Hasil lama tetap ditampilkan di bawah dan dapat dilihat",
    "Rekomendasi: jalankan ulang quality check untuk snapshot aktif",
  ]);
  // Artefak lama tetap dapat diakses (ditampilkan, bukan disembunyikan).
  await expect(page.locator("#main-content")).toContainText("Hasil dari snapshot sebelumnya.");

  // Navigasi lintas-route tidak me-refresh otomatis: banner muncul lagi
  // tanpa toast sukses baru.
  await page.getByRole("link", { name: "Profil", exact: true }).click();
  await page.getByRole("link", { name: "Kualitas", exact: true }).click();
  await expectStaleBanner(page, ["Hasil quality check mungkin usang"]);
  await expect(page.getByText("Quality check selesai.")).toHaveCount(0);

  // Klik CTA persetujuan → refresh berjalan.
  await page.getByRole("button", { name: "Saya setuju — perbarui quality check" }).click();
  await expect(page.getByText("Quality check selesai.")).toBeVisible();
});

test("D-F7 Readiness: stale → banner 4 elemen → artefak lama terlihat → CTA refresh hanya setelah klik", async ({ page }) => {
  await setupWalkthrough(page);
  await page.getByRole("link", { name: "Kesiapan", exact: true }).click();
  await page.getByRole("button", { name: "Jalankan Readiness Assessment" }).click();
  await expect(page.getByText("Readiness assessment selesai.")).toBeVisible();
  await dismissAllToasts(page);

  await expectStaleBanner(page, [
    "Hasil readiness assessment mungkin usang",
    "Dataset aktif telah berubah sejak readiness assessment ini dijalankan.",
    "Dependency yang berubah: dataset seed_sales.csv aktif",
    "Dampak: ringkasan kesiapan di bawah ini mungkin tidak mewakili data saat ini",
    "Hasil lama tetap ditampilkan di bawah dan dapat dilihat",
    "Rekomendasi: jalankan ulang readiness assessment untuk snapshot aktif",
  ]);
  await expect(page.locator("#main-content")).toContainText("Hasil dari snapshot sebelumnya.");

  await page.getByRole("link", { name: "Profil", exact: true }).click();
  await page.getByRole("link", { name: "Kesiapan", exact: true }).click();
  await expectStaleBanner(page, ["Hasil readiness assessment mungkin usang"]);
  await expect(page.getByText("Readiness assessment selesai.")).toHaveCount(0);

  await page.getByRole("button", { name: "Saya setuju — perbarui readiness assessment" }).click();
  await expect(page.getByText("Readiness assessment selesai.")).toBeVisible();
});
