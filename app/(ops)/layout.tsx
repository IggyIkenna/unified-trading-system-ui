"use client";

import { RequireAuth } from "@/components/shell/require-auth";
import { UnifiedShell } from "@/components/shell/unified-shell";
import { ServiceTabs, ADMIN_TABS } from "@/components/shell/service-tabs";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import * as React from "react";

/**
 * Admin shell — admin-only. User management + access control.
 * Requires auth + role = "admin". Everyone else gets 403.
 */
export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <AdminShellInner>{children}</AdminShellInner>
    </RequireAuth>
  );
}

function AdminShellInner({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();

  const isAuthorized = user?.role === "admin";

  React.useEffect(() => {
    if (user && !isAuthorized) {
      router.replace("/dashboard");
    }
  }, [user, isAuthorized, router]);

  if (!user || !isAuthorized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            This area is restricted to admin users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <UnifiedShell
      orgName={user.org?.name ?? "Odum Internal"}
      orgId={user.org?.id ?? "odum-internal"}
      userName={user.email?.split("@")[0] ?? "Admin"}
      userRole={user.role ?? "admin"}
    >
      <ServiceTabs tabs={ADMIN_TABS} entitlements={user?.entitlements} />
      {children}
    </UnifiedShell>
  );
}
