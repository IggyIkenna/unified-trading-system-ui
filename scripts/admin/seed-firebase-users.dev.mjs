/**
 * seed-firebase-users.dev.mjs
 *
 * Dev-only persona seed for the local Firebase Emulator Suite. Lives
 * separately from `seed-firebase-users.mjs` so personas you invent for
 * local debugging never accidentally land on staging or prod.
 *
 * Edit DEV_PERSONAS below to add fixtures for whatever flow you're
 * working on (pagination at scale, specific entitlement combos, the
 * weird 5-character UID edge case…).
 *
 * The script targets the local emulator only — refuses to run unless
 * FIRESTORE_EMULATOR_HOST and FIREBASE_AUTH_EMULATOR_HOST are set,
 * which `npm run emulators:seed:dev` does for you. Belt-and-braces:
 * even with `npm run emulators:seed:dev` the project ID is
 * `odum-local-dev` (placeholder, never resolves to real GCP) so a
 * misconfiguration can't write to staging / prod.
 *
 * SSOT: codex/14-playbooks/authentication/firebase-local.md
 */
import admin from "firebase-admin";

const HAS_EMULATOR = process.env.FIREBASE_AUTH_EMULATOR_HOST && process.env.FIRESTORE_EMULATOR_HOST;
if (!HAS_EMULATOR) {
  console.error(
    "ERROR: This dev-only seed must run against the local emulator. Set FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST, or use 'npm run emulators:seed:dev'.",
  );
  process.exit(1);
}

const PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "odum-local-dev";
admin.initializeApp({ projectId: PROJECT });
const auth = admin.auth();
const db = admin.firestore();

/** Add personas here for whatever local-only test scenario you're working on. */
const DEV_PERSONAS = [
  // {
  //   email: "edge-case-no-entitlements@local.dev",
  //   password: "demo123",
  //   displayName: "Empty Entitlements User",
  //   claims: { role: "client", entitlements: [] },
  //   profile: { status: "active", company: "Local Dev Co" },
  // },
  // {
  //   email: "huge-claims@local.dev",
  //   password: "demo123",
  //   displayName: "Huge Claims User",
  //   claims: { role: "admin", entitlements: ["*"] },
  //   profile: { status: "active" },
  // },
];

async function main() {
  if (DEV_PERSONAS.length === 0) {
    console.log("(no personas defined — edit scripts/admin/seed-firebase-users.dev.mjs to add some)");
    return;
  }
  console.log(`\nSeeding ${DEV_PERSONAS.length} dev personas — project: ${PROJECT}\n`);
  let ok = 0;
  let fail = 0;
  for (const p of DEV_PERSONAS) {
    try {
      let user;
      try {
        user = await auth.createUser({
          email: p.email,
          password: p.password ?? "demo123",
          displayName: p.displayName ?? p.email,
          disabled: false,
        });
      } catch (err) {
        if (String(err.code) === "auth/email-already-exists") {
          user = await auth.getUserByEmail(p.email);
        } else throw err;
      }
      if (p.claims) await auth.setCustomUserClaims(user.uid, p.claims);
      if (p.profile) {
        const now = new Date().toISOString();
        await db
          .collection("user_profiles")
          .doc(user.uid)
          .set(
            {
              id: user.uid,
              email: p.email,
              name: p.displayName ?? p.email,
              ...p.profile,
              last_modified: now,
            },
            { merge: true },
          );
      }
      console.log(`  ok   ${p.email} (${user.uid})`);
      ok += 1;
    } catch (err) {
      console.log(`  ERROR ${p.email}: ${String(err)}`);
      fail += 1;
    }
  }
  console.log(`\nDone — ${ok} ok, ${fail} failed (project: ${PROJECT})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
