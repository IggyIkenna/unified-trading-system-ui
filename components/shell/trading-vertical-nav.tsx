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
import { PanelLeftClose, PanelLeftOpen, Lock, Plus, LayoutGrid, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import type { ServiceTab } from "./service-tabs";
import { useWorkspaceStore } from "@/lib/stores/workspace-store";

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
  const [showNewPanel, setShowNewPanel] = useState(false);
  const [newPanelName, setNewPanelName] = useState("");
  const newPanelInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname() || "";
  const router = useRouter();
  const hasWildcard = entitlements?.includes("*") ?? true;
  const customPanels = useWorkspaceStore((s) => s.customPanels);
  const createCustomPanel = useWorkspaceStore((s) => s.createCustomPanel);

  useEffect(() => {
    if (showNewPanel && newPanelInputRef.current) {
      newPanelInputRef.current.focus();
    }
  }, [showNewPanel]);

  const handleCreatePanel = () => {
    const trimmed = newPanelName.trim();
    if (!trimmed) return;
    const panelId = createCustomPanel(trimmed);
    setNewPanelName("");
    setShowNewPanel(false);
    router.push(`/services/trading/custom/${panelId}`);
  };

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
          "flex items-center border-b border-border px-2 py-1.5",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        {!collapsed && (
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 pl-1 select-none">
            Trading
          </span>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          title={collapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
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
                "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm font-medium transition-colors w-full",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
                (isLocked || tab.navDisabled) &&
                  "opacity-35 cursor-not-allowed pointer-events-none",
                collapsed && "justify-center px-0",
              )}
            >
              {Icon ? (
                <Icon
                  className={cn(
                    "shrink-0",
                    collapsed ? "size-5" : "size-[18px]",
                    isActive ? "text-primary" : "text-foreground/60",
                  )}
                />
              ) : (
                <span
                  className={cn(
                    "shrink-0 rounded-sm bg-foreground/40",
                    collapsed ? "size-5" : "size-[18px]",
                  )}
                />
              )}
              {!collapsed && (
                <span className="truncate leading-none">{tab.label}</span>
              )}
              {!collapsed && (isLocked || tab.navDisabled) && (
                <Lock className="size-3 shrink-0 ml-auto opacity-60" />
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

        {/* Custom panels */}
        {customPanels.length > 0 && (
          <div
            className={cn(
              "mx-2 my-1 border-t border-border",
              !collapsed && "flex items-center gap-2 pt-2 pb-1",
            )}
          >
            {!collapsed && (
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap px-1">
                Custom
              </span>
            )}
          </div>
        )}
        {customPanels.map((panel) => {
          const panelHref = `/services/trading/custom/${panel.id}`;
          const isActive = pathname === panelHref || pathname.startsWith(panelHref + "/");

          const itemContent = (
            <span
              className={cn(
                "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm font-medium transition-colors w-full",
                isActive
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent",
                collapsed && "justify-center px-0",
              )}
            >
              <LayoutGrid
                className={cn(
                  "shrink-0",
                  collapsed ? "size-5" : "size-[18px]",
                  isActive ? "text-primary" : "text-foreground/60",
                )}
              />
              {!collapsed && (
                <span className="truncate leading-none">{panel.name}</span>
              )}
            </span>
          );

          return (
            <div key={panel.id} className={cn("px-2", collapsed && "flex justify-center px-1")}>
              <Link href={panelHref} title={collapsed ? panel.name : undefined}>
                {itemContent}
              </Link>
            </div>
          );
        })}

        {/* New Panel button */}
        <div className={cn("px-2 mt-1", collapsed && "flex justify-center px-1")}>
          {!showNewPanel ? (
            <button
              onClick={() => setShowNewPanel(true)}
              className={cn(
                "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm font-medium transition-colors w-full",
                "text-muted-foreground hover:text-foreground hover:bg-accent",
                collapsed && "justify-center px-0",
              )}
              title={collapsed ? "New Panel" : undefined}
            >
              <Plus
                className={cn(
                  "shrink-0 text-foreground/60",
                  collapsed ? "size-5" : "size-[18px]",
                )}
              />
              {!collapsed && <span className="truncate leading-none">New Panel</span>}
            </button>
          ) : (
            !collapsed && (
              <div className="flex items-center gap-1 px-1">
                <input
                  ref={newPanelInputRef}
                  value={newPanelName}
                  onChange={(e) => setNewPanelName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreatePanel();
                    if (e.key === "Escape") {
                      setShowNewPanel(false);
                      setNewPanelName("");
                    }
                  }}
                  placeholder="Panel name"
                  className="flex-1 min-w-0 h-7 px-2 text-xs bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  onClick={handleCreatePanel}
                  disabled={!newPanelName.trim()}
                  className="h-7 px-2 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create
                </button>
                <button
                  onClick={() => { setShowNewPanel(false); setNewPanelName(""); }}
                  className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            )
          )}
        </div>
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
