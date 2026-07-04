import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Caption, inputClassName } from "../../../ui";
import ToolSourcePicker from "../tools/ToolSourcePicker.jsx";
import { analyzeInsuranceWorth, insuranceParamsFromBill } from "../../../engines/insuranceCalculator.js";
import { getBillDisplayName } from "../../../utils/billDisplayName.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateRepeatType } from "../../../i18n/domainLabels.js";
import { translateInsuranceVerdictDetail } from "../../../i18n/toolLabels.js";
import { formatInr } from "../../../constants/symbols.js";

const fieldClass = `${inputClassName()} `;

function InsuranceShell({ embedded, title, onClose, children }) {
  if (embedded) return <div className="ed-stack">{children}</div>;
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

  const labelClass = "ed-field-label";
  const verdictTone =
    analysis?.verdict === "positive"
      ? "wealth"
      : analysis?.verdict === "negative"
        ? "survival"
        : analysis?.verdict === "mild"
          ? "festival"
          : "pressure";

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
        <div className="ed-stack-sm">
          <Button type="button" variant="ghost" size="sm" className="!px-0" onClick={() => setStep("pick")}>
            ← {t("insurance.calculator.back")}
          </Button>
          <div>
            <label className={labelClass}>{t("insurance.calculator.premiumAmount")}</label>
            <input
              type="number"
              className={`${fieldClass} ed-numeral`}
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
          <Button type="button" variant="primary" className="w-full" onClick={applyManualPremium}>
            {t("common.continue")}
          </Button>
        </div>
      </InsuranceShell>
    );
  }

  return (
    <InsuranceShell embedded={embedded} title={t("insurance.calculator.title")} onClose={onClose}>
      {step === "calc" && fromBill && (
        <div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="!px-0"
            onClick={() => {
              setFromBill(null);
              setStep("pick");
            }}
          >
            ← {t("insurance.calculator.otherPolicies")}
          </Button>

          <div className="ed-inset ed-stack-sm mt-3">
<p className="font-semibold relative">{fromBill.displayName}</p>
            <Caption className="block relative">
              {t("insurance.calculator.premiumLine", {
                amount: formatInr(fromBill.premiumAmount),
                repeat: fromBill.repeatLabel,
              })}
            </Caption>
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

          <div className="ed-inset ed-stack-sm mt-3">
            <p className={labelClass}>{t("insurance.calculator.fromDocument")}</p>
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
            <div className="ed-stack-sm pt-3">
              <div className={`ed-inset ${verdictTone}`}>
                <p className="ed-kicker relative">{t(`insurance.verdict.${analysis.verdict || "unknown"}`)}</p>
              </div>
              <Caption className="block">{translateInsuranceVerdictDetail(t, analysis)}</Caption>
            </div>
          )}

          {!embedded && (
            <Button type="button" variant="outline" className="w-full mt-4" onClick={onClose}>
              {t("common.done")}
            </Button>
          )}
        </div>
      )}
    </InsuranceShell>
  );
}
