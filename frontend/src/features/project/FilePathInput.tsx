import { useState } from "react";
import { ipcClient } from "../../shared/ipc/ipcClient";

export interface FilePathInputProps {
  value: string;
  onChange: (path: string) => void;
  mode: "open" | "save";
  fileTypes: string[]; // extensions without dot, e.g. ["csv", "xlsx", "parquet"]
  title?: string;
  placeholder?: string;
  disabled?: boolean;
}

/** Readonly path field + "Pilih…" button (P2-3). The native dialog is
 *  invoked through ipcClient.pickFile; a cancelled dialog leaves the
 *  current value untouched. */
export function FilePathInput({
  value, onChange, mode, fileTypes, title, placeholder, disabled,
}: FilePathInputProps) {
  const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick() {
    setPicking(true);
    setError(null);
    try {
      const rec = await ipcClient.pickFile(mode, fileTypes, title);
      if (rec.path) onChange(rec.path);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPicking(false);
    }
  }

  const busy = disabled || picking;
  return (
    <span className="file-path-input">
      <input
        type="text"
        value={value}
        readOnly
        placeholder={placeholder}
        onChange={() => undefined}
        aria-label={title ?? "Path"}
        disabled={busy}
      />
      <button type="button" onClick={pick} disabled={busy}>
        {picking ? "…" : "Pilih…"}
      </button>
      {error && <span role="alert">{error}</span>}
    </span>
  );
}
