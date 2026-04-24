/**
 * G1.10 — Admin playback of questionnaire submissions.
 *
 * Lists all documents from the Firestore `questionnaires` collection.
 * Each row shows the 6-axis response + submission timestamp + a
 * "Grant entitlements" button that resolves the persona from the response
 * and writes to Firestore `app_entitlements/{email}` so the prospect can
 * log in with the correct platform surface pre-provisioned.
 *
 * SSOT schema: unified-api-contracts/.../restriction_profiles.py
 *              QuestionnaireResponse (6 axes + 7 Reg-Umbrella axes).
 * Persona catalogue: lib/auth/personas.ts
 * Persona resolver: lib/questionnaire/resolve-persona.ts
 * Public-side submit: app/(public)/questionnaire/page.tsx
 */

"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDocs, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";

import { firebaseDb } from "@/lib/admin/firebase";
import { getFirebaseAuth } from "@/lib/auth/firebase-config";
import { getPersonaById, PERSONAS } from "@/lib/auth/personas";
import {
  RESOLVED_PERSONA_TO_AUTH_ID,
  resolvePersonaFromQuestionnaire,
} from "@/lib/questionnaire/resolve-persona";
import type { QuestionnaireResponse } from "@/lib/questionnaire/types";

interface QuestionnaireDoc {
  readonly id: string;
  readonly categories?: readonly string[];
  readonly instrument_types?: readonly string[];
  readonly venue_scope?: readonly string[] | "all";
  readonly strategy_style?: readonly string[];
  readonly service_family?: string;
  readonly fund_structure?: string;
  readonly submittedAt?: { toDate: () => Date } | null;
  readonly submitted_by?: {
    readonly email?: string;
    readonly firm_name?: string;
    readonly access_code_fingerprint?: string;
  } | null;
}

interface OrgLookupEntry {
  readonly id: string;
  readonly name: string;
  readonly contact_email: string;
}

function seedDemoUrl(doc: QuestionnaireDoc): string {
  const params = new URLSearchParams({
    submissionId: doc.id,
    service_family: doc.service_family ?? "DART",
  });
  return `/seed-demo?${params.toString()}`;
}

/** Cast a raw Firestore doc to the QuestionnaireResponse shape for the resolver. */
function toResolverInput(d: QuestionnaireDoc): QuestionnaireResponse {
  return {
    categories: (d.categories ?? []) as QuestionnaireResponse["categories"],
    instrument_types: (d.instrument_types ?? []) as QuestionnaireResponse["instrument_types"],
    venue_scope: d.venue_scope ?? "all",
    strategy_style: (d.strategy_style ?? []) as QuestionnaireResponse["strategy_style"],
    service_family: (d.service_family ?? "DART") as QuestionnaireResponse["service_family"],
    fund_structure: (Array.isArray(d.fund_structure) ? d.fund_structure : d.fund_structure ? [d.fund_structure] : []) as QuestionnaireResponse["fund_structure"],
  };
}

/** Derive the persona label and entitlements for a questionnaire doc. */
function resolveGrant(d: QuestionnaireDoc): {
  resolvedId: string;
  authId: string;
  label: string;
  entitlements: readonly (string | { domain: string; tier: string })[];
} | null {
  try {
    const resolved = resolvePersonaFromQuestionnaire(toResolverInput(d));
    const authId = RESOLVED_PERSONA_TO_AUTH_ID[resolved];
    const persona = getPersonaById(authId);
    if (!persona) return null;
    return {
      resolvedId: resolved,
      authId,
      label: persona.displayName,
      entitlements: persona.entitlements,
    };
  } catch {
    return null;
  }
}

