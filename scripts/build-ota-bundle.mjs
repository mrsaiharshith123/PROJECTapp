#!/usr/bin/env node
/**
 * Zip dist/ for Capacitor OTA updates → dist/app-bundle.zip + patch app-version.json.
 * Skipped for minimal update-test shell builds.
 */
import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const archiver = require("archiver");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const distDir = path.join(ROOT, "dist");
const zipPath = path.join(distDir, "app-bundle.zip");

if (process.env.VITE_UPDATE_TEST_SHELL === "1") {
  console.log("OTA bundle skipped (update test shell build).");
  process.exit(0);
}

if (!fs.existsSync(path.join(distDir, "index.html"))) {
  console.log("OTA bundle skipped (no dist/index.html).");
  process.exit(0);
}

if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

function zipDist() {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", resolve);
    archive.on("error", reject);
    archive.pipe(output);
    archive.glob("**/*", {
      cwd: distDir,
      ignore: ["app-bundle.zip", "apk/**"],
    });
    archive.finalize();
  });
}

console.log("Building OTA bundle (app-bundle.zip)…");
await zipDist();

const size = fs.statSync(zipPath).size;
const manifestPath = path.join(distDir, "app-version.json");
const baseUrl =
  process.env.VITE_UPDATE_SERVER_URL ||
  process.env.VITE_APP_LIVE_URL ||
  "https://mrsaiharshith123.github.io/PROJECTapp/";
const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

/** @type {Record<string, unknown>} */
let manifest = {};
if (fs.existsSync(manifestPath)) {
  manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}
manifest.bundleUrl = `${normalizedBase}app-bundle.zip`;
manifest.bundleSize = size;
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`app-bundle.zip → ${(size / 1024 / 1024).toFixed(2)} MB`);
