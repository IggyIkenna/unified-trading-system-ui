import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { SESSION_COOKIE_NAME } from "@/lib/session";

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

export async function POST(request: Request) {
  try {
    const { idToken } = (await request.json()) as { idToken?: string };
    if (!idToken) {
      return NextResponse.json({ error: "Missing idToken" }, { status: 400 });
    }

    const sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: FIVE_DAYS_MS,
    });

    const response = NextResponse.json({ status: "ok" });

    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: sessionCookie,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(FIVE_DAYS_MS / 1000),
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error";
    return NextResponse.json(
      { error: "Auth session failed", detail: message },
      { status: 500 },
    );
  }
}
