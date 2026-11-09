/**
 * g6-b2.spec.ts — G6-B2: Tabel sinyal × status stepper 5 tahap (D-F1).
 *
 * QA-SHELL-001:86 (B2) — kontrak pengunci D-F1
 * (FLOW-SHELL-001 §2.2:55-65 + baris [RATIFIED] D-F1 :73; QA-SHELL-001:52):
 * tiap status ditelusur ke satu sinyal authoritative; tahap 6/7/10
 * "Belum tersedia" tidak dapat diklik; tahap 8 tidak ditampilkan.
 *
 * Dua lapis bukti:
 * A. Truth-table `resolveStepperState` (Node, tanpa browser) — seluruh sel
 *    matriks sinyal × status, termasuk sel tak terjangkau via UI (record
 *    tanpa dataset → tetap "pending", bukan done/stale karangan).
 *    Tabel kontrak: stepperState.ts:9-15.
 * B. Render matrix UI seeded di 900px + 1440px — baris penuh "Selesai"
 *    (walkthrough fresh) dan baris stale (fingerprint mismatch) cocok
 *    dengan tabel A yang diklaim; tahap 6/7/10 non-klik; tahap 8 absen;
 *    tahap 5 bukan stage stepper.
 *
 * cakupan render stale 4/9 di sini beririsan dengan d-f1.spec.ts:143-173
 * sebagai bukti independen B2 (bukan mengandalkan spec lain).
 */
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mockBridge, setupWalkthrough } from "./helpers";
import { resolveStepperState } from "../src/shared/ui/stepperState";
import type { StepperSignals } from "../src/shared/ui/stepperState";

// ---------------------------------------------------------------------------
// Lapis A — truth-table (Node). FP representatif; beda string = mismatch.
// ---------------------------------------------------------------------------

const FP_A = "fp_seed_0123";
const FP_B = "fp_seed_9999"; // fingerprint dataset "berubah" → mismatch

const sig = (over: Partial<StepperSignals> = {}): StepperSignals => ({
  projectId: null,
  dataset: null,
  savedProfile: null,
  qualityRecord: null,
  readinessRecord: null,
  ...over,
});

const P = "pending";
const D = "done";
const S = "stale";

