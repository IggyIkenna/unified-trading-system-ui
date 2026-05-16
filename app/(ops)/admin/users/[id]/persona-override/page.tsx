"use client";

/**
 * Admin persona-override page — Phase 4 `p4-persona-admin-override`.
 *
 * Lets an admin stamp a specific resolved persona onto a target user. Uses
 * the <PersonaOverrideCard> primitive. Audit-logged to
 * `localStorage['admin-persona-audit/v1']` in mock mode.
 *
 * Plan: `ui_unification_v2_sanitisation_2026_04_20.plan` § Phase 4.
 */

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { PersonaOverrideCard } from "@/components/admin/persona-override-card";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";

export default function PersonaOverridePage() {
  const params = useParams<{ id: string }>();
  const targetUserId = params?.id ?? "unknown-user";
  const [targetEmail, setTargetEmail] = useState<string>("");
  const [currentPersona, setCurrentPersona] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const email =
      window.localStorage.getItem(`mock-user-email#${targetUserId}`) ??
      `${targetUserId}@unknown.local`;
    setTargetEmail(email);
    const scopedKey = `odum-persona/v1#${targetUserId}`;
    setCurrentPersona(window.localStorage.getItem(scopedKey));
  }, [targetUserId]);

  return (
    <div className="space-y-6 p-6" data-testid="admin-persona-override-page">
      <Button variant="outline" size="sm" asChild>
        <Link href={`/ops/admin/users/${targetUserId}`}>
          <ArrowLeft className="size-4 mr-1" /> Back to user
        </Link>
      </Button>
      <PageHeader
        title="Persona override"
        description="Stamp this user with a specific resolved persona. Fast-forwards a prospect onto a targeted demo flow without re-running the questionnaire."
      />
      <PersonaOverrideCard
        targetUserId={targetUserId}
        targetUserEmail={targetEmail}
        currentPersonaId={currentPersona}
        onOverride={(next) => setCurrentPersona(next)}
      />
    </div>
  );
}
