"use client";

import { RequireAuth } from "@/components/shell/require-auth";
import { UnifiedShell } from "@/components/shell/unified-shell";
import { useAuth } from "@/hooks/use-auth";

/**
 * Platform shell — THE product. Auth required.
 * Same layout for internal AND client users — data scoping is API-driven.
 */
export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <PlatformShellInner>{children}</PlatformShellInner>
    </RequireAuth>
  );
}

function PlatformShellInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <UnifiedShell
      orgName={user?.org?.name ?? "Odum Internal"}
      orgId={user?.org?.id ?? "odum-internal"}
      userName={user?.email?.split("@")[0] ?? "Trader"}
      userRole={user?.role ?? "internal"}
    >
      {children}
    </UnifiedShell>
  );
}