const cases: Array<{
  name: string;
  signals: StepperSignals;
  expected: { 1: string; 2: string; 3: string; 4: string; 9: string };
}> = [
  {
    name: "boot: semua sinyal null → semua Belum",
    signals: sig(),
    expected: { 1: P, 2: P, 3: P, 4: P, 9: P },
  },
  {
    name: "projectId saja → tahap 1 Selesai, lainnya Belum",
    signals: sig({ projectId: "p-1" }),
    expected: { 1: D, 2: P, 3: P, 4: P, 9: P },
  },
  {
    name: "dataset saja → tahap 2 Selesai, tahap 1 tetap Belum (independen)",
    signals: sig({ dataset: { fingerprint: FP_A } }),
    expected: { 1: P, 2: D, 3: P, 4: P, 9: P },
  },
  {
    name: "projectId + dataset → 1&2 Selesai, artefak Belum",
    signals: sig({
      projectId: "p-1",
      dataset: { fingerprint: FP_A },
    }),
    expected: { 1: D, 2: D, 3: P, 4: P, 9: P },
  },
  {
    name: "record tanpa dataset → Belum (tidak ada done/stale tanpa sinyal dataset)",
    signals: sig({
      projectId: "p-1",
      savedProfile: { fingerprint: FP_A },
      qualityRecord: { fingerprint: FP_A },
      readinessRecord: { fingerprint: FP_A },
    }),
    expected: { 1: D, 2: P, 3: P, 4: P, 9: P },
  },
  {
    name: "profil fingerprint cocok → 3 Selesai",
    signals: sig({
      projectId: "p-1",
      dataset: { fingerprint: FP_A },
      savedProfile: { fingerprint: FP_A },
    }),
    expected: { 1: D, 2: D, 3: D, 4: P, 9: P },
  },
  {
    name: "profil fingerprint mismatch → 3 Perlu diperbarui (stale)",
    signals: sig({
      projectId: "p-1",
      dataset: { fingerprint: FP_A },
      savedProfile: { fingerprint: FP_B },
    }),
    expected: { 1: D, 2: D, 3: S, 4: P, 9: P },
  },
  {
    name: "kualitas fingerprint cocok → 4 Selesai",
    signals: sig({
      projectId: "p-1",
      dataset: { fingerprint: FP_A },
      qualityRecord: { fingerprint: FP_A },
    }),
    expected: { 1: D, 2: D, 3: P, 4: D, 9: P },
  },
  {
    name: "kualitas fingerprint mismatch → 4 Perlu diperbarui (stale)",
    signals: sig({
      projectId: "p-1",
      dataset: { fingerprint: FP_A },
      qualityRecord: { fingerprint: FP_B },
    }),
    expected: { 1: D, 2: D, 3: P, 4: S, 9: P },
  },
  {
    name: "kesiapan fingerprint cocok → 9 Selesai",
    signals: sig({
      projectId: "p-1",
      dataset: { fingerprint: FP_A },
      readinessRecord: { fingerprint: FP_A },
    }),
    expected: { 1: D, 2: D, 3: P, 4: P, 9: D },
  },
  {
    name: "kesiapan fingerprint mismatch → 9 Perlu diperbarui (stale)",
    signals: sig({
      projectId: "p-1",
      dataset: { fingerprint: FP_A },
      readinessRecord: { fingerprint: FP_B },
    }),
    expected: { 1: D, 2: D, 3: P, 4: P, 9: S },
  },
  {
    name: "campuran: 3 Selesai, 4 stale, 9 Belum (sinyal per-tahap independen)",
    signals: sig({
      projectId: "p-1",
      dataset: { fingerprint: FP_A },
      savedProfile: { fingerprint: FP_A },
      qualityRecord: { fingerprint: FP_B },
    }),
    expected: { 1: D, 2: D, 3: D, 4: S, 9: P },
  },
  {
    name: "semua fresh → 5 tahap Selesai",
    signals: sig({
      projectId: "p-1",
      dataset: { fingerprint: FP_A },
      savedProfile: { fingerprint: FP_A },
      qualityRecord: { fingerprint: FP_A },
      readinessRecord: { fingerprint: FP_A },
    }),
    expected: { 1: D, 2: D, 3: D, 4: D, 9: D },
  },
  {
    name: "dataset berubah (semua artefak fp lama) → 3/4/9 stale, 1/2 tetap Selesai",
    signals: sig({
      projectId: "p-1",
      dataset: { fingerprint: FP_B },
      savedProfile: { fingerprint: FP_A },
      qualityRecord: { fingerprint: FP_A },
      readinessRecord: { fingerprint: FP_A },
    }),
    expected: { 1: D, 2: D, 3: S, 4: S, 9: S },
  },
];

