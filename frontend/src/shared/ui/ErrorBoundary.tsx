/**
 * ErrorBoundary.tsx — P2-2 error boundary per-route. Crash satu route tidak
 * menjatuhkan shell; fallback berlabel + tombol coba lagi (reset state).
 */
import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  label: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[${this.props.label}] render error`, error, info);
  }

  private reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    if (this.state.error) {
      return (
        <section className="error-boundary" role="alert">
          <h2>Terjadi kesalahan di {this.props.label}</h2>
          <p>{this.state.error.message}</p>
          <button type="button" onClick={this.reset}>
            Coba lagi
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}
