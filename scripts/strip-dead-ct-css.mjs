#!/usr/bin/env node
/**
 * Remove dead standalone .ct-* CSS rules.
 * Keeps selectors that alias .ct-* with .ed-* at the same level (comma siblings).
 * Drops selectors where .ct-* is a descendant of .ed-* (e.g. .ed-paper .ct-settings-row).
 */
import fs from "fs";
import path from "path";

const FILES = [
  "src/ui/styles/components-shell.css",
  "src/ui/styles/components-dh.css",
  "src/ui/styles/components-editorial-home.css",
  "src/ui/styles/components-editorial-pages.css",
  "src/ui/styles/components-editorial.css",
  "src/ui/styles/components-controls.css",
  "src/ui/styles/components-charts.css",
];

function shouldKeepSelector(sel) {
  const s = sel.trim();
  if (!/\.ct-/.test(s)) return true;
  if (!/\.ed-/.test(s)) return false;
  if (/\.ed-[\w-]*(?:\s|[>+~][\s]*)[^.]*\.ct-/.test(s)) return false;
  return true;
}

function splitSelectors(selectorText) {
  const parts = [];
  let buf = "";
  let depth = 0;
  for (const ch of selectorText) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }
  if (buf.trim()) parts.push(buf);
  return parts;
}

function processRuleBlock(block) {
  const trimmed = block.trim();
  if (!trimmed) return "";

  const atRule = trimmed.match(/^@(media|supports|layer)[^{]*/);
  if (atRule) {
    const open = trimmed.indexOf("{");
    const close = trimmed.lastIndexOf("}");
    if (open === -1 || close === -1) return trimmed;
    const inner = processStylesheet(trimmed.slice(open + 1, close));
    return `${trimmed.slice(0, open + 1)}\n${inner}\n${trimmed.slice(close)}`;
  }

  if (trimmed.startsWith("@keyframes")) return trimmed;

  const brace = trimmed.indexOf("{");
  if (brace === -1) return trimmed;

  const selectorText = trimmed.slice(0, brace).trim();
  const body = trimmed.slice(brace);
  const kept = splitSelectors(selectorText).filter(shouldKeepSelector);
  if (!kept.length) return "";
  return `${kept.join(",\n")} ${body}`;
}

function processStylesheet(css) {
  const rules = [];
  let i = 0;
  while (i < css.length) {
    while (i < css.length && /\s/.test(css[i])) i++;
    if (i >= css.length) break;

    if (css[i] === "@") {
      const start = i;
      let depth = 0;
      let started = false;
      while (i < css.length) {
        if (css[i] === "{") {
          depth++;
          started = true;
        }
        if (css[i] === "}") {
          depth--;
          if (started && depth === 0) {
            i++;
            break;
          }
        }
        i++;
      }
      rules.push(css.slice(start, i));
    } else {
      const start = i;
      let depth = 0;
      while (i < css.length) {
        if (css[i] === "{") depth++;
        if (css[i] === "}") {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        }
        i++;
      }
      rules.push(css.slice(start, i));
    }
  }

  return rules
    .map(processRuleBlock)
    .filter(Boolean)
    .join("\n\n");
}

function cleanupKeyframes(css) {
  const used = new Set();
  const refs = css.match(/animation:\s*([^;]+)/g) || [];
  for (const ref of refs) {
    const names = ref.replace("animation:", "").split(",");
    for (const part of names) {
      const name = part.trim().split(/\s+/)[0];
      if (name) used.add(name);
    }
  }

  return css.replace(/@keyframes\s+([\w-]+)\s*\{[^}]*\}/g, (match, name) => {
    if (name.startsWith("ct-") && !used.has(name)) return "";
    return match;
  });
}

for (const file of FILES) {
  const abs = path.resolve(file);
  const before = fs.readFileSync(abs, "utf8");
  let after = processStylesheet(before);
  after = cleanupKeyframes(after);
  after = after.replace(/\n{3,}/g, "\n\n").trim() + "\n";
  fs.writeFileSync(abs, after);
  const ctBefore = (before.match(/\.ct-/g) || []).length;
  const ctAfter = (after.match(/\.ct-/g) || []).length;
  console.log(`${file}: ${ctBefore} → ${ctAfter} .ct- refs`);
}
