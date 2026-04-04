"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { resetDemo } from "@/lib/reset-demo";
import { cn } from "@/lib/utils";
import { Bug, ChevronUp, RotateCcw, User } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";

/**
 * Debug Footer — ONLY visible in mock mode.
 * Shows: Reset Demo, current persona, mock mode badge, persona switcher.
 * Visibility controlled by NEXT_PUBLIC_MOCK_API env var or API health check mock_mode flag.
 * Rendered in document flow below UnifiedShell’s main (not fixed) so it does not cover page content.
 */
export function DebugFooter() {
  const { user, loginByEmail } = useAuth();
  const router = useRouter();
  const [mockMode, setMockMode] = React.useState(false);
  const [pendingPersona, setPendingPersona] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Check env var first
    if (process.env.NEXT_PUBLIC_MOCK_API === "true") {
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
    // Find persona email and log in with demo password
    const persona = personas.find((p) => p.id === personaId);
    if (!persona) return;
    const emails: Record<string, string> = {
      admin: "admin@odum.internal",
      "internal-trader": "trader@odum.internal",
      "client-full": "pm@alphacapital.com",
      "client-premium": "cio@vertex.com",
      "client-data-only": "analyst@betafund.com",
      "elysium-defi": "patrick@bankelysium.com",
    };
    const email = emails[personaId];
    if (email) {
      await loginByEmail(email, "demo");
      router.refresh();
    }
  };

  const personas = [
    { id: "admin", label: "Admin", desc: "Full system access" },
    {
      id: "internal-trader",
      label: "Internal Trader",
      desc: "Platform + wildcard",
    },
    { id: "client-full", label: "Client (Full)", desc: "Alpha Capital" },
    {
      id: "client-premium",
      label: "Client (Premium)",
      desc: "Vertex Partners",
    },
    { id: "client-data-only", label: "Client (Basic)", desc: "Beta Fund" },
    { id: "elysium-defi", label: "DeFi Client", desc: "Elysium (Patrick)" },
  ];

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
          <span className="text-amber-300/70 hidden sm:flex items-center gap-1">
            <User className="inline size-3" />
            <span className="truncate max-w-[8rem]">{user.displayName}</span>
            <span className="hidden md:inline">({user.role})</span>
          </span>
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
          <DropdownMenuContent align="end" side="top" className="w-56">
            {personas.map((p) => (
              <DropdownMenuItem
                key={p.id}
                onClick={() => handleSwitchPersona(p.id)}
                className={cn(user?.id === p.id && "bg-primary/10")}
              >
                <div className="flex flex-col">
                  <span className="text-sm">{p.label}</span>
                  <span className="text-[10px] text-muted-foreground">{p.desc}</span>
                </div>
              </DropdownMenuItem>
            ))}
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
