import type { CleaningOperation, CleaningStrategy, ColumnProfile } from "../../shared/ipc/generated";
import { CLEANING_COPY } from "../../shared/copy/featureCopy";

export const OPERATION_OPTIONS: { value: CleaningOperation; label: string; hint: string }[] = [
  { value: "drop_duplicates", label: CLEANING_COPY.opDropDuplicates, hint: CLEANING_COPY.opDropDuplicatesHint },
  { value: "drop_missing", label: CLEANING_COPY.opDropMissing, hint: CLEANING_COPY.opDropMissingHint },
  { value: "impute", label: CLEANING_COPY.opImpute, hint: CLEANING_COPY.opImputeHint },
];

export const STRATEGY_OPTIONS: { value: CleaningStrategy; label: string }[] = [
  { value: "mean", label: CLEANING_COPY.strategyMean },
  { value: "median", label: CLEANING_COPY.strategyMedian },
  { value: "mode", label: CLEANING_COPY.strategyMode },
  { value: "constant", label: CLEANING_COPY.strategyConstant },
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
      ? CLEANING_COPY.constantNumericError
      : null;
  }
  return constantValue.trim() === ""
    ? CLEANING_COPY.constantTextError
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
        <legend>{CLEANING_COPY.chooseOperation}</legend>
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
        <p>{CLEANING_COPY.dropDuplicatesNote}</p>
      )}

      {operation === "drop_missing" && (
        <fieldset>
          <legend>{CLEANING_COPY.columnsUnionLegend}</legend>
          <div className="form-scroll-list">
            {columnNames.map((c) => (
              <label key={c} className="form-label-block">
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
          <label htmlFor="cleaning-impute-column">{CLEANING_COPY.columnLabel}</label>{" "}
          <select
            id="cleaning-impute-column"
            value={imputeColumn ?? ""}
            disabled={props.disabled}
            onChange={(e) => props.onSelectedColumnsChange(e.target.value ? [e.target.value] : [])}
          >
            <option value="">{CLEANING_COPY.choosePlaceholder}</option>
            {columnNames.map((c) => (
              <option key={c} value={c}>{c} ({colType(c)})</option>
            ))}
          </select>
          {imputeColumn && colType(imputeColumn) === "empty" && (
            <p>{CLEANING_COPY.emptyColumnNote}</p>
          )}
          <fieldset>
            <legend>{CLEANING_COPY.strategyLegend}</legend>
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
                  {s.label}{!ok ? CLEANING_COPY.strategyUnavailable : ""}
                </label>
              );
            })}
          </fieldset>
          {strategy === "constant" && (
            <div>
              <label htmlFor="cleaning-constant">{CLEANING_COPY.constantValueLabel}</label>{" "}
              <input
                id="cleaning-constant"
                value={props.constantValue}
                disabled={props.disabled}
                onChange={(e) => props.onConstantValueChange(e.target.value)}
                placeholder={CLEANING_COPY.constantValuePlaceholder}
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
