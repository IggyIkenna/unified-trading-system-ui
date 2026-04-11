/**
 * Runtime data-mode helpers.
 *
 * IMPORTANT:
 * - Mock data mode is controlled ONLY by NEXT_PUBLIC_MOCK_API.
 * - Auth mode (demo/firebase) is independent and must not implicitly
 *   switch API data sources.
 */
export function isMockDataMode(): boolean {
  return process.env.NEXT_PUBLIC_MOCK_API === "true";
}
