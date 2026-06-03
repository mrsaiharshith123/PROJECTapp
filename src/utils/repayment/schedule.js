import { addMonths, addWeeks, format, parseISO } from "date-fns";
import { compareYmd } from "../dates.js";
import { calculateMonthlyEMI } from "./calculations.js";

const FREQ = ["monthly", "weekly", "biweekly", "custom", "lumpsum"];

function addByFrequency(base, frequency, step) {
  if (frequency === "weekly") return addWeeks(base, step);
  if (frequency === "biweekly") return addWeeks(base, step * 2);
  return addMonths(base, step);
}

/**
 * @returns {import('./types.js').RepaymentInstallment[]}
 */
export function generateRepaymentSchedule({
  principalAmount,
  interestRate = 0,
  interestType = "simple",
  startDate,
  endDate,
  repaymentFrequency = "monthly",
  repaymentType,
  todayStr,
}) {
  const P = Math.max(0, Number(principalAmount) || 0);
  if (P <= 0) return [];

  const freq = FREQ.includes(repaymentFrequency) ? repaymentFrequency : "monthly";
  const type = repaymentType || (freq === "lumpsum" ? "lumpsum" : "monthly");

  if (type === "lumpsum" || freq === "lumpsum") {
    const due = String(endDate || startDate || "").slice(0, 10);
    return [
      {
        installmentNumber: 1,
        dueDate: due,
        totalPayment: P,
        principalComponent: P,
        interestComponent: 0,
        remainingBalance: 0,
        paymentStatus: "pending",
        paidAt: null,
        lateDays: 0,
      },
    ];
  }

  const n = (() => {
    try {
      const start = parseISO(`${String(startDate).slice(0, 10)}T12:00:00`);
      const end = parseISO(`${String(endDate || startDate).slice(0, 10)}T12:00:00`);
      if (freq === "monthly") {
        return Math.max(
          1,
          Math.min(360, (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1)
        );
      }
      if (freq === "weekly") {
        return Math.max(1, Math.min(520, Math.round((end.getTime() - start.getTime()) / (7 * 86400000))));
      }
      return Math.max(1, Math.min(260, Math.round((end.getTime() - start.getTime()) / (14 * 86400000))));
    } catch {
      return 12;
    }
  })();

  const annual = Math.max(0, Number(interestRate) || 0);
  const emi =
    interestType === "compound" || annual > 0
      ? calculateMonthlyEMI(P, annual, n)
      : P / n;

  const r = annual / 12 / 100;
  let balance = P;
  const rows = [];
  let base;
  try {
    base = parseISO(`${String(startDate).slice(0, 10)}T12:00:00`);
  } catch {
    base = new Date();
  }

  for (let i = 1; i <= n && balance > 0.01; i++) {
    const dueDate = format(addByFrequency(base, freq, i), "yyyy-MM-dd");
    const interestComponent = annual > 0 ? balance * r : 0;
    let principalComponent = Math.min(balance, Math.max(0, emi - interestComponent));
    let totalPayment = principalComponent + interestComponent;
    if (i === n) {
      principalComponent = balance;
      totalPayment = balance + interestComponent;
    }
    balance = Math.max(0, balance - principalComponent);
    let lateDays = 0;
    /** @type {"pending"|"paid"|"partial"|"overdue"} */
    let paymentStatus = "pending";
    if (todayStr && compareYmd(dueDate, todayStr) < 0) {
      paymentStatus = "overdue";
      try {
        lateDays = Math.max(
          0,
          Math.floor(
            (parseISO(`${todayStr}T12:00:00`).getTime() - parseISO(`${dueDate}T12:00:00`).getTime()) / 86400000
          )
        );
      } catch {
        lateDays = 0;
      }
    }
    rows.push({
      installmentNumber: i,
      dueDate,
      totalPayment: Math.round(totalPayment * 100) / 100,
      principalComponent: Math.round(principalComponent * 100) / 100,
      interestComponent: Math.round(interestComponent * 100) / 100,
      remainingBalance: Math.round(balance * 100) / 100,
      paymentStatus,
      paidAt: null,
      lateDays,
    });
  }
  return rows;
}

export function getNextInstallment(schedule) {
  if (!Array.isArray(schedule) || schedule.length === 0) return null;
  return schedule.find((r) => r.paymentStatus !== "paid") || null;
}

export function sumScheduleInterest(schedule) {
  return (schedule || []).reduce((s, r) => s + (Number(r.interestComponent) || 0), 0);
}
