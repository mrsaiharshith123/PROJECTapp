import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const brandLightLg = path.join(publicDir, "brand", "icon-light-lg.png");
const brandLight = path.join(publicDir, "brand", "icon-light.png");
const svgPath = path.join(publicDir, "favicon.svg");
const source = fs.existsSync(brandLightLg)
  ? brandLightLg
  : fs.existsSync(brandLight)
    ? brandLight
    : svgPath;

if (!fs.existsSync(source)) {
  console.warn("Skip PWA icons: no brand/icon-light-lg.png or favicon.svg");
  process.exit(0);
}

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.warn("Install sharp to regenerate PNG icons: npm install sharp --save-dev");
  process.exit(0);
}

const sizes = [
  { name: "pwa-192.png", px: 192 },
  { name: "pwa-512.png", px: 512 },
  { name: "favicon-32.png", px: 32 },
];

for (const { name, px } of sizes) {
  const out = path.join(publicDir, name);
  await sharp(source).resize(px, px).png().toFile(out);
  console.log("Wrote", out);
}
