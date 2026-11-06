import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ipcClient } from "../../shared/ipc/ipcClient";
import type { BackupRecord, DatasetRecord, ExportFormat, ExportRecord, HistogramRecord, ProfileRecord, QualityRecord, RestoreRecord } from "../../shared/ipc/generated";
import { BivariateSection } from "../bivariate/BivariateSection";
import { CleaningSection } from "../cleaning/CleaningSection";
import { HistogramChart } from "../histogram/HistogramChart";
import { PdfSection } from "../reporting/PdfSection";
import { ReportSection } from "../reporting/ReportSection";

interface ProjectForm { name: string; sourcePath: string; datasetName: string }

export function ProjectPage() {
  const { register, handleSubmit } = useForm<ProjectForm>();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [dataset, setDataset] = useState<DatasetRecord | null>(null);

  const create = useMutation({
    mutationFn: (name: string) => ipcClient.createProject(name),
    onSuccess: (p) => setProjectId(p.project_id),
  });
  const doImport = useMutation({
    mutationFn: (v: ProjectForm) => ipcClient.importDataset(projectId!, v.sourcePath, v.datasetName),
    onSuccess: setDataset,
  });

  const preview = useQuery({
    queryKey: ["preview", projectId, dataset?.dataset_id],
    queryFn: () => ipcClient.getPreview(projectId!, dataset!.dataset_id),
    enabled: !!projectId && !!dataset,
  });

  const queryClient = useQueryClient();
  // G6: single canonical profiling action — JobManager-wrapped command.
  // (The legacy sync `dataset.profile` query stays registered for compat,
  // but the UI no longer offers two competing buttons.)
  const [savedProfile, setSavedProfile] = useState<import("../../shared/ipc/generated").ProfileRecord | null>(null);

  // Feedback is driven by mutation state, NOT query isPending — a disabled
  // query without data is 'pending' forever, so isPending shows a stuck
  // "Profiling sedang berjalan…" next to a finished table.
  const runProfile = useMutation({
    mutationFn: () => ipcClient.runProfile(projectId!, dataset!.dataset_id),
    onSuccess: (r) => {
      setSavedProfile(r);
      void queryClient.invalidateQueries({ queryKey: ["profiles", projectId, dataset?.dataset_id] });
    },
  });
  const profiles = useQuery({
    queryKey: ["profiles", projectId, dataset?.dataset_id],
    queryFn: () => ipcClient.listProfiles(projectId!, dataset!.dataset_id),
    enabled: !!projectId && !!dataset,
  });
  const snapshots = useQuery({
    queryKey: ["snapshots", projectId],
    queryFn: () => ipcClient.listSnapshots(projectId!),
    enabled: !!projectId && !!dataset,
  });
  const openSaved = useMutation({
    mutationFn: (profileId: string) => ipcClient.getProfileById(projectId!, profileId),
    onSuccess: (r) => { setSavedProfile(r); },
  });

  // SCREEN-HIST-001: column histogram — mutation-driven feedback (never query isPending).
  const [histColumn, setHistColumn] = useState("");
  const [histRecord, setHistRecord] = useState<HistogramRecord | null>(null);
  const runHistogram = useMutation({
    mutationFn: (column: string) => ipcClient.runHistogram(projectId!, dataset!.dataset_id, column),
    onSuccess: (r) => setHistRecord(r),
  });

  // SCREEN-QUAL-001: quality check — mutation-driven feedback (never query isPending).
  const [qualityRecord, setQualityRecord] = useState<QualityRecord | null>(null);
  const runQuality = useMutation({
    mutationFn: () => ipcClient.runQuality(projectId!, dataset!.dataset_id),
    onSuccess: (r) => setQualityRecord(r),
  });
  const refetchSnapshots = () => { void snapshots.refetch(); };

  // FLOW-CLEAN-001 §6: revert CTA ("Jadikan aktif") lives in the snapshot
  // list — any snapshot, including the parent, becomes the active one.
  // After activation, Profiling/Quality results are stale by fingerprint.
  const activateSnapshot = useMutation({
    mutationFn: (snapshotId: string) => ipcClient.activateSnapshot(projectId!, dataset!.dataset_id, snapshotId),
    onSuccess: (d) => { setDataset(d); refetchSnapshots(); },
  });

  // M3 P0 backup/restore (Doc04 §12): path text inputs; restored project
  // lives in a NEW root — on success we surface the record, no auto-switch.
  const [backupPath, setBackupPath] = useState("");
  const [restoreArchive, setRestoreArchive] = useState("");
  const [restoreRoot, setRestoreRoot] = useState("");
  const [backupRecord, setBackupRecord] = useState<BackupRecord | null>(null);
  const [restoreRecord, setRestoreRecord] = useState<RestoreRecord | null>(null);
  const createBackup = useMutation({
    mutationFn: (dest: string) => ipcClient.createBackup(projectId!, dest),
    onSuccess: (r) => setBackupRecord(r),
  });
  const restoreProject = useMutation({
    mutationFn: (v: { archive: string; root: string }) =>
      ipcClient.restoreProject(v.archive, v.root),
    onSuccess: (r) => setRestoreRecord(r),
  });

  // M3 P0 dataset export (Doc16 §4.2): canonical snapshot → CSV/Parquet on disk.
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [exportPath, setExportPath] = useState("");
  const [exportRecord, setExportRecord] = useState<ExportRecord | null>(null);
  const exportDataset = useMutation({
    mutationFn: (v: { format: ExportFormat; path: string }) =>
      ipcClient.exportDataset(projectId!, dataset!.dataset_id, v.format, v.path),
    onSuccess: (r) => setExportRecord(r),
  });

  return (
    <main>
      <h1>EDA Workbench — M1</h1>
      <section>
        <h2>Buat Project</h2>
        <form onSubmit={handleSubmit((v) => create.mutate(v.name))}>
          <input {...register("name", { required: true })} placeholder="Nama project" />
          <button disabled={create.isPending}>Buat</button>
        </form>
        {create.isError && <p role="alert">Gagal membuat project: {create.error.message}</p>}
        {projectId && <p>Project: {projectId}</p>}
      </section>
      {projectId && (
        <section>
          <h2>Import Dataset (CSV)</h2>
          <form onSubmit={handleSubmit((v) => doImport.mutate(v))}>
            <input {...register("sourcePath", { required: true })} placeholder="Path file .csv" />
            <input {...register("datasetName", { required: true })} placeholder="Nama dataset" />
            <button disabled={doImport.isPending}>Import</button>
          </form>
          {doImport.isError && <p role="alert">Gagal import: {doImport.error.message}</p>}
          {dataset && <p>Snapshot {dataset.snapshot_id} · {dataset.row_count} rows · sha256 {dataset.fingerprint.slice(0, 12)}…</p>}
          {dataset && (
            <>
              <h3>Export Dataset (CSV/Parquet)</h3>
              <form onSubmit={(e) => { e.preventDefault(); exportDataset.mutate({ format: exportFormat, path: exportPath }); }}>
                <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value as ExportFormat)}>
                  <option value="csv">CSV</option>
                  <option value="parquet">Parquet</option>
                </select>
                <input value={exportPath} onChange={(e) => setExportPath(e.target.value)} placeholder="Path file tujuan export" required />
                <button disabled={exportDataset.isPending}>Export</button>
              </form>
              {exportDataset.isPending && <p role="status">Mengekspor dataset…</p>}
              {exportDataset.isError && <p role="alert">Export gagal: {exportDataset.error.message}</p>}
              {exportRecord && (
                <p>Ekspor: {exportRecord.file_path} · {(exportRecord.file_size_bytes / 1024).toFixed(1)} KB · {exportRecord.row_count} rows · sha256 {exportRecord.file_fingerprint.slice(0, 12)}…</p>
              )}
            </>
          )}
        </section>
      )}
      {dataset && (
        <section>
          <h2>Profiling</h2>
          <button disabled={runProfile.isPending} onClick={() => runProfile.mutate()}>Jalankan Profiling</button>
          {runProfile.isPending && <p role="status">Profiling sedang berjalan…</p>}
          {runProfile.isError && <p role="alert">Profiling gagal: {runProfile.error.message}</p>}
          {openSaved.isPending && <p role="status">Membuka profil tersimpan…</p>}
          {openSaved.isError && <p role="alert">Membuka profil tersimpan gagal: {openSaved.error.message}</p>}
          {savedProfile && (
            <>
              <p>{savedProfile.row_count} baris · {savedProfile.column_count} kolom · fingerprint {savedProfile.fingerprint.slice(0, 12)}…{savedProfile.profile_id ? ` · profil ${String(savedProfile.profile_id).slice(0, 8)}` : ""}</p>
              <table>
                <thead><tr><th>Kolom</th><th>Tipe</th><th>Missing %</th><th>Min</th><th>Max</th><th>Mean</th><th>Top</th><th>Status</th></tr></thead>
                <tbody>
                  {savedProfile.columns.map((c) => (
                    <tr key={c.name}>
                      <td>{c.name}</td><td>{c.inferred_type}</td><td>{c.missing_pct}</td>
                      <td>{String(c.min_value ?? "")}</td><td>{String(c.max_value ?? "")}</td>
                      <td>{String(c.mean_value ?? "")}</td><td>{String(c.top_value ?? "")}</td>
                      <td>{c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {profiles.isPending && <p role="status">Memuat riwayat profiling…</p>}
          {profiles.isError && <p role="alert">Riwayat profiling gagal dimuat: {profiles.error.message}</p>}
          {profiles.data && profiles.data.profiles.length === 0 && !runProfile.isPending && (
            <p>Belum ada profil tersimpan. Jalankan profiling untuk membuat profil pertama.</p>
          )}
          {profiles.data && profiles.data.profiles.length > 0 && (
            <>
              <h3>Riwayat Profiling ({profiles.data.profiles.length})</h3>
              <ul>
                {profiles.data.profiles.map((p) => (
                  <li key={p.profile_id}>
                    {p.profile_id.slice(0, 8)} · {p.row_count} rows · {p.column_count} cols · {p.fingerprint.slice(0, 12)}…{" "}
                    <button onClick={() => openSaved.mutate(p.profile_id)}>Buka</button>
                  </li>
                ))}
              </ul>
            </>
          )}
          {snapshots.data && snapshots.data.snapshots.length > 0 && (
            <>
              <h3>Snapshots ({snapshots.data.snapshots.length})</h3>
              <ul>
                {snapshots.data.snapshots.map((s) => (
                  <li key={s.snapshot_id}>
                    {s.dataset_name} · {s.snapshot_id.slice(0, 8)} · {s.row_count} rows · {s.fingerprint.slice(0, 12)}…
                    {s.snapshot_id !== dataset.snapshot_id && (
                      <>
                        {" "}
                        <button
                          disabled={activateSnapshot.isPending}
                          onClick={() => activateSnapshot.mutate(s.snapshot_id)}
                        >
                          Jadikan aktif
                        </button>
                      </>
                    )}
                  </li>
                ))}
                {activateSnapshot.isError && (
                  <p role="alert">Gagal mengaktifkan snapshot: {activateSnapshot.error.message}</p>
                )}
              </ul>
            </>
          )}
        </section>
      )}
      {dataset && (
        <section>
          <h2>Histogram</h2>
          <label htmlFor="hist-column">Pilih kolom</label>{" "}
          <select
            id="hist-column"
            value={histColumn}
            onChange={(e) => setHistColumn(e.target.value)}
          >
            <option value="">— pilih —</option>
            {dataset.columns.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>{" "}
          <button disabled={runHistogram.isPending || !histColumn} onClick={() => runHistogram.mutate(histColumn)}>
            Tampilkan Histogram
          </button>
          {runHistogram.isPending && <p role="status">Membuat histogram…</p>}
          {runHistogram.isError && <p role="alert">Histogram gagal dibuat. Silakan coba lagi. — {runHistogram.error.message}</p>}
          {histRecord && histRecord.kind !== "empty" && <HistogramChart record={histRecord} />}
          {histRecord && histRecord.kind === "empty" && <p>Kolom ini tidak memiliki nilai.</p>}
        </section>
      )}
      {dataset && (
        <section>
          <h2>Quality Check</h2>
          {!savedProfile && <p>Jalankan profiling terlebih dahulu.</p>}
          <button disabled={runQuality.isPending} onClick={() => runQuality.mutate()}>
            Jalankan Quality Check
          </button>
          {runQuality.isPending && <p role="status">Memeriksa kualitas…</p>}
          {runQuality.isError && <p role="alert">Quality check gagal. Silakan coba lagi. — {runQuality.error.message}</p>}
          {qualityRecord && (
            <>
              <p aria-live="polite">
                {qualityRecord.summary} · fingerprint {String(qualityRecord.fingerprint).slice(0, 8)} · {qualityRecord.row_count} baris
              </p>
              {savedProfile && qualityRecord.fingerprint !== savedProfile.fingerprint && (
                <p>Hasil mungkin usang — jalankan ulang.</p>
              )}
              {qualityRecord.problem_count + qualityRecord.check_count === 0 && (
                <p>Tidak ditemukan masalah kualitas pada snapshot ini.</p>
              )}
              <div style={{ overflowX: "auto" }}>
                <table>
                  <thead>
                    <tr><th>Kolom</th><th>Aturan</th><th>Severity</th><th>Bukti</th><th>Keterangan</th></tr>
                  </thead>
                  <tbody>
                    {qualityRecord.findings.map((f, i) => (
                      <tr key={i}>
                        <td>{String(f.column_name ?? "—")}</td>
                        <td><code>{f.rule_id}</code></td>
                        <td>{f.severity === "ok" ? "OK" : f.severity === "check" ? "Perlu perhatian" : "Masalah"}</td>
                        <td>{String(f.evidence_count)} ({String(f.evidence_pct)}%) — {f.evidence_detail}</td>
                        <td>{f.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
      {dataset && projectId && (
        <BivariateSection projectId={projectId} dataset={dataset} savedProfile={savedProfile} />
      )}
      {dataset && projectId && (
        <ReportSection projectId={projectId} dataset={dataset} savedProfile={savedProfile} />
      )}
      {dataset && projectId && (
        <PdfSection projectId={projectId} dataset={dataset} savedProfile={savedProfile} />
      )}
      {dataset && projectId && (
        <CleaningSection
          projectId={projectId}
          dataset={dataset}
          savedProfile={savedProfile}
          qualityRecord={qualityRecord}
          onDatasetChange={(d) => { setDataset(d); refetchSnapshots(); }}
        />
      )}
      {projectId && (
        <section>
          <h2>Backup &amp; Restore (Doc04 §12)</h2>
          <form onSubmit={(e) => { e.preventDefault(); createBackup.mutate(backupPath); }}>
            <input value={backupPath} onChange={(e) => setBackupPath(e.target.value)} placeholder="Path file backup (.edaworkspace)" required />
            <button disabled={createBackup.isPending}>Buat Backup</button>
          </form>
          {createBackup.isPending && <p role="status">Membuat backup…</p>}
          {createBackup.isError && <p role="alert">Backup gagal: {createBackup.error.message}</p>}
          {backupRecord && (
            <p>Backup: {backupRecord.file_path} · {(backupRecord.file_size_bytes / 1024).toFixed(1)} KB · db sha256 {backupRecord.project_db_sha256.slice(0, 12)}… · v{backupRecord.version}</p>
          )}
          <form onSubmit={(e) => { e.preventDefault(); restoreProject.mutate({ archive: restoreArchive, root: restoreRoot }); }}>
            <input value={restoreArchive} onChange={(e) => setRestoreArchive(e.target.value)} placeholder="Path file backup" required />
            <input value={restoreRoot} onChange={(e) => setRestoreRoot(e.target.value)} placeholder="Folder tujuan restore (baru/kosong)" required />
            <button disabled={restoreProject.isPending}>Restore</button>
          </form>
          {restoreProject.isPending && <p role="status">Me-restore backup…</p>}
          {restoreProject.isError && <p role="alert">Restore gagal: {restoreProject.error.message}</p>}
          {restoreRecord && (
            <p>Restore selesai: {restoreRecord.project_id} → {restoreRecord.dest_root} · db sha256 {restoreRecord.project_db_sha256.slice(0, 12)}…</p>
          )}
        </section>
      )}
      {preview.data && (
        <section>
          <h2>Preview ({preview.data.total_rows} rows{preview.data.truncated ? ", truncated" : ""})</h2>
          <table>
            <thead><tr>{preview.data.columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
            <tbody>
              {preview.data.rows.map((r, i) => (
                <tr key={i}>{preview.data.columns.map((c) => <td key={c}>{String(r[c] ?? "")}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </main>
  );
}
