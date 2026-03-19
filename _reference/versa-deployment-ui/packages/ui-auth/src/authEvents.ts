/**
 * Auth event emitter for UEI-compatible telemetry from browser clients.
 *
 * Fires a fire-and-forget POST to the backend relay endpoint
 * (unified-trading-library `make_events_relay_router()`) so that UI auth
 * lifecycle events flow into the standard GCS event sink.
 *
 * Network errors are silently swallowed — telemetry MUST NEVER break auth flows.
 */

/** UEI lifecycle event names for UI auth flows. */
export type AuthEventName =
  | "LOGIN_INITIATED"
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "LOGOUT"
  | "SESSION_EXPIRED";

interface AuthEventPayload {
  event_name: AuthEventName;
  severity: "INFO" | "WARNING";
  details: Record<string, string | boolean | null>;
  timestamp: string;
}

/**
 * POST a UEI-compatible auth event to `eventEndpoint`.
 *
 * @param eventName  - One of the AUTH_EVENT_NAMES above.
 * @param details    - Contextual key/value pairs (provider, reason, etc.).
 * @param eventEndpoint - Backend relay URL (e.g. "/api/events"). No-op if omitted.
 */
export function emitAuthEvent(
  eventName: AuthEventName,
  details: Record<string, string | boolean | null>,
  eventEndpoint?: string,
): void {
  if (!eventEndpoint) return;

  const payload: AuthEventPayload = {
    event_name: eventName,
    severity:
      eventName === "LOGIN_FAILURE" || eventName === "SESSION_EXPIRED"
        ? "WARNING"
        : "INFO",
    details,
    timestamp: new Date().toISOString(),
  };

  fetch(eventEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {
    // Intentionally silent — telemetry failures must not affect auth UX.
  });
}

/**
 * Session sentinel key stored in sessionStorage.
 * Set on LOGIN_SUCCESS, cleared on LOGOUT.
 * Allows detecting SESSION_EXPIRED on subsequent page loads.
 *
 * @internal
 */
export const SESSION_SENTINEL_KEY = "_uts_auth_session";
