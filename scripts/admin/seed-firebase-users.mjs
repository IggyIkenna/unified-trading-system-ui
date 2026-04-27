/**
 * Seed Firebase Auth users with entitlement custom claims.
 *
 * Two modes:
 *   --env=prod     Create ONE admin user (ikenna@odum-research.com) in the prod Firebase project.
 *   --env=staging  Create ALL demo personas in the staging Firebase project with their
 *                  entitlements set as custom claims so auth works without the user-management-api.
 *
 * Claims structure: { entitlements: string[] | {domain,tier}[], role: string }
 * The firebase-provider.ts enrichUserFromBackend() reads `claims.entitlements` first —
 * if present, it short-circuits and skips all backend calls.
 *
 * Usage:
 *   node scripts/admin/seed-firebase-users.mjs --env=staging
 *   GOOGLE_CLOUD_PROJECT_ID=my-staging-project node scripts/admin/seed-firebase-users.mjs --env=staging
 *
 * Env vars:
 *   GOOGLE_CLOUD_PROJECT_ID — overrides the default project for the chosen env
 *   FIREBASE_PROD_PROJECT    — prod project ID (default: central-element-323112)
 *   FIREBASE_STAGING_PROJECT — staging project ID (default: same as prod until separate project exists)
 *
 * Requires ADC: gcloud auth application-default login
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import admin from "firebase-admin";

// Load env files for local dev
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

const ENV = process.argv.find((a) => a.startsWith("--env="))?.replace("--env=", "") ?? "staging";
if (ENV !== "prod" && ENV !== "staging") {
  console.error("Usage: node seed-firebase-users.mjs --env=prod|staging");
  process.exit(1);
}

const PROD_PROJECT = process.env.FIREBASE_PROD_PROJECT ?? "central-element-323112";
const STAGING_PROJECT = process.env.FIREBASE_STAGING_PROJECT ?? process.env.GOOGLE_CLOUD_PROJECT_ID ?? PROD_PROJECT;
const PROJECT_ID = ENV === "prod" ? PROD_PROJECT : STAGING_PROJECT;

console.log(`\nSeeding Firebase Auth — env: ${ENV}, project: ${PROJECT_ID}\n`);

// ── Prod: one real admin ──────────────────────────────────────────────────────
const PROD_USERS = [
  {
    email: "ikenna@odum-research.com",
    displayName: "Ikenna",
    // No password set here — admin uses Google SSO or must be created via Firebase console
    // with a real password. We only set custom claims.
    setPassword: false,
    claims: { role: "admin", entitlements: ["*"] },
  },
];

// ── Staging: all demo personas ────────────────────────────────────────────────
// Mirrors lib/auth/personas.ts — keep in sync manually.
// Entitlements are set as custom claims so firebase-provider.ts short-circuits
// backend calls; the user-management-api does not need to be running on staging.
const STAGING_USERS = [
  // Internal
  {
    email: "admin@odum.internal",
    displayName: "Admin",
    password: "demo123",
    claims: { role: "admin", entitlements: ["*"] },
  },
  {
    email: "trader@odum.internal",
    displayName: "Internal Trader",
    password: "demo123",
    claims: { role: "internal", entitlements: ["*"] },
  },
  {
    email: "desk@odum.internal",
    displayName: "IM Desk Operator",
    password: "demo123",
    claims: { role: "internal", entitlements: ["*"] },
  },
  // External advisor / IR (@odum-research.co.uk)
  {
    email: "admin@odum-research.co.uk",
    displayName: "Admin",
    password: "OdumIR2026!",
    claims: { role: "admin", entitlements: ["*"] },
  },
  {
    email: "investor@odum-research.co.uk",
    displayName: "Investor",
    password: "OdumIR2026!",
    claims: {
      role: "client",
      entitlements: [
        "investor-relations",
        "investor-board",
        "investor-plan",
        "investor-platform",
        "investor-im",
        "investor-regulatory",
        "investor-archive",
        "data-pro",
        "execution-full",
        "ml-full",
        "strategy-full",
        "reporting",
      ],
    },
  },
  {
    email: "advisor@odum-research.co.uk",
    displayName: "Strategic Advisor",
    password: "OdumIR2026!",
    claims: {
      role: "client",
      entitlements: [
        "investor-relations",
        "investor-board",
        "investor-plan",
        "data-pro",
        "execution-full",
        "ml-full",
        "strategy-full",
        "reporting",
      ],
    },
  },
  // External prospects (@odum-research.com)
  {
    email: "prospect-im@odum-research.com",
    displayName: "Investment Prospect",
    password: "demo123",
    claims: {
      role: "client",
      entitlements: ["investor-relations", "investor-im"],
    },
  },
  {
    email: "prospect-dart-full@odum-research.com",
    displayName: "DART Full Pipeline Prospect",
    password: "demo123",
    claims: {
      role: "client",
      entitlements: [
        "investor-relations",
        "investor-platform",
        "data-pro",
        "execution-full",
        "ml-full",
        "strategy-full",
        "reporting",
      ],
    },
  },
  {
    email: "prospect-dart-signals-in@odum-research.com",
    displayName: "DART Signals-In Prospect",
    password: "demo123",
    claims: {
      role: "client",
      entitlements: ["investor-relations", "investor-platform", "data-pro", "execution-full", "reporting"],
    },
  },
  {
    email: "prospect-odum-signals@odum-research.com",
    displayName: "Odum Signals Prospect",
    password: "demo123",
    claims: {
      role: "client",
      entitlements: ["investor-relations", "execution-full", "reporting"],
    },
  },
  {
    email: "prospect-regulatory@odum-research.com",
    displayName: "Regulatory Prospect",
    password: "demo123",
    claims: {
      role: "client",
      entitlements: ["investor-relations", "investor-regulatory", "reporting"],
    },
  },
  // External client demos
  {
    email: "pm@alphacapital.com",
    displayName: "Portfolio Manager",
    password: "demo123",
    claims: {
      role: "client",
      entitlements: ["data-pro", "execution-full", "ml-full", "strategy-full", "reporting"],
    },
  },
  {
    email: "analyst@betafund.com",
    displayName: "Data Analyst",
    password: "demo123",
    claims: { role: "client", entitlements: ["data-basic"] },
  },
  {
    email: "cio@vertex.com",
    displayName: "CIO",
    password: "demo123",
    claims: {
      role: "client",
      entitlements: ["data-pro", "execution-full", "strategy-full", "reporting"],
    },
  },
  {
    email: "patrick@bankelysium.com",
    displayName: "Patrick",
    password: "demo123",
    claims: {
      role: "client",
      entitlements: ["data-pro", "execution-full", "reporting"],
    },
  },
  {
    email: "sarah.quant@examplehedge.com",
    displayName: "Sarah Quant",
    password: "demo123",
    claims: {
      role: "client",
      entitlements: ["data-pro", "execution-full", "ml-full", "strategy-full", "reporting"],
    },
  },
  {
    email: "fm@emergingmgr.com",
    displayName: "Fund Manager",
    password: "demo123",
    claims: { role: "client", entitlements: ["reporting", "data-pro"] },
  },
  {
    email: "pm@lpfund.com",
    displayName: "Pooled-Fund LP",
    password: "demo123",
    claims: { role: "client", entitlements: ["reporting", "investor-relations"] },
  },
  {
    email: "cio@smaclient.com",
    displayName: "SMA CIO",
    password: "demo123",
    claims: { role: "client", entitlements: ["reporting", "investor-relations", "data-pro"] },
  },
  {
    email: "ops@defihf.com",
    displayName: "Signals-Only Ops Lead",
    password: "demo123",
    claims: { role: "client", entitlements: ["execution-full", "data-pro", "reporting"] },
  },
  {
    email: "cio@hybridfund.example",
    displayName: "IM-under-Regulatory CIO",
    password: "demo123",
    claims: { role: "client", entitlements: ["reporting", "investor-relations", "data-pro"] },
  },
  {
    email: "platform-prospect@odum-research.com",
    displayName: "Platform Prospect",
    password: "demo123",
    claims: {
      role: "client",
      entitlements: ["data-pro", "execution-full", "strategy-full", "reporting"],
    },
  },
  {
    email: "ops@desmond-capital.example",
    displayName: "Desmond Ops",
    password: "demo123",
    claims: {
      role: "client",
      entitlements: ["reporting", "investor-regulatory", "data-pro", "execution-full"],
    },
  },
  // ── Funnel Coherence walkthrough personas (Phase 5 / Workstream F) ─────
  // Mirror lib/auth/personas.ts demo-allocator + demo-investor-lp.
  {
    email: "demo-allocator@odum-research.co.uk",
    displayName: "Demo Allocator",
    password: "OdumIR2026!",
    claims: {
      role: "client",
      entitlements: ["reporting"],
    },
  },
  {
    email: "demo-investor-lp@odum-research.co.uk",
    displayName: "Demo Investor / LP",
    password: "OdumIR2026!",
    claims: {
      role: "client",
      entitlements: ["investor-relations", "reporting"],
    },
  },
  // ── Strategy-family entitlement personas (mirrors lib/auth/personas.ts) ─
  {
    email: "carry-basic@odum-research.co.uk",
    displayName: "Carry & Yield (Basic)",
    password: "demo123",
    claims: {
      role: "client",
      entitlements: ["data-pro", "execution-basic", "reporting", { family: "CARRY_AND_YIELD", tier: "basic" }],
    },
  },
  {
    email: "carry-premium@odum-research.co.uk",
    displayName: "Carry & Yield (Premium)",
    password: "demo123",
    claims: {
      role: "client",
      entitlements: [
        "data-pro",
        "execution-full",
        "ml-full",
        "reporting",
        { family: "CARRY_AND_YIELD", tier: "premium" },
      ],
    },
  },
];

async function upsertUser(auth, user) {
  let uid;
  try {
    const existing = await auth.getUserByEmail(user.email);
    uid = existing.uid;
    const updates = { displayName: user.displayName };
    if (user.password) updates.password = user.password;
    await auth.updateUser(uid, updates);
    console.log(`  updated  ${user.email} (${uid})`);
  } catch (err) {
    if (err.code === "auth/user-not-found") {
      const createArgs = {
        email: user.email,
        displayName: user.displayName,
        emailVerified: true,
      };
      if (user.password) createArgs.password = user.password;
      const created = await auth.createUser(createArgs);
      uid = created.uid;
      console.log(`  created  ${user.email} (${uid})`);
    } else {
      throw err;
    }
  }

  await auth.setCustomUserClaims(uid, user.claims);
  console.log(`  claims   ${JSON.stringify(user.claims)}`);
  return uid;
}

async function main() {
  if (!admin.apps.length) {
    admin.initializeApp({ projectId: PROJECT_ID });
  }
  const auth = admin.auth();

  const users = ENV === "prod" ? PROD_USERS : STAGING_USERS;
  let ok = 0;
  let failed = 0;

  for (const user of users) {
    try {
      await upsertUser(auth, user);
      ok++;
    } catch (err) {
      console.error(`  ERROR ${user.email}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone — ${ok} ok, ${failed} failed (project: ${PROJECT_ID})`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
