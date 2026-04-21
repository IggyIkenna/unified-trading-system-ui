/**
 * One-off: set password, admin role + claims, and merge a complete user_profiles doc.
 * Requires Application Default Credentials (gcloud auth application-default login) or
 * GOOGLE_APPLICATION_CREDENTIALS to a service account with Firebase Admin + Firestore.
 *
 * Usage:
 *   node scripts/bootstrap-admin-user.mjs <email> <newPassword> [displayName]
 *
 * Env:
 *   GOOGLE_CLOUD_PROJECT_ID — Firebase project (default: central-element-323112)
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import admin from "firebase-admin";

for (const envFile of [".env.development", ".env.local", ".env"]) {
  try {
    const contents = readFileSync(resolve(envFile), "utf8");
    for (const line of contents.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* optional */
  }
}

const FIREBASE_PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID || "central-element-323112";

/**
 * Full admin-permission set. SSOT: codex/14-playbooks/cross-cutting/admin-permissions.md.
 * Bootstrap admins (ikenna + femi seed users) get the full set explicitly — even
 * though `hasAdminPermission` would pass them through anyway on a missing claim,
 * the explicit claim future-proofs against a change in fallback behaviour and
 * makes the grant visible in audit logs.
 */
const ALL_ADMIN_PERMISSIONS = [
  "admin:grant_role",
  "admin:create_org",
  "admin:lock_strategy",
  "admin:impersonate",
  "admin:rotate_secret",
  "admin:modify_user",
  "admin:offboard_user",
  "admin:view_audit",
  "admin:manage_apps",
  "admin:manage_entitlements",
];

function roleNeedsSlack(role) {
  return role !== "shareholder";
}
function roleNeedsGithub(role) {
  return role === "admin" || role === "collaborator";
}
function roleNeedsM365(role) {
  const collaboratorM365Enabled = String(process.env.COLLABORATOR_M365_ENABLED || "true") === "true";
  return (
    role === "admin" ||
    role === "accounting" ||
    role === "operations" ||
    (collaboratorM365Enabled && role === "collaborator")
  );
}
function roleNeedsCloud(role) {
  return role === "admin" || role === "collaborator";
}
function serviceApplicability(role) {
  return {
    github: roleNeedsGithub(role),
    slack: roleNeedsSlack(role),
    microsoft365: roleNeedsM365(role),
    gcp: roleNeedsCloud(role),
    aws: roleNeedsCloud(role),
    portal: true,
  };
}
function getDefaultServicesForUser(role, status) {
  if (status === "offboarded") {
    return {
      github: "not_applicable",
      slack: "not_applicable",
      microsoft365: "not_applicable",
      gcp: "not_applicable",
      aws: "not_applicable",
      portal: "not_applicable",
    };
  }
  const applicability = serviceApplicability(role);
  return {
    github: applicability.github ? "pending" : "not_applicable",
    slack: applicability.slack ? "pending" : "not_applicable",
    microsoft365: applicability.microsoft365 ? "pending" : "not_applicable",
    gcp: applicability.gcp ? "pending" : "not_applicable",
    aws: applicability.aws ? "pending" : "not_applicable",
    portal: applicability.portal ? "pending" : "not_applicable",
  };
}

function titleCaseLocalPart(local) {
  if (!local) return "User";
  return local.charAt(0).toUpperCase() + local.slice(1);
}

async function main() {
  const email = process.argv[2] || process.env.TARGET_EMAIL;
  const newPassword = process.argv[3] || process.env.TARGET_PASSWORD;
  const displayNameArg = process.argv[4] || process.env.TARGET_DISPLAY_NAME;

  if (!email || !newPassword) {
    console.error(
      "Usage: node scripts/bootstrap-admin-user.mjs <email> <newPassword> [displayName]",
    );
    process.exit(1);
  }

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: FIREBASE_PROJECT_ID });
  }
  const auth = admin.auth();
  const db = admin.firestore();

  const userRecord = await auth.getUserByEmail(email);
  const uid = userRecord.uid;
  const localPart = email.split("@")[0] || "user";
  const name = displayNameArg || titleCaseLocalPart(localPart);

  await auth.updateUser(uid, {
    password: newPassword,
    displayName: name,
    email,
  });

  const existing = (await db.collection("user_profiles").doc(uid).get()).data() || {};
  const now = new Date().toISOString();
  const role = "admin";
  const status = "active";
  const services = {
    ...(existing.services || {}),
    ...getDefaultServicesForUser(role, status),
  };

  const profile = {
    ...existing,
    id: existing.id || uid,
    name,
    email,
    role,
    github_handle: existing.github_handle ?? localPart,
    microsoft_upn: existing.microsoft_upn ?? email,
    slack_handle: existing.slack_handle ?? localPart,
    gcp_email: existing.gcp_email ?? email,
    product_slugs: Array.isArray(existing.product_slugs) ? existing.product_slugs : [],
    status,
    provisioned_at: existing.provisioned_at || now,
    last_modified: now,
    services,
    service_synced_at: existing.service_synced_at || {},
  };

  await db.collection("user_profiles").doc(uid).set(profile, { merge: true });

  const prevClaims = userRecord.customClaims || {};
  await auth.setCustomUserClaims(uid, {
    ...prevClaims,
    role,
    admin_permissions: ALL_ADMIN_PERMISSIONS,
    source: "unified-trading-system-ui",
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        uid,
        email,
        role,
        admin_permissions: ALL_ADMIN_PERMISSIONS,
        project: FIREBASE_PROJECT_ID,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
