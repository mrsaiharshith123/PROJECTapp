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
import { inputClassName } from "../../primitives/Input.jsx";
import { ToolAnswerHero } from "../../patterns/ToolAnswerHero.jsx";
import { ToneSurface } from "../../patterns/ToneSurface.jsx";
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

const fieldClass = `${inputClassName()} `;

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
    <div className="ed-stack text-sm">
      <button
        type="button"
        onClick={() => {
          setTarget(null);
          setStep("pick");
        }}
        className="ed-link !text-xs"
      >
        ← {t("loan.advisor.chooseAnother")}
      </button>

      {step === "manual" && (
        <div className="ed-grid-2">
          <div className="sm:col-span-2">
            <label className="ed-field-label">{t("loan.advisor.loanName")}</label>
            <input
              className={fieldClass}
              value={manual.name}
              onChange={(e) => setManual((m) => ({ ...m, name: e.target.value }))}
              placeholder={t("loan.advisor.phName")}
            />
          </div>
          <div>
            <label className="ed-field-label">{t("loan.advisor.balanceLeft")}</label>
            <input
              type="number"
              className={fieldClass}
              value={manual.balance}
              onChange={(e) => setManual((m) => ({ ...m, balance: e.target.value }))}
            />
          </div>
          <div>
            <label className="ed-field-label">{t("loan.advisor.regularPayment")}</label>
            <input
              type="number"
              className={fieldClass}
              value={manual.emi}
              onChange={(e) => setManual((m) => ({ ...m, emi: e.target.value }))}
            />
          </div>
          <div>
            <label className="ed-field-label">{t("loan.advisor.interestOptional")}</label>
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
        <div className="ed-inset text-xs">
          <p className="ed-stat-value text-sm font-semibold">{target.title}</p>
          <p className="ed-stat-label mt-0.5">{target.subtitle}</p>
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
          <p className="text-xs text-[var(--ed-muted-text)]">
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
            <ToneSurface tone="info" className="ed-stack-sm text-xs">
              <p className="font-bold">
                {t("loan.advisor.paymentPlanTitle")}
              </p>
              <p className="leading-relaxed">
                {t("loan.advisor.emiEveryMonth", {
                  amount: formatInr(advice.debt.emi),
                  name: advice.debt.name,
                })}
              </p>
              {advice.lightMonths.length > 0 && (
                <p className="leading-relaxed ed-success-text">
                  {t("loan.advisor.extraInMonths", {
                    schedule: advice.lightMonths
                      .slice(0, 4)
                      .map((m) => `${m.label} ${formatInr(m.recommendedExtra)}`)
                      .join(" · "),
                  })}
                </p>
              )}
              {advice.heavyMonths.length > 0 && (
                <p className="leading-relaxed ed-field-note">
                  {t("loan.advisor.emiOnlyHeavy", {
                    months: advice.heavyMonths
                      .slice(0, 3)
                      .map((m) => m.label)
                      .join(", "),
                  })}
                </p>
              )}
            </ToneSurface>
          )}

          {advice.rows.length > 0 && (
            <div className="overflow-x-auto -mx-1 max-h-64 overflow-y-auto">
              <table className="w-full text-[11px] border-collapse">
                <thead className="sticky top-0 bg-[var(--ed-surface)]">
                  <tr className="text-left ed-caption border-b">
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
                      className={`border-b border-[var(--ed-rule-soft)] ${ advice.bestForExtra?.monthKey === r.monthKey ? "bg-[var(--ed-green-soft)] font-semibold" : r.heavy ? "bg-[var(--ed-red-soft)]" : "" }`}
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
