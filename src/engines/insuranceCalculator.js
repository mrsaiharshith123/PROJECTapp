import { differenceInCalendarMonths, parseISO } from "date-fns";
import {
  normalizePremiumFrequency,
  paymentsPerYearForFrequency,
  premiumFrequencyLabel,
  repeatTypeToPremiumFrequency,
} from "../constants/insurance.js";
function estimateTermYearsFromBill(bill) {
  if (bill.startDate && bill.endDate) {
    try {
      const months = differenceInCalendarMonths(
        parseISO(`${bill.endDate}T12:00:00`),
        parseISO(`${bill.startDate}T12:00:00`)
      );
      return Math.max(1, Math.round(months / 12));
    } catch {
      /* fall through */
    }
  }
  return 15;
}
import { totalPaidOnPayments } from "../utils/commitmentPayments.js";

/**
 * Build projection for a life / general insurance style policy.
 * @param {object} params
 */
export function simulateInsurancePolicy(params) {
  const premiumAmount = Math.max(0, Number(params.premiumAmount) || 0);
  const freq = normalizePremiumFrequency(params.premiumFrequency);
  const termYears = Math.max(1, Math.floor(Number(params.termYears) || 1));
  const sumAssured = Math.max(0, Number(params.sumAssured) || 0);
  const maturityBenefit = Math.max(0, Number(params.maturityBenefit) || 0);
  const payout = maturityBenefit > 0 ? maturityBenefit : sumAssured;

  const ppy = paymentsPerYearForFrequency(freq);
  const isSingle = freq === "single";
  const totalInstallments = isSingle ? 1 : termYears * Math.max(1, ppy);

  let installmentsPaid = Math.max(0, Math.floor(Number(params.installmentsPaid) || 0));
  if (installmentsPaid === 0 && params.startDate && params.todayStr) {
    try {
      const months = differenceInCalendarMonths(
        parseISO(`${params.todayStr}T12:00:00`),
        parseISO(`${params.startDate}T12:00:00`)
      );
      const yearsElapsed = Math.max(0, months / 12);
      installmentsPaid = isSingle
        ? premiumAmount > 0
          ? 1
          : 0
        : Math.min(totalInstallments, Math.floor(yearsElapsed * Math.max(1, ppy)));
    } catch {
      installmentsPaid = 0;
    }
  }

  if (params.recordedPremiumsPaid != null) {
    const recorded = Math.max(0, Number(params.recordedPremiumsPaid) || 0);
    if (premiumAmount > 0 && !isSingle) {
      installmentsPaid = Math.min(totalInstallments, Math.round(recorded / premiumAmount));
    } else if (isSingle && recorded >= premiumAmount && premiumAmount > 0) {
      installmentsPaid = 1;
    }
  }

  installmentsPaid = Math.min(totalInstallments, installmentsPaid);
  const installmentsRemaining = Math.max(0, totalInstallments - installmentsPaid);

  const totalPremiumsPaid = isSingle
    ? installmentsPaid >= 1
      ? premiumAmount
      : 0
    : installmentsPaid * premiumAmount;
  const projectedTotalPremiums = isSingle ? premiumAmount : totalInstallments * premiumAmount;
  const remainingPremiumCost = installmentsRemaining * premiumAmount;

  const yearsPaidApprox = ppy > 0 ? installmentsPaid / ppy : termYears;
  const yearsRemaining = Math.max(0, termYears - yearsPaidApprox);

  const netGainAtMaturity = payout - projectedTotalPremiums;
  const returnMultiple =
    projectedTotalPremiums > 0 ? (payout / projectedTotalPremiums).toFixed(2) : null;

  return {
    premiumAmount,
    premiumFrequency: freq,
    premiumFrequencyLabel: premiumFrequencyLabel(freq),
    termYears,
    sumAssured,
    maturityBenefit: payout,
    totalInstallments,
    installmentsPaid,
    installmentsRemaining,
    totalPremiumsPaid: Math.round(totalPremiumsPaid),
    projectedTotalPremiums: Math.round(projectedTotalPremiums),
    remainingPremiumCost: Math.round(remainingPremiumCost),
    expectedMaturityPayout: Math.round(payout),
    netGainAtMaturity: Math.round(netGainAtMaturity),
    returnMultiple,
    yearsRemaining: Math.round(yearsRemaining * 10) / 10,
    isSingle,
  };
}

const DEFAULT_INFLATION_PCT = 6;

function discountToToday(nominal, yearsFromNow, inflationPct) {
  const r = Math.max(0, Number(inflationPct) || 0) / 100;
  return nominal / Math.pow(1 + r, Math.max(0, yearsFromNow));
}

