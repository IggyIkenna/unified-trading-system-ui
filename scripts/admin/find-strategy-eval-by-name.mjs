#!/usr/bin/env node
/**
 * Search Firestore strategy_evaluations for submissions whose serialized
 * fields contain a given substring (name, email, strategy keyword).
 *
 * Usage:
 *   node scripts/admin/find-strategy-eval-by-name.mjs <project-id> <needle>
 *
 * Example:
 *   node scripts/admin/find-strategy-eval-by-name.mjs central-element-323112 desmond
 *   node scripts/admin/find-strategy-eval-by-name.mjs odum-staging "@example.com"
 *
 * Auth: ADC. Run `gcloud auth application-default login` once if needed.
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const project = process.argv[2];
const needle = (process.argv[3] ?? "").toLowerCase();
if (!project || !needle) {
  console.error("Usage: node find-strategy-eval-by-name.mjs <project-id> <needle>");
  process.exit(2);
}

const app = initializeApp({ credential: applicationDefault(), projectId: project }, project);
const db = getFirestore(app);

const snap = await db.collection("strategy_evaluations").get();
const matches = [];
snap.forEach((doc) => {
  const d = doc.data();
  const haystack = JSON.stringify(d).toLowerCase();
  if (haystack.includes(needle)) {
    matches.push({
      id: doc.id,
      email: d.email,
      leadResearcher: d.leadResearcher,
      strategyName: d.strategyName,
      engagementIntent: d.engagementIntent,
      submittedAt: d.submittedAt?.toDate?.()?.toISOString?.() ?? d.submittedAt,
      magicTokenPreview: d.magicToken ? `${String(d.magicToken).slice(0, 8)}…` : null,
    });
  }
});
console.log(`[${project}] total=${snap.size} matches=${matches.length} for "${needle}"`);
console.log(JSON.stringify(matches, null, 2));
process.exit(0);
