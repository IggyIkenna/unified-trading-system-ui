/**
 * /api/v1/users/:uid/documents — list user_documents records (GET) +
 * create a metadata-only record for a file already in Storage (POST).
 *
 * Mirrors the legacy server's createUserDocumentRecord shape so admin UI
 * pages render uploaded-doc lists identically.
 */
import { NextRequest, NextResponse } from "next/server";

import { userDocumentsCollection, writeAuditEntry } from "@/lib/admin/server/collections";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface UserDocument {
  id: string;
  uploaded_at?: string;
  [key: string]: unknown;
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ uid: string }> }) {
  const { uid } = await ctx.params;
  try {
    const snap = await userDocumentsCollection().where("firebase_uid", "==", uid).get();
    const documents: UserDocument[] = snap.docs
      .map((d) => {
        const row = d.data() as Record<string, unknown>;
        return { id: d.id, ...row } as UserDocument;
      })
      .sort((a, b) => (b.uploaded_at ?? "").localeCompare(a.uploaded_at ?? ""));
    return NextResponse.json({ documents, total: documents.length });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

interface CreateDocPayload {
  doc_type?: string;
  file_name?: string;
  storage_path?: string;
  content_type?: string;
  onboarding_request_id?: string | null;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ uid: string }> }) {
  const { uid } = await ctx.params;
  let payload: CreateDocPayload;
  try {
    payload = (await req.json()) as CreateDocPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  if (!payload.doc_type || !payload.file_name || !payload.storage_path) {
    return NextResponse.json(
      { error: "doc_type, file_name, and storage_path are required." },
      { status: 400 },
    );
  }
  try {
    const now = new Date().toISOString();
    const docRef = await userDocumentsCollection().add({
      firebase_uid: uid,
      onboarding_request_id: payload.onboarding_request_id ?? null,
      doc_type: payload.doc_type,
      file_name: payload.file_name,
      storage_path: payload.storage_path,
      content_type: payload.content_type ?? "application/octet-stream",
      review_status: "pending",
      review_note: "",
      uploaded_at: now,
      updated_at: now,
    });
    const created = await docRef.get();
    await writeAuditEntry({
      action: "document.uploaded",
      firebase_uid: uid,
      document_id: docRef.id,
      doc_type: payload.doc_type,
      actor: "user",
    });
    return NextResponse.json(
      { document: { id: created.id, ...(created.data() as Record<string, unknown>) } },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