/**
 * Inflation-aware "was it worth it?" analysis for Tools.
 */
export function analyzeInsuranceWorth(params) {
  const base = simulateInsurancePolicy(params);
  const monthlyIncome = Math.max(0, Number(params.monthlyIncome) || 0);
  const inflationPct = Math.max(0, Math.min(15, Number(params.inflationPct) || DEFAULT_INFLATION_PCT));
  const yearsPaid = base.installmentsPaid / Math.max(1, paymentsPerYearForFrequency(base.premiumFrequency));
  const termYears = base.termYears;
  const yearsToMaturity = Math.max(0, base.yearsRemaining);

  const maturityNominal = base.expectedMaturityPayout;
  const maturityInTodaysMoney = discountToToday(maturityNominal, yearsToMaturity, inflationPct);
  const premiumsInTodaysMoney = discountToToday(base.totalPremiumsPaid, yearsPaid / 2, inflationPct);
  const allPremiumsFutureValue = base.projectedTotalPremiums;
  const allPremiumsToday = discountToToday(allPremiumsFutureValue, termYears / 2, inflationPct);

  const realGainVsPremiums = maturityInTodaysMoney - premiumsInTodaysMoney;
  const realGainVsAllPremiums = maturityInTodaysMoney - allPremiumsToday;
  const nominalGain = maturityNominal - base.projectedTotalPremiums;

  const annualPremium =
    base.premiumAmount * Math.max(1, paymentsPerYearForFrequency(base.premiumFrequency));
  const incomeWhenStarted = monthlyIncome > 0 ? monthlyIncome : null;
  const premiumShareOfIncome =
    incomeWhenStarted && annualPremium > 0
      ? (annualPremium / (incomeWhenStarted * 12)) * 100
      : null;

  let verdict = "neutral";
  let verdictLabel = "Hard to judge without maturity amount";
  let verdictDetail =
    "Add expected maturity payout in the calculator to see if returns beat inflation and premiums.";

  if (maturityNominal > 0) {
    if (realGainVsAllPremiums > base.projectedTotalPremiums * 0.05) {
      verdict = "positive";
      verdictLabel = "Likely worthwhile vs inflation";
      verdictDetail =
        "Maturity (in today’s money) looks above what you’ll pay in premiums, after a simple inflation adjustment.";
    } else if (realGainVsAllPremiums > 0) {
      verdict = "mild";
      verdictLabel = "Modest real return";
      verdictDetail =
        "You may beat inflation slightly, but stress on cashflow could matter — check premium % of salary.";
    } else {
      verdict = "negative";
      verdictLabel = "Premiums may outweigh real return";
      verdictDetail =
        "After inflation, maturity may not cover all premiums — protection value still matters for sum assured.";
    }
  }

  if (premiumShareOfIncome != null && premiumShareOfIncome > 15) {
    verdictDetail += ` Premiums use about ${premiumShareOfIncome.toFixed(1)}% of annual income — that can feel heavy.`;
  }

  return {
    ...base,
    inflationPct,
    yearsPaid: Math.round(yearsPaid * 10) / 10,
    yearsToMaturity: Math.round(yearsToMaturity * 10) / 10,
    maturityInTodaysMoney: Math.round(maturityInTodaysMoney),
    premiumsPaidInTodaysMoney: Math.round(premiumsInTodaysMoney),
    realGainVsPremiumsPaid: Math.round(realGainVsPremiums),
    realGainVsAllPremiums: Math.round(realGainVsAllPremiums),
    nominalGainAtMaturity: Math.round(nominalGain),
    premiumShareOfIncome:
      premiumShareOfIncome != null ? Math.round(premiumShareOfIncome * 10) / 10 : null,
    monthlyIncomeWhenStarted: incomeWhenStarted,
    verdict,
    verdictLabel,
    verdictDetail,
  };
}

/** Prefill calculator inputs from a stored insurance bill. */
export function insuranceParamsFromBill(bill, todayStr) {
  const premiumAmount = Number(bill.amount) || 0;
  const recorded = totalPaidOnPayments(bill.payments);
  return {
    policyName: bill.name,
    insurancePolicyId: bill.insurancePolicyId || "",
    insuredPersonName: bill.insuredPersonName || "",
    insuranceCompany: bill.insuranceCompany || "",
    premiumAmount,
    premiumFrequency: repeatTypeToPremiumFrequency(bill.repeatType),
    repeatLabel: bill.repeatType,
    termYears: estimateTermYearsFromBill(bill),
    sumAssured: 0,
    maturityBenefit: 0,
    startDate: bill.startDate || bill.dueDate,
    todayStr,
    recordedPremiumsPaid: recorded,
  };
}
