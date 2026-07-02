#!/usr/bin/env node
/**
 * Split components.css into domain files (run once after editing sections).
 *   node scripts/split-components-css.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STYLES = path.join(__dirname, "../src/ui/styles");
const SRC = path.join(STYLES, "components.css");

const chunks = [
  { name: "components-core.css", start: 1, end: 2197 },
  { name: "components-charts.css", start: 2198, end: 3169 },
  { name: "components-surfaces.css", start: 3170, end: 8834 },
  { name: "components-editorial.css", start: 8835, end: Infinity },
];

const lines = fs.readFileSync(SRC, "utf8").split(/\r?\n/);

for (const { name, start, end } of chunks) {
  const slice = lines.slice(start - 1, end === Infinity ? undefined : end);
  const header =
    name === "components-core.css"
      ? slice.join("\n")
      : `/* Split from components.css — ${name} */\n${slice.join("\n")}`;
  fs.writeFileSync(path.join(STYLES, name), `${header.trimEnd()}\n`, "utf8");
  console.log(`Wrote ${name} (${slice.length} lines)`);
}

const indexCss = `@import "./tokens.css";
@import "./components-core.css";
@import "./components-charts.css";
@import "./components-surfaces.css";
@import "./components-editorial.css";
@import "./theme-light.css";
@import "./net-worth.css";
`;

fs.writeFileSync(path.join(STYLES, "index.css"), indexCss, "utf8");
fs.renameSync(SRC, path.join(STYLES, "components.css.bak"));
console.log("Updated index.css; renamed components.css → components.css.bak");
