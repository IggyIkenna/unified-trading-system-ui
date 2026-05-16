/**
 * GCS proxy for the instrument catalogue artefacts (catalogue plan P3.1).
 *
 * Source: gs://strategy-store-cefi-central-element-323112/catalogue/instrument/{file}
 * Available files: instrument-catalogue.json, instrument-catalogue.md,
 * shard-dynamics.json.
 *
 * Returns the requested file as JSON or markdown text. Server-side ADC keeps
 * GCS credentials off the client.
 *
 * Usage:
 *   GET /api/catalogue/instrument?file=instrument-catalogue.json
 *   GET /api/catalogue/instrument?file=shard-dynamics.json
 *   GET /api/catalogue/instrument?file=instrument-catalogue.md
 *
 * Cached for 5 minutes; the underlying GCS objects are regenerated nightly
 * by the instrument-catalogue-regen Cloud Run Job (02:00 UTC).
 */

import { Storage } from "@google-cloud/storage";
import { NextResponse } from "next/server";

const BUCKET = "strategy-store-cefi-central-element-323112";
const PREFIX = "catalogue/instrument/";
const ALLOWED_FILES = new Set(["instrument-catalogue.json", "instrument-catalogue.md", "shard-dynamics.json"]);

const storage = new Storage();

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const file = url.searchParams.get("file") ?? "instrument-catalogue.json";

  if (!ALLOWED_FILES.has(file)) {
    return NextResponse.json({ error: `Unknown file: ${file}`, allowed: Array.from(ALLOWED_FILES) }, { status: 400 });
  }

  try {
    const [contents] = await storage.bucket(BUCKET).file(`${PREFIX}${file}`).download();
    const headers = new Headers({
      "cache-control": "public, max-age=300, s-maxage=300",
    });
    if (file.endsWith(".json")) {
      headers.set("content-type", "application/json; charset=utf-8");
    } else {
      headers.set("content-type", "text/markdown; charset=utf-8");
    }
    return new Response(contents, { status: 200, headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `GCS read failed for ${file}`, detail: message }, { status: 502 });
  }
}
