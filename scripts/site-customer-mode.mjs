#!/usr/bin/env node
/**
 * Toggle customer mode (landing vs full app) for local preview and live site.
 *
 *   npm run site:mode              # status + live URLs
 *   npm run site:mode -- on        # landing page (default for GitHub Pages)
 *   npm run site:mode -- off       # full app in browser
 *
 * Live site (no redeploy): open the printed URL or use ?app=1 / ?app=0
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_LOCAL = path.join(ROOT, ".env.local");
const KEY = "VITE_CUSTOMER_MODE";
const SITE = process.env.PEROVO_SITE_URL || "https://mrsaiharshith123.github.io/PROJECTapp";

const arg = (process.argv[2] || "status").toLowerCase();

function readEnvLocal() {
  if (!fs.existsSync(ENV_LOCAL)) return {};
  const out = {};
  for (const line of fs.readFileSync(ENV_LOCAL, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function writeCustomerMode(value) {
  const lines = fs.existsSync(ENV_LOCAL) ? fs.readFileSync(ENV_LOCAL, "utf8").split(/\r?\n/) : [];
  const kept = lines.filter((l) => l && !l.startsWith(`${KEY}=`));
  kept.push(`${KEY}=${value}`);
  fs.writeFileSync(ENV_LOCAL, `${kept.join("\n").trim()}\n`, "utf8");
}

function printLiveUrls() {
  console.log("\nLive site (saved in browser localStorage):");
  console.log(`  Landing (customer on):  ${SITE}/?app=0`);
  console.log(`  Full app (customer off): ${SITE}/?app=1`);
  console.log("\nAfter ?app=1, reload without the query — stays in app mode until cleared.");
  console.log("Clear override: DevTools → Application → Local Storage → delete perovo_customer_mode");
}

if (arg === "on" || arg === "landing" || arg === "customer") {
  writeCustomerMode("1");
  console.log("✓ Local .env.local → VITE_CUSTOMER_MODE=1 (landing page on `npm run preview`)");
  printLiveUrls();
  process.exit(0);
}

if (arg === "off" || arg === "app" || arg === "dev") {
  writeCustomerMode("0");
  console.log("✓ Local .env.local → VITE_CUSTOMER_MODE=0 (full app on `npm run preview`)");
  printLiveUrls();
  process.exit(0);
}

const local = readEnvLocal()[KEY];
console.log("Perovo — customer mode\n");
console.log(`  Local preview (.env.local): ${local === "0" ? "OFF (full app)" : local === "1" ? "ON (landing)" : "(not set — landing in production, app in dev)"}`);
console.log(`  npm run site:mode -- on   → landing for preview`);
console.log(`  npm run site:mode -- off  → full app for preview`);
printLiveUrls();
