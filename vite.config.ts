import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ Fix: Remove `await import()`
let cartographerPlugin = [];
if (process.env.NODE_ENV !== "production" && process.env.REPL_ID !== undefined) {
  const cartographer = require("@replit/vite-plugin-cartographer").cartographer;
  cartographerPlugin.push(cartographer());
}

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin(),
    ...cartographerPlugin, // ✅ Properly loads conditionally
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"), // ✅ Fix alias path
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "client/dist"), // ✅ Fix output directory
    emptyOutDir: true,
  },
});
