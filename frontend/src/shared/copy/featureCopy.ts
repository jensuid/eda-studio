/**
 * featureCopy.ts — sentralisasi copy fitur (B11, lanjutan D-S5 [A]).
 *
 * Modul ini memuat string UI milik layar-layar fitur
 * (ProfilingPage, QualityPage, BivariatePage, CleaningSection,
 * ReadinessPage, ReportPage, DatasetExplorer, ProjectSetup) yang
 * sebelumnya inline di komponen. ISI TEKS TIDAK BERUBAH: nilai di
 * sini adalah pindahan verbatim dari JSX/toast/aria-label/placeholder
 * yang ada — copy fitur ratified (mis. `SCREEN-*`) tetap menang,
 * modul ini hanya memindahkan sumbernya.
 *
 * DILARANG string UI yang memuat ID dokumen internal (`Doc04 §12`)
 * di headline (SCREEN §3.5 / §6 butir 6, diuji B11 di a11y.spec.ts).
 * Kata "Doc"/"§" tidak boleh muncul di nilai mana pun di bawah ini.
 * Bahasa Indonesia konsisten ([RATIFIED] D-S2).
 */

export const COMMON_COPY = {
  noActiveDataset: "Belum ada dataset aktif.",
  goToSetup: "Ke Setup",
  runProfilingFirst: "Jalankan profiling terlebih dahulu.",
  goToProfiling: "Ke Profiling",
} as const;

export const PROFILING_COPY = {
  emptyTitle: "Profiling",
  headingRun: "Profiling (run terpadu)",
  runNow: "Jalankan Profiling",
  running: "Profiling sedang berjalan…",
  loadingHistory: "Memuat riwayat profil…",
  historyTitle: "Riwayat Profil",
  profileTitle: "Profil",
  thColumn: "Kolom",
  thNullPct: "Null %",
  thUnique: "Unique",
  thType: "Tipe",
  snapshotsTitle: "Snapshots & Provenance",
  activate: "Aktifkan",
  showProvenance: "Lihat Provenance",
  hideProvenance: "Sembunyikan Provenance",
  insightsTitle: "Insights (Finding & Hypothesis)",
  findingTitle: "Finding",
  hypothesisTitle: "Hipotesis",
  acceptFinding: "Terima",
  archiveFinding: "Arsipkan",
  findingTitlePlaceholder: "Judul temuan",
  findingTitleLabel: "Judul temuan",
  findingDetailPlaceholder: "Detail temuan",
  findingDetailLabel: "Detail temuan",
  addFinding: "Tambah Finding",
  hypothesisPlaceholder: "Pernyataan hipotesis",
  hypothesisLabel: "Pernyataan hipotesis",
  addHypothesis: "Tambah Hipotesis",
  investigate: "Investigasi",
  toastProfileDone: "Profiling selesai.",
  toastProfileFail: (message: string) => `Profiling gagal: ${message}`,
  toastOpenFail: (message: string) => `Gagal membuka profil: ${message}`,
  toastFindingAdded: "Finding ditambahkan.",
  toastFindingFail: (message: string) => `Finding gagal: ${message}`,
  toastFindingStatus: "Status finding diperbarui.",
  toastFindingStatusFail: (message: string) => `Ubah status finding gagal: ${message}`,
  toastHypothesisAdded: "Hipotesis ditambahkan.",
  toastHypothesisFail: (message: string) => `Hipotesis gagal: ${message}`,
  toastHypothesisStatus: "Status hipotesis diperbarui.",
  toastHypothesisStatusFail: (message: string) => `Ubah status hipotesis gagal: ${message}`,
  toastSnapshotActivated: "Snapshot diaktifkan.",
  toastSnapshotFail: (message: string) => `Aktivasi snapshot gagal: ${message}`,
};

export const QUALITY_COPY = {
  emptyTitle: "Quality",
  heading: "Quality Check",
  runNow: "Jalankan Quality Check",
  running: "Quality check berjalan…",
  thRule: "Aturan",
  thColumn: "Kolom",
  thSeverity: "Severity",
  thFinding: "Temuan",
  thEvidence: "Bukti",
  toastDone: "Quality check selesai.",
  toastFail: (message: string) => `Quality check gagal: ${message}`,
  summary: (summary: string, ok: number, checks: number, problems: number) =>
    `${summary} (${ok}/${checks} lolos, ${problems} bermasalah)`,
};

export const BIVARIAT_COPY = {
  emptyTitle: "Bivariat",
} as const;

