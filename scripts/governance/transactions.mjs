#!/usr/bin/env node
/**
 * Transaction intelligence governance audit.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  TRANSACTION_INTEL_PRODUCERS,
  MERCHANT_PARSER_PATHS,
  TRANSACTION_CATEGORY_PATHS,
} from "../../src/governance/registries/transactions.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");
const SRC = path.join(ROOT, "src");

/** @returns {{ id: string, title: string, errors: object[], warnings: object[], advisories: object[] }} */
export function runTransactionsAudit() {
  const errors = [];
  const warnings = [];

  function checkPath(rel) {
    const full = path.join(SRC, rel);
    if (!fs.existsSync(full)) {
      errors.push({ message: `Missing registry path: ${rel}` });
    }
  }

  for (const p of TRANSACTION_INTEL_PRODUCERS) checkPath(p.path);
  for (const p of MERCHANT_PARSER_PATHS) checkPath(p);
  for (const p of TRANSACTION_CATEGORY_PATHS) checkPath(p);

  const merchantFile = path.join(SRC, "utils/merchantNormalize.js");
  if (fs.existsSync(merchantFile)) {
    const text = fs.readFileSync(merchantFile, "utf8");
    const classifyCount = (text.match(/export function classifyMerchant/g) || []).length;
    if (classifyCount !== 1) {
      errors.push({ message: `Expected one classifyMerchant export, found ${classifyCount}` });
    }
  }

  const serviceFile = path.join(SRC, "services/transactions/index.js");
  if (!fs.existsSync(serviceFile)) {
    errors.push({ message: "Missing centralized services/transactions/index.js" });
  }

  return {
    id: "transactions",
    title: "Transaction intelligence layer",
    errors,
    warnings,
    advisories: [],
  };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const r = runTransactionsAudit();
  if (r.errors.length) {
    console.error(r.errors.map((e) => e.message).join("\n"));
    process.exit(1);
  }
  console.log("Transaction governance: OK");
}
