import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.perovo.mobile",
  appName: "Perovo",
  webDir: "dist",
  server: {
    androidScheme: "https",
    allowNavigation: [],
  },
  android: {
    webContentsDebuggingEnabled: false,
  },
  plugins: {
    CapacitorUpdater: {
      autoUpdate: false,
      directUpdate: false,
      /** Full app needs time to load chunks before notifyAppReady — avoid rollback black screen. */
      appReadyTimeout: 120000,
      autoDeleteFailed: true,
      /** Drop old OTA zip bundles after a successful switch — limits "cache" growth. */
      autoDeletePrevious: true,
      /** When user installs a newer APK from the store/sideload, remove downloaded OTA bundles. */
      resetWhenUpdate: true,
    },
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: "#16140f",
      style: "LIGHT",
    },
  },
};

export default config;
