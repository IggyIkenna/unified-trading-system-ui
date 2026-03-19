import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/

// Read from env vars (set by .env via run-api.sh, or override with VITE_ prefix)
const apiPort = process.env.API_PORT || "8004";
const frontendPort = parseInt(process.env.FRONTEND_PORT || "5183", 10);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@unified-trading/ui-kit": path.resolve(
        __dirname,
        "./packages/ui-kit/src",
      ),
      "@unified-trading/ui-auth": path.resolve(
        __dirname,
        "./packages/ui-auth/src",
      ),
      "@unified-admin/core": path.resolve(
        __dirname,
        "./packages/admin-core/src",
      ),
    },
    dedupe: ["react", "react-dom", "react-router-dom"],
  },
  server: {
    port: frontendPort,
    proxy: {
      "/api": {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
      "/cloud-builds": {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
      "/service-status": {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
});
