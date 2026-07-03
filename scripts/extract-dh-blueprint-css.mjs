#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const blueprint =
  process.argv[2] ||
  path.join(process.env.USERPROFILE || "", "Downloads/perovo-direction-h-blueprint.md");
const md = fs.readFileSync(blueprint, "utf8");
const blocks = [...md.matchAll(/```css\n([\s\S]*?)```/g)].map((m) => m[1]);
if (blocks.length < 2) {
  console.error(`Expected 2 css blocks, got ${blocks.length}`);
  process.exit(1);
}
const styles = path.join(root, "src/ui/styles");
fs.writeFileSync(path.join(styles, "tokens.css"), `${blocks[0].trim()}\n`);
fs.writeFileSync(path.join(styles, "components-dh.css"), `${blocks[1].trim()}\n`);
console.log(`Wrote tokens.css (${blocks[0].length} chars)`);
console.log(`Wrote components-dh.css (${blocks[1].length} chars)`);
