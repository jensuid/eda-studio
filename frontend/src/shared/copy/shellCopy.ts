/**
 * shellCopy.ts — B11 [D-S5 Ratified]: SATU modul copy shell.
 *
 * Copy fitur ratified (mis. `SCREEN-CLEAN-001` §Copy literal) menang atas
 * deck ini; modul ini hanya memuat string milik layer shell: banner
 * global, headline section non-fitur, dan CTA shell. DILARANG string UI
 * yang memuat ID dokumen internal (`Doc04 §12`), `error.message` mentah,
 * atau hash/byte di headline (SCREEN §3.5 / §6 butir 6).
 * Bahasa Indonesia konsisten ([RATIFIED] D-S2).
 */
export const SHELL_COPY = {
  appTitle: "EDA Workbench",
  skipToMain: "Lewati ke konten utama",
  unknownRoute: "Rute tidak dikenal — kembali ke Setup.",
  resumeFailedPrefix: "Tidak dapat memulihkan konteks tersimpan",
  startFresh: "Mulai baru",
  jobCenterToggle: "Job Center",
} as const;
