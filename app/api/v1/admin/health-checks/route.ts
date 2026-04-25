/**
 * POST /api/v1/admin/health-checks — run a synthetic health pass.
 *
 * Native baseline: probes Auth + Firestore + Storage with a no-op call,
 * appends the outcome to health_check_runs, and returns the latest result.
 * No external SaaS pings yet — that comes in Phase 4 alongside the GitHub
 * + M365 wiring (where SaaS health is actually meaningful).
 */
import { NextResponse } from "next/server";

import { getAdminAuth, getAdminFirestore, getAdminStorage } from "@/lib/firebase-admin";
import { healthChecksCollection } from "@/lib/admin/server/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Probe {
  name: string;
  ok: boolean;
  latency_ms: number;
  detail?: string;
}

async function probeAuth(): Promise<Probe> {
  const start = Date.now();
  const auth = getAdminAuth();
  if (!auth) return { name: "auth", ok: false, latency_ms: 0, detail: "no admin auth" };
  try {
    await auth.listUsers(1);
    return { name: "auth", ok: true, latency_ms: Date.now() - start };
  } catch (err) {
    return { name: "auth", ok: false, latency_ms: Date.now() - start, detail: String(err) };
  }
}

async function probeFirestore(): Promise<Probe> {
  const start = Date.now();
  const db = getAdminFirestore();
  if (!db) return { name: "firestore", ok: false, latency_ms: 0, detail: "no admin firestore" };
  try {
    await db.collection("health_check_runs").limit(1).get();
    return { name: "firestore", ok: true, latency_ms: Date.now() - start };
  } catch (err) {
    return { name: "firestore", ok: false, latency_ms: Date.now() - start, detail: String(err) };
  }
}

async function probeStorage(): Promise<Probe> {
  const start = Date.now();
  const storage = getAdminStorage();
  if (!storage) return { name: "storage", ok: false, latency_ms: 0, detail: "no admin storage" };
  try {
    await storage.bucket().exists();
    return { name: "storage", ok: true, latency_ms: Date.now() - start };
  } catch (err) {
    return { name: "storage", ok: false, latency_ms: Date.now() - start, detail: String(err) };
  }
}

export async function POST() {
  const probes = await Promise.all([probeAuth(), probeFirestore(), probeStorage()]);
  const ok = probes.every((p) => p.ok);
  const now = new Date().toISOString();
  const ref = await healthChecksCollection().add({
    started_at: now,
    completed_at: now,
    status: ok ? "ok" : "degraded",
    probes,
  });
  return NextResponse.json({ id: ref.id, status: ok ? "ok" : "degraded", probes, run_at: now });
}
