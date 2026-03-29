"use client";

import { Spinner } from "@/components/ui/spinner";
import * as React from "react";

import { useAppAccess } from "@/hooks/use-app-access";
import { AccessDenied } from "./access-denied";

interface RequireCapabilityProps {
  capability?: string;
  anyOf?: string[];
  children: React.ReactNode;
}

/**
 * Route-level guard — wraps an entire page. Shows AccessDenied if
 * the user lacks the required capability.
 *
 * Usage in a page.tsx:
 *   <RequireCapability capability="trading.view">
 *     <TradingDashboard />
 *   </RequireCapability>
 */
export function RequireCapability({ capability, anyOf, children }: RequireCapabilityProps) {
  const { authorized, hasCapability, hasAnyCapability, loading } = useAppAccess();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Spinner size="lg" className="size-8 text-muted-foreground" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <AccessDenied
        title="No Application Access"
        description="You have not been granted access to this application. Contact your administrator."
      />
    );
  }

  if (capability && !hasCapability(capability)) {
    return <AccessDenied />;
  }

  if (anyOf && !hasAnyCapability(...anyOf)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}
