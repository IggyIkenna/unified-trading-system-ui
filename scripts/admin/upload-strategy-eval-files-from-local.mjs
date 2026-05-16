#!/usr/bin/env node
/**
 * Operator workflow: prospect submitted a strategy evaluation whose file
 * refs are `path: "stale"` (lost-blob symptom), the operator has the
 * original files locally, and we want to wire them into Firestore + Storage
 * as if the original submit had succeeded.
 *
 * For each file field on the eval, looks for a local file named exactly
 * what Firestore claims (`{filename}`) in `<local-dir>`. If found, uploads
 * to `strategy-evaluations/{draftSubmissionId}/{field}/{ts}-{filename}`,
 * stamps a Firebase download token into metadata, and rewrites the
 * Firestore ref. Size mismatches are warned but accepted (operator
 * presumably has the canonical copy).
 *
 * Usage:
 *   node scripts/admin/upload-strategy-eval-files-from-local.mjs <project> <eval-id> <local-dir>          # dry-run
 *   node scripts/admin/upload-strategy-eval-files-from-local.mjs <project> <eval-id> <local-dir> --apply
 */
import { randomUUID } from "crypto";
import { readFileSync, statSync, existsSync } from "fs";
import { join } from "path";
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

const project = process.argv[2];
const evalId = process.argv[3];
const localDir = process.argv[4];
const apply = process.argv.includes("--apply");
if (!project || !evalId || !localDir) {
  console.error("Usage: node upload-strategy-eval-files-from-local.mjs <project> <eval-id> <local-dir> [--apply]");
  process.exit(2);
}

const STORAGE_BUCKET_BY_PROJECT = {
  "central-element-323112": "central-element-323112.appspot.com",
  "odum-staging": "odum-staging.appspot.com",
};
const storageBucket = STORAGE_BUCKET_BY_PROJECT[project];
if (!storageBucket) {
  console.error(`No storage bucket mapped for project "${project}".`);
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
console.log(`Eval:      ${evalId}`);
console.log(`Email:     ${data.email}`);
console.log(`Draft:     ${draftId}`);
console.log(`Local dir: ${localDir}`);
console.log(`Mode:      ${apply ? "APPLY (will upload + mutate Firestore)" : "DRY-RUN"}`);
console.log("");

if (!draftId) {
  console.error("Eval has no draftSubmissionId.");
  process.exit(1);
}

const updates = {};
const report = [];

for (const field of FILE_FIELDS) {
  const ref = data[field];
  if (!ref || typeof ref !== "object" || !ref.filename) {
    report.push({ field, action: "skip (no ref / no filename)" });
    continue;
  }
  const localPath = join(localDir, ref.filename);
  if (!existsSync(localPath)) {
    report.push({ field, action: "skip (not found locally)", expected: ref.filename });
    continue;
  }
  const stat = statSync(localPath);
  const sizeMatch = ref.size && stat.size === ref.size;
  const sizeNote = sizeMatch ? "size OK" : `size mismatch (firestore=${ref.size}, local=${stat.size})`;

  const objectPath = `strategy-evaluations/${draftId}/${field}/${Date.now()}-${ref.filename}`;
  const token = randomUUID();
  const downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;
  const newRef = {
    path: objectPath,
    url: downloadUrl,
    filename: ref.filename,
    size: stat.size,
    contentType: ref.contentType || "application/octet-stream",
    uploadedAt: new Date().toISOString(),
  };
  updates[field] = newRef;
  report.push({ field, action: "UPLOAD", localPath, sizeNote, path: objectPath });

  if (apply) {
    const buf = readFileSync(localPath);
    await bucket.file(objectPath).save(buf, {
      contentType: newRef.contentType,
      metadata: { metadata: { firebaseStorageDownloadTokens: token } },
    });
  }
}

console.log(JSON.stringify(report, null, 2));
const uploaded = report.filter((r) => r.action === "UPLOAD").length;
console.log(`\nSummary: ${uploaded} to upload, ${FILE_FIELDS.length - uploaded} skipped.`);

if (Object.keys(updates).length === 0) {
  console.log("\nNothing to write.");
  process.exit(0);
}
if (!apply) {
  console.log("\nRe-run with --apply to upload + rewrite Firestore.");
  process.exit(0);
}
await evalRef.update(updates);
console.log(`\nWrote ${Object.keys(updates).length} field(s) to strategy_evaluations/${evalId}.`);
process.exit(0);
