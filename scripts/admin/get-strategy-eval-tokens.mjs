#!/usr/bin/env node
/**
 * Print full magic tokens + summary for every strategy_evaluations
 * submission belonging to a given email address.
 *
 * Usage:
 *   node scripts/admin/get-strategy-eval-tokens.mjs <project-id> <email>
 *
 * Example:
 *   node scripts/admin/get-strategy-eval-tokens.mjs central-element-323112 desmondhw@gmail.com
 *
 * Output is the prospect's self-edit URL for each submission:
 *   <site>/strategy-evaluation?token=<magicToken>
 *
 * Auth: ADC. Run `gcloud auth application-default login` once if needed.
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const project = process.argv[2];
const email = process.argv[3];
if (!project || !email) {
  console.error("Usage: node get-strategy-eval-tokens.mjs <project-id> <email>");
  process.exit(2);
}

const SITE_URL_BY_PROJECT = {
  "central-element-323112": "https://www.odum-research.com",
  "odum-staging": "https://uat.odum-research.com",
};
const siteUrl = SITE_URL_BY_PROJECT[project] ?? "";

const app = initializeApp({ credential: applicationDefault(), projectId: project }, project);
const db = getFirestore(app);
const snap = await db.collection("strategy_evaluations").where("email", "==", email).get();

const out = [];
snap.forEach((doc) => {
  const d = doc.data();
  out.push({
    id: doc.id,
    magicToken: d.magicToken,
    selfEditUrl: siteUrl && d.magicToken ? `${siteUrl}/strategy-evaluation?token=${d.magicToken}` : null,
    submittedAt: d.submittedAt?.toDate?.()?.toISOString?.() ?? d.submittedAt,
    strategyName: d.strategyName,
    engagementIntent: d.engagementIntent,
    fields: Object.keys(d).length,
    hasFiles: !!(d.tearSheet || d.tradeLogCsv || d.equityCurveCsv || d.backtestMethodologyDoc || d.assumptionsDoc),
  });
});
console.log(`[${project}] email=${email} matches=${out.length}`);
console.log(JSON.stringify(out, null, 2));
process.exit(0);
