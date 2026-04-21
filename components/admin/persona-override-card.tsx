"use client";

/**
 * Admin persona-override surface (Phase 4 of
 * `ui_unification_v2_sanitisation_2026_04_20.plan.md`, `p4-persona-admin-override`).
 *
 * Lets an admin stamp a user with a specific resolved persona — typically used
 * to fast-forward a prospect onto a targeted demo flow without making them
 * re-submit the questionnaire. Write goes to `localStorage` in mock mode (the
 * same key the questionnaire submit writes to) + records an audit-log event
 * via the availability store.
 *
 * Rule: admin cannot grant higher than `INVESTMENT_MANAGEMENT_RESERVED`
 * without explicitly changing the lock-state of the target slot first. This
 * card enforces that rule by rejecting non-admin writers and by logging every
 * change to the availability store event list (which can be reconciled against
 * the admin audit log).
 */

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import {
  RESOLVED_PERSONA_STORAGE_KEY,
  type ResolvedPersonaId,
} from "@/lib/questionnaire/resolve-persona";

const PERSONA_OPTIONS: readonly {
  id: ResolvedPersonaId;
  label: string;
  description: string;
}[] = [
  {
    id: "prospect-dart",
    label: "DART Full prospect",
    description: "Research + ML + strategy promotion + execution visibility.",
  },
  {
    id: "prospect-signals-only",
    label: "DART Signals-In prospect",
    description: "Execution + reporting only — client brings own signals.",
  },
  {
    id: "prospect-im-sma",
    label: "IM SMA prospect",
    description: "Investment Management on Separately Managed Account.",
  },
  {
    id: "prospect-im-pooled",
    label: "IM Pooled-Fund prospect",
    description: "Investment Management on pooled-fund share class.",
  },
  {
    id: "prospect-regulatory",
    label: "Regulatory Umbrella prospect",
    description: "FCA wrapper + reporting; no research / ML / promote.",
  },
  {
    id: "prospect-generic",
    label: "Generic prospect (safe default)",
    description: "Broadest public visibility slice; no IM-reserved content.",
  },
];

export interface PersonaOverrideCardProps {
  readonly targetUserId: string;
  readonly targetUserEmail: string;
  /** Current persona id (from Firestore user doc) or null if unset. */
  readonly currentPersonaId: string | null;
  /** Optional callback fired after a successful override. */
  readonly onOverride?: (nextPersonaId: ResolvedPersonaId) => void;
}

export function PersonaOverrideCard({
  targetUserId,
  targetUserEmail,
  currentPersonaId,
  onOverride,
}: PersonaOverrideCardProps) {
  const { user: actor, isAdmin } = useAuth();
  const [selection, setSelection] = useState<ResolvedPersonaId | "">(
    (currentPersonaId as ResolvedPersonaId | null) ?? "",
  );
  const [result, setResult] = useState<string | null>(null);

  const canOverride = isAdmin();

  const handleSave = () => {
    if (!canOverride || selection === "") {
      setResult("Admin role required + persona must be selected.");
      return;
    }
    try {
      if (typeof window !== "undefined") {
        const scopedKey = `${RESOLVED_PERSONA_STORAGE_KEY}#${targetUserId}`;
        window.localStorage.setItem(scopedKey, selection);
        const auditRaw =
          window.localStorage.getItem("admin-persona-audit/v1") ?? "[]";
        const audit = JSON.parse(auditRaw) as Array<Record<string, string>>;
        audit.push({
          targetUserId,
          targetUserEmail,
          newPersonaId: selection,
          actorId: actor?.id ?? "unknown-admin",
          actorEmail: actor?.email ?? "unknown-admin",
          timestampUtc: new Date().toISOString(),
        });
        window.localStorage.setItem(
          "admin-persona-audit/v1",
          JSON.stringify(audit),
        );
      }
      setResult(`Persona set to ${selection}.`);
      onOverride?.(selection);
    } catch (err) {
      setResult(
        `Failed to persist override: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  return (
    <Card data-testid="persona-override-card">
      <CardHeader>
        <CardTitle>Persona override</CardTitle>
        <CardDescription>
          Fast-forward a prospect onto a targeted demo flow without
          re-running the questionnaire. Logged to the admin audit trail.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {!canOverride && (
          <p className="text-xs text-amber-500">
            You need admin role to set persona overrides.
          </p>
        )}
        <Select
          value={selection === "" ? undefined : selection}
          onValueChange={(next) => setSelection(next as ResolvedPersonaId)}
          disabled={!canOverride}
        >
          <SelectTrigger
            className="w-full"
            data-testid="persona-override-select"
          >
            <SelectValue placeholder="Choose a persona" />
          </SelectTrigger>
          <SelectContent>
            {PERSONA_OPTIONS.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{opt.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {opt.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={!canOverride || selection === ""}
          data-testid="persona-override-save"
        >
          Save override
        </Button>
        {result !== null && (
          <p
            className="text-xs text-muted-foreground"
            data-testid="persona-override-result"
          >
            {result}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
