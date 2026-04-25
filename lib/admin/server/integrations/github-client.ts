/**
 * Octokit factory + helpers for /api/v1/github/* routes.
 *
 * Reads `GITHUB_TOKEN` (server-only) — when unset the helpers return null
 * and the calling route degrades gracefully (503 with a "set GITHUB_TOKEN"
 * message). `GITHUB_ORG` scopes discovery + access scans; defaults to
 * "IggyIkenna" since that's where every workspace repo lives today.
 */
import "server-only";
import { Octokit } from "@octokit/rest";

let _client: Octokit | null = null;

export function getGitHubClient(): Octokit | null {
  if (_client) return _client;
  const token = process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN;
  if (!token) return null;
  _client = new Octokit({ auth: token });
  return _client;
}

export function getGitHubOrg(): string {
  return process.env.GITHUB_ORG ?? "IggyIkenna";
}

export type GhPermission = "pull" | "triage" | "push" | "maintain" | "admin";

/** Map our internal role vocabulary to GitHub's permission strings. */
export function roleToGhPermission(role: string): GhPermission {
  switch (role) {
    case "read":
      return "pull";
    case "triage":
      return "triage";
    case "write":
      return "push";
    case "maintain":
      return "maintain";
    case "admin":
      return "admin";
    default:
      return "pull";
  }
}
