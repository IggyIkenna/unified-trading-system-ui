"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import type { StrategyTemplate } from "@/lib/strategy-platform-types";
import { FlaskConical, Play } from "lucide-react";

export function NewBacktestDialog({
  templates,
  open,
  onClose,
}: {
  templates: StrategyTemplate[];
  open: boolean;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = React.useState("");
  const [instrument, setInstrument] = React.useState("BTC-USDT");
  const [dateStart, setDateStart] = React.useState("2024-01-01");
  const [dateEnd, setDateEnd] = React.useState("2026-01-01");
  const [strategyType, setStrategyType] = React.useState("ml");
  const [signalThreshold, setSignalThreshold] = React.useState("0.65");
  const [modelVersion, setModelVersion] = React.useState("");
  const [warmupBars, setWarmupBars] = React.useState("64");
  const [maxConcurrent, setMaxConcurrent] = React.useState("4");
  const [maxPositionPct, setMaxPositionPct] = React.useState("12");
  const [maxDdStopPct, setMaxDdStopPct] = React.useState("8");
  const [portfolioMode, setPortfolioMode] = React.useState(false);
  const [shard, setShard] = React.useState("SHARD_1");
  const [saveAsTemplate, setSaveAsTemplate] = React.useState(false);

  const picked = templates.find((t) => t.id === selectedTemplate);
  const modelChoices =
    picked?.linkedModels && picked.linkedModels.length > 0
      ? picked.linkedModels
      : ["model-family/latest", "model-family/v2.1.0-rc"];

  React.useEffect(() => {
    if (!picked) return;
    setModelVersion(picked.linkedModels?.[0] ?? "model-family/latest");
  }, [picked]);

  React.useEffect(() => {
    if (!open || templates.length === 0) return;
    setSelectedTemplate((prev) => {
      if (prev && templates.some((t) => t.id === prev)) return prev;
      return templates[0].id;
    });
  }, [open, templates]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <FlaskConical className="size-5 text-amber-400" />
            New Strategy Backtest
          </DialogTitle>
          <DialogDescription>
            Configure signal backtest (minimal slippage). Wire-up to API in a
            later iteration; this form captures the full institutional parameter
            surface.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] px-6">
          <div className="space-y-5 py-2 pr-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Strategy Type</Label>
                <Select value={strategyType} onValueChange={setStrategyType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ml">ML-Based</SelectItem>
                    <SelectItem value="rule">Rule-Based</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Shard</Label>
                <Select value={shard} onValueChange={setShard}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHARD_1">SHARD_1 (CeFi core)</SelectItem>
                    <SelectItem value="SHARD_2">
                      SHARD_2 (Alt venues)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Strategy Template</Label>
              <Select
                value={selectedTemplate}
                onValueChange={setSelectedTemplate}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a strategy template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {t.archetype}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {strategyType === "ml" && (
              <div className="space-y-2">
                <Label>Model version</Label>
                <Select value={modelVersion} onValueChange={setModelVersion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Registry version" />
                  </SelectTrigger>
                  <SelectContent>
                    {modelChoices.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Signal Threshold</Label>
                <Input
                  type="number"
                  step="0.05"
                  min="0.5"
                  max="0.95"
                  value={signalThreshold}
                  onChange={(e) => setSignalThreshold(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Warmup bars</Label>
                <Input
                  type="number"
                  min="0"
                  value={warmupBars}
                  onChange={(e) => setWarmupBars(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Max concurrent signals</Label>
                <Input
                  type="number"
                  min="1"
                  value={maxConcurrent}
                  onChange={(e) => setMaxConcurrent(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Instrument</Label>
                <Select value={instrument} onValueChange={setInstrument}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[
                      "BTC-USDT",
                      "ETH-USDT",
                      "SOL-USDT",
                      "ETH-PERP",
                      "BTC-PERP",
                    ].map((i) => (
                      <SelectItem key={i} value={i}>
                        {i}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border/50 px-3 py-2">
              <div>
                <p className="text-sm font-medium">Portfolio mode</p>
                <p className="text-xs text-muted-foreground">
                  One backtest, multiple symbols (cross-asset limits)
                </p>
              </div>
              <Switch
                checked={portfolioMode}
                onCheckedChange={setPortfolioMode}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Max position (% notional)</Label>
                <Input
                  type="number"
                  min="0"
                  value={maxPositionPct}
                  onChange={(e) => setMaxPositionPct(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Max DD stop (%)</Label>
                <Input
                  type="number"
                  min="0"
                  value={maxDdStopPct}
                  onChange={(e) => setMaxDdStopPct(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={dateStart}
                  onChange={(e) => setDateStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => setDateEnd(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-lg border border-border/50 px-3 py-2">
              <Checkbox
                id="save-as-template"
                checked={saveAsTemplate}
                onCheckedChange={(c) => setSaveAsTemplate(c === true)}
              />
              <label
                htmlFor="save-as-template"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Save as template (demo — local only until API exists)
              </label>
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              if (saveAsTemplate) {
                toast({
                  title: "Template saved (demo)",
                  description:
                    "Registry write will connect when the strategy API is wired.",
                });
              }
              setSaveAsTemplate(false);
              onClose();
            }}
            disabled={!selectedTemplate}
            className="gap-2"
          >
            <Play className="size-4" />
            Launch Backtest
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
