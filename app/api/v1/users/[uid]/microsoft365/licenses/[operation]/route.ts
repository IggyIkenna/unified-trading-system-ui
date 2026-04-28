/**
 * POST /api/v1/users/:uid/microsoft365/licenses/:operation
 *  - operation: "assign" | "unassign"
 *  - body:      { licenses: string[] }   // SKU IDs
 *
 * Calls Microsoft Graph POST /users/{upn}/assignLicense with the addLicenses
 * or removeLicenses array filled appropriately. Falls back to Firestore-only
 * mirror when MS_GRAPH_* are unset.
 */
import { NextRequest, NextResponse } from "next/server";

import { isPlatformAdmin, verifyCaller } from "@/lib/admin/server/auth-context";
import { usersCollection, writeAuditEntry } from "@/lib/admin/server/collections";
import { getGraphClient } from "@/lib/admin/server/integrations/graph-client";
import { resolveUserUid } from "@/lib/admin/server/users-list";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_OPS = ["assign", "unassign"] as const;

export async function POST(req: NextRequest, ctx: { params: Promise<{ uid: string; operation: string }> }) {
  const { uid: rawId, operation } = await ctx.params;
  const actor = await verifyCaller(req);
  if (!actor || !(await isPlatformAdmin(actor.uid))) {
    return NextResponse.json({ error: "Only platform admins can manage Microsoft 365 licenses." }, { status: 403 });
  }
  const op = operation.toLowerCase();
  if (!(ALLOWED_OPS as readonly string[]).includes(op)) {
    return NextResponse.json({ error: "operation must be assign or unassign." }, { status: 400 });
  }
  let payload: { licenses?: unknown } = {};
  try {
    payload = (await req.json()) as { licenses?: unknown };
  } catch {
    /* body required */
  }
  const licenses: string[] = Array.isArray(payload.licenses) ? (payload.licenses as string[]) : [];
  if (licenses.length === 0) {
    return NextResponse.json({ error: "licenses array is required." }, { status: 400 });
  }

  const id = await resolveUserUid(rawId);
  const profileRef = usersCollection().doc(id);
  const snap = await profileRef.get();
  if (!snap.exists) return NextResponse.json({ error: "User profile not found." }, { status: 404 });
  const profile = (snap.data() ?? {}) as Record<string, unknown>;
  const upn = profile.microsoft_upn as string | undefined;

  const graph = getGraphClient();
  let graph_outcome: "applied" | "skipped" | "failed" = "skipped";
  let detail: string | null = null;
  let assignedLicenses: unknown[] = [];

  if (graph && upn) {
    try {
      const body =
        op === "assign"
          ? {
              addLicenses: licenses.map((skuId) => ({ skuId, disabledPlans: [] })),
              removeLicenses: [],
            }
          : { addLicenses: [], removeLicenses: licenses };
      await graph.api(`/users/${encodeURIComponent(upn)}/assignLicense`).post(body);
      const after = (await graph.api(`/users/${encodeURIComponent(upn)}/licenseDetails`).get()) as {
        value: unknown[];
      };
      assignedLicenses = after.value ?? [];
      graph_outcome = "applied";
    } catch (err) {
      graph_outcome = "failed";
      detail = String(err);
    }
  } else if (!graph) {
    detail = "MS_GRAPH_* secrets not set: Firestore mirror only.";
  } else if (!upn) {
    detail = "User has no microsoft_upn: issue a work email first.";
  }

  const now = new Date().toISOString();
  await profileRef.set(
    {
      services: {
        ...((profile.services as Record<string, string>) ?? {}),
        microsoft365:
          graph_outcome === "applied"
            ? "provisioned"
            : (profile.services as Record<string, string> | undefined)?.microsoft365,
      },
      service_messages: {
        ...((profile.service_messages as Record<string, string>) ?? {}),
        microsoft365: detail ?? `M365 licenses ${op}ed via Graph.`,
      },
      service_synced_at: {
        ...((profile.service_synced_at as Record<string, string>) ?? {}),
        microsoft365: now,
      },
      last_modified: now,
    },
    { merge: true },
  );

  await writeAuditEntry({
    action: `microsoft365.licenses_${op}`,
    actor: actor.uid,
    firebase_uid: id,
    upn: upn ?? null,
    licenses,
    graph_outcome,
    detail,
  });

  return NextResponse.json(
    {
      operation: op,
      graph_outcome,
      detail,
      changed: licenses,
      licenses: assignedLicenses,
    },
    { status: graph_outcome === "failed" ? 502 : 200 },
  );
}
