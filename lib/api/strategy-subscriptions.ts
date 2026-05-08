/**
 * Plan D — typed client for the UTA strategy-instance subscription endpoints.
 *
 * UTA endpoints (gated behind dart_exclusive_enabled):
 *   POST   /api/v1/strategy-instances/{id}/subscribe
 *   DELETE /api/v1/strategy-instances/{id}/subscribe
 *   POST   /api/v1/strategy-instances/{id}/fork
 *
 * SSOT: plans/active/dart_exclusive_subscription_research_fork_2026_04_21.plan
 */

export type SubscriptionType = "dart_exclusive" | "im_allocation" | "signals_in";

export interface SubscriptionRecord {
  readonly instance_id: string;
  readonly client_id: string;
  readonly subscription_type: SubscriptionType;
  readonly subscribed_at: string;
  readonly version_id: string;
  readonly exclusive_lock: boolean;
}

export interface ExclusiveLockError {
  readonly status: 409;
  readonly detail: string;
}

const UTA_BASE = process.env.NEXT_PUBLIC_UTA_BASE_URL || "/api/uta";

export class ExclusiveLockViolationError extends Error {
  status = 409 as const;
  constructor(message: string) {
    super(message);
    this.name = "ExclusiveLockViolationError";
  }
}

async function postJson(path: string, body: object, headers: Record<string, string> = {}): Promise<Response> {
  return fetch(`${UTA_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

export async function subscribeToInstance(args: {
  instanceId: string;
  clientId: string;
  subscriptionType: SubscriptionType;
  authToken?: string;
}): Promise<SubscriptionRecord> {
  const headers: Record<string, string> = {};
  if (args.authToken) headers.Authorization = `Bearer ${args.authToken}`;
  const response = await postJson(
    `/api/v1/strategy-instances/${encodeURIComponent(args.instanceId)}/subscribe`,
    { client_id: args.clientId, subscription_type: args.subscriptionType },
    headers,
  );
  if (response.status === 409) {
    const body = (await response.json()) as { detail?: string };
    throw new ExclusiveLockViolationError(body.detail ?? "exclusive lock contention");
  }
  if (!response.ok) {
    throw new Error(`subscribe ${response.status}: ${await response.text()}`);
  }
  return (await response.json()) as SubscriptionRecord;
}

export async function unsubscribeFromInstance(args: {
  instanceId: string;
  clientId: string;
  authToken?: string;
}): Promise<{ released_at: string }> {
  const headers: Record<string, string> = {};
  if (args.authToken) headers.Authorization = `Bearer ${args.authToken}`;
  const url = `${UTA_BASE}/api/v1/strategy-instances/${encodeURIComponent(args.instanceId)}/subscribe?client_id=${encodeURIComponent(args.clientId)}`;
  const response = await fetch(url, { method: "DELETE", headers });
  if (!response.ok) {
    throw new Error(`unsubscribe ${response.status}: ${await response.text()}`);
  }
  return (await response.json()) as { released_at: string };
}

export interface ForkRequestPayload {
  readonly clientId: string;
  readonly changedFields: readonly [string, string, string][];
  readonly unchangedFingerprint?: string;
  readonly authToken?: string;
}

export interface VersionRecord {
  readonly version_id: string;
  readonly parent_instance_id: string;
  readonly parent_version_id: string | null;
  readonly maturity_phase: string;
  readonly status: string;
  readonly authored_by: string;
}

/**
 * Plan D Phase 4 — list active subscriptions for the caller's org.
 *
 * The UTA endpoint `GET /api/v1/strategy-instances/subscriptions?client_id=...`
 * is the production wiring; the strategy-catalogue page calls this on mount
 * and falls back to the local placeholder when the call returns 404 / 5xx /
 * network error so mock-mode + offline-dev keeps working without a live API.
 */
export async function listSubscriptionsForOrg(args: {
  clientId: string;
  authToken?: string;
}): Promise<readonly SubscriptionRecord[]> {
  const headers: Record<string, string> = {};
  if (args.authToken) headers.Authorization = `Bearer ${args.authToken}`;
  const url = `${UTA_BASE}/api/v1/strategy-instances/subscriptions?client_id=${encodeURIComponent(args.clientId)}`;
  const response = await fetch(url, { method: "GET", headers });
  if (!response.ok) {
    throw new Error(`list-subscriptions ${response.status}: ${await response.text()}`);
  }
  const body = (await response.json()) as { subscriptions?: readonly SubscriptionRecord[] };
  return body.subscriptions ?? [];
}

export async function forkInstance(instanceId: string, payload: ForkRequestPayload): Promise<VersionRecord> {
  const headers: Record<string, string> = {};
  if (payload.authToken) headers.Authorization = `Bearer ${payload.authToken}`;
  const response = await postJson(
    `/api/v1/strategy-instances/${encodeURIComponent(instanceId)}/fork`,
    {
      client_id: payload.clientId,
      changed_fields: payload.changedFields,
      unchanged_fingerprint: payload.unchangedFingerprint ?? "",
    },
    headers,
  );
  if (!response.ok) {
    throw new Error(`fork ${response.status}: ${await response.text()}`);
  }
  return (await response.json()) as VersionRecord;
}
