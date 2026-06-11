/**
 * Chart datasets for lending detail modal.
 * @param {object} lending enriched lending row
 * @param {ReturnType<import('./lendingFinancials.js').buildLendingDashboard>} dash
 * @param {(key: string) => string} t
 */
export function buildLendingBreakdownChartData(lending, dash, t) {
  const paid = Math.max(0, Math.round(dash.paid ?? 0));
  const remaining = Math.max(
    0,
    Math.round(Number(lending.remainingBalance ?? lending.remainingAmount) || 0),
  );
  return [
    { name: t("lending.detail.repaid"), value: paid },
    { name: t("lending.detail.remaining"), value: remaining },
  ].filter((r) => r.value > 0);
}

/** @param {object} lending */
export function buildLendingTimelineChartData(lending) {
  const pays = [...(lending.payments || [])]
    .filter((p) => p.date && Number(p.amount) > 0)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));

  let running = 0;
  return pays.map((p) => {
    running += Math.max(0, Number(p.amount) || 0);
    const d = new Date(`${p.date}T12:00:00`);
    const name = Number.isNaN(d.getTime())
      ? p.date
      : d.toLocaleDateString(undefined, { month: "short", year: "2-digit" });
    return { name, value: Math.round(running) };
  });
}

/** @param {object} lending */
export function buildLendingPaymentList(lending) {
  return [...(lending.payments || [])]
    .map((p, index) => ({
      index,
      date: p.date || "",
      amount: Math.max(0, Number(p.amount) || 0),
    }))
    .filter((p) => p.amount > 0 && p.date)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
}

/** @param {object} lending @param {object} dash */
export function lendingHasChartData(lending, dash) {
  const paid = dash.paid ?? 0;
  const remaining = Number(lending.remainingBalance ?? lending.remainingAmount) || 0;
  const total = dash.totalPayable ?? 0;
  return paid > 0 || remaining > 0 || total > 0;
}

/**
 * @param {object} lending
 * @param {(key: string) => string} t
 */
export function buildLendingChartExtraRows(lending, t) {
  const rows = [];
  const principal = Number(lending.principalAmount ?? lending.totalAmount) || 0;
  const installment = Number(lending.expectedInstallment || 0);
  if (principal > 0) {
    rows.push({
      name: t("lending.detail.principal"),
      value: `₹${principal.toLocaleString("en-IN")}`,
    });
  }
  if (installment > 0) {
    rows.push({
      name: t("lending.detail.installment"),
      value: `₹${installment.toLocaleString("en-IN")}`,
    });
  }
  return rows;
}
