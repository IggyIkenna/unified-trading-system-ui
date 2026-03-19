import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/admin";

export async function GET() {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const snapshot = await getAdminDb().collection("groups").get();
  const groups = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return NextResponse.json({ groups });
}

export async function POST(request: Request) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    id: string;
    name: string;
    presentationIds?: string[];
  };

  if (!body.id || !body.name) {
    return NextResponse.json({ error: "Missing id or name" }, { status: 400 });
  }

  await getAdminDb()
    .collection("groups")
    .doc(body.id)
    .set({
      name: body.name,
      presentationIds: body.presentationIds ?? [],
    });

  return NextResponse.json({ status: "ok" });
}
