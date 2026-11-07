import { defineConfig, devices } from "@playwright/test";

/**
 * P2-5 — Playwright config untuk a11y (axe) + visual regression.
 * Kartu P2-5 menyebut `tests/frontend/`; di repo ini dir test frontend
 * adalah `frontend/tests/` (deps Playwright hidup di frontend/package.json).
 * Dev server: Vite di 127.0.0.1:5173 (webServer otomatis).
 */
export default defineConfig({
  testDir: "./tests",
  workers: 1, // deterministik: hindari flake screenshot di bawah load paralel
  snapshotDir: "./tests/__screenshots__",
  // Tanpa suffix platform agar baseline lokal (Darwin) bisa dibandingkan di
  // CI Ubuntu; toleransi 15% di visual.spec menahan beda anti-aliasing font.
  snapshotPathTemplate: "{snapshotDir}/{testFilePath}/{arg}{ext}",
  fullyParallel: false,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:5173",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm exec vite --host 127.0.0.1 --port 5173 --strictPort",
    url: "http://127.0.0.1:5173",
    reuseExistingServer: true,
    timeout: 120000,
  },
});
