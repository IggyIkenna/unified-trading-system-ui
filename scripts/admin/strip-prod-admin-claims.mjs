#!/usr/bin/env node
/**
 * Strip role:admin custom claim from a list of Firebase Auth users on prod.
 * Idempotent — running twice is a no-op once the claim is gone.
 *
 * Pass --confirm to actually mutate; otherwise dry-run prints the diff.
 *
 * Why custom-claims-only: Firebase doesn't store passwords retrievably and
 * we never want to delete the user account itself (just demote). Removing
 * the role:admin claim is the auth-side action; downstream UI gating reads
 * the claim out of the ID token on next refresh (within 1h, or immediately
 * if the user signs out/in).
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const project = "central-element-323112";
const STRIP_LIST = (process.argv[2] ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);
const CONFIRM = process.argv.includes("--confirm");

if (STRIP_LIST.length === 0) {
  console.error("Usage: node strip-prod-admin-claims.mjs <comma-separated-emails> [--confirm]");
  process.exit(2);
}

const app = initializeApp({ credential: applicationDefault(), projectId: project }, project);
const auth = getAuth(app);

console.log(`=== Strip plan (${CONFIRM ? "WRITE" : "DRY-RUN"}) project=${project} ===`);
for (const email of STRIP_LIST) {
  const u = await auth.getUserByEmail(email).catch(() => null);
  if (!u) {
    console.log(`  ${email.padEnd(40)} NOT FOUND — skipping`);
    continue;
  }
  const before = u.customClaims ?? {};
  const after = { ...before };
  delete after.role;
  delete after.admin;
  if (after.entitlements && Array.isArray(after.entitlements)) {
    after.entitlements = after.entitlements.filter((e) => e !== "*" && e !== "admin");
    if (after.entitlements.length === 0) delete after.entitlements;
  }
  console.log(`  ${email.padEnd(40)} BEFORE=${JSON.stringify(before)}  AFTER=${JSON.stringify(after)}`);
  if (CONFIRM) {
    await auth.setCustomUserClaims(u.uid, after);
    await auth.revokeRefreshTokens(u.uid);
    console.log(`    ✓ updated + refresh tokens revoked (forces re-auth)`);
  }
}
process.exit(0);
