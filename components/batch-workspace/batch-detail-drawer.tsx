"use client";

/**
 * BatchDetailDrawer — slide-out detail panel for inspecting a single entity.
 *
 * Used across the research family for:
 * - Strategy: inspect a config's parameters, risk limits, instruments
 * - ML: inspect a model version's training details, feature importance
 * - Execution: inspect an algo's parameters, venue config, benchmarks
 *
 * Renders generic key-value sections; domain-specific content is passed as children.
 */

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  X,
  ShoppingBasket,
  ExternalLink,
  Clock,
  User,
} from "lucide-react";
import { formatNumber } from "@/lib/utils/formatters";

export interface DetailSection {
  title: string;
  items: Array<{
    label: string;
    value: string | number;
    format?: "text" | "number" | "percent" | "currency" | "date" | "mono";
  }>;
}

interface BatchDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  entityName: string;
  entityVersion: string;
  entityType: "strategy_config" | "model_version" | "execution_algo";
  platform: "strategy" | "ml" | "execution";
  status?: string;
  lastUpdated?: string;
  updatedBy?: string;
  sections?: DetailSection[];
  onAddToBasket?: () => void;
  onOpenFullPage?: () => void;
  /** Domain-specific content below the generic sections */
  children?: React.ReactNode;
}

const entityTypeLabels: Record<string, string> = {
  strategy_config: "Strategy Config",
  model_version: "Model Version",
  execution_algo: "Execution Algo",
};

function formatDetailValue(
  value: string | number,
  format?: DetailSection["items"][number]["format"],
): string {
  if (typeof value === "string") return value;
  switch (format) {
    case "percent":
      return `${formatNumber(value * 100, 2)}%`;
    case "currency":
      return `$${formatNumber(value, 0)}`;
    case "number":
      return formatNumber(value, 2);
    default:
      return String(value);
  }
}

export function BatchDetailDrawer({
  open,
  onClose,
  entityName,
  entityVersion,
  entityType,
  platform,
  status,
  lastUpdated,
  updatedBy,
  sections = [],
  onAddToBasket,
  onOpenFullPage,
  children,
}: BatchDetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[420px] sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-base font-mono">{entityName}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-[10px] font-mono">
                  v{entityVersion}
                </Badge>
                <span className="text-[10px]">{entityTypeLabels[entityType]}</span>
                {status && (
                  <Badge
                    variant="secondary"
                    className="text-[10px] capitalize"
                  >
                    {status}
                  </Badge>
                )}
              </SheetDescription>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-muted-foreground">
            {lastUpdated && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {lastUpdated}
              </span>
            )}
            {updatedBy && (
              <span className="flex items-center gap-1">
                <User className="size-3" />
                {updatedBy}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-3">
            {onAddToBasket && (
              <Button size="sm" variant="secondary" className="gap-1.5 text-xs" onClick={onAddToBasket}>
                <ShoppingBasket className="size-3.5" />
                Add to Basket
              </Button>
            )}
            {onOpenFullPage && (
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={onOpenFullPage}>
                <ExternalLink className="size-3.5" />
                Full Page
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-4 space-y-6">
            {/* Generic key-value sections */}
            {sections.map((section) => (
              <div key={section.title}>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                  {section.title}
                </h4>
                <div className="space-y-1.5">
                  {section.items.map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-1">
                      <span className="text-xs text-muted-foreground">{item.label}</span>
                      <span
                        className={cn(
                          "text-xs",
                          (item.format === "mono" || item.format === "number" || item.format === "currency" || item.format === "percent") &&
                            "font-mono",
                        )}
                      >
                        {formatDetailValue(item.value, item.format)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {sections.length > 0 && children && <Separator />}

            {/* Domain-specific content */}
            {children}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
