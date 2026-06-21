import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.perovo.mobile",
  appName: "Perovo",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
  plugins: {
    CapacitorUpdater: {
      autoUpdate: false,
      /** Full app needs time to load chunks before notifyAppReady — avoid rollback black screen. */
      appReadyTimeout: 120000,
      autoDeleteFailed: true,
    },
  },
};

export default config;
