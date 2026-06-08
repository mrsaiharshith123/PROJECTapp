import { freeMoneyAfterBurden } from "./pressureScore.js";
import { simulateNewExpense } from "./expenseSimulator.js";
import { computeSurvivalAnalysis } from "./survival.js";
import { totalMonthlyBurden } from "./burden.js";

/**
 * Read-only stress checks — same engines as the afford tool, batched for the dashboard.
 * @param {{ primaryIncome: number, secondaryMonthlyIncome?: number, commitments: object[], getEffectiveStatus: Function, liquidSavings: number, mode?: string }} opts
 */
export function buildQuickScenarioSummaries({
  primaryIncome,
  secondaryMonthlyIncome = 0,
  commitments,
  getEffectiveStatus,
  liquidSavings,
  mode = "salaried",
}) {
  const primary = Math.max(0, Number(primaryIncome) || 0);
  const secondary = Math.max(0, Number(secondaryMonthlyIncome) || 0);
  const combined = primary + secondary;
  const cashCombined = freeMoneyAfterBurden(commitments, combined, getEffectiveStatus);
  const burden = totalMonthlyBurden(commitments, getEffectiveStatus);

  const rows = [];

  if (combined > 0) {
    const job = simulateNewExpense({
      income: combined,
      commitments,
      getEffectiveStatus,
      liquidSavings,
      freeMoney: cashCombined.freeMoney,
      amount: 1,
      preset: "job_loss",
      mode,
    });
    const beforeMo = job.beforeSurvival?.survivalMonths;
    const afterMo = job.afterSurvival?.survivalMonths;
    const cap = (m) => (m != null && Number.isFinite(m) ? Math.min(99, Math.round(m * 10) / 10) : null);
    const afterDisplay = cap(afterMo);
    const beforeDisplay = cap(beforeMo);
    rows.push({
      id: "job_loss",
      label: "Job loss (income → 0)",
      headline: job.affordability?.label || "—",
      detail:
        afterDisplay != null && beforeDisplay != null
          ? `Runway ~${afterDisplay} mo with no income (was ~${beforeDisplay} mo while employed).`
          : "Models zero income against your current bills and savings.",
    });
  }

  if (secondary > 0) {
    const without2 = freeMoneyAfterBurden(commitments, primary, getEffectiveStatus);
    rows.push({
      id: "lose_secondary",
      label: "Second income stops",
      headline: without2.freeMoney >= 0 ? "Limited but positive free cash" : "Free cash may go negative",
      detail: `Free after dues: ~₹${Math.round(without2.freeMoney).toLocaleString("en-IN")}/mo (primary income only)`,
    });
  }

  const incForSim = combined > 0 ? combined : primary;

  if (incForSim > 0) {
    const fee = simulateNewExpense({
      income: incForSim,
      commitments,
      getEffectiveStatus,
      liquidSavings,
      freeMoney: cashCombined.freeMoney,
      amount: 15000,
      preset: "child",
      mode,
    });
    rows.push({
      id: "fee_hike",
      label: "+₹15k/mo extra cost",
      headline: fee.affordability?.label || "—",
      detail: `Free cash after: ~₹${Math.round(fee.affordability?.freeMoneyAfter ?? 0).toLocaleString("en-IN")}/mo`,
    });

    const med = simulateNewExpense({
      income: incForSim,
      commitments,
      getEffectiveStatus,
      liquidSavings,
      freeMoney: cashCombined.freeMoney,
      amount: 50000,
      preset: "purchase",
      mode,
    });
    rows.push({
      id: "lump_shock",
      label: "One-off ₹50k shock",
      headline: med.affordability?.label || "—",
      detail: `Free cash after: ~₹${Math.round(med.affordability?.freeMoneyAfter ?? 0).toLocaleString("en-IN")}/mo`,
    });
  }

  const before = computeSurvivalAnalysis({
    income: combined > 0 ? combined : primary,
    freeMoney: cashCombined.freeMoney,
    liquidSavings,
    monthlyBurden: burden,
  });

  return {
    baselineFree: Math.round(cashCombined.freeMoney),
    survivalMonths: before.survivalMonths,
    rows,
  };
}
