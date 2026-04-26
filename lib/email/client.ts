"use client";

import type { EmailDispatchOutcome } from "@/lib/email/email-result";

/**
 * Client-side wrapper over a POST to a server email route.
 *
 * Used by the public /contact form (and any other public surfaces that need
 * to dispatch a transactional email). The server route is responsible for the
 * actual Resend call, authorisation, validation, and idempotency — this client
 * helper just normalises the fetch response into an `EmailDispatchOutcome`
 * the UI can render via `EmailStatusBanner`.
 */
export async function dispatchEmail(
  routePath: string,
  payload: Record<string, unknown>,
): Promise<EmailDispatchOutcome> {
  let response: Response;
  try {
    response = await fetch(routePath, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    return {
      status: "client-error",
      message: "Could not reach the server. Check your connection and try again.",
      detail: { error: err instanceof Error ? err.message : String(err) },
    };
  }

  if (response.ok) {
    let body: Record<string, unknown> = {};
    try {
      body = (await response.json()) as Record<string, unknown>;
    } catch {
      // Server returned 2xx with non-JSON; treat as queued.
    }
    const message =
      typeof body.message === "string" && body.message.length > 0
        ? body.message
        : "Thanks — your message has been sent. We'll be in touch within 24 hours.";
    return {
      status: "queued",
      message,
      ...(Object.keys(body).length > 0 ? { detail: body } : {}),
    };
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await response.json()) as Record<string, unknown>;
  } catch {
    // Server returned non-JSON error.
  }
  const message =
    typeof body.message === "string" && body.message.length > 0
      ? body.message
      : response.status >= 500
        ? "Something went wrong on our side. Please try again in a moment."
        : "We couldn't process that request. Please review your details and try again.";

  return {
    status: response.status >= 500 ? "server-error" : "client-error",
    message,
    detail: { http_status: response.status, ...body },
  };
}
