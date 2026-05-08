"use client";

/**
 * Signals service layout — wraps the Signals-In intake + counterparty
 * surfaces with the shared DartScopeBar so scope persists into the signals
 * area like every other cockpit-tier surface.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.md §6 + Phase 2 of §17.
 */

import { ErrorBoundary } from "@/components/shared/error-boundary";
import { DartScopeBar } from "@/components/shell/dart-scope-bar";

export default function SignalsServiceLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="px-4 pt-3">
        <DartScopeBar />
      </div>
      <ErrorBoundary>{children}</ErrorBoundary>
    </>
  );
}
