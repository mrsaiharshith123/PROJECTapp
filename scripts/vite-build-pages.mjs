#!/usr/bin/env node
/**
 * Vite production build for GitHub Pages: app at /PROJECTapp/app/, landing assembled after.
 */
import { spawnSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";

const embedded = process.env.VITE_EMBEDDED_APP === "1";
const updateTest = process.env.VITE_UPDATE_TEST_SHELL === "1";
const basePath =
  process.env.VITE_BASE_PATH ||
  (embedded || updateTest ? undefined : "/PROJECTapp/app/");

/** @type {Record<string, string>} */
const env = { ...process.env };
if (basePath) env.VITE_BASE_PATH = basePath;

const r = spawnSync("npx", ["vite", "build"], {
  cwd: ROOT,
  stdio: "inherit",
  shell: isWin,
  env,
});

process.exit(r.status ?? 1);
