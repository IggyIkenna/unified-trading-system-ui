"use client";

/**
 * CockpitWidgetGrid — the scope-reactive widget grid for /services/workspace.
 *
 * Per dart_ux_cockpit_refactor_2026_04_29.plan.md §10 + §11 + Phase 5/Phase 9.
 *
 * Reads the active `WorkspaceScope` and renders:
 *   - `primary` widgets (matching scope) at full visual weight
 *   - `secondary` widgets in a smaller grid below primary
 *   - "out of scope" widgets are hidden by default; an admin toggle could
 *     reveal them as greyed placeholders (deferred — current cockpit hides)
 *
 * This is the surface that makes the user *feel* the cockpit reshape when
 * they change scope. Toggle the asset_group chip → DEFI widgets stay,
 * sports widgets disappear, vol widgets fade. The wedge.
 */

import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getWidget, widgetsForScope, type WidgetDefinition } from "@/components/widgets/widget-registry";
import { useWorkspaceScope } from "@/lib/stores/workspace-scope-store";
import "@/components/widgets/register-all";

import { cn } from "@/lib/utils";

interface CockpitWidgetGridProps {
  readonly className?: string;
  /** Optional explicit widget IDs to render (overrides scope-derived). */
  readonly widgetIds?: readonly string[];
  /** Maximum primary widgets to render. Default 12. */
  readonly maxPrimary?: number;
  /** Maximum secondary widgets to render. Default 6. */
  readonly maxSecondary?: number;
}

export function CockpitWidgetGrid({ className, widgetIds, maxPrimary = 12, maxSecondary = 6 }: CockpitWidgetGridProps) {
  const scope = useWorkspaceScope();

  const buckets = React.useMemo(() => {
    if (widgetIds) {
      // Caller supplied an explicit list — render those by ID, no scope filtering.
      const explicit = widgetIds.map((id) => getWidget(id)).filter((w): w is WidgetDefinition => Boolean(w));
      return { primary: explicit.slice(0, maxPrimary), secondary: [] as readonly WidgetDefinition[], outOfScope: [] };
    }
    return widgetsForScope(scope);
  }, [scope, widgetIds, maxPrimary]);

  const primary = buckets.primary.slice(0, maxPrimary);
  const secondary = buckets.secondary.slice(0, maxSecondary);
  const outOfScopeCount = buckets.outOfScope.length;

  return (
    <div className={cn("space-y-4", className)} data-testid="cockpit-widget-grid">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-tight">Live workspace</h2>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Badge variant="secondary" className="font-mono">
            {primary.length} primary
          </Badge>
          {secondary.length > 0 ? (
            <Badge variant="secondary" className="font-mono">
              {secondary.length} secondary
            </Badge>
          ) : null}
          {outOfScopeCount > 0 ? (
            <Badge variant="outline" className="font-mono text-muted-foreground/60">
              {outOfScopeCount} out of scope
            </Badge>
          ) : null}
        </div>
      </div>

      {primary.length === 0 && secondary.length === 0 ? (
        <Card className="border-dashed border-border/50" data-testid="cockpit-widget-grid-empty">
          <CardContent className="p-6 text-center text-xs text-muted-foreground">
            No widgets match the active scope. Try clearing chips or switching to a different surface.
          </CardContent>
        </Card>
      ) : null}

      {primary.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3" data-testid="cockpit-widget-grid-primary">
          {primary.map((w) => (
            <PrimaryWidgetCard key={w.id} widget={w} />
          ))}
        </div>
      ) : null}

      {secondary.length > 0 ? (
        <section className="space-y-2 pt-2">
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Secondary</h3>
          <div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2"
            data-testid="cockpit-widget-grid-secondary"
          >
            {secondary.map((w) => (
              <WidgetTile key={w.id} widget={w} variant="secondary" />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

/**
 * PrimaryWidgetCard — renders the actual widget component, NOT a card with
 * description. Per audit fix #1: "the widget grid is still a widget catalogue
 * not a cockpit dashboard." For primary widgets we mount `widget.component`
 * inside an `ErrorBoundary` so a single bad widget doesn't take down the
 * whole grid.
 */
function PrimaryWidgetCard({ widget }: { readonly widget: WidgetDefinition }) {
  const WidgetComponent = widget.component;
  const instanceId = `cockpit-${widget.id}`;
  return (
    <Card
      className={cn(
        // Audit polish #2 — premium tile chrome:
        //   - subtle gradient + ring instead of flat border
        //   - hover lifts ring colour + drops a soft shadow
        //   - rounded-md so the cockpit reads as one cohesive grid
        //   - no horizontal padding overhead — widgets render edge-to-edge
        //     under the header bar
        "group relative overflow-hidden flex flex-col rounded-md",
        "border border-border/40 bg-gradient-to-br from-background to-muted/5",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]",
        "transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5",
      )}
      data-testid={`cockpit-widget-tile-${widget.id}`}
      data-variant="primary"
      data-widget-id={widget.id}
    >
      <header className="flex items-center justify-between gap-2 border-b border-border/30 px-3 py-1.5 bg-gradient-to-r from-muted/15 to-transparent">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            aria-hidden
            className="size-1.5 rounded-full bg-emerald-400/70 shrink-0 group-hover:bg-emerald-400 transition-colors"
          />
          <span className="text-xs font-semibold tracking-tight truncate" title={widget.label}>
            {widget.label}
          </span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Badge variant="outline" className="text-[9px] font-mono border-border/40 bg-muted/10">
            {widget.catalogGroup}
          </Badge>
          <Badge variant="secondary" className="text-[9px] font-mono">
            {widget.assetGroup}
          </Badge>
        </div>
      </header>
      <div className="min-h-[200px] max-h-[480px] overflow-auto" data-testid={`cockpit-widget-render-${widget.id}`}>
        <WidgetErrorBoundary widgetId={widget.id}>
          <WidgetComponent instanceId={instanceId} />
        </WidgetErrorBoundary>
      </div>
    </Card>
  );
}

class WidgetErrorBoundary extends React.Component<
  { readonly widgetId: string; readonly children: React.ReactNode },
  { readonly error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error(`[cockpit] widget ${this.props.widgetId} threw:`, error, info);
  }

  render(): React.ReactNode {
    if (this.state.error) {
      return (
        <div className="p-3 text-[11px] text-amber-300 bg-amber-500/5 border-t border-amber-500/30">
          Widget {this.props.widgetId} failed to render. Other widgets unaffected.
        </div>
      );
    }
    return this.props.children;
  }
}

function WidgetTile({
  widget,
  variant,
}: {
  readonly widget: WidgetDefinition;
  readonly variant: "primary" | "secondary";
}) {
  return (
    <Card
      className={cn(
        "border-border/50 bg-gradient-to-br from-background to-muted/10 transition-colors hover:border-border",
        variant === "secondary" && "bg-muted/5",
      )}
      data-testid={`cockpit-widget-tile-${widget.id}`}
      data-variant={variant}
    >
      <CardContent className={cn("p-3 space-y-1.5", variant === "secondary" && "p-2 space-y-1")}>
        <div className="flex items-center justify-between gap-2">
          <span className={cn("font-semibold tracking-tight truncate", variant === "primary" ? "text-sm" : "text-xs")}>
            {widget.label}
          </span>
          <Badge variant="secondary" className="text-[9px] font-mono shrink-0">
            {widget.assetGroup}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground/60">
          <span className="font-mono">{widget.catalogGroup}</span>
        </div>
      </CardContent>
    </Card>
  );
}
