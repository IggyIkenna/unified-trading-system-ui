"use client";

/**
 * Plan D — VersionLineageBadge.
 *
 * Renders ``v{N}`` (or ``v{N} (forked from v{parentN})``) with an optional
 * hover-card showing the full lineage from genesis. Co-located with the rest
 * of the strategy-catalogue components per the 2026-04-25 placement audit.
 */

import * as React from "react";
import { Badge } from "@/components/ui/badge";

export interface VersionLineageBadgeProps {
  /** Numeric position in the parent instance's version history (0 = genesis). */
  readonly versionIndex: number;
  /** Numeric position of the parent version. ``null`` ⇒ genesis. */
  readonly parentVersionIndex?: number | null;
  /** Optional human-readable lineage chain shown in a tooltip / hover. */
  readonly lineage?: readonly string[];
  /** Compact variant — just the badge, no parent suffix. */
  readonly compact?: boolean;
}

export function VersionLineageBadge({
  versionIndex,
  parentVersionIndex,
  lineage,
  compact,
}: VersionLineageBadgeProps): React.JSX.Element {
  const main = `v${versionIndex}`;
  const isGenesis = parentVersionIndex === null || parentVersionIndex === undefined;
  const suffix = isGenesis ? "(genesis)" : `(forked from v${parentVersionIndex})`;
  const label = compact ? main : `${main} ${suffix}`;
  const title = lineage && lineage.length > 0 ? lineage.join(" → ") : label;
  return (
    <Badge variant="outline" title={title} data-testid="version-lineage-badge">
      {label}
    </Badge>
  );
}
