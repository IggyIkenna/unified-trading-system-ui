import { NextRequest, NextResponse } from "next/server";

import { resolveDocStore } from "@/lib/onboarding/doc-store";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const orgId = formData.get("org_id") as string | null;
  const applicationId = formData.get("application_id") as string | null;
  const docType = formData.get("doc_type") as string | null;

  if (!file || !orgId || !applicationId || !docType) {
    return NextResponse.json(
      { error: "Missing file, org_id, application_id, or doc_type" },
      { status: 400 },
    );
  }

  try {
    const store = resolveDocStore();
    const result = await store.upload(
      { org_id: orgId, application_id: applicationId, doc_type: docType },
      file,
    );
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
