/** helpers.ts — P2-5: mock bridge pywebview untuk test Playwright. */
import type { Page } from "@playwright/test";

/** Protokol OK; command/query ok tanpa data (empty state deterministik). */
export async function mockBridge(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as unknown as {
      pywebview: {
        api: {
          get_protocol_info: () => Promise<unknown>;
          execute_command: () => Promise<unknown>;
          execute_query: () => Promise<unknown>;
          get_events: () => Promise<never[]>;
        };
      };
    };
    w.pywebview = {
      api: {
        get_protocol_info: async () => ({
          app_name: "EDA Workbench",
          app_version: "0.1.0",
          protocol_revision: 1,
          protocol_version: 1,
        }),
        execute_command: async () => ({
          ok: true,
          data: null,
          error: null,
          protocol_version: 1,
          correlation_id: null,
        }),
        execute_query: async () => ({
          ok: true,
          data: null,
          error: null,
          protocol_version: 1,
          correlation_id: null,
        }),
        get_events: async () => [],
      },
    };
  });
}
