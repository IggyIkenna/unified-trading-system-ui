import { NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getAllowedPresentationIds } from "@/lib/access";
import { getVerifiedUser } from "@/lib/session";
import { presentationSchema } from "@/lib/schemas";
import { readFile } from "fs/promises";
import path from "path";

const MOCK_MODE = process.env.MOCK_MODE === "true";
const storage = MOCK_MODE ? null : new Storage();
const bucketName = process.env.PRESENTATIONS_BUCKET;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const user = await getVerifiedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowedIds = await getAllowedPresentationIds(user.uid);
  if (!allowedIds.includes(id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const presentationDoc = await getAdminDb()
    .collection("presentations")
    .doc(id)
    .get();
  if (!presentationDoc.exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { gcsPath } = presentationSchema.parse(presentationDoc.data());

  if (MOCK_MODE) {
    // Serve from local public/ directory
    const localPath = path.join(process.cwd(), "public", gcsPath);
    try {
      const html = await readFile(localPath, "utf-8");
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
        },
      });
    } catch {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  }

  if (!bucketName || !storage) {
    return NextResponse.json(
      { error: "Missing bucket configuration" },
      { status: 500 },
    );
  }

  const file = storage.bucket(bucketName).file(gcsPath);
  const [exists] = await file.exists();
  if (!exists) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const stream = file.createReadStream();

  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
