/**
 * a11y-audit.spec.ts — bukti permanen UIUX-07 (Audit a11y & kontras
 * 5 level; kontrak DS-SHELL-001 §1 prinsip 5, §3 8-state, §6 responsif;
 * QA-SHELL-001 B5/B7).
 *
 * Memperkuat a11y.spec.ts (empty-state 8 route) dengan data seeded
 * walkthrough penuh: axe 0 critical pada 8 route, target kontrol ≥36px
 * (melalui label bagi input terbungkus), dan kontras terukur ≥4.5:1
 * per tingkat tipografi shell — termasuk caption 12px/muted. Tingkat
 * display 24px terdaftar di tokens tetapi tidak dirender shell (R4 =
 * konten fitur, D-DS2); bila suatu saat dirender, sweep ini langsung
 * mengukurnya karena mencakup SELURUH teks terlihat.
 *
 * Skip link + :focus-visible tetap (dibuktikan a11y.spec.ts; gate
 * menjalankan kedua berkas).
 */
import { expect, test } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { setupWalkthrough } from "./helpers";

/** 8 route kanonis (router.tsx ROUTES) beserta label nav Indonesianya. */
const ROUTES: Array<{ id: string; label: string }> = [
  { id: "setup", label: "Proyek" },
  { id: "explorer", label: "Dataset" },
  { id: "profiling", label: "Profil" },
  { id: "quality", label: "Kualitas" },
  { id: "cleaning", label: "Pembersihan" },
  { id: "bivariate", label: "Hubungan" },
  { id: "readiness", label: "Kesiapan" },
  { id: "report", label: "Laporan" },
];

async function gotoLabel(page: Page, label: string): Promise<void> {
  await page.getByRole("link", { name: label, exact: true }).click();
  await expect(page.locator("#main-content")).toBeVisible();
}

async function seededWalkthrough(page: Page): Promise<void> {
  await setupWalkthrough(page);
}

