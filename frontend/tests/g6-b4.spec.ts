/**
 * g6-b4.spec.ts — G6-B4: Uji reload / Back / revalidasi gagal (QA-SHELL-001:88;
 * kontrak pengunci D-F2 + D-F3, ratified PO 2026-11-08 — FLOW-SHELL-001 §2.9
 * (:165-169), D-F2 :95, D-F3 :97; Bunyi keputusan :193-194; traceability
 * §2.9 → QA-SHELL-001:216 "reload/back/resize walkthrough").
 *
 * Judul baris B4: "screenshot tidak cukup untuk arsitektur" — bukti ini
 * seluruhnya assertion fungsional aplikasi nyata (perilaku hash/history,
 * isi localStorage, state konteks pasca-resume), bukan screenshot.
 *
 * D-F2 berbunyi: "Hash routing + history stack; useRouter dipertahankan;
 * Back/Forward tidak membatalkan job". Implementasi:
 * frontend/src/app/router.tsx (hash `#/<route>`, :72-82; hashchange
 * listener :120-128; persist route terpisah `eda-resume:route-v1` :84-101).
 * D-F3 berbunyi: "Persist 3 field + revalidasi wajib + degraded beralasan
 * saat gagal"; ditolak: "menyimpan record analisis". Implementasi:
 * frontend/src/app/ProjectContext.tsx (persist hanya
 * {projectId, datasetId} :48-58; boot revalidasi
 * listSnapshots+getDataset :99-131; gagal → resumeError degraded
 * beralasan :119-126; banner + "Mulai baru" App.tsx:337-344, copy
 * shellCopy.ts:20-22).
 *
 * Setiap baris matriks = satu klausa:
 *   R1  Hash routing (D-F2, router.tsx:72-82) — klik nav mengubah hash;
 *       reload memulihkan route dari hash; goto("/") tanpa hash memulihkan
 *       route tersimpan (router.tsx:79 readStoredRoute).
 *   R2  Back/Forward (D-F2 + FLOW §2.9 cancel_and_back :168) — route
 *       kembali tanpa menghapus hasil (record Profiling tetap tampil),
 *       tanpa kehilangan dataset aktif, dan tanpa memicu command domain
 *       baru (zero toast run baru selama navigasi).
 *   R3  Persist hanya 3 field (D-F3, ProjectContext.tsx:48-58) —
 *       localStorage tepat 2 kunci (`eda-resume:project-v1`,
 *       `eda-resume:route-v1`); nilai project hanya {projectId, datasetId};
 *       tidak ada nilai/kunci record analisis.
 *   R4  Resume sukses tanpa tulis-ulang (D-F3 + §2.9 :169 "Tidak ada
 *       data yang ditulis ulang saat resume") — konteks direvalidasi +
 *       ditampilkan (dataset card seeded aktif), TETAPI record analisis
 *       null: Profiling kembali ke tombol "Jalankan Profiling", chip
 *       Profil "Belum" (bukan "Selesai"), tanpa banner degraded.
 *   R5  Revalidasi gagal → degraded beralasan (D-F3 :97, ProjectContext
 *       :119-126) — simpanan tidak valid di backend → banner role="alert"
 *       beralasan (prefix copy shell + sebab), tombol "Mulai baru"
 *       membersihkan simpanan dan mengembalikan ke Setup.
 *   R6  Hash tidak dikenal (D-F2 cakupan FLOW §2.4 unknown-route :120) —
 *       fallback Setup + pesan, bukan layar kosong.
 *
 * Celah yang ditutup kartu ini vs bukti yang sudah ada:
 * - routing.spec.ts "B4 — hash routing": reload + Back/Forward + unknown
 *   hash + revalidasi gagal pada viewport default (1280px) — tanpa 900px/
 *   1440px, tanpa route-tersimpan-tanpa-hash, tanpa "hasil tidak terhapus"
 *   pasca-Back/Forward, tanpa bentuk localStorage eksplisit, tanpa
 *   "tidak ada tulisan ulang saat resume" eksplisit, tanpa reset "Mulai
 *   baru". Kartu ini menyatukan keenam baris dalam satu matriks
 *   terlacak @900px+1440px; overlap dengan routing.spec disengaja sebagai
 *   bukti independen B4.
 */
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { SHELL_COPY } from "../src/shared/copy/shellCopy";
import { mockBridge, setupWalkthrough } from "./helpers";

const VIEWPORTS = [
  { width: 900, height: 800 },
  { width: 1440, height: 900 },
];

const ROUTE_KEY = "eda-resume:route-v1";
const PROJECT_KEY = "eda-resume:project-v1";

