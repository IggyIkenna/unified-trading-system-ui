import { NextRequest, NextResponse } from "next/server";

import { resolveDocStore } from "@/lib/onboarding/doc-store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id");
  if (!orgId) {
    return NextResponse.json({ error: "Missing org_id" }, { status: 400 });
  }

  try {
    const store = resolveDocStore();
    const docs = await store.list(orgId);
    return NextResponse.json({ ok: true, org_id: orgId, docs });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
