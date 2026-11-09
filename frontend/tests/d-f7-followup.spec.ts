/**
 * d-f7-followup.spec.ts — D-F7 follow-up (FLOW-SHELL-001 §2.4 cabang `stale`):
 * Profiling & Histogram kini memeriksa fingerprint artefak vs fingerprint
 * dataset aktif, sama seperti Quality & Readiness.
 *
 * Skenario: import → profiling (record usang) → banner stale berisi 4 elemen
 * (alasan, dependency berubah, dampak, rekomendasi) + CTA persetujuan
 * eksplisit → artefak lama tetap terlihat → navigasi lintas-route TIDAK
 * me-refresh otomatis → klik CTA → refresh berjalan (toast sukses muncul).
 *
 * Keputusan Histogram: histogram punya mutasi sendiri yang nyata
 * (`runHistogram` di DatasetExplorer, `dataset.histogram.run`) — bukan
 * bagian dari profiling. Jadi CTA banner Histogram memanggil mutasi
 * histogram yang sudah ada, bukan mutasi fiktif.
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
  await page.getByRole("link", { name: "Profiling" }).click();
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

test("Profiling: stale → banner 4 elemen → artefak lama terlihat → CTA refresh hanya setelah klik", async ({ page }) => {
  await setupWalkthrough(page);
  await dismissAllToasts(page);

  await expectStaleBanner(page, [
    "Hasil profiling mungkin usang",
    "Dataset aktif telah berubah sejak profiling ini dijalankan.",
    "Dependency yang berubah: dataset seed_sales.csv aktif",
    "Dampak: tabel profil di bawah ini mungkin tidak mewakili data saat ini",
    "Hasil lama tetap ditampilkan di bawah dan dapat dilihat",
    "Rekomendasi: jalankan ulang profiling untuk snapshot aktif",
  ]);
  // Artefak lama tetap dapat diakses (tabel profil tetap ditampilkan).
  await expect(page.locator("#main-content")).toContainText("sales");

  // Navigasi lintas-route tidak me-refresh otomatis: banner muncul lagi
  // tanpa toast sukses baru.
  await page.getByRole("link", { name: "Quality" }).click();
  await page.getByRole("link", { name: "Profiling" }).click();
  await expectStaleBanner(page, ["Hasil profiling mungkin usang"]);
  await expect(page.getByText("Profiling selesai")).toHaveCount(0);

  // Klik CTA persetujuan → refresh berjalan.
  await page.getByRole("button", { name: "Saya setuju — perbarui profiling" }).click();
  await expect(page.getByText("Profiling selesai")).toBeVisible();
});

test("Histogram: stale → banner 4 elemen → artefak lama terlihat → CTA refresh hanya setelah klik", async ({ page }) => {
  await setupWalkthrough(page);
  await dismissAllToasts(page);

  // Histogram berjalan dari route Dataset (DatasetExplorer).
  await page.getByRole("link", { name: "Dataset", exact: true }).click();
  await page.getByLabel("Nama kolom numerik").fill("sales");
  await page.getByRole("button", { name: "Jalankan Histogram" }).click();
  await expect(page.getByText("Histogram selesai.")).toBeVisible();
  await dismissAllToasts(page);

  await expectStaleBanner(page, [
    "Histogram mungkin usang",
    "Dataset aktif telah berubah sejak histogram ini dijalankan.",
    "Dependency yang berubah: dataset seed_sales.csv aktif",
    "Dampak: distribusi di bawah ini mungkin tidak mewakili data saat ini",
    "Hasil lama tetap ditampilkan di bawah dan dapat dilihat",
    "Rekomendasi: jalankan ulang histogram untuk snapshot aktif",
  ]);
  // Artefak lama tetap dapat diakses (ringkasan + caption fingerprint lama).
  await expect(page.locator("#main-content")).toContainText("Distribusi sales");
  await expect(page.locator("#main-content")).toContainText("fp_old");

  // Beda dengan Profiling: record histogram disimpan sebagai state lokal
  // DatasetExplorer (ephemeral, tidak dipersist ke project context), jadi
  // setelah navigasi pergi-balik recordnya hilang — yang penting tidak ada
  // refresh otomatis (tidak ada toast sukses baru, input kosong).
  await page.getByRole("link", { name: "Profiling" }).click();
  await page.getByRole("link", { name: "Dataset", exact: true }).click();
  await expect(page.getByText("Histogram selesai.")).toHaveCount(0);
  await expect(page.locator(".cleaning-stale")).toHaveCount(0);
  await expect(page.getByLabel("Nama kolom numerik")).toHaveValue("");

  // Jalankan ulang secara eksplisit → banner stale muncul lagi.
  await page.getByLabel("Nama kolom numerik").fill("sales");
  await page.getByRole("button", { name: "Jalankan Histogram" }).click();
  await expect(page.getByText("Histogram selesai.")).toBeVisible();
  await dismissAllToasts(page);
  await expectStaleBanner(page, ["Histogram mungkin usang", "Rekomendasi: jalankan ulang histogram"]);

  // Klik CTA persetujuan → refresh (mutasi histogram yang sudah ada) berjalan.
  await page.getByRole("button", { name: "Saya setuju — perbarui histogram" }).click();
  await expect(page.getByText("Histogram selesai.")).toBeVisible();
});
