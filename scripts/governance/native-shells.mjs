/**
 * TWA + Capacitor native wrapper governance (static).
 */
import fs from "fs";
import path from "path";
import { ROOT, rel } from "../lib/audit-core.mjs";

const REQUIRED_SCRIPTS = ["apk:dev", "apk:twa", "cap:sync", "cap:android"];
const STALE_PATHS = ["appversion/package.json", "webversion/package.json"];

export function runNativeShellsAudit() {
  const errors = [];
  const warnings = [];
  const advisories = [];

  const capPath = path.join(ROOT, "capacitor.config.ts");
  if (!fs.existsSync(capPath)) {
    errors.push({ kind: "capacitor", message: "Missing capacitor.config.ts at repo root" });
  } else {
    const cap = fs.readFileSync(capPath, "utf8");
    if (!/webDir:\s*["']dist["']/.test(cap)) {
      errors.push({ kind: "capacitor", message: "capacitor.config.ts must set webDir to dist" });
    }
    if (!/appId:/.test(cap)) {
      warnings.push({ kind: "capacitor", message: "capacitor.config.ts should declare appId" });
    }
  }

  const twaManifest = path.join(ROOT, "twa", "twa-manifest.json");
  if (!fs.existsSync(twaManifest)) {
    errors.push({ kind: "twa", message: "Missing twa/twa-manifest.json (Play Store TWA)" });
  } else {
    try {
      const twa = JSON.parse(fs.readFileSync(twaManifest, "utf8"));
      if (!twa.host || !twa.packageId) {
        errors.push({ kind: "twa", message: "twa-manifest.json needs host and packageId" });
      }
      if (twa.host && !/^https?:\/\//.test(`https://${twa.host}`)) {
        advisories.push({ kind: "twa", message: `TWA host is ${twa.host} — must match live deployment` });
      }
    } catch {
      errors.push({ kind: "twa", message: "twa/twa-manifest.json is invalid JSON" });
    }
  }

  const mobileDoc = path.join(ROOT, "docs", "MOBILE.md");
  if (!fs.existsSync(mobileDoc)) {
    warnings.push({ kind: "docs", message: "Missing docs/MOBILE.md" });
  }

  const embedded = path.join(ROOT, "src", "utils", "embeddedApp.js");
  if (fs.existsSync(embedded)) {
    const code = fs.readFileSync(embedded, "utf8");
    if (!/Capacitor/.test(code)) {
      warnings.push({
        kind: "embedded",
        file: rel(embedded),
        message: "embeddedApp.js should detect Capacitor native shell",
      });
    }
  }

  const pkgPath = path.join(ROOT, "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    for (const script of REQUIRED_SCRIPTS) {
      if (!pkg.scripts?.[script]) {
        errors.push({ kind: "scripts", message: `package.json missing script: ${script}` });
      }
    }
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    if (!deps["@capacitor/core"]) {
      warnings.push({ kind: "deps", message: "Add @capacitor/core for iOS / dev APK shells" });
    }
    if (!deps["@capacitor/android"]) {
      advisories.push({
        kind: "deps",
        message: "@capacitor/android required for npm run apk:dev — run npm install",
      });
    }
  }

  for (const stale of STALE_PATHS) {
    if (fs.existsSync(path.join(ROOT, stale))) {
      errors.push({
        kind: "legacy",
        message: `Remove legacy folder: ${stale.split("/")[0]}/ (use TWA + Capacitor only)`,
      });
    }
  }

  const assetLinks = path.join(ROOT, "public", ".well-known", "assetlinks.json");
  if (!fs.existsSync(assetLinks)) {
    warnings.push({
      kind: "twa",
      message: "Missing public/.well-known/assetlinks.json — required for Play Store TWA",
    });
  }

  const buildScript = path.join(ROOT, "scripts", "build-dev-apk.mjs");
  if (!fs.existsSync(buildScript)) {
    errors.push({ kind: "scripts", message: "Missing scripts/build-dev-apk.mjs" });
  }

  return {
    id: "native-shells",
    title: "TWA & Capacitor native shells",
    errors,
    warnings,
    advisories,
  };
}
