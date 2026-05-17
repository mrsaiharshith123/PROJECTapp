import { useState } from "react";
import { formatInr } from "../../constants/symbols.js";
import { affordabilityBadgeClass } from "../../engines/affordability.js";
import { simulateNewExpense, getExpensePresetsForMode } from "../../engines/expenseSimulator.js";
import { useCommitTrack } from "../../context/CommitTrackContext.jsx";
import { freeMoneyAfterBurden } from "../../engines/pressureScore.js";
import { resolveUserMode } from "../../constants/modeExperience.js";

/** Affordability simulator body — used in dashboard tool modal. */
export default function ExpenseSimulatorForm() {
  const { commitments, settings, getEffectiveStatus } = useCommitTrack();
  const mode = resolveUserMode(settings);
  const presets = getExpensePresetsForMode(mode);
  const presetKeys = Object.keys(presets);
  const [preset, setPreset] = useState(presetKeys[0] || "emi");
  const [amount, setAmount] = useState("");

  const income = Math.max(0, Number(settings.monthlyIncome) || 0);
  const cash = freeMoneyAfterBurden(commitments, income, getEffectiveStatus);
  const amt = Number(amount) || 0;
  const sim =
    amt > 0
      ? simulateNewExpense({
          income,
          commitments,
          getEffectiveStatus,
          liquidSavings: settings.liquidSavings,
          freeMoney: cash.freeMoney,
          amount: amt,
          preset,
          mode,
        })
      : null;

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-500 dark:text-slate-400">
        Try a new cost before you add it as a bill. Results use your current income and commitments.
      </p>
      <div className="flex flex-wrap gap-2">
        {presetKeys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setPreset(key)}
            className={`text-xs px-2.5 py-1 rounded-full border ${
              preset === key
                ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                : "border-gray-200 text-gray-600 dark:border-slate-600 dark:text-slate-400"
            }`}
          >
            {presets[key].label}
          </button>
        ))}
      </div>
      <input
        type="number"
        min="0"
        placeholder="Amount (₹)"
        className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 text-sm"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      {sim && (
        <div className="space-y-2 text-sm">
          <span
            className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full border ${affordabilityBadgeClass(sim.affordability.tier)}`}
          >
            {sim.affordability.label}
          </span>
          <p className="text-gray-700 dark:text-slate-300">
            Free cash after: {formatInr(Math.round(sim.affordability.freeMoneyAfter))}
            {sim.affordability.committedPercent != null ? ` (${sim.affordability.committedPercent}% committed)` : ""}
          </p>
          {sim.warnings.map((w, i) => (
            <p
              key={i}
              className="text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 rounded-lg px-2 py-1.5"
            >
              {w}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
