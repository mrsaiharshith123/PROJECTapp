/* global process */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

/** GitHub Pages project site: https://user.github.io/PROJECTapp/ */
const rawBase = process.env.VITE_BASE_PATH || "/PROJECTapp/";
const basePath = rawBase.startsWith("/") ? (rawBase.endsWith("/") ? rawBase : `${rawBase}/`) : `/${rawBase}/`;

// https://vite.dev/config/
export default defineConfig({
  base: basePath,
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
        background_color: "#FFFFFF",
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
        navigateFallback: `${basePath}index.html`,
        navigateFallbackDenylist: [/^\/api\//],
        importScripts: ["notification-handler.js"],
      },
      devOptions: {
        // Off in dev — stale SW caches break HMR after refactors (blank page).
        enabled: false,
        type: "module",
        navigateFallback: "index.html",
      },
    }),
  ],
});
