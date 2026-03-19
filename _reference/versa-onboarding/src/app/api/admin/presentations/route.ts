import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const snapshot = await getAdminDb().collection("presentations").get();
  const presentations = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return NextResponse.json({ presentations });
}

export async function POST(request: Request) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    id: string;
    title: string;
    gcsPath: string;
  };

  if (!body.id || !body.title || !body.gcsPath) {
    return NextResponse.json(
      { error: "Missing id, title, or gcsPath" },
      { status: 400 },
    );
  }

  await getAdminDb().collection("presentations").doc(body.id).set({
    title: body.title,
    gcsPath: body.gcsPath,
  });

  return NextResponse.json({ status: "ok" });
}
