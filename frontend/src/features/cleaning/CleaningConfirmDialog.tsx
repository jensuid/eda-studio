import { useEffect, useRef, useState } from "react";
import type { CleaningPreviewSummary } from "../../shared/ipc/generated";
import { CLEANING_COPY } from "../../shared/copy/featureCopy";

interface Props {
  preview: CleaningPreviewSummary;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function CleaningConfirmDialog({ preview, pending, onCancel, onConfirm }: Props) {
  const [agreed, setAgreed] = useState(false);
  const [highImpactAgreed, setHighImpactAgreed] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLFormElement>(null);

  const highImpact = preview.affected_pct > 50;
  const canConfirm = agreed && (!highImpact || highImpactAgreed) && !pending;

  useEffect(() => {
    // P2-5: fokus ke tombol Batal saat dialog terbuka; kembalikan fokus
    // ke pemicu (elemen yang terfokus sebelumnya) saat dialog ditutup.
    const prev = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    return () => {
      prev?.focus?.();
    };
  }, []);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      if (!pending) onCancel();
      return;
    }
    if (e.key !== "Tab") return;
    // Focus trap: cycle within the dialog.
    const form = dialogRef.current;
    if (!form) return;
    const focusables = form.querySelectorAll<HTMLElement>(
      "button:not([disabled]), input:not([disabled])",
    );
    if (focusables.length === 0) return;
    const first = focusables[0]!;
    const last = focusables[focusables.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className="dialog-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="cleaning-dialog-title"
      aria-describedby="cleaning-dialog-desc"
    >
      <form
        ref={dialogRef}
        className="cleaning-danger-dialog surface-raised border-subtle"
        onSubmit={(e) => e.preventDefault()}
        onKeyDown={onKeyDown}
      >
        <div className="dialog-scroll">
          <h3 id="cleaning-dialog-title" className="status-danger">{CLEANING_COPY.confirmTitle}</h3>
          <p id="cleaning-dialog-desc">
            {CLEANING_COPY.confirmDesc}
          </p>
          <p className="cleaning-impact">
            {CLEANING_COPY.confirmOperationLine(preview.operation, preview.columns.join(", ") || "-")}
          </p>
          <p className="cleaning-impact">
            {CLEANING_COPY.impactRows(preview.row_count_before, preview.row_count_after, preview.affected_rows, preview.affected_pct)}
          </p>
          <p className="cleaning-impact">
            {CLEANING_COPY.impactParent(preview.parent_fingerprint.slice(0, 12))}
          </p>
          <p>{CLEANING_COPY.confirmSourceUnchanged}</p>
          <label className="dialog-field">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />{" "}
            {preview.operation === "impute"
              ? CLEANING_COPY.confirmImputeAgree(preview.affected_rows, preview.columns.join(", "))
              : CLEANING_COPY.confirmDeleteAgree(preview.affected_rows)}
          </label>
          {highImpact && (
            <label className="dialog-field">
              <input
                type="checkbox"
                checked={highImpactAgreed}
                onChange={(e) => setHighImpactAgreed(e.target.checked)}
              />{" "}
              {CLEANING_COPY.confirmHighImpact}
            </label>
          )}
        </div>
        <div className="dialog-actions">
          <button type="button" ref={cancelRef} onClick={onCancel} disabled={pending}>
            {CLEANING_COPY.cancel}
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            {pending ? CLEANING_COPY.applying : CLEANING_COPY.apply}
          </button>
        </div>
      </form>
    </div>
  );
}
