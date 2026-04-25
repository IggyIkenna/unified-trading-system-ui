/**
 * GET /api/v1/onboarding-requests?status=pending|approved|rejected
 */
import { NextRequest, NextResponse } from "next/server";

import { onboardingRequestsCollection } from "@/lib/admin/server/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  let q = onboardingRequestsCollection().orderBy("created_at", "desc");
  if (status) q = q.where("status", "==", status) as typeof q;
  const snap = await q.limit(200).get();
  const requests = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return NextResponse.json({ requests, total: requests.length });
}
