/**
 * Access-code validation for the light-auth "Research & Documentation" space
 * (briefings + developer docs). Single shared session key — one unlock covers
 * every code-gated route under that umbrella.
 *
 * Rotation policy: codex/14-playbooks/authentication/light-auth-briefings.md.
 */

const GLOBAL_CODE = process.env.NEXT_PUBLIC_BRIEFING_ACCESS_CODE ?? "";

const PATH_CODES: readonly string[] = [
  process.env.NEXT_PUBLIC_BRIEFING_ACCESS_CODE_INVESTMENT_MANAGEMENT ?? "",
  process.env.NEXT_PUBLIC_BRIEFING_ACCESS_CODE_REGULATORY ?? "",
  process.env.NEXT_PUBLIC_BRIEFING_ACCESS_CODE_PLATFORM ?? "",
  process.env.NEXT_PUBLIC_BRIEFING_ACCESS_CODE_DART_SIGNALS_IN ?? "",
  process.env.NEXT_PUBLIC_BRIEFING_ACCESS_CODE_DART_FULL ?? "",
  process.env.NEXT_PUBLIC_BRIEFING_ACCESS_CODE_SIGNALS_OUT ?? "",
].filter((c) => c.length > 0);

export const ACCESS_CODE_REQUIRED: boolean =
  GLOBAL_CODE.length > 0 || PATH_CODES.length > 0;

export function accessCodeMatches(input: string): boolean {
  const trimmed = input.trim();
  if (GLOBAL_CODE && trimmed === GLOBAL_CODE) return true;
  return PATH_CODES.includes(trimmed);
}
