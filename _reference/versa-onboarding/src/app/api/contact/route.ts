import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    message?: string;
  };

  if (!body.name || !body.email || !body.message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await getAdminDb().collection("contact_submissions").add({
    name: body.name,
    email: body.email,
    message: body.message,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ status: "ok" });
}
