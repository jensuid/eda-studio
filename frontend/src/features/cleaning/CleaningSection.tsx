import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ipcClient } from "../../shared/ipc/ipcClient";
import type {
  CleaningOperation,
  CleaningPreviewSummary,
  CleaningRecord,
  CleaningStrategy,
  DatasetRecord,
  ProfileRecord,
  QualityRecord,
} from "../../shared/ipc/generated";
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
      <h2>Cleaning</h2>
      {!gated && (
        <>
          <CleaningEmpty message="Jalankan Quality Check terlebih dahulu." />
          {qualityStale && <CleaningStaleBanner message="Hasil mungkin usang — jalankan ulang." />}
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
              Hitung dampak
            </button>
            {preview && !previewStale && (
              <button disabled={runMutation.isPending} onClick={() => setDialogOpen(true)}>
                Terapkan cleaning
              </button>
            )}
          </p>
          {previewMutation.isPending && <CleaningSkeleton />}
          {previewMutation.isError && (
            <CleaningError message="Tidak dapat menghitung dampak. Silakan coba lagi." />
          )}
          {preview && !previewStale && !previewMutation.isPending && <CleaningImpactSummary preview={preview} />}
          {previewStale && <CleaningStaleBanner message="Snapshot telah berubah. Hitung ulang dampak." />}
          {runMutation.isError && (
            <CleaningError message="Cleaning gagal. Silakan coba lagi." />
          )}
          {runMutation.isError && runMutation.error.message.includes("Snapshot telah berubah") && (
            <CleaningStaleBanner message="Snapshot telah berubah. Hitung ulang dampak." />
          )}
          {completed && (
            <div role="status">
              <p>Cleaning selesai. Snapshot baru telah dibuat.</p>
              <p>Snapshot baru: {completed.child_snapshot_id.slice(0, 8)} &middot; {completed.child_fingerprint.slice(0, 12)}&hellip; &middot; {completed.row_count_before} &rarr; {completed.row_count_after} baris</p>
              <button onClick={() => setCompleted(null)}>Gunakan snapshot baru</button>{" "}
              <button disabled={activateMutation.isPending} onClick={() => activateMutation.mutate(completed.child_snapshot_id)}>
                Jadikan aktif
              </button>
              {completed.filled_rows != null && (
                <p>Baris diisi: {completed.filled_rows} pada kolom {completed.columns.join(", ")}.</p>
              )}
              {activateMutation.isError && (
                <CleaningError message="Cleaning gagal. Silakan coba lagi." />
              )}
            </div>
          )}
          {cancelled && !dialogOpen && (
            <p role="status">Cleaning dibatalkan. Tidak ada snapshot baru.</p>
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