test.describe("G6-B2 · A — truth-table resolveStepperState", () => {
  for (const c of cases) {
    test(c.name, () => {
      const got = resolveStepperState(c.signals);
      for (const k of [1, 2, 3, 4, 9] as const) {
        expect(got[k], `tahap ${k}`).toBe(c.expected[k]);
      }
    });
  }

  test("kunci hasil tepat {1,2,3,4,9} — tidak ada tahap lain (5/6/7/8/10 bukan stage)", () => {
    const got = resolveStepperState(sig());
    expect(Object.keys(got).sort()).toEqual(["1", "2", "3", "4", "9"]);
  });

  test("nilai hanya dari {done,pending,stale} — In Progress/persentase tak terwakili", () => {
    const allowed = new Set(["done", "pending", "stale"]);
    for (const c of cases) {
      for (const v of Object.values(resolveStepperState(c.signals))) {
        expect(allowed.has(v), `nilai tak sah: ${v}`).toBe(true);
      }
    }
  });

  test("murni: input tak dimutasi, hasil deterministik", () => {
    const input = sig({
      projectId: "p-1",
      dataset: { fingerprint: FP_A },
      savedProfile: { fingerprint: FP_B },
    });
    const before = JSON.stringify(input);
    const a = resolveStepperState(input);
    const b = resolveStepperState(input);
    expect(JSON.stringify(input)).toBe(before);
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------------
// Lapis B — render matrix UI seeded @900px + @1440px.
// ---------------------------------------------------------------------------

function stepper(page: Page) {
  return page.getByRole("navigation", { name: "Alur analisis" });
}

const stageLink = (page: Page, n: number, name: string) =>
  stepper(page).getByRole("link", { name: new RegExp(`${n} · ${name}`) });

for (const width of [900, 1440]) {
  test.describe(`G6-B2 · B — render matrix @${width}px`, () => {
    test("walkthrough fresh: baris penuh 5 tahap Selesai", async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await setupWalkthrough(page); // project → import → Profiling run

      // Quality + Readiness fresh (sinyal artefak cocok) → 4 & 9 Selesai.
      await page.getByRole("link", { name: "Kualitas", exact: true }).click();
      await page.getByRole("button", { name: "Jalankan Quality Check" }).click();
      await page.getByRole("link", { name: "Kesiapan", exact: true }).click();
      await page
        .getByRole("button", { name: "Jalankan Readiness Assessment" })
        .click();

      const s = stepper(page);
      for (const [n, name] of [
        [1, "Proyek"],
        [2, "Dataset"],
        [3, "Profil"],
        [4, "Kualitas"],
        [9, "Kesiapan"],
      ] as const) {
        await expect(stageLink(page, n, name)).toContainText("Selesai");
      }
      // tepat 5 link stage; 3 non-klik; tahap 8 & 5 absen; tanpa %/In Progress.
      await expect(s.locator("a[href]")).toHaveCount(5);
      await expect(s.locator("[aria-disabled='true']")).toHaveCount(3);
      await expect(s).not.toContainText("8 ·");
      await expect(s).not.toContainText("5 ·");
      await expect(s).not.toContainText("In Progress");
      await expect(s).not.toContainText(/%|persen/);
    });

    test("setup stale: 3 Perlu diperbarui; 1/2 tetap Selesai; 4/9 stale setelah run seeded", async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await setupWalkthrough(page, { stale: true });

      const stage3 = stageLink(page, 3, "Profil");
      await expect(stage3).toContainText("Perlu diperbarui");
      await expect(stage3).not.toContainText("Selesai");
      await expect(stage3).toHaveAttribute(
        "aria-label",
        /berubah sejak hasil ini dibuat/,
      );
      await expect(stageLink(page, 1, "Proyek")).toContainText("Selesai");
      await expect(stageLink(page, 2, "Dataset")).toContainText("Selesai");

      await page.getByRole("link", { name: "Kualitas", exact: true }).click();
      await page.getByRole("button", { name: "Jalankan Quality Check" }).click();
      await expect(stageLink(page, 4, "Kualitas")).toContainText(
        "Perlu diperbarui",
      );

      await page.getByRole("link", { name: "Kesiapan", exact: true }).click();
      await page
        .getByRole("button", { name: "Jalankan Readiness Assessment" })
        .click();
      await expect(stageLink(page, 9, "Kesiapan")).toContainText(
        "Perlu diperbarui",
      );

      const s = stepper(page);
      await expect(s).not.toContainText("In Progress");
    });

    test("boot tanpa proyek: baris penuh 5 tahap Belum; 6/7/10 non-klik", async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await mockBridge(page, { seeded: true });
      await page.goto("/");
      const s = stepper(page);
      for (const [n, name] of [
        [1, "Proyek"],
        [2, "Dataset"],
        [3, "Profil"],
        [4, "Kualitas"],
        [9, "Kesiapan"],
      ] as const) {
        const link = stageLink(page, n, name);
        await expect(link).toContainText("Belum");
        await expect(link).not.toContainText("Selesai");
      }
      const disabled = s.locator("[aria-disabled='true']");
      await expect(disabled).toHaveCount(3);
      for (const n of [6, 7, 10]) {
        const item = s.locator("[aria-disabled='true']", {
          hasText: `${n} ·`,
        });
        await expect(item).toHaveCount(1);
        await expect(item).not.toHaveAttribute("href", /.*/);
      }
      const before = page.url();
      await disabled.first().click({ force: true });
      await expect(page).toHaveURL(before);
    });
  });
}
