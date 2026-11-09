/**
 * featureCopy.ts — sentralisasi copy fitur (B11, lanjutan D-S5 [A]).
 *
 * Modul ini memuat string UI milik layar-layar fitur
 * (ProfilingPage, QualityPage, BivariatePage, CleaningSection,
 * ReadinessPage, ReportPage, DatasetExplorer, ProjectSetup, plus
 * komponen fitur Cleaning*, ReportSection, PdfSection, BivariateSection,
 * chart Bivariate/Histogram, dan kontrol proyek FilePathInput /
 * DestructiveConfirmDialog) yang
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

/**
 * D-F7 (UIUX-06): headline gagal per `error.code` untuk kanal fitur —
 * dipakai bersama `describeFeatureError` (`errorCopy.ts`). `generic` adalah
 * fallback untuk code tanpa peta. Pesan mentah TIDAK PERNAH masuk copy
 * ini; ia hanya hidup di `detail` diagnostik (DiagnosticDetail).
 */
const failByCode = (op: string): Record<string, string> => ({
  NOT_FOUND: `${op} — tidak ditemukan.`,
  CONFLICT: `${op} — bentrok dengan proses lain.`,
  VALIDATION_ERROR: `${op} — permintaan tidak valid.`,
  PERMISSION_DENIED: `${op} — akses ditolak.`,
  UNSUPPORTED_FORMAT: `${op} — format tidak didukung.`,
});

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
  profileFail: {
    byCode: failByCode("Profiling gagal"),
    generic: "Profiling gagal. Silakan coba lagi.",
  },
  openProfileFail: {
    byCode: failByCode("Gagal membuka profil"),
    generic: "Gagal membuka profil. Silakan coba lagi.",
  },
  toastFindingAdded: "Finding ditambahkan.",
  findingFail: {
    byCode: failByCode("Finding gagal"),
    generic: "Finding gagal. Silakan coba lagi.",
  },
  toastFindingStatus: "Status finding diperbarui.",
  findingStatusFail: {
    byCode: failByCode("Ubah status finding gagal"),
    generic: "Ubah status finding gagal. Silakan coba lagi.",
  },
  toastHypothesisAdded: "Hipotesis ditambahkan.",
  hypothesisFail: {
    byCode: failByCode("Hipotesis gagal"),
    generic: "Hipotesis gagal. Silakan coba lagi.",
  },
  toastHypothesisStatus: "Status hipotesis diperbarui.",
  hypothesisStatusFail: {
    byCode: failByCode("Ubah status hipotesis gagal"),
    generic: "Ubah status hipotesis gagal. Silakan coba lagi.",
  },
  toastSnapshotActivated: "Snapshot diaktifkan.",
  snapshotFail: {
    byCode: failByCode("Aktivasi snapshot gagal"),
    generic: "Aktivasi snapshot gagal. Silakan coba lagi.",
  },
  staleTitle: "Hasil profiling mungkin usang",
  staleReason: "Dataset aktif telah berubah sejak profiling ini dijalankan.",
  staleDependency: (datasetName: string) =>
    `Dependency yang berubah: dataset ${datasetName} aktif — snapshot saat hasil dibuat bukan snapshot aktif.`,
  staleImpact:
    "Dampak: tabel profil di bawah ini mungkin tidak mewakili data saat ini; quality check dan analisis yang memakai hasil ini juga dapat terpengaruh.",
  staleOldArtifact:
    "Hasil lama tetap ditampilkan di bawah dan dapat dilihat, tetapi bukan hasil yang berlaku untuk snapshot aktif.",
  staleRecommend:
    "Rekomendasi: jalankan ulang profiling untuk snapshot aktif. Refresh hanya berjalan setelah Anda menekan tombol persetujuan di bawah ini.",
  staleCta: "Saya setuju — perbarui profiling",
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
  qualityFail: {
    byCode: failByCode("Quality check gagal"),
    generic: "Quality check gagal. Silakan coba lagi.",
  },
  summary: (summary: string, ok: number, checks: number, problems: number) =>
    `${summary} (${ok}/${checks} lolos, ${problems} bermasalah)`,
  staleTitle: "Hasil quality check mungkin usang",
  staleReason: "Dataset aktif telah berubah sejak quality check ini dijalankan.",
  staleDependency: (datasetName: string) =>
    `Dependency yang berubah: dataset ${datasetName} aktif — snapshot saat hasil dibuat bukan snapshot aktif.`,
  staleImpact:
    "Dampak: temuan di bawah ini mungkin tidak mewakili data saat ini; cleaning dan laporan yang memakai hasil ini juga dapat terpengaruh.",
  staleOldArtifact:
    "Hasil lama tetap ditampilkan di bawah dan dapat dilihat, tetapi bukan hasil yang berlaku untuk snapshot aktif.",
  staleRecommend:
    "Rekomendasi: jalankan ulang quality check untuk snapshot aktif. Refresh hanya berjalan setelah Anda menekan tombol persetujuan di bawah ini.",
  staleCta: "Saya setuju — perbarui quality check",
};