export const CLEANING_COPY = {
  heading: "Cleaning",
  emptyNeedQuality: "Jalankan Quality Check terlebih dahulu.",
  staleQuality: "Hasil mungkin usang — jalankan ulang.",
  previewImpactAction: "Hitung dampak",
  applyAction: "Terapkan cleaning",
  previewError: "Tidak dapat menghitung dampak. Silakan coba lagi.",
  staleChanged: "Snapshot telah berubah. Hitung ulang dampak.",
  runError: "Cleaning gagal. Silakan coba lagi.",
  completedMessage: "Cleaning selesai. Snapshot baru telah dibuat.",
  newSnapshotInfo: (
    childSnapshot: string,
    childFingerprint: string,
    rowsBefore: number,
    rowsAfter: number,
  ) => `Snapshot baru: ${childSnapshot} · ${childFingerprint}… · ${rowsBefore} → ${rowsAfter} baris`,
  activateNew: "Gunakan snapshot baru",
  filledRows: (rows: number, columns: string) =>
    `Baris diisi: ${rows} pada kolom ${columns}.`,
  cancelled: "Cleaning dibatalkan. Tidak ada snapshot baru.",
};

export const READINESS_COPY = {
  emptyTitle: "Readiness",
  heading: "Modeling Readiness",
  runNow: "Jalankan Readiness Assessment",
  assessing: "Assessing…",
  thCheck: "Check",
  thCategory: "Kategori",
  thColumn: "Kolom",
  thStatus: "Status",
  thResult: "Hasil",
  thEvidence: "Bukti",
  exampleRows: (rows: string) => `— baris: ${rows}`,
  summary: (
    summary: string,
    ok: number,
    checks: number,
    problems: number,
    rows: number,
    columns: number,
    numeric: number,
    categorical: number,
  ) =>
    `${summary} (${ok}/${checks} lolos, ${problems} bermasalah) — ${rows} baris, ${columns} kolom (${numeric} numerik, ${categorical} kategorikal)`,
  toastDone: "Readiness assessment selesai.",
  toastFail: (message: string) => `Readiness assessment gagal: ${message}`,
};

export const REPORT_COPY = {
  emptyTitle: "Report",
} as const;

export const DATASET_COPY = {
  emptyTitle: "Dataset",
  histogramTitle: "Histogram",
  numericColumnPlaceholder: "Nama kolom numerik",
  numericColumnLabel: "Nama kolom numerik",
  running: "Menjalankan…",
  runHistogram: "Jalankan Histogram",
  planTitle: "Analysis Plan",
  planIntro: "Susun rencana langkah analisis, setujui, lalu jalankan sekuensial.",
  loadingPlans: "Memuat plan…",
  approveAction: "Setujui",
  executeAction: "Jalankan",
  noPlansYet: "Belum ada plan untuk dataset ini.",
  makePlanTitle: "Membuat Plan",
  stepKindLabel: (step: number) => `Jenis langkah ${step}`,
  stepColumnLabel: (step: number) => `Nama kolom untuk langkah ${step}`,
  firstColumnPlaceholder: "Kolom pertama",
  firstColumnLabel: (step: number) => `Kolom pertama untuk langkah ${step}`,
  secondColumnPlaceholder: "Kolom kedua",
  secondColumnLabel: (step: number) => `Kolom kedua untuk langkah ${step}`,
  stepScopeLabel: (step: number) => `Ruang laporan untuk langkah ${step}`,
  removeStep: "Hapus",
  addStep: "Tambah Langkah",
  createPlan: "Buat Plan",
  exportTitle: "Export",
  exportFormatLabel: "Format export",
  formatCsv: "CSV",
  formatParquet: "Parquet",
  saveExportFile: "Simpan hasil export",
  exportDestPlaceholder: (format: string) => `Path file tujuan (.${format})`,
  exportAction: "Export",
  exportResult: (filePath: string, sizeKb: string, rowCount: number) =>
    `Export: ${filePath} · ${sizeKb} KB · ${rowCount} rows`,
  loadingPreview: "Memuat preview…",
  previewTitle: (totalRows: number, truncated: boolean) =>
    `Preview (${totalRows} rows${truncated ? ", truncated" : ""})`,
  confirmExportTitle: "Export dataset?",
  confirmExportDesc: (formatUpper: string, destPath: string) =>
    `Dataset akan di-export sebagai ${formatUpper} ke ${destPath}. File tujuan yang sudah ada akan ditimpa.`,
  toastExportDone: "Export selesai.",
  toastExportFail: (message: string) => `Export gagal: ${message}`,
  toastHistogramDone: "Histogram selesai.",
  toastHistogramFail: (message: string) => `Histogram gagal: ${message}`,
  toastPlanApproved: "Plan disetujui.",
  toastPlanApproveFail: (message: string) => `Menyetujui plan gagal: ${message}`,
  toastPlanExecuted: "Analysis plan dieksekusi.",
  toastPlanExecuteFail: (message: string) => `Eksekusi analysis plan gagal: ${message}`,
  toastPlanCreated: "Analysis plan dibuat.",
  toastPlanCreateFail: (message: string) => `Membuat analysis plan gagal: ${message}`,
};

