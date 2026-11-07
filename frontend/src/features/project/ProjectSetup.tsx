/**
 * ProjectSetup.tsx — P2-2 route Setup: buat project, import dataset,
 * backup/restore, diagnostic bundle. Hasil mutation → toast global.
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import { ipcClient } from "../../shared/ipc/ipcClient";
import type {
  BackupRecord,
  DiagnosticRecord,
  DatasetRecord,
  RestoreRecord,
} from "../../shared/ipc/generated";
import { useProject } from "../../app/ProjectContext";
import { useToast } from "../../shared/ui/Toaster";
import { FilePathInput } from "./FilePathInput";
import { DestructiveConfirmDialog } from "./DestructiveConfirmDialog";

type ConfirmKind = "backup" | "restore" | "diagnostic" | null;

interface ProjectForm {
  name: string;
  sourcePath: string;
  datasetName: string;
}

export function ProjectSetup() {
  const { projectId, dataset, setProjectId, setDataset } = useProject();
  const toast = useToast();
  const { register, handleSubmit, getValues } = useForm<ProjectForm>();
  const [sourcePath, setSourcePath] = useState("");
  const [confirm, setConfirm] = useState<ConfirmKind>(null);

  const create = useMutation({
    mutationFn: (name: string) => ipcClient.createProject(name),
    onSuccess: (p) => {
      setProjectId(p.project_id);
      toast.success(`Project dibuat: ${p.name}`);
    },
    onError: (e) => toast.error(`Gagal membuat project: ${e.message}`),
  });
  const doImport = useMutation({
    mutationFn: (v: ProjectForm) =>
      ipcClient.importDataset(projectId!, v.sourcePath, v.datasetName),
    onSuccess: (d: DatasetRecord) => {
      setDataset(d);
      toast.success(`Dataset diimport: ${d.name}`);
    },
    onError: (e) => toast.error(`Gagal import: ${e.message}`),
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
    onSuccess: (r) => {
      setBackupRecord(r);
      toast.success("Backup dibuat.");
    },
    onError: (e) => toast.error(`Backup gagal: ${e.message}`),
  });
  const restoreProject = useMutation({
    mutationFn: (v: { archive: string; root: string }) =>
      ipcClient.restoreProject(v.archive, v.root),
    onSuccess: (r) => {
      setRestoreRecord(r);
      toast.success("Restore selesai.");
    },
    onError: (e) => toast.error(`Restore gagal: ${e.message}`),
  });

  // M3 P2 diagnostic bundle (Doc15 §10): Basic level, redacted.
  const [diagnosticPath, setDiagnosticPath] = useState("");
  const [diagnosticRecord, setDiagnosticRecord] = useState<DiagnosticRecord | null>(null);
  const createDiagnostic = useMutation({
    mutationFn: (dest: string) => ipcClient.createDiagnostic(projectId!, dest),
    onSuccess: (r: DiagnosticRecord) => {
      setDiagnosticRecord(r);
      toast.success("Diagnostic bundle dibuat.");
    },
    onError: (e) => toast.error(`Diagnostic gagal: ${e.message}`),
  });

  return (
    <>
      <section>
        <h2>Buat Project</h2>
        <form onSubmit={handleSubmit((v) => create.mutate(v.name))}>
          <input {...register("name", { required: true })} placeholder="Nama project" />
          <button type="submit" disabled={create.isPending}>
            Buat
          </button>
        </form>
        {projectId && <p>Project: {projectId}</p>}
      </section>
      {projectId && (
        <section>
          <h2>Import Dataset (CSV)</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              doImport.mutate({
                name: getValues("name") || "",
                sourcePath,
                datasetName: getValues("datasetName"),
              });
            }}
          >
            <FilePathInput
              value={sourcePath}
              onChange={setSourcePath}
              mode="open"
              fileTypes={["csv", "xlsx", "parquet"]}
              title="Pilih file dataset"
              placeholder="Path file .csv/.xlsx/.parquet"
              disabled={doImport.isPending}
            />
            <input {...register("datasetName", { required: true })} placeholder="Nama dataset" />
            <button type="submit" disabled={doImport.isPending}>
              Import
            </button>
          </form>
          {dataset && (
            <p>
              Snapshot {dataset.snapshot_id} · {dataset.row_count} rows · sha256{" "}
              {dataset.fingerprint.slice(0, 12)}…
            </p>
          )}
        </section>
      )}
      {projectId && (
        <section>
          <h2>Backup &amp; Restore (Doc04 §12)</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setConfirm("backup");
            }}
          >
            <FilePathInput
              value={backupPath}
              onChange={setBackupPath}
              mode="save"
              fileTypes={["zip"]}
              title="Simpan backup proyek"
              placeholder="Path file backup (.zip)"
              disabled={createBackup.isPending || confirm !== null}
            />
            <button type="submit" disabled={!backupPath || createBackup.isPending}>
              Buat Backup
            </button>
          </form>
          {backupRecord && (
            <p>
              Backup: {backupRecord.file_path} ·{" "}
              {(backupRecord.file_size_bytes / 1024).toFixed(1)} KB · db sha256{" "}
              {backupRecord.project_db_sha256.slice(0, 12)}… · v{backupRecord.version}
            </p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setConfirm("restore");
            }}
          >
            <FilePathInput
              value={restoreArchive}
              onChange={setRestoreArchive}
              mode="open"
              fileTypes={["zip"]}
              title="Pilih file backup"
              placeholder="Path file backup (.zip)"
              disabled={restoreProject.isPending || confirm !== null}
            />
            <FilePathInput
              value={restoreRoot}
              onChange={setRestoreRoot}
              mode="save"
              fileTypes={[]}
              title="Pilih folder tujuan restore"
              placeholder="Folder tujuan restore (baru/kosong)"
              disabled={restoreProject.isPending || confirm !== null}
            />
            <button
              type="submit"
              disabled={!restoreArchive || !restoreRoot || restoreProject.isPending}
            >
              Restore
            </button>
          </form>
          {restoreRecord && (
            <p>
              Restore selesai: {restoreRecord.project_id} → {restoreRecord.dest_root} · db sha256{" "}
              {restoreRecord.project_db_sha256.slice(0, 12)}…
            </p>
          )}
        </section>
      )}
      {projectId && (
        <section>
          <h2>Diagnostic Bundle (Doc15 §10)</h2>
          <p>Bundle Basic yang ter-redaksi: metadata, health check, recent errors. Tanpa data mentah/DB.</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setConfirm("diagnostic");
            }}
          >
            <FilePathInput
              value={diagnosticPath}
              onChange={setDiagnosticPath}
              mode="save"
              fileTypes={["zip"]}
              title="Simpan diagnostic bundle"
              placeholder="Path file bundle (.zip)"
              disabled={createDiagnostic.isPending || confirm !== null}
            />
            <button
              type="submit"
              disabled={!diagnosticPath || createDiagnostic.isPending}
            >
              Buat Diagnostic
            </button>
          </form>
          {diagnosticRecord && (
            <p>
              Diagnostic: {diagnosticRecord.path} · {diagnosticRecord.file_count} file · paths
              redacted {diagnosticRecord.paths_redacted} · sha256{" "}
              {diagnosticRecord.sha256.slice(0, 12)}…
            </p>
          )}
        </section>
      )}
      {confirm && (
        <DestructiveConfirmDialog
          title={
            confirm === "backup"
              ? "Buat backup proyek?"
              : confirm === "restore"
                ? "Restore backup proyek?"
                : "Buat diagnostic bundle?"
          }
          description={
            confirm === "backup"
              ? `Backup akan ditulis ke ${backupPath}. Tidak ada data yang dihapus.`
              : confirm === "restore"
                ? `Backup ${restoreArchive} akan di-restore ke folder baru ${restoreRoot}. Folder tujuan harus baru atau kosong.`
                : `Bundle diagnostic ter-redaksi akan ditulis ke ${diagnosticPath}. Tanpa data mentah atau isi database.`
          }
          confirmLabel={
            confirm === "backup"
              ? "Buat Backup"
              : confirm === "restore"
                ? "Restore"
                : "Buat Diagnostic"
          }
          pending={
            confirm === "backup"
              ? createBackup.isPending
              : confirm === "restore"
                ? restoreProject.isPending
                : createDiagnostic.isPending
          }
          onCancel={() => setConfirm(null)}
          onConfirm={() => {
            const kind = confirm;
            setConfirm(null);
            if (kind === "backup") createBackup.mutate(backupPath);
            else if (kind === "restore") {
              restoreProject.mutate({ archive: restoreArchive, root: restoreRoot });
            } else createDiagnostic.mutate(diagnosticPath);
          }}
        />
      )}
    </>
  );
}
