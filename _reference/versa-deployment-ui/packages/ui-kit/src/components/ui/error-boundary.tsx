import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {
    // Error captured in state and shown in fallback; no console in production
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100vh",
            background: "var(--color-bg-primary)",
            color: "var(--color-text-primary)",
            fontFamily: "var(--font-sans)",
            padding: "2rem",
          }}
        >
          <div
            style={{
              background: "var(--color-bg-secondary)",
              border: "1px solid var(--color-border-default)",
              borderRadius: "var(--radius-lg)",
              padding: "2rem",
              maxWidth: "32rem",
              textAlign: "center",
            }}
          >
            <h2
              style={{
                fontSize: "1.25rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                fontSize: "0.875rem",
                color: "var(--color-text-secondary)",
                marginBottom: "1rem",
              }}
            >
              {this.state.error?.message ?? "An unexpected error occurred"}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: "var(--color-accent)",
                color: "var(--color-text-inverse)",
                border: "none",
                borderRadius: "var(--radius-md)",
                padding: "0.5rem 1rem",
                fontSize: "0.875rem",
                cursor: "pointer",
              }}
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