export const BIVARIAT_COPY = {
  emptyTitle: "Bivariat",
  heading: "Analisis Bivariat",
  columnALabel: "Kolom A",
  columnBLabel: "Kolom B",
  choosePlaceholder: "— pilih —",
  modeNumNum: "Korelasi (numerik × numerik)",
  modeCatNum: "Grup (kategorikal × numerik)",
  modeNumCat: "Grup (numerik × kategorikal)",
  modeCatCat: "Silang (kategorikal × kategorikal)",
  modeUnsupported: "Tipe tidak didukung",
  pairError: "Pilih dua kolom yang berbeda.",
  unsupportedPair: "Pasangan tipe ini tidak didukung untuk analisis bivariat.",
  run: "Jalankan Analisis Bivariat",
  running: "Menghitung bivariat…",
  bivariateFail: {
    byCode: failByCode("Analisis bivariat gagal"),
    generic: "Analisis bivariat gagal. Silakan coba lagi.",
  },
  stale: "Hasil mungkin usang — jalankan ulang.",
  constantColumn: "Kolom ini konstan.",
  undefinedCorrelation: "Korelasi tidak terdefinisi untuk kolom konstan.",
  noPairs: "Tidak ada pasangan nilai untuk dihitung.",
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
  chooseOperation: "Pilih operasi",
  opDropDuplicates: "Hapus baris duplikat",
  opDropDuplicatesHint: "Snapshot-wide, duplikat persis",
  opDropMissing: "Hapus baris hilang",
  opDropMissingHint: "Baris dengan nilai hilang di kolom dipilih",
  opImpute: "Isi nilai hilang",
  opImputeHint: "Isi sel kosong pada satu kolom",
  strategyMean: "Rata-rata (mean)",
  strategyMedian: "Median",
  strategyMode: "Modus (mode)",
  strategyConstant: "Konstanta",
  constantNumericError: "Masukkan angka yang valid untuk kolom ini.",
  constantTextError: "Masukkan teks yang tidak kosong.",
  dropDuplicatesNote:
    "Berlaku snapshot-wide. Duplikat berakhir dihitung ulang dari snapshot aktif.",
  columnsUnionLegend: "Kolom (gabungan — union)",
  columnLabel: "Kolom",
  choosePlaceholder: "— pilih —",
  emptyColumnNote: "Kolom ini kosong — hanya konstanta yang tersedia.",
  strategyLegend: "Strategi",
  strategyUnavailable: " — Strategi ini tidak tersedia untuk tipe kolom ini.",
  constantValueLabel: "Nilai konstanta",
  constantValuePlaceholder: "Nilai pengisi",
  impactColumns: (columns: string) => `Kolom: ${columns}`,
  impactRows: (before: number, after: number, affected: number, pct: number) =>
    `Baris: ${before} → ${after} · Terdampak: ${affected} (${pct}%)`,
  impactFilled: (filled: number) => `Diisi: ${filled} sel`,
  impactPerColumn: (column: string, affected: number) =>
    `${column}: ${affected} baris`,
  impactParent: (fingerprintPrefix: string) =>
    `Snapshot induk: ${fingerprintPrefix}…`,
  impactNoDuplicates: "Tidak ditemukan baris duplikat pada snapshot ini.",
  impactNoMissing: "Tidak ada nilai kosong pada kolom yang dipilih.",
  impactCalculating: "Menghitung dampak…",
  confirmTitle: "Terapkan cleaning?",
  confirmDesc:
    "Operasi ini bersifat destruktif. Periksa ringkasan dampak berikut sebelum melanjutkan.",
  confirmOperationLine: (operation: string, columns: string) =>
    `Operasi: ${operation} · Kolom: ${columns}`,
  confirmSourceUnchanged:
    "Snapshot sumber tidak diubah. Hasilnya disimpan sebagai snapshot baru dan perlu diaktifkan secara manual.",
  confirmImputeAgree: (rows: number, columns: string) =>
    `Saya memahami ${rows} sel akan diisi pada kolom ${columns}.`,
  confirmDeleteAgree: (rows: number) =>
    `Saya memahami ${rows} baris akan dihapus dari snapshot ini.`,
  confirmHighImpact: "Lebih dari setengah baris akan dihapus.",
  cancel: "Batal",
  applying: "Menerapkan cleaning…",
  apply: "Terapkan cleaning",
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
  readinessFail: {
    byCode: failByCode("Readiness assessment gagal"),
    generic: "Readiness assessment gagal. Silakan coba lagi.",
  },
  staleTitle: "Hasil readiness assessment mungkin usang",
  staleReason: "Dataset aktif telah berubah sejak readiness assessment ini dijalankan.",
  staleDependency: (datasetName: string) =>
    `Dependency yang berubah: dataset ${datasetName} aktif — snapshot saat hasil dibuat bukan snapshot aktif.`,
  staleImpact:
    "Dampak: ringkasan kesiapan di bawah ini mungkin tidak mewakili data saat ini; keputusan pemodelan yang memakai hasil ini juga dapat terpengaruh.",
  staleOldArtifact:
    "Hasil lama tetap ditampilkan di bawah dan dapat dilihat, tetapi bukan hasil yang berlaku untuk snapshot aktif.",
  staleRecommend:
    "Rekomendasi: jalankan ulang readiness assessment untuk snapshot aktif. Refresh hanya berjalan setelah Anda menekan tombol persetujuan di bawah ini.",
  staleCta: "Saya setuju — perbarui readiness assessment",
};

