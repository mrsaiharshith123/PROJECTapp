import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "tests/suites/**/*.test.mjs",
      "src/**/__tests__/**/*.test.js",
    ],
    reporters: ["verbose"],
    globals: true,
    // CI runs `npm test` before secrets are injected; tier/auth smoke tests need these.
    env: {
      VITE_SUPABASE_URL: "https://test.supabase.co",
      VITE_SUPABASE_ANON_KEY: "test-anon-key",
    },
  },
});
