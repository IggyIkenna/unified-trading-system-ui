"use client";

/**
 * Admin user-visibility editor — plan p7-admin-user-visibility-editor.
 *
 * Renders the effective visibility for a given user (persona + any admin
 * overrides) and lets an admin pin / unpin specific slots. Writes are
 * recorded in an audit log (`localStorage['admin-visibility-audit/v1']`) so
 * demos can replay the decision trail.
 *
 * Data sources (all client-side today — admin-API wiring is follow-up):
 *   - Target persona from `odum-persona/v1#<userId>`.
 *   - Per-user pin overrides from `admin-visibility-pins/v1#<userId>`.
 *   - Initial catalogue from `buildInitialRegistry()`.
 */

import * as React from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PinOff, Pin } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

import { useAuth } from "@/hooks/use-auth";
import { audienceForPersonaId } from "@/lib/auth/audience-from-persona";
import { hasAdminPermission } from "@/lib/auth/admin-permissions";
import { buildInitialRegistry } from "@/lib/architecture-v2/initial-lock-state";
import {
  slotsVisibleTo,
  type Audience,
} from "@/lib/architecture-v2/availability";

interface AuditEntry {
  readonly slotLabel: string;
  readonly action: "pin" | "unpin";
  readonly actorEmail: string;
  readonly timestampUtc: string;
}

interface VisibilityState {
  readonly visibleSlots: readonly string[];
  readonly hiddenSlots: readonly string[];
  readonly pins: readonly string[];
  readonly audience: Audience;
  readonly targetPersona: string | null;
}

function auditKeyFor(userId: string): string {
  return `admin-visibility-audit/v1#${userId}`;
}

function pinsKeyFor(userId: string): string {
  return `admin-visibility-pins/v1#${userId}`;
}

function readPinsFromStorage(userId: string): readonly string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(pinsKeyFor(userId));
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function readAuditFromStorage(userId: string): readonly AuditEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(auditKeyFor(userId));
    return raw ? (JSON.parse(raw) as AuditEntry[]) : [];
  } catch {
    return [];
  }
}

function writePinsToStorage(userId: string, pins: readonly string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(pinsKeyFor(userId), JSON.stringify(pins));
}

function writeAuditToStorage(
  userId: string,
  entries: readonly AuditEntry[],
): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(auditKeyFor(userId), JSON.stringify(entries));
}

