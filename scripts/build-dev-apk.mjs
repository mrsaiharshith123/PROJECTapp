#!/usr/bin/env node
/**
 * Build a shareable debug APK for developers (Capacitor + bundled dist/).
 * Works offline after install — no Expo / appversion folder.
 *
 * Prerequisites: JDK 17+, Android SDK (Android Studio), ANDROID_HOME set.
 *
 *   npm run apk:dev
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";

function run(label, command, args, opts = {}) {
  console.log(`\n▶ ${label}`);
  const r = spawnSync(command, args, {
    cwd: opts.cwd || ROOT,
    stdio: "inherit",
    shell: true,
    env: { ...process.env, ...opts.env },
  });
  if (r.status !== 0) {
    console.error(`\n✗ Failed: ${label}`);
    process.exit(r.status ?? 1);
  }
}

function javaMajorVersion(jdkHome) {
  const javaExe = path.join(jdkHome, "bin", isWin ? "java.exe" : "java");
  if (!fs.existsSync(javaExe)) return 0;
  const r = spawnSync(javaExe, ["-version"], { encoding: "utf8" });
  const out = `${r.stderr || ""}${r.stdout || ""}`;
  const quoted = out.match(/version "([^"]+)"/);
  const raw = quoted?.[1] || out.match(/(\d+)/)?.[1] || "0";
  const n = Number.parseInt(String(raw).split(".")[0], 10);
  return Number.isFinite(n) ? n : 0;
}

function discoverJdkCandidates() {
  /** @type {string[]} */
  const found = [];
  const pushDir = (dir) => {
    if (!dir || !fs.existsSync(dir)) return;
    if (fs.existsSync(path.join(dir, "bin", isWin ? "java.exe" : "java"))) found.push(dir);
  };

  pushDir(process.env.JAVA_HOME);
  pushDir(process.env.JDK_HOME);

  const scanRoots = [
    "C:\\Program Files\\Microsoft",
    "C:\\Program Files\\Java",
    "C:\\Program Files\\Android\\Android Studio\\jbr",
  ];
  for (const root of scanRoots) {
    if (!fs.existsSync(root)) continue;
    try {
      for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const name = entry.name.toLowerCase();
        if (name.includes("jdk-21") || name.includes("jdk-17") || name === "jbr") {
          pushDir(path.join(root, entry.name));
        }
      }
    } catch {
      /* ignore unreadable roots */
    }
  }

  return [...new Set(found)];
}

/** Capacitor 7 / AGP need JDK 21 for compile; AGP itself needs at least 17. Avoid JDK 22+ (Gradle jlink issues). */
function resolveJdkHome() {
  const candidates = discoverJdkCandidates();
  const ranked = candidates
    .map((home) => ({ home, major: javaMajorVersion(home) }))
    .filter((c) => c.major >= 17 && c.major <= 21)
    .sort((a, b) => {
      if (a.major === 21 && b.major !== 21) return -1;
      if (b.major === 21 && a.major !== 21) return 1;
      return b.major - a.major;
    });

  if (ranked.length > 0) return ranked[0].home;

  const envHome = process.env.JAVA_HOME;
  if (envHome) {
    const major = javaMajorVersion(envHome);
    if (major >= 17 && major <= 21) return envHome;
  }
  return null;
}

function hasAndroidSdk() {
  return Boolean(process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT);
}

console.log("Perovo — developer APK (Capacitor, offline bundle)\n");

run("Production web build (embedded, root base)", "npm", ["run", "build"], {
  env: {
    ...process.env,
    VITE_BASE_PATH: "/",
    VITE_EMBEDDED_APP: "1",
  },
});

const androidDir = path.join(ROOT, "android");
if (!fs.existsSync(androidDir)) {
  console.log("\nFirst run: adding Capacitor Android platform…");
  run("Capacitor add android", "npx", ["cap", "add", "android"]);
}

run("Capacitor sync android", "npx", ["cap", "sync", "android"]);

run("Sync Android launcher icons", "node", ["scripts/sync-android-icons.mjs"]);
run("Patch Android permissions", "node", ["scripts/patch-android-manifest.mjs"]);
run("Sync Android versionName", "node", ["scripts/patch-android-version.mjs"]);
run("Patch iOS usage descriptions", "node", ["scripts/patch-ios-info-plist.mjs"]);

const jdkHome = resolveJdkHome();
if (jdkHome) {
  process.env.JAVA_HOME = jdkHome;
  console.log(`Using JAVA_HOME=${jdkHome}`);
} else {
  console.warn(
    "\n⚠ JDK 21 not found. Install with: winget install Microsoft.OpenJDK.21\n" +
      "  Then re-run: npm run apk:dev\n",
  );
}

if (!hasAndroidSdk()) {
  console.warn(
    "\n⚠ ANDROID_HOME / ANDROID_SDK_ROOT not set. Open Android Studio instead:\n" +
      "  npm run cap:android\n" +
      "  Build → Build Bundle(s) / APK(s) → Build APK(s)\n",
  );
  process.exit(0);
}

const gradlew = path.join(androidDir, isWin ? "gradlew.bat" : "gradlew");
if (!fs.existsSync(gradlew)) {
  console.error("Gradle wrapper missing — run: npx cap add android");
  process.exit(1);
}

run("Gradle assembleDebug", gradlew, ["assembleDebug"], {
  cwd: androidDir,
  env: { ...process.env, JAVA_HOME: jdkHome || process.env.JAVA_HOME },
});

const apkSrc = path.join(androidDir, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
if (!fs.existsSync(apkSrc)) {
  console.error("APK not found at:", apkSrc);
  process.exit(1);
}

const outDir = path.join(ROOT, "releases");
fs.mkdirSync(outDir, { recursive: true });
const stamp = new Date().toISOString().slice(0, 10);
const apkDest = path.join(outDir, `Perovo-dev-${stamp}.apk`);
fs.copyFileSync(apkSrc, apkDest);
const latest = path.join(outDir, "Perovo-dev-latest.apk");
fs.copyFileSync(apkSrc, latest);

run("Refresh app-version.json", "node", ["scripts/generate-app-version.mjs"]);

console.log(`\n✓ Developer APK ready:\n  ${apkDest}\n  ${latest}\n`);
console.log("Share either file — installs on any Android device (enable Unknown sources).");
