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
  if (siteUrl.includes("uat.odum-research.com") || siteUrl.includes("odumresearch.co.uk")) {
    return "staging-mail.odum-research.com";
  }
  return "resend.dev";
}

export function getSenderFor(type: "hello" | "auth"): string {
  const domain = getMailDomain();
  if (domain === "resend.dev") return "onboarding@resend.dev";
  return type === "hello" ? `hello@${domain}` : `auth@${domain}`;
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
  const payload: Record<string, unknown> = {
    from,
    to: Array.isArray(params.to) ? params.to : [params.to],
    subject: params.subject,
    html: params.html,
  };
  if (params.replyTo) payload.reply_to = params.replyTo;
  if (params.bcc?.length) payload.bcc = params.bcc;

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
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
