import { NextRequest, NextResponse } from "next/server";

import { resolveDocStore } from "@/lib/onboarding/doc-store";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id");
  const applicationId = searchParams.get("application_id");
  const docType = searchParams.get("doc_type");

  if (!orgId || !applicationId || !docType) {
    return NextResponse.json(
      { error: "Missing org_id, application_id, or doc_type" },
      { status: 400 },
    );
  }

  try {
    const store = resolveDocStore();
    const result = await store.download({
      org_id: orgId,
      application_id: applicationId,
      doc_type: docType,
    });
    if (result === null) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    return new NextResponse(result.bytes, {
      headers: {
        "Content-Type": result.content_type,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Content-Length": String(result.size),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