test.describe("UIUX-07 — audit a11y data seeded", () => {
  test("axe 0 critical pada 8 route dengan data seeded", async ({ page }) => {
    test.setTimeout(240_000);
    await seededWalkthrough(page);
    for (const { label } of ROUTES) {
      await gotoLabel(page, label);
      const results = await new AxeBuilder({ page }).withTags(["wcag2aa"]).analyze();
      const critical = results.violations.filter((v) => v.impact === "critical");
      expect(critical, `${label}: ${JSON.stringify(critical.map((v) => v.id))}`).toEqual([]);
    }
  });

  test("target kontrol ≥36px pada 8 route (data seeded)", async ({ page }) => {
    test.setTimeout(180_000);
    await seededWalkthrough(page);
    for (const { label } of ROUTES) {
      await gotoLabel(page, label);
      const small = await page.evaluate(() => {
        const out: Array<Record<string, unknown>> = [];
        const sels = "a[href], button, input, select, textarea, summary, [tabindex='0']";
        for (const el of document.querySelectorAll(sels)) {
          const cs = getComputedStyle(el);
          if (cs.visibility === "hidden" || cs.display === "none") continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          // Target efektif kontrol form terbungkus label = kotak label
          // (klik label mengaktifkan kontrol; WCAG 2.5.8).
          const label = el.closest("label");
          const box = label && label.getBoundingClientRect().height > 0
            ? label.getBoundingClientRect()
            : r;
          if (box.height < 36 || box.width < 36) {
            out.push({
              route: label ? undefined : undefined,
              tag: el.tagName,
              cls: String(el.className || "").slice(0, 30),
              text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 36),
              w: Math.round(box.width * 10) / 10,
              h: Math.round(box.height * 10) / 10,
            });
          }
        }
        return out;
      });
      expect(small, `${label}: ${JSON.stringify(small)}`).toEqual([]);
    }
  });

  test("kontras ≥4.5:1 per tingkat tipografi (24/18/15/14/12)", async ({ page }) => {
    test.setTimeout(180_000);
    await seededWalkthrough(page);
    // FS_TIERS: 24=display, 18=title, 15=subtitle, 14=body, 12=caption.
    // display tidak dirender shell (nol konsumen --shell-font-display;
    // R4 = domain kontrak fitur, D-DS2) — sweep mencakup semua teks
    // terlihat apa pun ukurannya, jadi tidak ada kategori buta.
    const LEVELS = ["24px", "18px", "15px", "14px", "12px"];
    const report = await page.evaluate((levels: string[]) => {
      const lum = (c: number[]) => {
        const f = (v: number) => {
          v /= 255;
          return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        };
        return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]);
      };
      const parse = (s: string) => {
        const m = s.match(/[\d.]+/g);
        return m ? m.map(Number) : [0, 0, 0, 1];
      };
      const bg = (el: Element) => {
        let node: Element | null = el;
        while (node) {
          const c = parse(getComputedStyle(node).backgroundColor);
          if ((c[3] ?? 1) > 0.05) return c;
          node = node.parentElement;
        }
        return [255, 255, 255, 1];
      };
      const perLevel: Record<string, { n: number; min: number }> = {};
      const all: { n: number; min: number; worst: Record<string, unknown> } = {
        n: 0,
        min: Infinity,
        worst: {},
      };
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const seen = new Set<Element>();
      while (walker.nextNode()) {
        const node = walker.currentNode;
        const txt = (node.nodeValue || "").trim();
        if (!txt) continue;
        const el = node.parentElement;
        if (!el || seen.has(el)) continue;
        seen.add(el);
        const cs = getComputedStyle(el);
        if (cs.visibility === "hidden" || cs.display === "none") continue;
        const fg = parse(cs.color);
        const b = bg(el);
        const L1 = lum(fg);
        const L2 = lum(b);
        const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
        all.n += 1;
        if (ratio < all.min) {
          all.min = ratio;
          all.worst = { text: txt.slice(0, 40), fs: cs.fontSize, color: cs.color };
        }
        if (levels.includes(cs.fontSize)) {
          const bucket = perLevel[cs.fontSize] ?? { n: 0, min: Infinity };
          bucket.n += 1;
          bucket.min = Math.min(bucket.min, ratio);
          perLevel[cs.fontSize] = bucket;
        }
      }
      return { perLevel, all: { n: all.n, min: all.min, worst: all.worst } };
    }, LEVELS);

    for (const level of LEVELS) {
      const bucket = report.perLevel[level];
      if (bucket) {
        expect(bucket.min, `tingkat ${level}: kontras minimum terukur`).toBeGreaterThanOrEqual(4.5);
      }
    }
    // Tingkat yang dirender shell wajib terukur (display di-exclude:
    // tidak dirender, lihat komentar fs di atas).
    for (const level of ["18px", "15px", "14px", "12px"]) {
      expect(report.perLevel[level]?.n ?? 0, `tingkat ${level} hadir di DOM`).toBeGreaterThan(0);
    }
    expect(report.all.min, `minimum dari ${report.all.n} elemen teks: ${JSON.stringify(report.all.worst)}`).toBeGreaterThanOrEqual(4.5);
  });

  test("tombol tutup toast ≥36px (toast sukses ekspor)", async ({ page }) => {
    test.setTimeout(120_000);
    await seededWalkthrough(page);
    // Pemicu toast sukses yang deterministik: ekspor dataset di route
    // Dataset (dataset.export mock sukses → toast.success 5 dtk).
    await gotoLabel(page, "Dataset");
    await page.getByRole("button", { name: "Pilih…" }).click();
    await page.getByRole("button", { name: "Export", exact: true }).click();
    const close = page.getByRole("button", { name: "Tutup notifikasi" }).first();
    await expect(close).toBeVisible({ timeout: 10_000 });
    const box = await close.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(36);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(36);
  });

  test("target ≥36px di viewport 900px (2 route spot-check)", async ({ page }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 900, height: 900 });
    await seededWalkthrough(page);
    for (const label of ["Proyek", "Laporan"]) {
      await gotoLabel(page, label);
      const small = await page.evaluate(() => {
        const out: Array<Record<string, unknown>> = [];
        const sels = "a[href], button, input, select, textarea, summary, [tabindex='0']";
        for (const el of document.querySelectorAll(sels)) {
          const cs = getComputedStyle(el);
          if (cs.visibility === "hidden" || cs.display === "none") continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          const labelEl = el.closest("label");
          const box = labelEl && labelEl.getBoundingClientRect().height > 0
            ? labelEl.getBoundingClientRect()
            : r;
          if (box.height < 36 || box.width < 36) {
            out.push({
              tag: el.tagName,
              text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 36),
              w: Math.round(box.width * 10) / 10,
              h: Math.round(box.height * 10) / 10,
            });
          }
        }
        return out;
      });
      expect(small, `${label} @900px: ${JSON.stringify(small)}`).toEqual([]);
    }
  });
});
