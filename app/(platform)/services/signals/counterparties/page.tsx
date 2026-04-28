"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { RotateCcw, ShieldAlert, ShieldCheck } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import { COUNTERPARTY_SLOT_VOCABULARY, CounterpartyStoreProvider, useCounterpartyStore } from "@/lib/signal-broadcast";
import type { CounterpartyRecord } from "@/lib/signal-broadcast";
import { MOCK_SIGNAL_EMISSIONS } from "@/lib/signal-broadcast";

const DEFAULT_ACTOR_ID = "admin-1";

/**
 * Admin · Signal Counterparties surface (Plan B Phase 5 / Option B-3b).
 *
 * Odum ops view — NOT counterparty-scoped. Lists registered counterparties,
 * shows delivery health, and lets the admin flip active-status + toggle the
 * per-counterparty slot entitlement allowlist.
 *
 * All writes go through the mock `CounterpartyStoreProvider` which persists
 * to localStorage under `counterparty-store/v1` and emits synthetic UTL
 * events (`COUNTERPARTY_ENTITLEMENT_CHANGED`, `COUNTERPARTY_ACTIVE_CHANGED`)
 * for audit-trail continuity with the Python `log_event` path.
 *
 * Plan SSOT:
 *   unified-trading-pm/plans/active/signal_leasing_broadcast_architecture_2026_04_20.plan.md
 *   § Phase 5 — admin surface + counterparty persona
 */

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function formatTs(iso: string | null): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toUTCString().replace(" GMT", "Z");
  } catch {
    return iso;
  }
}

function DeliveryRollup({ counterparty }: { counterparty: CounterpartyRecord }) {
  const emissionsForCp = useMemo(() => {
    return MOCK_SIGNAL_EMISSIONS.filter((e) => e.counterparty_id === counterparty.id);
  }, [counterparty.id]);

  const rollup = useMemo(() => {
    const out = { delivered: 0, retrying: 0, failed: 0, pending: 0 } as Record<string, number>;
    for (const e of emissionsForCp) {
      out[e.delivery_status] = (out[e.delivery_status] ?? 0) + 1;
    }
    return out;
  }, [emissionsForCp]);

  return (
    <div className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
      <div className="rounded border bg-muted/20 p-2" data-testid="admin-counterparties-rollup-delivered">
        <div className="text-[0.65rem] uppercase text-muted-foreground">Delivered</div>
        <div className="font-mono text-lg">{rollup.delivered ?? 0}</div>
      </div>
      <div className="rounded border bg-muted/20 p-2" data-testid="admin-counterparties-rollup-retrying">
        <div className="text-[0.65rem] uppercase text-muted-foreground">Retrying</div>
        <div className="font-mono text-lg">{rollup.retrying ?? 0}</div>
      </div>
      <div className="rounded border bg-muted/20 p-2" data-testid="admin-counterparties-rollup-failed">
        <div className="text-[0.65rem] uppercase text-muted-foreground">Failed</div>
        <div className="font-mono text-lg">{rollup.failed ?? 0}</div>
      </div>
      <div className="rounded border bg-muted/20 p-2">
        <div className="text-[0.65rem] uppercase text-muted-foreground">Last delivery</div>
        <div className="font-mono text-xs">{formatTs(counterparty.last_delivery_at)}</div>
      </div>
    </div>
  );
}

