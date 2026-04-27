// Source: lib/marketing/structure-options.ts (SSOT for the two routes).
//
// Client-facing operating routes diagram — /briefings/regulated-operating-models.
// Two parallel routes side by side:
//   LEFT  — Pooled Fund route (EU / affiliate-supported): End Investors ->
//           Client Entity / Branded Manager -> Fund Vehicle / Share Classes
//           appointed by an Affiliate Manager / AIFM / Fund Admin (EU);
//           the affiliate delegates strategy management to Odum (UK) as
//           sub-adviser / delegated trading manager. Fund assets sit with
//           a qualified custodian. Potential EU distribution posture via
//           the affiliate route.
//   RIGHT — SMA route (UK / direct): Underlying Clients / SMA Investors ->
//           Client Entity / Branded Manager -> SMA Books / Client Accounts
//           appoint Odum (UK) as investment manager via IMA / advisory /
//           execution mandate. Client-owned custodian / venue accounts
//           with scoped read + execute, no withdrawals. Potential UK
//           client-facing posture via the Odum route.
//
// The diagram is shape-agnostic and illustrative — the legal appointment
// chain depends on executed mandate documents. The role-clarity sentence
// is rendered below the SVG (sourced from STRUCTURE_ROLE_CLARITY).
//
// Static inline SVG + Tailwind. No animation, no third-party libs.
// Responsive: scales via viewBox + preserveAspectRatio; horizontal scroll
// kicks in below the 720px min-width on small viewports.

import * as React from "react";
import { WidgetScroll } from "@/components/shared/widget-scroll";
import { STRUCTURE_ROLE_CLARITY } from "@/lib/marketing/structure-options";

