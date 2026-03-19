import { useCallback, useEffect, useRef, useState } from "react";
import {
  Rocket,
  Server,
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Play,
  Square,
  RotateCcw,
  Power,
  StopCircle,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { Input } from "./input";
import { Label } from "./label";
import { Checkbox } from "./checkbox";

type DeploymentMode = "batch" | "live";
type DeploymentStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

interface ShardBreakdown {
  completed: number;
  running: number;
  failed: number;
  pending: number;
}

interface DeploymentRecord {
  id: string;
  service: string;
  mode: DeploymentMode;
  status: DeploymentStatus;
  shards: number;
  created: string;
}

interface RequirementsEstimate {
  shards: number;
  cpuHours: number;
  estimatedCost: number;
}

interface DeploymentPanelProps {
  deploymentApiUrl?: string;
  defaultService?: string;
  className?: string;
}

const SERVICES = [
  "instruments-service",
  "market-tick-data-service",
  "features-delta-one-service",
  "execution-service",
  "strategy-service",
  "risk-service",
  "alerting-service",
  "settlement-service",
  "ml-training-service",
  "ml-inference-service",
  "deployment-service",
  "config-service",
] as const;

const CATEGORIES = ["crypto", "equity", "fx", "sports"] as const;
const VENUES = ["Binance", "OKX", "Bybit", "NYSE", "CME"] as const;
const REGIONS = ["asia-northeast1", "us-central1", "europe-west1"] as const;

const ALL_STATUSES: DeploymentStatus[] = [
  "running",
  "completed",
  "failed",
  "pending",
  "cancelled",
];
const PAGE_SIZE = 10;

const MOCK_DEPLOYMENTS: DeploymentRecord[] = [
  {
    id: "dep-a3f812c9",
    service: "execution-service",
    mode: "live",
    status: "completed",
    shards: 1,
    created: "2026-03-15T08:12:00Z",
  },
  {
    id: "dep-7bc04e11",
    service: "market-tick-data-service",
    mode: "batch",
    status: "running",
    shards: 48,
    created: "2026-03-15T07:45:00Z",
  },
  {
    id: "dep-e2d9f4a0",
    service: "features-delta-one-service",
    mode: "batch",
    status: "failed",
    shards: 24,
    created: "2026-03-14T22:30:00Z",
  },
  {
    id: "dep-5f1a82b3",
    service: "strategy-service",
    mode: "live",
    status: "completed",
    shards: 1,
    created: "2026-03-14T18:00:00Z",
  },
  {
    id: "dep-c90d11ef",
    service: "risk-service",
    mode: "live",
    status: "cancelled",
    shards: 1,
    created: "2026-03-14T14:20:00Z",
  },
  {
    id: "dep-8a4e21ff",
    service: "alerting-service",
    mode: "live",
    status: "completed",
    shards: 1,
    created: "2026-03-14T10:00:00Z",
  },
  {
    id: "dep-3b72c1a4",
    service: "instruments-service",
    mode: "batch",
    status: "completed",
    shards: 36,
    created: "2026-03-14T06:00:00Z",
  },
  {
    id: "dep-f1e09b23",
    service: "ml-training-service",
    mode: "batch",
    status: "running",
    shards: 12,
    created: "2026-03-13T22:00:00Z",
  },
  {
    id: "dep-d4a8e7c2",
    service: "settlement-service",
    mode: "live",
    status: "failed",
    shards: 1,
    created: "2026-03-13T16:00:00Z",
  },
  {
    id: "dep-92b1f4d8",
    service: "config-service",
    mode: "live",
    status: "completed",
    shards: 1,
    created: "2026-03-13T12:00:00Z",
  },
  {
    id: "dep-1c7a3e56",
    service: "execution-service",
    mode: "batch",
    status: "completed",
    shards: 64,
    created: "2026-03-13T08:00:00Z",
  },
  {
    id: "dep-b5d29f01",
    service: "market-tick-data-service",
    mode: "batch",
    status: "completed",
    shards: 96,
    created: "2026-03-12T22:00:00Z",
  },
  {
    id: "dep-6e8c4a77",
    service: "features-delta-one-service",
    mode: "batch",
    status: "failed",
    shards: 48,
    created: "2026-03-12T14:00:00Z",
  },
  {
    id: "dep-a2f10b89",
    service: "strategy-service",
    mode: "batch",
    status: "completed",
    shards: 24,
    created: "2026-03-12T08:00:00Z",
  },
  {
    id: "dep-7d3e5c12",
    service: "risk-service",
    mode: "batch",
    status: "completed",
    shards: 16,
    created: "2026-03-11T22:00:00Z",
  },
  {
    id: "dep-4f9a8d34",
    service: "ml-inference-service",
    mode: "live",
    status: "completed",
    shards: 1,
    created: "2026-03-11T14:00:00Z",
  },
  {
    id: "dep-c1b72e56",
    service: "instruments-service",
    mode: "batch",
    status: "pending",
    shards: 72,
    created: "2026-03-11T08:00:00Z",
  },
  {
    id: "dep-89d4f1a7",
    service: "execution-service",
    mode: "live",
    status: "completed",
    shards: 1,
    created: "2026-03-10T22:00:00Z",
  },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function statusVariant(
  s: DeploymentStatus,
): "success" | "running" | "error" | "pending" | "warning" {
  return (
    {
      completed: "success",
      running: "running",
      failed: "error",
      pending: "pending",
      cancelled: "warning",
    } as const
  )[s];
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="w-full h-2 rounded-full bg-[var(--color-bg-tertiary)] border border-[var(--color-border-default)] overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{
          width: `${Math.min(100, Math.max(0, percent))}%`,
          backgroundColor:
            percent >= 100 ? "var(--color-success)" : "var(--color-accent)",
        }}
      />
    </div>
  );
}

