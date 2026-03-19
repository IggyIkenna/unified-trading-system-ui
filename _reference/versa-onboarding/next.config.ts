import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],
  outputFileTracingIncludes: {
    "/api/**": ["./node_modules/firebase-admin/**/*"],
  },
  // Enable standalone output for Cloud Run deployment
  output: "standalone",
};

export default nextConfig;
