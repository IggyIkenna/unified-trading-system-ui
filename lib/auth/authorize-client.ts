/**
 * Client for the user-management-api /api/v1/authorize endpoint.
 *
 * Given an app_id and Firebase UID, returns the user's effective role
 * and capabilities for this application. This is the single source
 * of truth for what the user can do — the UI never hardcodes role logic.
 */

const USER_MGMT_API =
  process.env.NEXT_PUBLIC_USER_MGMT_API_URL || "http://localhost:8017";

export const APP_ID = "unified-trading-system-ui";

export interface AuthorizeResult {
  authorized: boolean;
  role: "viewer" | "editor" | "admin" | "owner" | null;
  capabilities: string[];
  source: "direct" | "group" | "none";
  environments: string[];
  user_status?: string;
  error?: string;
}

export async function fetchAuthorization(
  uid: string,
  env?: string,
): Promise<AuthorizeResult> {
  const params = new URLSearchParams({ app_id: APP_ID, uid });
  if (env) params.set("env", env);

  const res = await fetch(
    `${USER_MGMT_API}/api/v1/authorize?${params.toString()}`,
  );

  if (!res.ok) {
    return {
      authorized: false,
      role: null,
      capabilities: [],
      source: "none",
      environments: [],
      error: `HTTP ${res.status}`,
    };
  }

  return res.json();
}
