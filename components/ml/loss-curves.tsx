"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Activity,
  TrendingDown,
  ArrowRight,
  ExternalLink,
  Layers,
} from "lucide-react";
import { EntityLink } from "@/components/trading/entity-link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";

// Generate mock loss curve data
function generateLossCurve(
  epochs: number,
  startLoss: number,
  endLoss: number,
  noise: number = 0.02,
): { epoch: number; trainLoss: number; valLoss: number }[] {
  const data = [];
  for (let i = 0; i <= epochs; i++) {
    const progress = i / epochs;
    // Exponential decay for training loss
    const trainBase =
      startLoss * Math.exp(-3 * progress) +
      endLoss * (1 - Math.exp(-3 * progress));
    const trainLoss = trainBase + (Math.random() - 0.5) * noise * trainBase;
    // Validation loss with potential overfitting
    const overfitFactor = progress > 0.7 ? (progress - 0.7) * 0.5 : 0;
    const valBase = trainBase * (1 + 0.1 + overfitFactor);
    const valLoss = valBase + (Math.random() - 0.5) * noise * valBase;
    data.push({
      epoch: i,
      trainLoss: Math.max(endLoss * 0.5, trainLoss),
      valLoss: Math.max(endLoss * 0.6, valLoss),
    });
  }
  return data;
}

// Model-strategy linkage data
interface ModelStrategyLink {
  modelId: string;
  modelName: string;
  modelVersion: string;
  strategies: {
    strategyId: string;
    strategyName: string;
    featureUsed: string;
    signalType: "direction" | "sizing" | "timing" | "risk";
    lastPrediction: string;
    accuracy7d: number;
  }[];
}

const mockModelStrategyLinks: ModelStrategyLink[] = [
  {
    modelId: "model-btc-dir-v3",
    modelName: "BTC Direction v3",
    modelVersion: "3.2.1",
    strategies: [
      {
        strategyId: "CEFI_BTC_ML_DIR_HUF_4H",
        strategyName: "ML Directional BTC",
        featureUsed: "btc_direction_signal",
        signalType: "direction",
        lastPrediction: "2s ago",
        accuracy7d: 0.72,
      },
      {
        strategyId: "CEFI_BTC_BASIS_SCE_1H",
        strategyName: "BTC Basis Trade",
        featureUsed: "btc_regime",
        signalType: "timing",
        lastPrediction: "15s ago",
        accuracy7d: 0.68,
      },
    ],
  },
  {
    modelId: "model-eth-vol-v2",
    modelName: "ETH Volatility v2",
    modelVersion: "2.1.0",
    strategies: [
      {
        strategyId: "CEFI_ETH_OPT_MM_EVT_TICK",
        strategyName: "ETH Options MM",
        featureUsed: "eth_vol_surface",
        signalType: "sizing",
        lastPrediction: "1s ago",
        accuracy7d: 0.65,
      },
      {
        strategyId: "CEFI_ETH_MOM_HUF_4H",
        strategyName: "ETH Momentum",
        featureUsed: "eth_vol_regime",
        signalType: "risk",
        lastPrediction: "4h ago",
        accuracy7d: 0.71,
      },
    ],
  },
  {
    modelId: "model-momentum-v1",
    modelName: "Multi-Asset Momentum",
    modelVersion: "1.0.0",
    strategies: [
      {
        strategyId: "CEFI_ETH_MOM_HUF_4H",
        strategyName: "ETH Momentum",
        featureUsed: "momentum_signal",
        signalType: "direction",
        lastPrediction: "30m ago",
        accuracy7d: 0.74,
      },
      {
        strategyId: "CEFI_SOL_MOM_HUF_4H",
        strategyName: "SOL Momentum",
        featureUsed: "momentum_signal",
        signalType: "direction",
        lastPrediction: "30m ago",
        accuracy7d: 0.69,
      },
    ],
  },
];

// Mock loss curve data for different experiments
const mockExperimentLossCurves: Record<
  string,
  { epoch: number; trainLoss: number; valLoss: number }[]
> = {
  "exp-342": generateLossCurve(100, 0.8, 0.31, 0.03),
  "exp-341": generateLossCurve(150, 0.75, 0.42, 0.025),
  "exp-340": generateLossCurve(120, 0.7, 0.35, 0.02),
};

interface LossCurvesProps {
  experimentId?: string;
  className?: string;
}

