"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

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
  {
    record_id: "tts-004",
    service: "execution-service",
    event_type: "FILL_REPORTED",
    timestamp: "2026-03-08T15:30:00Z",
    tts_tag: "BEST_EXECUTION_REVIEW",
    reviewer: "compliance-team",
    resolved: true,
  },
];

export default function BestExecutionPage() {
  const openCount = MOCK_TTS.filter((t) => !t.resolved).length;
  const resolvedCount = MOCK_TTS.filter((t) => t.resolved).length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold text-[var(--color-text-primary)]">
            Best Execution Audit
          </h1>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            TTS records — time-to-suppress events requiring review
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
              {MOCK_TTS.length}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
              Total Records
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold font-mono text-[var(--color-warning)]">
              {openCount}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
              Open
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-semibold font-mono text-[var(--color-success)]">
              {resolvedCount}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
              Resolved
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">TTS Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr>
                <th className="table-header-cell">Time</th>
                <th className="table-header-cell">Service</th>
                <th className="table-header-cell">Event</th>
                <th className="table-header-cell">TTS Tag</th>
                <th className="table-header-cell">Reviewer</th>
                <th className="table-header-cell">Status</th>
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
                  <td className="table-cell text-xs text-[var(--color-text-secondary)]">
                    {t.reviewer ?? "unassigned"}
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
    </div>
  );
}
