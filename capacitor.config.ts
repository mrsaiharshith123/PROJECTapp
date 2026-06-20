import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.perovo.mobile",
  appName: "Perovo",
  webDir: "dist",
  server: {
    androidScheme: "https",
  },
};

export default config;
