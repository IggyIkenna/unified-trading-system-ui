"use client";

/**
 * ContextualLockedPreview — Cockpit FOMO surface.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.md §12 + Phase 7 of §17.
 *
 * Renders scope-specific locked-preview cards inline in the cockpit. The
 * cards reflect the active scope so an arbitrage user sees arbitrage
 * value, a DeFi user sees DeFi value, etc.
 *
 * "Learn more" / CTA links route to /help/system-map by default — the
 * single help surface for IA + capability questions.
 */

import { ArrowRight, Lock } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { previewsForScope, type LockedPreview } from "@/lib/cockpit/locked-previews";
import { useStrategyVisibility } from "@/lib/cockpit/use-strategy-visibility";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";
import { cn } from "@/lib/utils";

interface ContextualLockedPreviewProps {
  readonly className?: string;
  /** Maximum previews to render. Default 3. */
  readonly maxPreviews?: number;
}

export function ContextualLockedPreview({ className, maxPreviews = 3 }: ContextualLockedPreviewProps) {
  const scope = useWorkspaceScope();
  // Polish #3: resolver-driven gating. Hide the FOMO previews entirely when
  // the resolver says the user has nothing locked-by-tier or
  // locked-by-workflow. Admins / fully-entitled DART-Full users should not
  // be tempted to upgrade something they already own.
  const { hasLockedCapabilities, hasAvailableToRequest } = useStrategyVisibility();
  const previews = React.useMemo(() => previewsForScope(scope).slice(0, maxPreviews), [scope, maxPreviews]);

  // No previews to render — either the scope doesn't match any FOMO copy
  // OR the resolver decided the user has full access to everything in the
  // demo spread (no capability locks AND no available-to-request).
  if (previews.length === 0) {
    return null;
  }
  if (!hasLockedCapabilities && !hasAvailableToRequest) {
    return null;
  }

  return (
    <div
      className={cn("space-y-2", className)}
      data-testid="contextual-locked-preview"
      data-preview-count={previews.length}
    >
      <div className="flex items-center gap-2">
        <Lock className="size-3.5 text-amber-500/70" aria-hidden />
        <h3 className="text-sm font-semibold tracking-tight">What you could unlock</h3>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60">scope-specific</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {previews.map((preview) => (
          <PreviewCard key={preview.id} preview={preview} />
        ))}
      </div>
    </div>
  );
}

function PreviewCard({ preview }: { readonly preview: LockedPreview }) {
  return (
    <Card className="border-amber-500/30 bg-amber-500/5" data-testid={`locked-preview-${preview.id}`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold tracking-tight">{preview.title}</span>
          <Badge
            variant="outline"
            className="text-[9px] px-1.5 py-0 border-amber-500/40 bg-amber-500/10 text-amber-500"
          >
            <Lock className="size-2.5 mr-0.5" aria-hidden />
            Locked
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground/80 leading-snug">{preview.buyerValue}</p>
        <ul className="text-[10px] text-muted-foreground/70 space-y-0.5 list-disc list-inside">
          {preview.lockedCapabilities.slice(0, 4).map((cap) => (
            <li key={cap}>{cap}</li>
          ))}
        </ul>
        <Link href={preview.ctaHref} className="block pt-1">
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs h-7 border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
          >
            {preview.cta}
            <ArrowRight className="size-3 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
