import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uiKitSrc = path.resolve(__dirname, "../unified-trading-ui-kit/src");

export default defineConfig(({ mode }) => ({
  resolve: {
    dedupe: ["react", "react-dom", "react-router-dom"],
    // In dev: resolve ui-kit to source for HMR (no rebuild needed)
    alias:
      mode === "development"
        ? [
            {
              find: "@unified-trading/ui-kit/globals.css",
              replacement: path.join(uiKitSrc, "globals.css"),
            },
            {
              find: "@unified-trading/ui-kit",
              replacement: path.join(uiKitSrc, "index.ts"),
            },
          ]
        : undefined,
  },
  plugins: [react(), tailwindcss()],
  server: {
    port: 5181,
    strictPort: true,
    proxy: {
      "/api/": { target: "http://localhost:8013", changeOrigin: true },
    },
  },
}));
