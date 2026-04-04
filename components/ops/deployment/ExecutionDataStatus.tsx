"use client";

import { ExecutionDataStatusProvider } from "@/components/ops/deployment/data-status/execution-data-status-context";
import { ExecutionDataStatusLayout } from "@/components/ops/deployment/data-status/execution-data-status-layout";
import type { ExecutionDataStatusProps } from "@/components/ops/deployment/data-status/execution-data-status-types";

export type { ExecutionDataStatusProps };

export function ExecutionDataStatus({ serviceName }: ExecutionDataStatusProps) {
  return (
    <ExecutionDataStatusProvider serviceName={serviceName}>
      <ExecutionDataStatusLayout />
    </ExecutionDataStatusProvider>
  );
}
