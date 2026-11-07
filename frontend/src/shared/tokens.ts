/**
 * tokens.ts — cermin numeric/warna untuk API canvas ECharts, yang tidak
 * dapat mengonsumsi var(--*) CSS. Berkas ini adalah satu-satunya tempat
 * nilai canvas; jangan tambah hex di komponen.
 *
 * Kesetaraan dengan tokens.css (ubah bersih di kedua berkas):
 *  - FONT_SIZE_SM (11)  = --font-size-sm
 *  - FONT_SIZE_MD (13)  = --font-size-md
 *  - FONT_SIZE_LG (15)  = --font-size-lg
 *  - CHART_TITLE_SIZE (14) = ukuran judul chart antara md/lg
 * Warna chart dibaca runtime dari CSS vars (cssVar) agar tetap satu
 * sumber; fallback kosong berarti ECharts memakai default — tidak ada
 * hex cadangan di sini (kontrak "hex hanya di tokens.css").
 */

export const FONT_SIZE_SM = 11;
export const FONT_SIZE_MD = 13;
export const FONT_SIZE_LG = 15;
export const CHART_TITLE_SIZE = 14;

/** Baca nilai CSS var dari :root; "" bila tidak tersedia. */
export function cssVar(name: string): string {
  if (typeof document === "undefined" || typeof getComputedStyle === "undefined") {
    return "";
  }
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
