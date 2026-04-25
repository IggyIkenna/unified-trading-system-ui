/**
 * Strategy Evaluation form — server-component shell.
 *
 * The wizard form itself is a client component (StrategyEvaluationFormClient
 * in ./_client). This shell resolves either:
 *   - `?token=...` → a magic-link refile from a previously-submitted entry
 *     (looks up `strategy_evaluations` by magicToken)
 *   - `?draft=email@...` → a resume-link from a saved draft
 *     (looks up `strategy_evaluation_drafts` by SHA-256(email))
 * and bakes the prior payload into the initial render via props. No client
 * fetch, no race, no flash of empty fields.
 *
 * `force-dynamic` ensures a fresh resolve on every request.
 */

import { createHash } from "node:crypto";
import admin from "firebase-admin";
import StrategyEvaluationFormClient from "./_client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function getAdminApp(): admin.app.App {
  if (admin.apps.length > 0) {
    const existing = admin.apps[0];
    if (existing) return existing;
  }
  return admin.initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

async function loadByToken(token: string): Promise<Record<string, unknown> | null> {
  if (!token || token.length < 16) return null;
  try {
    const app = getAdminApp();
    const db = admin.firestore(app);
    const snap = await db.collection("strategy_evaluations").where("magicToken", "==", token).limit(1).get();
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    const data = docSnap.data();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { magicToken: _t, submittedAt: _s, emailVerifiedAt: _v, ...rest } = data;
    return { id: docSnap.id, ...rest };
  } catch (err) {
    console.error("[strategy-evaluation/page] loadByToken failed", err);
    return null;
  }
}

async function loadDraftByEmail(email: string): Promise<Record<string, unknown> | null> {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  try {
    const app = getAdminApp();
    const db = admin.firestore(app);
    const docId = createHash("sha256").update(email.trim().toLowerCase()).digest("hex").slice(0, 32);
    const snap = await db.collection("strategy_evaluation_drafts").doc(docId).get();
    if (!snap.exists) return null;
    const data = snap.data() ?? {};
    const payload = data.payload as Record<string, unknown> | undefined;
    return payload ?? null;
  } catch (err) {
    console.error("[strategy-evaluation/page] loadDraftByEmail failed", err);
    return null;
  }
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[]; draft?: string | string[] }>;
}) {
  const params = await searchParams;
  const tokenRaw = params.token;
  const token = Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw;
  const draftRaw = params.draft;
  const draftEmail = Array.isArray(draftRaw) ? draftRaw[0] : draftRaw;

  // Token wins over draft — a magic-link refile from a submitted entry takes
  // priority. If no token, try the draft-resume path keyed off email.
  let initialData: Record<string, unknown> | null = null;
  if (token) {
    initialData = await loadByToken(token);
  } else if (draftEmail) {
    initialData = await loadDraftByEmail(draftEmail);
  }
  return <StrategyEvaluationFormClient initialData={initialData} initialToken={token ?? null} />;
}
