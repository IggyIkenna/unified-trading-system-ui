import { NextResponse } from "next/server";
import { rm, mkdir } from "fs/promises";
import path from "path";

const DOCS_ROOT = path.join(
  process.cwd(),
  ".local-dev-cache",
  "onboarding-docs",
);

export async function POST() {
  try {
    await rm(DOCS_ROOT, { recursive: true, force: true });
    await mkdir(DOCS_ROOT, { recursive: true });
    return NextResponse.json({ ok: true, cleared: DOCS_ROOT });
  } catch {
    return NextResponse.json({ ok: true, cleared: DOCS_ROOT });
  }
}
