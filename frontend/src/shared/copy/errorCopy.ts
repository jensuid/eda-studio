/**
 * errorCopy.ts — D-F6 (FLOW-SHELL-001 §2.5): branch copy error per concern.
 *
 * Headline SELALU dipilih dari `error.code` (ErrorContract, via IpcError),
 * tidak pernah dari `error.message` mentah. Pesan mentah + code hanya
 * masuk `detail` diagnostik yang dapat disalin. Dedup: pemanggil memakai
 * `fingerprint` (concern + code + correlation_id bila ada) sebagai
 * identity, bukan kesamaan teks headline.
 */
import { IpcError } from "../ipc/ipcClient";
import { SHELL_COPY } from "./shellCopy";

export type ErrorConcern = "recovery" | "update" | "jobs";

export interface ConcernError {
  /** Headline (copy terpusat, Bahasa Indonesia). */
  headline: string;
  /** Detail diagnostik yang dapat disalin (code + pesan mentah). */
  detail: string;
  /** Kode ErrorContract, atau pseudo-code frontend bila error tanpa code. */
  code: string;
  /** Correlation id backend bila tersedia (identitas untuk dedup). */
  correlationId: string | null;
  /** Identity dedup: concern + code (+ correlation id bila ada). */
  fingerprint: string;
}

const RECOVERY_BY_CODE: Record<string, string> = {
  NOT_FOUND: SHELL_COPY.recoveryFailedNotFound,
  CONFLICT: SHELL_COPY.recoveryFailedConflict,
  VALIDATION_ERROR: SHELL_COPY.recoveryFailedValidation,
  PERMISSION_DENIED: SHELL_COPY.recoveryFailedPermission,
  UNSUPPORTED_FORMAT: SHELL_COPY.recoveryFailedUnsupported,
};

const UPDATE_BY_CODE: Record<string, string> = {
  NOT_FOUND: SHELL_COPY.updateFailedNotFound,
  CONFLICT: SHELL_COPY.updateFailedConflict,
  VALIDATION_ERROR: SHELL_COPY.updateFailedValidation,
  PERMISSION_DENIED: SHELL_COPY.updateFailedPermission,
  UNSUPPORTED_FORMAT: SHELL_COPY.updateFailedUnsupported,
};

function detailOf(e: unknown, code: string): string {
  const raw = e instanceof Error ? e.message : String(e);
  return `code: ${code}\nmessage: ${raw}`;
}

function correlationOf(e: unknown): string | null {
  return e instanceof IpcError ? e.correlationId ?? null : null;
}

/**
 * Describe an error for a single concern: headline branched on
 * `IpcError.code`; raw message confined to copyable diagnostic detail.
 */
export function describeConcernError(
  e: unknown,
  concern: ErrorConcern,
): ConcernError {
  const code =
    e instanceof IpcError ? e.code : concern === "jobs" ? "UNKNOWN" : "UNKNOWN";
  const correlationId = correlationOf(e);
  const headline =
    concern === "recovery"
      ? (RECOVERY_BY_CODE[code] ?? SHELL_COPY.recoveryFailedGeneric)
      : concern === "update"
        ? (UPDATE_BY_CODE[code] ?? SHELL_COPY.updateFailedGeneric)
        : SHELL_COPY.jobsLoadFailed;
  return {
    headline,
    detail: detailOf(e, code),
    code,
    correlationId,
    fingerprint: [concern, code, correlationId ?? ""].join(":"),
  };
}

/**
 * D-S2/D-F7 (UIUX-06): cabang copy error untuk kanal fitur. Headline diambil
 * dari `error.code` via `byCode` milik copy fitur (copy fitur menang atas
 * shell); `fallback` dipakai untuk code apa pun yang tidak terpetakan.
 * Pesan mentah tidak pernah masuk headline — hanya di `detail` (detail
 * diagnostik yang dapat disalin via DiagnosticDetail).
 */
export function describeFeatureError(
  e: unknown,
  byCode: Readonly<Record<string, string>>,
  fallback: string,
): ConcernError {
  const code = e instanceof IpcError ? e.code : "UNKNOWN";
  const correlationId = correlationOf(e);
  const headline = byCode[code] ?? fallback;
  return {
    headline,
    detail: detailOf(e, code),
    code,
    correlationId,
    fingerprint: ["feature", code, correlationId ?? ""].join(":"),
  };
}
