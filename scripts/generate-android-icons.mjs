#!/usr/bin/env node
/**
 * Master PNGs for @capacitor/assets — wide-viewBox SVG so italic "o" is not clipped.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SVG_SOURCE = path.join(ROOT, "public/brand/icon-dark.svg");
const OUT_DIR = path.join(ROOT, "assets");

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.error("Install sharp: npm install sharp --save-dev");
  process.exit(1);
}

if (!fs.existsSync(SVG_SOURCE)) {
  console.error(`Missing ${SVG_SOURCE}`);
  process.exit(1);
}

const viewBox = fs.readFileSync(SVG_SOURCE, "utf8").match(/viewBox="([^"]+)"/)?.[1];
if (viewBox !== "-28 0 568 512") {
  console.warn(
    `Expected viewBox="-28 0 568 512" on icon-dark.svg (got ${viewBox ?? "none"}) — italic "o" may clip.`,
  );
}

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

async function run() {
  const svgBuffer = fs.readFileSync(SVG_SOURCE);

  await sharp(svgBuffer, { density: 384 })
    .resize(1024, 1024)
    .png()
    .toFile(path.join(OUT_DIR, "icon-only.png"));

  await sharp(svgBuffer, { density: 384 })
    .resize(680, 680)
    .extend({
      top: 172,
      bottom: 172,
      left: 172,
      right: 172,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(path.join(OUT_DIR, "icon-foreground.png"));

  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 4,
      background: { r: 26, g: 24, b: 20, alpha: 1 },
    },
  })
    .png()
    .toFile(path.join(OUT_DIR, "icon-background.png"));

  const splashBg = await sharp({
    create: {
      width: 2732,
      height: 2732,
      channels: 4,
      background: { r: 26, g: 24, b: 20, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  const wordmarkSized = await sharp(svgBuffer, { density: 384 }).resize(900, null).png().toBuffer();

  const wordmarkMeta = await sharp(wordmarkSized).metadata();
  const offsetX = Math.round((2732 - (wordmarkMeta.width || 900)) / 2);
  const offsetY = Math.round((2732 - (wordmarkMeta.height || 900)) / 2);

  await sharp(splashBg)
    .composite([{ input: wordmarkSized, left: offsetX, top: offsetY }])
    .png()
    .toFile(path.join(OUT_DIR, "splash.png"));

  console.log("Generated assets/icon-only.png, icon-foreground.png, icon-background.png, splash.png");
}

run().catch((err) => {
  console.error("Icon generation failed:", err);
  process.exit(1);
});
