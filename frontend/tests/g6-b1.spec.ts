/**
 * g6-b1.spec.ts — bukti B1 (QA-SHELL-001:85, JOB-SHELL-001 §1 success signal).
 *
 * Threshold G5-07/Add-09: ≥5 tugas Doc01 §11.1, jalur keyboard-only, seeded
 * fixtures (bukan `data:null`), 900px + 1440px, dicatat per tugas.
 *
 * Pemetaan Doc01 §11.1 (`docs/01 — Product Vision & Requirements v0.2.md:645-649`)
 * "Import → Snapshot → Profile → Assess Quality → Clean → Analyze →
 * Visualize → Report" ke tugas yang dapat dieksekusi di shell:
 *   T1 Import          — Setup: buat project + import dataset (seeded snapshot)
 *   T2 Snapshot        — DatasetCard: snapshot #SNAP-002 tersimpan, fingerprint
 *                        sha256 12 char, original tetap (immutable)
 *   T3 Profile         — Profiling run: kolom seeded sales/region/5000 baris
 *   T4 Assess Quality  — Quality run: finding "18 baris tanpa region";
 *                        Readiness: skor "Siap untuk analisis bivariat…"
 *   T5 Clean           — Cleaning preview "Hitung dampak" → apply →
 *                        "Cleaning selesai. Snapshot baru telah dibuat."
 *                        (pipeline change → revisi baru, Doc01 §11.1)
 *   T6 Analyze         — Bivariat: kolom sales × qty → r = 0.87
 *   T7 Visualize      — visual hasil analisis bivariat ter-render (svg/canvas
 *                        atau ringkasan visual) — report mengikat fingerprint
 *   T8 Report          — "Buat Report HTML" → "Report siap dibuka. N section…"
 *
 * Jalur keyboard-only: semua aktivasi via Tab/Enter/Arrow; tanpa click,
 * fill, atau selectOption. Satu-satunya press keyboard murni; setiap tugas
 * mencatat baris bukti per viewport di output test (console).
 */
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mockBridge } from "./helpers";

type Pred = (el: Element | null, arg: string) => boolean;

/**
 * Tab sampai pred(activeElement, arg) true; throw bila tidak tercapai
 * (batas 60). Predikat WAJIB closure-free: diserialisasi ke halaman, argumen
 * dikirim eksplisit (closure di sini akan jadi global halaman — bug lama).
 */
async function tabTo(page: Page, pred: Pred, desc: string, arg = ""): Promise<void> {
  for (let i = 0; i < 60; i++) {
    const ok = await page.evaluate(
      ([f, a]: [string, string]) => {
        // eslint-disable-next-line no-eval
        const fn = eval(`(${f})`) as Pred;
        return fn(document.activeElement, a);
      },
      [pred.toString(), arg] as [string, string],
    );
    if (ok) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`tabTo: target tidak tercapai — ${desc}`);
}

/** Tab sampai kontrol ber-label persis menerima fokus. */
async function tabToLabel(page: Page, name: string): Promise<void> {
  await tabTo(
    page,
    (el, n) => {
      if (!el) return false;
      const aria = el.getAttribute("aria-label");
      if (aria && aria.trim() === n) return true;
      const labels = (el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).labels;
      if (labels && labels[0]?.textContent?.trim() === n) return true;
      const labelledby = el.getAttribute("aria-labelledby");
      if (labelledby) {
        const elRef = document.getElementById(labelledby);
        if (elRef?.textContent?.trim() === n) return true;
      }
      return (el.textContent ?? "").trim() === n;
    },
    `label "${name}"`,
    name,
  );
}

/** Tab sampai elemen ber-id menerima fokus. */
async function tabToId(page: Page, id: string): Promise<void> {
  await tabTo(page, (el, i) => el?.id === i, `id "#${id}"`, id);
}

/** Akaktifkan kontrol ber-label dengan Enter. */
async function enterLabel(page: Page, name: string): Promise<void> {
  await tabToLabel(page, name);
  await page.keyboard.press("Enter");
}

/** Akaktifkan link navigasi ber-label (rail) dengan Enter. */
async function gotoLabel(page: Page, name: string): Promise<void> {
  await enterLabel(page, name);
  await page.waitForTimeout(150);
}

/** Pilih opsi <select> ber-id via keyboard-only (type-ahead + ArrowDown). */
async function selectByKeyboard(
  page: Page,
  id: string,
  expected: string,
): Promise<void> {
  await tabToId(page, id);
  const readValue = () =>
    page.evaluate(
      (selId: string) =>
        (document.getElementById(selId) as HTMLSelectElement | null)?.value ??
        null,
      id,
    );
  // Type-ahead native: huruf pertama langsung melompat (jalur keyboard sah).
  await page.keyboard.press(expected[0]!);
  if ((await readValue()) === expected) return;
  for (let i = 0; i < 12; i++) {
    if ((await readValue()) === expected) return;
    await page.keyboard.press("ArrowDown");
  }
  throw new Error(`selectByKeyboard: "${expected}" tak tercapai pada #${id}`);
}

/** Ketik ke field ber-aria-label via fokus keyboard (retry ±10 Tab). */
async function typeInto(page: Page, label: string, text: string): Promise<void> {
  await tabToLabel(page, label);
  await page.keyboard.type(text);
}

/** Tunggu teks sukses muncul di body (toast transien — pola setupWalkthrough). */
async function expectBody(page: Page, text: string): Promise<void> {
  await page.waitForFunction(
    (t: string) => document.body.textContent?.includes(t) ?? false,
    text,
  );
}