function CheckboxField({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
      />
      <Label htmlFor={id} className="text-xs cursor-pointer">
        {label}
      </Label>
    </div>
  );
}

export function DeploymentPanel({
  defaultService,
  className,
}: DeploymentPanelProps) {
  const [selectedService, setSelectedService] = useState(
    defaultService ?? "__all__",
  );
  const [mode, setMode] = useState<DeploymentMode>("batch");

  // Service operations state
  const [serviceOp, setServiceOp] = useState<string | null>(null);
  const [serviceOpResult, setServiceOpResult] = useState<{
    action: string;
    success: boolean;
  } | null>(null);

  // Batch state
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-03-15");
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(
    new Set(["crypto"]),
  );
  const [selectedVenues, setSelectedVenues] = useState<Set<string>>(
    new Set(["Binance"]),
  );
  const [dryRun, setDryRun] = useState(true);
  const [requirements, setRequirements] = useState<RequirementsEstimate | null>(
    null,
  );

  // Live state
  const [imageTag, setImageTag] = useState("");
  const [trafficSplit, setTrafficSplit] = useState(100);
  const [healthGateTimeout, setHealthGateTimeout] = useState(300);
  const [rollbackOnFail, setRollbackOnFail] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<string>(REGIONS[0]);

  // Deploy progress
  const [deploying, setDeploying] = useState(false);
  const [deployProgress, setDeployProgress] = useState(0);
  const [deployComplete, setDeployComplete] = useState(false);
  const [deployFailed, setDeployFailed] = useState(false);
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [shardBreakdown, setShardBreakdown] = useState<ShardBreakdown>({
    completed: 0,
    running: 0,
    failed: 0,
    pending: 0,
  });
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [allDeployments, setAllDeployments] =
    useState<DeploymentRecord[]>(MOCK_DEPLOYMENTS);

  // Table filters + pagination
  const [tableServiceFilter, setTableServiceFilter] =
    useState<string>("__all__");
  const [tableStatusFilter, setTableStatusFilter] = useState<string>("__all__");
  const [tablePage, setTablePage] = useState(0);

  useEffect(
    () => () => {
      if (progressRef.current) clearInterval(progressRef.current);
    },
    [],
  );

  // Service operations (mock)
  const handleServiceOp = useCallback((action: string) => {
    setServiceOp(action);
    setServiceOpResult(null);
    setTimeout(() => {
      setServiceOp(null);
      setServiceOpResult({ action, success: true });
      setTimeout(() => setServiceOpResult(null), 3000);
    }, 1500);
  }, []);

  const toggleCategory = useCallback((cat: string) => {
    setSelectedCategories((prev) => {
      const n = new Set(prev);
      n.has(cat) ? n.delete(cat) : n.add(cat);
      return n;
    });
  }, []);
  const toggleVenue = useCallback((venue: string) => {
    setSelectedVenues((prev) => {
      const n = new Set(prev);
      n.has(venue) ? n.delete(venue) : n.add(venue);
      return n;
    });
  }, []);

  const handleCheckRequirements = useCallback(() => {
    const shards =
      Math.max(1, selectedCategories.size) *
      Math.max(1, selectedVenues.size) *
      8;
    setRequirements({
      shards,
      cpuHours: parseFloat((shards * 0.05).toFixed(1)),
      estimatedCost: parseFloat((shards * 0.067).toFixed(2)),
    });
  }, [selectedCategories, selectedVenues]);

  const handleDeploy = useCallback(() => {
    const totalShards = mode === "batch" ? (requirements?.shards ?? 48) : 1;
    const newId = `dep-${Math.random().toString(36).slice(2, 10)}`;
    setDeploying(true);
    setDeployProgress(0);
    setDeployComplete(false);
    setDeployFailed(false);
    setDeploymentId(newId);
    setShardBreakdown({
      completed: 0,
      running: totalShards,
      failed: 0,
      pending: 0,
    });
    let progress = 0;
    progressRef.current = setInterval(() => {
      progress += 2.5;
      if (progress >= 100) {
        progress = 100;
        if (progressRef.current) {
          clearInterval(progressRef.current);
          progressRef.current = null;
        }
        setDeployProgress(100);
        setDeploying(false);
        setDeployComplete(true);
        setShardBreakdown({
          completed: totalShards,
          running: 0,
          failed: 0,
          pending: 0,
        });
        setAllDeployments((prev) => [
          {
            id: newId,
            service:
              selectedService === "__all__" ? SERVICES[0] : selectedService,
            mode,
            status: "completed",
            shards: totalShards,
            created: new Date().toISOString(),
          },
          ...prev,
        ]);
      } else {
        setDeployProgress(Math.round(progress));
        const c = Math.floor((progress / 100) * totalShards);
        const r = Math.min(totalShards - c, Math.ceil(totalShards * 0.2));
        setShardBreakdown({
          completed: c,
          running: r,
          failed: 0,
          pending: totalShards - c - r,
        });
      }
    }, 100);
  }, [mode, requirements, selectedService]);

  const handleCancel = useCallback(() => {
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
    setDeploying(false);
    setDeployFailed(true);
    setShardBreakdown((p) => ({
      completed: p.completed,
      running: 0,
      failed: 0,
      pending: 0,
    }));
  }, []);

  const canDeploy =
    !deploying &&
    (mode === "batch" ? requirements !== null : imageTag.trim().length > 0);
  const showStatus = deploying || deployComplete || deployFailed;
  const currentStatus: DeploymentStatus = deploying
    ? "running"
    : deployComplete
      ? "completed"
      : "failed";

  useEffect(() => {
    setRequirements(null);
  }, [selectedCategories, selectedVenues, startDate, endDate, selectedService]);

  // Filtered + paginated deployments
  const filteredDeployments = allDeployments.filter((d) => {
    if (tableServiceFilter !== "__all__" && d.service !== tableServiceFilter)
      return false;
    if (tableStatusFilter !== "__all__" && d.status !== tableStatusFilter)
      return false;
    return true;
  });
  const totalPages = Math.max(
    1,
    Math.ceil(filteredDeployments.length / PAGE_SIZE),
  );
  const safePage = Math.min(tablePage, totalPages - 1);
  const paginatedDeployments = filteredDeployments.slice(
    safePage * PAGE_SIZE,
    (safePage + 1) * PAGE_SIZE,
  );

  const selectClass =
    "flex h-8 w-full rounded-md border border-[var(--color-border-default)] bg-[var(--color-bg-tertiary)] px-3 py-1.5 text-sm text-[var(--color-text-primary)]";

  return (
    <div className={cn("space-y-6", className)}>
      {/* ── Section 1: Service Selector + Operations ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-4 w-4 text-[var(--color-accent)]" />
            Service Operations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4 flex-wrap">
            <div className="flex flex-col gap-1.5 min-w-[220px]">
              <Label>Service</Label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className={selectClass}
              >
                <option value="__all__">All Services</option>
                {SERVICES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={serviceOp !== null}
              onClick={() => handleServiceOp("start")}
            >
              {serviceOp === "start" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              Start
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={serviceOp !== null}
              onClick={() => handleServiceOp("stop")}
            >
              {serviceOp === "stop" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <StopCircle className="h-3.5 w-3.5" />
              )}
              Stop
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={serviceOp !== null}
              onClick={() => handleServiceOp("restart")}
            >
              {serviceOp === "restart" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Restart
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={serviceOp !== null}
              onClick={() => handleServiceOp("force-stop")}
            >
              {serviceOp === "force-stop" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Power className="h-3.5 w-3.5" />
              )}
              Force Stop
            </Button>
            {serviceOpResult && (
              <div
                className={`flex items-center gap-1.5 text-xs ${serviceOpResult.success ? "text-[var(--color-success)]" : "text-[var(--color-error)]"}`}
              >
                {serviceOpResult.success ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : (
                  <XCircle className="h-3.5 w-3.5" />
                )}
                {selectedService}: {serviceOpResult.action}{" "}
                {serviceOpResult.success ? "succeeded" : "failed"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Section 2: Deploy ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-4 w-4 text-[var(--color-accent)]" />
            Deploy Service
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mode toggle */}
          <div className="flex items-center gap-3">
            <Label className="text-xs">Mode</Label>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={mode === "batch" ? "default" : "outline"}
                onClick={() => setMode("batch")}
              >
                Batch
              </Button>
              <Button
                size="sm"
                variant={mode === "live" ? "default" : "outline"}
                onClick={() => setMode("live")}
              >
                Live
              </Button>
            </div>
          </div>

          {/* Batch fields */}
          {mode === "batch" && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <CheckboxField
                      key={c}
                      id={`dp-c-${c}`}
                      label={c}
                      checked={selectedCategories.has(c)}
                      onCheckedChange={() => toggleCategory(c)}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Venues</Label>
                <div className="flex flex-wrap gap-2">
                  {VENUES.map((v) => (
                    <CheckboxField
                      key={v}
                      id={`dp-v-${v}`}
                      label={v}
                      checked={selectedVenues.has(v)}
                      onCheckedChange={() => toggleVenue(v)}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Live fields */}
          {mode === "live" && (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="flex flex-col gap-1.5">
                <Label>Image Tag</Label>
                <Input
                  placeholder="v0.3.12"
                  value={imageTag}
                  onChange={(e) => setImageTag(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Traffic Split %</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={trafficSplit}
                  onChange={(e) =>
                    setTrafficSplit(parseInt(e.target.value, 10) || 0)
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Health Gate (s)</Label>
                <Input
                  type="number"
                  min={0}
                  value={healthGateTimeout}
                  onChange={(e) =>
                    setHealthGateTimeout(parseInt(e.target.value, 10) || 0)
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Region</Label>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className={selectClass}
                >
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5 justify-end">
                <CheckboxField
                  id="dp-rb"
                  label="Rollback on Fail"
                  checked={rollbackOnFail}
                  onCheckedChange={setRollbackOnFail}
                />
              </div>
            </div>
          )}

          {/* Action row */}
          <div className="flex items-center gap-3">
            {mode === "batch" && (
              <>
                <CheckboxField
                  id="dp-dry"
                  label="Dry Run"
                  checked={dryRun}
                  onCheckedChange={setDryRun}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCheckRequirements}
                >
                  <RefreshCw className="h-3 w-3" /> Check Requirements
                </Button>
                {requirements && (
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {requirements.shards} shards
                    </span>{" "}
                    — ~{requirements.cpuHours} CPU hrs, $
                    {requirements.estimatedCost.toFixed(2)}
                  </span>
                )}
              </>
            )}
            <div className="flex-1" />
            <Button disabled={!canDeploy} onClick={handleDeploy}>
              {deploying ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4" />
              )}
              {deploying ? "Deploying..." : "Deploy"}
            </Button>
          </div>

          {/* Progress */}
          {showStatus && (
            <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[var(--color-text-muted)]">
                    {deploymentId}
                  </span>
                  <Badge variant={statusVariant(currentStatus)}>
                    {currentStatus}
                  </Badge>
                </div>
                {deploying && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleCancel}
                  >
                    <Square className="h-3 w-3" /> Cancel
                  </Button>
                )}
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                  <span>Progress</span>
                  <span className="font-mono">{deployProgress}%</span>
                </div>
                <ProgressBar percent={deployProgress} />
              </div>
              <div className="grid grid-cols-4 gap-2 text-xs text-center">
                <div>
                  <span className="font-mono font-semibold text-[var(--color-success)]">
                    {shardBreakdown.completed}
                  </span>
                  <br />
                  <span className="text-[var(--color-text-muted)]">
                    completed
                  </span>
                </div>
                <div>
                  <span className="font-mono font-semibold text-[var(--color-running)]">
                    {shardBreakdown.running}
                  </span>
                  <br />
                  <span className="text-[var(--color-text-muted)]">
                    running
                  </span>
                </div>
                <div>
                  <span className="font-mono font-semibold text-[var(--color-error)]">
                    {shardBreakdown.failed}
                  </span>
                  <br />
                  <span className="text-[var(--color-text-muted)]">failed</span>
                </div>
                <div>
                  <span className="font-mono font-semibold text-[var(--color-pending)]">
                    {shardBreakdown.pending}
                  </span>
                  <br />
                  <span className="text-[var(--color-text-muted)]">
                    pending
                  </span>
                </div>
              </div>
              {deployComplete && (
                <div className="flex items-center gap-2 text-xs text-[var(--color-success)]">
                  <CheckCircle className="h-3.5 w-3.5" /> Deployment completed
                </div>
              )}
              {deployFailed && (
                <div className="flex items-center gap-2 text-xs text-[var(--color-error)]">
                  <XCircle className="h-3.5 w-3.5" /> Deployment cancelled
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Section 3: Deployment History ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Deployment History</CardTitle>
            <span className="text-xs text-[var(--color-text-muted)]">
              {filteredDeployments.length} deployments
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters row */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase text-[var(--color-text-muted)]">
                Service
              </Label>
              <select
                value={tableServiceFilter}
                onChange={(e) => {
                  setTableServiceFilter(e.target.value);
                  setTablePage(0);
                }}
                className={cn(selectClass, "w-52")}
              >
                <option value="__all__">All Services</option>
                {SERVICES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[10px] uppercase text-[var(--color-text-muted)]">
                Status
              </Label>
              <select
                value={tableStatusFilter}
                onChange={(e) => {
                  setTableStatusFilter(e.target.value);
                  setTablePage(0);
                }}
                className={cn(selectClass, "w-36")}
              >
                <option value="__all__">All Statuses</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-lg border border-[var(--color-border-default)] overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="table-header-cell">ID</th>
                  <th className="table-header-cell">Service</th>
                  <th className="table-header-cell">Mode</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Shards</th>
                  <th className="table-header-cell">Created</th>
                  <th className="table-header-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDeployments.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="table-cell text-center text-[var(--color-text-muted)] py-6"
                    >
                      No deployments match filters
                    </td>
                  </tr>
                ) : (
                  paginatedDeployments.map((dep) => (
                    <tr key={dep.id} className="table-row">
                      <td className="table-cell font-mono">{dep.id}</td>
                      <td className="table-cell">{dep.service}</td>
                      <td className="table-cell">
                        <Badge variant="info">{dep.mode}</Badge>
                      </td>
                      <td className="table-cell">
                        <Badge variant={statusVariant(dep.status)}>
                          {dep.status}
                        </Badge>
                      </td>
                      <td className="table-cell font-mono">{dep.shards}</td>
                      <td className="table-cell">{formatDate(dep.created)}</td>
                      <td className="table-cell">
                        <div className="flex items-center gap-1">
                          <Button size="sm" variant="ghost" title="Start">
                            <Play className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" title="Stop">
                            <StopCircle className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" title="Restart">
                            <RefreshCw className="h-3 w-3" />
                          </Button>
                          {dep.mode === "live" && (
                            <Button size="sm" variant="ghost" title="Rollback">
                              <RotateCcw className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-[var(--color-text-muted)]">
                Page {tablePage + 1} of {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={tablePage === 0}
                  onClick={() => setTablePage(0)}
                >
                  First
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={tablePage === 0}
                  onClick={() => setTablePage((p) => p - 1)}
                >
                  Prev
                </Button>
                {Array.from({ length: totalPages }, (_, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={tablePage === i ? "default" : "outline"}
                    onClick={() => setTablePage(i)}
                  >
                    {i + 1}
                  </Button>
                )).slice(Math.max(0, tablePage - 2), tablePage + 3)}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={tablePage >= totalPages - 1}
                  onClick={() => setTablePage((p) => p + 1)}
                >
                  Next
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={tablePage >= totalPages - 1}
                  onClick={() => setTablePage(totalPages - 1)}
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
