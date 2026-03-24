import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

const DOCS_ROOT = path.join(
  process.cwd(),
  ".local-dev-cache",
  "onboarding-docs",
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("org_id");
  const applicationId = searchParams.get("application_id");
  const docType = searchParams.get("doc_type");

  if (!orgId || !applicationId || !docType) {
    return NextResponse.json(
      { error: "Missing org_id, application_id, or doc_type" },
      { status: 400 },
    );
  }

  const dirPath = path.join(DOCS_ROOT, orgId, applicationId);

  try {
    const { readdir } = await import("fs/promises");
    const files = await readdir(dirPath);
    const match = files.find((f) => f.startsWith(docType));
    if (!match) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 },
      );
    }

    const filePath = path.join(dirPath, match);
    const fileStats = await stat(filePath);
    const buffer = await readFile(filePath);

    const ext = match.split(".").pop() || "bin";
    const contentType =
      ext === "pdf"
        ? "application/pdf"
        : ext === "html"
          ? "text/html"
          : ext === "png"
            ? "image/png"
            : ext === "jpg" || ext === "jpeg"
              ? "image/jpeg"
              : "application/octet-stream";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${match}"`,
        "Content-Length": String(fileStats.size),
      },
    });
  } catch {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
}
