import { useEffect, useRef, useState } from "react";
import type { CleaningPreviewSummary } from "../../shared/ipc/generated";

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
    cancelRef.current?.focus();
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
      className="cleaning-danger-dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="cleaning-dialog-title"
      aria-describedby="cleaning-dialog-desc"
      style={{
        position: "fixed", inset: 0, display: "flex",
        alignItems: "center", justifyContent: "center", zIndex: 50,
      }}
    >
      <form
        ref={dialogRef}
        className="cleaning-danger-dialog surface-raised border-subtle"
        style={{
          display: "flex", flexDirection: "column",
          padding: 24, borderRadius: 8,
          maxWidth: 520, width: "90%",
          maxHeight: "calc(100vh - 64px)",
        }}
        onSubmit={(e) => e.preventDefault()}
        onKeyDown={onKeyDown}
      >
        <div style={{ overflowY: "auto" }}>
          <h3 id="cleaning-dialog-title" className="status-danger">Terapkan cleaning?</h3>
          <p id="cleaning-dialog-desc">
            Operasi ini bersifat destruktif. Periksa ringkasan dampak berikut sebelum melanjutkan.
          </p>
          <p className="cleaning-impact">
            Operasi: {preview.operation} &middot; Kolom: {preview.columns.join(", ") || "-"}
          </p>
          <p className="cleaning-impact">
            Baris: {preview.row_count_before} &rarr; {preview.row_count_after} &middot;
            Terdampak: {preview.affected_rows} ({preview.affected_pct}%)
          </p>
          <p className="cleaning-impact">
            Snapshot induk: {preview.parent_fingerprint.slice(0, 12)}&hellip;
          </p>
          <p>Snapshot sumber tidak diubah. Hasilnya disimpan sebagai snapshot baru dan perlu diaktifkan secara manual.</p>
          <label style={{ display: "block", margin: "12px 0" }}>
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />{" "}
            {preview.operation === "impute"
              ? `Saya memahami ${preview.affected_rows} sel akan diisi pada kolom ${preview.columns.join(", ")}.`
              : `Saya memahami ${preview.affected_rows} baris akan dihapus dari snapshot ini.`}
          </label>
          {highImpact && (
            <label style={{ display: "block", margin: "12px 0" }}>
              <input
                type="checkbox"
                checked={highImpactAgreed}
                onChange={(e) => setHighImpactAgreed(e.target.checked)}
              />{" "}
              Lebih dari setengah baris akan dihapus.
            </label>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", paddingTop: 12 }}>
          <button type="button" ref={cancelRef} onClick={onCancel} disabled={pending}>
            Batal
          </button>
          <button
            type="button"
            disabled={!canConfirm}
            onClick={onConfirm}
          >
            {pending ? "Menerapkan cleaning…" : "Terapkan cleaning"}
          </button>
        </div>
      </form>
    </div>
  );
}
