#!/usr/bin/env node
/**
 * Starts Vite with VITE_SIMULATE_PAYMENTS=true (for preview / prod-build testing).
 * `npm run dev` already simulates payments via import.meta.env.DEV.
 */
import { spawn } from "node:child_process";

const cmd = process.argv[2] === "preview" ? "preview" : "dev";
const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

const child = spawn(npmCmd, ["run", cmd], {
  stdio: "inherit",
  env: { ...process.env, VITE_SIMULATE_PAYMENTS: "true" },
  shell: process.platform === "win32",
});

child.on("exit", (code) => process.exit(code ?? 0));
