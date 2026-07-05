#!/usr/bin/env node
/**
 * Ensure AndroidManifest.xml declares runtime permissions for camera, gallery, location, notifications.
 * Sync android/app/build.gradle versionName with package.json.
 * android/ is gitignored — run after every `cap sync` in APK build scripts.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(ROOT, "android/app/src/main/AndroidManifest.xml");

const PERMISSION_LINES = [
  '<uses-permission android:name="android.permission.INTERNET" />',
  '<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />',
  '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
  '<uses-permission android:name="android.permission.CAMERA" />',
  '<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />',
  '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />',
  '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="28" />',
  '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
  '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
  '<uses-permission android:name="android.permission.VIBRATE" />',
  '<uses-permission android:name="android.permission.WAKE_LOCK" />',
  '<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />',
  '<uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />',
  '<uses-permission android:name="android.permission.USE_EXACT_ALARM" />',
];

function patchManifestPermissions() {
  if (!fs.existsSync(manifestPath)) {
    console.log("patch-android-manifest: android/ not present — skip permissions");
    return;
  }

  let xml = fs.readFileSync(manifestPath, "utf8");
  const missing = PERMISSION_LINES.filter((line) => {
    const permName = line.match(/android:name="([^"]+)"/)?.[1];
    return permName && !xml.includes(permName);
  });

  if (!missing.length) {
    console.log("patch-android-manifest: permissions already present");
    return;
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
  console.log("patch-android-manifest: added missing Android permissions");
}

function patchGradleVersion() {
  const gradlePath = path.join(ROOT, "android/app/build.gradle");
  if (!fs.existsSync(gradlePath)) {
    console.log("patch-android-manifest: build.gradle not present — skip version sync");
    return;
  }

  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  const version = process.env.VITE_APP_VERSION || pkg.version;
  let gradle = fs.readFileSync(gradlePath, "utf8");

  if (!/versionName\s+"[^"]*"/.test(gradle)) {
    console.warn("patch-android-manifest: versionName not found in build.gradle");
    return;
  }

  gradle = gradle.replace(/versionName\s+"[^"]*"/, `versionName "${version}"`);
  fs.writeFileSync(gradlePath, gradle);
  console.log(`patch-android-manifest: versionName set to ${version}`);
}

patchManifestPermissions();
patchGradleVersion();
