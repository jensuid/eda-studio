/**
 * Toaster.tsx — P2-2 toaster global untuk hasil mutation (sukses/gagal).
 * Satu region aria-live; pesan error memakai role="alert". Toast sukses
 * hilang otomatis (5 dtk); error bertahan sampai ditutup manual.
 */
import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { ReactNode } from "react";

export type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  push: (kind: ToastKind, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const AUTO_DISMISS_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, message: string) => {
      const id = nextId.current++;
      setToasts((prev) => [...prev.slice(-2), { id, kind, message }]);
      if (kind !== "error") {
        setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      }
    },
    [dismiss],
  );

  const api: ToastApi = {
    push,
    success: (message) => push("success", message),
    error: (message) => push("error", message),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast toast-${t.kind}`}
            role={t.kind === "error" ? "alert" : "status"}
          >
            <span>{t.message}</span>
            <button type="button" onClick={() => dismiss(t.id)} aria-label="Tutup notifikasi">
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}
