"use client";

import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { finderText } from "@/components/shared/finder/finder-text-sizes";
import type { FinderColumnDef, FinderSelections } from "@/components/shared/finder/types";

export interface FinderBreadcrumbProps {
  columns: FinderColumnDef[];
  selections: FinderSelections;
  onResetFrom: (columnIndex: number) => void;
}

export function FinderBreadcrumb({ columns, selections, onResetFrom }: FinderBreadcrumbProps) {
  // Collect the chain of selected items (stop at the first column with no selection)
  const crumbs: { columnIndex: number; label: string }[] = [];
  for (let i = 0; i < columns.length; i++) {
    const sel = selections[columns[i].id];
    if (!sel) break;
    crumbs.push({ columnIndex: i, label: sel.label });
  }

  const lastIndex = crumbs.length - 1;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-4 py-1.5 text-muted-foreground border-b border-border/30 bg-background/50",
        finderText.body,
      )}
    >
      {/* Root: "All" */}
      <button className="hover:text-foreground transition-colors" onClick={() => onResetFrom(0)}>
        All
      </button>

      {/* Each selected level */}
      {crumbs.map((crumb, idx) => {
        const isLast = idx === lastIndex;
        return (
          <span key={columns[crumb.columnIndex].id} className="contents">
            <ChevronRight className="size-3.5 text-border" />
            {isLast ? (
              <span className="font-medium text-foreground">{crumb.label}</span>
            ) : (
              <button
                className="hover:text-foreground transition-colors font-medium text-foreground/80"
                onClick={() => onResetFrom(crumb.columnIndex + 1)}
              >
                {crumb.label}
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}
