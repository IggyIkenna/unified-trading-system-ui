"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { LineChart } from "lucide-react";

export function StrategiesGridLinkWidget(_props: WidgetComponentProps) {
  return (
    <div className="flex h-full items-center py-0.5">
      <Link href="/services/trading/strategies/grid" className="w-full">
        <Button variant="outline" className="w-full gap-2 h-9">
          <LineChart className="size-4" />
          Open DimensionalGrid for Batch Analysis
        </Button>
      </Link>
    </div>
  );
}
