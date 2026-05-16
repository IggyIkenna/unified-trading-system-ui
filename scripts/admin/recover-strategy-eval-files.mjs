#!/usr/bin/env node
/**
 * Recover strategy_evaluations file refs whose `path === "stale"` (lost-blob
 * symptom) by matching them against actual objects in the Firebase Storage
 * bucket and rewriting the Firestore ref to point at the real upload.
 *
 * Background: prior to the stale-blob fix, file picks were re-hydrated from
 * localStorage with dead `blob:` URLs. On submit, only files freshly picked
 * in the same session were uploaded; everything else was saved with
 * `path: "stale"` and `url: ""`. Bytes for earlier picks often did land in
 * the bucket under `strategy-evaluations/{draftSubmissionId}/{fieldKey}/`,
 * just never wired back into Firestore.
 *
 * Usage:
 *   node scripts/admin/recover-strategy-eval-files.mjs <project> <eval-id>          # dry-run
 *   node scripts/admin/recover-strategy-eval-files.mjs <project> <eval-id> --apply  # mutate
 *
 * Auth: ADC. The signed-in principal needs Firestore + Storage Admin on the
 * project.
 */
import { randomUUID } from "crypto";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const project = process.argv[2];
const evalId = process.argv[3];
const apply = process.argv.includes("--apply");
if (!project || !evalId) {
  console.error("Usage: node recover-strategy-eval-files.mjs <project> <eval-id> [--apply]");
  process.exit(2);
}

const STORAGE_BUCKET_BY_PROJECT = {
  "central-element-323112": "central-element-323112.appspot.com",
  "odum-staging": "odum-staging.appspot.com",
};
const storageBucket = STORAGE_BUCKET_BY_PROJECT[project];
if (!storageBucket) {
  console.error(`No storage bucket mapped for project "${project}". Edit STORAGE_BUCKET_BY_PROJECT.`);
  process.exit(2);
}

const FILE_FIELDS = ["backtestMethodologyDoc", "assumptionsDoc", "tearSheet", "tradeLogCsv", "equityCurveCsv"];

const app = initializeApp({ credential: applicationDefault(), projectId: project, storageBucket });
const db = getFirestore(app);
const bucket = getStorage(app).bucket();

const evalRef = db.collection("strategy_evaluations").doc(evalId);
const evalSnap = await evalRef.get();
if (!evalSnap.exists) {
  console.error(`No strategy_evaluations/${evalId}`);
  process.exit(1);
}
const data = evalSnap.data();
const draftId = data.draftSubmissionId;
console.log(`Eval: ${evalId}`);
console.log(`Email: ${data.email}`);
console.log(`Lead:  ${data.leadResearcher}`);
console.log(`Draft: ${draftId}`);
console.log(`Mode:  ${apply ? "APPLY (will mutate Firestore + Storage metadata)" : "DRY-RUN"}`);
console.log("");

if (!draftId) {
  console.error("strategy_evaluations doc has no draftSubmissionId — cannot locate uploads.");
  process.exit(1);
}

const updates = {};
const report = [];

for (const field of FILE_FIELDS) {
  const ref = data[field];
  if (!ref || typeof ref !== "object") {
    report.push({ field, action: "skip (no ref)" });
    continue;
  }
  if (ref.path !== "stale") {
    report.push({ field, action: `skip (path=${ref.path})` });
    continue;
  }

  const prefix = `strategy-evaluations/${draftId}/${field}/`;
  const [files] = await bucket.getFiles({ prefix });
  if (files.length === 0) {
    report.push({ field, action: "LOST — no bucket objects", expected: ref.filename, size: ref.size });
    continue;
  }

  // Best match: same filename + same size. Fall back to most recent by the
  // ${Date.now()}- prefix encoded in the object name (newest = likely the
  // final fresh pick the user made before the blob went stale).
  const candidates = files.map((f) => ({
    f,
    name: f.name,
    size: Number(f.metadata?.size ?? 0),
    basename: f.name.split("/").pop(),
    ts: parseInt(String(f.name.split("/").pop()).split("-")[0] ?? "0", 10),
  }));
  const exact = candidates.find((c) => c.size === ref.size && c.basename?.endsWith(ref.filename));
  const newest = candidates.slice().sort((a, b) => b.ts - a.ts)[0];
  const chosen = exact ?? newest;
  const matchKind = exact ? "exact (name+size)" : "fallback (newest in field)";

  // Build a Firebase-style download URL by stamping a download token into
  // the object metadata. Matches the URL shape the client SDK produces, so
  // the existing admin view <a href={url}> works unchanged.
  const token = randomUUID();
  const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(chosen.name)}?alt=media&token=${token}`;
  const newRef = {
    path: chosen.name,
    url: downloadUrl,
    filename: chosen.basename?.replace(/^\d+-/, "") ?? ref.filename,
    size: chosen.size,
    contentType: ref.contentType,
    uploadedAt: ref.uploadedAt,
  };
  updates[field] = newRef;
  report.push({
    field,
    action: `RECOVER (${matchKind})`,
    from: { filename: ref.filename, size: ref.size },
    to: { path: chosen.name, filename: newRef.filename, size: chosen.size },
    token,
  });

  if (apply) {
    await chosen.f.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } });
  }
}

console.log(JSON.stringify(report, null, 2));
const recoverable = report.filter((r) => r.action.startsWith("RECOVER")).length;
const lost = report.filter((r) => r.action.startsWith("LOST")).length;
console.log(`\nSummary: ${recoverable} recoverable, ${lost} lost, ${FILE_FIELDS.length - recoverable - lost} skipped.`);

if (Object.keys(updates).length === 0) {
  console.log("\nNothing to write.");
  process.exit(0);
}

if (!apply) {
  console.log("\nRe-run with --apply to write these refs to Firestore.");
  process.exit(0);
}

await evalRef.update(updates);
console.log(`\nWrote ${Object.keys(updates).length} field(s) to strategy_evaluations/${evalId}.`);
process.exit(0);
