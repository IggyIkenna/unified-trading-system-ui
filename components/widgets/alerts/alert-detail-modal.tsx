"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, ArrowUpCircle, Bell, BookOpen, Check, CheckCircle2, XCircle } from "lucide-react";
import type { Alert, AlertSeverity, AlertStatus, AlertType } from "./alerts-data-context";

/**
 * SSOT for the per-AlertCode runbook deep-link.
 *
 * Resolves an `AlertType` (= AlertCode) to the canonical playbook file under
 * `codex/14-playbooks/alerting/`. Mirrors the file list in
 * `unified-trading-pm/plans/active/alerting_service_live_rules_2026_05_07.md`
 * Phase 6. Returned URL points at the GitHub blob view so it works regardless
 * of whether the operator has the PM repo cloned locally.
 *
 * When alerting-service `AlertRule.runbook_doc` lands (Phase 6 wiring), the
 * server-side payload will replace this client-side dispatch, but until then
 * the mapping is the SSOT.
 */
const RUNBOOK_DOCS: Partial<Record<AlertType, string>> = {
  HEALTH_FACTOR_CRITICAL: "defi_health_factor_critical.md",
  POSITION_LIQUIDATED: "kill_switch_defi_liquidation_risk.md",
  WEETH_DEPEG: "defi_weeth_depeg.md",
  AAVE_UTILIZATION_SPIKE: "defi_aave_utilization_spike.md",
  FUNDING_RATE_FLIP: "defi_funding_rate_flip.md",
  FEATURE_STALE: "defi_feature_stale.md",
  TX_SIMULATION_FAILED: "preflight_failed.md",
  RATE_DEVIATION: "defi_funding_rate_flip.md",
  RISK_CRITICAL: "kill_switch_portfolio_drawdown.md",
  RISK_WARNING: "service_degraded.md",
  EXPOSURE_BREACH: "kill_switch_portfolio_drawdown.md",
  MARGIN_WARNING: "margin_threshold_breach.md",
  LIQUIDATION_RISK: "kill_switch_defi_liquidation_risk.md",
  DRAWDOWN_LIMIT: "kill_switch_portfolio_drawdown.md",
  CONCENTRATION_LIMIT: "kill_switch_portfolio_drawdown.md",
  PRE_TRADE_REJECTION: "order_rejection_spike.md",
};

const RUNBOOK_BASE_URL = "https://github.com/IggyIkenna/unified-trading-pm/blob/main/codex/14-playbooks/alerting";

/** Returns the runbook URL for the given AlertCode, or null if no mapping exists. */
export function runbookUrlFor(alertType: AlertType): string | null {
  const file = RUNBOOK_DOCS[alertType];
  if (!file) return null;
  return `${RUNBOOK_BASE_URL}/${file}`;
}

function getSeverityIcon(severity: AlertSeverity) {
  switch (severity) {
    case "critical":
      return <XCircle className="size-4" />;
    case "high":
      return <AlertCircle className="size-4" />;
    case "medium":
      return <AlertTriangle className="size-4" />;
    default:
      return <Bell className="size-4" />;
  }
}

function getSeverityColor(severity: AlertSeverity) {
  switch (severity) {
    case "critical":
    case "high":
      return "text-status-critical bg-status-critical/10 border-status-critical";
    case "medium":
      return "text-status-warning bg-status-warning/10 border-status-warning";
    case "low":
      return "text-status-live bg-status-live/10 border-status-live";
    default:
      return "text-muted-foreground bg-muted/10 border-muted-foreground";
  }
}

function getStatusColor(status: AlertStatus) {
  switch (status) {
    case "active":
      return "text-status-critical";
    case "acknowledged":
      return "text-status-warning";
    case "resolved":
      return "text-status-live";
    default:
      return "text-muted-foreground";
  }
}

