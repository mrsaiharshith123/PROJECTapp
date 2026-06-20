/* global process */
import fs from "fs";
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import pkg from "./package.json" with { type: "json" };

/** GitHub Pages project site: https://user.github.io/PROJECTapp/ */
const rawBase = process.env.VITE_BASE_PATH || "/PROJECTapp/";
const basePath = rawBase.startsWith("/") ? (rawBase.endsWith("/") ? rawBase : `${rawBase}/`) : `/${rawBase}/`;
const embeddedApp = process.env.VITE_EMBEDDED_APP === "1";
const appVersion = process.env.VITE_APP_VERSION || pkg.version || "0.0.0";
let appBuiltAt = "";
try {
  const manifestPath = path.join(process.cwd(), "public/app-version.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  appBuiltAt = manifest.builtAt || "";
} catch {
  /* dev without generated manifest */
}

// https://vite.dev/config/
export default defineConfig({
  base: basePath,
  define: {
    "import.meta.env.VITE_APP_VERSION": JSON.stringify(appVersion),
    "import.meta.env.VITE_APP_BUILT_AT": JSON.stringify(appBuiltAt),
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("recharts") || id.includes("d3-")) return "charts";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("react-router") || id.includes("react-dom") || id.includes("/react/")) return "react-vendor";
          if (id.includes("date-fns")) return "date-fns";
        },
      },
    },
  },
  plugins: [
    react(),
    ...(!embeddedApp
      ? [
          VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon-32.png", "pwa-192.png", "pwa-512.png", "brand/**/*"],
      manifest: {
        name: "Perovo",
        short_name: "Perovo",
        description: "Finance simplified — bills, pressure, repayments, and lending on your device.",
        id: basePath,
        start_url: basePath,
        scope: basePath,
        display: "standalone",
        theme_color: "#4A6CF7",
        background_color: "#0d0d17",
        orientation: "portrait-primary",
        icons: [
          {
            src: `${basePath}pwa-192.png`,
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: `${basePath}pwa-512.png`,
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: `${basePath}pwa-512.png`,
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: `${basePath}favicon-32.png`,
            sizes: "32x32",
            type: "image/png",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,png,woff2}"],
        globIgnores: ["**/apk/**"],
        navigateFallback: `${basePath}index.html`,
        navigateFallbackDenylist: [/^\/api\//, /\/apk\//],
        importScripts: ["notification-handler.js"],
      },
      devOptions: {
        // Off in dev — stale SW caches break HMR after refactors (blank page).
        enabled: false,
        type: "module",
        navigateFallback: "index.html",
      },
    }),
        ]
      : []),
  ],
});
