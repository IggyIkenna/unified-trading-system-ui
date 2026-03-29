"use client";

import { ErrorBoundary } from "@/components/shared/error-boundary";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
