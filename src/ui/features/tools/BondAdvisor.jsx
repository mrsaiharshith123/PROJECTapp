import { useMemo, useState } from "react";
import { analyzeBond } from "../../../engines/bondAnalyzer.js";
import { formatInr } from "../../../constants/symbols.js";

const inputClass =
  "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-sm";

export default function BondAdvisor({ monthlyIncome = 0 }) {
  const [form, setForm] = useState({
    bondType: "government",
    amount: "",
    faceValue: "",
    purchasePrice: "",
    couponRatePct: "",
    payoutFrequency: "yearly",
    yearsToMaturity: "5",
    taxRatePct: "20",
    inflationPct: "6",
  });

  const result = useMemo(
    () =>
      analyzeBond({
        ...form,
        monthlyIncome,
      }),
    [form, monthlyIncome]
  );

  const verdictClass =
    result.recommendation === "Good"
      ? "bg-emerald-100 text-emerald-800"
      : result.recommendation === "Not good"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-800";

  const setField = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500">
        Check if a bond return is worth it after tax and inflation, and whether it fits your salary.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="text-xs font-semibold text-gray-700">Bond type</label>
          <select className={inputClass} value={form.bondType} onChange={(e) => setField("bondType", e.target.value)}>
            <option value="government">Government</option>
            <option value="corporate">Corporate</option>
            <option value="taxfree">Tax-free</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700">Investment amount (₹)</label>
          <input className={inputClass} value={form.amount} onChange={(e) => setField("amount", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700">Face value (₹)</label>
          <input className={inputClass} value={form.faceValue} onChange={(e) => setField("faceValue", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700">Purchase price (₹)</label>
          <input
            className={inputClass}
            value={form.purchasePrice}
            onChange={(e) => setField("purchasePrice", e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700">Coupon rate %</label>
          <input
            className={inputClass}
            value={form.couponRatePct}
            onChange={(e) => setField("couponRatePct", e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700">Payout frequency</label>
          <select
            className={inputClass}
            value={form.payoutFrequency}
            onChange={(e) => setField("payoutFrequency", e.target.value)}
          >
            <option value="yearly">Yearly</option>
            <option value="half-yearly">Half-yearly</option>
            <option value="quarterly">Quarterly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700">Years to maturity</label>
          <input
            className={inputClass}
            value={form.yearsToMaturity}
            onChange={(e) => setField("yearsToMaturity", e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700">Tax slab %</label>
          <input className={inputClass} value={form.taxRatePct} onChange={(e) => setField("taxRatePct", e.target.value)} />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700">Inflation %</label>
          <input
            className={inputClass}
            value={form.inflationPct}
            onChange={(e) => setField("inflationPct", e.target.value)}
          />
        </div>
      </div>

      <div className={`rounded-xl px-3 py-2 text-sm font-semibold ${verdictClass}`}>{result.recommendation}</div>
      <p className="text-xs text-gray-600">{result.detail}</p>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-[11px] text-gray-500">Annual yield</p>
          <p className="font-semibold">{result.annualYieldPct.toFixed(2)}%</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-[11px] text-gray-500">Post-tax yield</p>
          <p className="font-semibold">{result.postTaxYieldPct.toFixed(2)}%</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-[11px] text-gray-500">Real return</p>
          <p className="font-semibold">{result.realReturnPct.toFixed(2)}%</p>
        </div>
        <div className="rounded-xl bg-gray-50 p-3">
          <p className="text-[11px] text-gray-500">Monthly set-aside</p>
          <p className="font-semibold">{formatInr(Math.round(result.monthlySetAside))}</p>
        </div>
      </div>
      {result.affordabilityPct != null && (
        <p className="text-xs text-gray-600">
          Approx salary load: <strong>{result.affordabilityPct.toFixed(1)}%</strong> of monthly income.
        </p>
      )}
    </div>
  );
}
