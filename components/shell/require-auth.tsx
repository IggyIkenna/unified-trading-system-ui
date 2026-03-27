"use client";

/**
 * RequireAuth — Auth boundary for the platform and ops route groups.
 *
 * If the user is authenticated, renders children.
 * If not, redirects to /login with a redirect param back to the current page.
 *
 * Design rule: there is ONE login page at /login. RequireAuth does not render
 * its own form — it bridges to the canonical sign-in experience.
 */

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface RequireAuthProps {
  children: React.ReactNode;
}

export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (!loading && !user) {
      const redirect = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?redirect=${redirect}`);
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    // Show loading while redirect is pending
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return <>{children}</>;
}
