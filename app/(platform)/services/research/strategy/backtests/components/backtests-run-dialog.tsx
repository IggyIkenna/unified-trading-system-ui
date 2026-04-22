"use client";

import * as React from "react";
import { FlaskConical, Play, Signal, Shield, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import type { StrategyTemplate } from "@/lib/types/strategy-platform";
import { Badge } from "@/components/ui/badge";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import {
  CollapsibleConfigSection,
  DEFI_ARCHETYPES,
  FEATURE_SET_OPTIONS,
  type BacktestFormState,
} from "./backtests-page-support";

export function BacktestsRunDialog({
  open,
  onOpenChange,
  form,
  setForm,
  strategyTemplates,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: BacktestFormState;
  setForm: React.Dispatch<React.SetStateAction<BacktestFormState>>;
  strategyTemplates: StrategyTemplate[];
  onSubmit: () => void;
}) {
  const selectedTemplate = strategyTemplates.find((t) => t.id === form.templateId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="size-5 text-primary" />
            Run New Backtest
          </DialogTitle>
          <DialogDescription>
            Configure strategy template, risk parameters, signal config, and test window.
          </DialogDescription>
        </DialogHeader>
        <WidgetScroll className="max-h-[90vh]" viewportClassName="space-y-4 py-2">
          {/* Section A: Core Config */}
          <CollapsibleConfigSection
            title="Core Config"
            icon={<FlaskConical className="size-3.5 text-muted-foreground" />}
            defaultOpen={true}
          >
            <div className="space-y-2">
              <Label>Strategy Template</Label>
              <Select
                value={form.templateId}
                onValueChange={(v) =>
                  setForm((f) => ({
                    ...f,
                    templateId: v,
                    instrument: "",
                    venue: "",
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select template..." />
                </SelectTrigger>
                <SelectContent>
                  {strategyTemplates.map((tpl) => (
                    <SelectItem key={tpl.id} value={tpl.id}>
                      <span className="flex items-center gap-2">
                        {tpl.name}
                        <span className="text-muted-foreground text-xs">{tpl.archetype.replace(/_/g, " ")}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-muted-foreground">Select the strategy archetype to backtest</p>
            </div>

            {selectedTemplate && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Instrument</Label>
                    <Select value={form.instrument} onValueChange={(v) => setForm((f) => ({ ...f, instrument: v }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedTemplate.instruments.map((inst) => (
                          <SelectItem key={inst} value={inst}>
                            {inst}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Venue</Label>
                    <Select value={form.venue} onValueChange={(v) => setForm((f) => ({ ...f, venue: v }))}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedTemplate.venues.map((v) => (
                          <SelectItem key={v} value={v}>
                            {v}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={form.dateStart}
                      onChange={(e) => setForm((f) => ({ ...f, dateStart: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={form.dateEnd}
                      onChange={(e) => setForm((f) => ({ ...f, dateEnd: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-border/50 p-3 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Parameters</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Entry Threshold</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.entryThreshold}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            entryThreshold: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Exit Threshold</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={form.exitThreshold}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            exitThreshold: e.target.value,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Max Leverage</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={form.maxLeverage}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            maxLeverage: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </>
            )}
          </CollapsibleConfigSection>

          {/* Section B: Risk Config */}
          <CollapsibleConfigSection
            title="Risk Parameters"
            icon={<Shield className="size-3.5 text-muted-foreground" />}
            defaultOpen={false}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Max Position Size ($)</Label>
                <Input
                  type="number"
                  value={form.maxPositionSize}
                  onChange={(e) => setForm((f) => ({ ...f, maxPositionSize: e.target.value }))}
                />
                <p className="text-[11px] text-muted-foreground">Maximum notional per position</p>
              </div>
              <div className="space-y-2">
                <Label>Position Sizing</Label>
                <Select
                  value={form.positionSizing}
                  onValueChange={(v) => setForm((f) => ({ ...f, positionSizing: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="kelly">Kelly Criterion</SelectItem>
                    <SelectItem value="risk-parity">Risk Parity</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">Method for determining trade size</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Stop Loss %</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="0.50"
                  value={form.stopLossPct}
                  onChange={(e) => setForm((f) => ({ ...f, stopLossPct: e.target.value }))}
                />
                <p className="text-[11px] text-muted-foreground">0.01 - 0.50</p>
              </div>
              <div className="space-y-2">
                <Label>Take Profit %</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="1.00"
                  value={form.takeProfitPct}
                  onChange={(e) => setForm((f) => ({ ...f, takeProfitPct: e.target.value }))}
                />
                <p className="text-[11px] text-muted-foreground">0.01 - 1.00</p>
              </div>
              <div className="space-y-2">
                <Label>Max Drawdown %</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={form.maxDrawdownPct}
                  onChange={(e) => setForm((f) => ({ ...f, maxDrawdownPct: e.target.value }))}
                />
                <p className="text-[11px] text-muted-foreground">Circuit breaker threshold</p>
              </div>
            </div>
          </CollapsibleConfigSection>

          {/* Section C: Signal Config */}
          <CollapsibleConfigSection
            title="Signal & ML Config"
            icon={<Signal className="size-3.5 text-muted-foreground" />}
            defaultOpen={false}
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Signal Source</Label>
                <Select value={form.signalSource} onValueChange={(v) => setForm((f) => ({ ...f, signalSource: v }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rule-based">Rule-Based</SelectItem>
                    <SelectItem value="ml-model">ML Model</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">How trading signals are generated</p>
              </div>
              <div className="space-y-2">
                <Label>Direction Mapping</Label>
                <Select
                  value={form.directionMapping}
                  onValueChange={(v) => setForm((f) => ({ ...f, directionMapping: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="binary">Binary (Long/Short)</SelectItem>
                    <SelectItem value="ternary">Ternary (Long/Short/Flat)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">Signal output classification</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>
                Confidence Threshold: <span className="font-mono text-primary">{form.confidenceThreshold}%</span>
              </Label>
              <Slider
                value={[form.confidenceThreshold]}
                onValueChange={(v) => setForm((f) => ({ ...f, confidenceThreshold: v[0] }))}
                min={0}
                max={100}
                step={1}
              />
              <p className="text-[11px] text-muted-foreground">Minimum prediction confidence to trigger a trade</p>
            </div>

            <div className="space-y-2">
              <Label>Feature Sets</Label>
              <div className="flex flex-wrap gap-2">
                {FEATURE_SET_OPTIONS.map((feat) => (
                  <Badge
                    key={feat}
                    variant="outline"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        featureSets: f.featureSets.includes(feat)
                          ? f.featureSets.filter((x) => x !== feat)
                          : [...f.featureSets, feat],
                      }))
                    }
                    className={`cursor-pointer text-xs transition-colors capitalize ${
                      form.featureSets.includes(feat)
                        ? "border-primary bg-primary/10 text-primary"
                        : "hover:border-border"
                    }`}
                  >
                    {feat}
                  </Badge>
                ))}
              </div>
              <p className="text-[11px] text-muted-foreground">Select which feature groups to include</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lookback Window</Label>
                <Select
                  value={form.lookbackWindow}
                  onValueChange={(v) => setForm((f) => ({ ...f, lookbackWindow: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="4h">4 Hours</SelectItem>
                    <SelectItem value="1d">1 Day</SelectItem>
                    <SelectItem value="1w">1 Week</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rebalance Frequency</Label>
                <Select
                  value={form.rebalanceFrequency}
                  onValueChange={(v) => setForm((f) => ({ ...f, rebalanceFrequency: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1min">1 Minute</SelectItem>
                    <SelectItem value="5min">5 Minutes</SelectItem>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="4h">4 Hours</SelectItem>
                    <SelectItem value="1d">1 Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleConfigSection>

          {/* Section D: DeFi Config — only visible for DeFi archetypes */}
          {selectedTemplate && (DEFI_ARCHETYPES as readonly string[]).includes(selectedTemplate.archetype) && (
            <CollapsibleConfigSection
              title="DeFi Config"
              icon={<Wallet className="size-3.5 text-muted-foreground" />}
              defaultOpen={false}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Protocol</Label>
                  <Select value={form.protocol} onValueChange={(v) => setForm((f) => ({ ...f, protocol: v }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Aave">Aave</SelectItem>
                      <SelectItem value="Uniswap">Uniswap</SelectItem>
                      <SelectItem value="Compound">Compound</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">Target DeFi protocol</p>
                </div>
                <div className="space-y-2">
                  <Label>Chain</Label>
                  <Select value={form.chain} onValueChange={(v) => setForm((f) => ({ ...f, chain: v }))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ethereum">Ethereum</SelectItem>
                      <SelectItem value="Arbitrum">Arbitrum</SelectItem>
                      <SelectItem value="Optimism">Optimism</SelectItem>
                      <SelectItem value="Polygon">Polygon</SelectItem>
                      <SelectItem value="Base">Base</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">Deployment chain for execution</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Min Spread (BPS)</Label>
                  <Input
                    type="number"
                    value={form.minSpreadBps}
                    onChange={(e) => setForm((f) => ({ ...f, minSpreadBps: e.target.value }))}
                  />
                  <p className="text-[11px] text-muted-foreground">Minimum spread to enter</p>
                </div>
                <div className="space-y-2">
                  <Label>Health Factor</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={form.healthFactorThreshold}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        healthFactorThreshold: e.target.value,
                      }))
                    }
                  />
                  <p className="text-[11px] text-muted-foreground">Min health factor threshold</p>
                </div>
                <div className="space-y-2">
                  <Label>Gas Budget (USD)</Label>
                  <Input
                    type="number"
                    value={form.gasBudgetUsd}
                    onChange={(e) => setForm((f) => ({ ...f, gasBudgetUsd: e.target.value }))}
                  />
                  <p className="text-[11px] text-muted-foreground">Max gas spend per cycle</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Max Leverage</Label>
                  <Input type="number" step="0.1" defaultValue="3.0" min={1} max={20} />
                  <p className="text-[11px] text-muted-foreground">
                    Maximum leverage ratio (DeFiStrategyConfigDict.max_leverage)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Rebalance Trigger</Label>
                  <Select defaultValue="threshold">
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="threshold">Threshold-based</SelectItem>
                      <SelectItem value="periodic">Periodic</SelectItem>
                      <SelectItem value="health_factor">Health Factor</SelectItem>
                      <SelectItem value="manual">Manual Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    When to trigger rebalancing (rebalancing_config.trigger_type)
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>LTV Max (%)</Label>
                  <Input type="number" step="1" defaultValue="75" min={0} max={100} />
                  <p className="text-[11px] text-muted-foreground">Maximum loan-to-value ratio (risk_limits.ltv_max)</p>
                </div>
                <div className="space-y-2">
                  <Label>Margin Usage Max (%)</Label>
                  <Input type="number" step="1" defaultValue="80" min={0} max={100} />
                  <p className="text-[11px] text-muted-foreground">
                    Maximum margin utilisation (risk_limits.margin_usage_max)
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="smart-order-routing"
                  checked={form.smartOrderRouting}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, smartOrderRouting: v }))}
                />
                <Label htmlFor="smart-order-routing" className="cursor-pointer">
                  Smart Order Routing
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Route across DEX aggregators for best execution (DeFiSORConfigDict)
                </p>
              </div>
            </CollapsibleConfigSection>
          )}
        </WidgetScroll>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={!form.templateId}>
            <Play className="size-4" />
            Run Backtest
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
