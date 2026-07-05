/**
 * Upload Firebase service account JSON to Supabase Edge Function secrets.
 * 1. Save your downloaded Firebase JSON as .secrets/fcm-service-account.json
 * 2. npm run secrets:fcm
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const secretsDir = join(root, ".secrets");
const jsonPath = join(secretsDir, "fcm-service-account.json");
const envPath = join(secretsDir, "fcm-secret.env");

mkdirSync(secretsDir, { recursive: true });

let raw;
try {
  raw = readFileSync(jsonPath, "utf8");
} catch {
  console.error(`Missing ${jsonPath}`);
  console.error("Download from Firebase Console → Project settings → Service accounts → Generate new private key");
  process.exit(1);
}

let parsed;
try {
  parsed = JSON.parse(raw);
} catch {
  console.error("Invalid JSON in fcm-service-account.json");
  process.exit(1);
}

if (!parsed.private_key || !parsed.client_email || !parsed.project_id) {
  console.error("File does not look like a Firebase service account JSON");
  process.exit(1);
}

const minified = JSON.stringify(parsed);
writeFileSync(envPath, `FCM_SERVICE_ACCOUNT_JSON=${JSON.stringify(minified)}\n`, "utf8");

console.log("Setting FCM_SERVICE_ACCOUNT_JSON on linked Supabase project…");
// npx + shell: Windows npm scripts don't resolve supabase.cmd via execFileSync("supabase")
execSync(`npx supabase secrets set --env-file "${envPath.replace(/\\/g, "/")}"`, {
  cwd: root,
  stdio: "inherit",
  shell: true,
});

console.log("Done. Deploy: supabase functions deploy send-broadcast-push");
