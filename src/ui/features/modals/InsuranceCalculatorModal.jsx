import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../../../ui";
import ToolSourcePicker from "../tools/ToolSourcePicker.jsx";
import { analyzeInsuranceWorth, insuranceParamsFromBill } from "../../../engines/insuranceCalculator.js";
import { getBillDisplayName } from "../../../utils/billDisplayName.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateRepeatType } from "../../../i18n/domainLabels.js";
import { translateInsuranceVerdictDetail } from "../../../i18n/toolLabels.js";

const fieldClass =
  "w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm";

function InsuranceShell({ embedded, title, onClose, children }) {
  if (embedded) return <div className="ct-stack">{children}</div>;
  return (
    <Modal title={title} onClose={onClose} footer={null}>
      {children}
    </Modal>
  );
}

export default function InsuranceCalculatorModal({
  commitments,
  todayStr,
  monthlyIncome,
  onClose,
  embedded = false,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const insuranceBills = useMemo(
    () => commitments.filter((c) => c.category === "Insurance"),
    [commitments]
  );

  const pickerItems = useMemo(
    () =>
      insuranceBills.map((b) => ({
        id: String(b.id),
        raw: b,
        title: getBillDisplayName(b),
        subtitle: `₹${Number(b.amount || 0).toLocaleString("en-IN")} · ${translateRepeatType(t, b.repeatType)}`,
      })),
    [insuranceBills, t]
  );

  const [step, setStep] = useState("pick");
  const [fromBill, setFromBill] = useState(null);
  const [manualPremium, setManualPremium] = useState("");
  const [manualRepeat, setManualRepeat] = useState("monthly");

  const [form, setForm] = useState({
    insuranceTermYears: "15",
    insuranceSumAssured: "",
    insuranceMaturityBenefit: "",
    inflationPct: "6",
    monthlyIncome: monthlyIncome > 0 ? String(monthlyIncome) : "",
  });

  const pickBill = (bill) => {
    const p = insuranceParamsFromBill(bill, todayStr);
    setFromBill({
      ...p,
      displayName: getBillDisplayName(bill),
      repeatLabel: translateRepeatType(t, bill.repeatType),
    });
    setForm({
      insuranceTermYears: String(p.termYears || 15),
      insuranceSumAssured: "",
      insuranceMaturityBenefit: "",
      inflationPct: "6",
      monthlyIncome: monthlyIncome > 0 ? String(monthlyIncome) : "",
    });
    setStep("calc");
  };

  const startManual = () => {
    setFromBill({
      displayName: t("insurance.calculator.manualPolicy"),
      premiumAmount: 0,
      premiumFrequency: manualRepeat,
      repeatLabel: manualRepeat,
      recordedPremiumsPaid: 0,
      termYears: 15,
      startDate: todayStr,
    });
    setStep("manualSetup");
  };

  const applyManualPremium = () => {
    const amt = Number(manualPremium) || 0;
    if (amt <= 0) return;
    setFromBill({
      displayName: t("insurance.calculator.manualPolicy"),
      premiumAmount: amt,
      premiumFrequency: manualRepeat,
      repeatLabel: manualRepeat,
      recordedPremiumsPaid: 0,
      termYears: Number(form.insuranceTermYears) || 15,
      startDate: todayStr,
    });
    setStep("calc");
  };

  const analysis = useMemo(() => {
    if (!fromBill) return null;
    const premium = Number(fromBill.premiumAmount) || 0;
    if (premium <= 0) return null;
    return analyzeInsuranceWorth({
      premiumAmount: premium,
      premiumFrequency: fromBill.premiumFrequency,
      termYears: Number(form.insuranceTermYears) || 15,
      sumAssured: Number(form.insuranceSumAssured) || 0,
      maturityBenefit: Number(form.insuranceMaturityBenefit) || 0,
      startDate: fromBill.startDate,
      todayStr,
      recordedPremiumsPaid: fromBill.recordedPremiumsPaid,
      monthlyIncome: Number(form.monthlyIncome) || 0,
      inflationPct: Number(form.inflationPct) || 6,
    });
  }, [form, fromBill, todayStr]);

  const labelClass = "text-xs font-semibold text-gray-800 dark:text-slate-200";
  const verdictClass =
    analysis?.verdict === "positive"
      ? "bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 text-emerald-950"
      : analysis?.verdict === "negative"
        ? "bg-red-100 dark:bg-red-950/50 border-red-300 text-red-950"
        : analysis?.verdict === "mild"
          ? "bg-amber-100 dark:bg-amber-950/50 border-amber-300 text-amber-950"
          : "bg-slate-100 dark:bg-slate-800 border-slate-300 text-slate-900";

  if (step === "pick") {
    return (
      <InsuranceShell embedded={embedded} title={t("insurance.calculator.title")} onClose={onClose}>
        <ToolSourcePicker
          accent="teal"
          title={t("insurance.calculator.whichPolicy")}
          hint={t("insurance.calculator.premiumHint")}
          items={pickerItems}
          emptyMessage={t("insurance.calculator.emptyBills")}
          manualLabel={t("insurance.calculator.manual")}
          addLabel={t("insurance.calculator.addBill")}
          onPick={(item) => pickBill(item.raw)}
          onManual={startManual}
          onAdd={() => {
            if (!embedded) onClose();
            navigate("/add");
          }}
        />
      </InsuranceShell>
    );
  }

  if (step === "manualSetup") {
    return (
      <InsuranceShell embedded={embedded} title={t("insurance.calculator.title")} onClose={onClose}>
        <div className="space-y-3">
          <button type="button" onClick={() => setStep("pick")} className="text-xs font-semibold text-indigo-600">
            ← {t("insurance.calculator.back")}
          </button>
          <div>
            <label className={labelClass}>{t("insurance.calculator.premiumAmount")}</label>
            <input
              type="number"
              className={fieldClass}
              value={manualPremium}
              onChange={(e) => setManualPremium(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>{t("insurance.calculator.payFrequency")}</label>
            <select
              className={fieldClass}
              value={manualRepeat}
              onChange={(e) => setManualRepeat(e.target.value)}
            >
              <option value="monthly">{t("repeat.monthly")}</option>
              <option value="quarterly">{t("repeat.quarterly")}</option>
              <option value="yearly">{t("repeat.yearly")}</option>
            </select>
          </div>
          <button
            type="button"
            onClick={applyManualPremium}
            className="w-full py-3 rounded-xl bg-teal-600 text-white text-sm font-semibold"
          >
            {t("common.continue")}
          </button>
        </div>
      </InsuranceShell>
    );
  }

  return (
    <InsuranceShell embedded={embedded} title={t("insurance.calculator.title")} onClose={onClose}>
      {step === "calc" && fromBill && (
        <div>
          <button
            type="button"
            onClick={() => {
              setFromBill(null);
              setStep("pick");
            }}
            className="text-xs font-semibold text-indigo-700 dark:text-indigo-300"
          >
            ← {t("insurance.calculator.otherPolicies")}
          </button>

          <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 p-3 space-y-2 text-sm mt-3">
            <p className="font-semibold text-gray-900 dark:text-slate-50">{fromBill.displayName}</p>
            <p className="text-gray-700 dark:text-slate-300">
              {t("insurance.calculator.premiumLine", {
                amount: `₹${fromBill.premiumAmount.toLocaleString()}`,
                repeat: fromBill.repeatLabel,
              })}
            </p>
          </div>

          <div className="mt-3">
            <p className={labelClass}>{t("insurance.calculator.termYears")}</p>
            <input
              type="number"
              min="1"
              className={fieldClass}
              value={form.insuranceTermYears}
              onChange={(e) => setForm((f) => ({ ...f, insuranceTermYears: e.target.value }))}
            />
          </div>

          <div className="rounded-xl border-2 border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 p-4 space-y-3 mt-3">
            <p className="text-sm font-semibold text-indigo-950 dark:text-indigo-100">{t("insurance.calculator.fromDocument")}</p>
            <div>
              <label className={labelClass}>{t("insurance.calculator.sumAssured")}</label>
              <input
                type="number"
                className={fieldClass}
                value={form.insuranceSumAssured}
                onChange={(e) => setForm((f) => ({ ...f, insuranceSumAssured: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>{t("insurance.calculator.maturityPayout")}</label>
              <input
                type="number"
                className={fieldClass}
                value={form.insuranceMaturityBenefit}
                onChange={(e) => setForm((f) => ({ ...f, insuranceMaturityBenefit: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <div>
              <label className={labelClass}>{t("insurance.calculator.monthlyIncome")}</label>
              <input
                type="number"
                className={fieldClass}
                value={form.monthlyIncome}
                onChange={(e) => setForm((f) => ({ ...f, monthlyIncome: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>{t("insurance.calculator.inflation")}</label>
              <input
                type="number"
                className={fieldClass}
                value={form.inflationPct}
                onChange={(e) => setForm((f) => ({ ...f, inflationPct: e.target.value }))}
              />
            </div>
          </div>

          {analysis && Number(form.insuranceMaturityBenefit) > 0 && (
            <div className="space-y-3 pt-3">
              <p className={`text-sm font-semibold rounded-xl border px-3 py-2.5 ${verdictClass}`}>
                {t(`insurance.verdict.${analysis.verdict || "unknown"}`)}
              </p>
              <p className="text-xs text-gray-700 dark:text-slate-300">{translateInsuranceVerdictDetail(t, analysis)}</p>
            </div>
          )}

          {!embedded && (
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 mt-4 text-sm font-semibold bg-slate-200 dark:bg-slate-700 rounded-xl"
            >
              {t("common.done")}
            </button>
          )}
        </div>
      )}
    </InsuranceShell>
  );
}