export const REPORT_COPY = {
  emptyTitle: "Report",
  heading: "Report HTML",
  scopeAll: "Semua analisis yang ada",
  scopeProfileQuality: "Profiling + Quality saja",
  scopeWithCharts: "+ Histogram",
  scopeWithVisuals: "+ Bivariate",
  scopeLegend: "Cakupan",
  create: "Buat Report HTML",
  profilingFingerprint: (fingerprintPrefix: string) =>
    `Profiling · fingerprint ${fingerprintPrefix}…`,
  staleSource: "Usang — Jalankan ulang.",
  staleList: "Ada hasil usang — lihat daftar sebelum mengunduh.",
  creating: "Membuat report…",
  reportCreateFail: {
    byCode: failByCode("Report gagal dibuat"),
    generic: "Report gagal dibuat. Silakan coba lagi.",
  },
  ready: (sections: number, fingerprintPrefix: string, bytes: number) =>
    `Report siap dibuka. ${sections} section · fingerprint ${fingerprintPrefix}… · ${bytes} bytes`,
  open: "Unduh/Buka",
  opening: "Membuka…",
  opened: "Artefak dibuka di aplikasi bawaan.",
  reportOpenFail: {
    byCode: failByCode("Artefak gagal dibuka"),
    generic: "Artefak gagal dibuka. Silakan coba lagi.",
  },
  final: "Final.",
  draft: "Draft — bukan final export.",
};

export const PDF_COPY = {
  title: "PDF Report",
  primer: "Buat PDF",
  unduh: "Unduh/Buka",
  opening: "Membuka…",
  opened: "Artefak dibuka di aplikasi bawaan.",
  pdfOpenFail: {
    byCode: failByCode("Artefak gagal dibuka"),
    generic: "Artefak gagal dibuka. Silakan coba lagi.",
  },
  loading: "Membuat PDF…",
  pdfCreateFail: {
    byCode: failByCode("PDF gagal dibuat"),
    generic: "PDF gagal dibuat. Silakan coba lagi.",
  },
  emptyFirst: "Buat Report HTML terlebih dahulu.",
  partial: "Ada hasil usang — lihat daftar sebelum mengunduh.",
  done: "PDF siap diunduh.",
  stale: "Hasil mungkin usang — jalankan ulang.",
  draft: "Draft — bukan final export.",
  final: "Final.",
  ready: (
    sections: number,
    pages: number,
    pdfFingerprintPrefix: string,
    sourceFingerprintPrefix: string,
    renderer: string,
    bytes: number,
  ) =>
    `PDF siap diunduh. — ${sections} section · ${pages} halaman · pdf fingerprint ${pdfFingerprintPrefix}… · sumber ${sourceFingerprintPrefix}… · renderer ${renderer} · ${bytes} bytes`,
};

