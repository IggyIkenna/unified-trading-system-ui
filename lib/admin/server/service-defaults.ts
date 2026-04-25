/**
 * Default service-status map for a (role, status) pair.
 *
 * Mirrors the legacy user-management-api `getDefaultServicesForUser` so
 * profiles created by the new native /signup route remain shape-compatible
 * with profiles created by the old API. Drift here means the admin UI
 * renders inconsistent service columns for users created across the
 * cutover, so changes need to be deliberate.
 */
import "server-only";

export type ServiceState = "pending" | "not_applicable";

export interface ServiceDefaults {
  github: ServiceState;
  slack: ServiceState;
  microsoft365: ServiceState;
  gcp: ServiceState;
  aws: ServiceState;
  portal: ServiceState;
}

function roleNeedsSlack(role: string): boolean {
  return role !== "shareholder";
}
function roleNeedsGithub(role: string): boolean {
  return role === "admin" || role === "collaborator";
}
function roleNeedsM365(role: string): boolean {
  const collaboratorM365Enabled = String(process.env.COLLABORATOR_M365_ENABLED ?? "true") === "true";
  return (
    role === "admin" ||
    role === "accounting" ||
    role === "operations" ||
    (collaboratorM365Enabled && role === "collaborator")
  );
}
function roleNeedsCloud(role: string): boolean {
  return role === "admin" || role === "collaborator";
}

export function getDefaultServicesForUser(role: string, status: string): ServiceDefaults {
  if (status === "offboarded" || status === "pending_approval" || status === "rejected") {
    return {
      github: "not_applicable",
      slack: "not_applicable",
      microsoft365: "not_applicable",
      gcp: "not_applicable",
      aws: "not_applicable",
      portal: status === "pending_approval" ? "pending" : "not_applicable",
    };
  }
  return {
    github: roleNeedsGithub(role) ? "pending" : "not_applicable",
    slack: roleNeedsSlack(role) ? "pending" : "not_applicable",
    microsoft365: roleNeedsM365(role) ? "pending" : "not_applicable",
    gcp: roleNeedsCloud(role) ? "pending" : "not_applicable",
    aws: roleNeedsCloud(role) ? "pending" : "not_applicable",
    portal: "pending",
  };
}

/**
 * Best-effort admin-fanout email — looks up the notification_preferences
 * collection for recipients subscribed to `eventType` and emits one email
 * via Resend. Failures are swallowed; signup must not block on email.
 */
export async function notifyAdminsForEvent(
  eventType: string,
  payload: { subject: string; html: string },
): Promise<void> {
  try {
    const { notificationPreferencesCollection } = await import("./collections");
    const { sendEmail } = await import("@/lib/email/resend");
    const snap = await notificationPreferencesCollection().get();
    const emails = snap.docs
      .map((d) => d.data() as { event_type?: string; enabled?: boolean; recipient_email?: string })
      .filter((d) => d.event_type === eventType && d.enabled !== false)
      .map((d) => d.recipient_email)
      .filter((e): e is string => !!e && e.length > 0);
    if (emails.length > 0) {
      await sendEmail({ to: emails, subject: payload.subject, html: payload.html });
    }
  } catch {
    /* admin notify is best-effort */
  }
}
