#!/usr/bin/env node
/**
 * Validate governance feature registry paths exist on disk.
 *   npm run audit:registry-sync
 */
import fs from "fs";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");
const JSON_OUT = process.argv.includes("--json");

async function main() {
  const mod = await import(pathToFileURL(path.join(SRC, "governance/registries/features.js")).href);
  const features = mod.FEATURES || [];
  const missing = [];

  for (const feat of features) {
    for (const relPath of [...(feat.ui || []), ...(feat.engines || []), ...(feat.hooks || [])]) {
      const full = path.join(SRC, relPath.replace(/^src\//, ""));
      const exists =
        fs.existsSync(full) ||
        fs.existsSync(`${full}.js`) ||
        fs.existsSync(`${full}.jsx`) ||
        (relPath.endsWith("/") && fs.existsSync(full));
      if (!exists) {
        missing.push({ feature: feat.id, path: relPath });
      }
    }
  }

  if (JSON_OUT) {
    console.log(JSON.stringify({ total: missing.length, items: missing }));
    process.exit(missing.length ? 1 : 0);
  }

  if (!missing.length) {
    console.log("Registry sync: all feature registry paths exist.");
    process.exit(0);
  }

  console.log(`Registry sync — ${missing.length} broken path(s):\n`);
  missing.forEach((m) => console.log(`  [${m.feature}] ${m.path}`));
  process.exit(1);
}

main();
