/**
 * GET /api/v1/users/:id/effective-access?app_id=...&env=...
 *
 * Returns either:
 *   - Full per-app effective-access table (if no app_id query param), exactly
 *     the legacy shape the user-management-ui expects, OR
 *   - Single-app effective access via computeEffectiveAccess (if app_id given).
 */
import { NextRequest, NextResponse } from "next/server";

import { computeEffectiveAccess } from "@/lib/admin/server/auth-context";
import {
  appCapabilitiesCollection,
  appEntitlementsCollection,
  applicationsCollection,
  groupsCollection,
} from "@/lib/admin/server/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Entitlement {
  id: string;
  app_id?: string;
  subject_type?: string;
  subject_id?: string;
  role?: string;
  capabilities?: string[];
  environments?: string[];
  [key: string]: unknown;
}

const ROLE_RANK: Record<string, number> = { owner: 4, admin: 3, editor: 2, viewer: 1 };

export async function GET(req: NextRequest, ctx: { params: Promise<{ uid: string }> }) {
  const { uid } = await ctx.params;
  const { searchParams } = new URL(req.url);
  const appId = searchParams.get("app_id");
  const env = searchParams.get("env");

  try {
    if (appId) {
      const result = await computeEffectiveAccess(uid, appId, env);
      return NextResponse.json(result);
    }

    const groupsSnap = await groupsCollection().get();
    const userGroupIds: string[] = [];
    for (const docSnap of groupsSnap.docs) {
      const data = docSnap.data() as { members?: { firebase_uid?: string }[]; group_id?: string };
      const isMember = (data.members ?? []).some((m) => m.firebase_uid === uid);
      if (isMember) userGroupIds.push(data.group_id ?? docSnap.id);
    }

    const entSnap = await appEntitlementsCollection().get();
    const directEntitlements: Entitlement[] = [];
    const groupEntitlements: Entitlement[] = [];
    for (const d of entSnap.docs) {
      const ent: Entitlement = { id: d.id, ...(d.data() as Record<string, unknown>) };
      if (ent.subject_type === "user" && ent.subject_id === uid) directEntitlements.push(ent);
      else if (ent.subject_type === "group" && ent.subject_id && userGroupIds.includes(ent.subject_id))
        groupEntitlements.push(ent);
    }

    const appIds = new Set<string>([
      ...directEntitlements.map((e) => e.app_id ?? ""),
      ...groupEntitlements.map((e) => e.app_id ?? ""),
    ].filter(Boolean));
    const appSnap = await applicationsCollection().get();
    const appMap = new Map<string, { id: string; name?: string; category?: string; app_id?: string }>();
    for (const d of appSnap.docs) {
      const data = d.data() as { app_id?: string; name?: string; category?: string };
      appMap.set(data.app_id ?? d.id, { id: d.id, ...data });
    }

    const capSnap = await appCapabilitiesCollection().get();
    const capMap = new Map<string, { role_presets?: Record<string, string[]> }>();
    for (const d of capSnap.docs) capMap.set(d.id, d.data() as { role_presets?: Record<string, string[]> });

    const effectiveAccess = Array.from(appIds).map((thisAppId) => {
      const direct = directEntitlements.filter((e) => e.app_id === thisAppId);
      const viaGroup = groupEntitlements.filter((e) => e.app_id === thisAppId);
      const allGrants = [...direct, ...viaGroup];
      allGrants.sort((a, b) => (ROLE_RANK[b.role ?? ""] ?? 0) - (ROLE_RANK[a.role ?? ""] ?? 0));
      const best = allGrants[0];
      const highestRole = best?.role;
      let capabilities: string[] = [];
      if (best) {
        if (best.capabilities && best.capabilities.length > 0) capabilities = best.capabilities;
        else {
          const presets = capMap.get(thisAppId)?.role_presets ?? {};
          capabilities =
            presets[highestRole ?? ""] ??
            (highestRole === "admin" || highestRole === "owner" ? ["*"] : []);
        }
      }
      return {
        app_id: thisAppId,
        app_name: appMap.get(thisAppId)?.name ?? thisAppId,
        app_category: appMap.get(thisAppId)?.category ?? "unknown",
        effective_role: highestRole,
        capabilities,
        direct_grants: direct,
        group_grants: viaGroup,
      };
    });

    return NextResponse.json({
      firebase_uid: uid,
      groups: userGroupIds,
      effective_access: effectiveAccess,
      total_apps: effectiveAccess.length,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
