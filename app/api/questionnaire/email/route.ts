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

const INTERNAL_ADDRESS = "info@odum-research.com";

const SERVICE_FAMILY_LABELS: Record<string, string> = {
  DART: "DART — Data Analytics, Research & Trading",
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

function joinList(arr: readonly string[] | undefined, fallback = "—"): string {
  if (!arr || arr.length === 0) return fallback;
  return arr.join(", ");
}

function venueScopeLabel(v: string | string[] | undefined): string {
  if (!v) return "—";
  if (v === "all") return "All venues";
  if (Array.isArray(v)) return v.length > 0 ? v.join(", ") : "All venues";
  return v;
}

function referralLine(src?: string, notes?: string): string {
  if (!src) return "—";
  const label = REFERRAL_LABELS[src] ?? src;
  return notes ? `${label} (${notes})` : label;
}

function locationLine(loc?: string, notes?: string): string {
  if (!loc) return "—";
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
    ["Firm", body.firmName || "—"],
    ["Email", body.email || "—"],
    ["Firm location", locationLine(body.firmLocation, body.firmLocationNotes)],
    ["Heard about us", referralLine(body.referralSource, body.referralSourceNotes)],
    ["Categories", joinList(body.categories)],
    ["Instrument types", joinList(body.instrumentTypes)],
    ["Venue scope", venueScopeLabel(body.venueScope)],
    ["Strategy styles", joinList(body.strategyStyle)],
    ["Fund structure", joinList(body.fundStructure)],
    ["Market exposure", body.marketNeutral || "—"],
    ["Share class preference", joinList(body.shareClassPreferences)],
    ["Risk profile", body.riskProfile || "—"],
    ["Target Sharpe (min)", body.targetSharpeMin || "—"],
    ["Leverage preference", body.leveragePreference || "—"],
  ];
  if (isRegUmbrella) {
    rows.push(
      ["Licence region", body.licenceRegion || "—"],
      ["Targets — 3 months", body.targets3mo || "—"],
      ["Targets — 1 year", body.targets1yr || "—"],
      ["Targets — 2 years", body.targets2yr || "—"],
      ["Own MLRO?", body.ownMlro || "—"],
      ["Entity jurisdiction", body.entityJurisdiction || "—"],
      ["Supported currencies", joinList(body.supportedCurrencies)],
    );
  }
  rows.push(["Submission ID", body.submissionId || "—"]);

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

  const html = `
    <div style="font-family:sans-serif;max-width:640px;margin:0 auto;color:#111">
      <h2 style="margin-bottom:4px">Thanks for your questionnaire</h2>
      <p style="color:#6b7280;margin-top:0">
        Below is what we received for <strong>${escapeHtml(serviceName)}</strong>${
          body.firmName ? ` (${escapeHtml(body.firmName)})` : ""
        }. A copy of this email has been sent to our team — we'll review it and be in touch.
      </p>
      <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px;margin-top:16px;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden">
        ${tableRows}
      </table>
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:6px;padding:14px 16px;margin:24px 0;font-size:14px">
        <p style="margin:0;font-weight:600;color:#15803d">After our intro call</p>
        <p style="margin:6px 0 0;color:#166534">
          We'll set you up in our sandbox at
          <a href="https://uat.odum-research.com" style="color:#15803d;font-weight:600">uat.odum-research.com</a>
          — a curated demo environment configured to your stack so you can see the
          platform end-to-end before any commitment.
        </p>
      </div>
      <p style="color:#6b7280;font-size:13px;margin-top:24px">
        Anything you'd like to clarify or change? Reply to this email or contact us at
        <a href="mailto:info@odum-research.com" style="color:#111">info@odum-research.com</a>.
      </p>
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
      <p style="color:#9ca3af;font-size:12px">Odum Capital Ltd — FCA authorised · FRN 975797</p>
    </div>
  `;

  // If the prospect didn't provide an email, just send to info@.
  const to = body.email || INTERNAL_ADDRESS;
  const bcc = body.email ? [INTERNAL_ADDRESS] : undefined;

  await sendEmail({
    from: getSenderFor("hello"),
    to,
    bcc,
    replyTo: body.email ? INTERNAL_ADDRESS : undefined,
    subject: `Your questionnaire responses — ${displayName} (${serviceName})`,
    html,
  });

  return NextResponse.json({ ok: true });
}
