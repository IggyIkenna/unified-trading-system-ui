"use client";

/**
 * Admin view of the questionnaire response filed by this organisation.
 *
 * Plan: unified-trading-pm/plans/active/reg_umbrella_questionnaire_and_onboarding_docs_2026_04_21.plan
 *
 * Joins the Firestore `/questionnaires` collection to the admin org detail
 * view by `submitted_by.email === org.contact_email` (primary) or
 * `submitted_by.firm_name === org.name` (fallback). Renders the 6 base axes
 * plus the 7 optional Reg-Umbrella axes. Handles three states:
 *   - loading (Firestore in flight)
 *   - empty (no questionnaire matching this org)
 *   - error (Firestore unreachable — mock mode or auth failure)
 */

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { firebaseDb } from "@/lib/admin/firebase";
import type {
  QuestionnaireEnvelope,
  QuestionnaireResponse,
} from "@/lib/questionnaire/types";

interface StoredQuestionnaire extends QuestionnaireResponse {
  readonly id: string;
  readonly submitted_by?: QuestionnaireEnvelope | null;
  readonly submittedAt?: { toDate: () => Date } | Date | string | null;
}

interface Props {
  readonly org: {
    readonly id: string;
    readonly name: string;
    readonly contact_email: string;
  };
}

type LoadState =
  | { readonly kind: "loading" }
  | { readonly kind: "ready"; readonly doc: StoredQuestionnaire | null }
  | { readonly kind: "error"; readonly message: string };

export function OrgQuestionnaireSection({ org }: Props) {
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        if (firebaseDb === null) {
          setState({
            kind: "error",
            message: "Firebase not configured (mock mode)",
          });
          return;
        }
        const { collection, getDocs, limit, orderBy, query, where } =
          await import("firebase/firestore");
        // Match on email first; fall back to firm_name if empty.
        const baseRef = collection(firebaseDb, "questionnaires");
        const primaryQuery = query(
          baseRef,
          where("submitted_by.email", "==", org.contact_email.toLowerCase()),
          orderBy("submittedAt", "desc"),
          limit(1),
        );
        let snap = await getDocs(primaryQuery);
        if (snap.empty && org.name) {
          const fallbackQuery = query(
            baseRef,
            where("submitted_by.firm_name", "==", org.name),
            orderBy("submittedAt", "desc"),
            limit(1),
          );
          snap = await getDocs(fallbackQuery);
        }
        if (cancelled) return;
        if (snap.empty) {
          setState({ kind: "ready", doc: null });
          return;
        }
        const first = snap.docs[0];
        const raw = first.data() as Omit<StoredQuestionnaire, "id">;
        setState({
          kind: "ready",
          doc: { id: first.id, ...raw },
        });
      } catch (err) {
        if (cancelled) return;
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [org.contact_email, org.name]);

  return (
    <Card data-testid="org-questionnaire-section">
      <CardHeader>
        <CardTitle className="text-base">Prospect questionnaire</CardTitle>
        <CardDescription>
          Answers this organisation submitted via the invite-gated
          /questionnaire page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {state.kind === "loading" && (
          <p className="text-sm text-muted-foreground" data-testid="org-questionnaire-loading">
            Loading questionnaire…
          </p>
        )}
        {state.kind === "error" && (
          <p className="text-sm text-muted-foreground" data-testid="org-questionnaire-error">
            Questionnaire unavailable ({state.message}). This is expected in
            mock mode or when Firebase isn&apos;t configured.
          </p>
        )}
        {state.kind === "ready" && state.doc === null && (
          <p className="text-sm text-muted-foreground" data-testid="org-questionnaire-empty">
            No questionnaire on file. The prospect hasn&apos;t filled out
            /questionnaire yet, or their envelope email didn&apos;t match this
            organisation.
          </p>
        )}
        {state.kind === "ready" && state.doc !== null && (
          <QuestionnaireAxes doc={state.doc} />
        )}
      </CardContent>
    </Card>
  );
}

