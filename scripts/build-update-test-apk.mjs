#!/usr/bin/env node
/**
 * Build a minimal “old version” APK — one screen with an Update button only.
 * Use to test in-app updates against the live GitHub Pages build.
 *
 *   npm run apk:update-test
 *   npm run apk:update-test:publish   # upload to GitHub Release v0.9.0
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { envWithFreshPath, resolveGhExe, runGh } from "./lib/gh-cli.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWin = process.platform === "win32";
const TEST_VERSION = "0.9.0";
const APK_NAME = `Perovo-dev-${TEST_VERSION}.apk`;
const APK_PATH = path.join(ROOT, "releases", APK_NAME);
const RELEASE_TAG = `v${TEST_VERSION}`;

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
  for (const root of [
    "C:\\Program Files\\Microsoft",
    "C:\\Program Files\\Java",
    "C:\\Program Files\\Android\\Android Studio\\jbr",
  ]) {
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
      /* ignore */
    }
  }
  return [...new Set(found)];
}

function resolveJdkHome() {
  const ranked = discoverJdkCandidates()
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

function assertGhReady() {
  const gh = resolveGhExe();
  if (gh !== "gh" && !fs.existsSync(gh)) {
    console.error("\n✗ GitHub CLI (gh) not found.");
    process.exit(1);
  }
  const auth = runGh(["auth", "status"], { stdio: "pipe" });
  if (auth.status !== 0) {
    console.error("\n✗ gh not logged in. Run: gh auth login");
    process.exit(1);
  }
}

function publishRelease() {
  if (!fs.existsSync(APK_PATH)) {
    console.error(`APK missing: ${APK_PATH}\nRun: npm run apk:update-test`);
    process.exit(1);
  }
  assertGhReady();
  const notes = [
    "Update test shell — one screen with an **Update app** button only.",
    "",
    "1. Install this APK on Android",
    "2. Deploy a newer build to GitHub Pages (`npm run ship`)",
    "3. Tap **Update app** — the shell should load the live web build",
    "",
    `Version baked in: \`${TEST_VERSION}\``,
  ].join("\n");

  const upload = runGh(["release", "upload", RELEASE_TAG, APK_PATH, "--clobber"], { stdio: "pipe" });
  if (upload.status === 0) {
    console.log(`\n✓ Updated existing release ${RELEASE_TAG}`);
    return;
  }

  runGh([
    "release",
    "create",
    RELEASE_TAG,
    APK_PATH,
    "--title",
    `Perovo update test shell ${TEST_VERSION}`,
    "--notes",
    notes,
  ]);
  console.log(`\n✓ Published release ${RELEASE_TAG}`);
}

const publishOnly = process.argv.includes("--publish");

console.log(`Perovo — update test shell APK (${TEST_VERSION})\n`);

if (!publishOnly) {
  run("Production web build (update test shell)", "npm", ["run", "build"], {
    env: {
      ...process.env,
      VITE_BASE_PATH: "/",
      VITE_EMBEDDED_APP: "1",
      VITE_UPDATE_TEST_SHELL: "1",
      VITE_APP_VERSION: TEST_VERSION,
    },
  });

  const distDir = path.join(ROOT, "dist");
  const builtHtml = path.join(distDir, "update-test.html");
  const capIndex = path.join(distDir, "index.html");
  if (fs.existsSync(builtHtml)) {
    fs.copyFileSync(builtHtml, capIndex);
  } else {
    console.error("Expected dist/update-test.html after minimal build.");
    process.exit(1);
  }

  const assetsDir = path.join(distDir, "assets");
  if (fs.existsSync(assetsDir)) {
    const jsBytes = fs
      .readdirSync(assetsDir)
      .filter((f) => f.endsWith(".js"))
      .reduce((sum, f) => sum + fs.statSync(path.join(assetsDir, f)).size, 0);
    console.log(`Web bundle (JS only): ${(jsBytes / 1024 / 1024).toFixed(2)} MB`);
  }

  const androidDir = path.join(ROOT, "android");
  if (!fs.existsSync(androidDir)) {
    run("Capacitor add android", "npx", ["cap", "add", "android"]);
  }

  run("Capacitor sync android", "npx", ["cap", "sync", "android"]);
  run("Sync Android launcher icons", "node", ["scripts/sync-android-icons.mjs"]);
  run("Patch Android permissions", "node", ["scripts/patch-android-manifest.mjs"]);
  run("Patch iOS usage descriptions", "node", ["scripts/patch-ios-info-plist.mjs"]);

  const jdkHome = resolveJdkHome();
  if (jdkHome) {
    process.env.JAVA_HOME = jdkHome;
    console.log(`Using JAVA_HOME=${jdkHome}`);
  }

  if (!hasAndroidSdk()) {
    console.warn("\n⚠ ANDROID_HOME not set — open Android Studio and build manually.");
    process.exit(0);
  }

  const gradlew = path.join(androidDir, isWin ? "gradlew.bat" : "gradlew");
  run("Gradle assembleDebug", gradlew, ["assembleDebug"], {
    cwd: androidDir,
    env: envWithFreshPath({ ...process.env, JAVA_HOME: jdkHome || process.env.JAVA_HOME }),
  });

  const apkSrc = path.join(androidDir, "app", "build", "outputs", "apk", "debug", "app-debug.apk");
  if (!fs.existsSync(apkSrc)) {
    console.error("APK not found at:", apkSrc);
    process.exit(1);
  }

  fs.mkdirSync(path.join(ROOT, "releases"), { recursive: true });
  fs.copyFileSync(apkSrc, APK_PATH);
  const apkMb = (fs.statSync(APK_PATH).size / 1024 / 1024).toFixed(2);
  console.log(`\n✓ Update test APK ready (${apkMb} MB):\n  ${APK_PATH}\n`);
  console.log("Re-publish: npm run apk:update-test:publish");
}

if (publishOnly || process.argv.includes("--publish-after")) {
  publishRelease();
}