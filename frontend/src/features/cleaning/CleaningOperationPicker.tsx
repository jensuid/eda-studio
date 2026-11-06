import type { CleaningOperation, CleaningStrategy, ColumnProfile } from "../../shared/ipc/generated";

export const OPERATION_OPTIONS: { value: CleaningOperation; label: string; hint: string }[] = [
  { value: "drop_duplicates", label: "Hapus baris duplikat", hint: "Snapshot-wide, duplikat persis" },
  { value: "drop_missing", label: "Hapus baris hilang", hint: "Baris dengan nilai hilang di kolom dipilih" },
  { value: "impute", label: "Isi nilai hilang", hint: "Isi sel kosong pada satu kolom" },
];

export const STRATEGY_OPTIONS: { value: CleaningStrategy; label: string }[] = [
  { value: "mean", label: "Rata-rata (mean)" },
  { value: "median", label: "Median" },
  { value: "mode", label: "Modus (mode)" },
  { value: "constant", label: "Konstanta" },
];

/** F2 eligibility: which strategies a column type allows. */
export function eligibleStrategies(inferredType: string): CleaningStrategy[] {
  if (inferredType === "numeric") return ["mean", "median", "constant"];
  if (inferredType === "categorical") return ["mode", "constant"];
  // empty column: only constant is eligible (F2)
  return ["constant"];
}

interface Props {
  operation: CleaningOperation;
  onOperationChange: (op: CleaningOperation) => void;
  columns: ColumnProfile[] | null;
  columnNames: string[];
  selectedColumns: string[];
  onSelectedColumnsChange: (cols: string[]) => void;
  strategy: CleaningStrategy;
  onStrategyChange: (s: CleaningStrategy) => void;
  constantValue: string;
  onConstantValueChange: (v: string) => void;
  disabled?: boolean;
}

/** Inline constant validation (SCREEN-CLEAN-001): returns the ratified copy or null. */
export function constantError(
  inferredType: string,
  constantValue: string,
): string | null {
  if (constantValue === "") return null;
  if (inferredType === "numeric") {
    return Number.isNaN(Number(constantValue))
      ? "Masukkan angka yang valid untuk kolom ini."
      : null;
  }
  return constantValue.trim() === ""
    ? "Masukkan teks yang tidak kosong."
    : null;
}

export function CleaningOperationPicker(props: Props) {
  const { operation, columns, columnNames, selectedColumns, strategy } = props;
  const colType = (name: string) => columns?.find((c) => c.name === name)?.inferred_type ?? "empty";
  const imputeColumn = selectedColumns[0];
  const allowed = imputeColumn ? eligibleStrategies(colType(imputeColumn)) : STRATEGY_OPTIONS.map((s) => s.value);
  // If current strategy became ineligible, user must pick an eligible one (backend F2/F4 still authoritative).

  return (
    <div>
      <fieldset>
        <legend>Pilih operasi</legend>
        {OPERATION_OPTIONS.map((o) => (
          <label key={o.value} className="cleaning-operation-id">
            <input
              type="radio"
              name="cleaning-operation"
              value={o.value}
              checked={operation === o.value}
              disabled={props.disabled}
              onChange={() => props.onOperationChange(o.value)}
            />{" "}
            {o.label} — <small>{o.hint}</small>
          </label>
        ))}
      </fieldset>

      {operation === "drop_duplicates" && (
        <p>Berlaku snapshot-wide. Duplikat berakhir dihitung ulang dari snapshot aktif.</p>
      )}

      {operation === "drop_missing" && (
        <fieldset>
          <legend>Kolom (gabungan — union)</legend>
          <div style={{ maxHeight: 200, overflowY: "auto" }}>
            {columnNames.map((c) => (
              <label key={c} style={{ display: "block" }}>
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(c)}
                  disabled={props.disabled}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...selectedColumns, c]
                      : selectedColumns.filter((x) => x !== c);
                    props.onSelectedColumnsChange(next);
                  }}
                />{" "}
                {c}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {operation === "impute" && (
        <div>
          <label htmlFor="cleaning-impute-column">Kolom</label>{" "}
          <select
            id="cleaning-impute-column"
            value={imputeColumn ?? ""}
            disabled={props.disabled}
            onChange={(e) => props.onSelectedColumnsChange(e.target.value ? [e.target.value] : [])}
          >
            <option value="">— pilih —</option>
            {columnNames.map((c) => (
              <option key={c} value={c}>{c} ({colType(c)})</option>
            ))}
          </select>
          {imputeColumn && colType(imputeColumn) === "empty" && (
            <p>Kolom ini kosong — hanya konstanta yang tersedia.</p>
          )}
          <fieldset>
            <legend>Strategi</legend>
            {STRATEGY_OPTIONS.map((s) => {
              const ok = allowed.includes(s.value);
              return (
                <label key={s.value}>
                  <input
                    type="radio"
                    name="cleaning-strategy"
                    value={s.value}
                    checked={strategy === s.value}
                    disabled={props.disabled || !ok}
                    onChange={() => props.onStrategyChange(s.value)}
                  />{" "}
                  {s.label}{!ok ? " — Strategi ini tidak tersedia untuk tipe kolom ini." : ""}
                </label>
              );
            })}
          </fieldset>
          {strategy === "constant" && (
            <div>
              <label htmlFor="cleaning-constant">Nilai konstanta</label>{" "}
              <input
                id="cleaning-constant"
                value={props.constantValue}
                disabled={props.disabled}
                onChange={(e) => props.onConstantValueChange(e.target.value)}
                placeholder="Nilai pengisi"
              />
              {constantError(
                imputeColumn ? colType(imputeColumn) : "empty",
                props.constantValue,
              ) && (
                <p role="alert">
                  {constantError(
                    imputeColumn ? colType(imputeColumn) : "empty",
                    props.constantValue,
                  )}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
