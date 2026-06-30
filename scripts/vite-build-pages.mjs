#!/usr/bin/env node
/**
 * Public GitHub Pages deploy — static landing only (no React app bundles).
 * Embedded APK / update-test builds still use Vite for the full app.
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";

/** @param {string} src @param {string} dest */
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

function ensureLandingScreens() {
  const screensDir = path.join(ROOT, "landing", "screens");
  const names = ["home", "insights", "ledger", "agreements"];
  const missing = names.some((n) => !fs.existsSync(path.join(screensDir, `${n}.png`)));
  if (!missing) return;

  console.log("Landing PNGs missing — generating from SVG placeholders…");
  const r = spawnSync("node", ["scripts/capture-landing-screens.mjs"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: isWin,
  });
  if (r.status !== 0) {
    console.warn("capture-landing-screens failed; build continues with existing assets.");
  }
}

function buildLandingOnly() {
  ensureLandingScreens();

  const dist = path.join(ROOT, "dist");
  const landing = path.join(ROOT, "landing");
  const pub = path.join(ROOT, "public");

  if (fs.existsSync(dist)) fs.rmSync(dist, { recursive: true, force: true });
  copyDir(landing, dist);
  copyDir(path.join(pub, "brand"), path.join(dist, "brand"));

  for (const name of ["app-version.json"]) {
    const src = path.join(pub, name);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dist, name));
  }

  console.log("Public deploy → landing-only (dist/)");
}

const embedded = process.env.VITE_EMBEDDED_APP === "1";
const updateTest = process.env.VITE_UPDATE_TEST_SHELL === "1";

if (!embedded && !updateTest) {
  buildLandingOnly();
  process.exit(0);
}

/** @type {Record<string, string>} */
const env = { ...process.env };
if (!env.VITE_BASE_PATH) env.VITE_BASE_PATH = "/";

const r = spawnSync("npx", ["vite", "build"], {
  cwd: ROOT,
  stdio: "inherit",
  shell: isWin,
  env,
});

process.exit(r.status ?? 1);
