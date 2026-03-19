import { useState } from "react";
import {
  Card,
  CardContent,
  Badge,
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@unified-trading/ui-kit";
import { RefreshCw } from "lucide-react";

const SERVICES = [
  "ml-inference-service",
  "strategy-service",
  "execution-service",
  "features-delta-one-service",
  "features-volatility-service",
  "instruments-service",
  "market-tick-data-service",
];

const MOCK_EVENTS = [
  {
    id: "evt-001",
    service: "ml-inference-service",
    event_type: "BATCH_COMPLETED",
    timestamp: "2026-03-10T06:42:17Z",
    correlation_id: "batch-ml-2026-03-10",
    error: false,
    message: "Batch inference completed: 1,248 signals generated",
  },
  {
    id: "evt-002",
    service: "features-delta-one-service",
    event_type: "BATCH_FAILED",
    timestamp: "2026-03-10T07:22:05Z",
    correlation_id: "batch-feat-2026-03-10",
    error: true,
    message: "Quota exceeded: VM instance quota in asia-northeast1-c",
  },
  {
    id: "evt-003",
    service: "strategy-service",
    event_type: "BATCH_STARTED",
    timestamp: "2026-03-10T07:30:00Z",
    correlation_id: "batch-strat-2026-03-10",
    error: false,
    message: "Strategy batch started: date=2026-03-10, category=all",
  },
  {
    id: "evt-004",
    service: "execution-service",
    event_type: "CONFIG_LOADED",
    timestamp: "2026-03-10T09:00:01Z",
    correlation_id: "exec-live-2026-03-10",
    error: false,
    message: "Domain config reloaded from GCS: v2026-03-10",
  },
  {
    id: "evt-005",
    service: "instruments-service",
    event_type: "BATCH_COMPLETED",
    timestamp: "2026-03-10T02:45:00Z",
    correlation_id: "batch-inst-2026-03-10",
    error: false,
    message: "Daily instrument sync: 3,421 instruments updated",
  },
  {
    id: "evt-006",
    service: "market-tick-data-service",
    event_type: "SHARD_FAILED",
    timestamp: "2026-03-10T09:45:22Z",
    correlation_id: "tick-shard-0042",
    error: true,
    message: "Shard 42 failed: upstream WebSocket disconnect",
  },
  {
    id: "evt-007",
    service: "ml-inference-service",
    event_type: "HEALTH_CHECK",
    timestamp: "2026-03-10T10:00:00Z",
    correlation_id: "health-ml-2026-03-10",
    error: false,
    message: "Health check passed: model loaded, features available",
  },
  {
    id: "evt-008",
    service: "features-volatility-service",
    event_type: "BATCH_COMPLETED",
    timestamp: "2026-03-10T09:15:00Z",
    correlation_id: "batch-vol-2026-03-10",
    error: false,
    message: "Volatility features computed: 96 shards complete",
  },
];

const eventTypeVariant = (
  t: string,
  error: boolean,
): "error" | "success" | "running" | "default" => {
  if (error) return "error";
  if (t.endsWith("COMPLETED")) return "success";
  if (t.endsWith("STARTED")) return "running";
  return "default";
};

export function AuditTrailPage() {
  const [serviceFilter, setServiceFilter] = useState<string>("all");
  const [errorOnly, setErrorOnly] = useState(false);

  const filtered = MOCK_EVENTS.filter(
    (e) => serviceFilter === "all" || e.service === serviceFilter,
  ).filter((e) => !errorOnly || e.error);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title text-base font-semibold text-[var(--color-text-primary)]">
            Audit Trail
          </h1>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            System-wide event log — {MOCK_EVENTS.length} events today
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold font-mono text-[var(--color-text-primary)]">
              {MOCK_EVENTS.length}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
              Total Events
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold font-mono text-[var(--color-error)]">
              {MOCK_EVENTS.filter((e) => e.error).length}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
              Errors
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold font-mono text-[var(--color-text-primary)]">
              {SERVICES.length}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
              Services
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <div className="field-group">
          <label htmlFor="service-filter" className="field-label">
            Service
          </label>
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger id="service-filter" className="text-sm w-52">
              <SelectValue placeholder="All Services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Services</SelectItem>
              {SERVICES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={errorOnly}
            onChange={(e) => setErrorOnly(e.target.checked)}
          />
          <span className="toggle-track">
            <span className="toggle-knob" />
          </span>
          <span className="toggle-label">Errors Only</span>
        </label>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header-cell">Time</th>
                <th className="table-header-cell">Service</th>
                <th className="table-header-cell">Event</th>
                <th className="table-header-cell">Correlation ID</th>
                <th className="table-header-cell">Message</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => (
                <tr key={event.id} className="table-row">
                  <td className="table-cell font-mono text-xs text-[var(--color-text-muted)]">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="table-cell font-mono text-xs">
                    {event.service}
                  </td>
                  <td className="table-cell">
                    <Badge
                      variant={eventTypeVariant(event.event_type, event.error)}
                    >
                      {event.event_type}
                    </Badge>
                  </td>
                  <td className="table-cell font-mono text-xs text-[var(--color-text-muted)]">
                    {event.correlation_id}
                  </td>
                  <td className="table-cell text-xs text-[var(--color-text-secondary)] max-w-xs truncate">
                    {event.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
