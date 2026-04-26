// Regulated Operating Models Presentation \u2014 data for 10-slide coverage deck.
// Marketing label: Regulated Operating Models. Legal/contract label: Regulatory Umbrella
// (retained on signup, contracts, and admin surfaces for backwards compat per
// SERVICE_LABELS SSOT in lib/copy/service-labels.ts).
// Last restructured: April 2026 \u2014 reframed around the 4-axis flexibility model
// (structure × scope × counterparty-facing × activity) with named competitors and
// the engagement shapes (assessed case by case) from the public briefing.

export const slides = [
  // ── Slide 1: Cover ────────────────────────────────────────
  {
    id: 1,
    type: "cover",
    title: "Regulated Operating Models",
    subtitle:
      "FCA-authorised operating coverage for Professional and Eligible Counterparty clients, where appropriate and subject to scope review. Material onboarding-time savings versus the 12\u201324 months of direct authorisation. Engagement shapes assessed case by case to match your operating model.",
    tagline: "Regulated Operating Models Deck",
    stats: [
      { value: "FCA 975797", label: "Authorisation" },
      { value: "Jan 2023", label: "Authorised" },
      { value: "1 Live", label: "Operating-Model Client" },
      { value: "3", label: "In Pipeline" },
      { value: "4", label: "Engagement Axes" },
    ],
  },

  // ── Slide 2: Why Structure Matters ────────────────────────
  {
    id: 2,
    type: "doctrine",
    title: "Why Structure Matters",
    subtitle:
      "Managing capital, executing trades, advising on investments \u2014 those are regulated activities. The line between software and advice is thinner than most firms think, and the consequences of getting it wrong are real.",
    points: [
      {
        problem: "Direct FCA authorisation takes 12\u201324 months and three-figure-thousand spend.",
        solution:
          "Operate under Odum's regulated coverage where appropriate, scope-matched to your activity. Onboarding timing assessed case by case after due diligence.",
      },
      {
        problem: "Building compliance infrastructure from scratch is expensive and easy to get wrong.",
        solution:
          "Use the same compliance infrastructure we built for our own $7.5M AUM \u2014 best-execution monitoring, MLRO services, transaction reporting.",
      },
      {
        problem: "Ongoing regulatory burden \u2014 TR, SM&CR, AML, supervision \u2014 is a permanent distraction.",
        solution:
          "Odum handles reporting officer services, transaction reporting, annual reviews, and financial promotions approval.",
      },
      {
        problem: "Getting it wrong has real consequences \u2014 fines, enforcement, reputational damage.",
        solution:
          "Live FCA permission with dealing, arranging, advising, and managing scope \u2014 scope-matched to what you actually do.",
      },
    ],
    differentiators: [
      "FCA Ref 975797 since January 2023",
      "Same compliance stack we use for our own capital",
      "First umbrella client live, three more in active scope discussion",
    ],
    conclusion: "Getting properly authorised does not have to be slow or expensive \u2014 if the scope is right.",
  },

  // ── Slide 3: The Four-Axis Flexibility Model ──────────────
  {
    id: 3,
    type: "doctrine",
    title: "The Four-Axis Flexibility Model",
    subtitle:
      "Every umbrella engagement shapes itself along four axes. Define where you sit on each and the right structure follows. This replaces the simplistic AR-vs-IM conversation most advisors start with.",
    points: [
      {
        problem: "Structure \u2014 how your entity relates to Odum.",
        solution:
          "Options: Odum manages investments on your behalf (IM) • Odum's permissions cover your activity (umbrella proper) • you operate as an Appointed Representative under Odum • a fund vehicle we jointly administer • adjacent services where Odum's permissions are not load-bearing.",
      },
      {
        problem: "Scope \u2014 which regulated activity you actually do.",
        solution:
          "Dealing in investments as agent • arranging deals in investments • advising on investments • managing investments • combinations thereof. We scope exactly what you need \u2014 no more, no less.",
      },
      {
        problem: "Counterparty-facing \u2014 who your clients are.",
        solution:
          "Odum-facing (Odum is the counterparty of record) or client-facing (your clients interact with you directly). Shapes who holds KYC, who signs the IMA, who controls the account.",
      },
      {
        problem: "Activity \u2014 what's actually happening operationally.",
        solution:
          "Execution on a regulated market • portfolio management of discretionary mandates • giving advice • promoting a fund • arranging introductions. Each triggers a different subset of regulatory obligations.",
      },
    ],
    differentiators: [
      "Concrete engagement shapes emerge from the axes (next slide), assessed case by case",
      "Default is Odum-as-IM (Shapes 1\u20132) \u2014 AR route (Shape 3) adds 4\u201312 weeks FCA lead time",
      "Shapes 4\u20135 cover adjacent services where Odum's permissions are not load-bearing",
    ],
    conclusion: "The engagement is shaped to the client, not the other way round.",
  },

  // ── Slide 4: The Five Engagement Shapes ───────────────────
  {
    id: 4,
    type: "packaging",
    title: "Engagement Shapes Within Regulated Operating Models",
    subtitle:
      "Each shape is a defined position on the four axes within this single engagement route. Pick one, or stack shapes as scope expands. All shapes are assessed case by case and available by separate agreement.",
    services: [
      {
        name: "Shape 1 \u2014 Odum as IM (SMA)",
        stages: ["Decision", "Execution", "Governance"],
        model: "From £4,000/month + setup",
        desc: "Discretionary managed account. Odum holds the Investment Management permission under FCA 975797 (legal/contract label). Client is the investor. Common starting shape, subject to scope review.",
      },
      {
        name: "Shape 2 \u2014 Odum as IM (Fund)",
        stages: ["Decision", "Execution", "Governance"],
        model: "Bespoke + fund admin costs",
        desc: "Pooled vehicle \u2014 crypto spot or derivatives/traditional. Combined FCA + EU wrapper available. Odum handles the AIFM activity.",
      },
      {
        name: "Shape 3 \u2014 Appointed Representative",
        stages: ["Execution", "Governance"],
        model: "From £4,000/month + setup + 4\u201312 week FCA lead time",
        desc: "You are customer-facing under Odum's brand permissions. Adds FCA notification and supervision. Only if you need customer-facing IM under your own brand.",
      },
      {
        name: "Shape 4 \u2014 Adjacent operational services",
        stages: ["Governance"],
        model: "Retainer-based",
        desc: "MLRO services, transaction reporting, financial promotions approval, compliance manual licensing. Odum's permissions not load-bearing.",
      },
      {
        name: "Shape 5 \u2014 Fund administration support",
        stages: ["Governance"],
        model: "Bespoke",
        desc: "Regulated fund vehicle setup, ongoing admin, best-execution monitoring. For firms operating their own funds who want Odum's compliance stack.",
      },
    ],
    note: "All activities limited to Professional Clients and Eligible Counterparties. No retail business. Scope is named, not assumed.",
  },

  // ── Slide 5: The Umbrella Landscape ───────────────────────
  {
    id: 5,
    type: "moat",
    title: "The Umbrella Landscape",
    subtitle:
      "If you are considering a regulatory umbrella or AR host, you have looked at some of the below. Each specialises. Odum is the only one with a live trading platform sitting underneath.",
    gaps: [
      {
        competitor: "G10 Capital / Sapia Partners",
        users: "Wealth management / crypto firms",
        gap: "Established AR hosts with broad scope. No underlying trading infrastructure \u2014 if your activity needs data, execution, or research, you source that separately. Brokers of coverage, not operators.",
        color: "cyan",
      },
      {
        competitor: "Thornbridge / Sturgeon Ventures",
        users: "Fund managers / advisors",
        gap: "Specialist hosts for discretionary managers and advisors. Built for TradFi mandates. Light on crypto scope, no DeFi, no sports, no integrated platform.",
        color: "violet",
      },
      {
        competitor: "Duff & Phelps / Kroll Advisory",
        users: "Large institutional",
        gap: "Major-brand regulatory and compliance consultancy. Premium pricing, longer onboarding, no platform integration \u2014 compliance is the service, not the system.",
        color: "emerald",
      },
      {
        competitor: "Capital Markets Platforms",
        users: "Execution-focused firms",
        gap: "AR host for execution-facing businesses. TradFi-oriented. No research stack, no alternative asset coverage, no integrated reporting.",
        color: "amber",
      },
      {
        competitor: "Direct FCA authorisation",
        users: "Firms with time/capital",
        gap: "You control the permissions. 12\u201324 month authorisation process, material spend, permanent compliance operation. Right choice for large operators \u2014 alternative for firms whose scope can be assessed and accommodated more quickly, where appropriate.",
        color: "cyan",
      },
      {
        competitor: "Offshore wrappers (Cayman / BVI)",
        users: "Offshore fund managers",
        gap: "Lighter touch, lower cost, less institutional comfort. Counterparty and LP scrutiny has moved decisively against opaque structures post-2023. Increasingly a hard sell to capital.",
        color: "rose",
      },
    ],
    callout:
      "Odum is an umbrella host that is also the trading platform underneath. Our permissions sit under the same stack that runs our own capital \u2014 so the compliance scope we sell is the one we actually operate.",
  },

  // ── Slide 6: What You Get ─────────────────────────────────
  {
    id: 6,
    type: "operations",
    title: "What You Get Operationally",
    columns: [
      {
        title: "Client Portal",
        items: [
          "Portfolio dashboard \u2014 NAV, returns attribution, position breakdown",
          "Trade history \u2014 filterable, exportable, full audit trail",
          "Compliance reports \u2014 best execution, transaction reporting",
          "Settlement and fee transparency",
        ],
      },
      {
        title: "Compliance Support",
        items: [
          "Money Laundering Reporting Officer services",
          "Ongoing regulatory supervision",
          "Annual compliance review",
          "Financial promotions approval for your materials",
        ],
      },
      {
        title: "Flexibility",
        items: [
          "Self-service \u2014 your tools and templates, you operate",
          "Managed \u2014 we handle all compliance end-to-end",
          "Bring your own processes \u2014 your team, our permissions",
          "Fund structure \u2014 we set up and admin the vehicle",
        ],
      },
    ],
    callout: "Same reporting tools we use for our own $7.5M AUM. Not a stripped-down version.",
    metrics: [
      { value: "10", label: "Attribution Factors" },
      { value: "Case-by-case", label: "Onboarding Timing" },
      { value: "$7.5M", label: "Our Own Capital" },
      { value: "FCA 975797", label: "Authorisation" },
    ],
  },

  // ── Slide 7: Common Questions ─────────────────────────────
  {
    id: 7,
    type: "faq",
    title: "Common Questions",
    subtitle: "",
    questions: [
      {
        q: "How long does onboarding take?",
        a: "Onboarding timing depends on the shape and is assessed case by case. Shapes 1, 2, 4, 5 are typically the fastest, subject to review. Shape 3 (AR) carries additional FCA lead time because of the notification process. You begin a fit review, upload documents at your pace, and proceed once due diligence is complete.",
      },
      {
        q: "Can I use my own compliance processes?",
        a: "Yes. You can operate as an umbrella client using your own compliance team with our oversight, or we can handle everything for you. Documented in the engagement scope.",
      },
      {
        q: "What about sanctions \u2014 Iran, Russia, similar?",
        a: "Hard stop. Odum does not engage with OFAC / UK / EU sanctioned jurisdictions, entities, or persons. We cannot extend our permissions to cover activity that conflicts with our sanctions obligations.",
      },
      {
        q: "What about fund structures?",
        a: "Two paths \u2014 crypto spot funds housed entirely by Odum, and derivatives/traditional market fund vehicles with combined FCA + EU regulatory coverage. Bespoke per engagement.",
      },
      {
        q: "Why should I trust you?",
        a: "We built this for ourselves first. The same compliance infrastructure runs our own $7.5M. Live clients across every service. Nothing ships that we would not trust with our own money. First umbrella client live, three more in active scope discussion.",
      },
      {
        q: "Can I combine umbrella with DART?",
        a: "Yes \u2014 this is the common path. Our first regulated-operating-model client is simultaneously a DART Trading Infrastructure client (client-provided signals capability) for perp-funding arbitrage. The regulated-operating-model engagement handles scope and oversight; DART handles execution and reporting.",
      },
    ],
  },

  // ── Slide 8: Get Started ──────────────────────────────────
  {
    id: 8,
    type: "ask",
    title: "Get Started",
    subtitle:
      "Begin a fit review online and upload documents at your own pace. Onboarding timing assessed case by case after due diligence.",
    asks: [
      {
        title: "Step 1 \u2014 Scope",
        items: [
          "Walk your activity against the four axes",
          "Identify which engagement shape fits, assessed case by case",
          "Complete the regulatory questionnaire (13 axes for regulated-operating-model prospects)",
        ],
      },
      {
        title: "Step 2 \u2014 Review",
        items: ["Due diligence review", "Compliance sign-off", "FCA notification (Shape 3 only)"],
      },
      {
        title: "Step 3 \u2014 Operate",
        items: [
          "Your clients get their own portal",
          "Portfolio performance, trade history, compliance reports",
          "Ongoing supervision, annual review",
        ],
      },
    ],
    contact: "ikenna@odum-research.com",
  },

  // ── Slide 9: Explore The Public Site ──────────────────────
  {
    id: 9,
    type: "demo",
    title: "Explore The Public Site",
    subtitle:
      "Forward these to firms scoping FCA coverage. The regulatory briefing goes deep on the four-axis flexibility model. Access code for the briefings hub is odum-briefings-2026.",
    sections: [
      {
        name: "Regulated Operating Models",
        desc: "Public landing \u2014 what regulated coverage covers and how scope is assessed",
        link: "/regulatory",
      },
      {
        name: "Regulated Operating Models Briefing",
        desc: "Four-axis flexibility model \u2014 engagement shapes explained, available by separate agreement",
        link: "/briefings/regulatory",
      },
      { name: "FAQ", desc: "Common objections \u2014 sanctions, scope, AR vs IM, timing", link: "/faq" },
      {
        name: "Fit Questionnaire",
        desc: "Thirteen axes for umbrella prospects (licence region, targets, MLRO, jurisdiction)",
        link: "/questionnaire",
      },
      { name: "Contact", desc: "Calendly for scheduling, prefilled form for typed intent", link: "/contact" },
    ],
    note: "Public-site links open in a new tab. Briefings hub is gated by the shared access code.",
  },

  // ── Slide 10: See It Live ─────────────────────────────────
  {
    id: 10,
    type: "demo",
    title: "See It Live \u2014 Client Portal & Compliance",
    subtitle: "Click any card to walk through the client portal and compliance tools in demo mode.",
    sections: [
      {
        name: "Client Reporting",
        desc: "Executive dashboard, investment book of records",
        link: "/services/reports/executive",
      },
      {
        name: "Compliance & Reconciliation",
        desc: "Audit trails, break detection, settlement tracking",
        link: "/services/reports/reconciliation",
      },
      {
        name: "Risk & Monitoring",
        desc: "Alerts, scenario analysis, position monitoring",
        link: "/services/observe/scenarios",
      },
      {
        name: "Trading & Positions",
        desc: "Live positions, orders, returns attribution",
        link: "/services/trading/positions",
      },
    ],
    note: "Platform links require sign-in (investor@odum-research.com / OdumIR2026!). Demo persona \u2014 never real client capital.",
  },
];
