#!/usr/bin/env node
/**
 * Zip a Capacitor-compatible dist/ for OTA updates → dist/app-bundle.zip + patch app-version.json.
 *
 * GitHub Pages builds use base /PROJECTapp/ — that breaks Capacitor (assets 404 → black screen).
 * When the main dist is not root-based, we run a second Vite build into dist-ota/ with base /.
 */
import { spawnSync } from "child_process";
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const archiver = require("archiver");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(ROOT, "dist");
const otaBuildDir = path.join(ROOT, "dist-ota");
const zipPath = path.join(distDir, "app-bundle.zip");
const isWin = process.platform === "win32";

if (process.env.VITE_UPDATE_TEST_SHELL === "1") {
  console.log("OTA bundle skipped (update test shell build).");
  process.exit(0);
}

function resolveAppIndexHtml(dir) {
  const nested = path.join(dir, "app", "index.html");
  if (fs.existsSync(nested)) return nested;
  return path.join(dir, "index.html");
}

if (!fs.existsSync(resolveAppIndexHtml(distDir))) {
  console.log("OTA bundle skipped (no app index.html).");
  process.exit(0);
}

/** @param {string} dir */
function distUsesCapacitorBase(dir) {
  const htmlPath = resolveAppIndexHtml(dir);
  if (!fs.existsSync(htmlPath)) return false;
  const html = fs.readFileSync(htmlPath, "utf8");
  if (html.includes("/PROJECTapp/")) return false;
  return html.includes("./assets/") || html.includes('src="/assets/') || html.includes("src='/assets/");
}

function buildEmbeddedOtaDist() {
  console.log("Building Capacitor OTA web bundle (VITE_BASE_PATH=./, embedded)…");
  if (fs.existsSync(otaBuildDir)) {
    fs.rmSync(otaBuildDir, { recursive: true, force: true });
  }
  const r = spawnSync("npx", ["vite", "build", "--outDir", "dist-ota"], {
    cwd: ROOT,
    stdio: "inherit",
    shell: isWin,
    env: {
      ...process.env,
      VITE_BASE_PATH: "./",
      VITE_EMBEDDED_APP: "1",
    },
  });
  if (r.status !== 0) {
    console.error("Embedded OTA Vite build failed.");
    process.exit(r.status ?? 1);
  }
  if (!distUsesCapacitorBase(otaBuildDir)) {
    console.error("dist-ota still references /PROJECTapp/ — OTA bundle would black-screen in APK.");
    process.exit(1);
  }
  return otaBuildDir;
}

let zipSource = distDir;
if (!distUsesCapacitorBase(distDir)) {
  zipSource = buildEmbeddedOtaDist();
}

function zipDist(sourceDir) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);
    archive.glob("**/*", {
      cwd: sourceDir,
      ignore: ["app-bundle.zip", "apk/**"],
    });
    archive.finalize();
  });
}

if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

console.log(`Building OTA bundle (app-bundle.zip) from ${path.basename(zipSource)}/…`);
await zipDist(zipSource);

const size = fs.statSync(zipPath).size;
const manifestPath = path.join(distDir, "app-version.json");
const appLiveUrl =
  process.env.VITE_UPDATE_SERVER_URL ||
  process.env.VITE_APP_LIVE_URL ||
  "https://mrsaiharshith123.github.io/PROJECTapp/app/";
const bundleBase =
  process.env.VITE_BUNDLE_SERVER_URL ||
  "https://mrsaiharshith123.github.io/PROJECTapp/";
const normalizedAppUrl = appLiveUrl.endsWith("/") ? appLiveUrl : `${appLiveUrl}/`;
const normalizedBundleBase = bundleBase.endsWith("/") ? bundleBase : `${bundleBase}/`;

/** @type {Record<string, unknown>} */
let manifest = {};
if (fs.existsSync(manifestPath)) {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}
manifest.appUrl = normalizedAppUrl;
manifest.bundleUrl = `${normalizedBundleBase}app-bundle.zip`;
manifest.bundleSize = size;
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`app-bundle.zip → ${(size / 1024 / 1024).toFixed(2)} MB (Capacitor-safe paths)`);
