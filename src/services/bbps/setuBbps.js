const BBPS_BASE = import.meta.env.VITE_SETU_BBPS_BASE || "https://bbps-sandbox.setu.co";
const BBPS_KEY = import.meta.env.VITE_SETU_BBPS_KEY || "";

export function isBbpsConfigured() {
  return Boolean(BBPS_KEY);
}

/** @param {{ billerId: string, consumerNumber: string }} params */
export async function fetchBillDetails({ billerId, consumerNumber }) {
  if (!isBbpsConfigured()) return { error: "bbps_not_configured" };
  try {
    const res = await fetch(`${BBPS_BASE}/bills/fetch`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${BBPS_KEY}` },
      body: JSON.stringify({ billerId, customerParams: { consumerNumber } }),
    });
    const data = await res.json();
    return {
      amount: data.billAmount,
      dueDate: data.dueDate,
      billerName: data.billerName,
    };
  } catch {
    return { error: "network_error" };
  }
}

/** @param {{ billerId: string, consumerNumber: string, amount: number }} params */
export async function payBill({ billerId, consumerNumber, amount }) {
  if (!isBbpsConfigured()) return { error: "bbps_not_configured" };
  try {
    const res = await fetch(`${BBPS_BASE}/bills/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${BBPS_KEY}` },
      body: JSON.stringify({ billerId, consumerNumber, amount, paymentMode: "UPI" }),
    });
    const data = await res.json();
    return { paymentUrl: data.paymentLink, transactionId: data.txnId, status: "initiated" };
  } catch {
    return { error: "network_error" };
  }
}

export const BBPS_CATEGORIES = [
  { id: "electricity", labelKey: "tools.bbps.category.electricity", icon: "lightning" },
  { id: "mobile", labelKey: "tools.bbps.category.mobile", icon: "device-mobile" },
  { id: "broadband", labelKey: "tools.bbps.category.broadband", icon: "laptop" },
  { id: "gas", labelKey: "tools.bbps.category.gas", icon: "lightning" },
  { id: "water", labelKey: "tools.bbps.category.water", icon: "package" },
  { id: "dth", labelKey: "tools.bbps.category.dth", icon: "television" },
  { id: "insurance", labelKey: "tools.bbps.category.insurance", icon: "shield" },
  { id: "loan", labelKey: "tools.bbps.category.loan", icon: "bank" },
];

export const BBPS_PAYABLE_CATEGORIES = new Set([
  "Electricity",
  "Utility",
  "Insurance",
  "EMI",
  "Loan",
  "Credit Card",
]);
