import { addMonths, format, parseISO } from "date-fns";
import {
  calculateMonthlyEMI,
  calculateTotalPayableSimple,
  calculateSalaryImpact,
  generateRepaymentSchedule,
  calculateRemainingFromSchedule,
  sumScheduleInterest,
  getNextInstallment,
} from "./repayment/index.js";
import { trustScoreForLendingEntry } from "../engines/lendingTrust.js";

const INTEREST_TYPES = ["simple", "compound"];
const REPAYMENT_TYPES = ["monthly", "weekly", "biweekly", "custom", "lumpsum"];

function inferTermMonths(startDate, endDate) {
  try {
    const s = parseISO(`${String(startDate).slice(0, 10)}T12:00:00`);
    const e = parseISO(`${String(endDate).slice(0, 10)}T12:00:00`);
    return Math.max(1, (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth()) + 1);
  } catch {
    return 12;
  }
}

/**
 * Enrich lending record with repayment fields (backward compatible).
 */
export function enrichLendingFinancials(raw, todayStr = "") {
  const principalAmount = Math.max(0, Number(raw.principalAmount ?? raw.totalAmount) || 0);
  const interestRate = Math.max(0, Math.min(60, Number(raw.interestRate) || 0));
  const interestType = INTEREST_TYPES.includes(raw.interestType) ? raw.interestType : "simple";
  const startDate = String(raw.startDate || raw.dueDate || "").slice(0, 10);
  let endDate = String(raw.endDate || "").slice(0, 10);
  if (!endDate && startDate) {
    try {
      endDate = format(addMonths(parseISO(`${startDate}T12:00:00`), 12), "yyyy-MM-dd");
    } catch {
      endDate = startDate;
    }
  }
  const repaymentFrequency = REPAYMENT_TYPES.includes(raw.repaymentFrequency)
    ? raw.repaymentFrequency
    : raw.repaymentType === "lumpsum"
      ? "lumpsum"
      : "monthly";
  const repaymentType = REPAYMENT_TYPES.includes(raw.repaymentType)
    ? raw.repaymentType
    : repaymentFrequency === "lumpsum"
      ? "lumpsum"
      : "monthly";

  let repaymentSchedule = Array.isArray(raw.repaymentSchedule) ? raw.repaymentSchedule : [];
  if (repaymentSchedule.length === 0 && principalAmount > 0) {
    repaymentSchedule = generateRepaymentSchedule({
      principalAmount,
      interestRate,
      interestType,
      startDate,
      endDate,
      repaymentFrequency,
      repaymentType,
      todayStr,
    });
  }

  const { totalPayable: simpleTotal, interestAmount: simpleInterest } = calculateTotalPayableSimple(
    principalAmount,
    interestRate,
    inferTermMonths(startDate, endDate)
  );
  const scheduleInterest = sumScheduleInterest(repaymentSchedule);
  const interestAmount =
    scheduleInterest > 0 ? scheduleInterest : interestRate > 0 ? simpleInterest : 0;
  const totalPayable =
    repaymentSchedule.length > 0
      ? repaymentSchedule.reduce((s, r) => s + (Number(r.totalPayment) || 0), 0)
      : simpleTotal;

  const n = repaymentSchedule.length || inferTermMonths(startDate, endDate);
  const expectedInstallment =
    repaymentType === "lumpsum"
      ? principalAmount
      : calculateMonthlyEMI(principalAmount, interestRate, n);

  const remFromSchedule = calculateRemainingFromSchedule(repaymentSchedule);
  const paidOnRecord = Array.isArray(raw.payments)
    ? raw.payments.reduce((s, p) => s + (Number(p.amount) || 0), 0)
    : 0;
  const remainingBalance =
    remFromSchedule.remainingBalance > 0
      ? remFromSchedule.remainingBalance
      : Math.max(0, totalPayable - paidOnRecord);

  const nextInst = getNextInstallment(repaymentSchedule);

  return {
    principalAmount,
    interestRate,
    interestType,
    startDate,
    endDate,
    repaymentType,
    repaymentFrequency,
    expectedInstallment: Math.round(expectedInstallment * 100) / 100,
    totalPayable: Math.round(totalPayable * 100) / 100,
    interestAmount: Math.round(interestAmount * 100) / 100,
    remainingPrincipal: remFromSchedule.remainingPrincipal || Math.max(0, principalAmount - paidOnRecord),
    remainingInterest: remFromSchedule.remainingInterest,
    remainingBalance,
    repaymentSchedule,
    nextDueAmount: nextInst ? nextInst.totalPayment : remainingBalance,
    lateDays: nextInst?.lateDays || 0,
    totalAmount: principalAmount,
    remainingAmount: remainingBalance,
  };
}

export function buildLendingDashboard(lending, settings = {}) {
  const income = Math.max(0, Number(settings.monthlyIncome) || 0);
  const principal = Number(lending.principalAmount ?? lending.totalAmount) || 0;
  const paid = (lending.payments || []).reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totalPayable = Number(lending.totalPayable) || principal;
  const paidPct = totalPayable > 0 ? Math.min(100, Math.round((paid / totalPayable) * 100)) : 0;
  const instPaid = (lending.repaymentSchedule || []).filter((r) => r.paymentStatus === "paid").length;
  const instTotal = (lending.repaymentSchedule || []).length || 1;
  const salaryImpactPercent = calculateSalaryImpact(
    lending.expectedInstallment || lending.nextDueAmount,
    income
  );

  return {
    paidPct,
    remainingPct: 100 - paidPct,
    installmentProgress: { paid: instPaid, total: instTotal },
    salaryImpactPercent,
    trustScore: lending.trustScoreSnapshot ?? trustScoreForLendingEntry(lending),
    paid,
    totalPayable,
  };
}
