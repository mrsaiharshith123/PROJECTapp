import { computeLiquidityLadder } from "./netWorth/liquidityLadder.js";

/**
 * In a hospital-waiting-room moment, nobody wants charts. This aggregates
 * exactly four things, nothing else: how much cash is accessible right now,
 * which insurance is active with a claim number to call, what's owed to the
 * user (potential quick cash-in), and — if Emergency Access Mode is set up —
 * who else can see this. Deliberately not a "score" or an "insight," just
 * the raw facts a stressed person needs in large text.
 * @param {object} input
 * @param {import('../utils/netWorth/wealthStorage.js').WealthEntry[]} input.wealthEntries — asset entries only
 * @param {object[]} input.commitments
 * @param {object[]} input.lendings
 * @param {(c: object) => string} input.getEffectiveStatus
 */
export function buildEmergencySnapshot({ wealthEntries, commitments, lendings, getEffectiveStatus }) {
  const ladder = computeLiquidityLadder(wealthEntries || []);

  const activeInsurance = (commitments || [])
    .filter((c) => c.category === "Insurance" && getEffectiveStatus(c) !== "paid")
    .map((c) => ({
      id: c.id,
      name: c.name,
      insurer: c.insuranceCompany || "",
      policyId: c.insurancePolicyId || "",
      sumAssured: c.insuranceSumAssured || null,
      claimContact: c.insuranceClaimContact || "",
    }));

  const owedToUser = (lendings || [])
    .filter((l) => l.type === "lent" && Math.max(0, Number(l.remainingAmount) || 0) > 0)
    .map((l) => ({ id: l.id, personName: l.personName, remainingAmount: Math.max(0, Number(l.remainingAmount) || 0) }))
    .sort((a, b) => b.remainingAmount - a.remainingAmount);

  const totalOwedToUser = owedToUser.reduce((s, l) => s + l.remainingAmount, 0);

  return {
    instantCash: ladder.instantTotal,
    within7DaysCash: ladder.within7DaysTotal,
    activeInsurance,
    owedToUser,
    totalOwedToUser,
  };
}
