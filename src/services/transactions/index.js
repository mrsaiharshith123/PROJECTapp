/**
 * Central transaction service — single import surface for parsers, storage helpers, and intel.
 */
export { classifyMerchant, normalizeMerchantKey, groupCommitmentsByMerchant } from "../../utils/merchantNormalize.js";
export { lifeCategoryForBillCategory, TRANSACTION_LIFE_CATEGORIES } from "../../constants/transactionCategories.js";
export {
  buildTransactionInsights,
  buildTransactionLifeFeed,
  transactionInsightsForMerge,
} from "../../engines/transactionIntel.js";