export const PROJECT_COPY = {
  pick: "Pilih…",
  picking: "…",
  pathLabel: "Path",
  destructiveAck: "Saya mengerti tindakan ini akan menulis file ke disk.",
  cancel: "Batal",
  processing: "Memproses…",
};

export const CHART_COPY = {
  dataTable: "Data tabel",
  categoryHeader: "Kategori",
  countHeader: "Count",
  meanHeader: "Mean",
  medianHeader: "Median",
  minHeader: "Min",
  maxHeader: "Max",
  totalHeader: "Total",
  sampled: (sample: number, pairs: number) => `Sampled ${sample} dari ${pairs} pasangan.`,
  sampledBadge: (sample: number) => `Sampled (${sample})`,
  exact: "Exact",
  pairs: (pairs: number) => `${pairs} pasangan`,
  missingPairs: (missing: number) => `${missing} berpasangan-baris hilang`,
  fingerprint: (fingerprintPrefix: string) => `Fingerprint: ${fingerprintPrefix}…`,
  correlationFootnote: "Korelasi ≠ sebab-akibat.",
  bivariatTitle: (columnA: string, columnB: string) =>
    `Hubungan ${columnA} × ${columnB}`,
  bivariatSummaryNumNum: (a: string, b: string, r: string, rho: string, pairs: number) =>
    `Korelasi ${a} dengan ${b}: Pearson ${r}, Spearman ${rho}, ${pairs} pasangan.`,
  bivariatSummaryCatNum: (
    valueColumn: string,
    groupColumn: string,
    hiMean: string,
    hiLabel: string,
    loMean: string,
    loLabel: string,
    groups: number,
  ) =>
    `Rata-rata ${valueColumn} per ${groupColumn}: tertinggi ${hiMean} pada ${hiLabel}, terendah ${loMean} pada ${loLabel}, ${groups} grup.`,
  bivariatSummaryCatCat: (a: string, b: string, rows: number, cols: number, pairs: number) =>
    `Silang ${a} dengan ${b}: ${rows} baris × ${cols} kolom, total ${pairs} pasangan.`,
  histogramTitle: (column: string) => `Distribusi ${column}`,
  histogramSummaryEmpty: (column: string) => `Distribusi ${column} tidak memiliki nilai.`,
  histogramSummaryFrequency: (column: string, values: number, topBin: string, topCount: number) =>
    `Distribusi ${column}: ${values} nilai kategorikal, puncak di ${topBin} (${topCount} nilai).`,
  histogramSummaryNumeric: (
    column: string,
    values: number,
    min: string | number,
    max: string | number,
    topBin: string,
    topCount: number,
  ) =>
    `Distribusi ${column}: ${values} nilai, rentang ${min}–${max}, puncak di ${topBin} (${topCount} nilai).`,
  histogramEmpty: "Kolom ini tidak memiliki nilai.",
  histogramCaption: (method: string, missingPct: number, fingerprintPrefix: string) =>
    `Metode binning: ${method}. Missing: ${missingPct}%. Fingerprint: ${fingerprintPrefix}…`,
  rangeHeader: "Rentang",
  percentHeader: "%",
  bivariatTooltipGroup: (name: string, mean: string, median: string, n: number) =>
    `${name}: mean ${mean} · median ${median} · n ${n}`,
  bivariatTooltipHeat: (row: string, col: string, count: number, pct: string) =>
    `${row} × ${col}: ${count} (${pct}% dari ${row})`,
  bivariatYMean: (column: string) => `mean ${column}`,
  histogramTooltip: (name: string, value: number, pct: string) =>
    `${name}: ${value} nilai (${pct}%)`,
  staleTitle: "Histogram mungkin usang",
  staleReason: "Dataset aktif telah berubah sejak histogram ini dijalankan.",
  staleDependency: (datasetName: string) =>
    `Dependency yang berubah: dataset ${datasetName} aktif — snapshot saat hasil dibuat bukan snapshot aktif.`,
  staleImpact:
    "Dampak: distribusi di bawah ini mungkin tidak mewakili data saat ini; kesimpulan tentang kolom ini juga dapat terpengaruh.",
  staleOldArtifact:
    "Hasil lama tetap ditampilkan di bawah dan dapat dilihat, tetapi bukan hasil yang berlaku untuk snapshot aktif.",
  staleRecommend:
    "Rekomendasi: jalankan ulang histogram untuk snapshot aktif. Refresh hanya berjalan setelah Anda menekan tombol persetujuan di bawah ini.",
  staleCta: "Saya setuju — perbarui histogram",
};

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
  datasetExportFail: {
    byCode: failByCode("Export gagal"),
    generic: "Export gagal. Silakan coba lagi.",
  },
  toastHistogramDone: "Histogram selesai.",
  histogramFail: {
    byCode: failByCode("Histogram gagal"),
    generic: "Histogram gagal. Silakan coba lagi.",
  },
  toastPlanApproved: "Plan disetujui.",
  planApproveFail: {
    byCode: failByCode("Menyetujui plan gagal"),
    generic: "Menyetujui plan gagal. Silakan coba lagi.",
  },
  toastPlanExecuted: "Analysis plan dieksekusi.",
  planExecuteFail: {
    byCode: failByCode("Eksekusi analysis plan gagal"),
    generic: "Eksekusi analysis plan gagal. Silakan coba lagi.",
  },
  toastPlanCreated: "Analysis plan dibuat.",
  planCreateFail: {
    byCode: failByCode("Membuat analysis plan gagal"),
    generic: "Membuat analysis plan gagal. Silakan coba lagi.",
  },
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
  // Recent projects (D-F4, Beta): read-only list, single active project
  recentTitle: "Project terbuka terakhir",
  recentEmpty: "Belum ada project sebelumnya.",
  recentDatasetCount: (n: number) => `${n} dataset`,
  recentOpenAction: (name: string) => `Buka ${name}`,
  toastProjectOpened: (name: string) => `Project dibuka: ${name}`,
  projectOpenFail: {
    byCode: failByCode("Gagal membuka project"),
    generic: "Gagal membuka project. Silakan coba lagi.",
  },
  snapshotInfo: (snapshotId: string, rowCount: number, fingerprintPrefix: string) =>
    `Snapshot ${snapshotId} · ${rowCount} rows · sha256 ${fingerprintPrefix}…`,
  // DatasetCard (UIUX-05): nama + rows/cols + fingerprint 12 char + aksi cepat
  datasetCardRowsCols: (rowCount: number, columnCount: number) =>
    `${rowCount} baris × ${columnCount} kolom`,
  datasetCardFingerprint: (fingerprintPrefix: string) => `sha256 ${fingerprintPrefix}…`,
  datasetCardOpenDataset: "Buka dataset",
  datasetCardRunProfile: "Profil dataset",
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
  projectCreateFail: {
    byCode: failByCode("Gagal membuat project"),
    generic: "Gagal membuat project. Silakan coba lagi.",
  },
  toastDatasetImported: (name: string) => `Dataset diimport: ${name}`,
  datasetImportFail: {
    byCode: failByCode("Gagal import"),
    generic: "Gagal import. Silakan coba lagi.",
  },
  toastBackupCreated: "Backup dibuat.",
  backupFail: {
    byCode: failByCode("Backup gagal"),
    generic: "Backup gagal. Silakan coba lagi.",
  },
  toastRestoreDone: "Restore selesai.",
  restoreFail: {
    byCode: failByCode("Restore gagal"),
    generic: "Restore gagal. Silakan coba lagi.",
  },
  toastPortableDone: "Export portabel selesai.",
  portableFail: {
    byCode: failByCode("Export portabel gagal"),
    generic: "Export portabel gagal. Silakan coba lagi.",
  },
  toastDiagnosticCreated: "Diagnostic bundle dibuat.",
  diagnosticFail: {
    byCode: failByCode("Diagnostic gagal"),
    generic: "Diagnostic gagal. Silakan coba lagi.",
  },
};