function GrantButton({ row }: { row: QuestionnaireDoc }) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const email = row.submitted_by?.email;
  const grant = resolveGrant(row);

  if (!email || !grant) {
    return (
      <span className="text-[10px] text-muted-foreground italic">
        {!email ? "No email" : "Unresolvable"}
      </span>
    );
  }

  const handleGrant = async () => {
    if (!firebaseDb) {
      setStatus("error");
      setErrorMsg("Firebase not configured");
      return;
    }
    setStatus("loading");
    try {
      // 1. Write entitlements to Firestore — works whether the user exists in
      //    Firebase Auth yet or not. Picked up on their next sign-in.
      const safeKey = email.toLowerCase().replace(/[^a-z0-9@._-]/g, "_");
      await setDoc(
        doc(firebaseDb, "app_entitlements", safeKey),
        {
          email: email.toLowerCase(),
          resolved_persona_id: grant.resolvedId,
          auth_persona_id: grant.authId,
          persona_label: grant.label,
          entitlements: grant.entitlements,
          questionnaire_doc_id: row.id,
          granted_at: serverTimestamp(),
        },
        { merge: true },
      );

      // 2. Also write as Firebase custom claims via Admin SDK so the claims are
      //    baked into the user's token (stronger than a Firestore read). Fails
      //    silently if the user hasn't signed up yet — Firestore fallback covers that.
      try {
        const auth = getFirebaseAuth();
        const callerToken = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
        if (callerToken) {
          await fetch("/api/admin/set-claims", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${callerToken}`,
            },
            body: JSON.stringify({
              targetEmail: email,
              entitlements: grant.entitlements,
              personaId: grant.resolvedId,
            }),
          });
        }
      } catch {
        // Custom claims are best-effort; Firestore write above is the durable path.
      }

      setStatus("done");
    } catch (e) {
      setStatus("error");
      setErrorMsg(e instanceof Error ? e.message : String(e));
    }
  };

  if (status === "done") {
    return (
      <span className="text-[10px] text-emerald-600 font-medium">
        ✓ Granted — {grant.resolvedId}
      </span>
    );
  }
  if (status === "error") {
    return (
      <span className="text-[10px] text-red-500" title={errorMsg}>
        Error (hover)
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={status === "loading"}
      onClick={() => void handleGrant()}
      className="text-emerald-700 underline text-[11px] disabled:opacity-50"
      title={`Grant ${grant.resolvedId} → ${grant.entitlements.length} entitlements to ${email}`}
    >
      {status === "loading" ? "Granting…" : `Grant (${grant.resolvedId})`}
    </button>
  );
}

export default function QuestionnairesAdminPage() {
  const [rows, setRows] = useState<QuestionnaireDoc[]>([]);
  const [orgLookup, setOrgLookup] = useState<Map<string, OrgLookupEntry>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        if (firebaseDb === null) {
          setError("Firebase not configured (mock mode)");
          return;
        }
        const q = query(
          collection(firebaseDb, "questionnaires"),
          orderBy("submittedAt", "desc"),
        );
        const snap = await getDocs(q);
        const docs = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<QuestionnaireDoc, "id">),
        }));
        setRows(docs);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };
    const loadOrgs = async () => {
      try {
        const res = await fetch("/api/auth/provisioning/organizations");
        if (!res.ok) return;
        const data = (await res.json()) as {
          organizations?: ReadonlyArray<{
            id: string;
            name: string;
            contact_email: string;
          }>;
        };
        const map = new Map<string, OrgLookupEntry>();
        for (const org of data.organizations ?? []) {
          if (org.contact_email) {
            map.set(org.contact_email.toLowerCase(), {
              id: org.id,
              name: org.name,
              contact_email: org.contact_email,
            });
          }
          if (org.name) {
            map.set(`firm::${org.name.toLowerCase()}`, {
              id: org.id,
              name: org.name,
              contact_email: org.contact_email,
            });
          }
        }
        setOrgLookup(map);
      } catch {
        /* mock / offline */
      }
    };
    void run();
    void loadOrgs();
  }, []);

  const resolveOrg = (doc: QuestionnaireDoc): OrgLookupEntry | null => {
    const email = doc.submitted_by?.email?.toLowerCase();
    if (email && orgLookup.has(email)) return orgLookup.get(email) ?? null;
    const firm = doc.submitted_by?.firm_name?.toLowerCase();
    if (firm && orgLookup.has(`firm::${firm}`)) {
      return orgLookup.get(`firm::${firm}`) ?? null;
    }
    return null;
  };

  return (
    <main className="mx-auto max-w-6xl px-6 py-8" data-testid="questionnaires-admin-page">
      <h1 className="text-2xl font-semibold">Prospect questionnaires</h1>
      <p className="mt-1 text-slate-500">
        Submissions from the public <code>/questionnaire</code> flow. Use{" "}
        <strong>Grant</strong> to write entitlements to Firestore so the prospect can sign in
        with the correct platform surface. The resolved persona is derived from their responses
        using the same logic as the live restriction-profile engine.
      </p>

      {loading && (
        <p className="mt-8" data-testid="questionnaires-loading">
          Loading submissions…
        </p>
      )}
      {error !== null && (
        <p className="mt-8 text-red-700" data-testid="questionnaires-error">
          Error: {error}
        </p>
      )}
      {!loading && error === null && rows.length === 0 && (
        <p className="mt-8" data-testid="questionnaires-empty">
          No submissions yet. When prospects submit <code>/questionnaire</code>, their responses land
          here.
        </p>
      )}

      {rows.length > 0 && (
        <table
          className="mt-8 w-full border-collapse text-sm"
          data-testid="questionnaires-table"
        >
          <thead>
            <tr className="border-b text-left">
              <th className="py-2 pr-4">Submission</th>
              <th className="py-2 pr-4">Submitted by</th>
              <th className="py-2 pr-4">Service family</th>
              <th className="py-2 pr-4">Categories</th>
              <th className="py-2 pr-4">Strategy style</th>
              <th className="py-2 pr-4">Fund structure</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const org = resolveOrg(row);
              const email = row.submitted_by?.email;
              const firmName = row.submitted_by?.firm_name;
              return (
                <tr key={row.id} className="border-b align-top" data-testid={`questionnaire-row-${row.id}`}>
                  <td className="py-2 pr-4 font-mono text-xs">{row.id.slice(0, 8)}…</td>
                  <td className="py-2 pr-4 text-xs">
                    {email || firmName ? (
                      <span className="block">
                        <span className="font-medium">{email ?? "—"}</span>
                        {firmName && (
                          <span className="block text-muted-foreground">{firmName}</span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="py-2 pr-4">{row.service_family ?? "—"}</td>
                  <td className="py-2 pr-4">{(row.categories ?? []).join(", ") || "—"}</td>
                  <td className="py-2 pr-4">
                    {(row.strategy_style ?? []).join(", ") || "—"}
                  </td>
                  <td className="py-2 pr-4">{row.fund_structure ?? "—"}</td>
                  <td className="py-2 space-x-3">
                    <a
                      href={seedDemoUrl(row)}
                      className="text-blue-600 underline"
                      data-testid={`seed-demo-${row.id}`}
                    >
                      Seed demo
                    </a>
                    <GrantButton row={row} />
                    {org && (
                      <a
                        href={`/admin/organizations/${org.id}`}
                        className="text-blue-600 underline"
                        data-testid={`view-org-${row.id}`}
                      >
                        View org
                      </a>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </main>
  );
}
