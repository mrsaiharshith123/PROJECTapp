#!/usr/bin/env node
/** Run `gh auth login` using winget install path (Windows PATH often stale in npm terminals). */
import { resolveGhExe, envWithFreshPath } from "./lib/gh-cli.mjs";
import { spawnSync } from "node:child_process";

const gh = resolveGhExe();
console.log(`Using: ${gh}\n`);

const r = spawnSync(gh, ["auth", "login"], {
  stdio: "inherit",
  shell: false,
  env: envWithFreshPath(),
});

process.exit(r.status ?? 1);
