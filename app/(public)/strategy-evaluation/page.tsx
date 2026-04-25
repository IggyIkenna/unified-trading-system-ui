/**
 * Strategy Evaluation form — server-component shell.
 *
 * The wizard form itself is a client component (StrategyEvaluationFormClient
 * in ./_client). When the URL carries `?token=...`, this shell resolves the
 * token to the prior Firestore submission via the Admin SDK and passes the
 * payload as a prop. That guarantees the client component initialises with
 * the prefilled data on the very first render — no fetch race, no flash of
 * empty fields, no edge-cache hydration bug.
 *
 * `force-dynamic` ensures a fresh resolve on every request so the bake-in is
 * always current.
 */

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

async function loadInitialData(token: string): Promise<Record<string, unknown> | null> {
  if (!token || token.length < 16) return null;
  try {
    const app = getAdminApp();
    const db = admin.firestore(app);
    const snap = await db.collection("strategy_evaluations").where("magicToken", "==", token).limit(1).get();
    if (snap.empty) return null;
    const docSnap = snap.docs[0];
    const data = docSnap.data();
    // Strip the magicToken from the payload — the URL already has it; no need
    // to ship it twice. Other server-only fields (submittedAt timestamp shape)
    // would confuse deserializeState, so coerce to plain JSON-friendly shapes.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { magicToken: _t, submittedAt: _s, emailVerifiedAt: _v, ...rest } = data;
    return { id: docSnap.id, ...rest };
  } catch (err) {
    console.error("[strategy-evaluation/page] loadInitialData failed", err);
    return null;
  }
}

export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const params = await searchParams;
  const tokenRaw = params.token;
  const token = Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw;
  const initialData = token ? await loadInitialData(token) : null;
  return <StrategyEvaluationFormClient initialData={initialData} initialToken={token ?? null} />;
}
