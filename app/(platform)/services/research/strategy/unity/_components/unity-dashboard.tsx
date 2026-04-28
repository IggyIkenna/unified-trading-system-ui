"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  UNITY_CHILD_BOOKS,
  UNITY_COMMERCIAL,
  unityChildBooksConfirmed,
  unityChildBooksPending,
  type UnitySport,
} from "@/lib/architecture-v2";
import { cn } from "@/lib/utils";
import { formatCurrency, formatNumber } from "@/lib/utils/formatters";
import { CheckCircle2, CircleDashed, Trophy } from "lucide-react";

const MOCK_CURRENT_MONTH_TURNOVER_USD = 184_000;
const MOCK_LIFETIME_TURNOVER_USD = 1_890_000;

function formatCommission(bps: number | null, kind: "FLAT" | "COMMISSION_ON_WIN"): string {
  if (bps === null) {
    return "TBD";
  }
  const pct = bps / 100;
  return kind === "COMMISSION_ON_WIN" ? `${pct.toFixed(2)}% on win` : `${pct.toFixed(2)}%`;
}

function Progress({ current, target, label }: { current: number; target: number; label: string }) {
  const pct = target > 0 ? Math.min(100, (current / target) * 100) : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground">
          {formatCurrency(current, "USD", 0)} / {formatCurrency(target, "USD", 0)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${pct}%` }}
          aria-label={`${label} progress`}
        />
      </div>
      <p className="text-[10px] text-muted-foreground">{formatNumber(pct, 1)}% of target</p>
    </div>
  );
}

export function UnityDashboard() {
  const confirmed = unityChildBooksConfirmed();
  const pending = unityChildBooksPending();
  const sports: readonly UnitySport[] = UNITY_COMMERCIAL.enabledSports;
  const totalCommissionsKnown = confirmed.filter((b) => b.commission_bps !== null);
  const avgCommissionBps =
    totalCommissionsKnown.length > 0
      ? totalCommissionsKnown.reduce((acc, b) => acc + (b.commission_bps ?? 0), 0) / totalCommissionsKnown.length
      : 0;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-6 p-6">
        <div className="space-y-2">
          <h1 className="text-page-title font-semibold tracking-tight">Unity meta-broker</h1>
          <p className="text-body text-muted-foreground max-w-2xl">
            Unity aggregates 10 sports books behind a single TCP connection. UTS uses Unity as the primary routing path
            for the MARKET_MAKING and ARBITRAGE_STRUCTURAL families in sports.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Child books</p>
              <p className="text-2xl font-bold font-mono">
                {confirmed.length}
                <span className="text-sm text-muted-foreground"> / {UNITY_CHILD_BOOKS.length}</span>
              </p>
              <p className="text-[10px] text-muted-foreground">{pending.length} TBD</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg commission</p>
              <p className="text-2xl font-bold font-mono">{(avgCommissionBps / 100).toFixed(2)}%</p>
              <p className="text-[10px] text-muted-foreground">across confirmed books</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Share class</p>
              <p className="text-2xl font-bold font-mono">{UNITY_COMMERCIAL.shareClass}</p>
              <p className="text-[10px] text-muted-foreground">Rollover {UNITY_COMMERCIAL.rolloverMultiplier}x</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Enabled sports</p>
              <div className="flex flex-wrap items-center gap-1 pt-1">
                {sports.map((s) => (
                  <Badge key={s} variant="outline" className="text-[10px]">
                    <Trophy className="mr-1 size-3" /> {s}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <CardContent className="space-y-4 pt-5">
              <h2 className="text-base font-semibold">Subscription waiver tracker</h2>
              <Progress
                current={MOCK_CURRENT_MONTH_TURNOVER_USD}
                target={UNITY_COMMERCIAL.monthlyTurnoverWaiverUsd}
                label="Month-to-date turnover"
              />
              <p className="text-xs text-muted-foreground">
                Hit {formatCurrency(UNITY_COMMERCIAL.monthlyTurnoverWaiverUsd, "USD", 0)} of turnover in a calendar
                month to waive the {formatCurrency(UNITY_COMMERCIAL.monthlySubscriptionUsd, "USD", 0)} monthly
                subscription. Otherwise, the subscription is payable at month-end.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-4 pt-5">
              <h2 className="text-base font-semibold">Deposit refund tracker</h2>
              <Progress
                current={MOCK_LIFETIME_TURNOVER_USD}
                target={UNITY_COMMERCIAL.refundThresholdLifetimeTurnoverUsd}
                label="Lifetime turnover"
              />
              <p className="text-xs text-muted-foreground">
                Deposit held: {formatCurrency(UNITY_COMMERCIAL.depositUsd, "USD", 0)}. Unity refunds the deposit once
                lifetime turnover exceeds{" "}
                {formatCurrency(UNITY_COMMERCIAL.refundThresholdLifetimeTurnoverUsd, "USD", 0)}.
              </p>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 pb-2">
              <h2 className="text-base font-semibold">Child books</h2>
              <Badge variant="secondary" className="text-[10px]">
                {confirmed.length} confirmed · {pending.length} pending
              </Badge>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className="text-xs text-muted-foreground">Book</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Commission</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Sports</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Status</TableHead>
                  <TableHead className="text-xs text-muted-foreground">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {UNITY_CHILD_BOOKS.map((b) => (
                  <TableRow
                    key={b.child_venue_id}
                    className={cn("border-border/30", !b.confirmed && "opacity-70")}
                    data-testid={`unity-book-${b.child_venue_id}`}
                  >
                    <TableCell className="font-medium">
                      {b.display_name}
                      <p className="text-[10px] text-muted-foreground">{b.child_venue_id}</p>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatCommission(b.commission_bps, b.commission_type)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {b.supported_sports.length === 0 ? (
                          <span className="text-[10px] text-muted-foreground">-</span>
                        ) : (
                          b.supported_sports.map((s) => (
                            <Badge key={s} variant="outline" className="text-[10px]">
                              {s}
                            </Badge>
                          ))
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {b.confirmed ? (
                        <Badge variant="outline" className="text-[10px] text-emerald-400">
                          <CheckCircle2 className="mr-1 size-3" /> Confirmed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-amber-400">
                          <CircleDashed className="mr-1 size-3" /> TBD
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{b.notes}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
