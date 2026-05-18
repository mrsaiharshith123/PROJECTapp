#!/usr/bin/env node
/**
 * Stage everything, commit with your message, push current branch to origin.
 *
 * One command (from repo root):
 *   npm run git:ship -- "Your commit message here"
 *
 * Equivalent manual steps:
 *   git add -A
 *   git status
 *   git commit -m "Your commit message here"
 *   git push -u origin $(git rev-parse --abbrev-ref HEAD)
 */
import { spawnSync } from "node:child_process";
import process from "node:process";

const message = process.argv.slice(2).join(" ").trim();

if (!message) {
  console.error("Missing commit message.\n");
  console.error('  npm run git:ship -- "Describe what changed"\n');
  process.exit(1);
}

function git(args) {
  const r = spawnSync("git", args, { stdio: "inherit", encoding: "utf8" });
  if (r.error) {
    console.error(r.error.message);
    process.exit(1);
  }
  if (r.status !== 0) process.exit(r.status ?? 1);
}

git(["add", "-A"]);
git(["status", "--short"]);
git(["commit", "-m", message]);

const branchResult = spawnSync("git", ["rev-parse", "--abbrev-ref", "HEAD"], { encoding: "utf8" });
const branch = (branchResult.stdout || "").trim();
if (!branch) {
  console.error("Could not read current branch name.");
  process.exit(1);
}

git(["push", "-u", "origin", branch]);
