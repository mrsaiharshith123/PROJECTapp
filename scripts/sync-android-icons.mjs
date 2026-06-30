#!/usr/bin/env node
/**
 * Regenerate Android launcher + splash from fixed brand SVG (via @capacitor/assets).
 * Run after `npx cap sync android` (called from build-dev-apk.mjs).
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const androidRes = path.join(ROOT, "android", "app", "src", "main", "res");
const isWin = process.platform === "win32";

if (!fs.existsSync(androidRes)) {
  console.warn("Skip Android icons: android/app/src/main/res missing");
  process.exit(0);
}

const gen = spawnSync("node", ["scripts/generate-android-icons.mjs"], {
  cwd: ROOT,
  stdio: "inherit",
  shell: isWin,
});
if (gen.status !== 0) process.exit(gen.status ?? 1);

const assets = spawnSync("npx", ["@capacitor/assets", "generate", "--android"], {
  cwd: ROOT,
  stdio: "inherit",
  shell: isWin,
});

if (assets.status === 0) {
  console.log("Android launcher + splash regenerated via @capacitor/assets");
  process.exit(0);
}

console.warn("@capacitor/assets failed — falling back to sharp mipmap sync");

const lightSvg = path.join(ROOT, "public", "brand", "icon-light.svg");
const darkSvg = path.join(ROOT, "public", "brand", "icon-dark.svg");
const source = fs.existsSync(lightSvg) ? lightSvg : darkSvg;

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.warn("Install sharp to sync Android icons: npm install sharp --save-dev");
  process.exit(assets.status ?? 1);
}

const DENSITIES = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

const svgBuffer = fs.readFileSync(source);

for (const [folder, px] of Object.entries(DENSITIES)) {
  const dir = path.join(androidRes, folder);
  if (!fs.existsSync(dir)) continue;
  const png = await sharp(svgBuffer, { density: 384 }).resize(px, px).png().toBuffer();
  for (const name of ["ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"]) {
    fs.writeFileSync(path.join(dir, name), png);
  }
}

console.log(`Synced Android launcher icons from brand/${path.basename(source)}`);
