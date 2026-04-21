import { NextRequest, NextResponse } from "next/server";

import { resolveDocStore } from "@/lib/onboarding/doc-store";

/**
 * Per-document delete handler. Replaces the old blanket `/api/onboarding/reset`
 * handler (which nuked every org's docs). Admin gate: requires a POST body
 * containing `{ org_id, application_id, doc_type, confirm }` where `confirm`
 * MUST equal the literal string "DELETE" (enforced here for belt-and-suspenders
 * alongside the admin-only UI button that types it). Real admin auth is
 * enforced upstream by the NextAuth/Firebase middleware on /admin pages; this
 * literal-confirm rule is a second line of defence for accidental fetch calls.
 */
export async function POST(request: NextRequest) {
  let body: {
    org_id?: string;
    application_id?: string;
    doc_type?: string;
    confirm?: string;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { org_id, application_id, doc_type, confirm } = body;
  if (!org_id || !application_id || !doc_type) {
    return NextResponse.json(
      { error: "Missing org_id, application_id, or doc_type" },
      { status: 400 },
    );
  }
  if (confirm !== "DELETE") {
    return NextResponse.json(
      { error: "Missing or invalid confirm token. Send `confirm: 'DELETE'`." },
      { status: 403 },
    );
  }

  try {
    const store = resolveDocStore();
    const result = await store.delete({ org_id, application_id, doc_type });
    if (result === null) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
