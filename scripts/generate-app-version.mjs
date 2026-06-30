import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
const version = process.env.VITE_APP_VERSION || pkg.version || "0.0.0";

const out = {
  version,
  builtAt: new Date().toISOString(),
  appUrl:
    process.env.VITE_UPDATE_SERVER_URL ||
    process.env.VITE_APP_LIVE_URL ||
    "https://mrsaiharshith123.github.io/PROJECTapp/",
};

const normalizedBase = out.appUrl.endsWith("/") ? out.appUrl : `${out.appUrl}/`;
for (const zipRel of ["dist/app-bundle.zip", "public/app-bundle.zip"]) {
  const zipPath = path.join(root, zipRel);
  if (fs.existsSync(zipPath)) {
    out.bundleUrl = `${normalizedBase}app-bundle.zip`;
    out.bundleSize = fs.statSync(zipPath).size;
    break;
  }
}

fs.mkdirSync(path.join(root, "public"), { recursive: true });
fs.writeFileSync(path.join(root, "public/app-version.json"), `${JSON.stringify(out, null, 2)}\n`);
console.log(`app-version.json → ${version}`);
