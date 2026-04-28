export interface ResendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  bcc?: string[];
}

export interface SendResult {
  ok: boolean;
  sent: boolean;
  reason?: string;
}

function getMailDomain(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  if (siteUrl.includes("www.odum-research.com")) return "mail.odum-research.com";
  if (siteUrl.includes("uat.odum-research.com") || siteUrl.includes("odum-research.co.uk")) {
    return "mail.odum-research.com"; // uat shares prod sender: staging subdomain DNS not set up
  }
  return "resend.dev";
}

export function getSenderFor(type: "hello" | "auth"): string {
  const domain = getMailDomain();
  if (domain === "resend.dev") return "onboarding@resend.dev";
  return type === "hello" ? `hello@${domain}` : `auth@${domain}`;
}

/**
 * True when we're routing through Resend's `onboarding@resend.dev` sandbox
 * (i.e., local dev with no NEXT_PUBLIC_SITE_URL pointing at a real domain).
 * In that mode Resend will reject any recipient that isn't the test account
 * registered with the Resend free tier — so we override the To/Bcc with
 * `getSandboxRecipient()` instead of the real applicant's email.
 */
export function isSandboxMode(): boolean {
  return getMailDomain() === "resend.dev";
}

/**
 * Single mailbox the Resend sandbox is allowed to send to. Configurable via
 * RESEND_TEST_RECIPIENT for whichever Resend account you're using; defaults
 * to the operator's verified Resend account email — needs the hyphenated
 * `odum-research.com`, not the .co.uk redirect domain.
 */
export function getSandboxRecipient(): string {
  return process.env.RESEND_TEST_RECIPIENT ?? "ikenna@odum-research.com";
}

export function getResendApiKey(): string | null {
  return process.env.RESEND_API_KEY ?? null;
}

export async function sendEmail(params: ResendEmailParams): Promise<SendResult> {
  const apiKey = getResendApiKey();
  if (!apiKey) {
    return { ok: true, sent: false, reason: "no_api_key" };
  }

  const from = params.from ?? getSenderFor("hello");
  const sandbox = isSandboxMode();

  // Sandbox routing: Resend's free-tier sandbox refuses any recipient that
  // isn't the registered test account. So in local dev we redirect EVERY
  // outbound email to that single mailbox and prepend a banner to the HTML
  // body showing what the original to/bcc would have been. UAT + prod fall
  // through unchanged.
  const originalToList = (Array.isArray(params.to) ? params.to : [params.to]).filter(Boolean);
  const originalBccList = params.bcc?.filter(Boolean) ?? [];
  const toList = sandbox ? [getSandboxRecipient()] : originalToList;
  const bccList = sandbox ? [] : originalBccList;
  const html = sandbox
    ? `<div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;padding:10px 12px;font-family:sans-serif;font-size:12px;color:#78350f;margin-bottom:16px">
         <strong>Sandbox routing</strong>: this email was redirected from
         <code>${escapeHtml(originalToList.join(", "))}</code>${
           originalBccList.length ? ` (bcc <code>${escapeHtml(originalBccList.join(", "))}</code>)` : ""
         } to <code>${escapeHtml(getSandboxRecipient())}</code> because Resend's free-tier sandbox only allows sending to the registered test account.
         In UAT / prod this header disappears and the email goes to the real recipient.
       </div>${params.html}`
    : params.html;

  const payload: Record<string, unknown> = {
    from,
    to: toList,
    subject: sandbox ? `[sandbox] ${params.subject}` : params.subject,
    html,
  };
  if (params.replyTo) payload.reply_to = params.replyTo;
  if (bccList.length) payload.bcc = bccList;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[resend] send failed", res.status, err);
    return { ok: false, sent: false, reason: `resend_${res.status}` };
  }

  return { ok: true, sent: true };
}

export function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
