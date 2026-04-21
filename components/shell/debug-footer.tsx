"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { PERSONAS } from "@/lib/auth/personas";
import { isMockDataMode } from "@/lib/runtime/data-mode";
import { resetDemo } from "@/lib/reset-demo";
import { cn } from "@/lib/utils";
import { Bug, ChevronUp, RotateCcw, User } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

/**
 * Persona tier grouping for the mock-mode switcher. The debug footer lists
 * every persona from `lib/auth/personas.ts` so operators can exercise any
 * access slice without retyping emails.
 */
interface PersonaGroup {
  readonly label: string;
  readonly ids: readonly string[];
}

const PERSONA_GROUPS: readonly PersonaGroup[] = [
  { label: "Admin", ids: ["admin"] },
  { label: "Internal", ids: ["internal-trader", "im-desk-operator"] },
  {
    label: "DART Full",
    ids: ["client-full", "client-premium", "client-data-only", "prospect-dart"],
  },
  { label: "DART Signals-In", ids: ["prospect-signals-only"] },
  { label: "Odum Signals (Counterparty)", ids: ["prospect-odum-signals"] },
  {
    label: "Investment Management",
    ids: ["client-im-pooled", "client-im-sma", "prospect-im", "prospect-im-under-regulatory"],
  },
  {
    label: "Regulatory Umbrella",
    ids: ["client-regulatory", "prospect-regulatory"],
  },
  { label: "Investor Relations", ids: ["investor", "advisor"] },
  { label: "Platform / DeFi Demo", ids: ["prospect-platform", "elysium-defi"] },
];

/**
 * Debug Footer — ONLY visible in mock mode.
 * Shows: Reset Demo, current persona, mock mode badge, persona switcher.
 * Visibility controlled by data-mode helper or API health check mock_mode flag.
 * Rendered in document flow below UnifiedShell’s main (not fixed) so it does not cover page content.
 */
export function DebugFooter() {
  const { user, loginByEmail } = useAuth();
  const router = useRouter();
  const [mockMode, setMockMode] = React.useState(false);
  const [pendingPersona, setPendingPersona] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Check env var first
    if (isMockDataMode()) {
      setMockMode(true);
      return;
    }
    // Fallback: check API health endpoint
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => {
        if (data?.mock_mode) setMockMode(true);
      })
      .catch(() => {
        // If API unreachable, assume mock mode in dev
        if (process.env.NODE_ENV === "development") setMockMode(true);
      });
  }, []);

  if (!mockMode) return null;

  const handleResetDemo = async () => {
    // Call API to reset backend mock state
    try {
      await fetch("/api/admin/reset", { method: "POST" });
    } catch {
      // API may not be running — that's OK, still reset client state
    }
    resetDemo();
  };

  const handleSwitchPersona = async (personaId: string) => {
    // Log out current user
    localStorage.removeItem("portal_user");
    localStorage.removeItem("portal_token");
    localStorage.removeItem("odum_user");
    // Resolve persona email from the PERSONAS SSOT — keeps the switcher in
    // sync with lib/auth/personas.ts without hand-maintained email maps.
    const persona = PERSONAS.find((p) => p.id === personaId);
    if (!persona) return;
    await loginByEmail(persona.email, persona.password);
    router.refresh();
  };

  const activePersona = user ? PERSONAS.find((p) => p.id === user.id) : undefined;

  return (
    <footer
      data-slot="debug-footer"
      className="shrink-0 w-full flex flex-wrap items-center justify-between gap-2 border-t border-amber-500/20 bg-amber-950/90 px-4 py-1.5 text-xs backdrop-blur-sm sm:flex-nowrap"
    >
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="border-amber-500/30 text-amber-400 gap-1">
          <Bug className="size-3" />
          Mock Mode
        </Badge>

        {user && (
          <span
            className="text-amber-300/70 hidden sm:flex items-center gap-1"
            data-testid="debug-footer-active-persona"
          >
            <User className="inline size-3" />
            <span className="truncate max-w-[8rem]">{user.displayName}</span>
            <span className="hidden md:inline">({user.role})</span>
          </span>
        )}
        {activePersona && (
          <Badge
            variant="outline"
            className="border-amber-400/40 text-amber-200 hidden md:inline-flex"
            data-testid="debug-footer-active-persona-badge"
          >
            {activePersona.id}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Persona switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-6 gap-1 border-amber-500/30 bg-transparent text-amber-300 hover:bg-amber-900/50 hover:text-amber-200 text-xs"
            >
              Switch Persona
              <ChevronUp className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            side="top"
            className="w-72 max-h-[60vh] overflow-y-auto"
          >
            {PERSONA_GROUPS.map((group, groupIdx) => {
              const members = group.ids
                .map((id) => PERSONAS.find((p) => p.id === id))
                .filter((p): p is (typeof PERSONAS)[number] => p !== undefined);
              if (members.length === 0) return null;
              return (
                <React.Fragment key={group.label}>
                  {groupIdx > 0 && <DropdownMenuSeparator />}
                  <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </DropdownMenuLabel>
                  {members.map((p) => (
                    <DropdownMenuItem
                      key={p.id}
                      onClick={() => handleSwitchPersona(p.id)}
                      data-testid={`persona-option-${p.id}`}
                      className={cn(user?.id === p.id && "bg-primary/10")}
                    >
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {p.displayName}
                          {user?.id === p.id && (
                            <span className="ml-1 text-[10px] text-amber-400">(active)</span>
                          )}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {p.org.name} — {p.role}
                        </span>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </React.Fragment>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Reset Demo */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleResetDemo}
          className="h-6 gap-1 border-red-500/30 bg-transparent text-red-400 hover:bg-red-900/50 hover:text-red-200 text-xs"
        >
          <RotateCcw className="size-3" />
          Reset Demo
        </Button>
      </div>
    </footer>
  );
}
