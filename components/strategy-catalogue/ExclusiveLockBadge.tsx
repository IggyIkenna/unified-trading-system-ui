"use client";

/**
 * Plan D — ExclusiveLockBadge.
 *
 * Lock icon + "Held by {holder}" label. Compact variant shows only the icon
 * with a tooltip; expanded variant shows the full label inline.
 */

import * as React from "react";
import { Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface ExclusiveLockBadgeProps {
  readonly holder: string;
  readonly compact?: boolean;
}

export function ExclusiveLockBadge({ holder, compact }: ExclusiveLockBadgeProps): React.JSX.Element {
  const label = compact ? "" : `Held by ${holder}`;
  const title = `Held by ${holder}`;
  return (
    <Badge variant="secondary" title={title} data-testid="exclusive-lock-badge">
      <Lock className="h-3 w-3" />
      {label && <span className="ml-1">{label}</span>}
    </Badge>
  );
}
