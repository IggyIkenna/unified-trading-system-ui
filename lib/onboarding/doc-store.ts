/**
 * Onboarding document store — pluggable backend for
 * /api/onboarding/upload, /download, /docs/list, /docs/delete.
 *
 * Plan: unified-trading-pm/plans/active/reg_umbrella_questionnaire_and_onboarding_docs_2026_04_21.plan.md
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
// Cloud-stub implementation — surfaces a clear error until @google-cloud/
// storage (or firebase-admin) is installed + ADC credentials are wired.
// ────────────────────────────────────────────────────────────────────────

const NOT_IMPLEMENTED =
  "Cloud doc-store not implemented yet — install @google-cloud/storage " +
  "and wire ADC credentials (see codex/08-workflows/prospect-questionnaire-flow.md §4). " +
  "Until then, set CLOUD_MOCK_MODE=true to fall back to local-disk.";

const cloudStubStore: DocStore = {
  kind: "cloud",
  async upload() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async download() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async list() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async delete() {
    throw new Error(NOT_IMPLEMENTED);
  },
};

/** Pick the backend for the current runtime. */
export function resolveDocStore(): DocStore {
  const mockMode = (process.env.CLOUD_MOCK_MODE ?? "").toLowerCase() === "true";
  const env = readEnvironment();
  const isDev = env === "development" || env === "test";
  if (mockMode || isDev) return localStore;
  return cloudStubStore;
}

export const _internals_for_testing = {
  localStore,
  cloudStubStore,
  canonicalGcsUri,
};
