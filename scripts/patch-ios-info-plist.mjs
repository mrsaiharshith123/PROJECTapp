#!/usr/bin/env node
/**
 * Ensure Info.plist has usage descriptions for camera, photos, location, notifications.
 * ios/ is gitignored — run after every `cap sync` in native build scripts.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const plistPath = path.join(ROOT, "ios/App/App/Info.plist");

/** @type {Record<string, string>} */
const USAGE_KEYS = {
  NSCameraUsageDescription: "Perovo uses the camera to scan bills and receipts.",
  NSPhotoLibraryUsageDescription: "Perovo lets you pick bill images from your photo library.",
  NSPhotoLibraryAddUsageDescription: "Perovo can save scanned bill images to your photo library.",
  NSLocationWhenInUseUsageDescription:
    "Perovo uses your location to pin property addresses on the map.",
  NSLocationAlwaysAndWhenInUseUsageDescription:
    "Perovo uses your location to pin property addresses on the map.",
};

if (!fs.existsSync(plistPath)) {
  console.log("patch-ios-info-plist: ios/ not present — skip");
  process.exit(0);
}

let xml = fs.readFileSync(plistPath, "utf8");
const missing = Object.entries(USAGE_KEYS).filter(([key]) => !xml.includes(`<key>${key}</key>`));

if (!missing.length) {
  console.log("patch-ios-info-plist: usage descriptions already present");
  process.exit(0);
}

const block = missing
  .map(([key, value]) => `\t<key>${key}</key>\n\t<string>${value}</string>`)
  .join("\n");

if (xml.includes("</dict>")) {
  xml = xml.replace("</dict>", `${block}\n</dict>`);
} else {
  console.warn("patch-ios-info-plist: could not find </dict> insertion point");
  process.exit(1);
}

fs.writeFileSync(plistPath, xml);
console.log("patch-ios-info-plist: added camera / photos / location usage descriptions");
