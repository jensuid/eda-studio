import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ipcClient, IpcError } from "../../shared/ipc/ipcClient";
import type {
  CleaningOperation,
  CleaningPreviewSummary,
  CleaningRecord,
  CleaningStrategy,
  DatasetRecord,
  ProfileRecord,
  QualityRecord,
} from "../../shared/ipc/generated";
import { CLEANING_COPY } from "../../shared/copy/featureCopy";
import { CleaningConfirmDialog } from "./CleaningConfirmDialog";
import { CleaningEmpty, CleaningError, CleaningImpactSummary, CleaningSkeleton } from "./CleaningImpactSummary";
import { CleaningOperationPicker, constantError } from "./CleaningOperationPicker";
import { CleaningStaleBanner } from "./CleaningStaleBanner";

interface Props {
  projectId: string;
  dataset: DatasetRecord;
  savedProfile: ProfileRecord | null;
  qualityRecord: QualityRecord | null;
  onDatasetChange: (d: DatasetRecord) => void;
}

export function CleaningSection({ projectId, dataset, savedProfile, qualityRecord, onDatasetChange }: Props) {
  const queryClient = useQueryClient();
  const [operation, setOperation] = useState<CleaningOperation>("drop_duplicates");
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [strategy, setStrategy] = useState<CleaningStrategy>("mean");
  const [constantValue, setConstantValue] = useState("");
  const [preview, setPreview] = useState<CleaningPreviewSummary | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [completed, setCompleted] = useState<CleaningRecord | null>(null);
  // Preview computed before the last successful run is stashed so it can be
  // restored after activation — by then its parent fingerprint is stale.
  const [stalePreview, setStalePreview] = useState<CleaningPreviewSummary | null>(null);

  const qualityStale = !!qualityRecord && qualityRecord.fingerprint !== dataset.fingerprint;
  const gated = !!qualityRecord && !qualityStale;

  const columnsForOp = operation === "drop_duplicates" ? [] : selectedColumns;

  const previewMutation = useMutation({
    mutationFn: () =>
      ipcClient.previewCleaning(
        projectId, dataset.dataset_id, operation, columnsForOp,
        operation === "impute" ? strategy : undefined,
        operation === "impute" && strategy === "constant" ? constantValue : undefined,
      ),
    onSuccess: (r) => {
      setPreview(r);
      setStalePreview(null);
      setCompleted(null);
      setCancelled(false);
    },
  });

  const runMutation = useMutation({
    mutationFn: () =>
      ipcClient.runCleaning(
        projectId, dataset.dataset_id, operation, columnsForOp,
        preview!.parent_fingerprint,
        operation === "impute" ? strategy : undefined,
        operation === "impute" && strategy === "constant" ? constantValue : undefined,
      ),
    onSuccess: (rec) => {
      setCompleted(rec);
      setDialogOpen(false);
      setStalePreview(preview);
      setPreview(null);
      void queryClient.invalidateQueries({ queryKey: ["snapshots", projectId] });
    },
  });

  const activateMutation = useMutation({
    mutationFn: (snapshotId: string) =>
      ipcClient.activateSnapshot(projectId, dataset.dataset_id, snapshotId),
    onSuccess: (d) => {
      onDatasetChange(d);
      setCompleted(null);
      // Restore the pre-apply preview: its parent fingerprint no longer
      // matches the now-active snapshot, so the stale banner appears.
      setPreview(stalePreview);
      setStalePreview(null);
      void queryClient.invalidateQueries({ queryKey: ["snapshots", projectId] });
    },
  });

  const previewStale = !!preview && preview.parent_fingerprint !== dataset.fingerprint;
  const imputeColumnType =
    savedProfile?.columns.find((c) => c.name === selectedColumns[0])?.inferred_type ?? "empty";
  const constantInvalid =
    operation === "impute" && strategy === "constant" &&
    constantError(imputeColumnType, constantValue) !== null;

  return (
    <section>
      <h2>{CLEANING_COPY.heading}</h2>
      {!gated && (
        <>
          <CleaningEmpty message={CLEANING_COPY.emptyNeedQuality} />
          {qualityStale && <CleaningStaleBanner message={CLEANING_COPY.staleQuality} />}
        </>
      )}
      {gated && (
        <>
          <CleaningOperationPicker
            operation={operation}
            onOperationChange={(op) => { setOperation(op); setPreview(null); }}
            columns={savedProfile?.columns ?? null}
            columnNames={dataset.columns}
            selectedColumns={selectedColumns}
            onSelectedColumnsChange={(cols) => { setSelectedColumns(cols); setPreview(null); }}
            strategy={strategy}
            onStrategyChange={(s) => { setStrategy(s); setPreview(null); }}
            constantValue={constantValue}
            onConstantValueChange={(v) => { setConstantValue(v); setPreview(null); }}
            disabled={previewMutation.isPending || runMutation.isPending}
          />
          <p>
            <button
              disabled={
                previewMutation.isPending || runMutation.isPending ||
                (operation === "drop_missing" && selectedColumns.length === 0) ||
                (operation === "impute" && selectedColumns.length !== 1) ||
                (operation === "impute" && strategy === "constant" && constantValue === "") ||
                constantInvalid
              }
              onClick={() => previewMutation.mutate()}
            >
              {CLEANING_COPY.previewImpactAction}
            </button>
            {preview && !previewStale && (
              <button disabled={runMutation.isPending} onClick={() => setDialogOpen(true)}>
                {CLEANING_COPY.applyAction}
              </button>
            )}
          </p>
          {previewMutation.isPending && <CleaningSkeleton />}
          {previewMutation.isError && (
            <CleaningError message={CLEANING_COPY.previewError} />
          )}
          {preview && !previewStale && !previewMutation.isPending && <CleaningImpactSummary preview={preview} />}
          {previewStale && <CleaningStaleBanner message={CLEANING_COPY.staleChanged} />}
          {runMutation.isError && (
            <CleaningError message={CLEANING_COPY.runError} />
          )}
          {runMutation.isError && runMutation.error instanceof IpcError && runMutation.error.code === "CONFLICT" && (
            <CleaningStaleBanner message={CLEANING_COPY.staleChanged} />
          )}
          {completed && (
            <div role="status">
              <p>{CLEANING_COPY.completedMessage}</p>
              <p>{CLEANING_COPY.newSnapshotInfo(completed.child_snapshot_id.slice(0, 8), completed.child_fingerprint.slice(0, 12), completed.row_count_before, completed.row_count_after)}</p>
              {/* SCREEN-CLEAN-001: "Gunakan snapshot baru" is the activate
                  CTA; revert ("Jadikan aktif") lives in the snapshot list. */}
              <button disabled={activateMutation.isPending} onClick={() => activateMutation.mutate(completed.child_snapshot_id)}>
                {CLEANING_COPY.activateNew}
              </button>
              {completed.filled_rows != null && (
                <p>{CLEANING_COPY.filledRows(completed.filled_rows, completed.columns.join(", "))}</p>
              )}
              {activateMutation.isError && (
                <CleaningError message={CLEANING_COPY.runError} />
              )}
            </div>
          )}
          {cancelled && !dialogOpen && (
            <p role="status">{CLEANING_COPY.cancelled}</p>
          )}
          {dialogOpen && preview && (
            <CleaningConfirmDialog
              preview={preview}
              pending={runMutation.isPending}
              onCancel={() => { setDialogOpen(false); setCancelled(true); }}
              onConfirm={() => runMutation.mutate()}
            />
          )}
        </>
      )}
    </section>
  );
}
