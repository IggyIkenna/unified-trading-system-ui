"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { useStrategyHealth } from "@/hooks/api/use-strategies";
import { useKillSwitch, type KillSwitchActionType } from "@/hooks/api/use-kill-switch";
import { useAlertsData } from "./alerts-data-context";
import { Pause, Power, Square, XCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type KillSwitchScope = "firm" | "client" | "strategy" | "venue";
type KillSwitchAction = "pause" | "cancel" | "flatten" | "disable-venue";

const ACTION_TO_API: Record<KillSwitchAction, KillSwitchActionType> = {
  pause: "pause_strategy",
  cancel: "cancel_orders",
  flatten: "flatten_positions",
  "disable-venue": "disable_venue",
};

interface ActionMeta {
  id: KillSwitchAction;
  label: string;
  subLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  iconClassName: string;
}

const ACTION_OPTIONS: ActionMeta[] = [
  {
    id: "pause",
    label: "Pause Strategy",
    subLabel: "Stop new orders",
    icon: Pause,
    iconClassName: "text-status-warning",
  },
  {
    id: "cancel",
    label: "Cancel Orders",
    subLabel: "Cancel all open",
    icon: XCircle,
    iconClassName: "text-status-critical",
  },
  {
    id: "flatten",
    label: "Flatten",
    subLabel: "Close all positions",
    icon: Square,
    iconClassName: "text-status-critical",
  },
  {
    id: "disable-venue",
    label: "Disable Venue",
    subLabel: "Block venue access",
    icon: Power,
    iconClassName: "text-status-critical",
  },
];

export function AlertsKillSwitchWidget(_props: WidgetComponentProps) {
  const { filteredAlerts, isLoading: alertsLoading, isBatchMode } = useAlertsData();
  const { data: strategies = [], isLoading: strategiesLoading } = useStrategyHealth();
  const killSwitch = useKillSwitch();
  const isLoading = alertsLoading || strategiesLoading;
  const [scopeType, setScopeType] = React.useState<KillSwitchScope>("strategy");
  const [entityId, setEntityId] = React.useState<string>("");
  const [selectedAction, setSelectedAction] = React.useState<KillSwitchAction | null>(null);
  const [rationale, setRationale] = React.useState<string>("");

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

  const handleSelectAction = React.useCallback(
    (actionId: KillSwitchAction) => {
      if (isBatchMode) {
        toast.info("Read-only in batch mode", {
          description: "Switch to live mode to select an intervention action.",
        });
        return;
      }
      setSelectedAction(actionId);
    },
    [isBatchMode],
  );

  const handleConfirm = React.useCallback(() => {
    if (isBatchMode) {
      toast.info("Read-only in batch mode", {
        description: "Switch to live mode to execute kill-switch actions.",
      });
      return;
    }
    if (!selectedAction) {
      toast.error("Select an action", {
        description: "Choose Pause, Cancel, Flatten, or Disable Venue before confirming.",
      });
      return;
    }
    if (!rationale.trim()) {
      toast.error("Rationale required", {
        description: "Describe the reason for this intervention before confirming.",
      });
      return;
    }
    const actionMeta = ACTION_OPTIONS.find((a) => a.id === selectedAction);
    const idempotencyKey =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `ks-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    killSwitch.mutate(
      {
        action: ACTION_TO_API[selectedAction],
        scope: scopeType,
        entity_id: scopeType === "firm" ? "firm" : entityId || "firm",
        rationale: rationale.trim(),
        idempotency_key: idempotencyKey,
      },
      {
        onSuccess: (result) => {
          toast.success(actionMeta?.label ?? "Kill-switch accepted", {
            description: `Request ${result.request_id} accepted at ${new Date(result.accepted_at).toLocaleTimeString()}.`,
          });
          setRationale("");
          setSelectedAction(null);
        },
        onError: (err) => {
          toast.error("Kill-switch failed", {
            description: err.message ?? "Unexpected error.",
          });
        },
      },
    );
  }, [isBatchMode, selectedAction, rationale, scopeType, entityId, killSwitch]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 h-full min-h-0 p-1">
      <div className="px-2 pb-2 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <label id="kill-switch-scope-label" className="text-xs font-medium">
              Scope
            </label>
            <Select value={scopeType} onValueChange={(v) => setScopeType(v as KillSwitchScope)}>
              <SelectTrigger className="h-8 text-xs" aria-labelledby="kill-switch-scope-label">
                <SelectValue placeholder="Select scope" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="firm">Firm (All)</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="strategy">Strategy</SelectItem>
                <SelectItem value="venue">Venue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label id="kill-switch-entity-label" className="text-xs font-medium">
              Strategy
            </label>
            {strategies.length === 0 ? (
              <div className="h-8 flex items-center text-caption text-muted-foreground">No strategies available.</div>
            ) : (
              <Select value={entityId} onValueChange={setEntityId}>
                <SelectTrigger className="h-8 text-xs" aria-labelledby="kill-switch-entity-label">
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
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium">Actions</p>
          <div className="grid grid-cols-1 gap-2" role="radiogroup" aria-label="Kill-switch action">
            {ACTION_OPTIONS.map((action) => {
              const Icon = action.icon;
              const isSelected = selectedAction === action.id;
              return (
                <Button
                  key={action.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={isBatchMode}
                  className={cn(
                    "gap-2 justify-start h-auto py-2 transition-colors",
                    isSelected &&
                      "border-status-critical bg-status-critical/10 ring-2 ring-status-critical/60 shadow-sm",
                  )}
                  onClick={() => handleSelectAction(action.id)}
                >
                  <Icon className={cn("size-3.5 shrink-0", action.iconClassName)} />
                  <div className="text-left">
                    <div className={cn("text-xs font-medium", isSelected && "text-status-critical font-semibold")}>
                      {action.label}
                    </div>
                    <div className="text-micro text-muted-foreground">{action.subLabel}</div>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="kill-switch-rationale" className="text-xs font-medium">
            Rationale (required)
          </label>
          <Input
            id="kill-switch-rationale"
            className="h-8 text-xs"
            placeholder="Describe reason for intervention..."
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            disabled={isBatchMode}
          />
        </div>

        <Card className="bg-status-critical/5 border-status-critical/20">
          <CardContent className="p-3">
            <div className="text-xs font-medium text-status-critical mb-1.5">Impact preview</div>
            <div className="text-caption text-muted-foreground space-y-1">
              <div>Active alerts for selected entity: {activeEntityAlerts}</div>
              <div>Position and order impact requires execution API wiring.</div>
            </div>
          </CardContent>
        </Card>

        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="w-full gap-2"
          disabled={isBatchMode || killSwitch.isPending}
          onClick={handleConfirm}
        >
          <Power className="size-3.5" />
          {killSwitch.isPending ? "Submitting..." : "Confirm Action"}
        </Button>
      </div>
    </div>
  );
}
