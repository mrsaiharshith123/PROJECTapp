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

function resolveJdkHome() {
  if (process.env.JAVA_HOME) return process.env.JAVA_HOME;
  const candidates = [
    "C:\\Program Files\\Microsoft\\jdk-21.0.11.10-hotspot",
    "C:\\Program Files\\Microsoft\\jdk-21.0.11-hotspot",
    "C:\\Program Files\\Android\\Android Studio\\jbr",
  ];
  for (const p of candidates) {
    if (fs.existsSync(path.join(p, "bin", "java.exe"))) return p;
  }
  return null;
}

function hasAndroidSdk() {
  return Boolean(process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT);
}

console.log("Perovo — developer APK (Capacitor, offline bundle)\n");

run("Production web build", "npm", ["run", "build"]);

const androidDir = path.join(ROOT, "android");
if (!fs.existsSync(androidDir)) {
  console.log("\nFirst run: adding Capacitor Android platform…");
  run("Capacitor add android", "npx", ["cap", "add", "android"]);
}

run("Capacitor sync android", "npx", ["cap", "sync", "android"]);

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

run("Gradle assembleDebug", gradlew, ["assembleDebug"], { cwd: androidDir });

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

console.log(`\n✓ Developer APK ready:\n  ${apkDest}\n  ${latest}\n`);
console.log("Share either file — installs on any Android device (enable Unknown sources).");
