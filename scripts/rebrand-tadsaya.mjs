/**
 * Rebrand Tadsaya → Tadsaya across locale files and docs.
 * Run: node scripts/rebrand-tadsaya.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, "..", "..");

const TARGETS = [
  path.join(repoRoot, "src", "i18n", "messages"),
  path.join(repoRoot, "docs"),
  path.join(repoRoot, "README.md"),
  path.join(repoRoot, "scripts"),
].flatMap((p) => {
  if (!fs.existsSync(p)) return [];
  const stat = fs.statSync(p);
  if (stat.isFile()) return [p];
  if (p.endsWith("messages")) {
    return fs.readdirSync(p).filter((f) => f.endsWith(".js")).map((f) => path.join(p, f));
  }
  if (p.endsWith("docs")) {
    return fs.readdirSync(p).filter((f) => f.endsWith(".md")).map((f) => path.join(p, f));
  }
  if (p.endsWith("scripts")) {
    return fs
      .readdirSync(p)
      .filter((f) => f.endsWith(".mjs"))
      .map((f) => path.join(p, f));
  }
  return [];
});

const REPLACEMENTS = [
  [/brand\.byTadsaya/g, "brand.byTadsaya"],
  [/byTadsaya/g, "byTadsaya"],
  [/Tadsaya/gi, "Tadsaya"],
  [/daloy\.tech/gi, "tadsaya.com"],
  [/Perovo by Tadsaya/g, "Perovo by Tadsaya"],
];

let updated = 0;
for (const fp of TARGETS) {
  let text = fs.readFileSync(fp, "utf8");
  const before = text;
  for (const [re, rep] of REPLACEMENTS) {
    text = text.replace(re, rep);
  }
  if (fp.endsWith("en.js")) {
    text = text.replace(/"brand\.byTadsaya":\s*"[^"]*"/, '"brand.byTadsaya": "by Tadsaya"');
    text = text.replace(/"support\.contactEmail":\s*"[^"]*"/, '"support.contactEmail": "support@tadsaya.com"');
    text = text.replace(
      /"support\.aboutBody":\s*\n\s*"[^"]*"/,
      '"support.aboutBody":\n    "Perovo helps Indian households track bills, lending, and monthly pressure — a product of Tadsaya, on your device."',
    );
  }
  if (text !== before) {
    fs.writeFileSync(fp, text);
    updated++;
    console.log("Updated", path.relative(repoRoot, fp));
  }
}
console.log(`Done — ${updated} file(s).`);
