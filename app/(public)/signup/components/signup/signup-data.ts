import { Brain, Briefcase, Database, Layers, Shield } from "lucide-react";

export const SERVICES = [
  {
    id: "data",
    name: "Data Access",
    icon: Database,
    color: "text-sky-400",
    price: "From £250/mo",
    desc: "Market data across 128 venues, 5 asset classes",
  },
  {
    id: "backtesting",
    name: "Research",
    icon: Brain,
    color: "text-violet-400",
    price: "Contact us",
    desc: "ML model training, strategy backtesting, signal configuration",
  },
  {
    id: "platform",
    name: "Trading Terminal",
    icon: Layers,
    color: "text-amber-400",
    price: "Contact us",
    desc: "Live trading, monitoring, execution, and control in one environment",
  },
  {
    id: "investment",
    name: "Investment Management",
    icon: Briefcase,
    color: "text-rose-400",
    price: "Contact us",
    desc: "FCA-authorised managed strategies with full reporting and oversight",
  },
  {
    id: "regulatory",
    name: "Regulatory Umbrella",
    icon: Shield,
    color: "text-slate-400",
    price: "Contact us",
    desc: "FCA Appointed Representative services for algo trading firms",
  },
];
export const ONBOARDING_SERVICES = new Set(["regulatory", "investment"]);
export const REG_ENGAGEMENT = [
  {
    id: "ar",
    label: "Appointed Representative (AR)",
    desc: "Operate as our AR under our FCA authorisation",
    tooltip:
      "You become an Appointed Representative of Odum Research under our FCA authorisation (975797). You can conduct regulated activities in your own name, with Odum providing regulatory oversight, compliance monitoring, and MLRO services.",
  },
  {
    id: "advisor",
    label: "Advisory",
    desc: "Contracted advisory role under our supervision",
    tooltip:
      "A contracted advisory arrangement where you operate under Odum's regulatory supervision without full AR status. Lighter setup, faster onboarding, with access to our compliance infrastructure and reporting tools.",
  },
];
export const REG_ACTIVITIES = [
  {
    id: "dealing_agent",
    label: "Dealing in Investments as Agent",
    tooltip:
      "Execute trades on behalf of your clients across regulated markets. You act as agent — Odum provides the regulatory framework, venue connectivity, and best execution oversight.",
  },
  {
    id: "arranging",
    label: "Arranging (Bringing About) Deals in Investments",
    tooltip:
      "Introduce clients to investment opportunities and bring about transactions. Covers introductions, deal structuring, and transaction facilitation under FCA rules.",
  },
  {
    id: "making_arrangements",
    label: "Making Arrangements with a View to Transactions",
    tooltip:
      "Facilitate the process that leads to investment transactions — for example, providing research, platforms, or infrastructure that enables clients to trade.",
  },
  {
    id: "managing",
    label: "Managing Investments (SMA only — see Fund Management below for fund structures)",
    tooltip:
      "Discretionary portfolio management for professional clients. You make investment decisions on behalf of clients within agreed mandates. Requires suitability assessment and ongoing reporting.",
  },
];
export const REG_ADDONS = [
  {
    id: "compliance",
    label: "Compliance Monitoring",
    tooltip:
      "Ongoing compliance oversight including transaction monitoring, suspicious activity reporting, and regulatory change tracking. Odum's compliance team monitors your activity.",
  },
  {
    id: "aml",
    label: "AML Monitoring",
    tooltip:
      "Anti-money laundering checks, ongoing customer due diligence, and suspicious transaction reporting as required under the Money Laundering Regulations.",
  },
  {
    id: "reporting",
    label: "P&L & Client Reporting",
    tooltip:
      "Automated P&L attribution, client portfolio reports, settlement tracking, and MiFID II transaction reporting. Generated from your live trading data.",
  },
];
export const REG_FUND_OPTS = [
  {
    id: "fund_crypto_spot",
    label: "Crypto Spot Fund (FCA + EU ESMA)",
    tooltip:
      "Regulated crypto spot fund vehicle managed by Odum under combined FCA and EU ESMA regulatory coverage. Includes fund operations, NAV calculation, and investor reporting.",
  },
  {
    id: "fund_derivatives",
    label: "Derivatives & Traditional Markets Fund (EU ESMA)",
    tooltip:
      "EU-regulated fund for crypto derivatives, options, futures, and traditional markets (equities, FX, fixed income, commodities). Full fund operations and regulatory reporting included.",
  },
];
export const INV_OPTS = [
  { id: "sma", label: "Separately Managed Account" },
  { id: "fund_access", label: "Fund Access" },
  { id: "strategy", label: "Strategy Allocation" },
  { id: "discretionary", label: "Full Discretionary" },
];
export type ApplicantType = "individual" | "company";
export interface DeclarationField {
  id: string;
  label: string;
  placeholder: string;
  multiline?: boolean;
}
export interface DocSlot {
  key: string;
  label: string;
  required: boolean | "investment_only";
  declaration?: DeclarationField[];
  applicantType?: ApplicantType;
}

