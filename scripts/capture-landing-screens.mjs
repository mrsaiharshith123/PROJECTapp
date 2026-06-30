#!/usr/bin/env node
/**
 * Produce landing/screens/*.png for the phone mockup.
 * Prefers live app screenshots when dev server is up; otherwise rasterizes SVG placeholders.
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const screensDir = path.join(ROOT, "landing", "screens");
const isWin = process.platform === "win32";

const ROUTES = [
  { name: "home", url: "http://localhost:5173/PROJECTapp/" },
  { name: "insights", url: "http://localhost:5173/PROJECTapp/insights" },
  { name: "ledger", url: "http://localhost:5173/PROJECTapp/ledger" },
  { name: "agreements", url: "http://localhost:5173/PROJECTapp/agreements" },
];

async function devServerUp() {
  try {
    const res = await fetch("http://localhost:5173/PROJECTapp/", { signal: AbortSignal.timeout(2000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function rasterizeSvg(name) {
  const svgPath = path.join(screensDir, `${name}.svg`);
  if (!fs.existsSync(svgPath)) {
    console.warn(`Missing ${svgPath}`);
    return false;
  }

  const svg = fs.readFileSync(svgPath, "utf8");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#16140f;overflow:hidden}</style></head><body>${svg}</body></html>`;
  const tmpHtml = path.join(screensDir, `_tmp-${name}.html`);
  fs.writeFileSync(tmpHtml, html);

  const out = path.join(screensDir, `${name}.png`);
  const r = spawnSync(
    "npx",
    ["playwright", "screenshot", "--viewport-size=412,915", `file:///${tmpHtml.replace(/\\/g, "/")}`, out],
    { cwd: ROOT, stdio: "inherit", shell: isWin },
  );
  fs.unlinkSync(tmpHtml);
  return r.status === 0 && fs.existsSync(out);
}

async function captureFromDev() {
  for (const { name, url } of ROUTES) {
    const out = path.join(screensDir, `${name}.png`);
    const r = spawnSync(
      "npx",
      ["playwright", "screenshot", "--viewport-size=412,915", url, out],
      { cwd: ROOT, stdio: "inherit", shell: isWin },
    );
    if (r.status !== 0 || !fs.existsSync(out)) {
      console.warn(`Dev capture failed for ${name}`);
      return false;
    }
  }
  return true;
}

async function main() {
  fs.mkdirSync(screensDir, { recursive: true });

  spawnSync("npx", ["playwright", "install", "chromium"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: isWin,
  });

  if (await devServerUp()) {
    console.log("Dev server detected — capturing live app screens…");
    if (await captureFromDev()) {
      console.log("Landing screenshots saved from dev server.");
      return;
    }
  }

  console.log("Rasterizing SVG placeholders to PNG…");
  let ok = true;
  for (const { name } of ROUTES) {
    if (!(await rasterizeSvg(name))) ok = false;
  }
  if (!ok) process.exit(1);
  console.log("Landing PNG placeholders saved.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
