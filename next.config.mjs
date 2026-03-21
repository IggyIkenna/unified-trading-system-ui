/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  // Note: standalone output not supported with Next.js 16 Turbopack
  // Using `next start` in Dockerfile instead

  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8100'
    const authBase = process.env.NEXT_PUBLIC_AUTH_URL || 'http://localhost:8200'
    return [
      { source: '/api/auth/:path*', destination: `${authBase}/:path*` },
      { source: '/api/:path*', destination: `${apiBase}/:path*` },
    ]
  },

  async redirects() {
    return [
      // Service hub
      { source: "/overview", destination: "/service/overview", permanent: true },
      // Data service
      { source: "/data", destination: "/service/data/overview", permanent: true },
      { source: "/trading/markets", destination: "/service/data/markets", permanent: true },
      { source: "/trading/markets/:path*", destination: "/service/data/markets/:path*", permanent: true },
      // Trading service
      { source: "/trading", destination: "/service/trading/overview", permanent: true },
      { source: "/trading/positions", destination: "/service/trading/positions", permanent: true },
      { source: "/trading/risk", destination: "/service/trading/risk", permanent: true },
      { source: "/trading/alerts", destination: "/service/trading/alerts", permanent: true },
      // Research service
      { source: "/research", destination: "/service/research/overview", permanent: true },
      { source: "/research/strategy/:path*", destination: "/service/research/strategy/:path*", permanent: true },
      { source: "/research/ml/:path*", destination: "/service/research/ml/:path*", permanent: true },
      { source: "/research/ml", destination: "/service/research/ml", permanent: true },
      { source: "/research/execution/:path*", destination: "/service/execution/:path*", permanent: true },
      // Legacy flat ML routes
      { source: "/ml", destination: "/service/research/ml", permanent: true },
      { source: "/ml/:path*", destination: "/service/research/ml/:path*", permanent: true },
      // Legacy flat routes
      { source: "/positions", destination: "/service/trading/positions", permanent: true },
      { source: "/risk", destination: "/service/trading/risk", permanent: true },
      { source: "/alerts", destination: "/service/trading/alerts", permanent: true },
      // Strategy platform — root + specific overview override (must come before wildcard)
      { source: "/strategy-platform", destination: "/service/research/strategy/backtests", permanent: true },
      { source: "/strategy-platform/overview", destination: "/service/research/strategy/overview", permanent: true },
      { source: "/strategy-platform/:path*", destination: "/service/research/strategy/:path*", permanent: true },
      // Execution service
      { source: "/execution", destination: "/service/execution/overview", permanent: true },
      { source: "/execution/:path*", destination: "/service/execution/:path*", permanent: true },
      // Reports service
      { source: "/reports", destination: "/service/reports/overview", permanent: true },
      { source: "/reports/:path*", destination: "/service/reports/:path*", permanent: true },
      // /markets flat routes (specific paths before catch-all)
      { source: "/markets/pnl", destination: "/service/data/markets/pnl", permanent: true },
      { source: "/markets/:path*", destination: "/service/data/markets/:path*", permanent: true },
      { source: "/markets", destination: "/service/data/markets", permanent: true },
      // Misc legacy flat routes (direct, no double-hop)
      { source: "/executive", destination: "/service/reports/executive", permanent: true },
      { source: "/quant", destination: "/service/research/quant", permanent: true },
    ]
  },
}

export default nextConfig
