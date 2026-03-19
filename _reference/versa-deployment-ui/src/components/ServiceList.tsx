import {
  ChevronRight,
  Database,
  Cpu,
  BarChart3,
  Zap,
  Brain,
  TrendingUp,
  Clock,
  Package,
  Layers,
  Activity,
  Shield,
  Radio,
  Bot,
  Network,
  Coins,
  Globe,
  LineChart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

const serviceIcons: Record<string, React.ElementType> = {
  // L1
  "instruments-service": Package,
  "corporate-actions": Clock,
  // L2
  "market-tick-data-service": Database,
  "market-data-processing-service": Cpu,
  // L3
  "features-calendar-service": Clock,
  "features-delta-one-service": BarChart3,
  "features-volatility-service": TrendingUp,
  "features-onchain-service": Coins,
  "features-sports-service": Activity,
  "features-multi-timeframe-service": LineChart,
  "features-cross-instrument-service": Network,
  "features-commodity-service": Globe,
  // L4
  "ml-training-service": Brain,
  "ml-inference-service": Brain,
  // L5
  "strategy-service": TrendingUp,
  "execution-service": Zap,
  "trading-agent-service": Bot,
  // L6
  "position-balance-monitor-service": Activity,
  "risk-and-exposure-service": Shield,
  "pnl-attribution-service": BarChart3,
  "alerting-service": Radio,
  // Infrastructure
  "ibkr-gateway-infra": Network,
  "deployment-service": Layers,
  // Website
  "odum-research-website": Globe,
};

const SERVICE_METADATA: Record<
  string,
  { description: string; dimensions: string[] }
> = {
  // L1
  "instruments-service": {
    description: "Instrument universe & definitions",
    dimensions: ["category", "date"],
  },
  "corporate-actions": {
    description: "Dividends, splits, adjustments",
    dimensions: ["category", "date"],
  },
  // L2
  "market-tick-data-service": {
    description: "Download & normalise raw tick data",
    dimensions: ["category", "venue", "date"],
  },
  "market-data-processing-service": {
    description: "Resample ticks into OHLCV candles",
    dimensions: ["category", "venue", "date"],
  },
  // L3
  "features-calendar-service": {
    description: "Calendar & seasonality features",
    dimensions: ["category", "date"],
  },
  "features-delta-one-service": {
    description: "Returns, spreads, delta-one signals",
    dimensions: ["category", "feature_group", "date"],
  },
  "features-volatility-service": {
    description: "Realised & implied vol surface",
    dimensions: ["category", "feature_group", "date"],
  },
  "features-onchain-service": {
    description: "On-chain DeFi & network metrics",
    dimensions: ["category", "feature_group", "date"],
  },
  "features-sports-service": {
    description: "Sports market event features",
    dimensions: ["category", "feature_group", "date"],
  },
  "features-multi-timeframe-service": {
    description: "Cross-timeframe feature aggregation",
    dimensions: ["category", "timeframe", "date"],
  },
  "features-cross-instrument-service": {
    description: "Cross-asset correlation features",
    dimensions: ["category", "feature_group", "date"],
  },
  "features-commodity-service": {
    description: "Commodity-specific features",
    dimensions: ["category", "feature_group", "date"],
  },
  // L4
  "ml-training-service": {
    description: "Train & evaluate ML models",
    dimensions: ["instrument", "timeframe", "target_type", "config"],
  },
  "ml-inference-service": {
    description: "Batch & live model inference",
    dimensions: ["instrument", "timeframe", "target_type", "config"],
  },
  // L5
  "strategy-service": {
    description: "Backtest & optimise strategies",
    dimensions: ["config"],
  },
  "execution-service": {
    description: "Live order execution & algos",
    dimensions: ["config"],
  },
  "trading-agent-service": {
    description: "Autonomous trading agents",
    dimensions: ["config"],
  },
  // L6
  "position-balance-monitor-service": {
    description: "Real-time position & balance tracking",
    dimensions: ["config"],
  },
  "risk-and-exposure-service": {
    description: "Greeks, VaR & exposure limits",
    dimensions: ["config"],
  },
  "pnl-attribution-service": {
    description: "P&L attribution & reporting",
    dimensions: ["config"],
  },
  "alerting-service": {
    description: "Alerts, circuit breakers & notifications",
    dimensions: ["config"],
  },
  // Infrastructure
  "ibkr-gateway-infra": {
    description: "Interactive Brokers TWS gateway",
    dimensions: ["config"],
  },
  "deployment-service": {
    description: "Deployment orchestration & sharding",
    dimensions: ["service"],
  },
  "odum-research-website": {
    description: "Corporate website & presentation portal",
    dimensions: ["environment"],
  },
};

const PIPELINE_LAYERS = [
  {
    id: "layer1",
    title: "Layer 1: Root Services",
    description: "Instrument universe and corporate actions",
    color: "var(--color-accent-cyan)",
    services: ["instruments-service", "corporate-actions"],
  },
  {
    id: "layer2",
    title: "Layer 2: Data Ingestion",
    description: "Download and process raw tick data",
    color: "var(--color-accent-blue)",
    services: ["market-tick-data-service", "market-data-processing-service"],
  },
  {
    id: "layer3",
    title: "Layer 3: Feature Engineering",
    description: "Generate features from processed data",
    color: "var(--color-accent-purple)",
    services: [
      "features-calendar-service",
      "features-delta-one-service",
      "features-volatility-service",
      "features-onchain-service",
      "features-sports-service",
      "features-multi-timeframe-service",
      "features-cross-instrument-service",
      "features-commodity-service",
    ],
  },
  {
    id: "layer4",
    title: "Layer 4: Machine Learning",
    description: "Train and run ML models",
    color: "var(--color-accent-amber)",
    services: ["ml-training-service", "ml-inference-service"],
  },
  {
    id: "layer5",
    title: "Layer 5: Strategy & Execution",
    description: "Backtest, validate, execute and trade",
    color: "var(--color-accent-green)",
    services: [
      "strategy-service",
      "execution-service",
      "trading-agent-service",
    ],
  },
  {
    id: "layer6",
    title: "Layer 6: Risk & Monitoring",
    description: "Positions, risk, P&L and alerting",
    color: "var(--color-accent-red)",
    services: [
      "position-balance-monitor-service",
      "risk-and-exposure-service",
      "pnl-attribution-service",
      "alerting-service",
    ],
  },
  {
    id: "infrastructure",
    title: "Infrastructure",
    description: "Deployment orchestration and IBKR connectivity",
    color: "var(--color-accent-pink)",
    services: ["ibkr-gateway-infra", "deployment-service"],
  },
  {
    id: "website",
    title: "Website",
    description: "Odum Research corporate website and presentation portal",
    color: "var(--color-accent-teal)",
    services: ["odum-research-website"],
  },
];

const TOTAL_SERVICES = PIPELINE_LAYERS.reduce(
  (sum, layer) => sum + layer.services.length,
  0,
);

interface ServiceListProps {
  selectedService: string | null;
  onSelectService: (service: string) => void;
}

export function ServiceList({
  selectedService,
  onSelectService,
}: ServiceListProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-[var(--color-accent-cyan)]" />
            Pipeline Services
          </CardTitle>
          <Badge variant="outline" className="font-mono">
            {TOTAL_SERVICES} services
          </Badge>
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-1">
          Services ordered by execution dependency
        </p>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-[var(--color-border-subtle)]">
          {PIPELINE_LAYERS.map((layer) => (
            <div key={layer.id}>
              <div
                className="px-5 py-2.5 bg-[var(--color-bg-tertiary)]"
                style={{ borderLeft: `3px solid ${layer.color}` }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-semibold uppercase tracking-wider"
                    style={{ color: layer.color }}
                  >
                    {layer.title}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  {layer.description}
                </p>
              </div>
              <div className="divide-y divide-[var(--color-border-subtle)]">
                {layer.services.map((serviceName) => (
                  <ServiceItem
                    key={serviceName}
                    serviceName={serviceName}
                    metadata={SERVICE_METADATA[serviceName]}
                    layerColor={layer.color}
                    isSelected={selectedService === serviceName}
                    onClick={() => onSelectService(serviceName)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ServiceItemProps {
  serviceName: string;
  metadata?: { description: string; dimensions: string[] };
  layerColor: string;
  isSelected: boolean;
  onClick: () => void;
}

function ServiceItem({
  serviceName,
  metadata,
  layerColor,
  isSelected,
  onClick,
}: ServiceItemProps) {
  const Icon = serviceIcons[serviceName] || Package;
  const dimensions = metadata?.dimensions || [];

  return (
    <Button
      variant="ghost"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-[var(--color-bg-hover)] h-auto rounded-none",
        isSelected && "bg-[var(--color-bg-hover)]",
      )}
      style={isSelected ? { borderLeft: `2px solid ${layerColor}` } : undefined}
    >
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--color-bg-tertiary)]"
        style={
          isSelected
            ? { color: layerColor }
            : { color: "var(--color-text-tertiary)" }
        }
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium font-mono truncate",
            isSelected
              ? "text-[var(--color-text-primary)]"
              : "text-[var(--color-text-secondary)]",
          )}
        >
          {serviceName}
        </p>
        <p className="text-xs text-[var(--color-text-muted)] truncate">
          {dimensions.length > 0 ? dimensions.join(" × ") : "config-based"}
        </p>
      </div>
      <ChevronRight
        className={cn(
          "h-4 w-4 shrink-0 transition-transform",
          isSelected
            ? "text-[var(--color-text-secondary)]"
            : "text-[var(--color-text-muted)]",
        )}
        style={isSelected ? { color: layerColor } : undefined}
      />
    </Button>
  );
}
