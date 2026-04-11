import { fileURLToPath } from "url";
import { dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // TODO: set back to false after regenerating lib/types/api-generated.ts
    // Current generated file has syntax errors from openapi-typescript
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: __dirname,
  },
  experimental: {
    turbopackFileSystemCacheForBuild: true,
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
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8030";
    const authBase = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:8200";
    const reportingBase = process.env.NEXT_PUBLIC_REPORTING_API_URL || "http://localhost:8014";
    return [
      { source: "/api/auth/:path*", destination: `${authBase}/:path*` },
      { source: "/api/reporting/:path*", destination: `${reportingBase}/api/reporting/:path*` },
      { source: "/api/:path*", destination: `${apiBase}/:path*` },
    ];
  },

  async redirects() {
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
        destination: "/#services",
        permanent: true,
      },
    ];
    return [
      ...executionRedirects,
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
    ];
  },
};

export default nextConfig;
