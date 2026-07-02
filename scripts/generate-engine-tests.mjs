#!/usr/bin/env node
/** Generate smoke test stubs for every engine module missing __tests__/{name}.test.js */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENGINES = path.join(ROOT, "src/engines");

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "__tests__") continue;
      walk(p, acc);
    } else if (e.name.endsWith(".js") && !e.name.endsWith(".test.js")) {
      acc.push(p);
    }
  }
  return acc;
}

let created = 0;
for (const file of walk(ENGINES)) {
  const dir = path.dirname(file);
  const base = path.basename(file, ".js");
  const testDir = path.join(dir, "__tests__");
  const testFile = path.join(testDir, `${base}.test.js`);
  if (fs.existsSync(testFile)) continue;
  fs.mkdirSync(testDir, { recursive: true });
  const rel = path.relative(ROOT, file).replace(/\\/g, "/");
  const content = `import { describe, it, expect } from "vitest";
import * as engine from "../${base}.js";

describe("${rel}", () => {
  it("loads and exports at least one symbol", () => {
    expect(engine).toBeTruthy();
    expect(Object.keys(engine).length).toBeGreaterThan(0);
  });
});
`;
  fs.writeFileSync(testFile, content);
  created += 1;
}
console.log(`Created ${created} engine test stub(s).`);
