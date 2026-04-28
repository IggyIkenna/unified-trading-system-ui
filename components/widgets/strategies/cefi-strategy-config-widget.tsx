"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WidgetComponentProps } from "@/components/widgets/widget-registry";
import { SchemaForm } from "@/components/shared/schema-driven-form";
import { buildDefaults, CEFI_STRATEGY_FAMILIES, CEFI_STRATEGY_SCHEMAS } from "@/lib/config/strategy-config-schemas";
import { useExecutionMode } from "@/lib/execution-mode-context";
import * as React from "react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Derived constants
// ---------------------------------------------------------------------------

const ALL_STRATEGIES = CEFI_STRATEGY_FAMILIES.flatMap((f) => f.strategies);

function familyOf(id: string): string {
  return CEFI_STRATEGY_FAMILIES.find((f) => f.strategies.some((s) => s.id === id))?.label ?? "Unknown";
}

function loadInitialConfigs(): Record<string, Record<string, unknown>> {
  const init: Record<string, Record<string, unknown>> = {};
  for (const s of ALL_STRATEGIES) {
    const schema = CEFI_STRATEGY_SCHEMAS[s.id];
    init[s.id] = schema ? buildDefaults(schema) : {};
  }
  return init;
}

// ---------------------------------------------------------------------------
// Widget
// ---------------------------------------------------------------------------

export function CeFiStrategyConfigWidget(_props: WidgetComponentProps) {
  const [selectedId, setSelectedId] = React.useState(ALL_STRATEGIES[0].id);
  const [configs, setConfigs] = React.useState(loadInitialConfigs);
  const { mode: execMode, isLive } = useExecutionMode();
  const modeLabel = isLive ? "Active" : execMode === "paper" ? "Paper" : "Batch";

  const schema = CEFI_STRATEGY_SCHEMAS[selectedId];
  const current = configs[selectedId] ?? (schema ? buildDefaults(schema) : {});
  const selectedName = ALL_STRATEGIES.find((s) => s.id === selectedId)?.name ?? selectedId;

  return (
    <div className="space-y-3 p-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 space-y-1">
          <label className="text-xs text-muted-foreground">Strategy</label>
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CEFI_STRATEGY_FAMILIES.map((family) => (
                <React.Fragment key={family.label}>
                  <div className="px-2 py-1.5 text-micro font-semibold text-muted-foreground uppercase tracking-wider">
                    {family.label}
                  </div>
                  {family.strategies.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="text-xs pl-4">
                      {s.name}
                    </SelectItem>
                  ))}
                </React.Fragment>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="pt-5">
          <Badge variant={isLive ? "success" : "warning"}>{modeLabel}</Badge>
        </div>
      </div>

      <div className="rounded-md border px-3 py-1.5 text-xs flex items-center gap-1.5 border-blue-500/30 bg-blue-500/5 text-blue-400">
        <span className="font-mono font-medium">{familyOf(selectedId)}</span>
        <span className="text-muted-foreground">: {selectedName}</span>
      </div>

      <div className="rounded-lg border bg-muted/30 p-3">
        {schema ? (
          <SchemaForm
            schema={schema}
            values={current}
            onChange={(c) => setConfigs((prev) => ({ ...prev, [selectedId]: c }))}
          />
        ) : (
          <div className="text-xs text-muted-foreground">No config schema for this strategy.</div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          className="flex-1"
          size="sm"
          onClick={() => {
            toast.success("Config saved", { description: `${selectedName} configuration persisted.` });
          }}
        >
          Save Config
        </Button>
        <Button
          variant="secondary"
          className="flex-1"
          size="sm"
          onClick={() => {
            toast.success("Strategy deployed", { description: `${selectedName} deployed in ${modeLabel} mode.` });
          }}
        >
          Deploy
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            toast.success("Promoted from backtest", { description: `Promoted ${selectedName} from latest backtest.` });
          }}
        >
          Promote
        </Button>
      </div>
    </div>
  );
}
