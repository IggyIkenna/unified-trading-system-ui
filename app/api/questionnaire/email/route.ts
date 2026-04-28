/**
 * POST /api/questionnaire/email
 *
 * Sends a single confirmation email containing the prospect's full questionnaire
 * responses. Goes to the prospect (To:) with info@odum-research.com BCC'd, so the
 * submitter sees exactly what we received and we have a durable inbox record.
 *
 * Called client-side after a successful Firestore write. Fire-and-forget — email
 * failure does not block the questionnaire submission success UX.
 */

import { NextResponse } from "next/server";
import { sendEmail, getSenderFor, escapeHtml } from "@/lib/email/resend";
import { CALENDLY_URL } from "@/lib/marketing/calendly";

const INTERNAL_ADDRESS = "info@odum-research.com";

/**
 * Returns the global Deep Dive access code if one is configured for the
 * current build, otherwise null. We expose this in the confirmation email
 * so a returning visitor on a different browser can paste it into the
 * /briefings gate without needing to re-fill the form.
 */
function getDeepDiveAccessCode(): string | null {
  const code = process.env.NEXT_PUBLIC_BRIEFING_ACCESS_CODE ?? "";
  return code.length > 0 ? code : null;
}

const SERVICE_FAMILY_LABELS: Record<string, string> = {
  DART: "DART: Data Analytics, Research & Trading",
  RegUmbrella: "Regulatory Umbrella",
  combo: "DART + Regulatory Umbrella",
  Signals: "Odum Signals",
};

const REFERRAL_LABELS: Record<string, string> = {
  referral: "Personal referral / introduction",
  linkedin: "LinkedIn",
  x: "X / Twitter",
  search: "Google / search",
  event: "Industry event / conference",
  publication: "Newsletter / publication",
  existing: "Existing relationship with Odum",
  other: "Other",
};

const FIRM_LOCATION_LABELS: Record<string, string> = {
  uk: "UK",
  eu: "EU",
  us: "US",
  cayman: "Cayman",
  bvi: "BVI",
  singapore: "Singapore",
  hong_kong: "Hong Kong",
  switzerland: "Switzerland",
  uae: "UAE",
  other: "Other",
  exploring: "Exploring",
};

interface QuestionnaireEmailBody {
  email?: string;
  firmName?: string;
  firmLocation?: string;
  firmLocationNotes?: string;
  referralSource?: string;
  referralSourceNotes?: string;
  serviceFamily?: string;
  submissionId?: string;
  categories?: string[];
  instrumentTypes?: string[];
  venueScope?: string | string[];
  strategyStyle?: string[];
  fundStructure?: string[];
  marketNeutral?: string | null;
  shareClassPreferences?: string[];
  riskProfile?: string | null;
  targetSharpeMin?: string;
  leveragePreference?: string | null;
  licenceRegion?: string | null;
  targets3mo?: string;
  targets1yr?: string;
  targets2yr?: string;
  ownMlro?: string;
  entityJurisdiction?: string;
  supportedCurrencies?: string[];
}

function joinList(arr: readonly string[] | undefined, fallback = "n/a"): string {
  if (!arr || arr.length === 0) return fallback;
  return arr.join(", ");
}

function venueScopeLabel(v: string | string[] | undefined): string {
  if (!v) return "n/a";
  if (v === "all") return "All venues";
  if (Array.isArray(v)) return v.length > 0 ? v.join(", ") : "All venues";
  return v;
}

function referralLine(src?: string, notes?: string): string {
  if (!src) return "n/a";
  const label = REFERRAL_LABELS[src] ?? src;
  return notes ? `${label} (${notes})` : label;
}

function locationLine(loc?: string, notes?: string): string {
  if (!loc) return "n/a";
  const label = FIRM_LOCATION_LABELS[loc] ?? loc;
  return notes ? `${label} (${notes})` : label;
}

