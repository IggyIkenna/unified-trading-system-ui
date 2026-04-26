/**
 * Route helpers for email-sending API routes.
 *
 * Thin adapters between the `sendEmail` wrapper's `SendResult` shape and the
 * envelope shape API routes return to the client. Keeps each route's reply
 * consistent: `{ ok, sent, reason? }`.
 */

import type { SendResult } from "./resend";

export interface RouteEmailEnvelope {
  ok: boolean;
  sent: boolean;
  reason?: string;
}

export function routeResponseFromSend(result: SendResult): RouteEmailEnvelope {
  return {
    ok: result.ok,
    sent: result.sent,
    ...(result.reason ? { reason: result.reason } : {}),
  };
}
