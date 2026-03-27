import { NextResponse } from "next/server";
import { MOCK_TRANSFER_HISTORY } from "@/lib/mocks/fixtures/transfer-history";

/** Demo/local fallback when trading API has no transfer-history endpoint yet. */
export async function GET() {
  return NextResponse.json({ transfers: MOCK_TRANSFER_HISTORY });
}