function QuestionnaireAxes({ doc }: { doc: StoredQuestionnaire }) {
  const submittedAt = formatSubmittedAt(doc.submittedAt);

  const regUmbrellaVisible =
    doc.service_family === "RegUmbrella" || doc.service_family === "combo";

  const venueScope = useMemo(() => {
    if (doc.venue_scope === "all") return "all venues";
    if (Array.isArray(doc.venue_scope)) return doc.venue_scope.join(", ") || "—";
    return "—";
  }, [doc.venue_scope]);

  return (
    <dl className="grid grid-cols-[minmax(160px,200px)_1fr] gap-x-6 gap-y-2 text-sm">
      <DefEntry label="Submission" value={doc.id.slice(0, 12) + "…"} mono />
      {submittedAt && <DefEntry label="Submitted" value={submittedAt} />}
      {doc.submitted_by && (
        <DefEntry
          label="Submitted by"
          value={
            <span className="space-x-2">
              <span>{doc.submitted_by.email || "—"}</span>
              {doc.submitted_by.firm_name && (
                <Badge variant="outline" className="text-xs">
                  {doc.submitted_by.firm_name}
                </Badge>
              )}
            </span>
          }
        />
      )}

      <SectionHeading>Service</SectionHeading>
      <DefEntry label="Service family" value={doc.service_family ?? "—"} />
      <DefEntry label="Fund structure" value={Array.isArray(doc.fund_structure) ? (doc.fund_structure as string[]).join(", ") || "—" : (doc.fund_structure ?? "—")} />

      <SectionHeading>Coverage</SectionHeading>
      <DefEntry label="Categories" value={listOrDash(doc.categories)} />
      <DefEntry label="Instrument types" value={listOrDash(doc.instrument_types)} />
      <DefEntry label="Venue scope" value={venueScope} />
      <DefEntry label="Strategy styles" value={listOrDash(doc.strategy_style)} />

      {regUmbrellaVisible && (
        <>
          <SectionHeading>Regulatory Umbrella details</SectionHeading>
          <DefEntry
            label="Licence region"
            value={doc.licence_region ?? "—"}
          />
          <DefEntry
            label="Entity jurisdiction"
            value={doc.entity_jurisdiction ?? "—"}
          />
          <DefEntry
            label="Operating currencies"
            value={listOrDash(doc.supported_currencies)}
          />
          <DefEntry
            label="Own MLRO"
            value={
              doc.own_mlro === true
                ? "Yes — firm appoints own MLRO"
                : doc.own_mlro === false
                  ? "No — consumes Odum MLRO"
                  : "Unsure / not answered"
            }
          />
          <DefEntry label="Targets — 3 months" value={doc.targets_3mo ?? "—"} multiline />
          <DefEntry label="Targets — 1 year" value={doc.targets_1yr ?? "—"} multiline />
          <DefEntry label="Targets — 2 years" value={doc.targets_2yr ?? "—"} multiline />
        </>
      )}
    </dl>
  );
}

function DefEntry({
  label,
  value,
  mono,
  multiline,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  multiline?: boolean;
}) {
  return (
    <>
      <dt className="text-xs font-medium text-muted-foreground pt-0.5">{label}</dt>
      <dd
        className={[
          mono ? "font-mono text-xs" : "",
          multiline ? "whitespace-pre-wrap" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {value}
      </dd>
    </>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="col-span-2 pt-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b pb-1">
      {children}
    </h3>
  );
}

function listOrDash(xs: readonly string[] | undefined): string {
  if (!xs || xs.length === 0) return "—";
  return xs.join(", ");
}

function formatSubmittedAt(
  value: StoredQuestionnaire["submittedAt"],
): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toLocaleString("en-GB");
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.valueOf())) return value;
    return parsed.toLocaleString("en-GB");
  }
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toLocaleString("en-GB");
  }
  return null;
}
