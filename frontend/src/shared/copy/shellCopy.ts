/**
 * shellCopy.ts — B11 [D-S5 Ratified]: SATU modul copy shell.
 *
 * Copy fitur ratified (mis. `SCREEN-CLEAN-001` §Copy literal) menang atas
 * deck ini; modul ini hanya memuat string milik layer shell: banner
 * global, headline section non-fitur, dan CTA shell. DILARANG string UI
 * yang memuat ID dokumen internal (`Doc04 §12`), `error.message` mentah,
 * atau hash/byte di headline (SCREEN §3.5 / §6 butir 6).
 * Bahasa Indonesia konsisten ([RATIFIED] D-S2).
 *
 * D-F6 (FLOW-SHELL-001 §2.5): satu kanal error per concern. Headline di
 * bawah ini di-branch dari `error.code` (ErrorContract) oleh
 * `shared/copy/errorCopy.ts` — pesan backend mentah hanya boleh muncul
 * di detail diagnostik yang dapat disalin, tidak pernah di headline.
 */
export const SHELL_COPY = {
  appTitle: "EDA Workbench",
  skipToMain: "Lewati ke konten utama",
  unknownRoute: "Rute tidak dikenal — kembali ke Setup.",
  resumeFailedPrefix: "Tidak dapat memulihkan konteks tersimpan",
  startFresh: "Mulai baru",
  jobCenterToggle: "Job Center",
  close: "Tutup",
  tryAgain: "Coba lagi",
  backToSetup: "Kembali ke Setup",
  // --- Protokol / backend (banner persisten app bar, critical) ---
  protocolRevisionMissing: "Backend tidak mengirim revisi protokol.",
  protocolMismatch: (revision: number, expected: number) =>
    `Versi protokol tidak cocok: backend revisi ${revision}, frontend mengharapkan ${expected}.`,
  backendUnavailable:
    "Backend tidak tersedia. Fitur yang butuh backend belum bisa dipakai.",
  // --- Pemulihan crash (banner di main, warning) ---
  recoveryFailedNotFound: "Autosave pemulihan tidak ditemukan.",
  recoveryFailedConflict:
    "Pemulihan bentrok dengan project yang sudah ada.",
  recoveryFailedValidation: "Permintaan pemulihan tidak valid.",
  recoveryFailedPermission: "Akses pemulihan ditolak.",
  recoveryFailedUnsupported: "Format autosave tidak didukung.",
  recoveryFailedGeneric: "Pemulihan gagal. Autosave belum dipulihkan.",
  // --- Versi / update (region versi saja, info) ---
  updateFailedNotFound: "Pemeriksaan update tidak menemukan rilis terbaru.",
  updateFailedConflict: "Pemeriksaan update bentrok dengan proses lain.",
  updateFailedValidation: "Permintaan pemeriksaan update tidak valid.",
  updateFailedPermission: "Akses pemeriksaan update ditolak.",
  updateFailedUnsupported: "Sumber rilis tidak didukung.",
  updateFailedGeneric:
    "Pemeriksaan update gagal. Versi saat ini tidak berubah.",
  recoveryTitle: "Aplikasi berhenti tanpa clean exit",
  recoveryBody:
    "Autosave terakhir tersedia dan dapat dipulihkan ke root baru tanpa mengubah project saat ini.",
  recoveryCreatedAt: "Dibuat:",
  recoveryPath: "Path:",
  restoreAction: "Pulihkan autosave",
  restoring: "Memulihkan…",
  recoveryDone: "Recovery selesai",
  recoveryDoneBody: (projectId: string, destRoot: string) =>
    `Project ${projectId} dipulihkan ke ${destRoot}.`,
  ok: "OK",
  versionPanelLabel: "Informasi versi dan update",
  versionLabel: "Versi",
  checkUpdate: "Periksa update",
  checkingUpdate: "Memeriksa…",
  latestRelease: (version: string) => `Rilis terbaru: ${version}.`,
  updateAvailable: "Update tersedia.",
  upToDate: "Sudah versi terbaru.",
  releaseFeedUnreadable: "Rilis feed tidak dapat dibaca.",
  // --- Render crash (ErrorBoundary per-route, critical) ---
  renderCrashTitle: (label: string) => `Terjadi kesalahan di ${label}`,
  renderCrashBody:
    "Halaman ini tidak dapat ditampilkan. Data Anda tidak hilang.",
  // --- Job lifecycle (Job Center) ---
  jobsLoadFailed: "Daftar job tidak dapat dimuat.",
  jobEmpty: "Belum ada job. Jalankan analisis dari fitur mana pun.",
  jobCenterTitle: "Job Center",
  // --- Detail diagnostik (dapat disalin) ---
  diagnosticDetail: "Detail diagnostik",
  copyDiagnostic: "Salin detail",
  copiedDiagnostic: "Detail disalin",
} as const;
