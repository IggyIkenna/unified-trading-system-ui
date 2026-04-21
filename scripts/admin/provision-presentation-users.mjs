/**
 * Provision Firebase Auth users for investor relations presentations.
 *
 * Creates users and grants them app_entitlements with the right capabilities
 * so they can log in to the trading system UI and see only the presentations
 * they're entitled to.
 *
 * Usage:
 *   node scripts/provision-presentation-users.mjs
 *
 * Requires:
 *   - Firebase Admin SDK (ADC or service account)
 *   - GOOGLE_CLOUD_PROJECT_ID env var (or defaults to central-element-323112)
 *
 * Users created:
 *   investor@odum-research.co.uk   — all presentations + demos
 *   advisor@odum-research.co.uk    — board + plan decks only
 *   prospect-im@odum-research.co.uk       — investment management deck + demo
 *   prospect-platform@odum-research.co.uk  — platform deck + demos + data/execution
 *   prospect-regulatory@odum-research.co.uk — regulatory deck + demos + reporting
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import admin from "firebase-admin";

// Load env files
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

const FIREBASE_PROJECT_ID =
  process.env.GOOGLE_CLOUD_PROJECT_ID || "central-element-323112";
const APP_ID = "unified-trading-system-ui";

const USERS = [
  {
    email: "investor@odum-research.co.uk",
    displayName: "Investor",
    password: "OdumIR2026!",
    capabilities: [
      "investor.view",
      "investor.board",
      "investor.plan",
      "investor.platform",
      "investor.im",
      "investor.regulatory",
      "data.view",
      "data.subscribe",
      "trading.view",
      "reports.view",
      "reports.export",
      "research.view",
    ],
    role: "viewer",
    description:
      "Full investor relations access — all 5 presentations plus platform demos",
  },
  {
    email: "advisor@odum-research.co.uk",
    displayName: "Strategic Advisor",
    password: "OdumAdvisor2026!",
    capabilities: [
      "investor.view",
      "investor.board",
      "investor.plan",
      "data.view",
      "trading.view",
      "reports.view",
    ],
    role: "viewer",
    description: "Strategic advisor — board and plan presentations plus demos",
  },
  {
    email: "prospect-im@odum-research.co.uk",
    displayName: "Investment Prospect",
    password: "OdumIM2026!",
    capabilities: [
      "investor.view",
      "investor.im",
      "trading.view",
      "reports.view",
      "reports.export",
    ],
    role: "viewer",
    description:
      "Investment management prospect — IM presentation plus reporting demos",
  },
  {
    email: "prospect-platform@odum-research.co.uk",
    displayName: "Platform Prospect",
    password: "OdumPlatform2026!",
    capabilities: [
      "investor.view",
      "investor.platform",
      "data.view",
      "data.subscribe",
      "trading.view",
      "trading.execute",
      "research.view",
      "reports.view",
      "reports.export",
    ],
    role: "viewer",
    description:
      "Platform prospect — platform presentation plus data/execution/research/reporting demos",
  },
  {
    email: "prospect-regulatory@odum-research.co.uk",
    displayName: "Regulatory Prospect",
    password: "OdumReg2026!",
    capabilities: [
      "investor.view",
      "investor.regulatory",
      "reports.view",
      "reports.export",
    ],
    role: "viewer",
    description:
      "Regulatory prospect — regulatory presentation plus reporting/compliance demos",
  },
];

async function main() {
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: FIREBASE_PROJECT_ID });
  }
  const auth = admin.auth();
  const db = admin.firestore();

  const now = new Date().toISOString();

  for (const user of USERS) {
    console.log(`\n--- ${user.email} ---`);

    // 1. Create or get Firebase Auth user
    let uid;
    try {
      const existing = await auth.getUserByEmail(user.email);
      uid = existing.uid;
      console.log(`  Auth user exists: ${uid}`);
      // Update password in case it changed
      await auth.updateUser(uid, {
        password: user.password,
        displayName: user.displayName,
      });
      console.log(`  Updated password and display name`);
    } catch (err) {
      if (err.code === "auth/user-not-found") {
        const created = await auth.createUser({
          email: user.email,
          password: user.password,
          displayName: user.displayName,
          emailVerified: true,
        });
        uid = created.uid;
        console.log(`  Created auth user: ${uid}`);
      } else {
        throw err;
      }
    }

    // 2. Create or update app_entitlement in Firestore
    const existing = await db
      .collection("app_entitlements")
      .where("app_id", "==", APP_ID)
      .where("subject_type", "==", "user")
      .where("subject_id", "==", uid)
      .limit(1)
      .get();

    if (!existing.empty) {
      const doc = existing.docs[0];
      await doc.ref.set(
        {
          role: user.role,
          capabilities: user.capabilities,
          subject_label: user.displayName,
          granted_by: "provision-presentation-users",
          updated_at: now,
        },
        { merge: true },
      );
      console.log(`  Updated entitlement: ${doc.id}`);
      console.log(`  Capabilities: ${user.capabilities.join(", ")}`);
    } else {
      const docRef = await db.collection("app_entitlements").add({
        app_id: APP_ID,
        subject_type: "user",
        subject_id: uid,
        subject_label: user.displayName,
        role: user.role,
        capabilities: user.capabilities,
        environments: ["production", "staging"],
        granted_by: "provision-presentation-users",
        expires_at: null,
        created_at: now,
        updated_at: now,
      });
      console.log(`  Created entitlement: ${docRef.id}`);
      console.log(`  Capabilities: ${user.capabilities.join(", ")}`);
    }

    console.log(`  Description: ${user.description}`);
  }

  console.log("\n=== Summary ===");
  console.log("Credentials to share:\n");
  for (const user of USERS) {
    console.log(`  ${user.displayName}`);
    console.log(`    Email: ${user.email}`);
    console.log(`    Password: ${user.password}`);
    console.log(`    Access: ${user.description}`);
    console.log("");
  }
  console.log(
    "Login URL: https://odum-research.com/login?redirect=/investor-relations",
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
