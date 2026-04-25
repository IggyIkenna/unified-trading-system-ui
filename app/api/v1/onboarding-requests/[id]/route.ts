/**
 * GET /api/v1/onboarding-requests/:id — request + attached user_documents
 */
import { NextRequest, NextResponse } from "next/server";

import {
  onboardingRequestsCollection,
  userDocumentsCollection,
} from "@/lib/admin/server/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const snap = await onboardingRequestsCollection().doc(id).get();
  if (!snap.exists) return NextResponse.json({ error: "Request not found" }, { status: 404 });
  const request = { id: snap.id, ...snap.data() };
  const docsSnap = await userDocumentsCollection().where("onboarding_request_id", "==", id).get();
  const documents = docsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ request, documents });
}
