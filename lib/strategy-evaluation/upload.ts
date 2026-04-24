/**
 * Upload helper for strategy-evaluation DDQ file attachments.
 *
 * Production: uploads to Firebase Storage under
 *   strategy-evaluations/{submissionId}/{fieldKey}/{timestamp}-{filename}
 * and returns a durable download URL.
 *
 * Mock / localhost: returns a reference with an empty url so the UI still
 * captures filename + size in the draft; the admin surface renders a
 * "mock mode — file not stored" marker.
 */

import { firebaseStorage } from "@/lib/auth/firebase-config";

export interface UploadedFileRef {
  readonly path: string;
  readonly url: string;
  readonly filename: string;
  readonly size: number;
  readonly contentType: string;
  readonly uploadedAt: string;
}

export function isUploadedFileRef(value: unknown): value is UploadedFileRef {
  if (value === null || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.path === "string" &&
    typeof v.url === "string" &&
    typeof v.filename === "string" &&
    typeof v.size === "number" &&
    typeof v.contentType === "string" &&
    typeof v.uploadedAt === "string"
  );
}

export async function uploadStrategyEvalFile(
  file: File,
  submissionId: string,
  fieldKey: string,
): Promise<UploadedFileRef> {
  const filename = file.name;
  const uploadedAt = new Date().toISOString();
  const path = `strategy-evaluations/${submissionId}/${fieldKey}/${Date.now()}-${filename}`;
  const contentType = file.type || "application/octet-stream";

  if (!firebaseStorage) {
    // Mock / no-storage environment — record the reference without persisting bytes
    return {
      path: `mock://${path}`,
      url: "",
      filename,
      size: file.size,
      contentType,
      uploadedAt,
    };
  }

  const { ref, uploadBytes, getDownloadURL } = await import("firebase/storage");
  const storageRef = ref(firebaseStorage, path);
  await uploadBytes(storageRef, file, { contentType });
  const url = await getDownloadURL(storageRef);

  return { path, url, filename, size: file.size, contentType, uploadedAt };
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
