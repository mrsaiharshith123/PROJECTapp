import { useState } from "react";
import { formatInr } from "../../../constants/symbols.js";
import { affordabilityTierTone } from "../../../engines/affordability.js";
import { semanticToneToClass } from "../../tokens/semanticBadge.js";
import { getExpensePresetsForMode, simulateNewExpense } from "../../../engines/expenseSimulator.js";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { freeMoneyAfterBurden } from "../../../engines/pressureScore.js";
import { computeLoanEmi, interestFromLoan, totalRepaymentFromEmi } from "../../../utils/loanEmi.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import {
  presetLabelKey,
  translateAffordabilityLabel,
  translateAffordWarning,
} from "../../../i18n/affordLabels.js";

const LOAN_PRESETS = new Set(["loan", "emi", "home_loan", "car_loan", "personal_loan"]);

/** Affordability simulator — EMI presets support product price, rate, and tenure. */
export default function ExpenseSimulatorForm() {
  const { t } = useTranslation();
  const { commitments, settings, getEffectiveStatus } = useCommitTrack();
  const presets = getExpensePresetsForMode(settings);
  const presetKeys = Object.keys(presets);
  const [preset, setPreset] = useState(presetKeys[0] || "loan");
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
    (Number(productPrice) || 0) - Math.max(0, Number(downPayment) || 0),
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
          mode: /** @type {any} */ (settings),
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

  const presetLabel = (key) => {
    const labelKey = presetLabelKey(key);
    const translated = t(labelKey);
    return translated !== labelKey ? translated : presets[key]?.label ?? key;
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 dark:text-slate-400">{t("tools.afford.intro")}</p>
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
            {presetLabel(key)}
          </button>
        ))}
      </div>
      <input
        type="number"
        min="0"
        placeholder={
          isLoanPreset && useLoanCalc
            ? t("tools.afford.emiDirectPlaceholder")
            : t("tools.afford.amountPlaceholder")
        }
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
            {t("tools.afford.loanCalcLabel")}
          </label>
          {useLoanCalc && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder={t("tools.afford.productPrice")}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  placeholder={t("tools.afford.downPayment")}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder={t("tools.afford.interestRate")}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                />
                <input
                  type="number"
                  min="1"
                  placeholder={t("tools.afford.tenure")}
                  className="px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(e.target.value)}
                />
              </div>
              {computedEmi > 0 && (
                <p className="text-xs text-indigo-800 dark:text-indigo-200">
                  {t("tools.afford.emiSummary", {
                    emi: formatInr(computedEmi),
                    total: formatInr(totalRepaymentFromEmi(computedEmi, tenure)),
                    months: tenure,
                    interest: formatInr(interestFromLoan(loanPrincipal, computedEmi, tenure)),
                  })}
                </p>
              )}
            </>
          )}
        </div>
      )}
      {sim && (
        <div className="space-y-2 text-sm">
          <span
            className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border ${semanticToneToClass(affordabilityTierTone(sim.affordability.tier))}`}
          >
            {translateAffordabilityLabel(t, sim.affordability)}
          </span>
          {sim.loanMeta && (
            <p className="text-xs text-gray-600 dark:text-slate-400">
              {t("tools.afford.loanOn", {
                price: formatInr(sim.loanMeta.productPrice),
                down: formatInr(sim.loanMeta.downPayment),
                rate: sim.loanMeta.interestRate,
                months: sim.loanMeta.tenureMonths,
              })}
            </p>
          )}
          <p className="text-gray-700 dark:text-slate-300">
            {t("tools.afford.freeCashAfter", {
              amount: formatInr(Math.round(sim.affordability.freeMoneyAfter)),
            })}
            {sim.affordability.committedPercent != null
              ? ` ${t("tools.afford.committedSuffix", { percent: sim.affordability.committedPercent })}`
              : ""}
          </p>
          {sim.beforeSurvival && sim.afterSurvival && (
            <p className="text-xs text-gray-600 dark:text-slate-400">
              {t("tools.afford.survival", {
                before: sim.beforeSurvival.survivalMonths ?? "—",
                after: sim.afterSurvival.survivalMonths ?? "—",
              })}
            </p>
          )}
          {sim.warnings.map((w, i) => (
            <p
              key={i}
              className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 rounded-lg px-2 py-1.5"
            >
              {translateAffordWarning(t, w)}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
