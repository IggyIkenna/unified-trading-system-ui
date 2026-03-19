import * as React from "react";
import { cn } from "../../lib/utils";
import { StatusDot } from "./status-dot";

interface HeaderBadge {
  label: string;
  variant?: "success" | "error" | "warning" | "running" | "pending" | "info";
}

interface AppHeaderProps {
  appName: string;
  appDescription?: string;
  /** Custom icon element (lucide icon recommended). Rendered inside a branded container. */
  icon?: React.ReactNode;
  /** Accent color for icon container (CSS color value). Defaults to var(--color-accent-cyan). */
  iconColor?: string;
  leftSlot?: React.ReactNode;
  rightSlot?: React.ReactNode;
  badges?: HeaderBadge[];
  version?: string;
  className?: string;
}

const DEFAULT_ICON = (
  <svg width="14" height="14" viewBox="0 0 10 10" fill="currentColor">
    <rect x="1" y="1" width="3.5" height="3.5" rx="0.5" />
    <rect x="5.5" y="1" width="3.5" height="3.5" rx="0.5" />
    <rect x="1" y="5.5" width="3.5" height="3.5" rx="0.5" />
    <rect x="5.5" y="5.5" width="3.5" height="3.5" rx="0.5" />
  </svg>
);

/** Parse a hex color to r,g,b for rgba usage */
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return "34,211,238"; // fallback cyan
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

export function AppHeader({
  appName,
  appDescription,
  icon,
  iconColor,
  leftSlot,
  rightSlot,
  badges,
  version,
  className,
}: AppHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between w-full gap-4",
        className,
      )}
    >
      <div className="flex items-center gap-3 min-w-0 shrink-0">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg shrink-0",
            !iconColor && "app-identity-icon",
            iconColor && "icon-box-custom",
          )}
          style={
            iconColor
              ? ({
                  "--icon-rgb": hexToRgb(iconColor),
                  "--icon-color": iconColor,
                } as React.CSSProperties)
              : undefined
          }
        >
          {icon ? (
            <span className="[&_svg]:h-5 [&_svg]:w-5">{icon}</span>
          ) : (
            DEFAULT_ICON
          )}
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-semibold text-[var(--color-text-primary)] tracking-tight leading-none truncate">
            {appName}
          </h1>
          {appDescription && (
            <p className="text-[11px] text-[var(--color-text-tertiary)] font-mono mt-1 leading-none truncate">
              {appDescription}
            </p>
          )}
        </div>
        {leftSlot}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        {badges?.map((b, i) => (
          <StatusDot
            key={i}
            variant={b.variant ?? "success"}
            label={b.label}
            pulse={b.variant === "running"}
          />
        ))}
        {version && (
          <span className="text-xs font-mono text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] px-2 py-1 rounded">
            {version}
          </span>
        )}
        {rightSlot}
      </div>
    </div>
  );
}
