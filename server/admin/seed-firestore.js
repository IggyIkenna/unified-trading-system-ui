/**
 * Seed Firestore with applications and app_capabilities data.
 *
 * Usage:
 *   node server/seed-firestore.js
 *   node server/seed-firestore.js --grant-admin <uid>
 *
 * The --grant-admin flag creates an app_entitlement for the given UID
 * with admin role on every registered application.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import admin from "firebase-admin";

const __dirname = dirname(fileURLToPath(import.meta.url));

const FIREBASE_PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT_ID || "central-element-323112";
const FIREBASE_STORAGE_BUCKET =
  process.env.FIREBASE_STORAGE_BUCKET || `${FIREBASE_PROJECT_ID}.appspot.com`;

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: FIREBASE_PROJECT_ID,
    storageBucket: FIREBASE_STORAGE_BUCKET,
  });
}

const firestore = admin.firestore();

const apps = JSON.parse(
  readFileSync(resolve(__dirname, "seeds/applications.initial.json"), "utf8"),
);
const capabilities = JSON.parse(
  readFileSync(
    resolve(__dirname, "seeds/app-capabilities.initial.json"),
    "utf8",
  ),
);

async function seedApplications() {
  console.log(`Seeding ${apps.length} applications...`);
  const batch = firestore.batch();
  const now = new Date().toISOString();
  for (const app of apps) {
    const ref = firestore.collection("applications").doc(app.app_id);
    batch.set(
      ref,
      { ...app, status: "active", created_at: now, updated_at: now },
      { merge: true },
    );
  }
  await batch.commit();
  console.log("  Applications seeded.");
}

async function seedCapabilities() {
  console.log(`Seeding ${capabilities.length} app_capabilities...`);
  const batch = firestore.batch();
  const now = new Date().toISOString();
  for (const cap of capabilities) {
    const ref = firestore.collection("app_capabilities").doc(cap.app_id);
    batch.set(ref, { ...cap, updated_at: now }, { merge: true });
  }
  await batch.commit();
  console.log("  Capabilities seeded.");
}

async function grantAdmin(uid) {
  console.log(`Granting admin on all apps to UID: ${uid}`);
  const now = new Date().toISOString();
  for (const app of apps) {
    const existing = await firestore
      .collection("app_entitlements")
      .where("app_id", "==", app.app_id)
      .where("subject_type", "==", "user")
      .where("subject_id", "==", uid)
      .limit(1)
      .get();
    if (!existing.empty) {
      await existing.docs[0].ref.set(
        {
          role: "admin",
          environments: ["dev", "staging", "prod"],
          updated_at: now,
        },
        { merge: true },
      );
      console.log(`  Updated ${app.app_id} → admin`);
    } else {
      await firestore.collection("app_entitlements").add({
        app_id: app.app_id,
        subject_type: "user",
        subject_id: uid,
        subject_label: "Admin (seeded)",
        role: "admin",
        environments: ["dev", "staging", "prod"],
        granted_by: "seed-script",
        created_at: now,
        updated_at: now,
      });
      console.log(`  Created ${app.app_id} → admin`);
    }
  }

  await admin
    .auth()
    .setCustomUserClaims(uid, { role: "admin", source: "seed" });
  await firestore
    .collection("user_profiles")
    .doc(uid)
    .set(
      { status: "active", role: "admin", last_modified: now },
      { merge: true },
    );
  console.log("  Admin claims and profile set.");
}

async function main() {
  await seedApplications();
  await seedCapabilities();

  const grantIdx = process.argv.indexOf("--grant-admin");
  if (grantIdx !== -1 && process.argv[grantIdx + 1]) {
    await grantAdmin(process.argv[grantIdx + 1]);
  }

  console.log("Done.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
