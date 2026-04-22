"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Code2, Cpu, GitBranch, Tag, ArrowRight, Settings2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import type { IndividualFeature, FeatureServiceNode } from "@/lib/mocks/fixtures/build-data";
import { FEATURE_VERSIONS } from "@/lib/mocks/fixtures/build-data";
import { FEAT_STATUS_CFG, SERVICE_COLORS } from "./feature-helpers";
import { EditConfigDialog } from "./edit-config-dialog";
import { WidgetScroll } from "@/components/shared/widget-scroll";

export function FeatureDetailPanel({
  service,
  feature,
}: {
  service: FeatureServiceNode | null;
  feature: IndividualFeature | null;
}) {
  const [editOpen, setEditOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<IndividualFeature | null>(null);

  const displayed = draft?.id === feature?.id ? draft : feature;

  if (!displayed) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center">
        <Code2 className="size-10 mb-3 text-muted-foreground/20" />
        <p className="text-sm font-medium text-muted-foreground">No feature selected</p>
        <p className="text-xs text-muted-foreground/60 mt-1 leading-relaxed">
          Click any feature to see its configuration, parameters, version history, and model usage.
        </p>
      </div>
    );
  }

  const versions = FEATURE_VERSIONS[displayed.id] ?? [];
  const sc = FEAT_STATUS_CFG[displayed.status];
  const SI = sc.icon;
  const svcColor = service?.color ?? "blue";

  return (
    <WidgetScroll className="h-full">
      <div className="p-4 space-y-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {service && (
              <Badge variant="outline" className={cn("text-xs", SERVICE_COLORS[svcColor])}>
                {service.display_name}
              </Badge>
            )}
            <Badge variant="outline" className={cn("text-xs gap-1", sc.badge)}>
              <SI className="size-3" />
              {displayed.status === "not_computed"
                ? "Not Computed"
                : displayed.status.charAt(0).toUpperCase() + displayed.status.slice(1)}
            </Badge>
          </div>
          <code className="text-sm font-mono font-semibold break-all leading-snug block">{displayed.name}</code>
          <p className="text-xs text-muted-foreground leading-relaxed">{displayed.description}</p>
        </div>

        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <GitBranch className="size-3" />
            <span className="font-mono font-semibold text-foreground">{displayed.current_version}</span>
          </div>
          {displayed.last_computed ? (
            <span className="text-muted-foreground">
              {formatDistanceToNow(new Date(displayed.last_computed), {
                addSuffix: true,
              })}
            </span>
          ) : (
            <span className="text-muted-foreground">never computed</span>
          )}
        </div>

        <Separator />

        {Object.keys(displayed.parameters).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Code2 className="size-3" /> Parameters
            </p>
            <div className="rounded-lg bg-muted/40 p-2.5 space-y-1.5">
              {Object.entries(displayed.parameters).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-muted-foreground">{k}</span>
                  <span className="font-mono font-medium">{Array.isArray(v) ? v.join(", ") : String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Computed For</p>
          <div className="flex flex-wrap gap-1">
            {displayed.symbols.map((s) => (
              <Badge key={s} variant="secondary" className="text-xs font-mono">
                {s}
              </Badge>
            ))}
          </div>
        </div>

        {displayed.dependencies.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <GitBranch className="size-3" /> Dependencies
            </p>
            {displayed.dependencies.map((d) => (
              <div key={d} className="text-xs rounded-lg border border-border/50 px-2.5 py-1.5 font-mono">
                {d}
              </div>
            ))}
          </div>
        )}

        {displayed.consumed_by_models.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Cpu className="size-3" /> Used by Models
            </p>
            <div className="flex flex-wrap gap-1">
              {displayed.consumed_by_models.map((m) => (
                <Badge key={m} variant="outline" className="text-xs">
                  {m}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {displayed.tags.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="size-3" /> Tags
            </p>
            <div className="flex flex-wrap gap-1">
              {displayed.tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">
                  {t}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {versions.length > 0 && (
          <>
            <Separator />
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Version History</p>
              {versions.map((v, i) => (
                <div
                  key={v.version}
                  className={cn(
                    "rounded-lg border p-2.5 space-y-1",
                    i === 0 ? "border-primary/30 bg-primary/5" : "border-border/50",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold">{v.version}</span>
                      {i === 0 && (
                        <Badge variant="outline" className="text-[10px] border-primary/30 text-primary px-1 py-0">
                          current
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(v.changed_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-snug">{v.change_summary}</p>
                  <p className="text-[10px] text-muted-foreground">by {v.changed_by}</p>
                </div>
              ))}
            </div>
          </>
        )}

        <Separator />

        <div className="flex gap-2">
          <Button size="sm" className="flex-1 gap-1" asChild>
            <Link href="/services/research/feature-etl">
              <ArrowRight className="size-3" /> Compute
            </Link>
          </Button>
          <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => setEditOpen(true)}>
            <Settings2 className="size-3" /> Edit Config
          </Button>
        </div>
      </div>

      <EditConfigDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        featureName={displayed.name}
        initial={{
          name: displayed.name,
          description: displayed.description,
          status: displayed.status,
          parameters: displayed.parameters,
          symbols: displayed.symbols,
          tags: displayed.tags,
          dependencies: displayed.dependencies,
        }}
        onSave={(updated) => {
          setDraft({
            ...displayed,
            description: updated.description,
            status: updated.status as IndividualFeature["status"],
            parameters: updated.parameters,
            symbols: updated.symbols,
            tags: updated.tags,
            dependencies: updated.dependencies,
          });
        }}
      />
    </WidgetScroll>
  );
}
