#!/usr/bin/env node
/**
 * Replace Capacitor default launcher icons with Perovo brand assets.
 * Run after `npx cap sync android` (called from build-dev-apk.mjs).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const androidRes = path.join(ROOT, "android", "app", "src", "main", "res");
const source = path.join(ROOT, "public", "brand", "icon-light.png");

const DENSITIES = {
  "mipmap-mdpi": 48,
  "mipmap-hdpi": 72,
  "mipmap-xhdpi": 96,
  "mipmap-xxhdpi": 144,
  "mipmap-xxxhdpi": 192,
};

if (!fs.existsSync(androidRes)) {
  console.warn("Skip Android icons: android/app/src/main/res missing");
  process.exit(0);
}

if (!fs.existsSync(source)) {
  console.warn("Skip Android icons: public/brand/icon-light.png missing");
  process.exit(0);
}

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.warn("Install sharp to sync Android icons: npm install sharp --save-dev");
  process.exit(0);
}

for (const [folder, px] of Object.entries(DENSITIES)) {
  const dir = path.join(androidRes, folder);
  if (!fs.existsSync(dir)) continue;
  const png = await sharp(source).resize(px, px).png().toBuffer();
  for (const name of ["ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png"]) {
    fs.writeFileSync(path.join(dir, name), png);
  }
}

console.log("Synced Android launcher icons from brand/icon-light.png");
