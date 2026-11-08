/**
 * DiagnosticDetail.tsx — D-F6: detail diagnostik yang dapat disalin.
 *
 * Satu-satunya tempat pesan backend mentah boleh tampil: di dalam
 * `<details>` yang dapat disalin, tidak pernah di headline. Headline
 * selalu di-branch dari `error.code` (lihat `shared/copy/errorCopy.ts`),
 * sehingga toast/banner tidak menjadi satu-satunya rekam jejak dan
 * pesan mentah tidak bocor ke copy UI utama.
 */
import { useState } from "react";
import { SHELL_COPY } from "../copy/shellCopy";

export function DiagnosticDetail({ detail }: { detail: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(detail);
      setCopied(true);
    } catch {
      /* clipboard unavailable — detail tetap terlihat untuk disalin manual */
    }
  };

  return (
    <details className="diagnostic-detail">
      <summary>{SHELL_COPY.diagnosticDetail}</summary>
      <pre>{detail}</pre>
      <button type="button" onClick={() => void copy()}>
        {copied ? SHELL_COPY.copiedDiagnostic : SHELL_COPY.copyDiagnostic}
      </button>
    </details>
  );
}
