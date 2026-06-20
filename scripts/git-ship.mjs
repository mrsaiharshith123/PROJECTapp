#!/usr/bin/env node
/**
 * Ship: commit, push, build dev APK, attach to GitHub Release (latest).
 *
 *   npm run ship -- "Describe what changed"
 *   npm run ship -- --no-apk "Docs only — skip APK build and release"
 *
 * Requires: git, gh auth login, JDK 21 + Android SDK for APK (skipped with --no-apk).
 * Download URL (web landing): …/releases/latest/download/Perovo-dev-latest.apk
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APK_PATH = path.join(ROOT, "releases", "Perovo-dev-latest.apk");

const rawArgs = process.argv.slice(2);
const noApk = rawArgs.includes("--no-apk");
const message = rawArgs.filter((a) => a !== "--no-apk").join(" ").trim();

if (!message) {
  console.error("Missing commit message.\n");
  console.error('  npm run ship -- "Describe what changed"');
  console.error('  npm run ship -- --no-apk "Docs only"\n');
  process.exit(1);
}

function run(label, command, args, opts = {}) {
  console.log(`\n▶ ${label}`);
  const r = spawnSync(command, args, {
    cwd: opts.cwd || ROOT,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...opts.env },
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

function git(args) {
  run(`git ${args[0]}`, "git", args);
}

function assertGhReady() {
  const which = spawnSync("where", ["gh"], { encoding: "utf8", shell: true });
  if (which.status !== 0) {
    console.error("\n✗ GitHub CLI (gh) not found — needed to attach APK to Releases.");
    console.error("  Install: winget install GitHub.cli");
    console.error("  Then:    gh auth login");
    process.exit(1);
  }
  const auth = spawnSync("gh", ["auth", "status"], { encoding: "utf8", shell: true });
  if (auth.status !== 0) {
    console.error("\n✗ gh not logged in. Run: gh auth login");
    process.exit(1);
  }
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

  run("GitHub Release (latest + APK)", "gh", [
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
  const r = spawnSync(
    "gh",
    ["repo", "view", "--json", "nameWithOwner", "-q", ".nameWithOwner"],
    { encoding: "utf8", shell: process.platform === "win32" },
  );
  return (r.stdout || "").trim() || "mrsaiharshith123/PROJECTapp";
}

console.log("Perovo — ship (commit → push → APK → GitHub Release)\n");

git(["add", "-A"]);
git(["status", "--short"]);
git(["commit", "-m", message]);

const branch = getBranch();
if (!branch) {
  console.error("Could not read current branch name.");
  process.exit(1);
}

git(["push", "-u", "origin", branch]);

if (noApk) {
  console.log("\n✓ Pushed (--no-apk: skipped APK build and GitHub Release).");
  process.exit(0);
}

run("Build developer APK", "npm", ["run", "apk:dev"]);
publishApkRelease();

console.log("\n✓ Ship complete.");
console.log("  GitHub Pages will redeploy from the push (if Actions is enabled).");
console.log(`  APK: https://github.com/${repoSlug()}/releases/latest/download/Perovo-dev-latest.apk`);
