"use client";

import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

import { audienceForUser } from "@/lib/auth/audience-from-persona";
import { resolveAllocatorRoute } from "@/lib/auth/allocator-routing";
import { useAuth } from "@/hooks/use-auth";

/**
 * Resolves the allocator route from the current user's audience and renders
 * a standard ``<Link>`` to it. G2.10 replaces hardcoded links to the legacy
 * research-side allocator path.
 *
 * Usage:
 *   <AllocatorLink>Open allocator</AllocatorLink>
 *   <AllocatorLink className="text-primary">Portfolio allocator</AllocatorLink>
 */
type LinkProps = Omit<ComponentProps<typeof Link>, "href">;

export function AllocatorLink({ children, ...rest }: LinkProps & { children?: ReactNode }): ReactNode {
  const { user } = useAuth();
  const audience = audienceForUser(user);
  const href = resolveAllocatorRoute(audience);
  return (
    <Link href={href} data-testid="allocator-link" data-audience={audience} {...rest}>
      {children}
    </Link>
  );
}
