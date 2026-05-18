import Card from "../Card.jsx";
import InfoTip from "../InfoTip.jsx";
import { CALC_HELP } from "../../constants/calculationHelp.js";
import { formatInr } from "../../constants/symbols.js";

const SURVIVAL_COPY = {
  salaried: { title: "Salary survival", sub: "If paycheck stops today" },
  power: { title: "Runway", sub: "If income stops today" },
  freelancer: { title: "Income gap survival", sub: "Low-income months" },
  family: { title: "Household runway", sub: "If main income stops" },
};

export default function SurvivalCard({ survival, mode = "salaried" }) {
  if (!survival) return null;
  const copy = SURVIVAL_COPY[mode] || SURVIVAL_COPY.salaried;
  return (
    <Card className="space-y-3 border-l-4 border-l-indigo-500">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100 inline-flex items-center">
            {copy.title}
            <InfoTip text={CALC_HELP.survivalMonths} />
          </h2>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{copy.sub}</p>
        </div>
        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${survival.badgeClass}`}>
          {survival.tierLabel}
        </span>
      </div>
      <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed">{survival.headline}</p>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-gray-50 dark:bg-slate-800/80 p-2">
          <p className="text-gray-500">Monthly burn</p>
          <p className="font-semibold text-gray-900 dark:text-slate-100">{formatInr(survival.monthlyBurn)}</p>
        </div>
        <div className="rounded-lg bg-gray-50 dark:bg-slate-800/80 p-2">
          <p className="text-gray-500">Liquid savings</p>
          <p className="font-semibold text-gray-900 dark:text-slate-100">{formatInr(survival.liquidSavings)}</p>
        </div>
      </div>
    </Card>
  );
}
