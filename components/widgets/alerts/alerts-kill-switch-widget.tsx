"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CollapsibleSection } from "@/components/shared/collapsible-section";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useStrategyHealth } from "@/hooks/api/use-strategies";
import { useAlertsData } from "./alerts-data-context";
import { Pause, Power, Square, XCircle } from "lucide-react";

export function AlertsKillSwitchWidget(_props: WidgetComponentProps) {
  const { filteredAlerts } = useAlertsData();
  const { data: strategies = [] } = useStrategyHealth();
  const [entityId, setEntityId] = React.useState<string>("");

  React.useEffect(() => {
    if (strategies.length === 0) {
      setEntityId("");
      return;
    }
    if (!entityId || !strategies.some((s) => s.id === entityId)) {
      setEntityId(strategies[0].id);
    }
  }, [strategies, entityId]);

  const activeEntityAlerts = filteredAlerts.filter(
    (a) => a.entityType === "strategy" && a.entity === entityId && a.status === "active",
  ).length;

  return (
    <div className="flex flex-col gap-2 h-full min-h-0 p-1">
      <CollapsibleSection title="Emergency controls" defaultOpen={false}>
        <div className="px-2 pb-2 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium">Scope</label>
            <Select defaultValue="strategy">
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="firm">Firm (All)</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="strategy">Strategy</SelectItem>
                <SelectItem value="venue">Venue</SelectItem>
              </SelectContent>
            </Select>
            {strategies.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">No strategies available.</p>
            ) : (
              <Select value={entityId} onValueChange={setEntityId}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select entity" />
                </SelectTrigger>
                <SelectContent>
                  {strategies.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Actions</label>
            <div className="grid grid-cols-1 gap-2">
              <Button variant="outline" size="sm" className="gap-2 justify-start h-auto py-2">
                <Pause className="size-3.5 text-[var(--status-warning)] shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-medium">Pause Strategy</div>
                  <div className="text-[10px] text-muted-foreground">Stop new orders</div>
                </div>
              </Button>
              <Button variant="outline" size="sm" className="gap-2 justify-start h-auto py-2">
                <XCircle className="size-3.5 text-[var(--status-error)] shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-medium">Cancel Orders</div>
                  <div className="text-[10px] text-muted-foreground">Cancel all open</div>
                </div>
              </Button>
              <Button variant="outline" size="sm" className="gap-2 justify-start h-auto py-2">
                <Square className="size-3.5 text-[var(--status-error)] shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-medium">Flatten</div>
                  <div className="text-[10px] text-muted-foreground">Close all positions</div>
                </div>
              </Button>
              <Button variant="outline" size="sm" className="gap-2 justify-start h-auto py-2">
                <Power className="size-3.5 text-[var(--status-error)] shrink-0" />
                <div className="text-left">
                  <div className="text-xs font-medium">Disable Venue</div>
                  <div className="text-[10px] text-muted-foreground">Block venue access</div>
                </div>
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Rationale (required)</label>
            <Input className="h-8 text-xs" placeholder="Describe reason for intervention..." />
          </div>

          <Card className="bg-[var(--status-error)]/5 border-[var(--status-error)]/20">
            <CardContent className="p-3">
              <div className="text-xs font-medium text-[var(--status-error)] mb-1.5">Impact preview</div>
              <div className="text-[11px] text-muted-foreground space-y-1">
                <div>Active alerts for selected entity: {activeEntityAlerts}</div>
                <div>Position and order impact requires execution API wiring.</div>
              </div>
            </CardContent>
          </Card>

          <Button variant="destructive" size="sm" className="w-full gap-2">
            <Power className="size-3.5" />
            Confirm Action
          </Button>
        </div>
      </CollapsibleSection>
    </div>
  );
}
