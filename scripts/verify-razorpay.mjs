#!/usr/bin/env node
/**
 * Razorpay readiness check (no secrets printed).
 * Run: node scripts/verify-razorpay.mjs
 */
import "./loadDotEnv.mjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function mask(key) {
  if (!key) return "(missing)";
  if (key.length < 12) return "(set, too short)";
  return `${key.slice(0, 8)}…${key.slice(-4)}`;
}

const keyId = String(process.env.VITE_RAZORPAY_KEY_ID ?? "").trim();
const supabaseUrl = String(process.env.VITE_SUPABASE_URL ?? "").trim();
const edgeFn = path.join(ROOT, "supabase/functions/razorpay-checkout/index.ts");

console.log("\n── Razorpay readiness ──\n");
console.log(`Client key (VITE_RAZORPAY_KEY_ID): ${mask(keyId)}`);
console.log(`  test mode: ${keyId.startsWith("rzp_test_")}`);
console.log(`  live mode: ${keyId.startsWith("rzp_live_")}`);
console.log(`  configured: ${Boolean(keyId && !keyId.includes("xxxx") && (keyId.startsWith("rzp_test_") || keyId.startsWith("rzp_live_")))}`);
console.log(`Supabase URL: ${supabaseUrl ? "set" : "(missing)"}`);
console.log(`Edge function: ${fs.existsSync(edgeFn) ? "razorpay-checkout present" : "MISSING"}`);

console.log("\n── Manual test checklist ──\n");
console.log("1. Add rzp_test_ key to .env → restart npm run dev");
console.log("2. Deploy edge fn: npx supabase functions deploy razorpay-checkout");
console.log("3. Set Supabase secrets: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET");
console.log("4. Profile → Plans → Upgrade to Pro");
console.log("5. Test card: 4111 1111 1111 1111 · any future expiry · any CVV");
console.log("6. Abandon flow: close modal → tier stays Free, no crash");
console.log("7. Block supabase.co → clear error message (not blank screen)\n");
