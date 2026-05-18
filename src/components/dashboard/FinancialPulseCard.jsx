import { useMemo, useState } from "react";
import Card from "../Card.jsx";
import InfoTip from "../InfoTip.jsx";
import { CALC_HELP } from "../../constants/calculationHelp.js";
import { formatInr } from "../../constants/symbols.js";
import { PROFILE_SETTINGS_HINT } from "../../constants/plainLanguage.js";
import { healthLevelBadgeClass } from "../../engines/financialHealth.js";
import { useCommitIntel } from "../../hooks/useCommitIntel.js";
import { useStabilityIntel } from "../../hooks/useStabilityIntel.js";
import { showSalariedStabilityCards } from "../../constants/modeExperience.js";
import { useCommitTrack } from "../../context/CommitTrackContext.jsx";

const TABS = [
  { id: "snapshot", label: "Summary" },
  { id: "pressure", label: "Pressure" },
  { id: "tips", label: "Tips" },
];

function toneClass(tone) {
  if (tone === "critical") return "bg-red-50 border-red-100 text-red-900 dark:bg-red-950/40 dark:border-red-900 dark:text-red-200";
  if (tone === "warning") return "bg-amber-50 border-amber-100 text-amber-900 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-200";
  if (tone === "positive") return "bg-emerald-50 border-emerald-100 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-900 dark:text-emerald-200";
  return "bg-gray-50 border-gray-100 text-gray-800 dark:bg-slate-800/50 dark:border-slate-600 dark:text-slate-200";
}

function mergeTips(intel, stable) {
  const seen = new Set();
  const out = [];
  const add = (item) => {
    if (!item?.text || seen.has(item.id)) return;
    seen.add(item.id);
    out.push(item);
  };

  const skip = new Set(["stress-contributors", "emi-pct"]);
  for (const ins of intel.insights) {
    if (skip.has(ins.id)) continue;
    add(ins);
  }
  for (const ins of stable.stabilityInsights || []) {
    if (skip.has(ins.id)) continue;
    add(ins);
  }
  for (const f of intel.forecast || []) {
    add({ id: `forecast-${f.id}`, tone: "info", text: f.text });
  }
  (intel.subscriptionLeak?.insights || []).forEach((text, i) => {
    add({ id: `sub-leak-${i}`, tone: "warning", text });
  });
  if (stable.lifestyle?.message) {
    add({ id: "lifestyle-inflation", tone: "info", text: stable.lifestyle.message });
  }
  return out;
}

/** One card with Summary / Pressure / Tips — replaces stacked insight sections on Home. */
export default function FinancialPulseCard() {
  const intel = useCommitIntel();
  const stable = useStabilityIntel();
  const { settings } = useCommitTrack();
  const mode = settings.userMode || "salaried";
  const showPressure = showSalariedStabilityCards(mode);

  const tips = useMemo(() => mergeTips(intel, stable), [intel, stable]);
  const stress = stable.stress;
  const emergency = stable.emergency;
  const payoffRec = intel.payoffRec;

  const defaultTab = showPressure && stress?.top?.length ? "pressure" : "snapshot";
  const [tab, setTab] = useState(defaultTab);

  const visibleTabs = TABS.filter((t) => t.id !== "pressure" || showPressure);

  return (
    <Card className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-gray-800 dark:text-slate-100">Financial pulse</h2>
        <div className="flex rounded-xl bg-gray-100 dark:bg-slate-800 p-0.5">
          {visibleTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                tab === t.id
                  ? "bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-sm"
                  : "text-gray-500 dark:text-slate-400"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "snapshot" && (
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-gray-500 dark:text-slate-400 inline-flex items-center">
              Pressure score
              <InfoTip text={CALC_HELP.pressureScore} />
            </span>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${intel.stability.badgeClass}`}>
              {intel.stability.label} · {intel.stability.score}/100
            </span>
          </div>
          <p className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
            {intel.stability.committedPercent != null ? (
              <>
                {intel.stability.committedPercent}% of income to monthly dues
                <InfoTip text={CALC_HELP.committedPercent} />
              </>
            ) : (
              PROFILE_SETTINGS_HINT
            )}
            . Free after dues: {formatInr(Math.round(intel.stability.freeMoney))}
            <InfoTip text={CALC_HELP.freeCash} />.
          </p>
          <p className="text-xs text-gray-600 dark:text-slate-300">
            Health:{" "}
            <span className={`font-medium ${healthLevelBadgeClass(intel.health.level).split(" ").slice(1).join(" ")}`}>
              {intel.health.label} ({intel.health.score})
            </span>
            <InfoTip text={CALC_HELP.healthScore} />
            {" · "}Yearly burden est. {formatInr(Math.round(intel.yearlyBurden))}.
          </p>
          {emergency && emergency.recommended > 0 && (
            <div className="rounded-xl bg-gray-50 dark:bg-slate-800/80 p-3 space-y-1">
              <p className="text-xs font-semibold text-gray-700 dark:text-slate-200 inline-flex items-center">
                Emergency reserve
                <InfoTip text={CALC_HELP.emergencyReserve} />
              </p>
              <p className="text-xs text-gray-500">{emergency.message}</p>
              <div className="h-1.5 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${Math.min(100, emergency.progressPercent)}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-500">
                {formatInr(emergency.current)} / {formatInr(emergency.recommended)} target
              </p>
            </div>
          )}
        </div>
      )}

      {tab === "pressure" && showPressure && (
        <div className="space-y-3">
          <p className="text-xs text-gray-500 dark:text-slate-400">
            From bills you added in Commitments — estimated monthly share
            <InfoTip text={CALC_HELP.pressureWeight} />
          </p>
          {stress?.top?.length ? (
            <>
              <ol className="space-y-2">
                {stress.top.map((r, i) => (
                  <li key={r.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="text-gray-700 dark:text-slate-300 truncate">
                      {i + 1}. {r.name}
                      <span className="text-gray-400 text-xs ml-1">({r.category})</span>
                    </span>
                    <span className="font-semibold shrink-0">{formatInr(Math.round(r.weight))}/mo est.</span>
                  </li>
                ))}
              </ol>
              {payoffRec && (
                <p className="text-sm rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800 px-3 py-2 text-indigo-900 dark:text-indigo-100">
                  <span className="font-semibold">Focus first:</span> {payoffRec.name}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500">No active bills yet. Add commitments to see pressure here.</p>
          )}
        </div>
      )}

      {tab === "tips" && (
        <div className="space-y-2">
          {tips.length === 0 ? (
            <p className="text-sm text-gray-500">No tips right now — you are in a calm stretch.</p>
          ) : (
            <ul className="space-y-2">
              {tips.slice(0, 10).map((ins) => (
                <li key={ins.id} className={`text-sm rounded-lg px-3 py-2 border ${toneClass(ins.tone)}`}>
                  {ins.text}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </Card>
  );
}
