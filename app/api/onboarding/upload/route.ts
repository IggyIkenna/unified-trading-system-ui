import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const DOCS_ROOT = path.join(
  process.cwd(),
  ".local-dev-cache",
  "onboarding-docs",
);

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const orgId = formData.get("org_id") as string;
  const applicationId = formData.get("application_id") as string;
  const docType = formData.get("doc_type") as string;

  if (!file || !orgId || !applicationId || !docType) {
    return NextResponse.json(
      { error: "Missing file, org_id, application_id, or doc_type" },
      { status: 400 },
    );
  }

  const ext = file.name.split(".").pop() || "bin";
  const dirPath = path.join(DOCS_ROOT, orgId, applicationId);
  const filePath = path.join(dirPath, `${docType}.${ext}`);
  const gcsPath = `gs://onboarding-docs/${orgId}/${applicationId}/${docType}.${ext}`;

  await mkdir(dirPath, { recursive: true });

  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  return NextResponse.json({
    ok: true,
    local_path: filePath,
    gcs_path: gcsPath,
    file_name: file.name,
    size: file.size,
  });
}