function DetailPanel({ counterparty, actorId }: { counterparty: CounterpartyRecord; actorId: string }) {
  const store = useCounterpartyStore();
  const [reason, setReason] = useState<string>("");

  const toggle = (slot: string) => {
    if (!reason.trim()) return;
    store.toggleEntitlement({
      counterpartyId: counterparty.id,
      slotLabel: slot,
      actorId,
      reason: reason.trim(),
    });
  };

  const flipActive = () => {
    if (!reason.trim()) return;
    store.setActive({
      counterpartyId: counterparty.id,
      active: !counterparty.active,
      actorId,
      reason: reason.trim(),
    });
  };

  return (
    <Card className="border-l-4 border-primary/60" data-testid={`admin-counterparties-detail-${counterparty.id}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {counterparty.active ? (
            <ShieldCheck className="size-4 text-emerald-600" aria-hidden />
          ) : (
            <ShieldAlert className="size-4 text-amber-600" aria-hidden />
          )}
          {counterparty.name}
        </CardTitle>
        <CardDescription className="break-all font-mono text-xs">
          {counterparty.id} · {counterparty.endpoint}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-4">
          <div>
            <div className="text-muted-foreground">Schema depth</div>
            <Badge variant="outline" className="mt-1 font-mono">
              {counterparty.schema_depth}
            </Badge>
          </div>
          <div>
            <div className="text-muted-foreground">Success rate</div>
            <div className="mt-1 font-mono">{formatPercent(counterparty.delivery_health.success_rate)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Retries / 24h</div>
            <div className="mt-1 font-mono">{counterparty.delivery_health.retries_24h}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Avg latency</div>
            <div className="mt-1 font-mono">{counterparty.delivery_health.avg_latency_ms}ms</div>
          </div>
        </div>

        <DeliveryRollup counterparty={counterparty} />

        <div className="space-y-2">
          <Label htmlFor={`reason-${counterparty.id}`}>Change reason</Label>
          <Input
            id={`reason-${counterparty.id}`}
            data-testid={`admin-counterparties-reason-${counterparty.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="contract signed / incident mitigation / entitlement refresh"
          />
          <p className="text-[0.65rem] text-muted-foreground">
            Required for audit trail: every toggle emits a synthetic COUNTERPARTY_ENTITLEMENT_CHANGED or
            COUNTERPARTY_ACTIVE_CHANGED event.
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2">
            <Label>Entitlement slots</Label>
            <Badge variant="secondary" className="text-[0.65rem]">
              {counterparty.allowed_slots.length} granted
            </Badge>
          </div>
          <ul className="space-y-1">
            {COUNTERPARTY_SLOT_VOCABULARY.map((slot) => {
              const granted = counterparty.allowed_slots.includes(slot);
              return (
                <li
                  key={slot}
                  className="flex items-center justify-between rounded border bg-muted/10 p-2 font-mono text-[0.65rem]"
                >
                  <span className="truncate">{slot}</span>
                  <Button
                    size="sm"
                    variant={granted ? "default" : "outline"}
                    onClick={() => toggle(slot)}
                    disabled={!reason.trim()}
                    data-testid={`admin-counterparties-toggle-${counterparty.id}-${slot}`}
                  >
                    {granted ? "Revoke" : "Grant"}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex items-center justify-between rounded border bg-muted/10 p-3">
          <div>
            <div className="text-sm font-medium">Active status</div>
            <p className="text-xs text-muted-foreground">Inactive counterparties receive zero emissions.</p>
          </div>
          <Button
            variant={counterparty.active ? "destructive" : "default"}
            size="sm"
            onClick={flipActive}
            disabled={!reason.trim()}
            data-testid={`admin-counterparties-active-${counterparty.id}`}
          >
            {counterparty.active ? "Deactivate" : "Activate"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AdminCounterpartiesInner() {
  const store = useCounterpartyStore();
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState<string | null>(store.counterparties[0]?.id ?? null);
  const [actorId, setActorId] = useState<string>(user?.email ?? DEFAULT_ACTOR_ID);

  const selected = selectedId ? store.getById(selectedId) : undefined;
  const isAdmin = user?.role === "admin" || user?.role === "internal" || user == null;

  if (!isAdmin) {
    return (
      <div className="platform-page-width space-y-4 p-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Admin only</CardTitle>
            <CardDescription>Signal counterparty management is restricted to Odum ops.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Log in with an admin or internal-trader persona to access this surface. Counterparty users are routed to{" "}
              <Link href="/services/signals/dashboard" className="underline underline-offset-2">
                /services/signals/dashboard
              </Link>{" "}
              instead.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-6 p-6">
        <PageHeader
          title="Admin · Signal Counterparties"
          description="Odum-ops view of registered signal-leasing counterparties. Toggle per-slot entitlements, deactivate counterparties, and inspect delivery health. Every mutation emits a synthetic UTL event for audit."
        >
          <Badge variant="outline" className="font-mono text-xs">
            actor: {actorId}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => store.reset()} data-testid="admin-counterparties-reset">
            <RotateCcw className="mr-1 size-3" aria-hidden />
            Reset mock state
          </Button>
        </PageHeader>

        <div className="space-y-1">
          <Label htmlFor="actor-id">Actor id</Label>
          <Input id="actor-id" value={actorId} onChange={(e) => setActorId(e.target.value)} className="max-w-xs" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Counterparty list</CardTitle>
            <CardDescription>
              {store.counterparties.length} registered · click a row to open the detail panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table data-testid="admin-counterparties-table">
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Endpoint</TableHead>
                  <TableHead>Depth</TableHead>
                  <TableHead>Slots</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Last delivery</TableHead>
                  <TableHead>Health</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {store.counterparties.map((cp) => {
                  const isSelected = cp.id === selectedId;
                  return (
                    <TableRow
                      key={cp.id}
                      data-testid={`admin-counterparties-row-${cp.id}`}
                      data-selected={isSelected}
                      className={isSelected ? "bg-muted/40 cursor-pointer" : "cursor-pointer"}
                      onClick={() => setSelectedId(cp.id)}
                    >
                      <TableCell className="font-mono text-xs">{cp.id}</TableCell>
                      <TableCell>{cp.name}</TableCell>
                      <TableCell className="max-w-[14rem] truncate font-mono text-[0.65rem]">{cp.endpoint}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-[0.6rem]">
                          {cp.schema_depth}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{cp.allowed_slots.length}</TableCell>
                      <TableCell>
                        <Badge variant={cp.active ? "default" : "secondary"} className="text-[0.65rem]">
                          {cp.active ? "active" : "inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-[0.65rem]">{formatTs(cp.last_delivery_at)}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {formatPercent(cp.delivery_health.success_rate)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {selected ? <DetailPanel counterparty={selected} actorId={actorId} /> : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Audit trail (this session)</CardTitle>
            <CardDescription>
              Synthetic UTL events emitted by mutations on the counterparty store. In prod these land in BigQuery via
              `log_event`.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {store.events.length === 0 ? (
              <div className="text-xs italic text-muted-foreground">
                No events yet. Toggle an entitlement or flip active status above to populate the audit list.
              </div>
            ) : (
              <ol className="space-y-2 text-xs" data-testid="admin-counterparties-audit-list">
                {store.events.map((event, idx) => (
                  <li
                    key={idx}
                    className="border-l-2 border-primary/50 pl-2"
                    data-testid={`admin-counterparties-audit-${event.eventName}`}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-[0.6rem]">
                        {event.eventName}
                      </Badge>
                      <span className="text-muted-foreground">{event.timestampUtc}</span>
                    </div>
                    <pre className="mt-1 overflow-x-auto rounded bg-muted/50 p-2 font-mono text-[0.6rem]">
                      {JSON.stringify(event.details, null, 2)}
                    </pre>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>

        <div className="text-xs text-muted-foreground">
          Counterparty-scoped observability lives at{" "}
          <Link href="/services/signals/dashboard" className="underline underline-offset-2">
            /services/signals/dashboard
          </Link>
          .
        </div>
      </div>
    </div>
  );
}

export default function AdminCounterpartiesPage() {
  return (
    <CounterpartyStoreProvider>
      <AdminCounterpartiesInner />
    </CounterpartyStoreProvider>
  );
}
