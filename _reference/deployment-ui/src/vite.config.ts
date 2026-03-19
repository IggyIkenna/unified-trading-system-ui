import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/

// Read from env vars (set by .env via run-api.sh, or override with VITE_ prefix)
const apiPort = process.env.API_PORT || "8000";
const frontendPort = parseInt(process.env.FRONTEND_PORT || "5173", 10);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: frontendPort,
    proxy: {
      "/api": {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
});
