"use client";

/**
 * TradingVerticalNav — collapsible left-side navigation for the Trading terminal.
 *
 * Replaces the horizontal ServiceTabs row for the Trading lifecycle stage.
 * - Expanded: icon + label, with group separators
 * - Collapsed: icon only (with tooltip on hover)
 * - Collapse toggle button at the top
 */

import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { ServiceTab } from "./service-tabs";

interface TradingVerticalNavProps {
  tabs: ServiceTab[];
  entitlements?: readonly string[];
  /** Optional slot rendered at the bottom of the nav (e.g. Live/As-Of toggle) */
  bottomSlot?: React.ReactNode;
}

export function TradingVerticalNav({
  tabs,
  entitlements,
  bottomSlot,
}: TradingVerticalNavProps) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname() || "";
  const hasWildcard = entitlements?.includes("*") ?? true;

  const navWidth = collapsed ? "w-[52px]" : "w-[200px]";

  // Render a separator whenever a tab has a `group` label and it's the first
  // tab in that group.
  const seenGroups = new Set<string>();

  return (
    <aside
      className={cn(
        "flex flex-col border-r border-border bg-card/30 shrink-0 transition-[width] duration-200 overflow-hidden",
        navWidth,
      )}
    >
      {/* Collapse toggle */}
      <div
        className={cn(
          "flex items-center border-b border-border px-2 py-2",
          collapsed ? "justify-center" : "justify-end",
        )}
      >
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          title={collapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {collapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </button>
      </div>

      {/* Nav items */}
      <nav
        className="flex-1 overflow-y-auto py-2"
        aria-label="Trading sections"
      >
        {tabs.map((tab) => {
          const matchPath = tab.matchPrefix || tab.href;
          const isActive = tab.exact
            ? pathname === tab.href || pathname === `${tab.href}/`
            : pathname === tab.href || pathname.startsWith(matchPath + "/");
          const isLocked =
            tab.requiredEntitlement &&
            !hasWildcard &&
            !entitlements?.includes(tab.requiredEntitlement);

          const Icon = tab.icon;

          // Group separator — only on first item of a new group
          let separator: React.ReactNode = null;
          if (tab.group && !seenGroups.has(tab.group)) {
            seenGroups.add(tab.group);
            separator = (
              <div
                key={`sep-${tab.group}`}
                className={cn(
                  "mx-2 my-1 border-t border-border",
                  !collapsed && "flex items-center gap-2 pt-2 pb-1",
                )}
              >
                {!collapsed && (
                  <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap px-1">
                    {tab.group}
                  </span>
                )}
              </div>
            );
          }

          const itemContent = (
            <span
              className={cn(
                "flex items-center gap-2.5 px-2 py-2 rounded-md text-sm font-medium transition-colors w-full",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
                (isLocked || tab.navDisabled) &&
                  "opacity-40 cursor-not-allowed pointer-events-none",
                collapsed && "justify-center px-0",
              )}
            >
              {Icon && (
                <Icon
                  className={cn("shrink-0", collapsed ? "size-5" : "size-4")}
                />
              )}
              {!collapsed && (
                <span className="truncate leading-none">{tab.label}</span>
              )}
              {!collapsed && (isLocked || tab.navDisabled) && (
                <Lock className="size-3 shrink-0 ml-auto" />
              )}
            </span>
          );

          const wrapperClass = cn(
            "px-2",
            collapsed && "flex justify-center px-1",
          );
          const title = collapsed
            ? isLocked
              ? `${tab.label} (locked)`
              : tab.label
            : undefined;

          return (
            <div key={tab.href}>
              {separator}
              <div className={wrapperClass}>
                {isLocked || tab.navDisabled ? (
                  <span title={title ?? `Upgrade to access ${tab.label}`}>
                    {itemContent}
                  </span>
                ) : (
                  <Link href={tab.href} title={title}>
                    {itemContent}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Bottom slot (e.g. Live/As-Of toggle) */}
      {bottomSlot && (
        <div
          className={cn(
            "border-t border-border p-2 shrink-0",
            collapsed && "flex justify-center",
          )}
        >
          {!collapsed && bottomSlot}
        </div>
      )}
    </aside>
  );
}
