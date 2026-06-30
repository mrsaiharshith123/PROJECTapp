import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const appIndex = path.join(dist, "app", "index.html");
const rootIndex = path.join(dist, "index.html");
const notFound = path.join(dist, "404.html");

const spaIndex = fs.existsSync(appIndex) ? appIndex : rootIndex;

if (fs.existsSync(spaIndex)) {
  fs.copyFileSync(spaIndex, notFound);
  console.log(
    fs.existsSync(appIndex)
      ? "Copied app/index.html → 404.html for GitHub Pages SPA routing"
      : "Copied index.html → 404.html for GitHub Pages SPA routing",
  );
}
