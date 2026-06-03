import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../../../ui";
import ToolSourcePicker from "../tools/ToolSourcePicker.jsx";
import { analyzeInsuranceWorth, insuranceParamsFromBill } from "../../../engines/insuranceCalculator.js";
import { getBillDisplayName } from "../../../utils/billDisplayName.js";
import { repeatTypeLabel } from "../../../constants/repeatTypes.js";

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm";

export default function InsuranceCalculatorModal({ commitments, todayStr, monthlyIncome, onClose }) {
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
        subtitle: `₹${Number(b.amount || 0).toLocaleString("en-IN")} · ${repeatTypeLabel(b.repeatType)}`,
      })),
    [insuranceBills]
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
      repeatLabel: repeatTypeLabel(bill.repeatType),
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
      displayName: "Manual policy",
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
      displayName: "Manual policy",
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
      <Modal title="Insurance return" onClose={onClose} footer={null}>
        <ToolSourcePicker
          accent="teal"
          title="Which policy should we analyze?"
          hint="We use premium from your bill when you pick one."
          items={pickerItems}
          emptyMessage="No insurance bills saved yet."
          manualLabel="Check without adding a bill"
          addLabel="Add insurance bill"
          onPick={(item) => pickBill(item.raw)}
          onManual={startManual}
          onAdd={() => {
            onClose();
            navigate("/add");
          }}
        />
      </Modal>
    );
  }

  if (step === "manualSetup") {
    return (
      <Modal title="Insurance return" onClose={onClose} footer={null}>
        <div className="space-y-3">
          <button type="button" onClick={() => setStep("pick")} className="text-xs font-semibold text-indigo-600">
            ← Back
          </button>
          <div>
            <label className={labelClass}>Premium amount (₹)</label>
            <input
              type="number"
              className={inputClass}
              value={manualPremium}
              onChange={(e) => setManualPremium(e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>How often you pay</label>
            <select
              className={inputClass}
              value={manualRepeat}
              onChange={(e) => setManualRepeat(e.target.value)}
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
          <button
            type="button"
            onClick={applyManualPremium}
            className="w-full py-3 rounded-xl bg-teal-600 text-white text-sm font-semibold"
          >
            Continue
          </button>
        </div>
      </Modal>
    );
  }

  return (
    <Modal title="Insurance return" onClose={onClose} footer={null}>
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
            ← Other policies
          </button>

          <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 p-3 space-y-2 text-sm mt-3">
            <p className="font-semibold text-gray-900 dark:text-slate-50">{fromBill.displayName}</p>
            <p className="text-gray-700 dark:text-slate-300">
              Premium: ₹{fromBill.premiumAmount.toLocaleString()} · {fromBill.repeatLabel}
            </p>
          </div>

          <div className="mt-3">
            <p className={labelClass}>Policy term (years)</p>
            <input
              type="number"
              min="1"
              className={inputClass}
              value={form.insuranceTermYears}
              onChange={(e) => setForm((f) => ({ ...f, insuranceTermYears: e.target.value }))}
            />
          </div>

          <div className="rounded-xl border-2 border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 p-4 space-y-3 mt-3">
            <p className="text-sm font-semibold text-indigo-950 dark:text-indigo-100">From your policy document</p>
            <div>
              <label className={labelClass}>Sum assured (₹)</label>
              <input
                type="number"
                className={inputClass}
                value={form.insuranceSumAssured}
                onChange={(e) => setForm((f) => ({ ...f, insuranceSumAssured: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Expected maturity payout (₹)</label>
              <input
                type="number"
                className={inputClass}
                value={form.insuranceMaturityBenefit}
                onChange={(e) => setForm((f) => ({ ...f, insuranceMaturityBenefit: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <div>
              <label className={labelClass}>Monthly income (₹)</label>
              <input
                type="number"
                className={inputClass}
                value={form.monthlyIncome}
                onChange={(e) => setForm((f) => ({ ...f, monthlyIncome: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Inflation %</label>
              <input
                type="number"
                className={inputClass}
                value={form.inflationPct}
                onChange={(e) => setForm((f) => ({ ...f, inflationPct: e.target.value }))}
              />
            </div>
          </div>

          {analysis && Number(form.insuranceMaturityBenefit) > 0 && (
            <div className="space-y-3 pt-3">
              <p className={`text-sm font-semibold rounded-xl border px-3 py-2.5 ${verdictClass}`}>
                {analysis.verdictLabel}
              </p>
              <p className="text-xs text-gray-700 dark:text-slate-300">{analysis.verdictDetail}</p>
            </div>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 mt-4 text-sm font-semibold bg-slate-200 dark:bg-slate-700 rounded-xl"
          >
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}
