/**
 * GET /api/v1/users/:uid/documents/:docId/download — return a 15-minute
 * V4 signed URL for the underlying file in Firebase Storage.
 */
import { NextRequest, NextResponse } from "next/server";

import { userDocumentsCollection } from "@/lib/admin/server/collections";
import { getAdminStorage } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ uid: string; docId: string }> },
) {
  const { uid, docId } = await ctx.params;
  try {
    const ref = userDocumentsCollection().doc(docId);
    const doc = await ref.get();
    if (!doc.exists) return NextResponse.json({ error: "Document not found." }, { status: 404 });
    const data = doc.data() as {
      firebase_uid?: string;
      storage_path?: string;
      file_name?: string;
      content_type?: string;
    };
    if (data.firebase_uid !== uid) {
      return NextResponse.json({ error: "Document does not belong to this user." }, { status: 404 });
    }
    const storagePath = data.storage_path;
    if (!storagePath) {
      return NextResponse.json({ error: "No file stored for this document." }, { status: 404 });
    }

    const storage = getAdminStorage();
    if (!storage) {
      return NextResponse.json({ error: "Storage backend unavailable." }, { status: 503 });
    }
    const file = storage.bucket().file(storagePath);
    const [exists] = await file.exists();
    if (!exists) return NextResponse.json({ error: "File not found in storage." }, { status: 404 });

    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: Date.now() + 15 * 60 * 1000,
    });

    return NextResponse.json({
      url: signedUrl,
      file_name: data.file_name,
      content_type: data.content_type,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
