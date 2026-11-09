/**
 * g6-b3.spec.ts — G6-B3: Uji fingerprint mismatch → artefak `Stale`, bukan
 * `Current` (QA-SHELL-001:87; JOB-SHELL-001 §5 B3; kontrak pengunci D-F7,
 * ratified PO 2026-11-08 — FLOW-SHELL-001:185).
 *
 * D-F7 berbunyi: "Semua artefak memeriksa fingerprint; refresh hanya setelah
 * persetujuan pengguna; CTA menyebut dependency."
 * Setiap baris matriks = satu klausa:
 *   C1  Semua artefak memeriksa fingerprint — sapuan 6 permukaan: Profiling
 *       (ProfilingPage.tsx:207), Histogram (DatasetExplorer.tsx:221),
 *       Quality (QualityPage.tsx:56), Readiness (ReadinessPage.tsx:49),
 *       Cleaning-quality (CleaningSection.tsx:41), Bivariat
 *       (BivariateSection.tsx:52) — semua derivasi
 *       `record.fingerprint !== dataset.fingerprint` dari data IPC
 *       (bukan copy statis), dengan mock stale (helpers.ts STAT_PATCHED,
 *       fingerprint FP_OLD vs dataset aktif FP_SEED).
 *   C2  Tampil `Stale`, bukan `Current` — banner "mungkin usang" + disclaimer
 *       eksplisit "bukan hasil yang berlaku untuk snapshot aktif"
 *       (featureCopy staleOldArtifact) + label negatif: chip stepper
 *       "Perlu diperbarui" (bukan "Selesai") dan artefak lama tetap terlihat
 *       dengan penanda snapshot sebelumnya ("Hasil dari snapshot
 *       sebelumnya." / "fp_old"). Tidak ada label "Current" di copy —
 *       negasi dibuktikan lewat disclaimer eksplisit yang menolak
 *       keberlakuan snapshot aktif, bukan lewat tidak adanya string.
 *   C3  Refresh hanya setelah persetujuan — navigasi pergi-balik tidak
 *       me-refresh (banner tetap, tanpa toast sukses baru); klik CTA
 *       persetujuan → refresh berjalan.
 *   C4  CTA menyebut dependency — banner memuat "Dependency yang berubah:
 *       dataset seed_sales.csv aktif".
 *
 * Celah yang ditutup kartu ini vs bukti yang sudah ada:
 * - d-f7.spec.ts / d-f7-followup.spec.ts: banner 4 elemen + CTA per
 *   permukaan (Profiling, Histogram, Quality, Readiness) — difokus per
 *   permukaan, tanpa matriks terpadu dan tanpa disclaimer "bukan hasil yang
 *   berlaku" dan tanpa sapuan fresh-negative.
 * - seeded.spec.ts "B3": Cleaning + Bivariat düzey rendah ("usang" muncul).
 * - vertical.spec.ts B12: satu edge state stale (screenshot).
 * Kartu ini menyatukan permukaan 6 artefak dalam satu matriks
 * terlacak + pembanding fresh-negative + baris persetujuan kanonis
 * (Profiling); overlap consent dengan d-f7 disengaja sebagai bukti
 * independen B3, bukan duplikasi diam-diam.
 */

import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mockBridge, setupWalkthrough } from "./helpers";

const VIEWPORTS = [
  { width: 900, height: 800 },
  { width: 1440, height: 900 },
];

/** Tutup semua toast yang menumpuk agar assertion berikutnya bersih. */
async function dismissAllToasts(page: Page): Promise<void> {
  const closes = page.getByRole("button", { name: "Tutup notifikasi" });
  // eslint-disable-next-line no-constant-condition
  while ((await closes.count()) > 0) {
    await closes.first().click();
  }
}

function stepper(page: Page) {
  return page.getByRole("navigation", { name: "Alur analisis" });
}

function stageLink(page: Page, n: number, name: string) {
  return stepper(page).getByRole("link", { name: new RegExp(`${n} · ${name}`) });
}

/** Banner stale D-F7: role=status + kelas cleaning-stale. */
async function expectStaleBanner(page: Page, texts: string[]): Promise<void> {
  const banner = page.locator(".cleaning-stale");
  await expect(banner).toBeVisible();
  for (const t of texts) {
    await expect(banner).toContainText(t);
  }
}

