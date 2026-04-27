#!/usr/bin/env node
/**
 * Wait for the Firebase Auth emulator to be reachable, then run the staging
 * seed (idempotent upsert). Spawned by scripts/dev-tiers.sh's firebase-local
 * branch so personas exist on every startup without depending on
 * `--export-on-exit` having captured state during the previous shutdown.
 *
 * Skips re-seeding if the auth emulator already has users (cheap GET against
 * the emulator REST API). Safe to run repeatedly.
 */

import { spawnSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const AUTH_HOST = process.env.FIREBASE_AUTH_EMULATOR_HOST ?? "localhost:9099";
const PROJECT_ID = process.env.FIREBASE_STAGING_PROJECT ?? "odum-local-dev";
const MAX_WAIT_MS = 60_000;
const POLL_INTERVAL_MS = 500;

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_SCRIPT = resolve(__dirname, "seed-firebase-users.mjs");

async function emulatorReady() {
  try {
    const res = await fetch(`http://${AUTH_HOST}/`);
    return res.status < 500;
  } catch {
    return false;
  }
}

async function emulatorHasUsers() {
  try {
    const res = await fetch(
      `http://${AUTH_HOST}/identitytoolkit.googleapis.com/v1/projects/${PROJECT_ID}/accounts:query`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer owner",
        },
        body: JSON.stringify({ returnUserInfo: true, limit: 1 }),
      },
    );
    if (!res.ok) return false;
    const body = await res.json();
    return Array.isArray(body.userInfo) && body.userInfo.length > 0;
  } catch {
    return false;
  }
}

async function main() {
  process.stdout.write(`[seed] waiting for auth emulator at ${AUTH_HOST}…\n`);
  const start = Date.now();
  while (Date.now() - start < MAX_WAIT_MS) {
    if (await emulatorReady()) break;
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  if (!(await emulatorReady())) {
    console.error(`[seed] auth emulator never came up at ${AUTH_HOST}`);
    process.exit(1);
  }

  if (await emulatorHasUsers()) {
    process.stdout.write(`[seed] users already present (imported from previous export) — skipping seed\n`);
    return;
  }

  process.stdout.write(`[seed] running staging seed against project ${PROJECT_ID}…\n`);
  const result = spawnSync(process.execPath, [SEED_SCRIPT, "--env=staging"], {
    stdio: "inherit",
    env: {
      ...process.env,
      FIREBASE_AUTH_EMULATOR_HOST: AUTH_HOST,
      FIREBASE_STAGING_PROJECT: PROJECT_ID,
    },
  });
  if (result.status !== 0) {
    console.error(`[seed] seed-firebase-users.mjs exited ${result.status}`);
    process.exit(result.status ?? 1);
  }
  process.stdout.write(`[seed] done\n`);
}

main().catch((err) => {
  console.error("[seed] error:", err);
  process.exit(1);
});