export interface PendingUpload {
  file: Blob;
  file_name: string;
  content_type: string;
}
const SOF_FIELDS: DeclarationField[] = [
  {
    id: "employment",
    label: "Current employment / business activity",
    placeholder: "e.g. Director at XYZ Capital Ltd",
  },
  {
    id: "source",
    label: "Primary source of funds for trading",
    placeholder: "e.g. Business profits, salary, investment returns",
  },
  {
    id: "origin",
    label: "Country of origin of funds",
    placeholder: "e.g. United Kingdom",
  },
  {
    id: "expected_volume",
    label: "Expected annual trading volume",
    placeholder: "e.g. GBP 500,000 — 1,000,000",
  },
];
const WEALTH_FIELDS: DeclarationField[] = [
  {
    id: "net_worth",
    label: "Approximate net worth (excluding primary residence)",
    placeholder: "e.g. GBP 1,000,000 — 5,000,000",
  },
  {
    id: "liquid_assets",
    label: "Liquid assets available for investment",
    placeholder: "e.g. GBP 250,000",
  },
  { id: "income", label: "Annual income", placeholder: "e.g. GBP 150,000" },
  {
    id: "experience",
    label: "Investment experience",
    placeholder: "e.g. 10+ years in equities and crypto derivatives",
    multiline: true,
  },
];
const INDIVIDUAL_DOC_SLOTS: DocSlot[] = [
  {
    key: "proof_of_address",
    label: "Proof of Address (utility bill, bank statement)",
    required: true,
    applicantType: "individual",
  },
  {
    key: "identity",
    label: "Identity Document (passport, national ID)",
    required: true,
    applicantType: "individual",
  },
  {
    key: "source_of_funds",
    label: "Source of Funds Declaration",
    required: true,
    declaration: SOF_FIELDS,
  },
  {
    key: "wealth_declaration",
    label: "Wealth Self-Declaration",
    required: "investment_only",
    declaration: WEALTH_FIELDS,
  },
  {
    key: "management_agreement",
    label: "Management Agreement (if applicable)",
    required: false,
  },
];

const COMPANY_DOC_SLOTS: DocSlot[] = [
  {
    key: "incorporation",
    label: "Certificate of Incorporation",
    required: true,
    applicantType: "company",
  },
  {
    key: "company_activities",
    label: "Brief Description of Company Activities",
    required: true,
    applicantType: "company",
    declaration: [
      {
        id: "activities",
        label: "Primary business activities",
        placeholder: "e.g. Proprietary trading in crypto derivatives",
        multiline: true,
      },
      {
        id: "website",
        label: "Company website (optional)",
        placeholder: "e.g. https://example.com",
      },
    ],
  },
  {
    key: "ubo_identity",
    label: "Identity Documents for all UBOs (>25% ownership)",
    required: true,
    applicantType: "company",
  },
  {
    key: "ubo_proof_of_address",
    label: "Proof of Address for all UBOs (>25% ownership)",
    required: true,
    applicantType: "company",
  },
  {
    key: "source_of_funds",
    label: "Source of Funds Declaration",
    required: true,
    declaration: SOF_FIELDS,
  },
  {
    key: "wealth_declaration",
    label: "Wealth Self-Declaration",
    required: "investment_only",
    declaration: WEALTH_FIELDS,
  },
  {
    key: "management_agreement",
    label: "Management Agreement (if applicable)",
    required: false,
  },
];

export function getDocSlots(applicantType: ApplicantType): DocSlot[] {
  return applicantType === "company" ? COMPANY_DOC_SLOTS : INDIVIDUAL_DOC_SLOTS;
}

export const STEP_LABELS = ["Your Details", "Requirements", "Documents", "Review", "Submitted"];
