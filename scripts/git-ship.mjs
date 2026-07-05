#!/usr/bin/env node
/**
 * Ship: commit, push, build dev APK, attach to GitHub Release (latest).
 *
 *   npm run ship -- "Describe what changed"
 *   npm run ship -- --no-apk "Docs only — skip APK build and release"
 *   npm run ship -- --release-only "Upload APK to GitHub Releases (no git commit)"
 *
 * Requires: git, gh auth login, JDK 21 + Android SDK for APK (skipped with --no-apk).
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { envWithFreshPath, resolveGhExe, runGh } from "./lib/gh-cli.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APK_PATH = path.join(ROOT, "releases", "Perovo-dev-latest.apk");

const rawArgs = process.argv.slice(2);
const noApk = rawArgs.includes("--no-apk");
const releaseOnly = rawArgs.includes("--release-only");
const message = rawArgs.filter((a) => a !== "--no-apk" && a !== "--release-only").join(" ").trim();

if (!releaseOnly && !message) {
  console.error("Missing commit message.\n");
  console.error('  npm run ship -- "Describe what changed"');
  console.error('  npm run ship -- --no-apk "Docs only"');
  console.error('  npm run ship -- --release-only\n');
  process.exit(1);
}

function run(label, command, args, opts = {}) {
  console.log(`\n▶ ${label}`);
  const r = spawnSync(command, args, {
    cwd: opts.cwd || ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: envWithFreshPath({ ...process.env, ...opts.env }),
  });
  if (r.error) {
    console.error(r.error.message);
    process.exit(1);
  }
  if (r.status !== 0) {
    console.error(`\n✗ Failed: ${label}`);
    process.exit(r.status ?? 1);
  }
}

function git(args, extraEnv = {}) {
  console.log(`\n▶ git ${args[0]}`);
  const r = spawnSync("git", args, {
    cwd: ROOT,
    stdio: "inherit",
    shell: false,
    env: envWithFreshPath({ ...process.env, ...extraEnv }),
  });
  if (r.error) {
    console.error(r.error.message);
    process.exit(1);
  }
  if (r.status !== 0) {
    console.error(`\n✗ Failed: git ${args[0]}`);
    process.exit(r.status ?? 1);
  }
}

function assertGhReady() {
  const gh = resolveGhExe();
  if (gh !== "gh" && !fs.existsSync(gh)) {
    console.error("\n✗ GitHub CLI (gh) not found — needed to attach APK to Releases.");
    console.error("  Install: winget install GitHub.cli");
    console.error("  Then:    gh auth login");
    process.exit(1);
  }
  const auth = runGh(["auth", "status"], { stdio: "pipe" });
  if (auth.status !== 0) {
    console.error("\n✗ gh not logged in. Run: gh auth login");
    process.exit(1);
  }
  console.log(`Using gh: ${gh}`);
}

function publishApkRelease() {
  if (!fs.existsSync(APK_PATH)) {
    console.error(`APK missing: ${APK_PATH}`);
    process.exit(1);
  }

  assertGhReady();

  const stamp = new Date().toISOString().slice(0, 10);
  const tag = `dev-${stamp}-${Date.now()}`;
  const title = `Perovo dev APK ${stamp}`;
  const notes = [
    "Developer sideload build (Capacitor, offline bundle).",
    "",
    "1. Download **Perovo-dev-latest.apk** below",
    "2. On Android: allow install from your browser or file manager",
    "3. Open Perovo — data stays on your device",
    "",
    `Built from \`${getBranch()}\` on ${new Date().toISOString()}.`,
  ].join("\n");

  runGh([
    "release",
    "create",
    tag,
    APK_PATH,
    "--title",
    title,
    "--notes",
    notes,
    "--latest",
  ]);
}

function getBranch() {
  const r = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { encoding: "utf8" });
  return (r.stdout || "main").trim();
}

function repoSlug() {
  const r = runGh(["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"], { stdio: "pipe" });
  return (r.stdout || "").trim() || "mrsaiharshith123/PROJECTapp";
}

console.log("Perovo — ship (APK → commit → push → GitHub Release)\n");

// Build first so public/app-version.json (version + builtAt + apkSize) is included in the git push.
if (!noApk) {
  if (releaseOnly && fs.existsSync(APK_PATH)) {
    console.log(`\n▶ Using existing APK: ${APK_PATH}`);
  } else {
    run("Build developer APK", "npm", ["run", "apk:dev"]);
  }
  run("Refresh app-version.json", "node", ["scripts/generate-app-version.mjs"]);
} else {
  run("Refresh app-version.json", "node", ["scripts/generate-app-version.mjs"]);
}

if (!releaseOnly) {
  git(["add", "-A"]);
  git(["status", "--short"]);
  // Skip auto-gc after commit — OneDrive locks .git/objects on Windows and prompts interactively.
  git(["-c", "gc.auto=0", "commit", "-m", message]);

  const branch = getBranch();
  if (!branch) {
    console.error("Could not read current branch name.");
    process.exit(1);
  }

  git(["push", "-u", "origin", branch]);
}

if (noApk) {
  console.log("\n✓ Done (--no-apk: skipped GitHub Release).");
  process.exit(0);
}

publishApkRelease();

console.log("\n✓ Ship complete.");
if (!releaseOnly) {
  console.log("  GitHub Pages will redeploy from the push (if Actions is enabled).");
}
console.log(`  APK: https://github.com/${repoSlug()}/releases/latest/download/Perovo-dev-latest.apk`);
