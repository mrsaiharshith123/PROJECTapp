import { useState } from "react";
import { formatInr } from "../../../constants/symbols.js";
import { getExpensePresetsForMode, simulateNewExpense } from "../../../engines/expenseSimulator.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { freeMoneyAfterBurden } from "../../../engines/pressureScore.js";
import { computeLoanEmi, interestFromLoan, totalRepaymentFromEmi } from "../../../utils/loanEmi.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { Caption } from "../../primitives/Text.jsx";
import { inputClassName } from "../../primitives/Input.jsx";
import { ToolAnswerHero } from "../../patterns/ToolAnswerHero.jsx";
import {
  presetLabelKey,
  translateAffordabilityLabel,
  translateAffordWarning,
} from "../../../i18n/affordLabels.js";

const LOAN_PRESETS = new Set(["loan", "emi", "home_loan", "car_loan", "personal_loan"]);
const fieldClass = `${inputClassName()} ct-input-tint`;

/** Affordability simulator — EMI presets support product price, rate, and tenure. */
export default function ExpenseSimulatorForm() {
  const { t } = useTranslation();
  const { commitments, settings, getEffectiveStatus } = usePerovo();
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

  const monthlyImpact = sim
    ? Math.round((sim.affordability.freeMoneyAfter ?? 0) - cash.freeMoney)
    : 0;
  const impactPositive = monthlyImpact >= 0;

  const presetLabel = (key) => {
    const labelKey = presetLabelKey(key);
    const translated = t(labelKey);
    return translated !== labelKey ? translated : presets[key]?.label ?? key;
  };

  return (
    <div className="ct-stack">
      <ToolAnswerHero
        tone="sim"
        label={t("tools.afford.heroLabel")}
        value={
          sim
            ? `${impactPositive ? "+" : ""}${formatInr(monthlyImpact)}`
            : formatInr(0)
        }
        className={sim && !impactPositive ? "ct-hero-negative" : undefined}
      />
      <Caption>{t("tools.afford.intro")}</Caption>
      <div className="ct-row flex-wrap gap-2">
        {presetKeys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setPreset(key)}
            className={`ct-chip ${preset === key ? "ct-chip-active" : ""}`}
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
        className={fieldClass}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        disabled={isLoanPreset && useLoanCalc && computedEmi > 0}
      />
      {isLoanPreset && (
        <div className="ct-inset ct-stack-sm !p-3">
          <label className="flex items-center gap-2 text-xs font-semibold">
            <input
              type="checkbox"
              checked={useLoanCalc}
              onChange={(e) => setUseLoanCalc(e.target.checked)}
            />
            {t("tools.afford.loanCalcLabel")}
          </label>
          {useLoanCalc && (
            <>
              <div className="ct-grid-2 gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder={t("tools.afford.productPrice")}
                  className={fieldClass}
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  placeholder={t("tools.afford.downPayment")}
                  className={fieldClass}
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  placeholder={t("tools.afford.interestRate")}
                  className={fieldClass}
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                />
                <input
                  type="number"
                  min="1"
                  placeholder={t("tools.afford.tenure")}
                  className={fieldClass}
                  value={tenureMonths}
                  onChange={(e) => setTenureMonths(e.target.value)}
                />
              </div>
              {computedEmi > 0 && (
                <Caption className="block ct-text-accent">
                  {t("tools.afford.emiSummary", {
                    emi: formatInr(computedEmi),
                    total: formatInr(totalRepaymentFromEmi(computedEmi, tenure)),
                    months: tenure,
                    interest: formatInr(interestFromLoan(loanPrincipal, computedEmi, tenure)),
                  })}
                </Caption>
              )}
            </>
          )}
        </div>
      )}
      {sim && (
        <div className="ct-grid-2">
          <div className={`ct-stat-tile ${impactPositive ? "teal" : "amber"}`}>
            <p className="ct-stat-tile-label">{translateAffordabilityLabel(t, sim.affordability)}</p>
            <p className="ct-stat-tile-value ct-numeral text-sm">
              {formatInr(Math.round(sim.affordability.freeMoneyAfter))}
            </p>
          </div>
          {sim.beforeSurvival && sim.afterSurvival && (
            <div className="ct-stat-tile indigo">
              <p className="ct-stat-tile-label">{t("netWorth.sim.survival")}</p>
              <p className="ct-stat-tile-value text-sm">
                {t("tools.afford.survival", {
                  before: sim.beforeSurvival.survivalMonths ?? "—",
                  after: sim.afterSurvival.survivalMonths ?? "—",
                })}
              </p>
            </div>
          )}
          {sim.loanMeta && (
            <div className="ct-stat-tile col-span-2">
              <p className="ct-stat-tile-label">{t("preset.loan")}</p>
              <p className="ct-stat-tile-value text-sm">
                {t("tools.afford.loanOn", {
                  price: formatInr(sim.loanMeta.productPrice),
                  down: formatInr(sim.loanMeta.downPayment),
                  rate: sim.loanMeta.interestRate,
                  months: sim.loanMeta.tenureMonths,
                })}
              </p>
            </div>
          )}
        </div>
      )}
      {sim?.warnings.map((w, i) => (
        <div key={i} className="ct-stat-tile amber">
          <p className="ct-stat-tile-value text-sm">{translateAffordWarning(t, w)}</p>
        </div>
      ))}
      <div className="ct-stat-tile">
        <p className="ct-stat-tile-label">{t("tools.afford.disclaimer")}</p>
      </div>
    </div>
  );
}
