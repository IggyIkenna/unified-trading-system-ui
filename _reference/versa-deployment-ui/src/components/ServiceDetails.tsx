import { useMemo } from "react";
import {
  ArrowRight,
  ArrowDown,
  AlertTriangle,
  Info,
  Calendar,
  List,
  Cloud,
  GitFork,
  AlertCircle,
} from "lucide-react";
import {
  useServiceDimensions,
  useServiceDependencies,
} from "../hooks/useServices";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "./ui/card";
import { Badge, type BadgeProps } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { cn } from "../lib/utils";
import type { DependenciesResponse, DagData } from "../types";

// Infrastructure services that don't have sharding configs
const INFRASTRUCTURE_SERVICES = ["unified-trading-deployment-v2"];

interface ServiceDetailsProps {
  serviceName: string;
}

export function ServiceDetails({ serviceName }: ServiceDetailsProps) {
  const isInfrastructure = INFRASTRUCTURE_SERVICES.includes(serviceName);
  const {
    dimensions,
    loading: loadingDims,
    error: errorDims,
  } = useServiceDimensions(
    isInfrastructure ? null : serviceName, // Skip dimensions fetch for infrastructure
  );
  const {
    dependencies,
    loading: loadingDeps,
    error: errorDeps,
  } = useServiceDependencies(serviceName);

  const isLoading = isInfrastructure ? loadingDeps : loadingDims || loadingDeps;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent-cyan)]" />
            <span className="text-sm text-[var(--color-text-muted)]">
              Loading configuration...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show errors if both calls failed
  if (
    (errorDims && errorDeps) ||
    (!isInfrastructure && errorDims && !dependencies)
  ) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center gap-3 text-[var(--color-accent-amber)]">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Could not load configuration</p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                {errorDims || errorDeps}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Service Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl font-mono">{serviceName}</CardTitle>
              {dependencies?.description && (
                <CardDescription className="mt-1">
                  {dependencies.description}
                </CardDescription>
              )}
            </div>
            {!isInfrastructure && (
              <Badge variant="outline" className="font-mono text-xs">
                {dimensions?.dimensions.length || 0} dimensions
              </Badge>
            )}
            {isInfrastructure && (
              <Badge
                variant="outline"
                className="font-mono text-xs text-[var(--color-accent-pink)] border-[var(--color-accent-pink)]"
              >
                Infrastructure
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="dependencies" className="w-full">
        <TabsList
          variant="pill"
          className={`grid w-full ${isInfrastructure ? "grid-cols-1" : "grid-cols-2"}`}
        >
          {!isInfrastructure && (
            <TabsTrigger value="dimensions">Sharding Dimensions</TabsTrigger>
          )}
          <TabsTrigger value="dependencies">
            <GitFork className="h-4 w-4 mr-1.5" />
            Dependency Graph
          </TabsTrigger>
        </TabsList>

        {!isInfrastructure && (
          <TabsContent value="dimensions" className="mt-4">
            <DimensionsPanel dimensions={dimensions} />
          </TabsContent>
        )}

        <TabsContent value="dependencies" className="mt-4">
          <DependenciesPanel
            dependencies={dependencies}
            currentService={serviceName}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DimensionsPanel({
  dimensions,
}: {
  dimensions: ReturnType<typeof useServiceDimensions>["dimensions"];
}) {
  if (!dimensions) return null;

  const getDimensionIcon = (type: string) => {
    switch (type) {
      case "date_range":
        return Calendar;
      case "hierarchical":
        return ArrowDown;
      case "gcs_dynamic":
        return Cloud;
      default:
        return List;
    }
  };

  const getDimensionBadgeVariant = (type: string): BadgeProps["variant"] => {
    switch (type) {
      case "fixed":
        return "cefi";
      case "hierarchical":
        return "tradfi";
      case "date_range":
        return "defi";
      case "gcs_dynamic":
        return "warning";
      default:
        return "default";
    }
  };

  return (
    <div className="space-y-3">
      {dimensions.dimensions.map((dim) => {
        const Icon = getDimensionIcon(dim.type);
        return (
          <Card key={dim.name}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[var(--color-bg-tertiary)]">
                  <Icon className="h-4 w-4 text-[var(--color-text-tertiary)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-[var(--color-text-primary)]">
                      {dim.name}
                    </span>
                    <Badge variant={getDimensionBadgeVariant(dim.type)}>
                      {dim.type}
                    </Badge>
                    {dim.granularity && (
                      <Badge variant="outline">{dim.granularity}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    {dim.description}
                  </p>

                  {/* Show values for fixed dimensions */}
                  {dim.type === "fixed" && dim.values && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {dim.values.map((val) => (
                        <span
                          key={val}
                          className="px-2 py-0.5 text-xs font-mono bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] rounded border border-[var(--color-border-subtle)]"
                        >
                          {val}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Show hierarchical relationship */}
                  {dim.type === "hierarchical" && dim.parent && (
                    <div className="mt-3 p-2 bg-[var(--color-bg-tertiary)] rounded text-xs">
                      <span className="text-[var(--color-text-muted)]">
                        Depends on:{" "}
                      </span>
                      <span className="font-mono text-[var(--color-accent-purple)]">
                        {dim.parent}
                      </span>
                    </div>
                  )}

                  {/* Dynamic config warning */}
                  {dim.type === "gcs_dynamic" && (
                    <div className="mt-3 flex items-center gap-2 p-2 status-warning rounded">
                      <Info className="h-4 w-4 text-[var(--color-accent-amber)]" />
                      <span className="text-xs text-[var(--color-accent-amber)]">
                        Values loaded from GCS at runtime
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* CLI Args Reference */}
      {dimensions.cli_args && Object.keys(dimensions.cli_args).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">CLI Arguments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-xs space-y-1">
              {Object.entries(dimensions.cli_args).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <span className="text-[var(--color-text-muted)]">{key}:</span>
                  <span className="text-[var(--color-accent-cyan)]">
                    {value || "(date params)"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Layer assignment for vertical positioning
const LAYER_ORDER = [
  ["instruments-service", "corporate-actions", "features-calendar-service"],
  ["market-tick-data-handler"],
  ["market-data-processing-service"],
  [
    "features-delta-one-service",
    "features-volatility-service",
    "features-onchain-service",
  ],
  ["ml-training-service", "ml-inference-service"],
  ["strategy-service"],
  ["execution-services"],
];

const LAYER_COLORS: Record<string, string> = {
  "instruments-service": "var(--color-accent-cyan)",
  "corporate-actions": "var(--color-accent-cyan)",
  "features-calendar-service": "var(--color-accent-purple)",
  "market-tick-data-handler": "var(--color-accent-blue)",
  "market-data-processing-service": "var(--color-accent-blue)",
  "features-delta-one-service": "var(--color-accent-purple)",
  "features-volatility-service": "var(--color-accent-purple)",
  "features-onchain-service": "var(--color-accent-purple)",
  "ml-training-service": "var(--color-accent-amber)",
  "ml-inference-service": "var(--color-accent-amber)",
  "strategy-service": "var(--color-accent-green)",
  "execution-services": "var(--color-accent-green)",
};

interface DependenciesPanelProps {
  dependencies: DependenciesResponse | null;
  currentService: string;
}

function DependenciesPanel({
  dependencies,
  currentService,
}: DependenciesPanelProps) {
  if (!dependencies) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            No dependency information available for this service.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* DAG Visualization */}
      {dependencies.dag && (
        <DependencyDag
          dag={dependencies.dag}
          currentService={currentService}
          upstream={(dependencies.upstream ?? []).map((u) => u.service)}
          downstream={dependencies.downstream_dependents}
        />
      )}

      {/* Upstream Dependencies Detail */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-[var(--color-accent-amber)]" />
            <CardTitle className="text-sm">Upstream Dependencies</CardTitle>
          </div>
          <CardDescription>
            Services that must run before this one
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(dependencies.upstream ?? []).length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              No upstream dependencies (root service)
            </p>
          ) : (
            <div className="space-y-2">
              {(dependencies.upstream ?? []).map((dep) => (
                <div
                  key={dep.service}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border",
                    dep.required
                      ? "status-error"
                      : "border-[var(--color-border-subtle)] bg-[var(--color-bg-tertiary)]",
                  )}
                >
                  {dep.required && (
                    <AlertTriangle className="h-4 w-4 text-[var(--color-accent-red)] shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-[var(--color-text-primary)]">
                        {dep.service}
                      </span>
                      {dep.required && <Badge variant="error">Required</Badge>}
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                      {dep.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Downstream Dependents */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <ArrowDown className="h-4 w-4 text-[var(--color-accent-green)]" />
            <CardTitle className="text-sm">Downstream Dependents</CardTitle>
          </div>
          <CardDescription>Services that depend on this one</CardDescription>
        </CardHeader>
        <CardContent>
          {(dependencies.downstream_dependents ?? []).length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">
              No downstream dependents (end of pipeline)
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(dependencies.downstream_dependents ?? []).map((service) => (
                <span
                  key={service}
                  className="px-2.5 py-1 text-sm font-mono bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] rounded border border-[var(--color-border-subtle)]"
                >
                  {service}
                </span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Outputs */}
      {(dependencies.outputs ?? []).length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Outputs</CardTitle>
            <CardDescription>Data produced by this service</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(dependencies.outputs ?? []).map((output) => (
                <div
                  key={output.name}
                  className="p-3 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-subtle)]"
                >
                  <span className="font-mono text-sm text-[var(--color-accent-cyan)]">
                    {output.name}
                  </span>
                  <div className="mt-2 text-xs font-mono text-[var(--color-text-muted)] break-all">
                    {output.bucket_template}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============ DAG Visualization ============

interface DependencyDagProps {
  dag: DagData;
  currentService: string;
  upstream: string[];
  downstream: string[];
}

function DependencyDag({
  dag,
  currentService,
  upstream,
  downstream,
}: DependencyDagProps) {
  const dagLayout = useMemo(() => {
    // Group nodes into layers
    const layers: string[][] = [];
    const nodeToLayer: Record<string, number> = {};

    // Use predefined layer order for consistent layout
    for (let i = 0; i < LAYER_ORDER.length; i++) {
      const layerNodes = LAYER_ORDER[i].filter((n) => dag.nodes.includes(n));
      if (layerNodes.length > 0) {
        layers.push(layerNodes);
        layerNodes.forEach((n) => {
          nodeToLayer[n] = layers.length - 1;
        });
      }
    }

    // Add any nodes not in LAYER_ORDER
    const unmapped = dag.nodes.filter((n) => !(n in nodeToLayer));
    if (unmapped.length > 0) {
      layers.push(unmapped);
      unmapped.forEach((n) => {
        nodeToLayer[n] = layers.length - 1;
      });
    }

    // Calculate positions
    const nodeWidth = 180;
    const nodeHeight = 32;
    const layerGapY = 60;
    const nodeGapX = 20;
    const paddingX = 20;
    const paddingY = 20;

    const positions: Record<string, { x: number; y: number }> = {};
    let maxWidth = 0;

    layers.forEach((layer, layerIdx) => {
      const totalWidth =
        layer.length * nodeWidth + (layer.length - 1) * nodeGapX;
      if (totalWidth > maxWidth) maxWidth = totalWidth;

      layer.forEach((node, nodeIdx) => {
        const x = paddingX + nodeIdx * (nodeWidth + nodeGapX) + nodeWidth / 2;
        const y =
          paddingY + layerIdx * (nodeHeight + layerGapY) + nodeHeight / 2;
        positions[node] = { x, y };
      });
    });

    // Center layers horizontally
    const svgWidth = maxWidth + paddingX * 2;
    layers.forEach((layer) => {
      const totalWidth =
        layer.length * nodeWidth + (layer.length - 1) * nodeGapX;
      const offset = (svgWidth - totalWidth) / 2 - paddingX;
      layer.forEach((node) => {
        positions[node].x += offset;
      });
    });

    const svgHeight =
      layers.length * (nodeHeight + layerGapY) - layerGapY + paddingY * 2;

    return { positions, svgWidth, svgHeight, nodeWidth, nodeHeight };
  }, [dag]);

  const { positions, svgWidth, svgHeight, nodeWidth, nodeHeight } = dagLayout;

  // Classify nodes
  const isUpstream = (n: string) => upstream.includes(n);
  const isDownstream = (n: string) => downstream.includes(n);
  const isCurrent = (n: string) => n === currentService;
  const isRelevant = (n: string) =>
    isCurrent(n) || isUpstream(n) || isDownstream(n);

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <GitFork className="h-4 w-4 text-[var(--color-accent-cyan)]" />
          <CardTitle className="text-sm">Pipeline Dependency Graph</CardTitle>
        </div>
        <CardDescription>
          Data flow between services. Highlighted nodes are directly related to{" "}
          {currentService}.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-2">
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-3 px-2 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-[var(--color-accent-cyan)] bg-[var(--color-accent-cyan)]/20" />
            <span className="text-[var(--color-text-muted)]">
              Current service
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-[var(--color-accent-amber)] bg-[var(--color-accent-amber)]/15" />
            <span className="text-[var(--color-text-muted)]">
              Upstream dependency
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded border-2 border-[var(--color-accent-green)] bg-[var(--color-accent-green)]/15" />
            <span className="text-[var(--color-text-muted)]">
              Downstream dependent
            </span>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border-subtle)]">
          <svg
            width={svgWidth}
            height={svgHeight}
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="mx-auto"
          >
            <defs>
              <marker
                id="arrowhead"
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 8 3, 0 6"
                  fill="var(--color-text-muted)"
                  fillOpacity="0.5"
                />
              </marker>
              <marker
                id="arrowhead-highlight"
                markerWidth="8"
                markerHeight="6"
                refX="8"
                refY="3"
                orient="auto"
              >
                <polygon
                  points="0 0, 8 3, 0 6"
                  fill="var(--color-accent-cyan)"
                  fillOpacity="0.8"
                />
              </marker>
            </defs>

            {/* Edges */}
            {dag.edges.map((edge, i) => {
              const from = positions[edge.from];
              const to = positions[edge.to];
              if (!from || !to) return null;

              const highlighted =
                (isCurrent(edge.from) && isDownstream(edge.to)) ||
                (isCurrent(edge.to) && isUpstream(edge.from)) ||
                (isUpstream(edge.from) && isCurrent(edge.to)) ||
                (isDownstream(edge.to) && isCurrent(edge.from));

              const y1 = from.y + nodeHeight / 2;
              const y2 = to.y - nodeHeight / 2;
              const midY = (y1 + y2) / 2;

              return (
                <path
                  key={`edge-${i}`}
                  d={`M ${from.x} ${y1} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${y2}`}
                  fill="none"
                  stroke={
                    highlighted
                      ? "var(--color-accent-cyan)"
                      : "var(--color-text-muted)"
                  }
                  strokeWidth={highlighted ? 2 : 1}
                  strokeOpacity={highlighted ? 0.8 : 0.2}
                  markerEnd={
                    highlighted
                      ? "url(#arrowhead-highlight)"
                      : "url(#arrowhead)"
                  }
                  strokeDasharray={edge.required ? undefined : "4 3"}
                />
              );
            })}

            {/* Nodes */}
            {dag.nodes.map((node) => {
              const pos = positions[node];
              if (!pos) return null;

              const current = isCurrent(node);
              const up = isUpstream(node);
              const down = isDownstream(node);
              const relevant = isRelevant(node);

              let borderColor = "var(--color-border-subtle)";
              let bgColor = "var(--color-bg-primary)";
              let textColor = "var(--color-text-muted)";
              let strokeWidth = 1;

              if (current) {
                borderColor = "var(--color-accent-cyan)";
                bgColor = "var(--color-accent-cyan)";
                textColor = "var(--color-accent-cyan)";
                strokeWidth = 2.5;
              } else if (up) {
                borderColor = "var(--color-accent-amber)";
                bgColor = "var(--color-accent-amber)";
                textColor = "var(--color-accent-amber)";
                strokeWidth = 2;
              } else if (down) {
                borderColor = "var(--color-accent-green)";
                bgColor = "var(--color-accent-green)";
                textColor = "var(--color-accent-green)";
                strokeWidth = 2;
              }

              // Short label
              const label = node
                .replace("-service", "")
                .replace("features-", "feat-");

              return (
                <g key={node} opacity={relevant ? 1 : 0.35}>
                  <rect
                    x={pos.x - nodeWidth / 2}
                    y={pos.y - nodeHeight / 2}
                    width={nodeWidth}
                    height={nodeHeight}
                    rx={6}
                    fill={bgColor}
                    stroke={borderColor}
                    strokeWidth={strokeWidth}
                  />
                  {/* Layer color accent line */}
                  {LAYER_COLORS[node] && (
                    <rect
                      x={pos.x - nodeWidth / 2}
                      y={pos.y - nodeHeight / 2}
                      width={3}
                      height={nodeHeight}
                      rx={1}
                      fill={LAYER_COLORS[node]}
                      opacity={relevant ? 1 : 0.4}
                    />
                  )}
                  <text
                    x={pos.x + 2}
                    y={pos.y + 1}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={textColor}
                    fontSize={10.5}
                    fontFamily="ui-monospace, monospace"
                    fontWeight={current ? 700 : 500}
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