export const SETUP_COPY = {
  createProjectTitle: "Buat Project",
  projectNameRequired: "Nama project wajib diisi.",
  projectNamePlaceholder: "Nama project",
  projectNameLabel: "Nama project",
  createAction: "Buat",
  projectLabel: (projectId: string) => `Project: ${projectId}`,
  importTitle: "Import Dataset (CSV)",
  selectDatasetFile: "Pilih file dataset",
  datasetPathPlaceholder: "Path file .csv/.xlsx/.parquet",
  datasetNameRequired: "Nama dataset wajib diisi.",
  datasetNamePlaceholder: "Nama dataset",
  datasetNameLabel: "Nama dataset",
  importAction: "Import",
  snapshotInfo: (snapshotId: string, rowCount: number, fingerprintPrefix: string) =>
    `Snapshot ${snapshotId} · ${rowCount} rows · sha256 ${fingerprintPrefix}…`,
  backupRestoreTitle: "Backup & Restore",
  saveBackupFile: "Simpan backup proyek",
  selectBackupFile: "Pilih file backup",
  backupPathPlaceholder: "Path file backup (.zip)",
  selectRestoreFolder: "Pilih folder tujuan restore",
  restoreFolderPlaceholder: "Folder tujuan restore (baru/kosong)",
  backupAction: "Buat Backup",
  restoreAction: "Restore",
  backupResult: (
    filePath: string,
    sizeKb: string,
    shaPrefix: string,
    version: string,
  ) => `Backup: ${filePath} · ${sizeKb} KB · db sha256 ${shaPrefix}… · v${version}`,
  restoreResult: (projectId: string, destRoot: string, shaPrefix: string) =>
    `Restore selesai: ${projectId} → ${destRoot} · db sha256 ${shaPrefix}…`,
  portableTitle: "Export Portabel (G6-2)",
  portableIntro:
    "Paket ZIP berisi project database, snapshots, dan manifest untuk serah terima ke mesin lain.",
  savePortableFile: "Simpan export portabel",
  portablePathPlaceholder: "Path file export (.zip)",
  portableAction: "Export Portabel",
  portableResult: (
    filePath: string,
    sizeKb: string,
    kind: string,
    shaPrefix: string,
  ) => `Export: ${filePath} · ${sizeKb} KB · kind ${kind} · db sha256 ${shaPrefix}…`,
  diagnosticTitle: "Diagnostic Bundle",
  diagnosticIntro:
    "Bundle Basic yang ter-redaksi: metadata, health check, recent errors. Tanpa data mentah/DB.",
  saveDiagnosticFile: "Simpan diagnostic bundle",
  diagnosticPathPlaceholder: "Path file bundle (.zip)",
  diagnosticAction: "Buat Diagnostic",
  diagnosticResult: (
    path: string,
    fileCount: number,
    pathsRedacted: number,
    shaPrefix: string,
  ) =>
    `Diagnostic: ${path} · ${fileCount} file · paths redacted ${pathsRedacted} · sha256 ${shaPrefix}…`,
  confirmBackupTitle: "Buat backup proyek?",
  confirmRestoreTitle: "Restore backup proyek?",
  confirmDiagnosticTitle: "Buat diagnostic bundle?",
  confirmBackupDesc: (dest: string) =>
    `Backup akan ditulis ke ${dest}. Tidak ada data yang dihapus.`,
  confirmRestoreDesc: (archive: string, root: string) =>
    `Backup ${archive} akan di-restore ke folder baru ${root}. Folder tujuan harus baru atau kosong.`,
  confirmDiagnosticDesc: (dest: string) =>
    `Bundle diagnostic ter-redaksi akan ditulis ke ${dest}. Tanpa data mentah atau isi database.`,
  toastProjectCreated: (name: string) => `Project dibuat: ${name}`,
  toastProjectFail: (message: string) => `Gagal membuat project: ${message}`,
  toastDatasetImported: (name: string) => `Dataset diimport: ${name}`,
  toastImportFail: (message: string) => `Gagal import: ${message}`,
  toastBackupCreated: "Backup dibuat.",
  toastBackupFail: (message: string) => `Backup gagal: ${message}`,
  toastRestoreDone: "Restore selesai.",
  toastRestoreFail: (message: string) => `Restore gagal: ${message}`,
  toastPortableDone: "Export portabel selesai.",
  toastPortableFail: (message: string) => `Export portabel gagal: ${message}`,
  toastDiagnosticCreated: "Diagnostic bundle dibuat.",
  toastDiagnosticFail: (message: string) => `Diagnostic gagal: ${message}`,
};
