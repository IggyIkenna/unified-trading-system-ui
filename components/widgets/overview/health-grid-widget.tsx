"use client";

import { HealthStatusGrid } from "@/components/trading/health-status-grid";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/shared/spinner";
import type { WidgetComponentProps } from "../widget-registry";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

import Link from "next/link";
import { useOverviewDataSafe } from "./overview-data-context";

export function HealthGridWidget(_props: WidgetComponentProps) {
  const ctx = useOverviewDataSafe();
  const queryClient = useQueryClient();
  if (!ctx)
    return (
      <div className="flex h-full items-center justify-center p-3 text-xs text-muted-foreground">
        Navigate to Overview tab
      </div>
    );
  const { allMockServices, coreLoading } = ctx;
  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["service-health"] });
  };
  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex justify-end gap-1 mb-2">
        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5" onClick={handleRefresh}>
          <RefreshCw className="size-3.5" />
          Refresh
        </Button>
        <Link href="/services/observe/health">
          <Button variant="ghost" size="sm" className="h-7 text-xs">
            View All
          </Button>
        </Link>
      </div>
      {coreLoading ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground">
          <Spinner className="size-4 mr-2" />
        </div>
      ) : allMockServices.length === 0 ? (
        <div className="flex items-center justify-center py-6 text-muted-foreground text-xs">No services reported</div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <HealthStatusGrid services={allMockServices} />
        </div>
      )}
    </div>
  );
}
