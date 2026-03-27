"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { LifecycleNav } from "./lifecycle-nav";
import { Breadcrumbs } from "./breadcrumbs";
import { DebugFooter } from "./debug-footer";
import { CommandPalette } from "./command-palette";
import { RuntimeModeStrip } from "./runtime-mode-strip";
import { GuidedTour } from "@/components/platform/guided-tour";
import { ChatWidgetConnected } from "@/components/chat/chat-widget-connected";
import { cn } from "@/lib/utils";

interface UnifiedShellProps {
  children: React.ReactNode;
  orgName?: string;
  orgId?: string;
  userName?: string;
  userRole?: string;
  className?: string;
}

export function UnifiedShell({
  children,
  orgName = "Odum Internal",
  orgId = "odum-internal",
  userName = "Trader",
  userRole = "internal-trader",
  className,
}: UnifiedShellProps) {
  const pathname = usePathname() || "";
  const [cmdkOpen, setCmdkOpen] = React.useState(false);

  // Global Cmd+K shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setCmdkOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // NOTE: Public route detection removed — route groups handle this.
  // UnifiedShell is only rendered inside (platform) and (ops) route groups,
  // which are always authenticated. No need to check for public routes here.

  return (
    <div
      className={cn(
        "h-screen flex flex-col bg-background overflow-hidden",
        className,
      )}
    >
      <CommandPalette open={cmdkOpen} onOpenChange={setCmdkOpen} />
      <LifecycleNav
        orgName={orgName}
        orgId={orgId}
        userName={userName}
        userRole={userRole}
      />
      <RuntimeModeStrip />
      <Breadcrumbs />
      {/* flex-1 + min-h-0 so pages that use h-full get a proper bounded height.
          overflow-auto lets normal pages still scroll; pages that manage their own
          scroll (like the feature finder) set overflow-hidden on their root. */}
      <main className="flex-1 min-h-0 overflow-auto">{children}</main>
      <DebugFooter />
      <GuidedTour />
      <ChatWidgetConnected />
    </div>
  );
}
