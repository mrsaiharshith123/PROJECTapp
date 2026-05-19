import { useState } from "react";
import { formatInr } from "../../constants/symbols.js";
import { affordabilityBadgeClass } from "../../engines/affordability.js";
import { getExpensePresetsForMode, simulateNewExpense } from "../../engines/expenseSimulator.js";
import { useCommitTrack } from "../../context/CommitTrackContext.jsx";
import { combinedMonthlyIncome } from "../../utils/combinedIncome.js";
import { freeMoneyAfterBurden } from "../../engines/pressureScore.js";
import { computeLoanEmi, interestFromLoan, totalRepaymentFromEmi } from "../../utils/loanEmi.js";

const LOAN_PRESETS = new Set(["emi", "home_loan", "car_loan", "personal_loan"]);

/** Affordability simulator — EMI presets support product price, rate, and tenure. */
export default function ExpenseSimulatorForm() {
  const { commitments, settings, getEffectiveStatus } = useCommitTrack();
  const presets = getExpensePresetsForMode(settings);
  const presetKeys = Object.keys(presets);
  const [preset, setPreset] = useState(presetKeys[0] || "emi");
  const [amount, setAmount] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [downPayment, setDownPayment] = useState("");
  const [interestRate, setInterestRate] = useState("");
  const [tenureMonths, setTenureMonths] = useState("");
  const [useLoanCalc, setUseLoanCalc] = useState(true);

  const income = combinedMonthlyIncome(settings);
  const cash = freeMoneyAfterBurden(commitments, income, getEffectiveStatus);
  const isLoanPreset = LOAN_PRESETS.has(preset);

  const loanPrincipal = Math.max(
    0,
    (Number(productPrice) || 0) - Math.max(0, Number(downPayment) || 0)
  );
  const tenure = Math.max(1, Math.floor(Number(tenureMonths) || 0));
  const rate = Math.max(0, Number(interestRate) || 0);
  const computedEmi =
    isLoanPreset && useLoanCalc && loanPrincipal > 0 && tenure > 0
      ? computeLoanEmi(loanPrincipal, rate, tenure)
      : 0;

  const effectiveAmount =
    isLoanPreset && useLoanCalc && computedEmi > 0 ? computedEmi : Number(amount) || 0;

  const sim =
    effectiveAmount > 0
      ? simulateNewExpense({
          income,
          commitments,
          getEffectiveStatus,
          liquidSavings: settings.liquidSavings,
          freeMoney: cash.freeMoney,
          amount: effectiveAmount,
          preset,
          mode: settings,
          loanMeta:
            isLoanPreset && useLoanCalc && computedEmi > 0
              ? {
                  productPrice: Number(productPrice) || 0,
                  downPayment: Number(downPayment) || 0,
                  principal: loanPrincipal,
                  interestRate: rate,
                  tenureMonths: tenure,
                  emi: computedEmi,
                  totalRepayment: totalRepaymentFromEmi(computedEmi, tenure),
                  totalInterest: interestFromLoan(loanPrincipal, computedEmi, tenure),
                }
              : null,
        })
      : null;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 dark:text-slate-400">
        Try a new cost before you add it as a bill. Results use your current income and commitments.
      </p>
      <div className="flex flex-wrap gap-2">
        {presetKeys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setPreset(key)}
            className={`text-xs px-2.5 py-1 rounded-full border ${
              preset === key
                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                : "border-gray-200 text-gray-600 dark:border-slate-600 dark:text-slate-400"
            }`}
          >
            {presets[key].label}
          </button>
        ))}
      </div>
      <input
        type="number"
        min="0"
        placeholder={isLoanPreset && useLoanCalc ? "Or enter EMI directly (₹)" : "Amount (₹)"}
        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-sm"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={isLoanPreset && useLoanCalc && computedEmi > 0}
      />
      {isLoanPreset && (
        <div className="rounded-xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-950/20 p-3 space-y-2">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={useLoanCalc}
              onChange={(e) => setUseLoanCalc(e.target.checked)}
              className="rounded border-gray-300"
            />
            Calculate EMI from product price & interest
          </label>
          {useLoanCalc && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Product price (₹)"
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Down payment (₹)"
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder="Interest % p.a."
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Tenure (months)"
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(e.target.value)}
                />
              </div>
              {computedEmi > 0 && (
                <p className="text-xs text-indigo-800 dark:text-indigo-200">
                  EMI ≈ {formatInr(computedEmi)}/mo · Total {formatInr(totalRepaymentFromEmi(computedEmi, tenure))} over{" "}
                  {tenure} mo · Interest ≈ {formatInr(interestFromLoan(loanPrincipal, computedEmi, tenure))}
                </p>
              )}
            </>
          )}
        </div>
      )}
      {sim && (
        <div className="space-y-2 text-sm">
          <span
            className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border ${affordabilityBadgeClass(sim.affordability.tier)}`}
          >
            {sim.affordability.label}
          </span>
          {sim.loanMeta && (
            <p className="text-xs text-gray-600 dark:text-slate-400">
              Loan on {formatInr(sim.loanMeta.productPrice)} (down {formatInr(sim.loanMeta.downPayment)}) ·{" "}
              {sim.loanMeta.interestRate}% · {sim.loanMeta.tenureMonths} mo
            </p>
          )}
          <p className="text-gray-700 dark:text-slate-300">
            Free cash after: {formatInr(Math.round(sim.affordability.freeMoneyAfter))}
            {sim.affordability.committedPercent != null ? ` (${sim.affordability.committedPercent}% committed)` : ""}
          </p>
          {sim.beforeSurvival && sim.afterSurvival && (
            <p className="text-xs text-gray-600 dark:text-slate-400">
              Survival if income stops: {sim.beforeSurvival.survivalMonths ?? "—"} mo →{" "}
              {sim.afterSurvival.survivalMonths ?? "—"} mo after this cost
            </p>
          )}
          {sim.warnings.map((w, i) => (
            <p
              key={i}
              className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 rounded-lg px-2 py-1.5"
            >
              {w}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
