"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";

import {
  LockStateBadge,
  MaturityBadge,
} from "@/components/architecture-v2";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  LOCK_STATES,
  LOCK_STATE_LABEL,
  MATURITY_LADDER,
  MATURITY_LABEL,
  allCoverageCells,
  useAvailabilityStore,
} from "@/lib/architecture-v2";
import type { LockState, StrategyMaturity } from "@/lib/architecture-v2";

const DEFAULT_ACTOR_ID = "admin-1";

// Flatten every representative slot_label from the coverage matrix so the
// admin can pick from a closed vocabulary rather than free-text.
function listAllSlotLabels(): readonly string[] {
  const seen = new Set<string>();
  for (const cell of allCoverageCells()) {
    for (const label of cell.representativeSlotLabels) {
      seen.add(label);
    }
  }
  return Array.from(seen).sort();
}

export default function AdminLockStatePage() {
  const store = useAvailabilityStore();
  const allSlots = useMemo(listAllSlotLabels, []);
  const [selectedSlot, setSelectedSlot] = useState<string>(allSlots[0] ?? "");
  const [lockState, setLockStateValue] = useState<LockState>("PUBLIC");
  const [maturity, setMaturityValue] = useState<StrategyMaturity>("LIVE_ALLOCATED");
  const [reason, setReason] = useState<string>("");
  const [exclusiveClientId, setExclusiveClientId] = useState<string>("");
  const [reservingBusinessUnitId, setReservingBusinessUnitId] =
    useState<string>("");
  const [actorId, setActorId] = useState<string>(DEFAULT_ACTOR_ID);

  const currentEntry = store.getEntry(selectedSlot);

  const pickSlot = (slot: string) => {
    setSelectedSlot(slot);
    const entry = store.getEntry(slot);
    setLockStateValue(entry.lockState);
    setMaturityValue(entry.maturity);
    setReason("");
    setExclusiveClientId(entry.exclusiveClientId ?? "");
    setReservingBusinessUnitId(entry.reservingBusinessUnitId ?? "");
  };

  const handleApply = () => {
    if (!selectedSlot || !reason.trim()) return;
    if (lockState !== currentEntry.lockState) {
      store.setLockState({
        slotLabel: selectedSlot,
        newLockState: lockState,
        actorId,
        reason: reason.trim(),
        exclusiveClientId:
          lockState === "CLIENT_EXCLUSIVE" ? exclusiveClientId.trim() || null : null,
        reservingBusinessUnitId:
          lockState === "INVESTMENT_MANAGEMENT_RESERVED"
            ? reservingBusinessUnitId.trim() || null
            : null,
      });
    }
    if (maturity !== currentEntry.maturity) {
      store.setMaturity({
        slotLabel: selectedSlot,
        newMaturity: maturity,
        actorId,
        reason: reason.trim(),
      });
    }
    setReason("");
  };

  const dirty =
    selectedSlot !== "" &&
    (lockState !== currentEntry.lockState ||
      maturity !== currentEntry.maturity ||
      (lockState === "CLIENT_EXCLUSIVE" &&
        exclusiveClientId !== (currentEntry.exclusiveClientId ?? "")) ||
      (lockState === "INVESTMENT_MANAGEMENT_RESERVED" &&
        reservingBusinessUnitId !==
          (currentEntry.reservingBusinessUnitId ?? "")));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="platform-page-width space-y-6 p-6">
        <PageHeader
          title="Admin · Lock state"
          description="Flip a slot's lock state or apply an incident-response maturity demotion. Every transition emits a synthetic STRATEGY_AVAILABILITY_CHANGED event that persists in this browser's localStorage (mock mode)."
        >
          <Badge variant="outline" className="font-mono text-xs">
            actor: {actorId}
          </Badge>
          <Button variant="outline" size="sm" onClick={() => store.reset()}>
            <RotateCcw className="mr-1 size-3" aria-hidden />
            Reset mock state
          </Button>
        </PageHeader>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2" data-testid="admin-lock-state-form">
            <CardHeader>
              <CardTitle className="text-base">Edit slot availability</CardTitle>
              <CardDescription>
                Pick a slot from the closed vocabulary below; edits land in the
                mock store and emit synthetic UTL events for audit.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="slot-picker">Slot label</Label>
                <Select value={selectedSlot} onValueChange={pickSlot}>
                  <SelectTrigger id="slot-picker" className="font-mono text-xs">
                    <SelectValue placeholder="Pick a slot..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {allSlots.map((slot) => (
                      <SelectItem key={slot} value={slot} className="font-mono text-xs">
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="lock-state">Lock state</Label>
                  <Select
                    value={lockState}
                    onValueChange={(v) => setLockStateValue(v as LockState)}
                  >
                    <SelectTrigger id="lock-state">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LOCK_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {LOCK_STATE_LABEL[state]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="maturity">Maturity</Label>
                  <Select
                    value={maturity}
                    onValueChange={(v) => setMaturityValue(v as StrategyMaturity)}
                  >
                    <SelectTrigger id="maturity">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {MATURITY_LADDER.map((m) => (
                        <SelectItem key={m} value={m}>
                          {MATURITY_LABEL[m]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {lockState === "CLIENT_EXCLUSIVE" ? (
                <div className="space-y-1">
                  <Label htmlFor="exclusive-client">Exclusive client id</Label>
                  <Input
                    id="exclusive-client"
                    value={exclusiveClientId}
                    onChange={(e) => setExclusiveClientId(e.target.value)}
                    placeholder="client-alpha"
                  />
                </div>
              ) : null}

              {lockState === "INVESTMENT_MANAGEMENT_RESERVED" ? (
                <div className="space-y-1">
                  <Label htmlFor="reserving-bu">Reserving business unit</Label>
                  <Input
                    id="reserving-bu"
                    value={reservingBusinessUnitId}
                    onChange={(e) => setReservingBusinessUnitId(e.target.value)}
                    placeholder="fund-alpha"
                  />
                </div>
              ) : null}

              <div className="space-y-1">
                <Label htmlFor="actor">Actor id</Label>
                <Input
                  id="actor"
                  value={actorId}
                  onChange={(e) => setActorId(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="fund-alpha adopted this slot / data-quality incident / contract signed"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleApply}
                disabled={!dirty || !reason.trim() || !selectedSlot}
                data-testid="apply-lock-state"
              >
                Apply change
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Current availability</CardTitle>
              <CardDescription className="break-all font-mono text-[0.65rem]">
                {selectedSlot || "no slot selected"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <LockStateBadge
                  state={currentEntry.lockState}
                  clientId={currentEntry.exclusiveClientId}
                  reservingBusinessUnitId={currentEntry.reservingBusinessUnitId}
                  expiresAtUtc={currentEntry.expiresAtUtc}
                />
                <MaturityBadge maturity={currentEntry.maturity} />
              </div>
              {currentEntry.changedAtUtc ? (
                <div className="text-xs text-muted-foreground">
                  Changed at: {currentEntry.changedAtUtc}
                </div>
              ) : (
                <div className="text-xs text-muted-foreground italic">
                  No admin override recorded — showing default (PUBLIC, LIVE_ALLOCATED).
                </div>
              )}
              {currentEntry.reason ? (
                <div className="text-xs text-muted-foreground">
                  Reason: {currentEntry.reason}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Event audit (this session)</CardTitle>
            <CardDescription>
              Synthetic UTL events emitted by the mock store. In production these
              land in BigQuery via `log_event`.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {store.events.length === 0 ? (
              <div className="text-xs italic text-muted-foreground">
                No events yet. Apply a change above to see the synthetic UTL
                events emitted.
              </div>
            ) : (
              <ol className="space-y-2 text-xs" data-testid="audit-event-list">
                {store.events.map((event, idx) => (
                  <li
                    key={idx}
                    className="border-l-2 border-primary/50 pl-2"
                    data-testid={`audit-event-${event.eventName}`}
                  >
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="font-mono text-[0.6rem]">
                        {event.eventName}
                      </Badge>
                      <span className="text-muted-foreground">
                        {event.timestampUtc}
                      </span>
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
      </div>
    </div>
  );
}