export interface AlertDetailModalProps {
  /** Active alert to render. When null the modal is closed. */
  alert: Alert | null;
  /** Modal open/close. Parent owns the open state. */
  open: boolean;
  /** Close callback (Escape, overlay-click, footer buttons). */
  onClose: () => void;
  /** Acknowledge action — disabled when batch mode or pending. */
  onAcknowledge?: (id: string) => void;
  /** Escalate action — disabled when alert is already critical. */
  onEscalate?: (alert: Alert) => void;
  /** Resolve action. */
  onResolve?: (id: string) => void;
  /** Disable all action buttons (batch mode). */
  isBatchMode?: boolean;
  /** In-flight mutation flags so we can disable while a request is open. */
  acknowledgePending?: boolean;
  escalatePending?: boolean;
  resolvePending?: boolean;
}

/**
 * Per-alert detail modal — opens from the DART top-bar Active Alerts panel.
 *
 * Shows code + severity + payload + runbook deep-link plus Ack / Escalate /
 * Resolve actions. Uses Radix Dialog; parent controls open state. See
 * `unified-trading-pm/plans/active/alerting_service_live_rules_2026_05_07.md`
 * Phase 5.
 */
export function AlertDetailModal({
  alert,
  open,
  onClose,
  onAcknowledge,
  onEscalate,
  onResolve,
  isBatchMode = false,
  acknowledgePending = false,
  escalatePending = false,
  resolvePending = false,
}: AlertDetailModalProps) {
  if (!alert) return null;

  const runbookUrl = runbookUrlFor(alert.alertType);
  const canAck = alert.status === "active";
  const canEscalate = alert.status === "active" && alert.severity !== "critical";
  const canResolve = alert.status === "active" || alert.status === "acknowledged";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg" data-testid="alert-detail-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getSeverityIcon(alert.severity)}
            <span>{alert.title}</span>
          </DialogTitle>
          <DialogDescription>{alert.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-1">Severity</div>
              <Badge variant="outline" className={cn("gap-1", getSeverityColor(alert.severity))}>
                {getSeverityIcon(alert.severity)}
                {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
              </Badge>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Status</div>
              <Badge variant="outline" className={cn("capitalize", getStatusColor(alert.status))}>
                {alert.status}
              </Badge>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Alert Code</div>
              <div className="text-sm font-mono" data-testid="alert-detail-code">
                {alert.alertType}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Entity</div>
              <div className="text-sm font-medium">{alert.entity || "-"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Source</div>
              <div className="text-sm font-medium">{alert.source}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">Time</div>
              <div className="text-sm font-mono">{alert.timestamp}</div>
            </div>
            {alert.value && alert.threshold && (
              <div className="col-span-2">
                <div className="text-xs text-muted-foreground mb-1">Value / Threshold</div>
                <div className="text-sm font-mono">
                  {alert.value} / {alert.threshold}
                </div>
              </div>
            )}
          </div>

          {alert.recommendedAction && (
            <Card className="bg-muted/30">
              <CardContent className="p-3">
                <div className="text-xs text-muted-foreground mb-1">Recommended Action</div>
                <div className="text-sm">{alert.recommendedAction}</div>
              </CardContent>
            </Card>
          )}

          {runbookUrl ? (
            <a
              href={runbookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
              data-testid="alert-detail-runbook-link"
            >
              <BookOpen className="size-4" />
              <span>View runbook playbook</span>
            </a>
          ) : (
            <div className="text-xs text-muted-foreground italic" data-testid="alert-detail-runbook-missing">
              No runbook registered for {alert.alertType}.
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1 border-t pt-3">
            {canAck && onAcknowledge && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={isBatchMode || acknowledgePending}
                onClick={() => {
                  onAcknowledge(alert.id);
                  onClose();
                }}
                data-testid="alert-detail-ack"
              >
                <Check className="size-4" />
                Acknowledge
              </Button>
            )}
            {canEscalate && onEscalate && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={isBatchMode || escalatePending}
                onClick={() => {
                  onEscalate(alert);
                  onClose();
                }}
                data-testid="alert-detail-escalate"
              >
                <ArrowUpCircle className="size-4" />
                Escalate
              </Button>
            )}
            {canResolve && onResolve && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={isBatchMode || resolvePending}
                onClick={() => {
                  onResolve(alert.id);
                  onClose();
                }}
                data-testid="alert-detail-resolve"
              >
                <CheckCircle2 className="size-4" />
                Resolve
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose} data-testid="alert-detail-close">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
