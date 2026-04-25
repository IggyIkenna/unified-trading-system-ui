/**
 * POST /api/v1/users/:uid/documents/upload
 *
 * Native replacement for the legacy user-management-api KYC upload route.
 * Accepts the same JSON+base64 body shape so [lib/api/signup-client.ts]
 * needs no caller-side changes — only the URL switches from the external
 * Cloud Run service to this same-origin route.
 *
 * Stores the binary in Firebase Storage at
 * `onboarding-docs/{uid}/{onboarding_request_id|draft}/{ts}-{doc_type}-{name}`
 * and writes a `user_documents` Firestore record with review_status=pending.
 */
import { NextRequest, NextResponse } from "next/server";

import { getAdminStorage } from "@/lib/firebase-admin";
import {
  userDocumentsCollection,
  writeAuditEntry,
} from "@/lib/admin/server/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface UploadPayload {
  doc_type?: string;
  file_name?: string;
  content_type?: string;
  file_base64?: string;
  onboarding_request_id?: string | null;
}

function sanitizeFileName(fileName: string): string {
  return String(fileName || "document.bin").replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ uid: string }> }) {
  const { uid } = await ctx.params;
  if (!uid) return NextResponse.json({ error: "uid is required." }, { status: 400 });

  let payload: UploadPayload;
  try {
    payload = (await req.json()) as UploadPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.doc_type || !payload.file_name || !payload.content_type || !payload.file_base64) {
    return NextResponse.json(
      { error: "doc_type, file_name, content_type, and file_base64 are required." },
      { status: 400 },
    );
  }

  const storage = getAdminStorage();
  if (!storage) return NextResponse.json({ error: "Storage backend unavailable." }, { status: 503 });

  const safeName = sanitizeFileName(payload.file_name);
  const storagePath = `onboarding-docs/${uid}/${payload.onboarding_request_id || "draft"}/${Date.now()}-${payload.doc_type}-${safeName}`;
  const buffer = Buffer.from(payload.file_base64, "base64");

  try {
    const bucket = storage.bucket();
    const file = bucket.file(storagePath);
    await file.save(buffer, {
      contentType: payload.content_type,
      resumable: false,
      metadata: { cacheControl: "private, max-age=0, no-store" },
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }

  const now = new Date().toISOString();
  const docRef = await userDocumentsCollection().add({
    firebase_uid: uid,
    onboarding_request_id: payload.onboarding_request_id ?? null,
    doc_type: payload.doc_type,
    file_name: payload.file_name,
    storage_path: storagePath,
    content_type: payload.content_type,
    review_status: "pending",
    review_note: "",
    uploaded_at: now,
    updated_at: now,
  });

  await writeAuditEntry({
    action: "document.uploaded",
    firebase_uid: uid,
    document_id: docRef.id,
    doc_type: payload.doc_type,
    actor: "system",
  });

  const created = await docRef.get();
  return NextResponse.json(
    {
      document: { id: docRef.id, ...created.data() },
      upload: { storage_path: storagePath },
    },
    { status: 201 },
  );
}
