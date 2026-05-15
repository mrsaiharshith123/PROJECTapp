import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const svgPath = path.join(publicDir, "favicon.svg");

if (!fs.existsSync(svgPath)) {
  console.warn("Skip PWA icons: public/favicon.svg missing");
  process.exit(0);
}

let sharp;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.warn("Install sharp to regenerate PNG icons: npm install sharp --save-dev");
  process.exit(0);
}

const sizes = [192, 512];
for (const size of sizes) {
  const out = path.join(publicDir, `pwa-${size}.png`);
  await sharp(svgPath).resize(size, size).png().toFile(out);
  console.log("Wrote", out);
}
