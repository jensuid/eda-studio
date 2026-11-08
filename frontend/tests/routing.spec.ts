/**
 * routing.spec.ts — B4 · reload / Back-Forward / revalidasi resume.
 * D-F2 (hash + history, nav <a href="#…">) + D-F3 (resume {projectId,
 * datasetId} + revalidasi wajib; gagal → degraded beralasan).
 */
import { expect, test } from "@playwright/test";
import { mockBridge } from "./helpers";

test.describe("B4 — hash routing (D-F2)", () => {
  test("klik nav mengubah hash; reload memulihkan route + konteks project", async ({
    page,
  }) => {
    await mockBridge(page, { seeded: true });
    await page.goto("/");
    await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
    await page.getByLabel("Nama project").fill("Proyek Seed");
    await page.getByRole("button", { name: "Buat", exact: true }).click();
    await expect(page.getByText("Project dibuat")).toBeVisible();
    await page.getByLabel("Nama dataset").fill("seed_sales.csv");
    await page.getByRole("button", { name: "Import", exact: true }).click();
    await expect(page.getByText("Dataset diimport")).toBeVisible();
    await page.getByRole("link", { name: "Quality" }).click();
    await expect(page).toHaveURL(/#\/quality$/);
    await expect(page.getByText("Jalankan profiling terlebih dahulu.")).toBeVisible();

    await page.reload();
    await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
    // Route dipulihkan dari hash (D-F2).
    await expect(page).toHaveURL(/#\/quality$/);
    // {projectId, datasetId} dipulihkan + divalidasi (D-F3) → gate Quality
    // masuk cabang "dataset aktif, profiling belum jalan" (bukan empty-state
    // "Belum ada dataset aktif").
    await expect(page.getByText("Jalankan profiling terlebih dahulu.")).toBeVisible();
  });

  test("Back/Forward mengembalikan route tanpa menghapus konteks", async ({ page }) => {
    await mockBridge(page, { seeded: true });
    await page.goto("/");
    await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
    await page.getByLabel("Nama project").fill("Proyek Seed");
    await page.getByRole("button", { name: "Buat", exact: true }).click();
    await expect(page.getByText("Project dibuat")).toBeVisible();
    await page.getByLabel("Nama dataset").fill("seed_sales.csv");
    await page.getByRole("button", { name: "Import", exact: true }).click();
    await expect(page.getByText("Dataset diimport")).toBeVisible();
    await page.getByRole("link", { name: "Quality" }).click();
    await page.getByRole("link", { name: "Readiness" }).click();
    await expect(page).toHaveURL(/#\/readiness$/);
    await page.goBack();
    await expect(page).toHaveURL(/#\/quality$/);
    await expect(page.getByText("Jalankan profiling terlebih dahulu.")).toBeVisible();
    await page.goForward();
    await expect(page).toHaveURL(/#\/readiness$/);
  });

  test("hash tidak dikenal → fallback Setup + pesan (bukan layar kosong)", async ({
    page,
  }) => {
    await mockBridge(page, { seeded: true });
    await page.goto("/#/tidak-ada");
    await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
    await expect(page.getByText("Rute tidak dikenal")).toBeVisible();
    await expect(page.getByLabel("Nama project")).toBeVisible();
  });
});

test.describe("B4 — revalidasi resume gagal → degraded (D-F3)", () => {
  test("simpanan konteks tidak valid di backend → banner degraded beralasan", async ({
    page,
  }) => {
    await mockBridge(page, { seeded: true, resumeFail: true });
    // Tanam resume tersimpan sebelum boot aplikasi.
    await page.addInitScript(() => {
      window.localStorage.setItem(
        "eda-resume:project-v1",
        JSON.stringify({ projectId: "proj_seed", datasetId: "ds_seed" }),
      );
    });
    await page.goto("/");
    await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
    await expect(page.getByText("Tidak dapat memulihkan konteks")).toBeVisible();
    await expect(page.getByRole("button", { name: "Mulai baru" })).toBeVisible();
    // Simpanan dibersihkan agar tidak mengulang kegagalan.
    const stored = await page.evaluate(() =>
      window.localStorage.getItem("eda-resume:project-v1"),
    );
    expect(stored).toBeNull();
  });
});
