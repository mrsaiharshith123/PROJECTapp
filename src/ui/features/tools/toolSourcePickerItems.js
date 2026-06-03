import { formatInr } from "../../../constants/symbols.js";

export function debtPickerItemFromCommitment(c, getEffectiveStatus) {
  const bal = Math.max(0, Number(c.remainingAmount ?? c.amount) || 0);
  const emi = Math.max(0, Number(c.amount) || 0);
  const rate = c.annualInterestRate != null ? `${c.annualInterestRate}% p.a.` : "rate not set";
  return {
    id: `c-${c.id}`,
    raw: c,
    kind: "commitment",
    title: c.name,
    subtitle: `${c.category} · ${formatInr(emi)}/cycle`,
    meta: `Open ${formatInr(bal)} · ${rate} · ${getEffectiveStatus(c)}`,
  };
}

export function debtPickerItemFromLending(l, getEffectiveLendingStatus) {
  const bal = Math.max(0, Number(l.remainingAmount) || 0);
  return {
    id: `l-${l.id}`,
    raw: l,
    kind: "lending",
    title: l.personName || "Borrowed",
    subtitle: `Lending · ${formatInr(bal)} left`,
    meta: getEffectiveLendingStatus(l),
  };
}
