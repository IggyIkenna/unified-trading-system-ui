/**
 * Branded HTML email templates.
 *
 * Minimal helpers used by transactional email routes (Strategy Review,
 * Strategy Evaluation status, Demo Session). Each helper returns a string
 * of HTML; compose into a body array, .join("\n"), then wrap with
 * `wrapBrandedEmail`.
 *
 * Inline-style only — most email clients ignore <style> blocks. Restrained
 * institutional palette to match the public site.
 */

const COLORS = {
  bgPanel: "#0B0D10",
  textPrimary: "#F4F6F8",
  textSecondary: "#A7AFBA",
  textMuted: "#8B93A0",
  borderSoft: "rgba(255,255,255,0.08)",
  accentCyan: "#22D3EE",
  accentGold: "#C8A94A",
  ctaBg: "#22D3EE",
  ctaText: "#06121A",
  calloutBg: "#0F1417",
  calloutBorder: "rgba(34,211,238,0.20)",
} as const;

interface ParagraphOptions {
  muted?: boolean;
  small?: boolean;
}

export function heading(title: string, eyebrow?: string): string {
  const eyebrowHtml = eyebrow
    ? `<p style="margin:0 0 8px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${COLORS.accentGold};font-weight:600">${eyebrow}</p>`
    : "";
  return `<div style="margin:0 0 24px">${eyebrowHtml}<h1 style="margin:0;font-size:24px;line-height:1.3;color:${COLORS.textPrimary};font-weight:600">${title}</h1></div>`;
}

export function paragraph(html: string, opts: ParagraphOptions = {}): string {
  const fontSize = opts.small ? "12px" : "15px";
  const color = opts.muted ? COLORS.textMuted : COLORS.textSecondary;
  return `<p style="margin:0 0 16px;font-size:${fontSize};line-height:1.6;color:${color}">${html}</p>`;
}

interface PrimaryButtonOptions {
  href: string;
  label: string;
}

export function primaryButton({ href, label }: PrimaryButtonOptions): string {
  return `<div style="margin:24px 0;text-align:left">
    <a href="${href}" style="display:inline-block;padding:12px 22px;background-color:${COLORS.ctaBg};color:${COLORS.ctaText};font-size:14px;font-weight:600;text-decoration:none;border-radius:6px">${label}</a>
  </div>`;
}

interface FallbackLinkOptions {
  href: string;
}

export function fallbackLink({ href }: FallbackLinkOptions): string {
  return `<p style="margin:0 0 24px;font-size:11px;line-height:1.6;color:${COLORS.textMuted}">If the button above doesn&rsquo;t work, paste this link into your browser:<br /><a href="${href}" style="color:${COLORS.accentCyan};word-break:break-all;text-decoration:underline">${href}</a></p>`;
}

interface CalloutOptions {
  title: string;
  body: string;
}

export function callout({ title, body }: CalloutOptions): string {
  return `<div style="margin:24px 0;padding:14px 16px;background-color:${COLORS.calloutBg};border:1px solid ${COLORS.calloutBorder};border-radius:6px">
    <p style="margin:0 0 6px;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:${COLORS.accentCyan};font-weight:600">${title}</p>
    <div style="font-size:13px;line-height:1.5;color:${COLORS.textSecondary}">${body}</div>
  </div>`;
}

interface WrapBrandedEmailOptions {
  /** Hidden preheader text shown by mail clients alongside the subject. */
  preheader?: string;
  /** Composed HTML body (use heading/paragraph/primaryButton/etc. helpers). */
  body: string;
}

export function wrapBrandedEmail({ preheader = "", body }: WrapBrandedEmailOptions): string {
  const preheaderHtml = preheader
    ? `<div style="display:none;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${preheader}</div>`
    : "";
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Odum Research</title>
  </head>
  <body style="margin:0;padding:0;background-color:#07080A;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
    ${preheaderHtml}
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#07080A">
      <tr>
        <td align="center" style="padding:32px 16px">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="max-width:600px;width:100%;background-color:${COLORS.bgPanel};border:1px solid ${COLORS.borderSoft};border-radius:8px;overflow:hidden">
            <tr>
              <td style="padding:32px 32px 8px">
                <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${COLORS.textMuted};font-weight:600">Odum Research &middot; FCA 975797</p>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 32px">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 32px;border-top:1px solid ${COLORS.borderSoft}">
                <p style="margin:0;font-size:11px;line-height:1.5;color:${COLORS.textMuted}">Odum Research &middot; <a href="https://odum-research.com" style="color:${COLORS.textMuted};text-decoration:underline">odum-research.com</a> &middot; <a href="mailto:info@odum-research.com" style="color:${COLORS.textMuted};text-decoration:underline">info@odum-research.com</a></p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
