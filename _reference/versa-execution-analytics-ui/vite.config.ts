import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    dedupe: ["react", "react-dom", "react-router-dom"],
    alias: [
      {
        find: "@unified-trading/ui-kit/globals.css",
        replacement: path.resolve(__dirname, "packages/ui-kit/src/globals.css"),
      },
      {
        find: "@unified-trading/ui-kit",
        replacement: path.resolve(__dirname, "packages/ui-kit/src/index.ts"),
      },
      {
        find: "@unified-trading/ui-auth",
        replacement: path.resolve(__dirname, "packages/ui-auth/src/index.ts"),
      },
      {
        find: "@unified-admin/core",
        replacement: path.resolve(__dirname, "packages/admin-core/src/index.ts"),
      },
      {
        find: "@",
        replacement: path.resolve(__dirname, "./src"),
      },
    ],
  },
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      "/api/": {
        target: "http://localhost:8006",
        changeOrigin: true,
      },
    },
  },
});
