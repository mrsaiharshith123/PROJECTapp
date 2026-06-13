/**
 * One-time rebrand: CommitTrack → Perovo in locale message files.
 * Run: node scripts/rebrand-perovo-i18n.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, "..", "src", "i18n", "messages");

const files = fs.readdirSync(messagesDir).filter((f) => f.endsWith(".js"));

for (const file of files) {
  const fp = path.join(messagesDir, file);
  let text = fs.readFileSync(fp, "utf8");

  text = text.replace(/CommitTrack/g, "Perovo");
  text = text.replace(/committrack/g, "perovo");
  text = text.replace(/"brand\.appName":\s*"[^"]*"/, '"brand.appName": "Perovo"');
  text = text.replace(/"brand\.byDaloyTech":\s*"[^"]*"/, '"brand.byDaloyTech": ""');
  text = text.replace(/"brand\.tadsayaNote":\s*"[^"]*"/, '"brand.tagline": "Finance. Simplified. For You."');

  // Strip Daloy / Tadsaya from common support copy (en-style; others may retain transliteration)
  text = text.replace(/Daloy Tech/g, "Perovo");
  text = text.replace(/Tadsaya/g, "Perovo");

  fs.writeFileSync(fp, text);
  console.log("Updated", file);
}

console.log(`Done — ${files.length} locale file(s).`);
