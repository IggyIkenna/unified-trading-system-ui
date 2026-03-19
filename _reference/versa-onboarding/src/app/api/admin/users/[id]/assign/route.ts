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
    groupIds?: string[];
    presentationIds?: string[];
    clientId?: string;
    role?: string;
  };

  const updateData: Record<string, unknown> = {
    groupIds: body.groupIds ?? [],
    presentationIds: body.presentationIds ?? [],
    ...(body.role ? { role: body.role } : {}),
  };

  if (body.clientId !== undefined) {
    if (body.clientId === "") {
      updateData.clientId = null; // Remove client assignment
    } else {
      updateData.clientId = body.clientId;
    }
  }

  await getAdminDb()
    .collection("users")
    .doc(id)
    .set(updateData, { merge: true });

  return NextResponse.json({ status: "ok" });
}
