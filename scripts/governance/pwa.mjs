/**
 * PWA manifest, viewport, and installability audit.
 */
import fs from "fs";
import path from "path";
import { ROOT, rel, walk, UI } from "../lib/audit-core.mjs";

const REQUIRED_PUBLIC = ["pwa-192.png", "pwa-512.png", "notification-handler.js"];

export function runPwaAudit() {
  const errors = [];
  const warnings = [];
  const advisories = [];

  const indexPath = path.join(ROOT, "index.html");
  if (fs.existsSync(indexPath)) {
    const html = fs.readFileSync(indexPath, "utf8");
    if (!/viewport-fit\s*=\s*cover/.test(html)) {
      errors.push({
        kind: "viewport",
        message: "index.html viewport missing viewport-fit=cover (notch / safe-area)",
      });
    }
    if (!/100dvh|min-height:\s*100%/.test(html)) {
      warnings.push({
        kind: "dvh",
        message: "index.html boot styles should use 100dvh for mobile browser chrome",
      });
    }
    if (!/apple-mobile-web-app-capable/.test(html)) {
      warnings.push({ kind: "ios-pwa", message: "Missing apple-mobile-web-app-capable meta" });
    }
    if (!/theme-color/.test(html)) {
      warnings.push({ kind: "theme-color", message: "Missing theme-color meta for PWA status bar" });
    }
  } else {
    errors.push({ kind: "index", message: "Missing index.html" });
  }

  const vitePath = path.join(ROOT, "vite.config.js");
  if (fs.existsSync(vitePath)) {
    const vite = fs.readFileSync(vitePath, "utf8");
    if (!vite.includes("VitePWA")) {
      warnings.push({ kind: "vite-pwa", message: "vite.config.js missing VitePWA plugin" });
    }
    if (!/display:\s*["']standalone["']/.test(vite)) {
      warnings.push({ kind: "manifest", message: "PWA manifest should use display: standalone" });
    }
    if (!/orientation:\s*["']portrait/.test(vite)) {
      advisories.push({ kind: "orientation", message: "Consider portrait-primary orientation for mobile finance app" });
    }
  }

  for (const asset of REQUIRED_PUBLIC) {
    const p = path.join(ROOT, "public", asset);
    if (!fs.existsSync(p)) {
      errors.push({ kind: "public-asset", message: `Missing public/${asset}` });
    }
  }

  const componentsCss = path.join(UI, "styles/components.css");
  if (fs.existsSync(componentsCss)) {
    const css = fs.readFileSync(componentsCss, "utf8");
    if (!css.includes("safe-area-inset")) {
      errors.push({
        kind: "safe-area",
        message: "components.css missing env(safe-area-inset-*) for notched devices",
      });
    }
    if (!css.includes("touch-action") && !css.includes("user-scalable=no")) {
      advisories.push({
        kind: "touch",
        message: "Verify pinch-zoom policy matches index.html viewport (app-like scale)",
      });
    }
  }

  const embeddedPath = path.join(ROOT, "src/utils/embeddedApp.js");
  if (fs.existsSync(embeddedPath)) {
    const code = fs.readFileSync(embeddedPath, "utf8");
    if (!code.includes("Capacitor")) {
      warnings.push({
        kind: "embedded",
        file: rel(embeddedPath),
        message: "embeddedApp.js should detect Capacitor for PWA install hiding",
      });
    }
  }

  for (const file of walk(UI, [], /\.css$/)) {
    const code = fs.readFileSync(file, "utf8");
    if (/\bmin-height:\s*100vh\b/.test(code) && !/\b100dvh\b/.test(code)) {
      advisories.push({
        kind: "vh-vs-dvh",
        file: rel(file),
        message: "Uses 100vh without 100dvh — mobile browser URL bar may clip content",
      });
    }
  }

  return {
    id: "pwa",
    title: "PWA, viewport & safe-area",
    errors,
    warnings,
    advisories,
  };
}

if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, "/")}`) {
  const { printReport, exitCode, parseArgs } = await import("../lib/audit-core.mjs");
  const opts = parseArgs();
  const report = runPwaAudit();
  const s = printReport(report, opts);
  process.exit(exitCode(s, opts.strict));
}
