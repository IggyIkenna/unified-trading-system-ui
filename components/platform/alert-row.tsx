"use client";

/**
 * Unified alert / notification / activity list row.
 * Supports data-service alerts (inline + severity dot), research cards (bordered + icon),
 * footer actions (relative time + “View →”), trailing icon link, and a right column (e.g. actor + time).
 */
import { formatDistanceToNow } from "date-fns";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { StatusDot } from "@/components/trading/status-badge";
import { cn } from "@/lib/utils";

export type AlertRowSeverity = "critical" | "warning" | "info" | "success";

export type AlertRowProps = {
  className?: string;
  /** `inline` = stacked list row; `card` = bordered tile (e.g. research alerts). */
  variant?: "inline" | "card";
  /** Shown when `leading` is not set. Maps to StatusDot semantic colors. */
  severity?: AlertRowSeverity;
  /** Overrides the default severity dot (icons, custom marks). */
  leading?: React.ReactNode;
  classNameLeading?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Second muted line (e.g. research alert detail). */
  detail?: React.ReactNode;
  /** Extra line below description/detail when you are not using `timestamp` auto-format. */
  meta?: React.ReactNode;
  timestamp?: string | Date | null;
  /** Used only when `meta` is not set and `timestamp` is set. */
  timestampMode?: "absolute" | "relative";
  unread?: boolean;
  actionHref?: string | null;
  actionAriaLabel?: string;
  /** Custom label for text link (default “View →”). */
  actionLabel?: React.ReactNode;
  /**
   * `icon` — trailing arrow link (default for inline).
   * `text` — text link in the footer row (good with variant card).
   * `footer` — time + optional link in one row inside the main column (default for card when href set).
   * `none` — no built-in action control.
   */
  actionPresentation?: "icon" | "text" | "footer" | "none";
  /** Right column (e.g. activity: actor + relative time). */
  end?: React.ReactNode;
  /** Applied to the title text wrapper (e.g. `text-sm` for activity feeds). */
  titleClassName?: string;
  density?: "default" | "relaxed";
  /** When false, no bottom border (e.g. last row or custom separators). */
  withBottomBorder?: boolean;
  dividerTone?: "default" | "subtle";
};

function severityToStatus(severity: AlertRowSeverity): "critical" | "warning" | "info" | "done" {
  switch (severity) {
    case "critical":
      return "critical";
    case "warning":
      return "warning";
    case "info":
      return "info";
    case "success":
      return "done";
    default:
      return "info";
  }
}

function formatAbsoluteTimestamp(ts: string | Date): string {
  const d = typeof ts === "string" ? new Date(ts) : ts;
  return d.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AlertRow({
  className,
  variant = "inline",
  severity,
  leading,
  classNameLeading,
  title,
  description,
  detail,
  meta,
  timestamp,
  timestampMode = "absolute",
  unread = false,
  actionHref,
  actionAriaLabel = "Open",
  actionLabel = "View →",
  actionPresentation,
  end,
  titleClassName,
  density = "default",
  withBottomBorder = true,
  dividerTone = "default",
}: AlertRowProps) {
  const hasLeadingSlot = leading != null || severity != null;
  const showDot = leading == null && severity != null;

  const py = density === "relaxed" ? "py-3" : "py-2.5";
  const verticalPad = variant === "card" ? undefined : py;
  const borderMuted = dividerTone === "subtle" ? "border-border/40" : "border-border/50";
  const bottomBorder =
    variant === "inline" && withBottomBorder ? cn("border-b", borderMuted, "last:border-0") : undefined;

  const resolvedPresentation =
    actionPresentation ?? (variant === "card" ? (actionHref ? "footer" : "none") : actionHref ? "icon" : "none");

  const formattedFromTimestamp = React.useMemo(() => {
    if (meta != null || timestamp == null || timestamp === "") return null;
    const d = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    if (Number.isNaN(d.getTime())) return null;
    return timestampMode === "relative" ? formatDistanceToNow(d, { addSuffix: true }) : formatAbsoluteTimestamp(d);
  }, [meta, timestamp, timestampMode]);

  const showFooterRow =
    variant === "card" && resolvedPresentation === "footer" && (formattedFromTimestamp != null || actionHref);

  const showMetaLine =
    meta != null || (variant === "inline" && formattedFromTimestamp != null && resolvedPresentation !== "footer");

  const trailingIconLink = variant === "inline" && actionHref && resolvedPresentation === "icon" && end == null;

  const leadingMt = variant === "card" ? "mt-0.5" : density === "relaxed" ? "mt-1.5" : "mt-2";

  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-3",
        verticalPad,
        variant === "inline" && bottomBorder,
        variant === "card" && "rounded-lg border border-border/50 p-3",
        className,
      )}
    >
      {hasLeadingSlot ? (
        <div className={cn("flex shrink-0 flex-col", leadingMt, classNameLeading)}>
          {leading != null ? (
            leading
          ) : showDot ? (
            <StatusDot status={severityToStatus(severity!)} className="size-1.5" />
          ) : null}
        </div>
      ) : null}

      <div className="min-w-0 flex-1 space-y-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              variant === "card" ? "text-xs font-medium leading-snug" : "text-xs font-medium",
              titleClassName,
              unread && "font-semibold",
            )}
          >
            {title}
          </span>
          {unread ? <StatusDot status="unread" className="size-1.5 shrink-0" /> : null}
        </div>

        {description != null ? (
          <div className={cn("mt-0.5 truncate text-xs text-muted-foreground", variant === "card" && "leading-snug")}>
            {description}
          </div>
        ) : null}

        {detail != null ? (
          <p className={cn("mt-0.5 text-xs leading-snug text-muted-foreground", variant === "card" && "leading-snug")}>
            {detail}
          </p>
        ) : null}

        {showFooterRow ? (
          <div className="flex items-center justify-between gap-2 pt-1">
            {formattedFromTimestamp != null ? (
              <span className="text-xs text-muted-foreground">{formattedFromTimestamp}</span>
            ) : (
              <span />
            )}
            {actionHref ? (
              <Link href={actionHref} className="text-xs text-primary hover:underline">
                {actionLabel}
              </Link>
            ) : null}
          </div>
        ) : null}

        {meta != null ? <div className="mt-0.5 text-[10px] text-muted-foreground/60">{meta}</div> : null}

        {showMetaLine && formattedFromTimestamp != null && meta == null ? (
          <div className="mt-0.5 text-[10px] text-muted-foreground/60">{formattedFromTimestamp}</div>
        ) : null}

        {variant === "inline" && actionHref && resolvedPresentation === "text" ? (
          <div className="mt-1">
            <Link href={actionHref} className="text-xs text-primary hover:underline">
              {actionLabel}
            </Link>
          </div>
        ) : null}
      </div>

      {end != null ? (
        <div className="ml-auto shrink-0">{end}</div>
      ) : trailingIconLink ? (
        <Link href={actionHref} className="shrink-0 self-start pt-0.5" aria-label={actionAriaLabel}>
          <ArrowRight className="size-3.5 text-muted-foreground hover:text-foreground" />
        </Link>
      ) : null}
    </div>
  );
}
