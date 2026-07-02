#!/usr/bin/env node
import fs from "fs";

const SRC = "src/utils/migrateStorage.js";
const lines = fs.readFileSync(SRC, "utf8").split(/\r?\n/);

const normStart = lines.findIndex((l) => l.startsWith("function normalizeCategory"));
const normEnd = lines.findIndex((l) => l.startsWith("export function loadCommitmentsFromStorage"));
const goalStart = lines.findIndex((l) => l.startsWith("export function normalizeGoal"));
const settingsStart = lines.findIndex((l) => l.startsWith("export function loadSettingsFromStorage"));

const normImports = `import { inferPriorityFromCategory } from "../constants/priority.js";
import { CATEGORIES } from "../constants/categories.js";
import { USER_MODE_IDS, REMOVED_USER_MODE_IDS } from "../constants/userModes.js";
import { enrichLendingFinancials } from "./lendingFinancials.js";
import { computeContractPaymentLedger } from "./billPaymentProgress.js";
import { currentCycleRemainingAmount } from "./commitmentPayments.js";
import { todayYmd } from "./dates.js";
import { refreshAllChitCommitments } from "./chitSync.js";
import { normalizeRepeatType } from "../constants/repeatTypes.js";
import { normalizePremiumFrequency } from "../constants/insurance.js";
import { normalizeDashboardToolOrderByMode } from "./dashboardToolOrder.js";
import { normalizeHomeQuickActionOrder } from "./homeQuickActionOrder.js";
import { normalizeDailySpend } from "./dailySpends.js";
import { normalizeAppLanguage } from "../i18n/languages.js";
import { resolveAccountCreatedAt } from "./accountOrigin.js";

const CATEGORY_IDS = new Set(CATEGORIES.map((c) => c.id));

`;

const normBody =
  lines.slice(normStart, normEnd).join("\n") +
  "\n\n" +
  lines.slice(goalStart, settingsStart).join("\n") +
  "\n";

fs.mkdirSync("src/utils/migrate", { recursive: true });
fs.writeFileSync("src/utils/migrate/normalizers.js", normImports + normBody);

const storageImports = lines.slice(0, 22).join("\n");
const storageTail =
  `import {\n  normalizeCommitment,\n  normalizeLending,\n  normalizeGoal,\n  normalizeProfiles,\n} from "./migrate/normalizers.js";\n\n` +
  lines.slice(normEnd).join("\n");

const cleanedHead = storageImports
  .split("\n")
  .filter(
    (l) =>
      !l.includes("inferPriorityFromCategory") &&
      !l.includes('from "../constants/categories.js"') &&
      !l.includes("userModes.js") &&
      !l.includes("lendingFinancials") &&
      !l.includes("billPaymentProgress") &&
      !l.includes("commitmentPayments") &&
      !l.includes('from "./dates.js"') &&
      !l.includes("chitSync") &&
      !l.includes("repeatTypes") &&
      !l.includes("insurance.js") &&
      !l.includes("dashboardToolOrder") &&
      !l.includes("homeQuickActionOrder") &&
      !l.includes("dailySpends.js") &&
      !l.includes("languages.js") &&
      !l.includes("accountOrigin"),
  )
  .join("\n");

fs.writeFileSync(SRC, `${cleanedHead}\n${storageTail}`);
console.log("Split normalizers only; migrateStorage.js kept as loader barrel");
