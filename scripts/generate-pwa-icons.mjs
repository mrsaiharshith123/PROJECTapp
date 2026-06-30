import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const lightSvg = path.join(publicDir, "brand", "icon-light.svg");
const darkSvg = path.join(publicDir, "brand", "icon-dark.svg");
const lightPng = path.join(publicDir, "brand", "icon-light.png");
const darkPng = path.join(publicDir, "brand", "icon-dark.png");

const svgSource = fs.existsSync(lightSvg) ? lightSvg : darkSvg;
const pngFallback = fs.existsSync(lightPng) ? lightPng : darkPng;

if (!fs.existsSync(svgSource) && !fs.existsSync(pngFallback)) {
  console.warn("Skip PWA icons: brand SVG/PNG missing");
  process.exit(0);
}

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.warn("Install sharp to regenerate PNG icons: npm install sharp --save-dev");
  process.exit(0);
}

async function rasterize(source, out, px) {
  if (source.endsWith(".svg")) {
    await sharp(fs.readFileSync(source), { density: 384 }).resize(px, px).png().toFile(out);
  } else {
    await sharp(source).resize(px, px).png().toFile(out);
  }
  console.log("Wrote", out);
}

const sizes = [
  { name: "pwa-192.png", px: 192 },
  { name: "pwa-512.png", px: 512 },
  { name: "favicon-32.png", px: 32 },
];

for (const { name, px } of sizes) {
  await rasterize(svgSource, path.join(publicDir, name), px);
}

if (fs.existsSync(darkSvg) && svgSource !== darkSvg) {
  for (const { name, px } of [
    { name: "pwa-192-dark.png", px: 192 },
    { name: "pwa-512-dark.png", px: 512 },
  ]) {
    await rasterize(darkSvg, path.join(publicDir, name), px);
  }
} else if (fs.existsSync(darkSvg)) {
  for (const { name, px } of [
    { name: "pwa-192-dark.png", px: 192 },
    { name: "pwa-512-dark.png", px: 512 },
  ]) {
    await rasterize(darkSvg, path.join(publicDir, name), px);
  }
}

for (const [svg, png] of [
  [lightSvg, lightPng],
  [darkSvg, darkPng],
]) {
  if (fs.existsSync(svg)) {
    await rasterize(svg, png, 512);
  }
}

console.log(`PWA icons generated from ${path.basename(svgSource)} (wide viewBox SVG)`);
