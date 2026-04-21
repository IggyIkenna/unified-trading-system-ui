/**
 * Grant or update a user entitlement for an application (mirrors POST /api/v1/apps/:appId/entitlements).
 * Requires Firebase Admin credentials (same as other maintenance scripts).
 *
 * Usage:
 *   node scripts/grant-app-entitlement.mjs <email> <app_id> <role>
 *
 * Example:
 *   node scripts/grant-app-entitlement.mjs user@example.com unified-trading-system-ui admin
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

const ROLES = ["viewer", "editor", "admin", "owner"];

async function main() {
  const email = process.argv[2];
  const appId = process.argv[3];
  const role = process.argv[4];
  if (!email || !appId || !role) {
    console.error(
      "Usage: node scripts/grant-app-entitlement.mjs <email> <app_id> <role>",
    );
    process.exit(1);
  }
  if (!ROLES.includes(role)) {
    console.error(`role must be one of: ${ROLES.join(", ")}`);
    process.exit(1);
  }

  if (!admin.apps.length) {
    admin.initializeApp({ projectId: FIREBASE_PROJECT_ID });
  }
  const auth = admin.auth();
  const db = admin.firestore();

  const userRecord = await auth.getUserByEmail(email);
  const uid = userRecord.uid;
  const subjectLabel = userRecord.displayName || email;

  const appRef = db.collection("applications").doc(appId);
  const appDoc = await appRef.get();
  if (!appDoc.exists) {
    console.error(`Application not registered: ${appId}. Seed apps first (POST /api/v1/apps/seed).`);
    process.exit(1);
  }
  const appData = appDoc.data() || {};
  const environments = appData.environments || [];

  const existing = await db
    .collection("app_entitlements")
    .where("app_id", "==", appId)
    .where("subject_type", "==", "user")
    .where("subject_id", "==", uid)
    .limit(1)
    .get();

  const now = new Date().toISOString();

  if (!existing.empty) {
    const doc = existing.docs[0];
    await doc.ref.set(
      {
        role,
        capabilities: doc.data().capabilities || [],
        environments: doc.data().environments?.length ? doc.data().environments : environments,
        subject_label: subjectLabel,
        granted_by: "script",
        updated_at: now,
      },
      { merge: true },
    );
    const updated = await doc.ref.get();
    console.log(JSON.stringify({ ok: true, updated: true, id: doc.id, ...updated.data() }, null, 2));
    return;
  }

  const docRef = await db.collection("app_entitlements").add({
    app_id: appId,
    subject_type: "user",
    subject_id: uid,
    subject_label: subjectLabel,
    role,
    capabilities: [],
    environments,
    granted_by: "script",
    expires_at: null,
    created_at: now,
    updated_at: now,
  });
  const created = await docRef.get();
  console.log(JSON.stringify({ ok: true, created: true, id: docRef.id, ...created.data() }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
