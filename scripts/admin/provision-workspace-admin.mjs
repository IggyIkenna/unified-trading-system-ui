#!/usr/bin/env node
/**
 * Provision a Firebase Auth user for a workspace email and set the custom
 * claims that grant admin access. Generates a password-reset link the
 * operator can forward so the new admin sets their own password.
 *
 * Usage:
 *   node scripts/admin/provision-workspace-admin.mjs <project-id> <email> <super|full> [--confirm]
 *
 * Examples:
 *   node scripts/admin/provision-workspace-admin.mjs central-element-323112 femi@odum-research.com super
 *   node scripts/admin/provision-workspace-admin.mjs central-element-323112 harsh@odum-research.com full --confirm
 *
 * Tier mapping:
 *   super → role:admin, entitlements:["*"], superAdmin:true   (can grant admin to others, full IAM)
 *   full  → role:admin, entitlements:["*"], superAdmin:false  (everything except admin-grant surfaces)
 *
 * The `superAdmin` flag is a marker for code-level gates added later
 * (e.g. /api/admin/set-claims could require it). Until that gate ships,
 * Firebase-level UI access is identical for super vs full.
 *
 * Idempotent: re-running on an existing user updates claims + revokes
 * refresh tokens (forces re-auth on next call). Does NOT reset password
 * unless --reset-password is passed.
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const project = process.argv[2];
const email = process.argv[3]?.toLowerCase();
const tier = process.argv[4];
const CONFIRM = process.argv.includes("--confirm");
const RESET_PASSWORD = process.argv.includes("--reset-password");

if (!project || !email || !tier) {
  console.error(
    "Usage: node provision-workspace-admin.mjs <project-id> <email> <super|full> [--confirm] [--reset-password]",
  );
  process.exit(2);
}
if (!email.endsWith("@odum-research.com")) {
  console.error(`Refusing — admin email must end with @odum-research.com (got: ${email})`);
  process.exit(2);
}
if (tier !== "super" && tier !== "full") {
  console.error(`Tier must be "super" or "full" (got: ${tier})`);
  process.exit(2);
}

const app = initializeApp({ credential: applicationDefault(), projectId: project }, project);
const auth = getAuth(app);

const claims = {
  role: "admin",
  entitlements: ["*"],
  superAdmin: tier === "super",
  source: `workspace-provisioned-${new Date().toISOString().slice(0, 10)}`,
};

console.log(`=== Provision plan (${CONFIRM ? "WRITE" : "DRY-RUN"}) project=${project} ===`);
console.log(`  Email: ${email}`);
console.log(`  Tier:  ${tier}`);
console.log(`  Claims: ${JSON.stringify(claims)}`);

const existing = await auth.getUserByEmail(email).catch(() => null);
if (existing) {
  console.log(`\n  EXISTS uid=${existing.uid}`);
  console.log(`  Current claims: ${JSON.stringify(existing.customClaims ?? {})}`);
  console.log(`  Action: update claims (idempotent)`);
} else {
  console.log(`\n  NOT FOUND — will create user`);
  console.log(`  Action: create + set claims + generate password-reset link`);
}

if (!CONFIRM) {
  console.log(`\n  (dry-run; pass --confirm to execute)`);
  process.exit(0);
}

let uid;
if (existing) {
  uid = existing.uid;
} else {
  const created = await auth.createUser({
    email,
    emailVerified: false,
    displayName: email.split("@")[0],
    disabled: false,
  });
  uid = created.uid;
  console.log(`\n  ✓ Created user uid=${uid}`);
}

await auth.setCustomUserClaims(uid, claims);
await auth.revokeRefreshTokens(uid);
console.log(`  ✓ Claims set; refresh tokens revoked`);

const wantsResetLink = !existing || RESET_PASSWORD;
if (wantsResetLink) {
  // No continueUrl — uses Firebase-hosted action handler at
  // <project>.firebaseapp.com/__/auth/action which is always whitelisted.
  // Custom continue URLs need to be added under Firebase Auth → Settings →
  // Authorized domains in the console. Default URL is friendlier for ops
  // until that's set up.
  const link = await auth.generatePasswordResetLink(email);
  console.log(`\n  ✓ Password-reset link (forward to ${email}):`);
  console.log(`    ${link}`);
}

console.log(
  `\n  Done. They sign in at https://${project === "central-element-323112" ? "www" : "uat"}.odum-research.com/login`,
);
process.exit(0);
