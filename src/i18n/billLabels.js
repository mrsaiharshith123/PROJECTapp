/**
 * @param {(key: string, params?: object) => string} t
 * @param {{ kind?: string, label?: string, paymentEntries?: number, paidCycles?: number, totalCycles?: number, remainingCycles?: number }} progress
 */
export function translateBillProgressLabel(t, progress) {
  if (!progress) return "";
  const { kind, paymentEntries = 0, paidCycles = 0, totalCycles = 0, remainingCycles = 0 } = progress;

  if (kind === "chit") {
    if (remainingCycles > 0) {
      return t("bill.progress.chitMonths", {
        paid: paidCycles,
        total: totalCycles,
        remaining: remainingCycles,
      });
    }
    return t("bill.progress.chitComplete", { total: totalCycles });
  }

  if (kind === "once") {
    if (progress.label === "Paid in full") return t("bill.progress.paidFull");
    if (paymentEntries > 0) return t("bill.progress.partPaid");
    return t("bill.progress.notPaid");
  }

  if (kind === "recurring" && paymentEntries > 0) {
    return t("bill.progress.paymentsRecorded", { count: paymentEntries });
  }

  return progress.label || "";
}
