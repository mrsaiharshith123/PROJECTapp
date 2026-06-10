import { useMemo, useState } from "react";
import { analyzeBond, compareBondAlternatives } from "../../../engines/bondAnalyzer.js";
import { formatInr } from "../../../constants/symbols.js";
import { ProGate } from "../../patterns/ProGate.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { translateBondRecommendation } from "../../../i18n/toolLabels.js";

const fieldClass =
  "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-sm";

export default function BondAdvisor({ monthlyIncome = 0 }) {
  const { t } = useTranslation();
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
    creditRating: "unrated",
  });

  const result = useMemo(
    () =>
      analyzeBond({
        ...form,
        monthlyIncome,
      }),
    [form, monthlyIncome],
  );

  const compare = useMemo(
    () =>
      compareBondAlternatives({
        ...form,
        monthlyIncome,
      }),
    [form, monthlyIncome],
  );

  const verdictClass =
    result.recommendation === "Good"
      ? "bg-emerald-100 text-emerald-800"
      : result.recommendation === "Not good"
        ? "bg-red-100 text-red-700"
        : "bg-amber-100 text-amber-800";

  const setField = (k, v) => setForm((s) => ({ ...s, [k]: v }));

  const payoutOptions = [
    { value: "yearly", label: t("bond.payout.yearly") },
    { value: "half-yearly", label: t("bond.payout.halfYearly") },
    { value: "quarterly", label: t("bond.payout.quarterly") },
    { value: "monthly", label: t("bond.payout.monthly") },
  ];

  return (
    <ProGate featureId="bond_advisor">
      <div className="space-y-3">
        <p className="text-xs text-gray-500">{t("bond.intro")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold text-gray-700">{t("bond.bondType")}</label>
            <select className={fieldClass} value={form.bondType} onChange={(e) => setField("bondType", e.target.value)}>
              <option value="government">{t("bond.type.government")}</option>
              <option value="corporate">{t("bond.type.corporate")}</option>
              <option value="taxfree">{t("bond.type.taxfree")}</option>
              <option value="sgb">{t("bond.type.sgb")}</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">{t("bond.creditRating")}</label>
            <select
              className={fieldClass}
              value={form.creditRating}
              onChange={(e) => setField("creditRating", e.target.value)}
            >
              {["AAA", "AA", "A", "BBB", "BB", "B", "unrated"].map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">{t("bond.investmentAmount")}</label>
            <input className={fieldClass} value={form.amount} onChange={(e) => setField("amount", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">{t("bond.faceValue")}</label>
            <input className={fieldClass} value={form.faceValue} onChange={(e) => setField("faceValue", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">{t("bond.purchasePrice")}</label>
            <input
              className={fieldClass}
              value={form.purchasePrice}
              onChange={(e) => setField("purchasePrice", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">{t("bond.couponRate")}</label>
            <input
              className={fieldClass}
              value={form.couponRatePct}
              onChange={(e) => setField("couponRatePct", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">{t("bond.payoutFrequency")}</label>
            <select
              className={fieldClass}
              value={form.payoutFrequency}
              onChange={(e) => setField("payoutFrequency", e.target.value)}
            >
              {payoutOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">{t("bond.yearsToMaturity")}</label>
            <input
              className={fieldClass}
              value={form.yearsToMaturity}
              onChange={(e) => setField("yearsToMaturity", e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">{t("bond.taxSlab")}</label>
            <input className={fieldClass} value={form.taxRatePct} onChange={(e) => setField("taxRatePct", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-700">{t("bond.inflation")}</label>
            <input
              className={fieldClass}
              value={form.inflationPct}
              onChange={(e) => setField("inflationPct", e.target.value)}
            />
          </div>
        </div>

        <div className={`rounded-xl px-3 py-2 text-sm font-semibold ${verdictClass}`}>
          {translateBondRecommendation(t, result.recommendation)}
        </div>
        <p className="text-xs text-gray-600">{t(result.detailKey || "bond.detail.borderline")}</p>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-[11px] text-gray-500">{t("bond.ytm")}</p>
            <p className="font-semibold">{result.ytmPct.toFixed(2)}%</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-[11px] text-gray-500">{t("bond.annualYield")}</p>
            <p className="font-semibold">{result.annualYieldPct.toFixed(2)}%</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-[11px] text-gray-500">{t("bond.postTaxYield")}</p>
            <p className="font-semibold">{result.postTaxYieldPct.toFixed(2)}%</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-[11px] text-gray-500">{t("bond.realReturn")}</p>
            <p className="font-semibold">{result.realReturnPct.toFixed(2)}%</p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3">
            <p className="text-[11px] text-gray-500">{t("bond.monthlySetAside")}</p>
            <p className="font-semibold">{formatInr(Math.round(result.monthlySetAside))}</p>
          </div>
        </div>
        {result.affordabilityPct != null && (
          <p className="text-xs text-gray-600">
            {t("bond.salaryLoad", { percent: result.affordabilityPct.toFixed(1) })}
          </p>
        )}
        <div className="pt-2 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-700 mb-2">{t("bond.compareTitle")}</p>
          <ul className="space-y-1 text-xs text-gray-600">
            {compare.map((row) => (
              <li key={row.id} className="flex justify-between gap-2">
                <span>{t(row.labelKey)}</span>
                <span>
                  {row.postTaxYieldPct.toFixed(1)}% · {translateBondRecommendation(t, row.recommendation)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </ProGate>
  );
}
