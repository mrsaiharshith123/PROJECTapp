#!/usr/bin/env node
/**
 * Sync android/app/build.gradle versionName with package.json before APK builds.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
const version = process.env.VITE_APP_VERSION || pkg.version;

const gradlePath = path.join(ROOT, "android/app/build.gradle");
if (!fs.existsSync(gradlePath)) {
  console.warn("patch-android-version: build.gradle not found — skipping");
  process.exit(0);
}

let gradle = fs.readFileSync(gradlePath, "utf8");
const prev = (gradle.match(/versionName\s+"([^"]+)"/) || [])[1];
if (!/versionName\s+"[^"]*"/.test(gradle)) {
  console.warn("patch-android-version: versionName not found in build.gradle");
  process.exit(0);
}

gradle = gradle.replace(/versionName\s+"[^"]*"/, `versionName "${version}"`);
fs.writeFileSync(gradlePath, gradle);
console.log(`patch-android-version: ${prev ?? "??"} → ${version}`);
