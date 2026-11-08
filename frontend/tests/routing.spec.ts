/**
 * routing.spec.ts — B4 · reload / Back-Forward / revalidasi resume.
 * D-F2 (hash + history, nav <a href="#…">) + D-F3 (resume {projectId,
 * datasetId} + revalidasi wajib; gagal → degraded beralasan).
 */
import { expect, test } from "@playwright/test";
import { SHELL_COPY } from "../src/shared/copy/shellCopy";
import { mockBridge, setupWalkthrough } from "./helpers";

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

  test("reload → dataset.get merehidrasi columns (dropdown Bivariat berisi sales/qty)", async ({
    page,
  }) => {
    await setupWalkthrough(page);
    await page.getByRole("link", { name: "Bivariat" }).click();
    await expect(page).toHaveURL(/#\/bivariate$/);
    await expect(page.getByLabel("Kolom A")).toBeVisible();

    await page.reload();
    await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
    await expect(page).toHaveURL(/#\/bivariate$/);
    // Profil sengaja TIDAK dipersist (D-F3) → jalankan ulang setelah resume;
    // kolom dropdown berasal dari dataset.columns hasil rehidrasi dataset.get.
    await page.getByRole("link", { name: "Profiling" }).click();
    await page.getByRole("button", { name: "Jalankan Profiling" }).click();
    await expect(page.getByText("Profiling selesai")).toBeVisible();
    await page.getByRole("link", { name: "Bivariat" }).click();
    const colA = page.getByLabel("Kolom A");
    await expect(colA).toBeVisible();
    const options = await colA.locator("option").allTextContents();
    expect(options).toEqual(expect.arrayContaining(["sales", "region", "qty"]));
    const optionsB = await page.getByLabel("Kolom B").locator("option").allTextContents();
    expect(optionsB).toEqual(expect.arrayContaining(["sales", "qty"]));
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
    // Banner resume-error memakai prefix dari modul copy shell (wiring
    // SHELL_COPY.resumeFailedPrefix di ProjectContext).
    await expect(page.getByText("Tidak dapat memulihkan konteks")).toBeVisible();
    await expect(
      page.getByText(`${SHELL_COPY.resumeFailedPrefix} — project hilang di backend`),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: SHELL_COPY.startFresh })).toBeVisible();
    // Simpanan dibersihkan agar tidak mengulang kegagalan.
    const stored = await page.evaluate(() =>
      window.localStorage.getItem("eda-resume:project-v1"),
    );
    expect(stored).toBeNull();
  });
});
