/**
 * ErrorBoundary.tsx — P2-2 error boundary per-route. Crash satu route tidak
 * menjatuhkan shell.
 *
 * D-F6 (FLOW-SHELL-001 §2.4 `crash-render` / §2.5): copy generik — headline
 * TIDAK PERNAH `error.message` mentah; pesan mentah hanya di detail
 * diagnostik yang dapat disalin. Aksi: "Coba lagi" + "Kembali ke Setup".
 * Retry tidak boleh loop pada crash deterministik: bila crash yang sama
 * (fingerprint pesan+stack) terulang setelah "Coba lagi", tombol retry
 * disembunyikan dan hanya "Kembali ke Setup" yang ditawarkan.
 */
import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { SHELL_COPY } from "../copy/shellCopy";
import { DiagnosticDetail } from "./DiagnosticDetail";

interface Props {
  label: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
  /** Fingerprint crash sebelumnya; crash sama berulang = deterministik. */
  previousFingerprint: string | null;
  deterministic: boolean;
}

function fingerprint(error: Error): string {
  return `${error.name}:${error.message}`;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, previousFingerprint: null, deterministic: false };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[${this.props.label}] render error`, error, info);
    const fp = fingerprint(error);
    if (this.state.previousFingerprint === fp) {
      this.setState({ deterministic: true });
    }
  }

  private reset = (): void => {
    this.setState((prev) => ({
      error: null,
      previousFingerprint: prev.error ? fingerprint(prev.error) : prev.previousFingerprint,
      deterministic: false,
    }));
  };

  private backToSetup = (): void => {
    window.location.hash = "#/setup";
    this.reset();
  };

  render(): ReactNode {
    if (this.state.error) {
      const detail = `code: RENDER_CRASH\nmessage: ${this.state.error.message}`;
      return (
        <section className="error-boundary" role="alert">
          <h2>{SHELL_COPY.renderCrashTitle(this.props.label)}</h2>
          <p>{SHELL_COPY.renderCrashBody}</p>
          <DiagnosticDetail detail={detail} />
          <div>
            {!this.state.deterministic && (
              <button type="button" onClick={this.reset}>
                {SHELL_COPY.tryAgain}
              </button>
            )}
            <button type="button" onClick={this.backToSetup}>
              {SHELL_COPY.backToSetup}
            </button>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}
