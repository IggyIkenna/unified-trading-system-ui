/**
 * Client for the portal's native /api/v1/authorize route.
 *
 * Given an app_id and Firebase UID, returns the user's effective role
 * and capabilities for this application. The route reads Firestore via
 * the Admin SDK (server-side) so the browser only ever sees the result —
 * this is the single source of truth for what the user can do; the UI
 * never hardcodes role logic.
 *
 * Same-origin call only — no NEXT_PUBLIC_USER_MGMT_API_URL anymore. The
 * legacy user-management-api Cloud Run service is being retired in favour
 * of native portal routes (see plans/active/retire_user_mgmt_api_*.plan.md).
 */
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

  const res = await fetch(`/api/v1/authorize?${params.toString()}`, {
    cache: "no-store",
  });

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
