import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow a second `next dev` from the same project root (e.g. one mock-mode
  // server on :3000 and one real-API server on :3100) by giving them
  // separate compile dirs via NEXT_DIST_DIR. Default `.next` is unchanged
  // when the env is unset.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  typescript: {
    // TODO: set back to false after regenerating lib/types/api-generated.ts
    // Current generated file has syntax errors from openapi-typescript
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: __dirname,
  },
  experimental: {},
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          "**/.git/**",
          "**/.claude/**",
          "**/node_modules/**",
          "**/.next/**",
          "**/tests/**",
          "**/playwright-report/**",
          "**/test-results/**",
        ],
      };
    }
    return config;
  },
  images: {
    unoptimized: true,
  },
  // Note: standalone output not supported with Next.js 16 Turbopack
  // Using `next start` in Dockerfile instead

  async headers() {
    return [
      {
        // HTML pages — always revalidate so deploys are visible immediately
        // Next.js already handles /_next/static/* caching (immutable) natively
        source: "/((?!_next/static|_next/image|favicon|images/).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, must-revalidate",
          },
        ],
      },
      // Static assets: immutable only in production — in dev, chunks change on restart
      ...(process.env.NODE_ENV === "production"
        ? [
            {
              source: "/_next/static/:path*",
              headers: [
                {
                  key: "Cache-Control",
                  value: "public, max-age=31536000, immutable",
                },
              ],
            },
          ]
        : []),
    ];
  },

  async rewrites() {
    if (process.env.NEXT_PUBLIC_MOCK_API === "true") return [];
    const authBase = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8200";
    const reportingBase = process.env.NEXT_PUBLIC_REPORTING_API_URL || "http://localhost:8014";
    const deploymentBase = process.env.NEXT_PUBLIC_DEPLOYMENT_API_URL || "http://localhost:8004";
    // unified-trading-api — consolidated gateway absorbing 9 domain APIs.
    const unifiedApiBase = process.env.NEXT_PUBLIC_UNIFIED_API_URL || "http://localhost:8030";
    // /api/v1/* is intentionally NOT rewritten — those paths are served by
    // the portal's own Admin SDK routes under app/api/v1/*. Same for the
    // /api/auth/* portal-native routes (signup verification, password reset).
    // Everything below is fan-out to sibling backends that still live as
    // separate Cloud Run services.
    return [
      { source: "/api/auth/provisioning/:path*", destination: `${authBase}/provisioning/:path*` },
      { source: "/api/reporting/:path*", destination: `${reportingBase}/api/reporting/:path*` },
      { source: "/api/health", destination: `${unifiedApiBase}/health` },
      { source: "/api/services/:path*", destination: `${deploymentBase}/api/services/:path*` },
      { source: "/api/deployments/:path*", destination: `${deploymentBase}/api/deployments/:path*` },
      { source: "/api/cloud-builds/:path*", destination: `${deploymentBase}/api/cloud-builds/:path*` },
      { source: "/api/builds/:path*", destination: `${deploymentBase}/api/builds/:path*` },
      { source: "/api/service-status/:path*", destination: `${deploymentBase}/api/service-status/:path*` },
      { source: "/api/data-status/:path*", destination: `${deploymentBase}/api/data-status/:path*` },
      { source: "/api/checklists/:path*", destination: `${deploymentBase}/api/checklists/:path*` },
      { source: "/api/epics/:path*", destination: `${deploymentBase}/api/epics/:path*` },
      { source: "/api/cache/:path*", destination: `${deploymentBase}/api/cache/:path*` },
      { source: "/api/capabilities/:path*", destination: `${deploymentBase}/api/capabilities/:path*` },
      { source: "/api/config/:path*", destination: `${deploymentBase}/api/config/:path*` },
      // unified-trading-api routes (market data, instruments, positions, etc.)
      { source: "/api/market-data/:path*", destination: `${unifiedApiBase}/market-data/:path*` },
      { source: "/api/instruments/:path*", destination: `${unifiedApiBase}/instruments/:path*` },
      { source: "/api/positions/:path*", destination: `${unifiedApiBase}/positions/:path*` },
      { source: "/api/orders/:path*", destination: `${unifiedApiBase}/orders/:path*` },
      { source: "/api/alerts/:path*", destination: `${unifiedApiBase}/alerts/:path*` },
      { source: "/api/risk/:path*", destination: `${unifiedApiBase}/risk/:path*` },
      { source: "/api/analytics/:path*", destination: `${unifiedApiBase}/analytics/:path*` },
      { source: "/api/derivatives/:path*", destination: `${unifiedApiBase}/derivatives/:path*` },
      { source: "/api/execution/:path*", destination: `${unifiedApiBase}/execution/:path*` },
      { source: "/api/audit/:path*", destination: `${unifiedApiBase}/audit/:path*` },
      { source: "/api/compliance/:path*", destination: `${unifiedApiBase}/compliance/:path*` },
      { source: "/api/calendar/:path*", destination: `${unifiedApiBase}/calendar/:path*` },
      { source: "/api/events/:path*", destination: `${unifiedApiBase}/events/:path*` },
      { source: "/api/ml/:path*", destination: `${unifiedApiBase}/ml/:path*` },
      { source: "/api/users/:path*", destination: `${unifiedApiBase}/users/:path*` },
      { source: "/api/defi/:path*", destination: `${unifiedApiBase}/defi/:path*` },
      { source: "/api/commodity/:path*", destination: `${unifiedApiBase}/commodity/:path*` },
      { source: "/api/documents/:path*", destination: `${unifiedApiBase}/documents/:path*` },
      { source: "/api/chat/:path*", destination: `${unifiedApiBase}/chat/:path*` },
      { source: "/api/sports/:path*", destination: `${unifiedApiBase}/sports/:path*` },
    ];
  },

  async redirects() {
    // Block legacy static HTML presentations — SSOT is /investor-relations
    const presentationRedirects = [
      {
        source: "/presentations/:path*",
        destination: "/login?redirect=/investor-relations",
        permanent: false,
      },
    ];

    // Execution folded into Trading Terminal
    const executionRedirects = [
      {
        source: "/services/execution",
        destination: "/services/platform",
        permanent: true,
      },
      {
        source: "/services/execution/:path*",
        destination: "/services/platform",
        permanent: true,
      },
      // Old engagement models page
      {
        source: "/services/engagement",
        destination: "/",
        permanent: true,
      },
    ];

    // Marketing-site three-route consolidation 2026-04-26.
    // Public Odum Signals + DART Signals-In + DART Full all fold into /platform
    // (DART Trading Infrastructure) as in-page sections. Authenticated
    // /services/signals/* counterparty surfaces are unaffected per Completion
    // Patch §L. Briefing pillars consolidated 6 → 3.
    const marketingThreeRouteRedirects = [
      { source: "/signals", destination: "/platform#signals-capability", permanent: true },
      { source: "/platform/signals-in", destination: "/platform#signals-in-capability", permanent: true },
      { source: "/platform/full", destination: "/platform#full-stack-capability", permanent: true },
      { source: "/briefings/platform", destination: "/briefings/dart-trading-infrastructure", permanent: true },
      { source: "/briefings/dart", destination: "/briefings/dart-trading-infrastructure", permanent: true },
      { source: "/briefings/dart-full", destination: "/briefings/dart-trading-infrastructure", permanent: true },
      {
        source: "/briefings/dart-signals-in",
        destination: "/briefings/dart-trading-infrastructure",
        permanent: true,
      },
      { source: "/briefings/signals-out", destination: "/briefings/dart-trading-infrastructure", permanent: true },
      { source: "/briefings/regulatory", destination: "/briefings/regulated-operating-models", permanent: true },
    ];
    return [
      ...presentationRedirects,
      ...executionRedirects,
      ...marketingThreeRouteRedirects,
      // Legacy flat marketing HTML → App Router (public shell + auth)
      { source: "/index.html", destination: "/", permanent: false },
      { source: "/homepage.html", destination: "/", permanent: true },
      {
        source: "/strategies.html",
        destination: "/investment-management",
        permanent: true,
      },
      { source: "/platform.html", destination: "/platform", permanent: true },
      {
        source: "/regulatory.html",
        destination: "/regulatory",
        permanent: true,
      },
      { source: "/firm.html", destination: "/who-we-are", permanent: true },
      { source: "/firm", destination: "/who-we-are", permanent: true },
      { source: "/who-we-are.html", destination: "/who-we-are", permanent: true },
      { source: "/contact.html", destination: "/contact", permanent: true },
      // Admin — redirects to user management (the only admin function)
      { source: "/admin", destination: "/admin/users", permanent: false },
      // Dashboard (formerly Service Hub)
      { source: "/overview", destination: "/dashboard", permanent: true },
      // Removed routes — redirect to dashboard
      { source: "/services", destination: "/dashboard", permanent: true },
      {
        source: "/services/overview",
        destination: "/dashboard",
        permanent: true,
      },
      { source: "/portal", destination: "/dashboard", permanent: true },
      { source: "/portal/:path*", destination: "/dashboard", permanent: true },
      // Data service
      {
        source: "/data",
        destination: "/services/data/overview",
        permanent: true,
      },
      {
        source: "/trading/markets",
        destination: "/services/trading/pnl",
        permanent: true,
      },
      {
        source: "/trading/markets/:path*",
        destination: "/services/trading/pnl",
        permanent: true,
      },
      // Trading service
      {
        source: "/trading",
        destination: "/services/trading/overview",
        permanent: true,
      },
      {
        source: "/trading/positions",
        destination: "/services/trading/positions",
        permanent: true,
      },
      {
        source: "/trading/risk",
        destination: "/services/trading/risk",
        permanent: true,
      },
      {
        source: "/trading/alerts",
        destination: "/services/trading/alerts",
        permanent: true,
      },
      // Research service
      {
        source: "/research",
        destination: "/services/research/overview",
        permanent: true,
      },
      {
        source: "/research/strategy/:path*",
        destination: "/services/research/strategy/:path*",
        permanent: true,
      },
      {
        source: "/research/ml/:path*",
        destination: "/services/research/ml/:path*",
        permanent: true,
      },
      {
        source: "/research/ml",
        destination: "/services/research/ml",
        permanent: true,
      },
      {
        source: "/research/execution/:path*",
        destination: "/services/execution/:path*",
        permanent: true,
      },
      // Legacy flat ML routes
      { source: "/ml", destination: "/services/research/ml", permanent: true },
      {
        source: "/ml/:path*",
        destination: "/services/research/ml/:path*",
        permanent: true,
      },
      // Legacy flat routes
      {
        source: "/positions",
        destination: "/services/trading/positions",
        permanent: true,
      },
      {
        source: "/risk",
        destination: "/services/trading/risk",
        permanent: true,
      },
      {
        source: "/alerts",
        destination: "/services/trading/alerts",
        permanent: true,
      },
      // Strategy platform — root + specific overview override (must come before wildcard)
      {
        source: "/strategy-platform",
        destination: "/services/research/strategy/backtests",
        permanent: true,
      },
      {
        source: "/strategy-platform/overview",
        destination: "/services/research/strategy/overview",
        permanent: true,
      },
      {
        source: "/strategy-platform/:path*",
        destination: "/services/research/strategy/:path*",
        permanent: true,
      },
      // Execution service
      {
        source: "/execution",
        destination: "/services/execution/overview",
        permanent: true,
      },
      {
        source: "/execution/:path*",
        destination: "/services/execution/:path*",
        permanent: true,
      },
      // Reports service
      {
        source: "/reports",
        destination: "/services/reports/overview",
        permanent: true,
      },
      {
        source: "/reports/:path*",
        destination: "/services/reports/:path*",
        permanent: true,
      },
      // Markets moved from data service to trading/pnl
      {
        source: "/services/data/markets",
        destination: "/services/trading/pnl",
        permanent: true,
      },
      {
        source: "/services/data/markets/:path*",
        destination: "/services/trading/pnl",
        permanent: true,
      },
      // /services/trading/markets is now a real page (ported from old /markets)
      {
        source: "/markets/pnl",
        destination: "/services/trading/pnl",
        permanent: true,
      },
      {
        source: "/markets/:path*",
        destination: "/services/trading/pnl",
        permanent: true,
      },
      {
        source: "/markets",
        destination: "/services/trading/pnl",
        permanent: true,
      },
      // Misc legacy flat routes (direct, no double-hop)
      {
        source: "/executive",
        destination: "/services/reports/executive",
        permanent: true,
      },
      {
        source: "/quant",
        destination: "/services/research/quant",
        permanent: true,
      },
      // Observe service — root redirect
      {
        source: "/services/observe",
        destination: "/services/observe/health",
        permanent: false,
      },
      // Phase 9 (dart_ux_cockpit_refactor_2026_04_29) — collapse single-widget
      // observe pages into the unified workspace cockpit. Each page maps to
      // the terminal mode that owns the concept per §15 ownership rules:
      //   risk / scenarios / position-recon → Explain (attribution + drift)
      //   alerts                            → Command (live exceptions)
      //   strategy-health                   → Strategies
      //   system-health / event-audit / recovery → Ops
      // Strategy Catalogue stays distinct (§22) and is NOT redirected.
      {
        source: "/services/observe/risk",
        destination: "/services/workspace?surface=terminal&tm=explain",
        permanent: false,
      },
      {
        source: "/services/observe/scenarios",
        destination: "/services/workspace?surface=terminal&tm=explain",
        permanent: false,
      },
      {
        source: "/services/observe/position-recon",
        destination: "/services/workspace?surface=terminal&tm=explain",
        permanent: false,
      },
      {
        source: "/services/observe/alerts",
        destination: "/services/workspace?surface=terminal&tm=command",
        permanent: false,
      },
      {
        source: "/services/observe/strategy-health",
        destination: "/services/workspace?surface=terminal&tm=strategies",
        permanent: false,
      },
      {
        source: "/services/observe/system-health",
        destination: "/services/workspace?surface=terminal&tm=ops",
        permanent: false,
      },
      {
        source: "/services/observe/event-audit",
        destination: "/services/workspace?surface=terminal&tm=ops",
        permanent: false,
      },
      {
        source: "/services/observe/recovery",
        destination: "/services/workspace?surface=terminal&tm=ops",
        permanent: false,
      },
      // 2026-04-30 audit polish #5 — Trading shell-level routes redirect
      // into the workspace cockpit. The cockpit owns positions / orders /
      // risk / alerts / pnl / accounts as widgets. Per-widget pages stay
      // for backwards compat as deep links, but the shell-level overview
      // routes (the user-facing labels) lead users into the cockpit.
      {
        source: "/services/trading/overview",
        destination: "/services/workspace?surface=terminal&tm=command",
        permanent: false,
      },
      {
        source: "/services/trading/positions/:path*",
        destination: "/services/workspace?surface=terminal&tm=command",
        permanent: false,
      },
      {
        source: "/services/trading/positions",
        destination: "/services/workspace?surface=terminal&tm=command",
        permanent: false,
      },
      {
        source: "/services/trading/orders",
        destination: "/services/workspace?surface=terminal&tm=command",
        permanent: false,
      },
      {
        source: "/services/trading/risk",
        destination: "/services/workspace?surface=terminal&tm=explain",
        permanent: false,
      },
      {
        source: "/services/trading/alerts",
        destination: "/services/workspace?surface=terminal&tm=command",
        permanent: false,
      },
      {
        source: "/services/trading/pnl",
        destination: "/services/workspace?surface=terminal&tm=explain",
        permanent: false,
      },
      {
        source: "/services/trading/accounts/:path*",
        destination: "/services/workspace?surface=terminal&tm=command",
        permanent: false,
      },
      {
        source: "/services/trading/accounts",
        destination: "/services/workspace?surface=terminal&tm=command",
        permanent: false,
      },
      // Research overview redirects into the workspace research-discover
      // anchor. Heavy specialist pages (ml/, strategy/backtests/, allocate/)
      // intentionally NOT redirected — they remain as deep links per plan §22.
      {
        source: "/services/research/overview",
        destination: "/services/workspace?surface=research&rs=discover",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
