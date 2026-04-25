/**
 * GCS proxy for the strategy catalogue envelope artefacts.
 *
 * Source: gs://strategy-store-cefi-central-element-323112/catalogue/{file}
 * Available files: envelope.json, envelope.md, strategy_instruments.json,
 * availability.json.
 *
 * Returns the requested file as JSON or text. Server-side ADC keeps GCS
 * credentials off the client.
 *
 * Usage:
 *   GET /api/catalogue/envelope?file=envelope.json
 *   GET /api/catalogue/envelope?file=strategy_instruments.json
 *   GET /api/catalogue/envelope?file=availability.json
 *   GET /api/catalogue/envelope?file=envelope.md
 *
 * Cached for 5 minutes; the underlying GCS objects are regenerated daily by
 * the catalogue scripts.
 */

import { Storage } from "@google-cloud/storage";
import { NextResponse } from "next/server";

const BUCKET = "strategy-store-cefi-central-element-323112";
const ALLOWED_FILES = new Set([
  "envelope.json",
  "envelope.md",
  "strategy_instruments.json",
  "availability.json",
]);

const storage = new Storage();

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const file = url.searchParams.get("file") ?? "envelope.json";

  if (!ALLOWED_FILES.has(file)) {
    return NextResponse.json(
      { error: `Unknown file: ${file}`, allowed: Array.from(ALLOWED_FILES) },
      { status: 400 },
    );
  }

  try {
    const [contents] = await storage
      .bucket(BUCKET)
      .file(`catalogue/${file}`)
      .download();
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
    return NextResponse.json(
      { error: `GCS read failed for ${file}`, detail: message },
      { status: 502 },
    );
  }
}
