import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const notFound = path.join(dist, "404.html");
const landingIndex = path.join(dist, "index.html");

if (fs.existsSync(landingIndex)) {
  fs.copyFileSync(landingIndex, notFound);
  console.log("Copied index.html → 404.html for GitHub Pages");
}
