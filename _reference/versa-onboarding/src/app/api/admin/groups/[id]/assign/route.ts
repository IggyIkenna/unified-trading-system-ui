import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/admin";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { isAdmin } = await requireAdmin();
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = (await request.json()) as {
    presentationIds?: string[];
  };

  await getAdminDb()
    .collection("groups")
    .doc(id)
    .set(
      {
        presentationIds: body.presentationIds ?? [],
      },
      { merge: true },
    );

  return NextResponse.json({ status: "ok" });
}
