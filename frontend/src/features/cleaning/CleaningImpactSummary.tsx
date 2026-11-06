import type { CleaningPreviewSummary } from "../../shared/ipc/generated";

const OP_LABEL: Record<string, string> = {
  drop_duplicates: "Hapus baris duplikat",
  drop_missing: "Hapus baris hilang",
  impute: "Isi nilai hilang",
};

export function CleaningImpactSummary({ preview }: { preview: CleaningPreviewSummary }) {
  return (
    <div className="cleaning-impact">
      <p><strong>{OP_LABEL[preview.operation] ?? preview.operation}</strong></p>
      {preview.columns.length > 0 && <p>Kolom: {preview.columns.join(", ")}</p>}
      <p>Baris: {preview.row_count_before} &rarr; {preview.row_count_after} &middot; Terdampak: {preview.affected_rows} ({preview.affected_pct}%)</p>
      {preview.filled_rows != null && <p>Diisi: {preview.filled_rows} sel</p>}
      {preview.per_column_affected && preview.per_column_affected.length > 0 && (
        <ul>
          {preview.per_column_affected.map((c) => (
            <li key={c.column}>{c.column}: {c.affected_rows} baris</li>
          ))}
        </ul>
      )}
      <p>Snapshot induk: {preview.parent_fingerprint.slice(0, 12)}&hellip;</p>
      {preview.affected_rows === 0 && preview.operation === "drop_duplicates" && (
        <p>Tidak ditemukan baris duplikat pada snapshot ini.</p>
      )}
      {preview.affected_rows === 0 && preview.operation !== "drop_duplicates" && (
        <p>Tidak ada nilai kosong pada kolom yang dipilih.</p>
      )}
    </div>
  );
}

export function CleaningSkeleton() {
  return <p role="status">Menghitung dampak&hellip;</p>;
}

export function CleaningEmpty({ message }: { message: string }) {
  return <p>{message}</p>;
}

export function CleaningError({ message }: { message: string }) {
  return <p role="alert">{message}</p>;
}