/** Tutup semua toast yang menumpuk; jumlah tombol tutup = jumlah toast. */
async function dismissAllToasts(page: Page): Promise<void> {
  const closes = page.getByRole("button", { name: "Tutup notifikasi" });
  // eslint-disable-next-line no-constant-condition
  while ((await closes.count()) > 0) {
    await closes.first().click();
  }
}

async function toastCount(page: Page): Promise<number> {
  return page.getByRole("button", { name: "Tutup notifikasi" }).count();
}

/** Chip stepper: status persis "Belum" (pending), bukan "Selesai". */
async function expectChipPending(page: Page, n: number, name: string): Promise<void> {
  const chip = page
    .getByRole("navigation", { name: "Alur analisis" })
    .getByRole("link", { name: new RegExp(`${n} · ${name}`) });
  await expect(chip).toContainText("Belum");
  await expect(chip).not.toContainText("Selesai");
}

/** Chip stepper: status "Selesai" (konteks project/dataset hidup). */
async function expectChipDone(page: Page, n: number, name: string): Promise<void> {
  const chip = page
    .getByRole("navigation", { name: "Alur analisis" })
    .getByRole("link", { name: new RegExp(`${n} · ${name}`) });
  await expect(chip).toContainText("Selesai");
}

/** Baca isi localStorage sebagai {key: value}. */
async function readStorage(page: Page): Promise<Record<string, string>> {
  return page.evaluate(() => {
    const out: Record<string, string> = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k) out[k] = window.localStorage.getItem(k) ?? "";
    }
    return out;
  });
}

