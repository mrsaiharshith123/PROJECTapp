import fs from "fs";
import path from "path";

const files = [
  "src/ui/styles/components-charts.css",
  "src/ui/styles/components-editorial.css",
  "src/ui/styles/components-controls.css",
];

for (const rel of files) {
  const fp = path.resolve(rel);
  let css = fs.readFileSync(fp, "utf8");
  const before = css;
  css = css.replace(
    /(html\[data-ui="ct"\] \.ct-([a-z0-9-]+))/g,
    (match, selector, name) => {
      if (selector.includes(", html")) return match;
      return `${selector},\nhtml[data-ui="ct"] .ed-${name}`;
    },
  );
  if (css !== before) {
    fs.writeFileSync(fp, css);
    console.log("ALIASES", rel);
  }
}
