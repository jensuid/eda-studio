import { useEffect, useRef, useState } from "react";
import { PROJECT_COPY } from "../../shared/copy/featureCopy";

export interface DestructiveConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

/**
 * Destructive-action confirmation (P2-3), modelled on
 * CleaningConfirmDialog: alertdialog semantics, focus trap, Escape cancels,
 * confirm stays disabled until the user ticks the acknowledgement checkbox,
 * and the confirm button is disabled while the mutation is pending (Doc10).
 */
export function DestructiveConfirmDialog({
  title, description, confirmLabel, pending, onCancel, onConfirm,
}: DestructiveConfirmDialogProps) {
  const [agreed, setAgreed] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // P2-5: fokus ke tombol Batal saat dialog terbuka; kembalikan fokus
    // ke pemicu saat dialog ditutup (lihat CleaningConfirmDialog).
    const prev = document.activeElement as HTMLElement | null;
    cancelRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key === "Tab") {
        const el = dialogRef.current;
        if (!el) return;
        const focusable = Array.from(
          el.querySelectorAll<HTMLElement>(
            'button, [href], input, select, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((n) => !n.hasAttribute("disabled"));
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      prev?.focus?.();
    };
  }, [onCancel]);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="destructive-confirm-title"
        aria-describedby="destructive-confirm-desc"
        className="modal"
        onKeyDown={(e) => {
          if (e.key === "Enter") e.preventDefault();
        }}
      >
        <h2 id="destructive-confirm-title">{title}</h2>
        <p id="destructive-confirm-desc">{description}</p>
        <label className="check">
          <input
            type="checkbox"
            checked={agreed}
            disabled={pending}
            onChange={(e) => setAgreed(e.target.checked)}
          />
          {PROJECT_COPY.destructiveAck}
        </label>
        <div className="actions">
          <button ref={cancelRef} type="button" onClick={onCancel} disabled={pending}>
            {PROJECT_COPY.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!agreed || pending}
          >
            {pending ? PROJECT_COPY.processing : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