export default function AdminUserVisibilityPage() {
  const params = useParams<{ id: string }>();
  const targetUserId = params?.id ?? "unknown-user";
  const { user: adminUser } = useAuth();

  const [state, setState] = React.useState<VisibilityState>({
    visibleSlots: [],
    hiddenSlots: [],
    pins: [],
    audience: "trading_platform_subscriber",
    targetPersona: null,
  });
  const [audit, setAudit] = React.useState<readonly AuditEntry[]>([]);
  const [search, setSearch] = React.useState("");

  const canModify = adminUser
    ? hasAdminPermission(adminUser, "admin:modify_user")
    : false;

  const refresh = React.useCallback(() => {
    if (typeof window === "undefined") return;
    const persona = window.localStorage.getItem(
      `odum-persona/v1#${targetUserId}`,
    );
    const audience = audienceForPersonaId(
      persona ?? undefined,
      "client", // target user is always evaluated as a client in this view
    );
    const pins = readPinsFromStorage(targetUserId);
    const registry = buildInitialRegistry();
    const allSlots = registry.map((e) => e.slotLabel);
    const visibleBaseline = slotsVisibleTo(audience, {
      registry,
      knownSlotLabels: allSlots,
    });
    const visibleSet = new Set<string>([...visibleBaseline, ...pins]);
    const visibleSlots = allSlots.filter((s) => visibleSet.has(s));
    const hiddenSlots = allSlots.filter((s) => !visibleSet.has(s));
    setState({
      visibleSlots,
      hiddenSlots,
      pins,
      audience,
      targetPersona: persona,
    });
    setAudit(readAuditFromStorage(targetUserId));
  }, [targetUserId]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const pinSlot = React.useCallback(
    (slotLabel: string) => {
      if (!canModify || !adminUser) return;
      const nextPins = Array.from(new Set([...state.pins, slotLabel]));
      writePinsToStorage(targetUserId, nextPins);
      const entry: AuditEntry = {
        slotLabel,
        action: "pin",
        actorEmail: adminUser.email ?? "unknown",
        timestampUtc: new Date().toISOString(),
      };
      writeAuditToStorage(targetUserId, [...audit, entry]);
      refresh();
    },
    [adminUser, audit, canModify, refresh, state.pins, targetUserId],
  );

  const unpinSlot = React.useCallback(
    (slotLabel: string) => {
      if (!canModify || !adminUser) return;
      const nextPins = state.pins.filter((p) => p !== slotLabel);
      writePinsToStorage(targetUserId, nextPins);
      const entry: AuditEntry = {
        slotLabel,
        action: "unpin",
        actorEmail: adminUser.email ?? "unknown",
        timestampUtc: new Date().toISOString(),
      };
      writeAuditToStorage(targetUserId, [...audit, entry]);
      refresh();
    },
    [adminUser, audit, canModify, refresh, state.pins, targetUserId],
  );

  const filteredHidden = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return state.hiddenSlots.slice(0, 50);
    return state.hiddenSlots.filter((s) =>
      s.toLowerCase().includes(q),
    ).slice(0, 50);
  }, [search, state.hiddenSlots]);

  return (
    <div className="p-6 space-y-6" data-testid="admin-user-visibility-page">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/ops/admin/users/${targetUserId}`}>
          <ArrowLeft className="size-4 mr-1" /> Back to user
        </Link>
      </Button>
      <PageHeader
        title="User visibility"
        description={`Effective catalogue visibility for user ${targetUserId}. Admin-only. Persona, audience + per-user slot pins combine to produce the visible set.`}
      />

      {!canModify ? (
        <Alert className="border-amber-500/40 bg-amber-500/10">
          <AlertTitle>Read-only</AlertTitle>
          <AlertDescription>
            Your admin account lacks <code>admin:modify_user</code>. You can
            view this page but cannot pin/unpin slots.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="visibility-summary-persona">
          <CardHeader>
            <CardTitle className="text-sm">Persona</CardTitle>
            <CardDescription>Assigned restriction profile</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-sm">
              {state.targetPersona ?? "(none — questionnaire not completed)"}
            </p>
          </CardContent>
        </Card>
        <Card data-testid="visibility-summary-audience">
          <CardHeader>
            <CardTitle className="text-sm">Audience</CardTitle>
            <CardDescription>Derived from persona</CardDescription>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="font-mono text-xs">
              {state.audience}
            </Badge>
          </CardContent>
        </Card>
        <Card data-testid="visibility-summary-counts">
          <CardHeader>
            <CardTitle className="text-sm">Visibility counts</CardTitle>
            <CardDescription>Slots visible vs hidden</CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4 text-sm">
            <div>
              <div className="text-2xl font-semibold">
                {state.visibleSlots.length}
              </div>
              <div className="text-xs text-muted-foreground">Visible</div>
            </div>
            <div>
              <div className="text-2xl font-semibold">
                {state.hiddenSlots.length}
              </div>
              <div className="text-xs text-muted-foreground">Hidden</div>
            </div>
            <div>
              <div className="text-2xl font-semibold">
                {state.pins.length}
              </div>
              <div className="text-xs text-muted-foreground">Pins</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card data-testid="visibility-editor-hidden">
        <CardHeader>
          <CardTitle className="text-sm">Hidden slots</CardTitle>
          <CardDescription>
            Slots the user does NOT currently see. Pin a slot to expose it to
            this user only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            type="search"
            placeholder="Filter hidden slots by label…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="visibility-hidden-search"
            className="max-w-md"
          />
          <ul className="space-y-1">
            {filteredHidden.length === 0 ? (
              <li className="text-sm text-muted-foreground">
                No hidden slots match your search.
              </li>
            ) : (
              filteredHidden.map((slotLabel) => (
                <li
                  key={slotLabel}
                  className="flex items-center justify-between gap-2 text-xs py-1 border-b border-border/30"
                  data-testid="visibility-hidden-row"
                >
                  <span className="font-mono">{slotLabel}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => pinSlot(slotLabel)}
                    disabled={!canModify}
                    data-testid={`visibility-pin-${slotLabel}`}
                  >
                    <Pin className="size-3 mr-1" /> Pin
                  </Button>
                </li>
              ))
            )}
          </ul>
          {state.hiddenSlots.length > 50 ? (
            <p className="text-[10px] text-muted-foreground">
              Showing first 50 of {state.hiddenSlots.length} hidden slots. Use
              search to narrow.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card data-testid="visibility-editor-pins">
        <CardHeader>
          <CardTitle className="text-sm">Active pins</CardTitle>
          <CardDescription>
            Slots pinned to this user. Unpinning removes the override — the
            slot falls back to the persona-derived default.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state.pins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No pins set.</p>
          ) : (
            <ul className="space-y-1">
              {state.pins.map((slotLabel) => (
                <li
                  key={slotLabel}
                  className="flex items-center justify-between gap-2 text-xs py-1 border-b border-border/30"
                  data-testid="visibility-pin-row"
                >
                  <span className="font-mono">{slotLabel}</span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => unpinSlot(slotLabel)}
                    disabled={!canModify}
                    data-testid={`visibility-unpin-${slotLabel}`}
                  >
                    <PinOff className="size-3 mr-1" /> Unpin
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card data-testid="visibility-editor-audit">
        <CardHeader>
          <CardTitle className="text-sm">Audit log</CardTitle>
          <CardDescription>
            Pin / unpin actions recorded for this user. Persists in
            localStorage in mock mode; admin-API wiring follow-up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {audit.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No admin actions recorded yet.
            </p>
          ) : (
            <ul className="space-y-1 text-xs">
              {audit
                .slice()
                .reverse()
                .slice(0, 20)
                .map((entry, i) => (
                  <li
                    key={`${entry.timestampUtc}-${i}`}
                    className="flex items-center justify-between gap-2 py-1 border-b border-border/30"
                    data-testid="visibility-audit-row"
                  >
                    <span className="font-mono">
                      {entry.timestampUtc} · {entry.action} ·
                      {" "}
                      <span className="text-primary">{entry.slotLabel}</span>
                    </span>
                    <span className="text-muted-foreground">
                      {entry.actorEmail}
                    </span>
                  </li>
                ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
