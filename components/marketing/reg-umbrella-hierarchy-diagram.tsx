// Source: codex/14-playbooks/shared-core/org-fund-client-entity-model.md
//
// Regulatory umbrella hierarchy diagram — /regulatory page.
// Static inline SVG + Tailwind. No animation, no third-party libs.
// Shows the multi-vehicle hierarchy under one umbrella client:
//   Umbrella Client (multi-vehicle mandate) ->
//     Sub-Fund 1 (pooled, N share classes) -> N end-investors
//     Sub-Fund 2 (pooled) -> M end-investors
//     SMA A (per end-investor) -> single book
//   -> Venue API keys (same scoped-key model across sub-entities; N:1 supervisory rollup).
// The diagram is shape-agnostic — the umbrella client may operate under Odum as IM
// of record (Shapes 1 or 2, the default) or as appointed representative of Odum
// (Shape 3). Commercial / operational structure is identical; only the regulatory
// posture between the umbrella client and Odum changes.
//
// Responsive: renders clean >= 1280px, reflows at mobile widths via the
// surrounding flex container. The SVG uses viewBox + preserveAspectRatio
// to scale without losing legibility.

import * as React from "react";
import { WidgetScroll } from "@/components/shared/widget-scroll";

export function RegUmbrellaHierarchyDiagram(): React.JSX.Element {
  return (
    <figure
      className="mb-8 overflow-hidden rounded-lg border border-border bg-card/40 p-6"
      data-testid="reg-umbrella-hierarchy-diagram"
      aria-labelledby="reg-umbrella-diagram-title"
    >
      <figcaption id="reg-umbrella-diagram-title" className="mb-4 text-sm font-semibold text-foreground">
        Example multi-vehicle operating model
      </figcaption>

      <WidgetScroll axes="horizontal" scrollbarSize="thin" className="w-full">
        <svg
          viewBox="0 0 960 620"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-labelledby="reg-umbrella-svg-title reg-umbrella-svg-desc"
          className="mx-auto block h-auto w-full min-w-[560px] max-w-[960px]"
        >
          <title id="reg-umbrella-svg-title">Example multi-vehicle operating model</title>
          <desc id="reg-umbrella-svg-desc">
            A regulatory umbrella client operates a multi-vehicle mandate, orchestrating two sub-funds and one SMA
            underneath. Sub-Fund 1 is pooled with N share classes for N end-investors, Sub-Fund 2 is pooled with M share
            classes for M end-investors, and SMA A is a legally separate managed account for a single end-investor. All
            sub-entities use the same scoped-venue-key model, and all supervisory artefacts flow upward to the umbrella
            client in an N-to-one rollup.
          </desc>

          {/* ===== Row 1: Regulatory Umbrella Client ===== */}
          <g>
            <rect
              x="300"
              y="20"
              width="360"
              height="60"
              rx="8"
              className="fill-emerald-50 stroke-emerald-500/70 dark:fill-emerald-950/40 dark:stroke-emerald-500/70"
              strokeWidth={1.5}
            />
            <text
              x="480"
              y="44"
              textAnchor="middle"
              className="fill-emerald-900 text-[14px] font-semibold dark:fill-emerald-200"
            >
              Umbrella Client
            </text>
            <text x="480" y="62" textAnchor="middle" className="fill-emerald-800 text-[11px] dark:fill-emerald-400">
              Multi-vehicle mandate &mdash; N sub-funds + N SMAs
            </text>
            <text x="480" y="76" textAnchor="middle" className="fill-emerald-700 text-[10px] dark:fill-emerald-400">
              Regulatory posture set by mandate shape
            </text>
          </g>

          {/* Connectors from Umbrella down to three sub-entities */}
          <path
            d="M 480 80 L 480 106 L 200 106 L 200 136"
            className="fill-none stroke-neutral-400 dark:stroke-neutral-600"
            strokeWidth={1.5}
          />
          <path
            d="M 480 80 L 480 136"
            className="fill-none stroke-neutral-400 dark:stroke-neutral-600"
            strokeWidth={1.5}
          />
          <path
            d="M 480 80 L 480 106 L 760 106 L 760 136"
            className="fill-none stroke-neutral-400 dark:stroke-neutral-600"
            strokeWidth={1.5}
          />

          {/* ===== Row 2: Sub-entities ===== */}
          {/* Sub-Fund 1 */}
          <g>
            <rect
              x="60"
              y="136"
              width="280"
              height="62"
              rx="8"
              className="fill-sky-50 stroke-sky-400/60 dark:fill-sky-950/40 dark:stroke-sky-500/60"
              strokeWidth={1.5}
            />
            <text
              x="200"
              y="160"
              textAnchor="middle"
              className="fill-sky-900 text-[13px] font-semibold dark:fill-sky-200"
            >
              Sub-Fund 1
            </text>
            <text x="200" y="178" textAnchor="middle" className="fill-sky-700 text-[11px] dark:fill-sky-400">
              Pooled &middot; N share classes
            </text>
            <text x="200" y="192" textAnchor="middle" className="fill-sky-700 text-[10px] dark:fill-sky-400">
              Own share-class book
            </text>
          </g>

          {/* Sub-Fund 2 */}
          <g>
            <rect
              x="340"
              y="136"
              width="280"
              height="62"
              rx="8"
              className="fill-sky-50 stroke-sky-400/60 dark:fill-sky-950/40 dark:stroke-sky-500/60"
              strokeWidth={1.5}
            />
            <text
              x="480"
              y="160"
              textAnchor="middle"
              className="fill-sky-900 text-[13px] font-semibold dark:fill-sky-200"
            >
              Sub-Fund 2
            </text>
            <text x="480" y="178" textAnchor="middle" className="fill-sky-700 text-[11px] dark:fill-sky-400">
              Pooled &middot; M share classes
            </text>
            <text x="480" y="192" textAnchor="middle" className="fill-sky-700 text-[10px] dark:fill-sky-400">
              Own share-class book
            </text>
          </g>

          {/* SMA A */}
          <g>
            <rect
              x="620"
              y="136"
              width="280"
              height="62"
              rx="8"
              className="fill-violet-50 stroke-violet-400/60 dark:fill-violet-950/40 dark:stroke-violet-500/60"
              strokeWidth={1.5}
            />
            <text
              x="760"
              y="160"
              textAnchor="middle"
              className="fill-violet-900 text-[13px] font-semibold dark:fill-violet-200"
            >
              SMA A
            </text>
            <text x="760" y="178" textAnchor="middle" className="fill-violet-700 text-[11px] dark:fill-violet-400">
              Per end-investor
            </text>
            <text x="760" y="192" textAnchor="middle" className="fill-violet-700 text-[10px] dark:fill-violet-400">
              Legally separate book
            </text>
          </g>

          {/* Connectors from Sub-Fund 1 to its end-investors (centres: 112, 200, 288) */}
          <path
            d="M 200 198 L 200 226 L 112 226 L 112 256"
            className="fill-none stroke-sky-400/60 dark:stroke-sky-500/60"
            strokeWidth={1.25}
          />
          <path
            d="M 200 198 L 200 256"
            className="fill-none stroke-sky-400/60 dark:stroke-sky-500/60"
            strokeWidth={1.25}
          />
          <path
            d="M 200 198 L 200 226 L 288 226 L 288 256"
            className="fill-none stroke-sky-400/60 dark:stroke-sky-500/60"
            strokeWidth={1.25}
          />

          {/* Connectors from Sub-Fund 2 to its end-investors (centres: 392, 480, 568) */}
          <path
            d="M 480 198 L 480 226 L 392 226 L 392 256"
            className="fill-none stroke-sky-400/60 dark:stroke-sky-500/60"
            strokeWidth={1.25}
          />
          <path
            d="M 480 198 L 480 256"
            className="fill-none stroke-sky-400/60 dark:stroke-sky-500/60"
            strokeWidth={1.25}
          />
          <path
            d="M 480 198 L 480 226 L 568 226 L 568 256"
            className="fill-none stroke-sky-400/60 dark:stroke-sky-500/60"
            strokeWidth={1.25}
          />

          {/* Connector from SMA A to its end-investor */}
          <path
            d="M 760 198 L 760 256"
            className="fill-none stroke-violet-400/60 dark:stroke-violet-500/60"
            strokeWidth={1.25}
          />

          {/* ===== Row 3: End investors (84-wide boxes, 4-px gaps, fit within parent sub-fund's 280-wide span) ===== */}
          {/* Sub-Fund 1 end-investors — centres at 112 / 200 / 288 */}
          <g>
            <rect
              x="70"
              y="256"
              width="84"
              height="46"
              rx="6"
              className="fill-white stroke-sky-300 dark:fill-zinc-900 dark:stroke-sky-600"
              strokeWidth={1}
            />
            <text
              x="112"
              y="276"
              textAnchor="middle"
              className="fill-zinc-900 text-[10px] font-medium dark:fill-zinc-100"
            >
              End-investor 1
            </text>
            <text x="112" y="291" textAnchor="middle" className="fill-zinc-600 text-[9px] italic dark:fill-zinc-400">
              slice-scoped
            </text>
          </g>

          <g>
            <rect
              x="158"
              y="256"
              width="84"
              height="46"
              rx="6"
              className="fill-white stroke-sky-300 dark:fill-zinc-900 dark:stroke-sky-600"
              strokeWidth={1}
            />
            <text
              x="200"
              y="276"
              textAnchor="middle"
              className="fill-zinc-900 text-[10px] font-medium dark:fill-zinc-100"
            >
              End-investor 2
            </text>
            <text x="200" y="291" textAnchor="middle" className="fill-zinc-600 text-[9px] italic dark:fill-zinc-400">
              slice-scoped
            </text>
          </g>

          <g>
            <rect
              x="246"
              y="256"
              width="84"
              height="46"
              rx="6"
              className="fill-white stroke-sky-300 dark:fill-zinc-900 dark:stroke-sky-600"
              strokeWidth={1}
            />
            <text
              x="288"
              y="276"
              textAnchor="middle"
              className="fill-zinc-900 text-[10px] font-medium dark:fill-zinc-100"
            >
              End-investor N
            </text>
            <text x="288" y="291" textAnchor="middle" className="fill-zinc-600 text-[9px] italic dark:fill-zinc-400">
              slice-scoped
            </text>
          </g>

          {/* Sub-Fund 2 end-investors — centres at 392 / 480 / 568 */}
          <g>
            <rect
              x="350"
              y="256"
              width="84"
              height="46"
              rx="6"
              className="fill-white stroke-sky-300 dark:fill-zinc-900 dark:stroke-sky-600"
              strokeWidth={1}
            />
            <text
              x="392"
              y="276"
              textAnchor="middle"
              className="fill-zinc-900 text-[10px] font-medium dark:fill-zinc-100"
            >
              End-investor 1
            </text>
            <text x="392" y="291" textAnchor="middle" className="fill-zinc-600 text-[9px] italic dark:fill-zinc-400">
              slice-scoped
            </text>
          </g>

          <g>
            <rect
              x="438"
              y="256"
              width="84"
              height="46"
              rx="6"
              className="fill-white stroke-sky-300 dark:fill-zinc-900 dark:stroke-sky-600"
              strokeWidth={1}
            />
            <text
              x="480"
              y="276"
              textAnchor="middle"
              className="fill-zinc-900 text-[10px] font-medium dark:fill-zinc-100"
            >
              End-investor 2
            </text>
            <text x="480" y="291" textAnchor="middle" className="fill-zinc-600 text-[9px] italic dark:fill-zinc-400">
              slice-scoped
            </text>
          </g>

          <g>
            <rect
              x="526"
              y="256"
              width="84"
              height="46"
              rx="6"
              className="fill-white stroke-sky-300 dark:fill-zinc-900 dark:stroke-sky-600"
              strokeWidth={1}
            />
            <text
              x="568"
              y="276"
              textAnchor="middle"
              className="fill-zinc-900 text-[10px] font-medium dark:fill-zinc-100"
            >
              End-investor M
            </text>
            <text x="568" y="291" textAnchor="middle" className="fill-zinc-600 text-[9px] italic dark:fill-zinc-400">
              slice-scoped
            </text>
          </g>

          {/* SMA A end-investor */}
          <g>
            <rect
              x="680"
              y="256"
              width="160"
              height="46"
              rx="6"
              className="fill-white stroke-violet-300 dark:fill-zinc-900 dark:stroke-violet-600"
              strokeWidth={1}
            />
            <text
              x="760"
              y="276"
              textAnchor="middle"
              className="fill-zinc-900 text-[11px] font-medium dark:fill-zinc-100"
            >
              Single end-investor
            </text>
            <text x="760" y="291" textAnchor="middle" className="fill-zinc-600 text-[9.5px] italic dark:fill-zinc-400">
              own book only
            </text>
          </g>

          {/* Connectors from each end-investor column down to venue keys band */}
          <path
            d="M 200 302 L 200 340 L 480 340 L 480 380"
            className="fill-none stroke-neutral-400 dark:stroke-neutral-600"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          <path
            d="M 480 302 L 480 380"
            className="fill-none stroke-neutral-400 dark:stroke-neutral-600"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          <path
            d="M 760 302 L 760 340 L 480 340"
            className="fill-none stroke-neutral-400 dark:stroke-neutral-600"
            strokeWidth={1}
            strokeDasharray="4 3"
          />

          {/* ===== Row 4: Venue API keys band ===== */}
          <g>
            <rect
              x="140"
              y="380"
              width="680"
              height="52"
              rx="8"
              className="fill-amber-50 stroke-amber-400/70 dark:fill-amber-950/30 dark:stroke-amber-500/70"
              strokeWidth={1.5}
            />
            <text
              x="480"
              y="404"
              textAnchor="middle"
              className="fill-amber-900 text-[13px] font-semibold dark:fill-amber-200"
            >
              Venue API keys &mdash; read + execute only
            </text>
            <text x="480" y="422" textAnchor="middle" className="fill-amber-800 text-[11px] dark:fill-amber-300">
              No withdrawal permission requested.
            </text>
          </g>

          {/* Connectors to venue category boxes */}
          <path
            d="M 280 432 L 280 460"
            className="fill-none stroke-amber-400/70 dark:stroke-amber-500/60"
            strokeWidth={1.25}
          />
          <path
            d="M 480 432 L 480 460"
            className="fill-none stroke-amber-400/70 dark:stroke-amber-500/60"
            strokeWidth={1.25}
          />
          <path
            d="M 680 432 L 680 460"
            className="fill-none stroke-amber-400/70 dark:stroke-amber-500/60"
            strokeWidth={1.25}
          />

          {/* ===== Row 5: Venue categories ===== */}
          <g>
            <rect
              x="180"
              y="460"
              width="200"
              height="56"
              rx="6"
              className="fill-white stroke-amber-300 dark:fill-zinc-900 dark:stroke-amber-600"
              strokeWidth={1.25}
            />
            <text
              x="280"
              y="482"
              textAnchor="middle"
              className="fill-zinc-900 text-[12px] font-semibold dark:fill-zinc-100"
            >
              CeFi
            </text>
            <text x="280" y="498" textAnchor="middle" className="fill-zinc-600 text-[10.5px] dark:fill-zinc-400">
              Binance &middot; Coinbase
            </text>
            <text x="280" y="511" textAnchor="middle" className="fill-zinc-600 text-[10.5px] dark:fill-zinc-400">
              Hyperliquid
            </text>
          </g>

          <g>
            <rect
              x="380"
              y="460"
              width="200"
              height="56"
              rx="6"
              className="fill-white stroke-amber-300 dark:fill-zinc-900 dark:stroke-amber-600"
              strokeWidth={1.25}
            />
            <text
              x="480"
              y="482"
              textAnchor="middle"
              className="fill-zinc-900 text-[12px] font-semibold dark:fill-zinc-100"
            >
              TradFi
            </text>
            <text x="480" y="498" textAnchor="middle" className="fill-zinc-600 text-[10.5px] dark:fill-zinc-400">
              CME &middot; NSE
            </text>
            <text x="480" y="511" textAnchor="middle" className="fill-zinc-600 text-[10.5px] dark:fill-zinc-400">
              Regulated brokers
            </text>
          </g>

          <g>
            <rect
              x="580"
              y="460"
              width="200"
              height="56"
              rx="6"
              className="fill-white stroke-amber-300 dark:fill-zinc-900 dark:stroke-amber-600"
              strokeWidth={1.25}
            />
            <text
              x="680"
              y="482"
              textAnchor="middle"
              className="fill-zinc-900 text-[12px] font-semibold dark:fill-zinc-100"
            >
              DeFi
            </text>
            <text x="680" y="498" textAnchor="middle" className="fill-zinc-600 text-[10.5px] dark:fill-zinc-400">
              On-chain wallets
            </text>
            <text x="680" y="511" textAnchor="middle" className="fill-zinc-600 text-[10.5px] dark:fill-zinc-400">
              Client-controlled
            </text>
          </g>

          {/* ===== Supervisory rollup band (N:1 upward flow) ===== */}
          <g>
            <rect
              x="60"
              y="548"
              width="840"
              height="56"
              rx="8"
              className="fill-emerald-50/60 stroke-emerald-400/60 dark:fill-emerald-950/20 dark:stroke-emerald-500/50"
              strokeDasharray="5 3"
              strokeWidth={1.25}
            />
            <text
              x="480"
              y="572"
              textAnchor="middle"
              className="fill-emerald-900 text-[12px] font-semibold dark:fill-emerald-300"
            >
              Supervisory rollup (N-to-one)
            </text>
            <text x="480" y="590" textAnchor="middle" className="fill-emerald-800 text-[10.5px] dark:fill-emerald-400">
              NAV, attribution, compliance artefacts, audit trail &mdash; all sub-entities roll into the regulatory
              client
            </text>
          </g>

          {/* Arrow hint from supervisory band back up to umbrella client */}
          <path
            d="M 480 548 L 480 532"
            className="fill-none stroke-emerald-400/60 dark:stroke-emerald-500/60"
            strokeWidth={1.25}
            markerEnd="url(#reg-rollup-arrow)"
          />
          <defs>
            <marker
              id="reg-rollup-arrow"
              viewBox="0 0 10 10"
              refX="5"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" className="fill-emerald-500/70 dark:fill-emerald-400/70" />
            </marker>
          </defs>
        </svg>
      </WidgetScroll>

      <p className="mt-4 text-xs text-muted-foreground">
        A regulated engagement can include multiple sub-funds, share classes, or SMA books. Each book remains separately
        reported, while NAV, attribution, compliance artefacts, and audit trail roll up into one supervisory view for
        the client umbrella. Venue access remains scoped by mandate, and withdrawal permission is never requested.
      </p>
      <p className="mt-2 text-xs text-muted-foreground">
        In this model, the reporting hierarchy is separate from the legal appointment chain. Depending on the mandate,
        Odum may be the appointed investment manager, a delegated trading manager, a sub-adviser, or the infrastructure
        and reporting provider behind the regulated manager.
      </p>
    </figure>
  );
}
