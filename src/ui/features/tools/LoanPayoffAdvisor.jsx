import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InfoTip } from "../../primitives/InfoTip.jsx";
import ToolSourcePicker from "./ToolSourcePicker.jsx";
import { CALC_HELP } from "../../../constants/calculationHelp.js";
import {
  adviseLoanExtraPaymentMonths,
  listDebtSources,
} from "../../../engines/loanPayoffTiming.js";
import {
  buildPrepaymentBalanceSeries,
  extrasFromTimingRows,
  payoffLabelFromMonths,
  sampleLoanChartRows,
} from "../../../engines/prepayment.js";
import { ToolComparisonChart } from "../../patterns/ToolComparisonChart.jsx";
import { formatInr } from "../../../constants/symbols.js";
import { Caption } from "../../primitives/Text.jsx";
import { ToolAnswerHero } from "../../patterns/ToolAnswerHero.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateBillStatus, translateCategory, translateLendingStatus } from "../../../i18n/domainLabels.js";

function debtPickerItemFromCommitment(c, getEffectiveStatus, t) {
  const bal = Math.max(0, Number(c.remainingAmount ?? c.amount) || 0);
  const emi = Math.max(0, Number(c.amount) || 0);
  const rate =
    c.annualInterestRate != null ? `${c.annualInterestRate}% p.a.` : t("loan.advisor.rateNotSet");
  return {
    id: `c-${c.id}`,
    raw: c,
    kind: "commitment",
    title: c.name,
    subtitle: `${translateCategory(t, c.category)} · ${formatInr(emi)}/${t("loan.advisor.perCycle")}`,
    meta: `${t("loan.advisor.openBalance", { amount: formatInr(bal) })} · ${rate} · ${translateBillStatus(t, getEffectiveStatus(c))}`,
  };
}

function debtPickerItemFromLending(l, getEffectiveLendingStatus, t) {
  const bal = Math.max(0, Number(l.remainingAmount) || 0);
  return {
    id: `l-${l.id}`,
    raw: l,
    kind: "lending",
    title: l.personName || t("loan.advisor.borrowedDefault"),
    subtitle: t("lending.picker.subtitle", { amount: formatInr(bal) }),
    meta: translateLendingStatus(t, getEffectiveLendingStatus(l)),
  };
}

const fieldClass =
  "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-sm";

