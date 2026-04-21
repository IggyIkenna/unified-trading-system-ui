/**
 * G1.10 — Admin playback of questionnaire submissions.
 *
 * Lists all documents from the Firestore `questionnaires` collection.
 * Each row shows the 6-axis response + submission timestamp. Clicking
 * a row reveals the raw JSON + a "seed demo session" magic-link helper
 * (Wave E stub — G2.x wires the real Firebase custom-token minting).
 *
 * SSOT schema: unified-api-contracts/.../restriction_profiles.py
 *              QuestionnaireResponse (6 axes).
 * Public-side submit: unified-trading-system-ui/app/(public)/questionnaire/page.tsx
 *
 * Operator directive 2026-04-20: "Firebase IS the API — no
 * user-management-api repo." Reads use the same client SDK as this UI
 * already uses for auth.
 */

"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

import { firebaseDb } from "@/lib/admin/firebase";

interface QuestionnaireDoc {
  readonly id: string;
  readonly categories?: readonly string[];
  readonly instrument_types?: readonly string[];
  readonly venue_scope?: readonly string[] | "all";
  readonly strategy_style?: readonly string[];
  readonly service_family?: string;
  readonly fund_structure?: string;
  readonly submittedAt?: { toDate: () => Date } | null;
}

function seedDemoUrl(doc: QuestionnaireDoc): string {
  // G1.10 stub — sales operator opens this URL to seed a demo session
  // with the prospect's responses. G2.x will mint a Firebase custom
  // token; today it's a query-param seed readable by the target UI's
  // demo-provider.
  const params = new URLSearchParams({
    submissionId: doc.id,
    service_family: doc.service_family ?? "DART",
  });
  return `/seed-demo?${params.toString()}`;
}

export default function QuestionnairesAdminPage() {
  const [rows, setRows] = useState<QuestionnaireDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
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
    void run();
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-6 py-8" data-testid="questionnaires-admin-page">
      <h1 className="text-2xl font-semibold">Prospect questionnaires</h1>
      <p className="mt-1 text-slate-500">
        Submissions from the public `/questionnaire` flow. Replay any row to preview the
        prospect&apos;s restriction profile pre-demo.
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
          No submissions yet. When prospects submit `/questionnaire`, their responses land
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
              <th className="py-2 pr-4">Service family</th>
              <th className="py-2 pr-4">Categories</th>
              <th className="py-2 pr-4">Strategy style</th>
              <th className="py-2 pr-4">Fund structure</th>
              <th className="py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b align-top" data-testid={`questionnaire-row-${row.id}`}>
                <td className="py-2 pr-4 font-mono text-xs">{row.id.slice(0, 8)}…</td>
                <td className="py-2 pr-4">{row.service_family ?? "—"}</td>
                <td className="py-2 pr-4">{(row.categories ?? []).join(", ") || "—"}</td>
                <td className="py-2 pr-4">
                  {(row.strategy_style ?? []).join(", ") || "—"}
                </td>
                <td className="py-2 pr-4">{row.fund_structure ?? "—"}</td>
                <td className="py-2">
                  <a
                    href={seedDemoUrl(row)}
                    className="text-blue-600 underline"
                    data-testid={`seed-demo-${row.id}`}
                  >
                    Seed demo
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
