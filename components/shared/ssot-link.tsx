"use client";

/**
 * SsotLink — Clickable Single Source of Truth badge pair.
 *
 * Renders two pills:
 *   [ SSOT ]  [ codex/... ]
 *
 * Clicking either opens the canonical codex file on GitHub
 * (IggyIkenna/unified-trading-pm) in a new tab. Hovering either reveals a
 * tooltip explaining what SSOT means and previewing the target URL — so
 * users unfamiliar with the term can discover the link destination before
 * clicking.
 *
 * Usage:
 *   <SsotLink codexPath="09-strategy/architecture-v2/category-instrument-coverage.md" />
 */

import Link from "next/link";
import { ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const CODEX_REPO_BASE =
  "https://github.com/IggyIkenna/unified-trading-pm/blob/main/codex";

export interface SsotLinkProps {
  /**
   * Path under `codex/` — e.g. `09-strategy/architecture-v2/category-instrument-coverage.md`.
   * Do NOT prefix with `codex/` — the component adds that prefix when rendering the path
   * pill and when building the GitHub URL.
   */
  codexPath: string;
  /** Optional additional class on the outer wrapper. */
  className?: string;
}

export function SsotLink({ codexPath, className }: SsotLinkProps) {
  const normalised = codexPath.replace(/^\/?codex\//, "").replace(/^\//, "");
  const href = `${CODEX_REPO_BASE}/${normalised}`;
  const displayPath = `codex/${normalised}`;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className={cn(
              "group inline-flex items-center gap-1.5 rounded-md transition-colors",
              className,
            )}
            data-testid="ssot-link"
          >
            <Badge
              variant="outline"
              className="font-mono text-[0.65rem] uppercase tracking-wider group-hover:border-primary/40 group-hover:text-primary"
            >
              SSOT
            </Badge>
            <Badge
              variant="outline"
              className="font-mono text-xs group-hover:border-primary/40 group-hover:text-primary"
            >
              {displayPath}
            </Badge>
            <ExternalLink
              className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
              aria-hidden="true"
            />
            <span className="sr-only">
              Open {displayPath} in GitHub (new tab)
            </span>
          </Link>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          align="start"
          className="max-w-xs space-y-1 text-xs"
        >
          <p className="font-medium">Single source of truth</p>
          <p className="text-muted-foreground">
            The canonical spec for this surface. The UI mirrors what the codex
            defines — so if code and codex disagree, the codex wins and the UI
            needs an update.
          </p>
          <p className="pt-1 font-mono text-[0.65rem] text-muted-foreground break-all">
            Opens → {href}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
