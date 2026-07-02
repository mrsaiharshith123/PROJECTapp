/**
 * Transaction intelligence registry — engines, parsers, and service surface.
 */

export const TRANSACTION_INTEL_PRODUCERS = [
  { id: "transaction-intel", path: "engines/transactionIntel.js", domain: "behavior" },
  { id: "sms-to-transaction", path: "engines/smsToTransaction.js", domain: "import-prep" },
  { id: "transaction-service", path: "services/transactions/index.js", domain: "service" },
];

export const MERCHANT_PARSER_PATHS = ["utils/merchantNormalize.js"];

export const TRANSACTION_CATEGORY_PATHS = ["constants/transactionCategories.js"];
