#!/usr/bin/env node
/**
 * Audit current admin-claim state on prod Firebase Auth and surface the
 * Workspace (@odum-research.com) accounts that DO/DON'T exist, so we can
 * decide who keeps admin, who loses it, and who needs to be invited.
 *
 * Read-only.
 */
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const project = "central-element-323112";
const app = initializeApp({ credential: applicationDefault(), projectId: project }, project);
const auth = getAuth(app);

const wantedWorkspace = [
  "ikenna@odum-research.com",
  "harshkantariya@odum-research.com",
  "harsh@odum-research.com",
  "femi@odum-research.com",
  "femi.amoo@odum-research.com",
];

let pageToken;
const all = [];
do {
  const res = await auth.listUsers(1000, pageToken);
  all.push(...res.users);
  pageToken = res.pageToken;
} while (pageToken);

console.log(`=== Total Firebase Auth users on ${project}: ${all.length} ===\n`);

console.log("=== Current admins (role:admin OR admin:true OR entitlements.admin:true) ===");
const admins = all.filter((u) => {
  const c = u.customClaims ?? {};
  return c.admin === true || c.role === "admin" || c.entitlements?.admin === true;
});
for (const u of admins) {
  console.log(`  ${u.email.padEnd(40)} uid=${u.uid}  claims=${JSON.stringify(u.customClaims ?? {})}`);
}

console.log("\n=== @odum-research.com accounts (any) ===");
const workspace = all.filter((u) => (u.email ?? "").endsWith("@odum-research.com"));
for (const u of workspace) {
  console.log(`  ${u.email.padEnd(40)} uid=${u.uid}  claims=${JSON.stringify(u.customClaims ?? {})}`);
}

console.log("\n=== Wanted workspace admins — exists? ===");
for (const email of wantedWorkspace) {
  const hit = all.find((u) => (u.email ?? "").toLowerCase() === email.toLowerCase());
  console.log(
    `  ${email.padEnd(40)} ${hit ? `EXISTS uid=${hit.uid} claims=${JSON.stringify(hit.customClaims ?? {})}` : "NOT FOUND"}`,
  );
}

console.log("\n=== Admins to STRIP (personal-gmail, per operator decree) ===");
const STRIP_LIST = [
  "femi.amoo@gmail.com",
  "femi.amoo3@gmail.com",
  "shaunlimx@gmail.com",
  "harshkantariya.work@gmail.com",
];
for (const email of STRIP_LIST) {
  const hit = all.find((u) => (u.email ?? "").toLowerCase() === email);
  console.log(
    `  ${email.padEnd(40)} ${hit ? `EXISTS uid=${hit.uid} claims=${JSON.stringify(hit.customClaims ?? {})}` : "NOT FOUND"}`,
  );
}
process.exit(0);
