"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

type AuditTab = "summary" | "orphans" | "tts" | "errors";

const MOCK_SUMMARY = {
  date: "2026-03-10",
  orphan_event_count: 4,
  tts_record_count: 12,
  error_event_count: 7,
  services_with_violations: [
    "features-delta-one-service",
    "market-tick-data-service",
  ],
};

const MOCK_ORPHANS = [
  {
    event_id: "orp-001",
    service: "market-tick-data-service",
    event_type: "TICK_RECEIVED",
    timestamp: "2026-03-10T09:45:22Z",
    reason: "No matching BATCH_STARTED correlation chain",
  },
  {
    event_id: "orp-002",
    service: "features-delta-one-service",
    event_type: "SHARD_COMPLETED",
    timestamp: "2026-03-10T07:22:05Z",
    reason: "Parent BATCH_STARTED event missing — job terminated mid-run",
  },
  {
    event_id: "orp-003",
    service: "execution-service",
    event_type: "ORDER_REJECTED",
    timestamp: "2026-03-10T10:12:44Z",
    reason: "No matching ORDER_PLACED event in correlation window",
  },
  {
    event_id: "orp-004",
    service: "strategy-service",
    event_type: "INSTRUCTION_EMITTED",
    timestamp: "2026-03-10T08:45:00Z",
    reason: "Correlation ID not registered in active run index",
  },
];

const MOCK_TTS = [
  {
    record_id: "tts-001",
    service: "execution-service",
    event_type: "FILL_REPORTED",
    timestamp: "2026-03-10T10:00:12Z",
    tts_tag: "BEST_EXECUTION_REVIEW",
    reviewer: null as string | null,
    resolved: false,
  },
  {
    record_id: "tts-002",
    service: "risk-and-exposure-service",
    event_type: "VAR_BREACH",
    timestamp: "2026-03-10T09:30:00Z",
    tts_tag: "RISK_LIMIT_BREACH",
    reviewer: "risk-team",
    resolved: true,
  },
  {
    record_id: "tts-003",
    service: "execution-service",
    event_type: "ALGO_SELECTION",
    timestamp: "2026-03-09T14:22:00Z",
    tts_tag: "ALGO_AUDIT",
    reviewer: null as string | null,
    resolved: false,
  },
];

const MOCK_ERRORS = [
  {
    event_id: "err-001",
    service: "features-delta-one-service",
    event_type: "BATCH_FAILED",
    timestamp: "2026-03-10T07:22:05Z",
    error_code: "QUOTA_EXCEEDED",
    message: "VM instance quota exhausted in asia-northeast1-c",
  },
  {
    event_id: "err-002",
    service: "market-tick-data-service",
    event_type: "SHARD_FAILED",
    timestamp: "2026-03-10T09:45:22Z",
    error_code: "UPSTREAM_DISCONNECT",
    message: "WebSocket connection dropped by upstream",
  },
  {
    event_id: "err-003",
    service: "ml-inference-service",
    event_type: "INFERENCE_ERROR",
    timestamp: "2026-03-10T06:15:00Z",
    error_code: "FEATURE_MISSING",
    message: "Onchain feature vector not available for BTC/USDT at 14:22 UTC",
  },
];

