/**
 * Onboarding document store — pluggable backend for
 * /api/onboarding/upload, /download, /docs/list, /docs/delete.
 *
 * Plan: unified-trading-pm/plans/active/reg_umbrella_questionnaire_and_onboarding_docs_2026_04_21.md
 *
 * Dispatches between a local-disk store (mock / dev — writes under
 * .local-dev-cache/onboarding-docs/) and a cloud store (staging / prod —
 * writes to gs://odum-${env}-onboarding-docs/).
 *
 * Cloud implementation note (2026-04-21): this module defines the
 * adapter interface + local implementation. The cloud implementation is
 * stubbed — enabling it requires installing @google-cloud/storage (or
 * firebase-admin, if we prefer to reuse Firebase auth for the admin
 * delete gate) and wiring ADC-based credentials. Follow the codex doc
 * `codex/08-workflows/prospect-questionnaire-flow.md` § 4 once those
 * deps land. Until then, non-mock environments surface a clear error
 * message instead of silently writing to local disk.
 */

import { mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

export interface DocCoordinates {
  readonly org_id: string;
  readonly application_id: string;
  readonly doc_type: string;
}

export interface DocEntry {
  readonly org_id: string;
  readonly application_id: string;
  readonly doc_type: string;
  readonly filename: string;
  readonly size: number;
  readonly uploaded_at: string; // ISO timestamp
  readonly local_path?: string;
  readonly gcs_path: string; // canonical URI — always present
}

export interface UploadResult {
  readonly ok: true;
  readonly local_path?: string;
  readonly gcs_path: string;
  readonly file_name: string;
  readonly size: number;
}

export interface DownloadResult {
  readonly filename: string;
  readonly content_type: string;
  readonly bytes: Buffer;
  readonly size: number;
}

export interface DocStore {
  readonly kind: "local" | "cloud";
  upload(coords: DocCoordinates, file: File): Promise<UploadResult>;
  download(coords: DocCoordinates): Promise<DownloadResult | null>;
  list(org_id: string): Promise<readonly DocEntry[]>;
  delete(coords: DocCoordinates): Promise<{ ok: true; deleted_path: string } | null>;
}

function readEnvironment(): string {
  return (process.env.ENVIRONMENT ?? process.env.NODE_ENV ?? "development").toLowerCase();
}

function canonicalGcsUri(coords: DocCoordinates, ext: string): string {
  const bucket = `odum-${readEnvironment()}-onboarding-docs`;
  return `gs://${bucket}/${coords.org_id}/${coords.application_id}/${coords.doc_type}.${ext}`;
}

function extFromName(name: string): string {
  return name.split(".").pop() ?? "bin";
}

function contentTypeFromExt(ext: string): string {
  switch (ext) {
    case "pdf":
      return "application/pdf";
    case "html":
      return "text/html";
    case "png":
      return "image/png";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    default:
      return "application/octet-stream";
  }
}

// ────────────────────────────────────────────────────────────────────────
// Local-disk implementation — mirrors the prior behaviour of the three
// route handlers. Used in mock / dev mode.
// ────────────────────────────────────────────────────────────────────────

const LOCAL_ROOT = join(process.cwd(), ".local-dev-cache", "onboarding-docs");

const localStore: DocStore = {
  kind: "local",

  async upload(coords, file) {
    const ext = extFromName(file.name);
    const dirPath = join(LOCAL_ROOT, coords.org_id, coords.application_id);
    const filePath = join(dirPath, `${coords.doc_type}.${ext}`);
    await mkdir(dirPath, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(filePath, Buffer.from(bytes));
    return {
      ok: true,
      local_path: filePath,
      gcs_path: canonicalGcsUri(coords, ext),
      file_name: file.name,
      size: file.size,
    };
  },

  async download(coords) {
    const dirPath = join(LOCAL_ROOT, coords.org_id, coords.application_id);
    try {
      const files = await readdir(dirPath);
      const match = files.find((f) => f.startsWith(coords.doc_type));
      if (!match) return null;
      const filePath = join(dirPath, match);
      const fileStats = await stat(filePath);
      const bytes = await readFile(filePath);
      const ext = extFromName(match);
      return {
        filename: match,
        content_type: contentTypeFromExt(ext),
        bytes,
        size: fileStats.size,
      };
    } catch {
      return null;
    }
  },

  async list(org_id) {
    const orgDir = join(LOCAL_ROOT, org_id);
    let applications: string[];
    try {
      applications = await readdir(orgDir);
    } catch {
      return [];
    }
    const entries: DocEntry[] = [];
    for (const application_id of applications) {
      const appDir = join(orgDir, application_id);
      let files: string[] = [];
      try {
        files = await readdir(appDir);
      } catch {
        continue;
      }
      for (const filename of files) {
        const filePath = join(appDir, filename);
        const st = await stat(filePath).catch(() => null);
        if (!st) continue;
        const dotIdx = filename.lastIndexOf(".");
        const doc_type = dotIdx === -1 ? filename : filename.slice(0, dotIdx);
        const ext = dotIdx === -1 ? "bin" : filename.slice(dotIdx + 1);
        entries.push({
          org_id,
          application_id,
          doc_type,
          filename,
          size: st.size,
          uploaded_at: st.mtime.toISOString(),
          local_path: filePath,
          gcs_path: canonicalGcsUri({ org_id, application_id, doc_type }, ext),
        });
      }
    }
    // Most-recent first.
    return entries.slice().sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
  },

  async delete(coords) {
    const dirPath = join(LOCAL_ROOT, coords.org_id, coords.application_id);
    try {
      const files = await readdir(dirPath);
      const match = files.find((f) => f.startsWith(coords.doc_type));
      if (!match) return null;
      const filePath = join(dirPath, match);
      await rm(filePath, { force: true });
      return { ok: true, deleted_path: filePath };
    } catch {
      return null;
    }
  },
};

// ────────────────────────────────────────────────────────────────────────
// Cloud implementation — @google-cloud/storage with ADC credentials.
// Bucket naming convention: odum-${env}-onboarding-docs
// Authentication: Application Default Credentials — expects either
//   * GOOGLE_APPLICATION_CREDENTIALS env pointing to a service-account JSON
//   * the workload's attached service account (Cloud Run / GCE)
//   * gcloud auth application-default login (local admin runs)
// The bucket must exist in the target project; the SDK will fail loud on
// first call if it doesn't, which surfaces the provisioning gap cleanly.
// ────────────────────────────────────────────────────────────────────────

function bucketName(): string {
  return `odum-${readEnvironment()}-onboarding-docs`;
}

function objectKey(coords: DocCoordinates, ext: string): string {
  return `${coords.org_id}/${coords.application_id}/${coords.doc_type}.${ext}`;
}

function objectKeyPrefix(coords: Pick<DocCoordinates, "org_id" | "application_id"> & Partial<Pick<DocCoordinates, "doc_type">>): string {
  const base = `${coords.org_id}/${coords.application_id}/`;
  return coords.doc_type ? `${base}${coords.doc_type}` : base;
}

async function cloudBucket() {
  const { Storage } = await import("@google-cloud/storage");
  const projectId = process.env.GOOGLE_CLOUD_PROJECT ?? process.env.GCP_PROJECT_ID ?? undefined;
  const storage = new Storage(projectId ? { projectId } : {});
  return storage.bucket(bucketName());
}

const cloudStorageStore: DocStore = {
  kind: "cloud",

  async upload(coords, file) {
    const ext = extFromName(file.name);
    const bucket = await cloudBucket();
    const key = objectKey(coords, ext);
    const blob = bucket.file(key);
    const bytes = Buffer.from(await file.arrayBuffer());
    await blob.save(bytes, {
      contentType: contentTypeFromExt(ext),
      resumable: false,
      metadata: {
        metadata: {
          org_id: coords.org_id,
          application_id: coords.application_id,
          doc_type: coords.doc_type,
          original_name: file.name,
        },
      },
    });
    return {
      ok: true,
      gcs_path: `gs://${bucketName()}/${key}`,
      file_name: file.name,
      size: file.size,
    };
  },

  async download(coords) {
    const bucket = await cloudBucket();
    // List-prefix so we can find the object even when the ext is
    // unknown at call-time (caller provides org/app/doc_type, not ext).
    const [files] = await bucket.getFiles({ prefix: objectKeyPrefix(coords) });
    if (files.length === 0) return null;
    // Deterministic pick: shortest key (exact doc-type match takes
    // precedence over doc_type as a prefix of a longer name).
    const blob = files
      .slice()
      .sort((a, b) => a.name.length - b.name.length)[0];
    const [bytes] = await blob.download();
    const filename = blob.name.split("/").pop() ?? blob.name;
    const ext = extFromName(filename);
    const [metadata] = await blob.getMetadata();
    return {
      filename,
      content_type: (metadata.contentType as string | undefined) ?? contentTypeFromExt(ext),
      bytes,
      size: Number(metadata.size ?? bytes.length),
    };
  },

  async list(org_id) {
    const bucket = await cloudBucket();
    const [files] = await bucket.getFiles({ prefix: `${org_id}/` });
    const entries: DocEntry[] = [];
    for (const blob of files) {
      const [metadata] = await blob.getMetadata();
      // Key shape: {org}/{app}/{doc_type}.{ext}
      const parts = blob.name.split("/");
      if (parts.length < 3) continue;
      const [bOrg, application_id, fileName] = parts;
      const dotIdx = fileName.lastIndexOf(".");
      const doc_type = dotIdx === -1 ? fileName : fileName.slice(0, dotIdx);
      const ext = dotIdx === -1 ? "bin" : fileName.slice(dotIdx + 1);
      const size = Number(metadata.size ?? 0);
      const updatedRaw = metadata.updated ?? metadata.timeCreated;
      const uploaded_at =
        typeof updatedRaw === "string" ? updatedRaw : new Date().toISOString();
      entries.push({
        org_id: bOrg,
        application_id,
        doc_type,
        filename: fileName,
        size,
        uploaded_at,
        gcs_path: `gs://${bucketName()}/${blob.name}`,
      });
    }
    return entries.slice().sort((a, b) => b.uploaded_at.localeCompare(a.uploaded_at));
  },

  async delete(coords) {
    const bucket = await cloudBucket();
    const [files] = await bucket.getFiles({ prefix: objectKeyPrefix(coords) });
    if (files.length === 0) return null;
    const blob = files
      .slice()
      .sort((a, b) => a.name.length - b.name.length)[0];
    await blob.delete({ ignoreNotFound: false });
    return { ok: true, deleted_path: `gs://${bucketName()}/${blob.name}` };
  },
};

/** Pick the backend for the current runtime. */
export function resolveDocStore(): DocStore {
  const mockMode = (process.env.CLOUD_MOCK_MODE ?? "").toLowerCase() === "true";
  const env = readEnvironment();
  const isDev = env === "development" || env === "test";
  if (mockMode || isDev) return localStore;
  return cloudStorageStore;
}

export const _internals_for_testing = {
  localStore,
  cloudStorageStore,
  canonicalGcsUri,
  bucketName,
};