export function RegUmbrellaHierarchyDiagram(): React.JSX.Element {
  return (
    <figure
      className="mb-8 overflow-hidden rounded-lg border border-border bg-card/40 p-6"
      data-testid="reg-umbrella-hierarchy-diagram"
      aria-labelledby="reg-umbrella-diagram-title"
    >
      <figcaption id="reg-umbrella-diagram-title" className="mb-1 text-sm font-semibold text-foreground">
        Client-facing operating routes
      </figcaption>
      <p className="mb-4 text-xs text-muted-foreground">
        Where the client entity sits, how Odum fits, and how Pooled Fund vs SMA structures differ.
      </p>

      <WidgetScroll axes="horizontal" scrollbarSize="thin" className="w-full">
        <svg
          viewBox="0 0 960 800"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-labelledby="reg-routes-svg-title reg-routes-svg-desc"
          className="mx-auto block h-auto w-full min-w-[720px] max-w-[960px]"
        >
          <title id="reg-routes-svg-title">Client-facing operating routes</title>
          <desc id="reg-routes-svg-desc">
            Two parallel client-facing operating routes shown side by side. The Pooled Fund route on the left runs
            through end investors, a client entity or branded manager, a fund vehicle with share classes, and an
            affiliate manager / AIFM / fund administrator that appoints the fund and delegates strategy management to
            Odum as sub-adviser. Fund assets sit with a qualified custodian. The SMA route on the right runs through
            underlying clients, a client entity or branded manager, SMA books or client accounts, and Odum as investment
            manager appointed via an IMA / advisory / execution mandate. Custody remains with client-owned venue
            accounts under scoped read-and-execute access with no withdrawals. Both routes connect to the same CeFi /
            TradFi / DeFi venue layer.
          </desc>

          {/* ============================================================
              LEFT COLUMN — Pooled Fund route (EU / affiliate-supported)
              Container: x=20..460, width 440. Inner cells centred on 240.
              Two-up sub-row centres: 130 (left) and 350 (right).
              ============================================================ */}

          {/* Column header */}
          <text
            x="240"
            y="38"
            textAnchor="middle"
            className="fill-emerald-700 text-[15px] font-semibold dark:fill-emerald-300"
          >
            Pooled Fund route (EU / affiliate-supported)
          </text>

          {/* Column frame */}
          <rect
            x="20"
            y="56"
            width="440"
            height="610"
            rx="10"
            className="fill-emerald-50/30 stroke-emerald-500/40 dark:fill-emerald-950/15 dark:stroke-emerald-500/30"
            strokeWidth={1}
          />

          {/* Row 1 — End Investors */}
          <g>
            <rect
              x="60"
              y="76"
              width="360"
              height="46"
              rx="8"
              className="fill-white stroke-emerald-400/70 dark:fill-zinc-900 dark:stroke-emerald-500/60"
              strokeWidth={1.25}
            />
            <text
              x="240"
              y="103"
              textAnchor="middle"
              className="fill-zinc-900 text-[13px] font-semibold dark:fill-zinc-100"
            >
              End Investors
            </text>
          </g>
          <text
            x="270"
            y="138"
            textAnchor="start"
            className="fill-emerald-700 text-[10px] italic dark:fill-emerald-400"
          >
            relationship / brand
          </text>
          <path
            d="M 240 122 L 240 144"
            className="fill-none stroke-emerald-400/80 dark:stroke-emerald-500/70"
            strokeWidth={1.25}
            markerEnd="url(#reg-arrow-emerald)"
          />

          {/* Row 2 — Client Entity / Branded Manager */}
          <g>
            <rect
              x="60"
              y="150"
              width="360"
              height="56"
              rx="8"
              className="fill-emerald-50 stroke-emerald-500/70 dark:fill-emerald-950/40 dark:stroke-emerald-500/70"
              strokeWidth={1.25}
            />
            <text
              x="240"
              y="174"
              textAnchor="middle"
              className="fill-emerald-900 text-[13px] font-semibold dark:fill-emerald-200"
            >
              Client Entity / Branded Manager
            </text>
            <text x="240" y="192" textAnchor="middle" className="fill-emerald-800 text-[10.5px] dark:fill-emerald-300">
              client-facing brand · investor relationship · distribution layer
            </text>
          </g>
          <text
            x="270"
            y="226"
            textAnchor="start"
            className="fill-emerald-700 text-[10px] italic dark:fill-emerald-400"
          >
            distribution / onboarding
          </text>
          <path
            d="M 240 206 L 240 232"
            className="fill-none stroke-emerald-400/80 dark:stroke-emerald-500/70"
            strokeWidth={1.25}
            markerEnd="url(#reg-arrow-emerald)"
          />

          {/* Row 3a — Fund Vehicle / Share Classes (left) */}
          <g>
            <rect
              x="40"
              y="240"
              width="200"
              height="60"
              rx="8"
              className="fill-sky-50 stroke-sky-400/70 dark:fill-sky-950/40 dark:stroke-sky-500/60"
              strokeWidth={1.25}
            />
            <text
              x="140"
              y="264"
              textAnchor="middle"
              className="fill-sky-900 text-[12.5px] font-semibold dark:fill-sky-200"
            >
              Fund Vehicle / Share Classes
            </text>
            <text x="140" y="282" textAnchor="middle" className="fill-sky-800 text-[10px] dark:fill-sky-300">
              investors subscribe into the fund
            </text>
          </g>

          {/* Row 3b — Affiliate Manager / AIFM / Fund Admin */}
          <g>
            <rect
              x="252"
              y="240"
              width="188"
              height="60"
              rx="8"
              className="fill-emerald-50 stroke-emerald-500/70 dark:fill-emerald-950/40 dark:stroke-emerald-500/70"
              strokeWidth={1.25}
            />
            <text
              x="346"
              y="260"
              textAnchor="middle"
              className="fill-emerald-900 text-[12px] font-semibold dark:fill-emerald-200"
            >
              Affiliate Manager /
            </text>
            <text
              x="346"
              y="274"
              textAnchor="middle"
              className="fill-emerald-900 text-[12px] font-semibold dark:fill-emerald-200"
            >
              AIFM / Fund Admin (EU)
            </text>
            <text x="346" y="290" textAnchor="middle" className="fill-emerald-800 text-[10px] dark:fill-emerald-300">
              manager of record · admin / fund operations
            </text>
          </g>

          {/* "appoints" arrow Fund Vehicle -> Affiliate */}
          <path
            d="M 240 270 L 252 270"
            className="fill-none stroke-emerald-500/70 dark:stroke-emerald-400/70"
            strokeWidth={1.25}
            markerEnd="url(#reg-arrow-emerald)"
          />
          <text
            x="246"
            y="262"
            textAnchor="middle"
            className="fill-emerald-700 text-[10px] italic dark:fill-emerald-400"
          >
            appoints
          </text>

          {/* "delegates strategy management" arrow down from Affiliate to Odum-sub-adviser */}
          <path
            d="M 346 300 L 346 326"
            className="fill-none stroke-emerald-500/70 dark:stroke-emerald-400/70"
            strokeWidth={1.25}
            markerEnd="url(#reg-arrow-emerald)"
          />
          <text
            x="356"
            y="318"
            textAnchor="start"
            className="fill-emerald-700 text-[10px] italic dark:fill-emerald-400"
          >
            delegates strategy management
          </text>

          {/* Row 4 — Odum (UK) sub-adviser / delegated manager */}
          <g>
            <rect
              x="240"
              y="332"
              width="200"
              height="56"
              rx="8"
              className="fill-emerald-100 stroke-emerald-600/80 dark:fill-emerald-950/60 dark:stroke-emerald-400/80"
              strokeWidth={1.4}
            />
            <text
              x="340"
              y="354"
              textAnchor="middle"
              className="fill-emerald-900 text-[12.5px] font-semibold dark:fill-emerald-100"
            >
              Odum (UK)
            </text>
            <text x="340" y="370" textAnchor="middle" className="fill-emerald-800 text-[10px] dark:fill-emerald-300">
              sub-adviser / delegated manager ·
            </text>
            <text x="340" y="382" textAnchor="middle" className="fill-emerald-800 text-[10px] dark:fill-emerald-300">
              trading · reporting
            </text>
          </g>

          {/* trading instructions / reporting -> custodian */}
          <text
            x="246"
            y="406"
            textAnchor="start"
            className="fill-emerald-700 text-[10px] italic dark:fill-emerald-400"
          >
            trading instructions / reporting
          </text>
          <path
            d="M 340 388 L 340 410 L 240 410 L 240 432"
            className="fill-none stroke-emerald-400/70 dark:stroke-emerald-500/60"
            strokeWidth={1.25}
            strokeDasharray="4 3"
          />
          {/* Fund Vehicle -> Custodian (assets path) */}
          <path
            d="M 140 300 L 140 432"
            className="fill-none stroke-sky-400/70 dark:stroke-sky-500/60"
            strokeWidth={1.25}
          />

          {/* Row 5 — Qualified Custodian */}
          <g>
            <rect
              x="60"
              y="432"
              width="360"
              height="50"
              rx="8"
              className="fill-sky-50 stroke-sky-400/70 dark:fill-sky-950/40 dark:stroke-sky-500/60"
              strokeWidth={1.25}
            />
            <text
              x="240"
              y="455"
              textAnchor="middle"
              className="fill-sky-900 text-[12.5px] font-semibold dark:fill-sky-200"
            >
              Qualified Custodian
            </text>
            <text x="240" y="471" textAnchor="middle" className="fill-sky-800 text-[10px] dark:fill-sky-300">
              fund assets held separately
            </text>
          </g>

          {/* Connectors from Custodian to Venue boxes */}
          <path
            d="M 140 482 L 140 504"
            className="fill-none stroke-amber-400/60 dark:stroke-amber-500/60"
            strokeWidth={1.25}
            strokeDasharray="4 3"
          />
          <path
            d="M 240 482 L 240 504"
            className="fill-none stroke-amber-400/60 dark:stroke-amber-500/60"
            strokeWidth={1.25}
            strokeDasharray="4 3"
          />
          <path
            d="M 340 482 L 340 504"
            className="fill-none stroke-amber-400/60 dark:stroke-amber-500/60"
            strokeWidth={1.25}
            strokeDasharray="4 3"
          />

          {/* Row 6 — Venue boxes (CeFi / TradFi / DeFi) */}
          <g>
            <rect
              x="60"
              y="504"
              width="160"
              height="56"
              rx="8"
              className="fill-white stroke-amber-400 dark:fill-zinc-900 dark:stroke-amber-500"
              strokeWidth={1.25}
            />
            <text
              x="140"
              y="525"
              textAnchor="middle"
              className="fill-amber-900 text-[12px] font-semibold dark:fill-amber-200"
            >
              CeFi
            </text>
            <text x="140" y="541" textAnchor="middle" className="fill-zinc-700 text-[10px] dark:fill-zinc-300">
              centralised venues
            </text>
          </g>
          <g>
            <rect
              x="225"
              y="504"
              width="120"
              height="56"
              rx="8"
              className="fill-white stroke-amber-400 dark:fill-zinc-900 dark:stroke-amber-500"
              strokeWidth={1.25}
            />
            <text
              x="285"
              y="525"
              textAnchor="middle"
              className="fill-amber-900 text-[12px] font-semibold dark:fill-amber-200"
            >
              TradFi
            </text>
            <text x="285" y="541" textAnchor="middle" className="fill-zinc-700 text-[10px] dark:fill-zinc-300">
              regulated venues
            </text>
          </g>
          <g>
            <rect
              x="350"
              y="504"
              width="100"
              height="56"
              rx="8"
              className="fill-white stroke-amber-400 dark:fill-zinc-900 dark:stroke-amber-500"
              strokeWidth={1.25}
            />
            <text
              x="400"
              y="525"
              textAnchor="middle"
              className="fill-amber-900 text-[12px] font-semibold dark:fill-amber-200"
            >
              DeFi
            </text>
            <text x="400" y="541" textAnchor="middle" className="fill-zinc-700 text-[10px] dark:fill-zinc-300">
              on-chain venues
            </text>
          </g>

          {/* Distribution posture callout (left column) */}
          <g>
            <rect
              x="40"
              y="586"
              width="400"
              height="60"
              rx="8"
              className="fill-emerald-50 stroke-emerald-500/60 dark:fill-emerald-950/30 dark:stroke-emerald-500/50"
              strokeWidth={1}
              strokeDasharray="5 3"
            />
            <text
              x="240"
              y="608"
              textAnchor="middle"
              className="fill-emerald-800 text-[11px] italic dark:fill-emerald-300"
            >
              Potential EU distribution posture via
            </text>
            <text
              x="240"
              y="624"
              textAnchor="middle"
              className="fill-emerald-800 text-[11px] italic dark:fill-emerald-300"
            >
              affiliate route, subject to agreements
            </text>
            <text x="240" y="638" textAnchor="middle" className="fill-emerald-700 text-[10px] dark:fill-emerald-400">
              and regulatory scope.
            </text>
          </g>

          {/* ============================================================
              RIGHT COLUMN — SMA route (UK / direct)
              Container: x=500..940, width 440. Inner cells centred on 720.
              Two-up sub-row centres: 600 (left) and 820 (right).
              ============================================================ */}

          {/* Column header */}
          <text
            x="720"
            y="38"
            textAnchor="middle"
            className="fill-violet-700 text-[15px] font-semibold dark:fill-violet-300"
          >
            SMA route (UK / direct)
          </text>

          {/* Column frame */}
          <rect
            x="500"
            y="56"
            width="440"
            height="610"
            rx="10"
            className="fill-violet-50/30 stroke-violet-500/40 dark:fill-violet-950/15 dark:stroke-violet-500/30"
            strokeWidth={1}
          />

          {/* Row 1 — Underlying Clients / SMA Investors */}
          <g>
            <rect
              x="540"
              y="76"
              width="360"
              height="46"
              rx="8"
              className="fill-white stroke-violet-400/70 dark:fill-zinc-900 dark:stroke-violet-500/60"
              strokeWidth={1.25}
            />
            <text
              x="720"
              y="103"
              textAnchor="middle"
              className="fill-zinc-900 text-[13px] font-semibold dark:fill-zinc-100"
            >
              Underlying Clients / SMA Investors
            </text>
          </g>
          <text x="750" y="138" textAnchor="start" className="fill-violet-700 text-[10px] italic dark:fill-violet-400">
            relationship / brand
          </text>
          <path
            d="M 720 122 L 720 144"
            className="fill-none stroke-violet-400/80 dark:stroke-violet-500/70"
            strokeWidth={1.25}
            markerEnd="url(#reg-arrow-violet)"
          />

          {/* Row 2 — Client Entity / Branded Manager */}
          <g>
            <rect
              x="540"
              y="150"
              width="360"
              height="56"
              rx="8"
              className="fill-violet-50 stroke-violet-500/70 dark:fill-violet-950/40 dark:stroke-violet-500/70"
              strokeWidth={1.25}
            />
            <text
              x="720"
              y="174"
              textAnchor="middle"
              className="fill-violet-900 text-[13px] font-semibold dark:fill-violet-200"
            >
              Client Entity / Branded Manager
            </text>
            <text x="720" y="192" textAnchor="middle" className="fill-violet-800 text-[10.5px] dark:fill-violet-300">
              client-facing brand · investor relationship · distribution layer
            </text>
          </g>
          <text x="750" y="226" textAnchor="start" className="fill-violet-700 text-[10px] italic dark:fill-violet-400">
            mandate / onboarding
          </text>
          <path
            d="M 720 206 L 720 232"
            className="fill-none stroke-violet-400/80 dark:stroke-violet-500/70"
            strokeWidth={1.25}
            markerEnd="url(#reg-arrow-violet)"
          />

          {/* Row 3a — SMA Books / Client Accounts */}
          <g>
            <rect
              x="520"
              y="240"
              width="200"
              height="60"
              rx="8"
              className="fill-violet-50 stroke-violet-400/70 dark:fill-violet-950/40 dark:stroke-violet-500/60"
              strokeWidth={1.25}
            />
            <text
              x="620"
              y="262"
              textAnchor="middle"
              className="fill-violet-900 text-[12.5px] font-semibold dark:fill-violet-200"
            >
              SMA Books / Client Accounts
            </text>
            <text x="620" y="278" textAnchor="middle" className="fill-violet-800 text-[10px] dark:fill-violet-300">
              legally separate per
            </text>
            <text x="620" y="290" textAnchor="middle" className="fill-violet-800 text-[10px] dark:fill-violet-300">
              client or mandate
            </text>
          </g>

          {/* Row 3b — Odum (UK) IM */}
          <g>
            <rect
              x="732"
              y="240"
              width="188"
              height="60"
              rx="8"
              className="fill-emerald-100 stroke-emerald-600/80 dark:fill-emerald-950/60 dark:stroke-emerald-400/80"
              strokeWidth={1.4}
            />
            <text
              x="826"
              y="262"
              textAnchor="middle"
              className="fill-emerald-900 text-[12.5px] font-semibold dark:fill-emerald-100"
            >
              Odum (UK)
            </text>
            <text x="826" y="278" textAnchor="middle" className="fill-emerald-800 text-[10px] dark:fill-emerald-300">
              investment manager /
            </text>
            <text x="826" y="290" textAnchor="middle" className="fill-emerald-800 text-[10px] dark:fill-emerald-300">
              execution · reporting
            </text>
          </g>

          {/* IMA / advisory / execution mandate arrow SMA-Books -> Odum */}
          <path
            d="M 720 270 L 732 270"
            className="fill-none stroke-violet-500/70 dark:stroke-violet-400/70"
            strokeWidth={1.25}
            markerEnd="url(#reg-arrow-violet)"
          />
          <text x="726" y="262" textAnchor="middle" className="fill-violet-700 text-[10px] italic dark:fill-violet-400">
            IMA / advisory / execution
          </text>

          {/* orders / reporting -> custodian */}
          <text
            x="836"
            y="318"
            textAnchor="start"
            className="fill-emerald-700 text-[10px] italic dark:fill-emerald-400"
          >
            orders / reporting
          </text>
          <path
            d="M 826 300 L 826 330 L 720 330 L 720 354"
            className="fill-none stroke-emerald-400/70 dark:stroke-emerald-500/60"
            strokeWidth={1.25}
            strokeDasharray="4 3"
          />
          {/* SMA Books -> Custodian (capital remains with client) */}
          <path
            d="M 620 300 L 620 354"
            className="fill-none stroke-violet-400/70 dark:stroke-violet-500/60"
            strokeWidth={1.25}
          />

          {/* Row 5 — Client-owned Custodian / Venue Accounts */}
          <g>
            <rect
              x="540"
              y="354"
              width="360"
              height="68"
              rx="8"
              className="fill-sky-50 stroke-sky-400/70 dark:fill-sky-950/40 dark:stroke-sky-500/60"
              strokeWidth={1.25}
            />
            <text
              x="720"
              y="378"
              textAnchor="middle"
              className="fill-sky-900 text-[12.5px] font-semibold dark:fill-sky-200"
            >
              Client-owned Custodian / Venue Accounts
            </text>
            <text x="720" y="396" textAnchor="middle" className="fill-sky-800 text-[10.5px] italic dark:fill-sky-300">
              scoped read + execute only ·
            </text>
            <text x="720" y="412" textAnchor="middle" className="fill-sky-800 text-[10.5px] italic dark:fill-sky-300">
              no withdrawals
            </text>
          </g>

          {/* Connectors from Custodian to Venue boxes */}
          <path
            d="M 620 422 L 620 504"
            className="fill-none stroke-amber-400/60 dark:stroke-amber-500/60"
            strokeWidth={1.25}
            strokeDasharray="4 3"
          />
          <path
            d="M 720 422 L 720 504"
            className="fill-none stroke-amber-400/60 dark:stroke-amber-500/60"
            strokeWidth={1.25}
            strokeDasharray="4 3"
          />
          <path
            d="M 820 422 L 820 504"
            className="fill-none stroke-amber-400/60 dark:stroke-amber-500/60"
            strokeWidth={1.25}
            strokeDasharray="4 3"
          />

          {/* Row 6 — Venue boxes (CeFi / TradFi / DeFi) */}
          <g>
            <rect
              x="540"
              y="504"
              width="160"
              height="56"
              rx="8"
              className="fill-white stroke-amber-400 dark:fill-zinc-900 dark:stroke-amber-500"
              strokeWidth={1.25}
            />
            <text
              x="620"
              y="525"
              textAnchor="middle"
              className="fill-amber-900 text-[12px] font-semibold dark:fill-amber-200"
            >
              CeFi
            </text>
            <text x="620" y="541" textAnchor="middle" className="fill-zinc-700 text-[10px] dark:fill-zinc-300">
              centralised venues
            </text>
          </g>
          <g>
            <rect
              x="705"
              y="504"
              width="120"
              height="56"
              rx="8"
              className="fill-white stroke-amber-400 dark:fill-zinc-900 dark:stroke-amber-500"
              strokeWidth={1.25}
            />
            <text
              x="765"
              y="525"
              textAnchor="middle"
              className="fill-amber-900 text-[12px] font-semibold dark:fill-amber-200"
            >
              TradFi
            </text>
            <text x="765" y="541" textAnchor="middle" className="fill-zinc-700 text-[10px] dark:fill-zinc-300">
              regulated venues
            </text>
          </g>
          <g>
            <rect
              x="830"
              y="504"
              width="100"
              height="56"
              rx="8"
              className="fill-white stroke-amber-400 dark:fill-zinc-900 dark:stroke-amber-500"
              strokeWidth={1.25}
            />
            <text
              x="880"
              y="525"
              textAnchor="middle"
              className="fill-amber-900 text-[12px] font-semibold dark:fill-amber-200"
            >
              DeFi
            </text>
            <text x="880" y="541" textAnchor="middle" className="fill-zinc-700 text-[10px] dark:fill-zinc-300">
              on-chain venues
            </text>
          </g>

          {/* Distribution posture callout (right column) */}
          <g>
            <rect
              x="520"
              y="586"
              width="400"
              height="60"
              rx="8"
              className="fill-violet-50 stroke-violet-500/60 dark:fill-violet-950/30 dark:stroke-violet-500/50"
              strokeWidth={1}
              strokeDasharray="5 3"
            />
            <text
              x="720"
              y="608"
              textAnchor="middle"
              className="fill-violet-800 text-[11px] italic dark:fill-violet-300"
            >
              Potential UK client-facing posture via
            </text>
            <text
              x="720"
              y="624"
              textAnchor="middle"
              className="fill-violet-800 text-[11px] italic dark:fill-violet-300"
            >
              Odum route, subject to agreements
            </text>
            <text x="720" y="638" textAnchor="middle" className="fill-violet-700 text-[10px] dark:fill-violet-400">
              and regulatory scope.
            </text>
          </g>

          {/* ============================================================
              BOTTOM LEGEND — three pills spanning both columns
              ============================================================ */}
          <g>
            <rect
              x="20"
              y="686"
              width="920"
              height="68"
              rx="10"
              className="fill-zinc-50 stroke-zinc-300 dark:fill-zinc-900 dark:stroke-zinc-700"
              strokeWidth={1}
            />
          </g>
          <g>
            <text x="40" y="710" className="fill-zinc-900 text-[11px] font-semibold dark:fill-zinc-100">
              Client entity remains visible
            </text>
            <text x="40" y="725" className="fill-zinc-600 text-[10px] dark:fill-zinc-400">
              as the branded / relationship layer
            </text>
          </g>
          <g>
            <text x="350" y="710" className="fill-zinc-900 text-[11px] font-semibold dark:fill-zinc-100">
              Odum manages or supports strategy
            </text>
            <text x="350" y="725" className="fill-zinc-600 text-[10px] dark:fill-zinc-400">
              execution depending on structure
            </text>
          </g>
          <g>
            <text x="660" y="710" className="fill-zinc-900 text-[11px] font-semibold dark:fill-zinc-100">
              UK + EU coverage can be combined
            </text>
            <text x="660" y="725" className="fill-zinc-600 text-[10px] dark:fill-zinc-400">
              through the agreed operating model
            </text>
          </g>

          {/* Footer note */}
          <text x="480" y="785" textAnchor="middle" className="fill-zinc-500 text-[10px] italic dark:fill-zinc-500">
            Illustrative operating structure only — final legal, regulatory, and distribution posture depends on the
            executed agreements and jurisdictional scope.
          </text>

          {/* Arrow markers */}
          <defs>
            <marker
              id="reg-arrow-emerald"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-emerald-500/80 dark:fill-emerald-400/80" />
            </marker>
            <marker
              id="reg-arrow-violet"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-violet-500/80 dark:fill-violet-400/80" />
            </marker>
          </defs>
        </svg>
      </WidgetScroll>

      <p className="mt-4 text-xs text-muted-foreground">{STRUCTURE_ROLE_CLARITY}</p>
    </figure>
  );
}
