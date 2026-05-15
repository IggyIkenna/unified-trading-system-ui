"use client";

import type { ReactNode } from "react";
import { PromoteWorkflowProvider } from "@/components/promote/promote-workflow-context";
import { usePromoteLifecycleStore } from "@/lib/stores/promote-lifecycle-store";
import { useAuth } from "@/hooks/use-auth";

/** Connects workflow actions from tab UIs to the promote lifecycle Zustand store. */
export function PromoteWorkflowBridge({ children }: { children: ReactNode }) {
  const recordWorkflow = usePromoteLifecycleStore((s) => s.recordWorkflow);
  const { token } = useAuth();
  return (
    <PromoteWorkflowProvider onRecord={recordWorkflow} token={token}>
      {children}
    </PromoteWorkflowProvider>
  );
}
