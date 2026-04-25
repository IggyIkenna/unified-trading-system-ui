/**
 * POST /api/v1/users/onboard — admin creates an active user.
 *
 * Triggers the onboarding workflow as a stub (Phase 4 wires the real
 * Google Workflows REST call). Native provider provisioning (Slack /
 * Microsoft 365 / GitHub / GCP / AWS) is also stubbed — admin pages still
 * see the user appear as `active` with all services in `pending` state.
 */
import { NextRequest, NextResponse } from "next/server";

import {
  computeQuotaCheck,
  getAccessTemplateById,
  usersCollection,
  WORKFLOW_NAMES,
} from "@/lib/admin/server/collections";
import { getDefaultServicesForUser } from "@/lib/admin/server/service-defaults";
import { triggerWorkflow } from "@/lib/admin/server/integrations/workflow-trigger";
import { getAdminAuth } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface OnboardPayload {
  email?: string;
  name?: string;
  role?: string;
  id?: string;
  github_handle?: string | null;
  product_slugs?: string[];
  access_template_id?: string | null;
}

export async function POST(req: NextRequest) {
  let payload: OnboardPayload;
  try {
    payload = (await req.json()) as OnboardPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.email || !payload.name || !payload.role) {
    return NextResponse.json({ error: "name, email, and role are required." }, { status: 400 });
  }

  try {
    const quota = await computeQuotaCheck(payload.role);
    if (!quota.ok) {
      return NextResponse.json(
        { error: quota.message, quota, code: "QUOTA_EXCEEDED" },
        { status: 409 },
      );
    }

    const auth = getAdminAuth();
    if (!auth) return NextResponse.json({ error: "Auth backend unavailable." }, { status: 503 });

    const firebaseUser = await auth.createUser({
      email: payload.email,
      displayName: payload.name,
      disabled: false,
    });
    await auth.setCustomUserClaims(firebaseUser.uid, {
      role: payload.role,
      source: "user-management-ui",
    });

    const now = new Date().toISOString();
    const accessTemplate = await getAccessTemplateById(payload.access_template_id ?? null);
    const profile: Record<string, unknown> = {
      id: payload.id ?? firebaseUser.uid,
      name: payload.name,
      email: payload.email,
      role: payload.role,
      github_handle: payload.github_handle ?? null,
      product_slugs: payload.product_slugs ?? [],
      status: "active",
      provisioned_at: now,
      last_modified: now,
      access_template_id: payload.access_template_id ?? null,
      access_template: accessTemplate,
      services: getDefaultServicesForUser(payload.role, "active"),
      service_synced_at: {},
    };
    await usersCollection().doc(firebaseUser.uid).set(profile);

    const wf = await triggerWorkflow(WORKFLOW_NAMES.onboard, "onboard", firebaseUser.uid, {
      firebase_uid: firebaseUser.uid,
      profile,
      access_template: accessTemplate,
    });

    const provisioning_steps = [
      { service: "firebase", label: "Firebase Auth", status: "success" },
    ];

    return NextResponse.json(
      {
        user: { ...profile, firebase_uid: firebaseUser.uid },
        provisioning_steps,
        workflow_execution: wf.execution_name,
        workflow_state: wf.state,
        workflow_outcome: wf.outcome,
        workflow_error: wf.error,
        quota,
      },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
