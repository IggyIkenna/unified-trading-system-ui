import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          data-slot="error-boundary"
          className={cn(
            "flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-xl border p-8 text-center",
          )}
        >
          <div className="text-destructive text-4xl">!</div>
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="text-muted-foreground max-w-md text-sm">
            {this.state.error?.message ?? "An unexpected error occurred."}
          </p>
          <div className="flex gap-3">
            <Button variant="outline" onClick={this.handleRetry}>
              Retry
            </Button>
            <Button variant="ghost" asChild>
              <a href="/">Return to Dashboard</a>
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };
