"use client";

/**
 * TradingVerticalNav — collapsible left-side navigation for the Trading terminal.
 *
 * Replaces the horizontal ServiceTabs row for the Trading lifecycle stage.
 * - Expanded: icon + label, with group separators and collapsible family headers
 * - Collapsed: icon only (with tooltip on hover)
 * - Collapse toggle button at the top
 *
 * Strategy family groups (DeFi, Sports, Options & Futures, Predictions) render
 * under collapsible headers with chevron toggles. Shared tabs (Overview, Positions,
 * etc.) remain top-level.
 */

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { checkTradingEntitlement, isTradingEntitlement, type TradingEntitlement } from "@/lib/config/auth";
import { useWorkspaceStore } from "@/lib/stores/workspace-store";
import { cn } from "@/lib/utils";
import { isPathActive, isServiceTabActive } from "@/lib/utils/nav-helpers";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Layers,
  LayoutGrid,
  Lock,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ServiceTab } from "./service-tabs";

/** Map from familyIcon string hint to actual Lucide component */
const FAMILY_ICON_MAP: Record<string, LucideIcon> = {
  Layers,
  Trophy,
  BarChart3,
  TrendingUp,
};

interface TradingVerticalNavProps {
  tabs: ServiceTab[];
  entitlements?: readonly (string | TradingEntitlement)[];
  /** Optional slot rendered at the bottom of the nav (e.g. Live/As-Of toggle) */
  bottomSlot?: React.ReactNode;
}

export function TradingVerticalNav({ tabs, entitlements, bottomSlot }: TradingVerticalNavProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [showNewPanel, setShowNewPanel] = useState(false);
  const [newPanelName, setNewPanelName] = useState("");
  const [collapsedFamilies, setCollapsedFamilies] = useState<Record<string, boolean>>({});
  const [pendingDeletePanel, setPendingDeletePanel] = useState<{ id: string; name: string } | null>(null);
  const newPanelInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname() || "";
  const router = useRouter();
  const hasWildcard = (entitlements as readonly unknown[] | undefined)?.includes("*") ?? true;
  const customPanels = useWorkspaceStore((s) => s.customPanels);
  const createCustomPanel = useWorkspaceStore((s) => s.createCustomPanel);
  const deleteCustomPanel = useWorkspaceStore((s) => s.deleteCustomPanel);

  useEffect(() => {
    if (showNewPanel && newPanelInputRef.current) {
      newPanelInputRef.current.focus();
    }
  }, [showNewPanel]);

  const newPanelNameTaken = useMemo(() => {
    const key = newPanelName.trim().toLowerCase();
    if (!key) return false;
    return customPanels.some((p) => p.name.trim().toLowerCase() === key);
  }, [newPanelName, customPanels]);

  const handleCreatePanel = () => {
    const trimmed = newPanelName.trim();
    if (!trimmed || newPanelNameTaken) return;
    const panelId = createCustomPanel(trimmed);
    if (panelId == null) return;
    setNewPanelName("");
    setShowNewPanel(false);
    router.push(`/services/trading/custom/${panelId}`);
  };

  const requestDeletePanel = (panel: { id: string; name: string }, isActive: boolean) => {
    if (isActive) {
      setPendingDeletePanel({ id: panel.id, name: panel.name });
      return;
    }
    deleteCustomPanel(panel.id);
  };

  const confirmDeleteActivePanel = () => {
    if (!pendingDeletePanel) return;
    deleteCustomPanel(pendingDeletePanel.id);
    router.push("/services/trading/overview");
    setPendingDeletePanel(null);
  };

  const toggleFamily = (family: string) => {
    setCollapsedFamilies((prev) => ({
      ...prev,
      [family]: !prev[family],
    }));
  };

  // Split tabs into shared (no familyGroup) and grouped (with familyGroup)
  const { sharedTabs, familyGroups } = useMemo(() => {
    const shared: ServiceTab[] = [];
    const families: Record<string, ServiceTab[]> = {};

    for (const tab of tabs) {
      if (tab.familyGroup) {
        if (!families[tab.familyGroup]) {
          families[tab.familyGroup] = [];
        }
        families[tab.familyGroup].push(tab);
      } else {
        shared.push(tab);
      }
    }

    return { sharedTabs: shared, familyGroups: families };
  }, [tabs]);

  // Check if any tab in a family is currently active (used to auto-expand)
  const isFamilyActive = (familyTabs: ServiceTab[]) => {
    return familyTabs.some((tab) => isServiceTabActive(pathname, tab));
  };

  // Check if all tabs in a family are locked
  const isFamilyLocked = (familyTabs: ServiceTab[]) => {
    return familyTabs.every((tab) => {
      return (
        tab.requiredEntitlement &&
        !hasWildcard &&
        (isTradingEntitlement(tab.requiredEntitlement)
          ? !checkTradingEntitlement((entitlements as never) ?? [], tab.requiredEntitlement)
          : !(entitlements as readonly string[] | undefined)?.includes(tab.requiredEntitlement as string))
      );
    });
  };

  const navWidth = collapsed ? "w-[52px]" : "w-[200px]";

  const renderTabItem = (tab: ServiceTab) => {
    const isActive = isServiceTabActive(pathname, tab);
    const isLocked =
      tab.requiredEntitlement &&
      !hasWildcard &&
      (isTradingEntitlement(tab.requiredEntitlement)
        ? !checkTradingEntitlement((entitlements as never) ?? [], tab.requiredEntitlement)
        : !(entitlements as readonly string[] | undefined)?.includes(tab.requiredEntitlement as string));

    const Icon = tab.icon;

    const itemContent = (
      <span
        className={cn(
          "flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm font-medium transition-colors w-full",
          isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-accent",
          (isLocked || tab.navDisabled) && "opacity-35 cursor-not-allowed pointer-events-none",
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
          <span className={cn("shrink-0 rounded-sm bg-foreground/40", collapsed ? "size-5" : "size-[18px]")} />
        )}
        {!collapsed && <span className="truncate leading-none">{tab.label}</span>}
        {!collapsed && (isLocked || tab.navDisabled) && <Lock className="size-3 shrink-0 ml-auto opacity-60" />}
      </span>
    );

    const wrapperClass = cn("px-2", collapsed && "flex justify-center px-1");
    const title = collapsed ? (isLocked ? `${tab.label} (locked)` : tab.label) : undefined;

    return (
      <div key={tab.href} className={wrapperClass}>
        {isLocked || tab.navDisabled ? (
          <span title={title ?? tab.navDisabledTitle ?? `Upgrade to access ${tab.label}`}>{itemContent}</span>
        ) : (
          <Link href={tab.href} title={title}>
            {itemContent}
          </Link>
        )}
      </div>
    );
  };

  const renderFamilyGroup = (familyName: string, familyTabs: ServiceTab[]) => {
    const isExpanded = !collapsedFamilies[familyName] || isFamilyActive(familyTabs);
    const locked = isFamilyLocked(familyTabs);
    const firstTab = familyTabs[0];
    const iconName = firstTab?.familyIcon;
    const FamilyIcon = iconName ? FAMILY_ICON_MAP[iconName] : undefined;

    return (
      <div key={`family-${familyName}`}>
        {/* Family header */}
        <button
          onClick={() => toggleFamily(familyName)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-1.5 mt-1 transition-colors",
            "text-muted-foreground hover:text-foreground",
            collapsed && "justify-center px-1",
          )}
          title={collapsed ? familyName : undefined}
        >
          {FamilyIcon && !collapsed && <FamilyIcon className="size-3.5 shrink-0 text-foreground/40" />}
          {FamilyIcon && collapsed && <FamilyIcon className="size-4 shrink-0 text-foreground/40" />}
          {!collapsed && (
            <>
              <span className="text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap flex-1 text-left">
                {familyName}
              </span>
              {locked && <Lock className="size-3 shrink-0 opacity-40" />}
              {isExpanded ? (
                <ChevronDown className="size-3 shrink-0 opacity-50" />
              ) : (
                <ChevronRight className="size-3 shrink-0 opacity-50" />
              )}
            </>
          )}
        </button>

        {/* Family tabs — collapsible. Respect per-family collapse state in both
            expanded and collapsed nav modes so the user's choice is preserved. */}
        {isExpanded && <div className={cn(!collapsed && "pl-2")}>{familyTabs.map((tab) => renderTabItem(tab))}</div>}
      </div>
    );
  };

  return (
    <>
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-card/30 shrink-0 transition-[width] duration-200 overflow-hidden",
          navWidth,
        )}
      >
        {/* Collapse toggle — entire row is clickable */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "w-full flex items-center border-b border-border px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
            collapsed ? "justify-center" : "justify-between",
          )}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          title={collapsed ? "Expand navigation" : "Collapse navigation"}
        >
          {!collapsed && (
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 pl-1 select-none">
              Trading
            </span>
          )}
          <span className="p-1.5 rounded-md">
            {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </span>
        </button>

        {/* Nav items */}
        <WidgetScroll className="flex-1 min-h-0">
          <nav className="py-2" aria-label="Trading sections">
            {/* Shared tabs (top-level) */}
            {sharedTabs.map((tab) => renderTabItem(tab))}

            {/* Separator between shared and family groups */}
            {Object.keys(familyGroups).length > 0 && (
              <div
                className={cn("mx-2 my-2 border-t border-border", !collapsed && "flex items-center gap-2 pt-2 pb-1")}
              >
                {!collapsed && (
                  <span className="text-[10px] font-medium text-muted-foreground/50 uppercase tracking-wider whitespace-nowrap px-1">
                    Strategy Families
                  </span>
                )}
              </div>
            )}

            {/* Family groups — divider between each family for visual separation */}
            {Object.entries(familyGroups).map(([familyName, familyTabs], idx, arr) => (
              <div key={`family-wrap-${familyName}`}>
                {renderFamilyGroup(familyName, familyTabs)}
                {idx < arr.length - 1 && <div className="mx-3 my-1 border-t border-border/40" aria-hidden="true" />}
              </div>
            ))}

            {/* Custom panels */}
            {customPanels.length > 0 && (
              <div
                className={cn("mx-2 my-1 border-t border-border", !collapsed && "flex items-center gap-2 pt-2 pb-1")}
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
              const isActive = isPathActive(pathname, panelHref);

              return (
                <div key={panel.id} className={cn("px-2 group relative", collapsed && "flex justify-center px-1")}>
                  <Link href={panelHref} title={collapsed ? panel.name : undefined}>
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
                      {!collapsed && <span className="truncate leading-none pr-6">{panel.name}</span>}
                    </span>
                  </Link>

                  {!collapsed && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        requestDeletePanel(panel, isActive);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                      title={`Delete "${panel.name}"`}
                      aria-label={`Delete panel ${panel.name}`}
                    >
                      <X className="size-3" />
                    </button>
                  )}
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
                  <Plus className={cn("shrink-0 text-foreground/60", collapsed ? "size-5" : "size-[18px]")} />
                  {!collapsed && <span className="truncate leading-none">New Panel</span>}
                </button>
              ) : (
                !collapsed && (
                  <div className="flex flex-col gap-0.5 px-1 min-w-0">
                    <div className="flex items-center gap-1">
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
                        aria-invalid={newPanelNameTaken}
                        className={cn(
                          "flex-1 min-w-0 h-7 px-2 text-xs bg-background border rounded-md focus:outline-none focus:ring-1",
                          newPanelNameTaken
                            ? "border-destructive focus:ring-destructive/40 focus:border-destructive"
                            : "border-border focus:ring-primary",
                        )}
                      />
                      <button
                        type="button"
                        onClick={handleCreatePanel}
                        disabled={!newPanelName.trim() || newPanelNameTaken}
                        className="h-7 px-2 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowNewPanel(false);
                          setNewPanelName("");
                        }}
                        className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent shrink-0"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                    {newPanelNameTaken && (
                      <p className="text-[10px] leading-snug text-destructive pl-0.5 pr-6">
                        Name already in use — choose another.
                      </p>
                    )}
                  </div>
                )
              )}
            </div>
          </nav>
        </WidgetScroll>

        {/* Bottom slot (e.g. Live/As-Of toggle) */}
        {bottomSlot && (
          <div className={cn("border-t border-border p-2 shrink-0", collapsed && "flex justify-center")}>
            {!collapsed && bottomSlot}
          </div>
        )}
      </aside>

      <AlertDialog
        open={pendingDeletePanel !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDeletePanel(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this panel?</AlertDialogTitle>
            <AlertDialogDescription>
              You are viewing &quot;{pendingDeletePanel?.name}&quot;. This will remove the panel and its layout.
              Continue and go to Trading overview?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDeleteActivePanel}
            >
              Delete and leave
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
