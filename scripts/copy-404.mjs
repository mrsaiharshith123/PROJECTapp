import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const index = path.join(dist, "index.html");
const notFound = path.join(dist, "404.html");

if (fs.existsSync(index)) {
  fs.copyFileSync(index, notFound);
  console.log("Copied index.html → 404.html for GitHub Pages SPA routing");
}