export async function POST(request: Request) {
  let body: QuestionnaireEmailBody;
  try {
    body = (await request.json()) as QuestionnaireEmailBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const serviceName = SERVICE_FAMILY_LABELS[body.serviceFamily ?? ""] ?? body.serviceFamily ?? "Odum Platform";
  const displayName = body.firmName || body.email || "prospect";
  const isRegUmbrella = body.serviceFamily === "RegUmbrella" || body.serviceFamily === "combo";

  // Build the response table — every answer the prospect provided.
  // Reg-Umbrella-only rows render only when the prospect picked that path.
  const rows: [string, string][] = [
    ["Service family", serviceName],
    ["Firm", body.firmName || "n/a"],
    ["Email", body.email || "n/a"],
    ["Firm location", locationLine(body.firmLocation, body.firmLocationNotes)],
    ["Heard about us", referralLine(body.referralSource, body.referralSourceNotes)],
    ["Categories", joinList(body.categories)],
    ["Instrument types", joinList(body.instrumentTypes)],
    ["Venue scope", venueScopeLabel(body.venueScope)],
    ["Strategy styles", joinList(body.strategyStyle)],
    ["Fund structure", joinList(body.fundStructure)],
    ["Market exposure", body.marketNeutral || "n/a"],
    ["Share class preference", joinList(body.shareClassPreferences)],
    ["Risk profile", body.riskProfile || "n/a"],
    ["Target Sharpe (min)", body.targetSharpeMin || "n/a"],
    ["Leverage preference", body.leveragePreference || "n/a"],
  ];
  if (isRegUmbrella) {
    rows.push(
      ["Licence region", body.licenceRegion || "n/a"],
      ["Targets: 3 months", body.targets3mo || "n/a"],
      ["Targets: 1 year", body.targets1yr || "n/a"],
      ["Targets: 2 years", body.targets2yr || "n/a"],
      ["Own MLRO?", body.ownMlro || "n/a"],
      ["Entity jurisdiction", body.entityJurisdiction || "n/a"],
      ["Supported currencies", joinList(body.supportedCurrencies)],
    );
  }
  rows.push(["Submission ID", body.submissionId || "n/a"]);

  const tableRows = rows
    .map(
      ([k, v], i) =>
        `<tr${
          i % 2 === 1 ? ' style="background:#f9f9f9"' : ""
        }><td style="padding:8px 12px;font-weight:600;width:200px;vertical-align:top">${escapeHtml(
          k,
        )}</td><td style="padding:8px 12px;vertical-align:top">${escapeHtml(String(v))}</td></tr>`,
    )
    .join("");

  const accessCode = getDeepDiveAccessCode();
  const accessCodeBlock = accessCode
    ? `
      <div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:14px 16px;margin:20px 0;font-size:14px">
        <p style="margin:0;font-weight:600;color:#92400e">Your Deep Dive access code</p>
        <p style="margin:8px 0 0;font-family:'SF Mono',Menlo,monospace;font-size:18px;letter-spacing:0.04em;color:#451a03;font-weight:600">
          ${escapeHtml(accessCode)}
        </p>
        <p style="margin:8px 0 0;color:#78350f;font-size:13px">
          This browser is already unlocked. Use this code to open the briefings hub from
          any other device.
        </p>
      </div>`
    : "";

  const html = `
    <div style="font-family:sans-serif;max-width:640px;margin:0 auto;color:#111">
      <h2 style="margin-bottom:4px">Thanks for your questionnaire</h2>
      <p style="color:#6b7280;margin-top:0">
        ${escapeHtml(serviceName)}${
          body.firmName ? ` (${escapeHtml(body.firmName)})` : ""
        }: your submission is in. Here's what happens next.
      </p>
      ${accessCodeBlock}
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:6px;padding:14px 16px;margin:20px 0;font-size:14px">
        <p style="margin:0;font-weight:600;color:#1d4ed8">Book a 30-minute walk-through call</p>
        <p style="margin:8px 0 0;color:#1e40af">
          <a href="${CALENDLY_URL}" style="color:#1d4ed8;font-weight:600">Pick a slot on the calendar →</a>
        </p>
      </div>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:6px;padding:14px 16px;margin:20px 0;font-size:14px;color:#374151">
        <p style="margin:0;font-weight:600;color:#111">What happens after the call</p>
        <ol style="margin:8px 0 0 18px;padding:0;color:#374151;line-height:1.6">
          <li>Strategy Evaluation pack: a deeper questionnaire about your specific strategies + risk model.</li>
          <li>Curated Sandbox demo: your stack, your strategies, mocked data, end-to-end on uat.odum-research.com.</li>
          <li>Production onboarding: sign engagement docs, then live access.</li>
        </ol>
      </div>
      <details style="margin:20px 0;color:#6b7280;font-size:13px">
        <summary style="cursor:pointer;font-weight:600;color:#374151">What you submitted</summary>
        <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:13px;margin-top:8px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden">
          ${tableRows}
        </table>
      </details>
      <p style="color:#6b7280;font-size:13px;margin-top:24px">
        Anything you'd like to clarify or change? Reply to this email or contact us at
        <a href="mailto:info@odum-research.com" style="color:#111">info@odum-research.com</a>.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#9ca3af;font-size:12px">Odum Capital Ltd: FCA authorised · FRN 975797</p>
    </div>
  `;

  // If the prospect didn't provide an email, just send to info@.
  const to = body.email || INTERNAL_ADDRESS;
  const bcc = body.email ? [INTERNAL_ADDRESS] : undefined;

  const result = await sendEmail({
    from: getSenderFor("hello"),
    to,
    bcc,
    replyTo: body.email ? INTERNAL_ADDRESS : undefined,
    subject: `Your questionnaire responses: ${displayName} (${serviceName})`,
    html,
  });
  if (!result.ok) {
    console.error(`[questionnaire/email] sendEmail !ok to ${to}: ${result.reason ?? "?"}`);
  } else if (!result.sent) {
    console.warn(`[questionnaire/email] sendEmail not sent to ${to}: ${result.reason ?? "?"}`);
  } else {
    console.info(`[questionnaire/email] sendEmail OK to ${to}`);
  }

  // Gate: client unlocks the briefings hub only when the email actually
  // dispatched successfully. This stops a fake-email submission from
  // unlocking — Resend rejects syntactically-malformed addresses, and
  // domain-level rejections surface as result.ok=false. The "sent" flag
  // distinguishes "no API key configured" (ok=true, sent=false) from real
  // delivery — both treated as failure here so a misconfigured deploy
  // can't silently let everyone in.
  const sent = result.ok && result.sent;
  return NextResponse.json(
    {
      ok: sent,
      sent,
      reason: sent ? undefined : (result.reason ?? "send_failed"),
    },
    { status: sent ? 200 : 502 },
  );
}