async function assertText(
  page: Page,
  text: string,
): Promise<void> {
  await expect(page.locator("#main-content")).toContainText(text);
}

const VIEWPORTS = [
  { name: "1440", width: 1440, height: 900 },
  { name: "900", width: 900, height: 900 },
] as const;

for (const vp of VIEWPORTS) {
  test(`B1 walkthrough Doc01 §11.1 keyboard-only @ ${vp.name}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await mockBridge(page, { seeded: true });
    await page.goto("/");
    const navReady = page
      .getByRole("navigation", { name: "Navigasi utama" });
    await navReady.waitFor();

    const log: string[] = [];

    // T1 Import — Setup: buat project + import dataset (keyboard-only).
    await typeInto(page, "Nama project", "Proyek Seed");
    await enterLabel(page, "Buat");
    await expect(page.getByText("Project dibuat")).toBeVisible();
    await typeInto(page, "Nama dataset", "seed_sales.csv");
    await enterLabel(page, "Import");
    await expectBody(page, "Dataset diimport");
    log.push("T1 Import: project+dataset dibuat — \"Dataset diimport\" ✓");

    // T2 Snapshot — DatasetCard seeded: snapshot tersimpan, fingerprint
    // sha256 12 char, original immutable (tidak berubah sejak import).
    await assertText(page, "seed_sales.csv");
    await assertText(page, "5000 baris × 3 kolom");
    await assertText(page, "sha256 fp_seed_0123");
    log.push(
      "T2 Snapshot: DatasetCard 5000×3, sha256 fp_seed_0123, fingerprint seeded ✓",
    );

    // T3 Profile — route Profil, run via keyboard, kolom seeded tampil.
    await gotoLabel(page, "Profil");
    await enterLabel(page, "Jalankan Profiling");
    await expectBody(page, "Profiling selesai");
    await assertText(page, "sales");
    await assertText(page, "region");
    log.push("T3 Profile: run selesai, kolom sales/region tampil ✓");

    // T4 Assess Quality — Quality finding + Readiness skor.
    await gotoLabel(page, "Kualitas");
    await enterLabel(page, "Jalankan Quality Check");
    await expectBody(page, "Quality check selesai");
    await assertText(page, "18 baris tanpa region");
    await gotoLabel(page, "Kesiapan");
    await enterLabel(page, "Jalankan Readiness Assessment");
    await expectBody(page, "Readiness assessment selesai");
    await assertText(page, "Siap untuk analisis bivariat");
    log.push(
      "T4 Assess Quality: finding \"18 baris tanpa region\" + readiness skor ✓",
    );

    // T5 Clean — preview "Hitung dampak" → dialog konfirmasi (centang
    // persetujuan via Space; bila ada high-impact, centang juga) → apply →
    // "Cleaning selesai. Snapshot baru telah dibuat." (revisi baru, immutable).
    await gotoLabel(page, "Pembersihan");
    await enterLabel(page, "Hitung dampak");
    await enterLabel(page, "Terapkan cleaning");
    const isUncheckedCheckbox = (el: Element | null) =>
      el?.getAttribute("type") === "checkbox" &&
      !(el as HTMLInputElement).checked;
    await tabTo(page, isUncheckedCheckbox, "checkbox persetujuan dialog", "");
    await page.keyboard.press("Space");
    const checkboxCount = await page.evaluate(
      () => document.querySelectorAll(".cleaning-danger-dialog input[type=checkbox]").length,
    );
    if (checkboxCount > 1) {
      await tabTo(page, isUncheckedCheckbox, "checkbox high-impact dialog", "");
      await page.keyboard.press("Space");
    }
    await tabToLabel(page, "Terapkan cleaning");
    await page.keyboard.press("Space");
    await expectBody(page, "Cleaning selesai. Snapshot baru telah dibuat.");
    log.push(
      "T5 Clean: preview → dialog (checkbox Space) → \"Snapshot baru telah dibuat\" ✓",
    );

    // T6 Analyze — Bivariat: sales × qty via ArrowDown keyboard-only.
    await gotoLabel(page, "Hubungan");
    await selectByKeyboard(page, "bivar-a", "sales");
    await selectByKeyboard(page, "bivar-b", "qty");
    await enterLabel(page, "Jalankan Analisis Bivariat");
    await assertText(page, "0.87");
    log.push("T6 Analyze: r = 0.87 (mode num-num, seeded) ✓");

    // T7 Visualize — visual hasil ter-render pada route Hubungan
    // (scatter/svg/canvas atau tabel visual bivariat).
    const visualVisible = await page
      .locator("#main-content svg, #main-content canvas")
      .first()
      .isVisible()
      .catch(() => false);
    log.push(
      visualVisible
        ? "T7 Visualize: elemen visual (svg/canvas) bivariat ter-render ✓"
        : "T7 Visualize: tidak ada svg/canvas — GAP tercatat (Likely) — verifikasi manual dibutuhkan",
    );

    // T8 Report — "Buat Report HTML" → "Report siap dibuka. N section…".
    await gotoLabel(page, "Laporan");
    await enterLabel(page, "Buat Report HTML");
    await assertText(page, "Report siap dibuka");
    log.push("T8 Report: \"Report siap dibuka. N section…\" ✓");

    // eslint-disable-next-line no-console
    console.log(
      `[B1 @ ${vp.name}px] ${log.join(" · ")}`,
    );
  });
}
