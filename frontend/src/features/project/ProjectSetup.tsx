/**
 * ProjectSetup.tsx — P2-2 route Setup: buat project, import dataset,
 * backup/restore, diagnostic bundle. Hasil mutation → toast global.
 */
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ipcClient } from "../../shared/ipc/ipcClient";
import type {
  BackupRecord,
  DiagnosticRecord,
  DatasetRecord,
  PortableExportRecord,
  RestoreRecord,
} from "../../shared/ipc/generated";
import { useProject } from "../../app/ProjectContext";
import { useToast } from "../../shared/ui/Toaster";
import { FilePathInput } from "./FilePathInput";
import { DatasetCard } from "./DatasetCard";
import { DestructiveConfirmDialog } from "./DestructiveConfirmDialog";
import { SETUP_COPY } from "../../shared/copy/featureCopy";
import { describeFeatureError } from "../../shared/copy/errorCopy";
import { DiagnosticDetail } from "../../shared/ui/DiagnosticDetail";

type ConfirmKind = "backup" | "restore" | "diagnostic" | null;

interface ProjectForm {
  name: string;
  sourcePath: string;
  datasetName: string;
}

export function ProjectSetup() {
  const { projectId, dataset, setProjectId, setDataset, resetResume } = useProject();
  const toast = useToast();
  const { register, handleSubmit, getValues, formState: { errors } } = useForm<ProjectForm>();
  const [sourcePath, setSourcePath] = useState("");
  const [confirm, setConfirm] = useState<ConfirmKind>(null);

  const create = useMutation({
    mutationFn: (name: string) => ipcClient.createProject(name),
    onSuccess: (p) => {
      setProjectId(p.project_id);
      toast.success(SETUP_COPY.toastProjectCreated(p.name));
    },
    onError: (e) =>
      toast.error(
        describeFeatureError(e, SETUP_COPY.projectCreateFail.byCode, SETUP_COPY.projectCreateFail.generic)
          .headline,
      ),
  });
  // D-F4 (Beta): read-only recent list + open with D-F3 revalidation.
  // Single active project: opening a recent project replaces the context.
  const recent = useQuery({
    queryKey: ["recent-projects"],
    queryFn: () => ipcClient.listRecent(10),
  });
  const openRecent = useMutation({
    mutationFn: (pid: string) => ipcClient.openProject(pid),
    onSuccess: async (rec) => {
      if (rec.dataset) {
        // Reuse D-F3 resume revalidation: snapshots list + dataset.get.
        await ipcClient.listSnapshots(rec.project_id);
        const revalidated = await ipcClient.getDataset(
          rec.project_id, rec.dataset.dataset_id);
        setProjectId(rec.project_id);
        setDataset(revalidated);
      } else {
        resetResume();
        setProjectId(rec.project_id);
      }
      toast.success(SETUP_COPY.toastProjectOpened(rec.name));
    },
    onError: (e) =>
      toast.error(
        describeFeatureError(e, SETUP_COPY.projectOpenFail.byCode, SETUP_COPY.projectOpenFail.generic)
          .headline,
      ),
  });
  const doImport = useMutation({
    mutationFn: (v: ProjectForm) =>
      ipcClient.importDataset(projectId!, v.sourcePath, v.datasetName),
    onSuccess: (d: DatasetRecord) => {
      setDataset(d);
      toast.success(SETUP_COPY.toastDatasetImported(d.name));
    },
    onError: (e) =>
      toast.error(
        describeFeatureError(
          e,
          SETUP_COPY.datasetImportFail.byCode,
          SETUP_COPY.datasetImportFail.generic,
        ).headline,
      ),
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
      toast.success(SETUP_COPY.toastBackupCreated);
    },
    onError: (e) =>
      toast.error(
        describeFeatureError(e, SETUP_COPY.backupFail.byCode, SETUP_COPY.backupFail.generic)
          .headline,
      ),
  });
  const restoreProject = useMutation({
    mutationFn: (v: { archive: string; root: string }) =>
      ipcClient.restoreProject(v.archive, v.root),
    onSuccess: (r) => {
      setRestoreRecord(r);
      toast.success(SETUP_COPY.toastRestoreDone);
    },
    onError: (e) =>
      toast.error(
        describeFeatureError(e, SETUP_COPY.restoreFail.byCode, SETUP_COPY.restoreFail.generic)
          .headline,
      ),
  });

  // G6-2 portable export: backup-shaped ZIP with kind="portable_export".
  // It can be restored with the ordinary project.restore command.
  const [portablePath, setPortablePath] = useState("");
  const [portableRecord, setPortableRecord] = useState<PortableExportRecord | null>(null);
  const exportPortable = useMutation({
    mutationFn: (dest: string) => ipcClient.exportPortable(projectId!, dest),
    onSuccess: (r) => {
      setPortableRecord(r);
      toast.success(SETUP_COPY.toastPortableDone);
    },
    onError: (e) =>
      toast.error(
        describeFeatureError(e, SETUP_COPY.portableFail.byCode, SETUP_COPY.portableFail.generic)
          .headline,
      ),
  });

  // M3 P2 diagnostic bundle (Doc15 §10): Basic level, redacted.
  const [diagnosticPath, setDiagnosticPath] = useState("");
  const [diagnosticRecord, setDiagnosticRecord] = useState<DiagnosticRecord | null>(null);
  const createDiagnostic = useMutation({
    mutationFn: (dest: string) => ipcClient.createDiagnostic(projectId!, dest),
    onSuccess: (r: DiagnosticRecord) => {
      setDiagnosticRecord(r);
      toast.success(SETUP_COPY.toastDiagnosticCreated);
    },
    onError: (e) =>
      toast.error(
        describeFeatureError(
          e,
          SETUP_COPY.diagnosticFail.byCode,
          SETUP_COPY.diagnosticFail.generic,
        ).headline,
      ),
  });

  // D-F7 (UIUX-06): headline cabang error.code untuk error query recent;
  // pesan mentah di detail diagnostik.
  const recentError = recent.isError
    ? describeFeatureError(
        recent.error,
        SETUP_COPY.projectOpenFail.byCode,
        SETUP_COPY.projectOpenFail.generic,
      )
    : null;

  return (
    <>
      <section>
        <h2>{SETUP_COPY.createProjectTitle}</h2>
        <form onSubmit={handleSubmit((v) => create.mutate(v.name))}>
          <input
            {...register("name", { required: SETUP_COPY.projectNameRequired })}
            placeholder={SETUP_COPY.projectNamePlaceholder}
            aria-label={SETUP_COPY.projectNameLabel}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
          />
          {errors.name && (
            <p id="name-error" className="field-error" role="alert">
              {errors.name.message}
            </p>
          )}
          <button type="submit" disabled={create.isPending}>
            {SETUP_COPY.createAction}
          </button>
        </form>
        {projectId && <p>{SETUP_COPY.projectLabel(projectId)}</p>}
      </section>
      <section>
        <h2>{SETUP_COPY.recentTitle}</h2>
        {recent.isPending && <p aria-busy="true">…</p>}
        {recentError && (
          <>
            <p role="alert">{recentError.headline}</p>
            <DiagnosticDetail detail={recentError.detail} />
          </>
        )}
        {recent.data && recent.data.projects.length === 0 && (
          <p>{SETUP_COPY.recentEmpty}</p>
        )}
        {recent.data && recent.data.projects.length > 0 && (
          <ul>
            {recent.data.projects.map((p) => (
              <li key={p.project_id}>
                <span>{p.name} · {SETUP_COPY.recentDatasetCount(p.dataset_count)}</span>{" "}
                <button
                  type="button"
                  onClick={() => openRecent.mutate(p.project_id)}
                  disabled={openRecent.isPending}
                >
                  {SETUP_COPY.recentOpenAction(p.name)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {projectId && (
        <section>
          <h2>{SETUP_COPY.importTitle}</h2>
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
              title={SETUP_COPY.selectDatasetFile}
              placeholder={SETUP_COPY.datasetPathPlaceholder}
              disabled={doImport.isPending}
            />
            <input
              {...register("datasetName", { required: SETUP_COPY.datasetNameRequired })}
              placeholder={SETUP_COPY.datasetNamePlaceholder}
              aria-label={SETUP_COPY.datasetNameLabel}
              aria-invalid={!!errors.datasetName}
              aria-describedby={errors.datasetName ? "dataset-name-error" : undefined}
            />
            {errors.datasetName && (
              <p id="dataset-name-error" className="field-error" role="alert">
                {errors.datasetName.message}
              </p>
            )}
            <button type="submit" disabled={doImport.isPending}>
              {SETUP_COPY.importAction}
            </button>
          </form>
          {dataset && <DatasetCard dataset={dataset} />}
        </section>
      )}
      {projectId && (
        <section>
          <h2>{SETUP_COPY.backupRestoreTitle}</h2>
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
              title={SETUP_COPY.saveBackupFile}
              placeholder={SETUP_COPY.backupPathPlaceholder}
              disabled={createBackup.isPending || confirm !== null}
            />
            <button type="submit" disabled={!backupPath || createBackup.isPending}>
              {SETUP_COPY.backupAction}
            </button>
          </form>
          {backupRecord && (
            <p>
              {SETUP_COPY.backupResult(backupRecord.file_path, (backupRecord.file_size_bytes / 1024).toFixed(1), backupRecord.project_db_sha256.slice(0, 12), backupRecord.version)}
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
              title={SETUP_COPY.selectBackupFile}
              placeholder={SETUP_COPY.backupPathPlaceholder}
              disabled={restoreProject.isPending || confirm !== null}
            />
            <FilePathInput
              value={restoreRoot}
              onChange={setRestoreRoot}
              mode="save"
              fileTypes={[]}
              title={SETUP_COPY.selectRestoreFolder}
              placeholder={SETUP_COPY.restoreFolderPlaceholder}
              disabled={restoreProject.isPending || confirm !== null}
            />
            <button
              type="submit"
              disabled={!restoreArchive || !restoreRoot || restoreProject.isPending}
            >
              {SETUP_COPY.restoreAction}
            </button>
          </form>
          {restoreRecord && (
            <p>
              {SETUP_COPY.restoreResult(restoreRecord.project_id, restoreRecord.dest_root, restoreRecord.project_db_sha256.slice(0, 12))}
            </p>
          )}
        </section>
      )}
      {projectId && (
        <section>
          <h2>{SETUP_COPY.portableTitle}</h2>
          <p>{SETUP_COPY.portableIntro}</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              exportPortable.mutate(portablePath);
            }}
          >
            <FilePathInput
              value={portablePath}
              onChange={setPortablePath}
              mode="save"
              fileTypes={["zip"]}
              title={SETUP_COPY.savePortableFile}
              placeholder={SETUP_COPY.portablePathPlaceholder}
              disabled={exportPortable.isPending}
            />
            <button type="submit" disabled={!portablePath || exportPortable.isPending}>
              {SETUP_COPY.portableAction}
            </button>
          </form>
          {portableRecord && (
            <p>
              {SETUP_COPY.portableResult(portableRecord.file_path, (portableRecord.file_size_bytes / 1024).toFixed(1), portableRecord.kind, portableRecord.project_db_sha256.slice(0, 12))}
            </p>
          )}
        </section>
      )}
      {projectId && (
        <section>
          <h2>{SETUP_COPY.diagnosticTitle}</h2>
          <p>{SETUP_COPY.diagnosticIntro}</p>
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
              title={SETUP_COPY.saveDiagnosticFile}
              placeholder={SETUP_COPY.diagnosticPathPlaceholder}
              disabled={createDiagnostic.isPending || confirm !== null}
            />
            <button
              type="submit"
              disabled={!diagnosticPath || createDiagnostic.isPending}
            >
              {SETUP_COPY.diagnosticAction}
            </button>
          </form>
          {diagnosticRecord && (
            <p>
              {SETUP_COPY.diagnosticResult(diagnosticRecord.path, diagnosticRecord.file_count, diagnosticRecord.paths_redacted, diagnosticRecord.sha256.slice(0, 12))}
            </p>
          )}
        </section>
      )}
      {confirm && (
        <DestructiveConfirmDialog
          title={
            confirm === "backup"
              ? SETUP_COPY.confirmBackupTitle
              : confirm === "restore"
                ? SETUP_COPY.confirmRestoreTitle
                : SETUP_COPY.confirmDiagnosticTitle
          }
          description={
            confirm === "backup"
              ? SETUP_COPY.confirmBackupDesc(backupPath)
              : confirm === "restore"
                ? SETUP_COPY.confirmRestoreDesc(restoreArchive, restoreRoot)
                : SETUP_COPY.confirmDiagnosticDesc(diagnosticPath)
          }
          confirmLabel={
            confirm === "backup"
              ? SETUP_COPY.backupAction
              : confirm === "restore"
                ? SETUP_COPY.restoreAction
                : SETUP_COPY.diagnosticAction
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