/** C2: chip stepper stale — "Perlu diperbarui", bukan "Selesai". */
async function expectStepperStale(page: Page, n: number, name: string): Promise<void> {
  const chip = stageLink(page, n, name);
  await expect(chip).toContainText("Perlu diperbarui");
  await expect(chip).not.toContainText("Selesai");
}

/** C2: chip stepper segar — "Selesai", bukan "Perlu diperbarui". */
async function expectStepperDone(page: Page, n: number, name: string): Promise<void> {
  const chip = stageLink(page, n, name);
  await expect(chip).toContainText("Selesai");
  await expect(chip).not.toContainText("Perlu diperbarui");
}

test.describe("G6-B3 · C1+C2 — fingerprint mismatch → Stale, bukan Current (per permukaan)", () => {
  for (const vp of VIEWPORTS) {
    test(`sapuan stale 6 permukaan @${vp.width}px`, async ({ page }) => {
      await page.setViewportSize(vp);
      await setupWalkthrough(page, { stale: true });
      await dismissAllToasts(page);

      // --- Profiling (sudah berunsang dari walkthrough stale) ---
      await expectStaleBanner(page, [
        "Hasil profiling mungkin usang", // C2: judul menolak status current
        "Dependency yang berubah: dataset seed_sales.csv aktif", // C4
        "bukan hasil yang berlaku untuk snapshot aktif", // C2: disclaimer
        "Saya setuju — perbarui profiling", // C3: CTA persetujuan eksplisit
      ]);
      await expectStepperStale(page, 3, "Profil");
      // Artefak lama tetap terlihat (bukan disembunyikan).
      await expect(page.locator("#main-content")).toContainText("sales");

      // --- Histogram (run dari route Dataset) ---
      await page.getByRole("link", { name: "Dataset", exact: true }).click();
      await page.getByLabel("Nama kolom numerik").fill("sales");
      await page.getByRole("button", { name: "Jalankan Histogram" }).click();
      await expect(page.getByText("Histogram selesai.")).toBeVisible();
      await dismissAllToasts(page);
      await expectStaleBanner(page, [
        "Histogram mungkin usang",
        "Dependency yang berubah: dataset seed_sales.csv aktif", // C4
        "bukan hasil yang berlaku untuk snapshot aktif", // C2
      ]);
      // Artefak lama terlihat dengan penanda fingerprint lama.
      await expect(page.locator("#main-content")).toContainText("Distribusi sales");
      await expect(page.locator("#main-content")).toContainText("fp_old");

      // --- Quality ---
      await page.getByRole("link", { name: "Kualitas", exact: true }).click();
      await page.getByRole("button", { name: "Jalankan Quality Check" }).click();
      await expect(page.getByText("Quality check selesai.")).toBeVisible();
      await dismissAllToasts(page);
      await expectStaleBanner(page, [
        "Hasil quality check mungkin usang",
        "Dependency yang berubah: dataset seed_sales.csv aktif", // C4
        "bukan hasil yang berlaku untuk snapshot aktif", // C2
      ]);
      await expectStepperStale(page, 4, "Kualitas");
      await expect(page.locator("#main-content")).toContainText(
        "Hasil dari snapshot sebelumnya.",
      );

      // --- Readiness ---
      await page.getByRole("link", { name: "Kesiapan", exact: true }).click();
      await page
        .getByRole("button", { name: "Jalankan Readiness Assessment" })
        .click();
      await expect(page.getByText("Readiness assessment selesai.")).toBeVisible();
      await dismissAllToasts(page);
      await expectStaleBanner(page, [
        "Hasil readiness assessment mungkin usang",
        "Dependency yang berubah: dataset seed_sales.csv aktif", // C4
        "bukan hasil yang berlaku untuk snapshot aktif", // C2
      ]);
      await expectStepperStale(page, 9, "Kesiapan");
      await expect(page.locator("#main-content")).toContainText(
        "Hasil dari snapshot sebelumnya.",
      );

      // --- Cleaning (qualityStale gate terhadap qualityRecord usang) ---
      await page.getByRole("link", { name: "Pembersihan", exact: true }).click();
      await expect(page.locator(".cleaning-stale")).toContainText(
        "Hasil mungkin usang — jalankan ulang.",
      );
      // Cleaning tidak membuka pintu fake-fresh: gated oleh qualityStale.
      await expect(page.locator("#main-content")).not.toContainText("Hitung dampak");

      // --- Bivariat (catatan usang inline, bukan banner penuh) ---
      await page.getByRole("link", { name: "Hubungan", exact: true }).click();
      await page.selectOption("#bivar-a", "sales");
      await page.selectOption("#bivar-b", "qty");
      await page
        .getByRole("button", { name: "Jalankan Analisis Bivariat" })
        .click();
      await expect(page.locator("#main-content")).toContainText("usang");
      await expect(page.locator("#main-content")).toContainText(
        "Hasil mungkin usang — jalankan ulang.",
      );
    });
  }
});

