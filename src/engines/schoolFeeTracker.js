import { parseISO } from "date-fns";

const SCHOOL_NAME_RE = /school|tuition|fee|admission|bus.*fee|uniform|book.*fee/i;

/**
 * @param {object[]} commitments
 * @param {string} todayStr yyyy-MM-dd
 * @param {(c: object) => string} [getEffectiveStatus]
 */
export function buildSchoolFeeProfile(commitments, todayStr, getEffectiveStatus = () => "pending") {
  const schoolCommitments = (commitments || []).filter(
    (c) => c.category === "School" || SCHOOL_NAME_RE.test(c.name || ""),
  );

  let monthlyFees = 0;
  let yearlyFees = 0;
  for (const c of schoolCommitments) {
    const amt = Math.max(0, Number(c.remainingAmount ?? c.amount) || 0);
    if (c.repeatType === "yearly" || c.repeatType === "none") yearlyFees += amt;
    else monthlyFees += amt;
  }

  const totalAnnual = Math.round(monthlyFees * 12 + yearlyFees);

  const today = parseISO(`${todayStr}T12:00:00`);
  const in60 = new Date(today);
  in60.setDate(in60.getDate() + 60);

  const upcomingFees = [];
  const overdueSchoolFees = [];

  for (const c of schoolCommitments) {
    const status = getEffectiveStatus(c);
    const amt = Math.max(0, Number(c.remainingAmount ?? c.amount) || 0);
    if (status === "overdue") {
      overdueSchoolFees.push({ ...c, amount: amt });
      continue;
    }
    if (status === "paid") continue;
    if (!c.dueDate) continue;
    const due = parseISO(`${c.dueDate}T12:00:00`);
    if (due >= today && due <= in60) {
      upcomingFees.push({ ...c, amount: amt });
    }
  }

  upcomingFees.sort((a, b) => (a.dueDate || "").localeCompare(b.dueDate || ""));

  const nextBigFee =
    upcomingFees.length > 0
      ? upcomingFees.reduce((best, row) => (row.amount > best.amount ? row : best), upcomingFees[0])
      : null;

  const admissionMonth = schoolCommitments.some((c) => {
    if (!c.dueDate) return false;
    const m = parseISO(`${c.dueDate}T12:00:00`).getMonth() + 1;
    return (m === 4 || m === 5) && (c.repeatType === "yearly" || c.repeatType === "none");
  });

  const annualCalendar = [];
  for (let i = 0; i < 12; i++) {
    const monthIndex = (today.getMonth() + i) % 12;
    const monthKey = String(monthIndex + 1).padStart(2, "0");
    let amount = monthlyFees;
    for (const c of schoolCommitments) {
      if (c.repeatType !== "yearly" && c.repeatType !== "none") continue;
      if (!c.dueDate) continue;
      const dueMonth = parseISO(`${c.dueDate}T12:00:00`).getMonth();
      if (dueMonth === monthIndex) {
        amount += Math.max(0, Number(c.remainingAmount ?? c.amount) || 0);
      }
    }
    annualCalendar.push({ monthKey, amount: Math.round(amount) });
  }

  return {
    monthlyFees: Math.round(monthlyFees),
    yearlyFees: Math.round(yearlyFees),
    totalAnnual,
    upcomingFees,
    overdueSchoolFees,
    nextBigFee,
    admissionMonth,
    annualCalendar,
  };
}
