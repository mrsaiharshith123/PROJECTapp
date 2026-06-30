#!/usr/bin/env node
/**
 * Ensure AndroidManifest.xml declares runtime permissions for camera, gallery, notifications.
 * android/ is gitignored — run after every `cap sync` in APK build scripts.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(ROOT, "android/app/src/main/AndroidManifest.xml");

const PERMISSION_LINES = [
  '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
  '<uses-permission android:name="android.permission.CAMERA" />',
  '<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />',
  '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />',
  '<uses-permission android:name="android.permission.VIBRATE" />',
  '<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />',
];

if (!fs.existsSync(manifestPath)) {
  console.log("patch-android-manifest: android/ not present — skip");
  process.exit(0);
}

let xml = fs.readFileSync(manifestPath, "utf8");
const missing = PERMISSION_LINES.filter((line) => {
  const permName = line.match(/android:name="([^"]+)"/)?.[1];
  return permName && !xml.includes(permName);
});

if (!missing.length) {
  console.log("patch-android-manifest: permissions already present");
  process.exit(0);
}

const block = missing.map((line) => `    ${line}`).join("\n");
if (xml.includes("<!-- Permissions -->")) {
  xml = xml.replace("<!-- Permissions -->", `<!-- Permissions -->\n${block}`);
} else if (/<application[\s>]/.test(xml)) {
  xml = xml.replace(/(\s*)<application/, `\n${block}\n$1<application`);
} else {
  console.warn("patch-android-manifest: could not find insertion point");
  process.exit(1);
}

fs.writeFileSync(manifestPath, xml);
console.log("patch-android-manifest: added camera / gallery / notification permissions");
