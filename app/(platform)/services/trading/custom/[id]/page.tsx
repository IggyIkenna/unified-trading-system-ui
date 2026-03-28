"use client";

import { use } from "react";
import { WidgetGrid } from "@/components/widgets/widget-grid";
import { useWorkspaceStore } from "@/lib/stores/workspace-store";

interface CustomPanelPageProps {
  params: Promise<{ id: string }>;
}

export default function CustomPanelPage({ params }: CustomPanelPageProps) {
  const { id } = use(params);
  const panel = useWorkspaceStore((s) => s.customPanels.find((p) => p.id === id));

  if (!panel) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <p className="text-sm font-medium">Panel not found</p>
          <p className="text-xs">
            This custom panel may have been deleted or the link is invalid.
          </p>
        </div>
      </div>
    );
  }

  const tab = `custom-${id}`;

  return (
    <div className="h-full flex flex-col overflow-auto p-2">
      <WidgetGrid tab={tab} />
    </div>
  );
}