test.describe("B4 — hash routing (D-F2)", () => {
  for (const vp of VIEWPORTS) {
    test(`R1 reload memulihkan route dari hash / route tersimpan @${vp.width}px`, async ({ page }) => {
      await page.setViewportSize(vp);
      // Sengaja TANPA profiling run: savedProfile null → Quality masuk
      // gate "profiling belum jalan" (pola routing.spec.ts D-F2).
      await mockBridge(page, { seeded: true });
      await page.goto("/");
      await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
      await page.getByLabel("Nama project").fill("Proyek Seed");
      await page.getByRole("button", { name: "Buat", exact: true }).click();
      await expect(page.getByText("Project dibuat")).toBeVisible();
      await page.getByLabel("Nama dataset").fill("seed_sales.csv");
      await page.getByRole("button", { name: "Import", exact: true }).click();
      await expect(page.getByText("Dataset diimport")).toBeVisible();
      await page.getByRole("link", { name: "Kualitas", exact: true }).click();
      await expect(page).toHaveURL(/#\/quality$/);
      await expect(page.getByText("Jalankan profiling terlebih dahulu.")).toBeVisible();

      // Reload: route dipulihkan dari hash (D-F2) dan konteks
      // {projectId, datasetId} direvalidasi (D-F3) — gate Quality masuk
      // cabang "dataset aktif, profiling belum jalan", bukan empty state.
      await page.reload();
      await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
      await expect(page).toHaveURL(/#\/quality$/);
      await expect(page.getByText("Jalankan profiling terlebih dahulu.")).toBeVisible();

      // Tanpa hash: route tersimpan (eda-resume:route-v1) memulihkan
      // route yang sama (router.tsx:79).
      await page.goto("/");
      await expect(page.getByText("Jalankan profiling terlebih dahulu.")).toBeVisible();
    });
  }

  for (const vp of VIEWPORTS) {
    test(`R2 Back/Forward: hasil tidak terhapus, tanpa command domain baru @${vp.width}px`, async ({ page }) => {
      await page.setViewportSize(vp);
      await setupWalkthrough(page);
      await dismissAllToasts(page);
      expect(await toastCount(page)).toBe(0);

      await page.getByRole("link", { name: "Kualitas", exact: true }).click();
      await page.getByRole("link", { name: "Kesiapan", exact: true }).click();
      await expect(page).toHaveURL(/#\/readiness$/);

      await page.goBack();
      await expect(page).toHaveURL(/#\/quality$/);
      await page.goBack();
      await expect(page).toHaveURL(/#\/profiling$/);

      // Hasil analisis tidak terhapus: record Profiling tetap tampil
      // (tabel mengandung nama kolom "sales") tanpa menjalankan ulang.
      await expect(page.getByRole("heading", { name: "Profiling" })).toBeVisible();
      await expect(page.locator("main")).toContainText("sales");
      // Navigasi tidak memicu command domain: nol toast run baru.
      expect(await toastCount(page)).toBe(0);

      await page.goForward();
      await expect(page).toHaveURL(/#\/quality$/);
      await page.goForward();
      await expect(page).toHaveURL(/#\/readiness$/);
      expect(await toastCount(page)).toBe(0);
    });
  }

  test("R6 hash tidak dikenal → fallback Setup + pesan @900px", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[0]);
    await mockBridge(page, { seeded: true });
    await page.goto("/#/tidak-ada");
    await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
    await expect(page.getByText("Rute tidak dikenal")).toBeVisible();
    await expect(page.getByLabel("Nama project")).toBeVisible();
  });
});

test.describe("B4 — persist + resume (D-F3)", () => {
  test("R3 localStorage hanya 2 kunci resume; record analisis tidak disimpan", async ({ page }) => {
    await page.setViewportSize(VIEWPORTS[0]);
    await setupWalkthrough(page);

    const storage = await readStorage(page);
    // Tepat dua kunci: route terpisah + project. Arsitektur storage
    // viewport-independent; reload-nya diuji R1/R4 @900+1440px.
    expect(Object.keys(storage).sort()).toEqual([PROJECT_KEY, ROUTE_KEY].sort());

    // Nilai project hanya {projectId, datasetId} (D-F3 "3 field").
    const project = JSON.parse(storage[PROJECT_KEY]);
    expect(Object.keys(project).sort()).toEqual(["datasetId", "projectId"]);
    expect(project.projectId).toBe("proj_seed");
    expect(project.datasetId).toBe("ds_seed");

    // Tidak ada record analisis yang disimpan di kunci mana pun.
    for (const [k, v] of Object.entries(storage)) {
      expect(k).not.toMatch(/profile|quality|readiness|report|bivariate|cleaning/i);
      expect(v).not.toMatch(/profile|quality|readiness|report|fingerprint/i);
    }
  });

  for (const vp of VIEWPORTS) {
    test(`R4 resume sukses: konteks valid, record null, tanpa tulis-ulang @${vp.width}px`, async ({ page }) => {
      await page.setViewportSize(vp);
      await setupWalkthrough(page);
      // Setelah walkthrough: Profiling route, hash #/profiling,
      // savedProfile terisi (fresh).

      await page.reload();
      await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();
      await expect(page).toHaveURL(/#\/profiling$/);

      // Konteks direvalidasi + ditampilkan (bukan empty state): chip
      // stepper "2 · Dataset Selesai" dan fingerprint snapshot aktif
      // fp_seed_0123 tampil di Provenance. (Kartu dataset "seed_sales.csv"
      // berada di route Setup — bukan route Profiling.)
      await expectChipDone(page, 2, "Dataset");
      await expect(page.locator("main")).toContainText("fp_seed_0123");

      // Record analisis TIDAK dipersist → Profiling kembali ke tombol
      // run; chip Profil "Belum" (bukan "Selesai"). Ini bukti eksplisit
      // "tidak ada data yang ditulis ulang saat resume": resume tidak
      // mengarang record, dan tidak menjalankannya ulang.
      await expect(page.getByRole("button", { name: "Jalankan Profiling" })).toBeVisible();
      await expectChipPending(page, 3, "Profil");

      // Tanpa banner degraded pada jalur sukses; tanpa toast baru.
      await expect(page.getByText("Tidak dapat memulihkan konteks")).toHaveCount(0);
      await dismissAllToasts(page);
      expect(await toastCount(page)).toBe(0);
    });
  }

  for (const vp of VIEWPORTS) {
    test(`R5 revalidasi gagal → degraded beralasan + Mulai baru @${vp.width}px`, async ({ page }) => {
      await page.setViewportSize(vp);
      await mockBridge(page, { seeded: true, resumeFail: true });
      await page.addInitScript(() => {
        window.localStorage.setItem(
          "eda-resume:project-v1",
          JSON.stringify({ projectId: "proj_seed", datasetId: "ds_seed" }),
        );
      });
      await page.goto("/");
      await page.getByRole("navigation", { name: "Navigasi utama" }).waitFor();

      // Degraded beralasan: prefix copy shell + sebab backend, dalam
      // banner role="alert" (App.tsx:337-344) — bukan empty state dan
      // bukan data kosong (navigasi tetap tersedia di rail).
      const banner = page.getByRole("alert");
      await expect(banner).toContainText("Tidak dapat memulihkan konteks");
      await expect(banner).toContainText(
        `${SHELL_COPY.resumeFailedPrefix} — project hilang di backend`,
      );
      await expect(page.getByRole("navigation", { name: "Navigasi utama" })).toBeVisible();

      // "Mulai baru" (resetResume): banner lenyap, simpanan dibersihkan
      // agar tidak mengulang kegagalan, kembali ke Setup bersih.
      await page.getByRole("button", { name: SHELL_COPY.startFresh }).click();
      await expect(banner).toHaveCount(0);
      await expect(page.getByLabel("Nama project")).toBeVisible();
      const storage = await readStorage(page);
      expect(storage[PROJECT_KEY]).toBeUndefined();
    });
  }
});
