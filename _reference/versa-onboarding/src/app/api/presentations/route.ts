import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getAllowedPresentationIds } from "@/lib/access";
import { getVerifiedUser } from "@/lib/session";
import { chunk } from "@/lib/utils";
import { presentationSchema } from "@/lib/schemas";

export async function GET() {
  const user = await getVerifiedUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const allowedIds = await getAllowedPresentationIds(user.uid);
  if (allowedIds.length === 0) {
    return NextResponse.json({ presentations: [] });
  }

  const batches = chunk(allowedIds, 10);
  const results: Array<{ id: string; title: string; gcsPath: string }> = [];

  for (const ids of batches) {
    const snapshot = await getAdminDb()
      .collection("presentations")
      .where("__name__", "in", ids)
      .get();
    snapshot.forEach((doc) => {
      const data = presentationSchema.parse(doc.data());
      results.push({ id: doc.id, title: data.title, gcsPath: data.gcsPath });
    });
  }

  return NextResponse.json({ presentations: results });
}
