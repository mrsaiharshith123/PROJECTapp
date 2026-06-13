import { combinedMonthlyIncome } from "../utils/combinedIncome.js";
import { totalMonthlyBurden } from "./burden.js";
import { deriveTaxDeductionsFromCommitments } from "./incomeTaxEstimate.js";

/**
 * Structured CA-ready financial summary (JSON).
 * @param {{
 *   commitments?: object[],
 *   lendings?: object[],
 *   goals?: object[],
 *   settings?: { displayName?: string, incomeEntryBasis?: string, userCity?: string, liquidSavings?: number, monthlyIncome?: number },
 *   wealth?: { netWorth?: number, liquidTotal?: number, debtTotal?: number } | null,
 *   getEffectiveStatus?: (c: object) => string,
 *   getEffectiveLendingStatus?: (l: object, todayStr?: string) => string,
 *   todayStr?: string,
 * }} params
 */
export function buildCaSummarySnapshot({
  commitments = [],
  lendings = [],
  goals = [],
  settings = {},
  wealth = null,
  getEffectiveStatus = () => "pending",
  getEffectiveLendingStatus = () => "pending",
  todayStr = "",
}) {
  const income = combinedMonthlyIncome(settings);
  const burden = totalMonthlyBurden(commitments, getEffectiveStatus);
  const taxDeductions = deriveTaxDeductionsFromCommitments(commitments, getEffectiveStatus);

  const emis = commitments
    .filter((c) => ["EMI", "Loan", "Credit Card"].includes(c.category))
    .map((c) => ({
      name: c.name,
      category: c.category,
      monthly: Number(c.amount) || 0,
      remaining: Number(c.remainingAmount) || 0,
      status: getEffectiveStatus(c),
    }));

  const investments = commitments
    .filter((c) => c.category === "SIP" || c.category === "Insurance")
    .map((c) => ({
      name: c.name,
      category: c.category,
      monthly: Number(c.amount) || 0,
    }));

  const lendingRows = (lendings || []).map((l) => ({
    person: l.personName,
    principal: Number(l.principalAmount) || 0,
    remaining: Number(l.remainingAmount) || 0,
    status: getEffectiveLendingStatus(l, todayStr),
  }));

  const goalRows = (goals || [])
    .filter((g) => !g.archived)
    .map((g) => ({
      title: g.title,
      type: g.type,
      target: g.targetAmount || g.targetReduction || g.targetRatio,
      saved: Number(g.savedAmount) || 0,
    }));

  return {
    generatedAt: todayStr || new Date().toISOString().slice(0, 10),
    taxpayer: {
      displayName: settings.displayName || "",
      monthlyIncome: income,
      incomeBasis: settings.incomeEntryBasis || "take_home",
      city: settings.userCity || "",
    },
    cashflow: {
      monthlyIncome: income,
      monthlyBurden: burden,
      freeCash: Math.max(0, income - burden),
      liquidSavings: Number(settings.liquidSavings) || 0,
    },
    tax: taxDeductions,
    emis,
    investments,
    lending: lendingRows,
    goals: goalRows,
    netWorth: wealth
      ? {
          total: wealth.netWorth,
          liquid: wealth.liquidTotal,
          debt: wealth.debtTotal,
        }
      : null,
    disclaimer: "Educational summary — verify with a qualified CA before filing.",
  };
}

/**
 * @param {ReturnType<typeof buildCaSummarySnapshot>} data
 */
export function formatCaSummaryPlainText(data) {
  const lines = [
    "PEROVO — CA SUMMARY",
    `Generated: ${data.generatedAt}`,
    "",
    `Taxpayer: ${data.taxpayer.displayName || "—"}`,
    `Monthly income: ₹${data.cashflow.monthlyIncome.toLocaleString("en-IN")}`,
    `Monthly obligations: ₹${data.cashflow.monthlyBurden.toLocaleString("en-IN")}`,
    `Free cash: ₹${data.cashflow.freeCash.toLocaleString("en-IN")}`,
    `Liquid savings: ₹${data.cashflow.liquidSavings.toLocaleString("en-IN")}`,
    "",
    "EMIs / loans:",
    ...data.emis.map(
      (e) => `  • ${e.name} — ₹${e.monthly.toLocaleString("en-IN")}/mo, remaining ₹${e.remaining.toLocaleString("en-IN")}`,
    ),
    "",
    "Investments / SIP:",
    ...data.investments.map((e) => `  • ${e.name} — ₹${e.monthly.toLocaleString("en-IN")}/mo`),
    "",
    "Lending:",
    ...data.lending.map(
      (l) => `  • ${l.person} — ₹${l.remaining.toLocaleString("en-IN")} remaining (${l.status})`,
    ),
    "",
    "Goals:",
    ...data.goals.map((g) => `  • ${g.title} — saved ₹${g.saved.toLocaleString("en-IN")}`),
    "",
    data.disclaimer,
  ];
  return lines.join("\n");
}