export default function EventAuditPage() {
  const [activeTab, setActiveTab] = useState<AuditTab>("summary");

  const TABS: { id: AuditTab; label: string; count?: number }[] = [
    { id: "summary", label: "Summary" },
    {
      id: "orphans",
      label: "Orphan Events",
      count: MOCK_SUMMARY.orphan_event_count,
    },
    { id: "tts", label: "TTS Records", count: MOCK_SUMMARY.tts_record_count },
    {
      id: "errors",
      label: "Error Events",
      count: MOCK_SUMMARY.error_event_count,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">
            Event Audit
          </h1>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            Orphan events, TTS records, and error audit — {MOCK_SUMMARY.date}
          </p>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw size={14} />
          Refresh
        </Button>
      </div>

      <div className="flex gap-2 border-b border-[var(--color-border)] pb-0">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? "border-[var(--color-accent)] text-[var(--color-text-primary)]"
                : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="ml-1.5 text-xs opacity-70">{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "summary" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <Card
              className="cursor-pointer"
              onClick={() => setActiveTab("orphans")}
            >
              <CardContent className="pt-4">
                <div className="text-2xl font-semibold font-mono text-[var(--color-warning)]">
                  {MOCK_SUMMARY.orphan_event_count}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Orphan Events
                </div>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer"
              onClick={() => setActiveTab("tts")}
            >
              <CardContent className="pt-4">
                <div className="text-2xl font-semibold font-mono text-[var(--color-text-primary)]">
                  {MOCK_SUMMARY.tts_record_count}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  TTS Records
                </div>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer"
              onClick={() => setActiveTab("errors")}
            >
              <CardContent className="pt-4">
                <div className="text-2xl font-semibold font-mono text-[var(--color-error)]">
                  {MOCK_SUMMARY.error_event_count}
                </div>
                <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                  Error Events
                </div>
              </CardContent>
            </Card>
          </div>
          {MOCK_SUMMARY.services_with_violations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">
                  Services With Violations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {MOCK_SUMMARY.services_with_violations.map((s) => (
                    <Badge key={s} variant="error">
                      {s}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === "orphans" && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header-cell">Time</th>
                  <th className="table-header-cell">Service</th>
                  <th className="table-header-cell">Event Type</th>
                  <th className="table-header-cell">Reason</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ORPHANS.map((o) => (
                  <tr key={o.event_id} className="table-row">
                    <td className="table-cell font-mono text-xs text-[var(--color-text-muted)]">
                      {new Date(o.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="table-cell font-mono text-xs">
                      {o.service}
                    </td>
                    <td className="table-cell">
                      <Badge variant="warning">{o.event_type}</Badge>
                    </td>
                    <td className="table-cell text-xs text-[var(--color-text-secondary)]">
                      {o.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {activeTab === "tts" && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header-cell">Time</th>
                  <th className="table-header-cell">Service</th>
                  <th className="table-header-cell">Event</th>
                  <th className="table-header-cell">TTS Tag</th>
                  <th className="table-header-cell">Resolved</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_TTS.map((t) => (
                  <tr key={t.record_id} className="table-row">
                    <td className="table-cell font-mono text-xs text-[var(--color-text-muted)]">
                      {new Date(t.timestamp).toLocaleString()}
                    </td>
                    <td className="table-cell font-mono text-xs">
                      {t.service}
                    </td>
                    <td className="table-cell text-xs">{t.event_type}</td>
                    <td className="table-cell">
                      <Badge variant="default">{t.tts_tag}</Badge>
                    </td>
                    <td className="table-cell">
                      <Badge variant={t.resolved ? "success" : "warning"}>
                        {t.resolved ? "resolved" : "open"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {activeTab === "errors" && (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="table-header-cell">Time</th>
                  <th className="table-header-cell">Service</th>
                  <th className="table-header-cell">Event</th>
                  <th className="table-header-cell">Error Code</th>
                  <th className="table-header-cell">Message</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_ERRORS.map((e) => (
                  <tr key={e.event_id} className="table-row">
                    <td className="table-cell font-mono text-xs text-[var(--color-text-muted)]">
                      {new Date(e.timestamp).toLocaleTimeString()}
                    </td>
                    <td className="table-cell font-mono text-xs">
                      {e.service}
                    </td>
                    <td className="table-cell text-xs">{e.event_type}</td>
                    <td className="table-cell">
                      <Badge variant="error">{e.error_code}</Badge>
                    </td>
                    <td className="table-cell text-xs text-[var(--color-text-secondary)] max-w-xs truncate">
                      {e.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
