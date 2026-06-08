import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InfoTip } from "../../primitives/InfoTip.jsx";
import ToolSourcePicker from "./ToolSourcePicker.jsx";
import { CALC_HELP } from "../../../constants/calculationHelp.js";
import { adviseLoanExtraPaymentMonths, listDebtSources } from "../../../engines/loanPayoffTiming.js";
import { formatInr } from "../../../constants/symbols.js";
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
          <p className="text-xs text-gray-500 dark:text-slate-400">
            {t("loan.advisor.timingIntro")}
            <InfoTip text={CALC_HELP.loanExtraTiming} />
          </p>

          {advice.summary && (
            <p className="rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 p-3 text-xs leading-relaxed text-indigo-900 dark:text-indigo-100">
              {advice.summary}
            </p>
          )}

          {advice.bestForExtra?.goodForExtra && (
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 p-3 text-xs space-y-1">
              <p className="font-semibold text-emerald-900">{t("loan.advisor.bestMonth")}</p>
              <p>
                {t("loan.advisor.bestMonthLine", {
                  label: advice.bestForExtra.label,
                  extra: formatInr(advice.bestForExtra.extraCapacity),
                  bills: formatInr(advice.bestForExtra.otherBills),
                })}
              </p>
              {advice.bestForExtra.interestSaved > 0 && (
                <p>
                  {t("loan.advisor.interestSavedYear", {
                    amount: formatInr(advice.bestForExtra.interestSaved),
                  })}
                </p>
              )}
            </div>
          )}

          {advice.rows.length > 0 && (
            <div className="overflow-x-auto -mx-1 max-h-56 overflow-y-auto">
              <table className="w-full text-[11px] border-collapse">
                <thead className="sticky top-0 bg-white dark:bg-slate-900">
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-1 pr-2">{t("loan.advisor.colMonth")}</th>
                    <th className="py-1 pr-2">{t("loan.advisor.colOtherBills")}</th>
                    <th className="py-1 pr-2">{t("loan.advisor.colLoanDue")}</th>
                    <th className="py-1 pr-2">{t("loan.advisor.colFree")}</th>
                    <th className="py-1 pr-2">{t("loan.advisor.colExtraRoom")}</th>
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
                      <td className="py-1.5 pr-2">{formatInr(r.otherBills)}</td>
                      <td className="py-1.5 pr-2">{formatInr(r.loanDue)}</td>
                      <td className="py-1.5 pr-2">{formatInr(r.freeAfter)}</td>
                      <td className="py-1.5 pr-2">{formatInr(r.extraCapacity)}</td>
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
