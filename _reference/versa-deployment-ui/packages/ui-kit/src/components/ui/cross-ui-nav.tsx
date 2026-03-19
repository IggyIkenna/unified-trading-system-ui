import * as React from "react";
import { ChevronDown, ExternalLink } from "lucide-react";
import { cn } from "../../lib/utils";

// ── UI Registry ─────────────────────────────────────────────────────────────
// Port assignments from ui-api-mapping.json (SSOT).
// In dev mode, all UIs run on localhost at these ports.
// In prod, each UI has its own subdomain/path — override via VITE_UI_BASE_URL.

export interface CrossUINavEntry {
  /** Key matching the stack name in ui-api-mapping.json */
  key: string;
  label: string;
  port: number;
}

export interface CrossUINavGroup {
  label: string;
  entries: CrossUINavEntry[];
}

/**
 * Default UI groups derived from ui-api-mapping.json port assignments.
 * Grouped by functional area for quick navigation.
 */
export const DEFAULT_UI_GROUPS: CrossUINavGroup[] = [
  {
    label: "Monitoring",
    entries: [
      { key: "live-health-monitor", label: "Live Health Monitor", port: 5177 },
      { key: "logs-dashboard", label: "Logs Dashboard", port: 5178 },
    ],
  },
  {
    label: "Analytics",
    entries: [
      { key: "trading-analytics", label: "Trading Analytics", port: 5180 },
      {
        key: "execution-analytics",
        label: "Execution Analytics",
        port: 5174,
      },
      { key: "strategy", label: "Strategy Platform", port: 5175 },
    ],
  },
  {
    label: "Operations",
    entries: [
      { key: "deployment", label: "Deployment", port: 5183 },
      { key: "onboarding", label: "Onboarding", port: 5173 },
      { key: "settlement", label: "Settlement", port: 5176 },
    ],
  },
  {
    label: "Data",
    entries: [
      { key: "batch-audit", label: "Batch Audit", port: 5181 },
      { key: "client-reporting", label: "Client Reporting", port: 5182 },
      { key: "ml-training", label: "ML Training", port: 5179 },
    ],
  },
];

function buildUrl(port: number): string {
  // In production, use configured base URL pattern if available.
  // In dev, all UIs are on localhost at their assigned port.
  return `http://localhost:${port}`;
}

// ── Component ───────────────────────────────────────────────────────────────

export interface CrossUINavProps {
  /** The key of the current UI (e.g. "live-health-monitor"). Used for highlighting. */
  currentUIKey: string;
  /** Override the default groups if needed. */
  groups?: CrossUINavGroup[];
  /** Optional className for the outer wrapper. */
  className?: string;
}

/**
 * CrossUINav — a compact dropdown that links to every UI in the Unified Trading System.
 *
 * Renders in the sidebar footer or header bar. Shows which UI you're currently on
 * (highlighted). Each link navigates in the same tab.
 */
export function CrossUINav({
  currentUIKey,
  groups = DEFAULT_UI_GROUPS,
  className,
}: CrossUINavProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  // Find current UI label for the trigger button
  const currentEntry = groups
    .flatMap((g) => g.entries)
    .find((e) => e.key === currentUIKey);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded text-[11px] font-mono",
          "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-bg-tertiary)] transition-colors",
          open &&
            "bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]",
        )}
        aria-expanded={open}
        aria-haspopup="true"
        data-testid="cross-ui-nav-trigger"
      >
        <ExternalLink size={11} />
        <span>{currentEntry ? currentEntry.label : "Switch UI"}</span>
        <ChevronDown
          size={10}
          className={cn("transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 mb-1 z-50 min-w-[200px] max-h-[360px] overflow-y-auto rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] shadow-lg"
          role="menu"
          data-testid="cross-ui-nav-menu"
        >
          {groups.map((group, gIdx) => (
            <div key={group.label}>
              {gIdx > 0 && (
                <div className="mx-2 h-px bg-[var(--color-border-subtle)]" />
              )}
              <div className="px-3 pt-2 pb-1">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                  {group.label}
                </span>
              </div>
              {group.entries.map((entry) => {
                const isCurrent = entry.key === currentUIKey;
                return (
                  <a
                    key={entry.key}
                    href={buildUrl(entry.port)}
                    role="menuitem"
                    data-testid={`cross-ui-link-${entry.key}`}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 text-[12px] transition-colors",
                      isCurrent
                        ? "text-[var(--color-accent-cyan)] bg-[var(--color-accent-cyan)]/5 font-medium"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]",
                    )}
                    onClick={() => setOpen(false)}
                  >
                    <span className="flex-1 truncate">{entry.label}</span>
                    {isCurrent && (
                      <span className="text-[9px] font-mono text-[var(--color-accent-cyan)] shrink-0">
                        current
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
