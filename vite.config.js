/* global process */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

/** GitHub Pages project site: https://user.github.io/PROJECTapp/ */
const base = process.env.VITE_BASE_PATH || "/";
const basePath = base.endsWith("/") ? base : `${base}/`;

// https://vite.dev/config/
export default defineConfig({
  base: /PROJECTapp/,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "pwa-192.png", "pwa-512.png"],
      manifest: {
        name: "CommitTrack",
        short_name: "CommitTrack",
        description:
          "Local-first financial commitments OS — pressure, repayments, and lending clarity.",
        id: basePath,
        start_url: basePath,
        scope: basePath,
        display: "standalone",
        theme_color: "#4f46e5",
        background_color: "#f3f4f6",
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
            src: `${basePath}favicon.svg`,
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,png,woff2}"],
        navigateFallback: `${basePath}index.html`,
        navigateFallbackDenylist: [/^\/api\//],
      },
      devOptions: {
        enabled: true,
        type: "module",
        navigateFallback: "index.html",
      },
    }),
  ],
});
