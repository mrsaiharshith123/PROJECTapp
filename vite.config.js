import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "/PROJECTapp/", // add this line

  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "CommitTrack",
        short_name: "CommitTrack",
        description:
          "Local-first financial commitments OS — pressure, repayments, and lending clarity.",
        start_url: "/CommitTrack/", // change this
        display: "standalone",
        theme_color: "#4f46e5",
        background_color: "#f3f4f6",
        orientation: "portrait-primary",
        icons: [
          {
            src: "/CommitTrack/favicon.svg", // change this
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,svg,woff2}"],
        navigateFallback: "/CommitTrack/index.html", // change this
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
