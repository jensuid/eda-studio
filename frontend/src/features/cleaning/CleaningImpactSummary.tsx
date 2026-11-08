import type { CleaningPreviewSummary } from "../../shared/ipc/generated";
import { CLEANING_COPY } from "../../shared/copy/featureCopy";

const OP_LABEL: Record<string, string> = {
  drop_duplicates: CLEANING_COPY.opDropDuplicates,
  drop_missing: CLEANING_COPY.opDropMissing,
  impute: CLEANING_COPY.opImpute,
};

export function CleaningImpactSummary({ preview }: { preview: CleaningPreviewSummary }) {
  return (
    <div className="cleaning-impact">
      <p><strong>{OP_LABEL[preview.operation] ?? preview.operation}</strong></p>
      {preview.columns.length > 0 && <p>{CLEANING_COPY.impactColumns(preview.columns.join(", "))}</p>}
      <p>{CLEANING_COPY.impactRows(preview.row_count_before, preview.row_count_after, preview.affected_rows, preview.affected_pct)}</p>
      {preview.filled_rows != null && <p>{CLEANING_COPY.impactFilled(preview.filled_rows)}</p>}
      {preview.per_column_affected && preview.per_column_affected.length > 0 && (
        <ul>
          {preview.per_column_affected.map((c) => (
            <li key={c.column}>{CLEANING_COPY.impactPerColumn(c.column, c.affected_rows)}</li>
          ))}
        </ul>
      )}
      <p>{CLEANING_COPY.impactParent(preview.parent_fingerprint.slice(0, 12))}</p>
      {preview.affected_rows === 0 && preview.operation === "drop_duplicates" && (
        <p>{CLEANING_COPY.impactNoDuplicates}</p>
      )}
      {preview.affected_rows === 0 && preview.operation !== "drop_duplicates" && (
        <p>{CLEANING_COPY.impactNoMissing}</p>
      )}
    </div>
  );
}

export function CleaningSkeleton() {
  return <p role="status">{CLEANING_COPY.impactCalculating}</p>;
}

export function CleaningEmpty({ message }: { message: string }) {
  return <p>{message}</p>;
}

export function CleaningError({ message }: { message: string }) {
  return <p role="alert">{message}</p>;
}
