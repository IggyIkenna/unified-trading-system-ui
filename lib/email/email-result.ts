/**
 * Outcome shape returned by `dispatchEmail` (lib/email/client.ts) and consumed by
 * `EmailStatusBanner` (components/email/email-status-banner.tsx).
 *
 * Design: thin client-side wrapper over a `fetch` to a server route. The route
 * decides whether the email was sent successfully and returns 2xx, 4xx, or 5xx.
 * The client maps that to one of three states the UI can render.
 */
export type EmailDispatchStatus = "queued" | "client-error" | "server-error";

export interface EmailDispatchOutcome {
  readonly status: EmailDispatchStatus;
  /** Human-readable message safe to display to the user. */
  readonly message: string;
  /** Optional structured details (e.g. error code, request id) for diagnostics. */
  readonly detail?: Record<string, unknown>;
}

export function isQueued(outcome: EmailDispatchOutcome | null): boolean {
  return outcome?.status === "queued";
}

export function isError(outcome: EmailDispatchOutcome | null): boolean {
  return outcome?.status === "client-error" || outcome?.status === "server-error";
}
