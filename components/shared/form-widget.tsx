"use client";

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Hook for managing form submission state (isSubmitting + error).
 * Wraps an async submit function with loading/error handling.
 */
export function useFormSubmit() {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = React.useCallback(async (fn: () => void | Promise<void>) => {
    setError(null);
    setIsSubmitting(true);
    try {
      await fn();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submission failed";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    isSubmitting,
    error,
    clearError: () => setError(null),
    handleSubmit,
  };
}

/**
 * Base layout component for form widgets.
 *
 * Provides:
 * - Consistent padding and vertical stack layout
 * - Loading skeleton when `isLoading` is true
 * - Dismissible error banner
 * - Optional `<form>` wrapper with `onSubmit` for keyboard support
 */
export function FormWidget({
  children,
  isLoading,
  error,
  onClearError,
  className,
  onSubmit,
  "data-testid": dataTestId,
}: {
  children: React.ReactNode;
  isLoading?: boolean;
  error?: string | null;
  onClearError?: () => void;
  className?: string;
  onSubmit?: () => void;
  "data-testid"?: string;
}) {
  if (isLoading) {
    return (
      <div className={cn("space-y-3 p-1", className)} data-testid={dataTestId}>
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-9 w-full" />
      </div>
    );
  }

  const content = (
    <>
      {error && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs text-rose-400">
          <AlertTriangle className="size-3.5 shrink-0" />
          <span className="flex-1">{error}</span>
          {onClearError && (
            <button type="button" onClick={onClearError} className="hover:text-rose-300">
              <X className="size-3.5" />
            </button>
          )}
        </div>
      )}
      {children}
    </>
  );

  if (onSubmit) {
    return (
      <form
        className={cn("space-y-3 p-1", className)}
        data-testid={dataTestId}
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {content}
      </form>
    );
  }

  return (
    <div className={cn("space-y-3 p-1", className)} data-testid={dataTestId}>
      {content}
    </div>
  );
}
