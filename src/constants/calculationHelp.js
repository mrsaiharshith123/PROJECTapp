/** Plain-language explanations for (i) info tips. */
export const CALC_HELP = {
  freeCash:
    "Estimated money left after your typical monthly bills (EMIs, rent, subs, etc.). We use bill amounts and repeat rules — not every future one-off.",
  committedPercent:
    "Share of your stated monthly income that goes to recurring and active monthly bills. Higher % means less room for surprises.",
  pressureScore:
    "A simple 0–100 score from how heavy your bills are vs income, overdue items, and recent trends. Lower is calmer.",
  healthScore:
    "Combines payment streak, control over bills, open balances, and lending. It is a guide, not a credit score.",
  survivalMonths:
    "How long liquid savings plus current free cash could cover monthly burn if income stopped today.",
  emergencyReserve:
    "Suggested cash buffer based on monthly obligations, dependents, and pressure. Aim to close the gap over time.",
  monthlyBurden:
    "Rough total due per month from active bills (monthly, quarterly ÷ 3, yearly ÷ 12, etc.).",
  paycheckFlow:
    "Salary minus fixed bills (rent, EMIs, insurance) minus flexible bills (cards, subs). What is left is free cash.",
  lendingFlexible:
    "Flexible: record any payment anytime — partial or full. Monthly: follows an installment schedule. Lump sum: one target date, pay when you can.",
  pressureWeight:
    "Monthly estimate from each bill: amount ÷ repeat interval (e.g. ₹3,000 quarterly → ₹1,000/mo). One-off bills use the full amount. Only your saved bills — nothing is pre-filled.",
  openBalance:
    "Total still owed on active bills right now (not the same as monthly burden).",
  dueThisMonth:
    "Bills with a due date in the current calendar month that are not fully paid yet.",
  freeAfterDues:
    "Income minus estimated monthly dues from recurring and active bills.",
  businessReceivables:
    "Money clients owe you: open lending you marked as lent, plus client invoices you add below. Vendor dues come from your business bills in Commitments.",
  dueHeatmap:
    "How many bills fall due in each of the next four weeks and their total amount.",
  debtTrend:
    "Change in total open balance between the oldest and newest month we have snapshots for.",
  chitInstallments:
    "Most large chits use equal monthly shares (value ÷ months). Some groups use decreasing installments (high early, low later). Pick the type that matches your group.",
  chitMonthsPaid:
    "How many installments you already paid. If you paid 46, you are on month 47 now. This fixes the due amount and month number.",
  chitPayoutReceived:
    "Actual cash you got when you took the chit (e.g. ₹4,43,000). We work out the auction discount from this — you do not need to guess the discount.",
  chitForeman:
    "Organiser commission, often around 5% of chit value, taken from the pot when you receive money.",
  chitDiscount:
    "At auction you accept less than full chit value — this discount is shared with other members. You never receive the full chit amount in cash.",
  chitAdvisor:
    "Compares months when you could take the chit: estimated discount, payout after foreman, your other bills that month, and a max loss you are willing to accept.",
  chitMaxLoss:
    "We suggest a max loss from your income, monthly dues, open debt, overdue bills, and savings — not a fixed %. Taking early often exceeds it; later months usually cost less.",
  loanExtraTiming:
    "Shows upcoming months: when other bills are lighter so you can pay extra on this loan, and heavy months when you should stick to the minimum.",
  incomeEntryBasis:
    "Take-home matches what lands in your bank after tax, PF, and fixed deductions — best for pressure and free-cash math. Gross is useful only if every number you enter is pre-tax; free cash will look tighter than real life if you still bank less.",
  householdPayerBillTag:
    "Optional for family mode: tag who pays so the household pulse can describe split responsibility. Totals and pressure math stay the same.",
};