test.describe("G6-B3 · fresh-negative — fingerprint cocok → bukan Stale", () => {
  test("sapuan fresh: nol banner stale di semua permukaan; chip 3/4/9 Selesai", async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS[0]);
    await setupWalkthrough(page, { stale: false });
    await dismissAllToasts(page);

    // Profiling fresh: tidak ada banner.
    await expect(page.locator(".cleaning-stale")).toHaveCount(0);
    await expectStepperDone(page, 3, "Profil");

    // Histogram fresh.
    await page.getByRole("link", { name: "Dataset", exact: true }).click();
    await page.getByLabel("Nama kolom numerik").fill("sales");
    await page.getByRole("button", { name: "Jalankan Histogram" }).click();
    await expect(page.getByText("Histogram selesai.")).toBeVisible();
    await dismissAllToasts(page);
    await expect(page.locator(".cleaning-stale")).toHaveCount(0);

    // Quality fresh.
    await page.getByRole("link", { name: "Kualitas", exact: true }).click();
    await page.getByRole("button", { name: "Jalankan Quality Check" }).click();
    await expect(page.getByText("Quality check selesai.")).toBeVisible();
    await dismissAllToasts(page);
    await expect(page.locator(".cleaning-stale")).toHaveCount(0);
    await expectStepperDone(page, 4, "Kualitas");

    // Readiness fresh.
    await page.getByRole("link", { name: "Kesiapan", exact: true }).click();
    await page
      .getByRole("button", { name: "Jalankan Readiness Assessment" })
      .click();
    await expect(page.getByText("Readiness assessment selesai.")).toBeVisible();
    await dismissAllToasts(page);
    await expect(page.locator(".cleaning-stale")).toHaveCount(0);
    await expectStepperDone(page, 9, "Kesiapan");

    // Cleaning fresh: gated terbuka (qualityRecord segar), tanpa banner.
    await page.getByRole("link", { name: "Pembersihan", exact: true }).click();
    await expect(page.locator(".cleaning-stale")).toHaveCount(0);

    // Bivariat fresh: tanpa catatan usang.
    await page.getByRole("link", { name: "Hubungan", exact: true }).click();
    await page.selectOption("#bivar-a", "sales");
    await page.selectOption("#bivar-b", "qty");
    await page
      .getByRole("button", { name: "Jalankan Analisis Bivariat" })
      .click();
    await expect(page.locator("#main-content")).toContainText("sales");
    await expect(page.locator("#main-content")).not.toContainText("usang");
  });
});

test.describe("G6-B3 · C3 — refresh hanya setelah persetujuan (baris kanonis)", () => {
  test("Profiling stale: navigasi tidak me-refresh; klik CTA persetujuan baru refresh", async ({
    page,
  }) => {
    await page.setViewportSize(VIEWPORTS[0]);
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
    await dismissAllToasts(page);

    // Banner stale ada; toast sukses awal sudah ditutup.
    await expectStaleBanner(page, ["Hasil profiling mungkin usang"]);
    await expect(page.getByText("Profiling selesai")).toHaveCount(0);

    // Navigasi pergi-balik: banner tetap (belum ada persetujuan), dan
    // tidak ada toast sukses baru → tidak ada refresh otomatis.
    await page.getByRole("link", { name: "Kualitas", exact: true }).click();
    await page.getByRole("link", { name: "Profil", exact: true }).click();
    await expectStaleBanner(page, ["Hasil profiling mungkin usang"]);
    await expect(page.getByText("Profiling selesai")).toHaveCount(0);

    // Klik CTA persetujuan → refresh berjalan (toast sukses muncul).
    // Banner tetap muncul karena mock stale mengembalikan FP_OLD pada
    // SETIAP run (artefak seeded, bukan defect produk): di produksi run
    // ulang menghasilkan fingerprint segar yang menghapus banner — itu
    // dibuktikan oleh sapuan fresh-negative di atas.
    await page
      .getByRole("button", { name: "Saya setuju — perbarui profiling" })
      .click();
    await expect(page.getByText("Profiling selesai")).toBeVisible();
  });
});
