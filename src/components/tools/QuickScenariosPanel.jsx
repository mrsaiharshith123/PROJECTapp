import { formatInr } from "../../constants/symbols.js";
import { buildQuickScenarioSummaries } from "../../engines/quickScenarios.js";
import { useCommitTrack } from "../../context/CommitTrackContext.jsx";
import { getExperienceMode } from "../../constants/modeExperience.js";
import { combinedMonthlyIncome } from "../../utils/combinedIncome.js";

/** Dashboard modal — read-only stress checks using current commitments. */
export default function QuickScenariosPanel() {
  const { commitments, settings, getEffectiveStatus } = useCommitTrack();
  const mode = getExperienceMode(settings);
  const income = combinedMonthlyIncome(settings);
  const secondary = Math.max(0, Number(settings.secondaryMonthlyIncome) || 0);
  const primary = Math.max(0, Number(settings.monthlyIncome) || 0);

  const pack = buildQuickScenarioSummaries({
    primaryIncome: primary,
    secondaryMonthlyIncome: secondary,
    commitments,
    getEffectiveStatus,
    liquidSavings: settings.liquidSavings,
    mode,
  });

  return (
    <div className="space-y-3 text-sm">
      <p className="text-xs text-gray-500 dark:text-slate-400">
        Quick what-ifs — same affordability engine as &quot;Can I afford this?&quot; Does not change your data.
      </p>
      <p className="text-xs text-gray-600 dark:text-slate-300">
        Baseline free cash ~{formatInr(pack.baselineFree)}/mo
        {pack.survivalMonths != null ? ` · survival if income stops ~${pack.survivalMonths} mo` : ""}
      </p>
      <ul className="space-y-2">
        {pack.rows.map((row) => (
          <li
            key={row.id}
            className="rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50/80 dark:bg-slate-800/60 px-3 py-2"
          >
            <p className="font-semibold text-gray-800 dark:text-slate-100">{row.label}</p>
            <p className="text-xs text-indigo-800 dark:text-indigo-200 mt-0.5">{row.headline}</p>
            <p className="text-xs text-gray-600 dark:text-slate-400 mt-1">{row.detail}</p>
          </li>
        ))}
      </ul>
      {income <= 0 && (
        <p className="text-xs text-amber-800 dark:text-amber-200">Set income in Profile to unlock job-loss and fee scenarios.</p>
      )}
    </div>
  );
}
