import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "./Modal.jsx";
import { analyzeInsuranceWorth, insuranceParamsFromBill } from "../engines/insuranceCalculator.js";
import { getBillDisplayName } from "../utils/billDisplayName.js";
import { repeatTypeLabel } from "../constants/repeatTypes.js";

export default function InsuranceCalculatorModal({ commitments, todayStr, monthlyIncome, onClose }) {
  const navigate = useNavigate();
  const insuranceBills = useMemo(
    () => commitments.filter((c) => c.category === "Insurance"),
    [commitments]
  );

  const [step, setStep] = useState(insuranceBills.length ? "pick" : "empty");
  const [fromBill, setFromBill] = useState(null);

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

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 text-sm";

  const labelClass = "text-xs font-semibold text-gray-800 dark:text-slate-200";

  const verdictClass =
    analysis?.verdict === "positive"
      ? "bg-emerald-100 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100"
      : analysis?.verdict === "negative"
        ? "bg-red-100 dark:bg-red-950/50 border-red-300 dark:border-red-700 text-red-950 dark:text-red-100"
        : analysis?.verdict === "mild"
          ? "bg-amber-100 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100"
          : "bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100";

  return (
    <Modal title="Insurance return" onClose={onClose} footer={null}>
      {step === "empty" && (
        <div className="space-y-4 text-center py-4">
          <p className="text-sm text-gray-700 dark:text-slate-200">
            Add an insurance bill first (category Insurance), then come back to estimate returns.
          </p>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/add");
            }}
            className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold"
          >
            Add insurance bill
          </button>
        </div>
      )}

      {step === "pick" && (
        <div className="space-y-3">
          <p className="text-sm text-gray-800 dark:text-slate-100 leading-relaxed">
            Tap a policy you already added. We already know your premium and payment repeat — you only add what the
            bill does not store.
          </p>
          <ul className="space-y-2 max-h-56 overflow-y-auto">
            {insuranceBills.map((b) => (
              <li key={b.id}>
                <button
                  type="button"
                  onClick={() => pickBill(b)}
                  className="w-full text-left px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 hover:border-teal-500 dark:hover:border-teal-400 transition"
                >
                  <p className="font-semibold text-gray-900 dark:text-slate-50">{getBillDisplayName(b)}</p>
                  <p className="text-xs text-gray-600 dark:text-slate-300 mt-1">
                    ₹{Number(b.amount || 0).toLocaleString()} · {repeatTypeLabel(b.repeatType)}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

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

          <div className="rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 p-3 space-y-2 text-sm">
            <p className="font-semibold text-gray-900 dark:text-slate-50">{fromBill.displayName}</p>
            <p className="text-gray-700 dark:text-slate-300">
              <span className="text-gray-500 dark:text-slate-400">Premium:</span> ₹
              {fromBill.premiumAmount.toLocaleString()} · {fromBill.repeatLabel}
            </p>
            <p className="text-gray-700 dark:text-slate-300">
              <span className="text-gray-500 dark:text-slate-400">Paid so far (recorded):</span> ₹
              {fromBill.recordedPremiumsPaid.toLocaleString()}
            </p>
          </div>

          <div>
            <p className={labelClass}>How long is the policy? (years)</p>
            <input
              type="number"
              min="1"
              className={inputClass}
              value={form.insuranceTermYears}
              onChange={(e) => setForm((f) => ({ ...f, insuranceTermYears: e.target.value }))}
            />
          </div>

          <div className="rounded-xl border-2 border-indigo-200 dark:border-indigo-700 bg-indigo-50 dark:bg-indigo-950/40 p-4 space-y-3">
            <p className="text-sm font-semibold text-indigo-950 dark:text-indigo-100">What we need from you</p>
            <p className="text-xs text-indigo-900/90 dark:text-indigo-200/90 leading-relaxed">
              <strong>Sum assured</strong> is the protection amount — paid to your family if something happens to you
              during the policy. <strong>Maturity payout</strong> is the lump sum you get back if you survive until the
              end (from your policy document / agent quote).
            </p>
            <div>
              <label className={labelClass}>Sum assured (₹)</label>
              <input
                type="number"
                min="0"
                className={inputClass}
                value={form.insuranceSumAssured}
                onChange={(e) => setForm((f) => ({ ...f, insuranceSumAssured: e.target.value }))}
                placeholder="Cover amount on death"
              />
            </div>
            <div>
              <label className={labelClass}>Expected maturity payout (₹)</label>
              <input
                type="number"
                min="0"
                className={inputClass}
                value={form.insuranceMaturityBenefit}
                onChange={(e) => setForm((f) => ({ ...f, insuranceMaturityBenefit: e.target.value }))}
                placeholder="Amount at end of term"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Monthly salary (₹)</label>
              <input
                type="number"
                min="0"
                className={inputClass}
                value={form.monthlyIncome}
                onChange={(e) => setForm((f) => ({ ...f, monthlyIncome: e.target.value }))}
              />
            </div>
            <div>
              <label className={labelClass}>Inflation (% per year)</label>
              <input
                type="number"
                min="0"
                max="15"
                step="0.5"
                className={inputClass}
                value={form.inflationPct}
                onChange={(e) => setForm((f) => ({ ...f, inflationPct: e.target.value }))}
              />
            </div>
          </div>

          {analysis && Number(form.insuranceMaturityBenefit) > 0 && (
            <div className="space-y-3 pt-1">
              <p className={`text-sm font-semibold rounded-xl border px-3 py-2.5 ${verdictClass}`}>
                {analysis.verdictLabel}
              </p>
              <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed">{analysis.verdictDetail}</p>

              <div>
                <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 p-2">
                  <p className="text-gray-600 dark:text-slate-400">Premiums paid</p>
                  <p className="font-bold text-gray-900 dark:text-slate-50">
                    ₹{analysis.totalPremiumsPaid.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 p-2">
                  <p className="text-gray-600 dark:text-slate-400">Still to pay</p>
                  <p className="font-bold text-amber-800 dark:text-amber-200">
                    ₹{analysis.remainingPremiumCost.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 p-2">
                  <p className="text-gray-600 dark:text-slate-400">Maturity (today&apos;s money)</p>
                  <p className="font-bold text-indigo-800 dark:text-indigo-200">
                    ₹{analysis.maturityInTodaysMoney.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 p-2">
                  <p className="text-gray-600 dark:text-slate-400">Gain vs all premiums</p>
                  <p
                    className={`font-bold ${analysis.realGainVsAllPremiums >= 0 ? "text-emerald-800 dark:text-emerald-200" : "text-red-700 dark:text-red-300"}`}
                  >
                    ₹{analysis.realGainVsAllPremiums.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {(!form.insuranceMaturityBenefit || Number(form.insuranceMaturityBenefit) <= 0) && (
            <p className="text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
              Enter maturity payout to see if the policy was worth the premiums.
            </p>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-sm font-semibold text-gray-800 dark:text-slate-100 bg-slate-200 dark:bg-slate-700 rounded-xl"
          >
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}
