#!/usr/bin/env node
/**
 * notifications.js must not hardcode English user-facing strings in feed builders.
 *   npm run audit:notification-i18n
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const FILE = path.join(ROOT, "src/engines/notifications.js");
const JSON_OUT = process.argv.includes("--json");

function main() {
  const text = fs.readFileSync(FILE, "utf8");
  const hits = [];
  const lines = text.split("\n");
  lines.forEach((line, i) => {
    if (/message\s*:\s*[`'"]/.test(line) && /Overdue|Due soon|Upcoming|Perovo/.test(line)) {
      hits.push({ line: i + 1, snippet: line.trim().slice(0, 90) });
    }
    if (/title\s*:\s*[`'"]Perovo/.test(line)) {
      hits.push({ line: i + 1, snippet: line.trim().slice(0, 90) });
    }
  });

  if (JSON_OUT) {
    console.log(JSON.stringify({ total: hits.length, items: hits }));
    process.exit(hits.length ? 1 : 0);
  }

  if (!hits.length) {
    console.log("Notification i18n: no hardcoded feed strings in notifications.js.");
    process.exit(0);
  }

  console.log(`Notification i18n — ${hits.length} hardcoded string(s):\n`);
  hits.forEach((h) => console.log(`  notifications.js:${h.line} — ${h.snippet}`));
  process.exit(1);
}

main();