export function LossCurves({
  experimentId = "exp-342",
  className,
}: LossCurvesProps) {
  const [selectedExperiment, setSelectedExperiment] =
    React.useState(experimentId);
  const lossData =
    mockExperimentLossCurves[selectedExperiment] ||
    generateLossCurve(100, 0.8, 0.3);

  const currentEpoch = lossData.length - 1;
  const latestTrainLoss = lossData[currentEpoch].trainLoss;
  const latestValLoss = lossData[currentEpoch].valLoss;
  const bestValLoss = Math.min(...lossData.map((d) => d.valLoss));
  const bestEpoch = lossData.findIndex((d) => d.valLoss === bestValLoss);

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="size-4" />
            Training Loss Curves
          </CardTitle>
          <Select
            value={selectedExperiment}
            onValueChange={setSelectedExperiment}
          >
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Select experiment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="exp-342">exp-342: BTC Direction</SelectItem>
              <SelectItem value="exp-341">exp-341: ETH Volatility</SelectItem>
              <SelectItem value="exp-340">exp-340: Multi-Asset Mom</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Metrics row */}
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">Epoch: </span>
            <span className="font-mono font-semibold">{currentEpoch}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Train Loss: </span>
            <span className="font-mono font-semibold">
              {latestTrainLoss.toFixed(4)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Val Loss: </span>
            <span className="font-mono font-semibold">
              {latestValLoss.toFixed(4)}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">
              Best (epoch {bestEpoch}):{" "}
            </span>
            <span className="font-mono font-semibold text-[var(--status-live)]">
              {bestValLoss.toFixed(4)}
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={lossData}
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                opacity={0.5}
              />
              <XAxis
                dataKey="epoch"
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={{ stroke: "var(--border)" }}
              />
              <YAxis
                tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={{ stroke: "var(--border)" }}
                domain={["auto", "auto"]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
                labelStyle={{ color: "var(--foreground)" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <ReferenceLine
                y={bestValLoss}
                stroke="var(--status-live)"
                strokeDasharray="5 5"
                label={{
                  value: "Best",
                  position: "right",
                  fill: "var(--status-live)",
                  fontSize: 10,
                }}
              />
              <Line
                type="monotone"
                dataKey="trainLoss"
                stroke="var(--surface-ml)"
                strokeWidth={2}
                dot={false}
                name="Train Loss"
              />
              <Line
                type="monotone"
                dataKey="valLoss"
                stroke="var(--status-warning)"
                strokeWidth={2}
                dot={false}
                name="Validation Loss"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Overfitting warning */}
        {latestValLoss > bestValLoss * 1.1 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-[var(--status-warning)]/10 border border-[var(--status-warning)]/20 text-sm">
            <Activity className="size-4 text-[var(--status-warning)]" />
            <span>
              Potential overfitting detected. Consider early stopping at epoch{" "}
              {bestEpoch}.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface ModelStrategyLinkageProps {
  className?: string;
}

export function ModelStrategyLinkage({ className }: ModelStrategyLinkageProps) {
  const [selectedModel, setSelectedModel] = React.useState<string | null>(null);

  const signalTypeColors: Record<string, string> = {
    direction: "var(--surface-trading)",
    sizing: "var(--surface-risk)",
    timing: "var(--surface-markets)",
    risk: "var(--status-warning)",
  };

  return (
    <Card className={cn(className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Layers className="size-4" />
          Model-Strategy Linkage
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockModelStrategyLinks.map((link) => (
          <div
            key={link.modelId}
            className={cn(
              "p-3 rounded-lg border transition-all",
              selectedModel === link.modelId
                ? "border-primary bg-primary/5"
                : "border-border hover:border-border/80",
            )}
          >
            {/* Model header */}
            <button
              onClick={() =>
                setSelectedModel(
                  selectedModel === link.modelId ? null : link.modelId,
                )
              }
              className="w-full flex items-center justify-between mb-2"
            >
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-lg bg-[var(--surface-ml)]/10 flex items-center justify-center">
                  <Activity
                    className="size-4"
                    style={{ color: "var(--surface-ml)" }}
                  />
                </div>
                <div className="text-left">
                  <div className="font-medium flex items-center gap-2">
                    {link.modelName}
                    <Badge variant="outline" className="font-mono text-[10px]">
                      v{link.modelVersion}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {link.strategies.length} strategies connected
                  </div>
                </div>
              </div>
              <ArrowRight
                className={cn(
                  "size-4 text-muted-foreground transition-transform",
                  selectedModel === link.modelId && "rotate-90",
                )}
              />
            </button>

            {/* Linked strategies */}
            {selectedModel === link.modelId && (
              <div className="space-y-2 mt-3 pt-3 border-t border-border/50">
                {link.strategies.map((strategy) => (
                  <div
                    key={strategy.strategyId}
                    className="flex items-center justify-between p-2 rounded-md bg-muted/30"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-1 h-8 rounded-full"
                        style={{
                          backgroundColor:
                            signalTypeColors[strategy.signalType],
                        }}
                      />
                      <div>
                        <EntityLink
                          type="strategy"
                          id={strategy.strategyId}
                          label={strategy.strategyName}
                          className="text-sm font-medium"
                        />
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <code className="px-1 py-0.5 bg-muted rounded">
                            {strategy.featureUsed}
                          </code>
                          <Badge variant="secondary" className="text-[10px]">
                            {strategy.signalType}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-mono">
                        {(strategy.accuracy7d * 100).toFixed(1)}%
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        Last: {strategy.lastPrediction}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
