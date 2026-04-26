"use client";

import * as React from "react";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { WidgetScroll } from "@/components/shared/widget-scroll";

export function MultiSelectDropdown<T extends { id: string }>({
  label,
  icon,
  items,
  selectedIds,
  onSelectionChange,
  renderItem,
  groupBy,
  getGroupLabel,
  allLabel = "All",
  emptyMessage = "No items",
  dropdownWidthClass = "w-72",
}: {
  label: string;
  icon: React.ReactNode;
  items: T[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  renderItem: (item: T, isSelected: boolean) => React.ReactNode;
  groupBy?: (item: T) => string;
  getGroupLabel?: (group: string) => string;
  allLabel?: string;
  emptyMessage?: string;
  dropdownWidthClass?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [collapsedGroups, setCollapsedGroups] = React.useState<Record<string, boolean>>({});

  const isAllSelected = selectedIds.length === 0;
  const selectedCount = selectedIds.length;

  const toggleItem = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter((i) => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const selectAll = () => {
    onSelectionChange([]);
  };

  const getDisplayText = () => {
    if (isAllSelected) return allLabel;
    if (selectedCount === 1) {
      const item = items.find((i) => i.id === selectedIds[0]);
      return item
        ? (item as { name?: string; symbol?: string }).name || (item as { symbol?: string }).symbol || item.id
        : selectedIds[0];
    }
    return `${selectedCount} selected`;
  };

  const groupedItems = React.useMemo(() => {
    if (!groupBy) return { default: items };
    const groups: Record<string, T[]> = {};
    items.forEach((item) => {
      const group = groupBy(item);
      if (!groups[group]) groups[group] = [];
      groups[group].push(item);
    });
    return groups;
  }, [items, groupBy]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-6 gap-1 px-2 hover:bg-secondary text-xs",
            !isAllSelected ? "text-foreground font-medium" : "text-muted-foreground",
          )}
        >
          {icon}
          <span>{getDisplayText()}</span>
          {selectedCount > 1 && (
            <Badge variant="secondary" className="h-4 px-1 text-[10px] ml-0.5">
              {selectedCount}
            </Badge>
          )}
          <ChevronDown className="size-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className={cn(dropdownWidthClass, "p-0 max-h-[35vh] overflow-hidden")}>
        <div className="p-2 border-b border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
            {!isAllSelected && (
              <Button
                variant="ghost"
                size="sm"
                className="h-5 px-1.5 text-[10px] text-muted-foreground"
                onClick={selectAll}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        <WidgetScroll className="max-h-[35vh]" viewportClassName="overscroll-contain">
          <div className="p-1">
            <div
              role="button"
              tabIndex={0}
              onClick={selectAll}
              onKeyDown={(e) => e.key === "Enter" && selectAll()}
              className={cn(
                "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-secondary cursor-pointer",
                isAllSelected && "bg-secondary",
              )}
            >
              <span
                className={cn(
                  "size-4 rounded border flex items-center justify-center shrink-0",
                  isAllSelected ? "bg-primary border-primary" : "border-input",
                )}
              >
                {isAllSelected && <Check className="size-3 text-primary-foreground" />}
              </span>
              <span className="text-muted-foreground">{allLabel}</span>
            </div>

            <div className="h-px bg-border my-1" />

            {items.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-muted-foreground">{emptyMessage}</div>
            ) : groupBy ? (
              Object.entries(groupedItems)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([group, groupItems]) => {
                  const groupIds = groupItems.map((i) => i.id);
                  const allGroupSelected = groupIds.every((id) => selectedIds.includes(id));
                  const someGroupSelected = groupIds.some((id) => selectedIds.includes(id));
                  const toggleGroup = () => {
                    if (allGroupSelected) {
                      onSelectionChange(selectedIds.filter((id) => !groupIds.includes(id)));
                    } else {
                      onSelectionChange([...new Set([...selectedIds, ...groupIds])]);
                    }
                  };
                  const isCollapsed = collapsedGroups[group] !== false;
                  return (
                    <div key={group} className="border-b border-border/50 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0">
                      <div className="flex items-stretch gap-0.5">
                        <button
                          type="button"
                          className="shrink-0 flex items-center justify-center px-1 rounded hover:bg-secondary/80 text-muted-foreground"
                          aria-expanded={!isCollapsed}
                          aria-label={isCollapsed ? `Expand ${group}` : `Collapse ${group}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setCollapsedGroups((c) => ({
                              ...c,
                              [group]: !isCollapsed,
                            }));
                          }}
                        >
                          <ChevronRight
                            className={cn("size-3.5 transition-transform duration-150", !isCollapsed && "rotate-90")}
                          />
                        </button>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={toggleGroup}
                          onKeyDown={(e) => e.key === "Enter" && toggleGroup()}
                          className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-secondary/50"
                        >
                          <span
                            className={cn(
                              "size-3.5 flex shrink-0 items-center justify-center rounded border",
                              allGroupSelected
                                ? "border-primary bg-primary"
                                : someGroupSelected
                                  ? "border-primary bg-primary/50"
                                  : "border-input",
                            )}
                          >
                            {(allGroupSelected || someGroupSelected) && (
                              <Check className="size-2.5 text-primary-foreground" />
                            )}
                          </span>
                          <span className="truncate text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            {getGroupLabel ? getGroupLabel(group) : group}
                          </span>
                          <span className="ml-auto shrink-0 text-[10px] text-muted-foreground/50">
                            {groupItems.length}
                          </span>
                        </div>
                      </div>
                      {!isCollapsed &&
                        groupItems.map((item) => {
                          const isSelected = selectedIds.includes(item.id);
                          return (
                            <div
                              key={item.id}
                              role="button"
                              tabIndex={0}
                              onClick={() => toggleItem(item.id)}
                              onKeyDown={(e) => e.key === "Enter" && toggleItem(item.id)}
                              className={cn(
                                "flex w-full cursor-pointer items-center gap-2 rounded py-1.5 pl-7 pr-2 text-sm hover:bg-secondary",
                                isSelected && "bg-secondary",
                              )}
                            >
                              <span
                                className={cn(
                                  "size-4 shrink-0 rounded border flex items-center justify-center",
                                  isSelected ? "bg-primary border-primary" : "border-input",
                                )}
                              >
                                {isSelected && <Check className="size-3 text-primary-foreground" />}
                              </span>
                              {renderItem(item, isSelected)}
                            </div>
                          );
                        })}
                    </div>
                  );
                })
            ) : (
              items.map((item) => {
                const isSelected = selectedIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => toggleItem(item.id)}
                    onKeyDown={(e) => e.key === "Enter" && toggleItem(item.id)}
                    className={cn(
                      "w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-secondary cursor-pointer",
                      isSelected && "bg-secondary",
                    )}
                  >
                    <span
                      className={cn(
                        "size-4 rounded border flex items-center justify-center shrink-0",
                        isSelected ? "bg-primary border-primary" : "border-input",
                      )}
                    >
                      {isSelected && <Check className="size-3 text-primary-foreground" />}
                    </span>
                    {renderItem(item, isSelected)}
                  </div>
                );
              })
            )}
          </div>
        </WidgetScroll>
      </PopoverContent>
    </Popover>
  );
}
