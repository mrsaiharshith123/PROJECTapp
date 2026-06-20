#!/usr/bin/env node
/**
 * Localhost only — toggle customer landing vs full dev app in `npm run dev`.
 *
 *   npm run site:mode           # status
 *   npm run site:customer-on    # localhost shows landing page
 *   npm run site:customer-off     # localhost shows full app (default)
 *
 * Restart `npm run dev` after changing.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENV_LOCAL = path.join(ROOT, ".env.local");
const KEY = "VITE_CUSTOMER_MODE";

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

function writeEnvLocal(value) {
  const lines = fs.existsSync(ENV_LOCAL) ? fs.readFileSync(ENV_LOCAL, "utf8").split(/\r?\n/) : [];
  const kept = lines.filter((l) => l && !l.startsWith(`${KEY}=`));
  if (value !== null) kept.push(`${KEY}=${value}`);
  const body = kept.length ? `${kept.join("\n").trim()}\n` : "";
  if (body) fs.writeFileSync(ENV_LOCAL, body, "utf8");
  else if (fs.existsSync(ENV_LOCAL)) fs.unlinkSync(ENV_LOCAL);
}

function remindRestart() {
  console.log("\n↻ Restart the dev server: stop `npm run dev`, then run it again.");
  console.log("  http://localhost:5173");
}

if (arg === "on" || arg === "landing" || arg === "customer") {
  writeEnvLocal("1");
  console.log("✓ Customer mode ON — localhost will show the landing page.");
  remindRestart();
  process.exit(0);
}

if (arg === "off" || arg === "app" || arg === "dev") {
  writeEnvLocal(null);
  console.log("✓ Customer mode OFF — localhost shows the full dev app (default).");
  remindRestart();
  process.exit(0);
}

const local = readEnvLocal()[KEY];
console.log("Perovo — customer mode (localhost only)\n");
console.log(
  `  Current: ${local === "1" ? "ON (landing page)" : "OFF (full app — default)"}`,
);
console.log("\n  npm run site:customer-on   → preview landing on localhost");
console.log("  npm run site:customer-off  → back to full dev app");
console.log("\n  GitHub Pages is always landing-only — this does not affect the live site.");
