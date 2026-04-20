// Source: codex/14-playbooks/shared-core/org-fund-client-entity-model.md
//
// Fund / SMA hierarchy diagram — Investment Management page (pb3b).
// Static inline SVG + Tailwind. No animation, no third-party libs.
// Shows: Odum (IM) -> Pooled Fund (share classes A/B/C, slice-scoped per client)
//   AND Odum (IM) -> SMA structure (per client, legally separate)
//   -> Venue API keys (read-only-plus-execute; custody with client).
//
// Responsive: renders clean >= 1280px, reflows at mobile widths via the
// surrounding flex container. The SVG itself uses viewBox + preserveAspectRatio
// to scale without losing legibility.

import * as React from "react";

export function FundSmaHierarchyDiagram(): React.JSX.Element {
  return (
    <figure
      className="mb-8 overflow-hidden rounded-lg border border-border bg-card/40 p-6"
      data-testid="fund-sma-hierarchy-diagram"
      aria-labelledby="fund-sma-diagram-title"
    >
      <figcaption
        id="fund-sma-diagram-title"
        className="mb-4 text-sm font-semibold text-foreground"
      >
        Fund / SMA hierarchy
      </figcaption>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox="0 0 960 560"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-labelledby="fund-sma-svg-title fund-sma-svg-desc"
          className="mx-auto block h-auto w-full min-w-[560px] max-w-[960px]"
        >
          <title id="fund-sma-svg-title">
            Investment Management fund and SMA hierarchy
          </title>
          <desc id="fund-sma-svg-desc">
            Odum as Investment Manager sits above two parallel structural
            options: a pooled fund with share classes A, B, and C where each
            client sees only their slice, and an SMA structure where each
            client has a legally separate managed account. Both paths connect
            to venue API keys that remain under client custody, scoped as
            read-only-plus-execute across CeFi venues, TradFi venues, and
            on-chain wallets.
          </desc>

          {/* ===== Row 1: Odum (Investment Manager) ===== */}
          <g>
            <rect
              x="380"
              y="20"
              width="200"
              height="52"
              rx="8"
              className="fill-zinc-100 stroke-zinc-400 dark:fill-zinc-800 dark:stroke-zinc-500"
              strokeWidth={1.5}
            />
            <text
              x="480"
              y="44"
              textAnchor="middle"
              className="fill-zinc-900 text-[14px] font-semibold dark:fill-zinc-100"
            >
              Odum
            </text>
            <text
              x="480"
              y="62"
              textAnchor="middle"
              className="fill-zinc-600 text-[11px] dark:fill-zinc-400"
            >
              Investment Manager
            </text>
          </g>

          {/* Connectors from Odum down to both structures */}
          <path
            d="M 480 72 L 480 100 L 220 100 L 220 130"
            className="fill-none stroke-neutral-400 dark:stroke-neutral-600"
            strokeWidth={1.5}
          />
          <path
            d="M 480 72 L 480 100 L 740 100 L 740 130"
            className="fill-none stroke-neutral-400 dark:stroke-neutral-600"
            strokeWidth={1.5}
          />

          {/* ===== Row 2: Pooled Fund | SMA Structure headers ===== */}
          <g>
            <rect
              x="80"
              y="130"
              width="280"
              height="52"
              rx="8"
              className="fill-sky-50 stroke-sky-400/60 dark:fill-sky-950/40 dark:stroke-sky-500/60"
              strokeWidth={1.5}
            />
            <text
              x="220"
              y="154"
              textAnchor="middle"
              className="fill-sky-900 text-[13px] font-semibold dark:fill-sky-200"
            >
              Pooled Fund
            </text>
            <text
              x="220"
              y="172"
              textAnchor="middle"
              className="fill-sky-700 text-[11px] dark:fill-sky-400"
            >
              Odum Alpha Fund Ltd
            </text>
          </g>

          <g>
            <rect
              x="600"
              y="130"
              width="280"
              height="52"
              rx="8"
              className="fill-violet-50 stroke-violet-400/60 dark:fill-violet-950/40 dark:stroke-violet-500/60"
              strokeWidth={1.5}
            />
            <text
              x="740"
              y="154"
              textAnchor="middle"
              className="fill-violet-900 text-[13px] font-semibold dark:fill-violet-200"
            >
              SMA Structure
            </text>
            <text
              x="740"
              y="172"
              textAnchor="middle"
              className="fill-violet-700 text-[11px] dark:fill-violet-400"
            >
              Per client, legally separate
            </text>
          </g>

          {/* Connectors to share classes (row 3 pooled side) */}
          <path
            d="M 220 182 L 220 210 L 120 210 L 120 240"
            className="fill-none stroke-sky-400/60 dark:stroke-sky-500/60"
            strokeWidth={1.5}
          />
          <path
            d="M 220 182 L 220 240"
            className="fill-none stroke-sky-400/60 dark:stroke-sky-500/60"
            strokeWidth={1.5}
          />
          <path
            d="M 220 182 L 220 210 L 320 210 L 320 240"
            className="fill-none stroke-sky-400/60 dark:stroke-sky-500/60"
            strokeWidth={1.5}
          />

          {/* Connectors to SMAs (row 3 SMA side) */}
          <path
            d="M 740 182 L 740 210 L 660 210 L 660 240"
            className="fill-none stroke-violet-400/60 dark:stroke-violet-500/60"
            strokeWidth={1.5}
          />
          <path
            d="M 740 182 L 740 210 L 820 210 L 820 240"
            className="fill-none stroke-violet-400/60 dark:stroke-violet-500/60"
            strokeWidth={1.5}
          />

          {/* ===== Row 3: Share classes A/B/C & SMA 1/2 ===== */}
          {/* Share Class A */}
          <g>
            <rect
              x="50"
              y="240"
              width="140"
              height="62"
              rx="6"
              className="fill-white stroke-sky-300 dark:fill-zinc-900 dark:stroke-sky-600"
              strokeWidth={1.25}
            />
            <text
              x="120"
              y="262"
              textAnchor="middle"
              className="fill-zinc-900 text-[12px] font-medium dark:fill-zinc-100"
            >
              Share Class A
            </text>
            <text
              x="120"
              y="278"
              textAnchor="middle"
              className="fill-zinc-600 text-[10.5px] dark:fill-zinc-400"
            >
              Client 1
            </text>
            <text
              x="120"
              y="293"
              textAnchor="middle"
              className="fill-sky-700 text-[9.5px] italic dark:fill-sky-400"
            >
              sees own slice only
            </text>
          </g>

          {/* Share Class B */}
          <g>
            <rect
              x="150"
              y="240"
              width="140"
              height="62"
              rx="6"
              className="fill-white stroke-sky-300 dark:fill-zinc-900 dark:stroke-sky-600"
              strokeWidth={1.25}
              transform="translate(0 0)"
            />
            <rect
              x="150"
              y="240"
              width="140"
              height="62"
              rx="6"
              className="fill-white stroke-sky-300 dark:fill-zinc-900 dark:stroke-sky-600"
              strokeWidth={1.25}
            />
            <text
              x="220"
              y="262"
              textAnchor="middle"
              className="fill-zinc-900 text-[12px] font-medium dark:fill-zinc-100"
            >
              Share Class B
            </text>
            <text
              x="220"
              y="278"
              textAnchor="middle"
              className="fill-zinc-600 text-[10.5px] dark:fill-zinc-400"
            >
              Client 2
            </text>
            <text
              x="220"
              y="293"
              textAnchor="middle"
              className="fill-sky-700 text-[9.5px] italic dark:fill-sky-400"
            >
              sees own slice only
            </text>
          </g>

          {/* Share Class C */}
          <g>
            <rect
              x="250"
              y="240"
              width="140"
              height="62"
              rx="6"
              className="fill-white stroke-sky-300 dark:fill-zinc-900 dark:stroke-sky-600"
              strokeWidth={1.25}
            />
            <text
              x="320"
              y="262"
              textAnchor="middle"
              className="fill-zinc-900 text-[12px] font-medium dark:fill-zinc-100"
            >
              Share Class C
            </text>
            <text
              x="320"
              y="278"
              textAnchor="middle"
              className="fill-zinc-600 text-[10.5px] dark:fill-zinc-400"
            >
              Client 3
            </text>
            <text
              x="320"
              y="293"
              textAnchor="middle"
              className="fill-sky-700 text-[9.5px] italic dark:fill-sky-400"
            >
              sees own slice only
            </text>
          </g>

          {/* SMA 1 */}
          <g>
            <rect
              x="590"
              y="240"
              width="140"
              height="62"
              rx="6"
              className="fill-white stroke-violet-300 dark:fill-zinc-900 dark:stroke-violet-600"
              strokeWidth={1.25}
            />
            <text
              x="660"
              y="262"
              textAnchor="middle"
              className="fill-zinc-900 text-[12px] font-medium dark:fill-zinc-100"
            >
              SMA &mdash; Client 4
            </text>
            <text
              x="660"
              y="278"
              textAnchor="middle"
              className="fill-zinc-600 text-[10.5px] dark:fill-zinc-400"
            >
              Own book only
            </text>
            <text
              x="660"
              y="293"
              textAnchor="middle"
              className="fill-violet-700 text-[9.5px] italic dark:fill-violet-400"
            >
              sole visibility
            </text>
          </g>

          {/* SMA 2 */}
          <g>
            <rect
              x="750"
              y="240"
              width="140"
              height="62"
              rx="6"
              className="fill-white stroke-violet-300 dark:fill-zinc-900 dark:stroke-violet-600"
              strokeWidth={1.25}
            />
            <text
              x="820"
              y="262"
              textAnchor="middle"
              className="fill-zinc-900 text-[12px] font-medium dark:fill-zinc-100"
            >
              SMA &mdash; Client 5
            </text>
            <text
              x="820"
              y="278"
              textAnchor="middle"
              className="fill-zinc-600 text-[10.5px] dark:fill-zinc-400"
            >
              Own book only
            </text>
            <text
              x="820"
              y="293"
              textAnchor="middle"
              className="fill-violet-700 text-[9.5px] italic dark:fill-violet-400"
            >
              sole visibility
            </text>
          </g>

          {/* Connectors from all sub-entities down to venue keys band */}
          <path
            d="M 120 302 L 120 340 L 480 340 L 480 380"
            className="fill-none stroke-neutral-400 dark:stroke-neutral-600"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          <path
            d="M 220 302 L 220 340 L 480 340"
            className="fill-none stroke-neutral-400 dark:stroke-neutral-600"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          <path
            d="M 320 302 L 320 340 L 480 340"
            className="fill-none stroke-neutral-400 dark:stroke-neutral-600"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          <path
            d="M 660 302 L 660 340 L 480 340"
            className="fill-none stroke-neutral-400 dark:stroke-neutral-600"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          <path
            d="M 820 302 L 820 340 L 480 340"
            className="fill-none stroke-neutral-400 dark:stroke-neutral-600"
            strokeWidth={1}
            strokeDasharray="4 3"
          />

          {/* ===== Row 4: Venue API keys band (read-only-plus-execute) ===== */}
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
              Venue API keys &mdash; read-only-plus-execute
            </text>
            <text
              x="480"
              y="422"
              textAnchor="middle"
              className="fill-amber-800 text-[11px] dark:fill-amber-300"
            >
              Custody remains with client. Withdrawal permission never requested.
            </text>
          </g>

          {/* Connectors to venue groups */}
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
              height="60"
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
            <text
              x="280"
              y="499"
              textAnchor="middle"
              className="fill-zinc-600 text-[10.5px] dark:fill-zinc-400"
            >
              Binance &middot; Coinbase
            </text>
            <text
              x="280"
              y="513"
              textAnchor="middle"
              className="fill-zinc-600 text-[10.5px] dark:fill-zinc-400"
            >
              Hyperliquid
            </text>
          </g>

          <g>
            <rect
              x="380"
              y="460"
              width="200"
              height="60"
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
            <text
              x="480"
              y="499"
              textAnchor="middle"
              className="fill-zinc-600 text-[10.5px] dark:fill-zinc-400"
            >
              CME &middot; NSE
            </text>
            <text
              x="480"
              y="513"
              textAnchor="middle"
              className="fill-zinc-600 text-[10.5px] dark:fill-zinc-400"
            >
              Regulated brokers
            </text>
          </g>

          <g>
            <rect
              x="580"
              y="460"
              width="200"
              height="60"
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
            <text
              x="680"
              y="499"
              textAnchor="middle"
              className="fill-zinc-600 text-[10.5px] dark:fill-zinc-400"
            >
              On-chain wallets
            </text>
            <text
              x="680"
              y="513"
              textAnchor="middle"
              className="fill-zinc-600 text-[10.5px] dark:fill-zinc-400"
            >
              Client-controlled
            </text>
          </g>
        </svg>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Pooled fund and SMA are the two structural options. Each client sees
        only their slice &mdash; share-class clients their own NAV and
        attribution, SMA clients their own book. Venue custody always remains
        with the client; Odum operates under scoped read-only-plus-execute keys
        across all venues.
      </p>
    </figure>
  );
}
