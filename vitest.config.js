import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "tests/suites/**/*.test.mjs",
      "src/engines/__tests__/**/*.test.js",
      "src/engines/netWorth/__tests__/**/*.test.js",
    ],
    reporters: ["verbose"],
    globals: true,
  },
});