export default function LoanPayoffAdvisor({
  commitments,
  lendings,
  settings,
  getEffectiveStatus,
  getEffectiveLendingStatus,
  todayStr,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { bills, borrowed } = useMemo(
    () => listDebtSources(commitments, lendings, getEffectiveStatus, getEffectiveLendingStatus),
    [commitments, lendings, getEffectiveStatus, getEffectiveLendingStatus],
  );

  const pickerItems = useMemo(() => {
    const rows = bills.map((c) => debtPickerItemFromCommitment(c, getEffectiveStatus, t));
    for (const l of borrowed) {
      rows.push(debtPickerItemFromLending(l, getEffectiveLendingStatus, t));
    }
    return rows;
  }, [bills, borrowed, getEffectiveStatus, getEffectiveLendingStatus, t]);

  const [step, setStep] = useState("pick");
  const [target, setTarget] = useState(null);
  const [manual, setManual] = useState({
    name: "",
    balance: "",
    emi: "",
    rate: "",
  });

  const advice = useMemo(() => {
    const manualDebt =
      step === "manual"
        ? {
            name: manual.name.trim() || t("loan.advisor.defaultLoanName"),
            balance: Number(manual.balance) || 0,
            emi: Number(manual.emi) || 0,
            rate: Number(manual.rate) || 0,
          }
        : null;
    return adviseLoanExtraPaymentMonths({
      target: step === "calc" && target ? target : null,
      manualDebt: step === "manual" ? manualDebt : null,
      commitments,
      lendings,
      getEffectiveStatus,
      getEffectiveLendingStatus,
      todayStr,
      monthlyIncome: settings.monthlyIncome,
      liquidSavings: settings.liquidSavings,
    });
  }, [
    step,
    target,
    manual,
    commitments,
    lendings,
    getEffectiveStatus,
    getEffectiveLendingStatus,
    todayStr,
    settings,
    t,
  ]);

  const payoffSeries = useMemo(() => {
    const debt = advice.debt;
    if (!debt || debt.balance <= 0 || debt.emi <= 0) return null;
    const extraByMonth = extrasFromTimingRows(advice.rows);
    return buildPrepaymentBalanceSeries({
      principalOutstanding: debt.balance,
      annualRatePercent: debt.rate || 0,
      scheduledEmi: debt.emi,
      extraByMonth,
    });
  }, [advice.debt, advice.rows]);

  const showResults = step === "calc" || (step === "manual" && Number(manual.balance) > 0);

  if (step === "pick") {
    return (
      <ToolSourcePicker
        accent="violet"
        title={t("loan.advisor.which")}
        hint={t("loan.advisor.hint")}
        items={pickerItems}
        emptyMessage={t("loan.advisor.empty")}
        manualLabel={t("loan.advisor.manual")}
        addLabel={t("loan.advisor.addBill")}
        onPick={(item) => {
          setTarget(item);
          setStep("calc");
        }}
        onManual={() => setStep("manual")}
        onAdd={() => navigate("/add")}
      />
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <button
        type="button"
        onClick={() => {
          setTarget(null);
          setStep("pick");
        }}
        className="text-xs font-semibold text-indigo-600 dark:text-indigo-300"
      >
        ← {t("loan.advisor.chooseAnother")}
      </button>

      {step === "manual" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-gray-600">{t("loan.advisor.loanName")}</label>
            <input
              className={fieldClass}
              value={manual.name}
              onChange={(e) => setManual((m) => ({ ...m, name: e.target.value }))}
              placeholder={t("loan.advisor.phName")}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">{t("loan.advisor.balanceLeft")}</label>
            <input
              type="number"
              className={fieldClass}
              value={manual.balance}
              onChange={(e) => setManual((m) => ({ ...m, balance: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">{t("loan.advisor.regularPayment")}</label>
            <input
              type="number"
              className={fieldClass}
              value={manual.emi}
              onChange={(e) => setManual((m) => ({ ...m, emi: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600">{t("loan.advisor.interestOptional")}</label>
            <input
              type="number"
              className={fieldClass}
              value={manual.rate}
              onChange={(e) => setManual((m) => ({ ...m, rate: e.target.value }))}
            />
          </div>
        </div>
      )}

      {step === "calc" && target && (
        <div className="rounded-xl border border-violet-100 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/30 px-3 py-2">
          <p className="font-semibold text-violet-900 dark:text-violet-100">{target.title}</p>
          <p className="text-xs text-violet-800/90 dark:text-violet-200/90">{target.subtitle}</p>
        </div>
      )}

      {showResults && (
        <>
          {payoffSeries && payoffSeries.acceleratedMonths < payoffSeries.baselineMonths ? (
            <ToolAnswerHero
              tone="wealth"
              label={t("loan.advisor.paymentPlanTitle")}
              value={t("charts.loanBalanceLumpy", {
                month: payoffLabelFromMonths(payoffSeries.acceleratedMonths, todayStr),
                balance: formatInr(0),
              })}
              subtitle={advice.bestForExtra ? t("loan.advisor.extraInMonths", {
                schedule: `${advice.bestForExtra.label} ${formatInr(advice.bestForExtra.recommendedExtra)}`,
              }) : undefined}
            />
          ) : null}
          <p className="text-xs text-[var(--ct-text-muted)]">
            {t("loan.advisor.timingIntro")}
            <InfoTip text={CALC_HELP.loanExtraTiming} />
          </p>

          {payoffSeries && payoffSeries.rows.length > 0 && (
            <>
              <Caption className="block">
                {t("charts.loanBalanceBaseline", {
                  month: payoffLabelFromMonths(payoffSeries.baselineMonths, todayStr),
                  balance: formatInr(payoffSeries.rows[0]?.baseline ?? 0),
                })}
              </Caption>
              {payoffSeries.acceleratedMonths < payoffSeries.baselineMonths ? (
                <Caption className="block">
                  {t("charts.loanBalanceLumpy", {
                    month: payoffLabelFromMonths(payoffSeries.acceleratedMonths, todayStr),
                    balance: formatInr(0),
                  })}
                </Caption>
              ) : null}
              <ToolComparisonChart
                data={sampleLoanChartRows(payoffSeries.rows)}
                titleKey="charts.loanBalanceTitle"
                baselineLabelKey="tools.loan.seriesBalanceBaseline"
                whatIfLabelKey="tools.loan.seriesPaidLumpy"
                hintKey="charts.loanBalanceHint"
                showPaymentTooltip
                yDomainTight
                singleSeriesWhenEqual
              />
            </>
          )}

          {advice.debt?.emi > 0 && (
            <div className="rounded-xl bg-violet-50/80 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-800 p-3 space-y-1.5">
              <p className="text-xs font-bold text-violet-900 dark:text-violet-100">
                {t("loan.advisor.paymentPlanTitle")}
              </p>
              <p className="text-xs leading-relaxed text-violet-900 dark:text-violet-100">
                {t("loan.advisor.emiEveryMonth", {
                  amount: formatInr(advice.debt.emi),
                  name: advice.debt.name,
                })}
              </p>
              {advice.lightMonths.length > 0 && (
                <p className="text-xs leading-relaxed text-emerald-800 dark:text-emerald-200">
                  {t("loan.advisor.extraInMonths", {
                    schedule: advice.lightMonths
                      .slice(0, 4)
                      .map((m) => `${m.label} ${formatInr(m.recommendedExtra)}`)
                      .join(" · "),
                  })}
                </p>
              )}
              {advice.heavyMonths.length > 0 && (
                <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                  {t("loan.advisor.emiOnlyHeavy", {
                    months: advice.heavyMonths
                      .slice(0, 3)
                      .map((m) => m.label)
                      .join(", "),
                  })}
                </p>
              )}
            </div>
          )}

          {advice.rows.length > 0 && (
            <div className="overflow-x-auto -mx-1 max-h-64 overflow-y-auto">
              <table className="w-full text-[11px] border-collapse">
                <thead className="sticky top-0 bg-white dark:bg-slate-900">
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-1 pr-2">{t("loan.advisor.colMonth")}</th>
                    <th className="py-1 pr-2">{t("loan.advisor.colEmi")}</th>
                    <th className="py-1 pr-2">{t("loan.advisor.colExtra")}</th>
                    <th className="py-1 pr-2 font-semibold">{t("loan.advisor.colTotalPay")}</th>
                    <th className="py-1 pr-2">{t("loan.advisor.colOtherBills")}</th>
                    <th className="py-1">{t("loan.advisor.colPress")}</th>
                  </tr>
                </thead>
                <tbody>
                  {advice.rows.map((r) => (
                    <tr
                      key={r.monthKey}
                      className={`border-b border-gray-100 dark:border-slate-700 ${
                        advice.bestForExtra?.monthKey === r.monthKey
                          ? "bg-emerald-50/80 dark:bg-emerald-950/20 font-semibold"
                          : r.heavy
                            ? "bg-red-50/50 dark:bg-red-950/20"
                            : ""
                      }`}
                    >
                      <td className="py-1.5 pr-2 whitespace-nowrap">{r.label}</td>
                      <td className="py-1.5 pr-2">{formatInr(r.loanDue)}</td>
                      <td className="py-1.5 pr-2">
                        {r.recommendedExtra > 0 ? formatInr(r.recommendedExtra) : "—"}
                      </td>
                      <td className="py-1.5 pr-2 font-semibold">{formatInr(r.totalPay)}</td>
                      <td className="py-1.5 pr-2">{formatInr(r.otherBills)}</td>
                      <td className="py-1.5 capitalize">{r.pressure}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </>
      )}
    </div>
  );
}
