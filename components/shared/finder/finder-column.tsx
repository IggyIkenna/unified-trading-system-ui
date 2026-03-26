"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ColRow } from "@/components/shared/finder/col-row";
import type {
  FinderColumnDef,
  FinderItem,
} from "@/components/shared/finder/types";

const PAGE_SIZE = 100;

export interface FinderColumnProps {
  columnDef: FinderColumnDef;
  items: FinderItem[];
  selected: FinderItem | null;
  onSelect: (item: FinderItem) => void;
  search?: string;
}

export function FinderColumn({
  columnDef,
  items,
  selected,
  onSelect,
  search,
}: FinderColumnProps) {
  const [page, setPage] = React.useState(0);

  // Filter by search if provided
  const filtered = React.useMemo(() => {
    if (!search) return items;
    const q = search.toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(q));
  }, [items, search]);

  // Reset page when items change
  const itemsKey = items.map((i) => i.id).join(",");
  React.useEffect(() => {
    setPage(0);
  }, [itemsKey]);

  const shouldPaginate = columnDef.paginate && filtered.length > PAGE_SIZE;
  const totalPages = shouldPaginate
    ? Math.ceil(filtered.length / PAGE_SIZE)
    : 1;
  const displayItems = shouldPaginate
    ? filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
    : filtered;

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="px-3 py-1.5 border-b border-border/40 bg-muted/30 shrink-0">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          {columnDef.label} · {filtered.length.toLocaleString()}
          {search && filtered.length !== items.length && (
            <span> / {items.length.toLocaleString()}</span>
          )}
        </p>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-1.5 space-y-0.5">
          {displayItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs">
              No items found
            </div>
          ) : (
            displayItems.map((item) => {
              const isActive = selected?.id === item.id;
              const count = columnDef.getCount
                ? columnDef.getCount(item)
                : (item.count ?? null);

              return (
                <ColRow
                  key={item.id}
                  active={isActive}
                  onClick={() => onSelect(item)}
                >
                  {/* Optional custom icon */}
                  {columnDef.renderIcon?.(item, isActive)}

                  {/* Label — custom or default */}
                  {columnDef.renderLabel ? (
                    columnDef.renderLabel(item)
                  ) : (
                    <span className="flex-1 font-medium truncate text-xs">
                      {item.label}
                    </span>
                  )}

                  {/* Count */}
                  {count !== null && count !== undefined && (
                    <span
                      className={cn(
                        "text-[10px] tabular-nums shrink-0",
                        isActive
                          ? "text-primary-foreground/70"
                          : "text-muted-foreground",
                      )}
                    >
                      {typeof count === "number"
                        ? count.toLocaleString()
                        : count}
                    </span>
                  )}

                  {/* Chevron */}
                  <ChevronRight
                    className={cn(
                      "size-3 shrink-0",
                      isActive
                        ? "text-primary-foreground/60"
                        : "text-muted-foreground/50",
                    )}
                  />
                </ColRow>
              );
            })
          )}
        </div>
      </div>

      {/* Pagination controls */}
      {shouldPaginate && totalPages > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t border-border/40 bg-muted/10 shrink-0">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="size-3" /> Prev
          </button>
          <span className="text-xs text-muted-foreground">
            {page + 1} / {totalPages} · {filtered.length.toLocaleString()} items
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            Next <ChevronRight className="size-3" />
          </button>
        </div>
      )}
    </div>
  );
}
