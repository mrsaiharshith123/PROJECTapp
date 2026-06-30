#!/usr/bin/env node
/** @deprecated Public deploy no longer bundles the React app. See scripts/vite-build-pages.mjs */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(ROOT, "dist");
const landing = path.join(ROOT, "landing");
const appDir = path.join(dist, "app");

function shouldAssemble() {
  if (process.env.VITE_EMBEDDED_APP === "1") return false;
  if (process.env.VITE_UPDATE_TEST_SHELL === "1") return false;
  const base = process.env.VITE_BASE_PATH || "/PROJECTapp/app/";
  if (base === "/" || base === "./" || base === ".") return false;
  return base.includes("PROJECTapp");
}

/** @param {string} src @param {string} dest */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(from, to);
    else fs.copyFileSync(from, to);
  }
}

if (!shouldAssemble()) {
  console.log("assemble-landing: skipped (embedded or non-Pages build).");
  process.exit(0);
}

if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error("assemble-landing: dist/index.html missing — run vite build first.");
  process.exit(1);
}

if (!fs.existsSync(landing)) {
  console.error("assemble-landing: landing/ folder missing.");
  process.exit(1);
}

fs.mkdirSync(appDir, { recursive: true });

const appIndex = path.join(dist, "index.html");
const appAssets = path.join(dist, "assets");

if (fs.existsSync(appIndex)) {
  fs.renameSync(appIndex, path.join(appDir, "index.html"));
}
if (fs.existsSync(appAssets)) {
  fs.renameSync(appAssets, path.join(appDir, "assets"));
}

for (const name of fs.readdirSync(landing)) {
  const from = path.join(landing, name);
  const to = path.join(dist, name);
  if (fs.statSync(from).isDirectory()) {
    copyDir(from, to);
  } else {
    fs.copyFileSync(from, to);
  }
}

console.log("assemble-landing: marketing page → dist/, React app → dist/app/");
