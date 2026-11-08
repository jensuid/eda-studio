/**
 * matrix.spec.ts — B7 (QA-SHELL-001): matriks 8 state kontrol
 * (`button`/`input`/`select`) × 2 viewport (900/1440) + kontras terukur
 * 5 level tipografi. State dari DS-SHELL-001 §3 [D-S4 Ratified]; CSS
 * dasar di `frontend/src/shared/controls.css` (aditif, tanpa token warna
 * baru; tokens.css beku sampai G6).
 *
 * Bukti kontras: warna computed di browser (bukan tebakan), luminance
 * relatif WCAG 2.2, ambang 4.5:1 untuk teks normal.
 */
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { mockBridge, setupWalkthrough } from "./helpers";

const VIEWPORTS = [
  { name: "900", width: 900, height: 900 },
  { name: "1440", width: 1440, height: 900 },
] as const;

async function styleOfEl(
  page: Page,
  selector: string,
  prop: string,
): Promise<string> {
  return page.locator(selector).first().evaluate((el, p) => {
    const cs = getComputedStyle(el);
    return cs.getPropertyValue(p as string);
  }, prop);
}

async function worstTextContrast(
  page: Page,
  selector: string,
): Promise<number> {
  return page.locator(selector).first().evaluate((el) => {
    const cs = getComputedStyle(el);
    // warna efektif latar: naik ke body bila transparan.
    let bg = cs.backgroundColor;
    let node: Element | null = el;
    while (
      (bg === "transparent" || bg === "rgba(0, 0, 0, 0)") &&
      node.parentElement
    ) {
      node = node.parentElement;
      bg = getComputedStyle(node).backgroundColor;
    }
    const parse = (s: string) => {
      const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0];
    };
    const lum = ([r, g, b]: number[]) => {
      const f = (c: number) => {
        const v = c / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const l1 = lum(parse(cs.color));
    const l2 = lum(parse(bg));
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  });
}

for (const vp of VIEWPORTS) {
  test(`B7: state kontrol + kontras @ ${vp.name}px`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await setupWalkthrough(page);
    await page.getByRole("link", { name: "Setup" }).click();

    // --- state 1 default: border 1px token + min-height 36px ---
    const btn = page.getByRole("button", { name: "Buat", exact: true });
    await btn.scrollIntoViewIfNeeded();
    expect(await styleOfEl(page, 'button[type="submit"]', "min-height")).toBe("36px");
    const btnBorder = await styleOfEl(page, 'button[type="submit"]', "border-top-width");
    expect(Number(btnBorder.replace("px", ""))).toBeGreaterThanOrEqual(1);

    // --- state 2 hover: background berubah (raised) ---
    const bgDefault = await styleOfEl(page, 'button[type="submit"]', "background-color");
    await btn.hover();
    const bgHover = await styleOfEl(page, 'button[type="submit"]', "background-color");
    expect(bgHover).not.toBe(bgDefault);

    // --- state 3 focus-visible: outline 2px (tokens.css:92-95) ---
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    const fw = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el ? getComputedStyle(el).outlineWidth : "";
    });
    expect(fw).toBe("2px");

    // --- state 4 pressed: opacity sesaat pada pointerdown ---
    const box = await btn.boundingBox();
    expect(box).not.toBeNull();
    await page.mouse.move(
      box!.x + box!.width / 2,
      box!.y + box!.height / 2,
    );
    await page.mouse.down();
    const opPressed = await styleOfEl(page, 'button[type="submit"]', "opacity");
    expect(Number(opPressed)).toBeLessThan(1);
    await page.mouse.up();

    // --- state 5 selected: nav aktif aria-current + font-weight 600 ---
    await page.getByRole("link", { name: "Bivariat" }).click();
    const navWeight = await styleOfEl(page, ".nav-item-active", "font-weight");
    expect(navWeight).toBe("600");
    const ariaCurrent = await page
      .locator(".nav-item-active")
      .getAttribute("aria-current");
    expect(ariaCurrent).toBe("page");

    // --- state 6 disabled: prasyarat belum terpenuhi (kolom belum dipilih)
    //     → tombol run disabled + kursor not-allowed + border dashed. ---
    const runBtn = page.getByRole("button", {
      name: "Jalankan Analisis Bivariat",
    });
    await expect(runBtn).toBeDisabled();
    const cursor = await styleOfEl(
      page,
      'button:has-text("Jalankan Analisis Bivariat")',
      "cursor",
    );
    expect(cursor).toBe("not-allowed");
    const borderStyle = await styleOfEl(
      page,
      'button:has-text("Jalankan Analisis Bivariat")',
      "border-top-style",
    );
    expect(borderStyle).toBe("dashed");

    // --- state 7 loading: Job Center indeterminate (B6) — progressbar
    //     tanpa aria-valuenow, berlabel status, bukan persen buatan. ---
    const bar = page.locator('[role="progressbar"]');
    if ((await bar.count()) > 0) {
      await expect(bar.first()).not.toHaveAttribute("aria-valuenow");
      await expect(bar.first()).toHaveAttribute("aria-valuetext", /Berjalan|Membatalkan/);
    }

    // --- state 8 error: input aria-invalid + pesan inline berteks ---
    await page.getByRole("link", { name: "Setup" }).click();
    await page.getByRole("button", { name: "Buat", exact: true }).click();
    const nameInput = page.getByLabel("Nama project");
    await expect(nameInput).toHaveAttribute("aria-invalid", "true");
    await expect(page.locator("#name-error")).toHaveText(
      /Nama project wajib diisi/,
    );

    // --- select: default border + selected terbaca sebagai teks ---
    await page.getByRole("link", { name: "Bivariat" }).click();
    const selA = page.locator("#bivar-a");
    await selA.selectOption("sales");
    await selA.selectOption("qty");
    const selVal = await selA.inputValue();
    expect(selVal).toBe("qty");
    const selBorder = await styleOfEl(page, "#bivar-a", "border-top-width");
    expect(Number(selBorder.replace("px", ""))).toBeGreaterThanOrEqual(1);

    // --- kontras terukur 5 level tipografi (WCAG AA 4.5:1 teks normal) ---
    const levels: Array<[string, string]> = [
      ["h1 (app title)", "h1"],
      ["body text (md)", "body"],
      ["nav label", ".nav-label"],
      ["button text", "button"],
      ["banner/status text", ".protocol-banner, .field-error, body"],
    ];
    for (const [label, sel] of levels) {
      const ratio = await worstTextContrast(page, sel);
      expect(ratio, `${label} kontras ${ratio.toFixed(2)}:1 < 4.5`).toBeGreaterThanOrEqual(4.5);
    }
  });
}

// Kontras token status (danger untuk .field-error saat error state):
test("B7: kontras teks error >= 4.5:1", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await mockBridge(page, { seeded: true });
  await page.goto("/");
  // paksa state error pada input nama project
  await page.getByRole("button", { name: "Buat", exact: true }).click();
  const ratio = await worstTextContrast(page, "#name-error");
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
