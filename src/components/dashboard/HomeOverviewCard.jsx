import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCommitTrack } from "../../context/CommitTrackContext.jsx";
import { computeCurrentMonthSummary } from "../../utils/monthPaymentSummary.js";
import { isActiveBill } from "../../utils/billLifecycle.js";
import { getUserModeConfig } from "../../constants/userModes.js";
import { getExperienceMode } from "../../constants/modeExperience.js";
import { combinedMonthlyIncome } from "../../utils/combinedIncome.js";
import { formatInr, EM_DASH } from "../../constants/symbols.js";

/** Single home hero — tap opens Analytics. */
export default function HomeOverviewCard() {
  const navigate = useNavigate();
  const { commitments, settings, getEffectiveStatus, todayStr } = useCommitTrack();
  const experienceMode = getExperienceMode(settings);
  const modeCfg = getUserModeConfig(settings.userMode || "salaried");
  const income = combinedMonthlyIncome(settings);

  const monthSummary = useMemo(
    () => computeCurrentMonthSummary(commitments, getEffectiveStatus, todayStr, income),
    [commitments, getEffectiveStatus, todayStr, income]
  );

  const active = commitments.filter(isActiveBill);
  const subs = active.filter((c) => c.category === "Subscription");
  const emis = active.filter((c) => c.category === "EMI");

  const title =
    experienceMode === "salaried"
      ? "This month"
      : experienceMode === "business"
        ? "Cashflow"
        : experienceMode === "family"
          ? "Household month"
          : modeCfg.label;

  return (
    <button
      type="button"
      onClick={() => navigate("/analytics")}
      className="w-full text-left rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 text-white shadow-lg shadow-indigo-200/60 dark:shadow-indigo-950/40 hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
      aria-label="Open analytics for this month"
    >
      <div className="px-4 pt-4 pb-2 flex items-center justify-between gap-2">
        <div>
          <p className="text-indigo-200/90 text-xs font-medium uppercase tracking-widest">{title}</p>
          <p className="text-sm text-indigo-100/80">{monthSummary.monthLabel}</p>
        </div>
        <span className="text-2xl" aria-hidden>
          {modeCfg.emoji}
        </span>
      </div>

      <div className="px-3 pb-3 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white/10 border border-white/10 px-2.5 py-2 text-center">
          <p className="text-[10px] text-indigo-200 uppercase font-semibold">Left</p>
          <p className="text-lg font-bold leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
            {formatInr(monthSummary.leftThisMonth)}
          </p>
        </div>
        <div className="rounded-xl bg-white/10 border border-white/10 px-2.5 py-2 text-center">
          <p className="text-[10px] text-indigo-200 uppercase font-semibold">Paid</p>
          <p className="text-lg font-bold text-emerald-300 leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
            {formatInr(monthSummary.paidThisMonth)}
          </p>
        </div>
        <div className="rounded-xl bg-white/10 border border-white/10 px-2.5 py-2 text-center">
          <p className="text-[10px] text-indigo-200 uppercase font-semibold">Due</p>
          <p className="text-lg font-bold text-amber-200 leading-tight" style={{ fontFamily: "'Sora', sans-serif" }}>
            {formatInr(monthSummary.dueThisMonth)}
          </p>
        </div>
      </div>

      <div className="px-4 pb-2">
        <div className="flex justify-between text-[10px] text-indigo-200 mb-1">
          <span>Month progress</span>
          <span>{monthSummary.paidPct}%</span>
        </div>
        <div className="h-1.5 bg-indigo-500/40 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-300 rounded-full transition-all"
            style={{ width: `${monthSummary.paidPct}%` }}
          />
        </div>
      </div>

      <div className="mx-3 mb-3 rounded-xl bg-white/10 border border-white/10 px-3 py-2.5 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
        <p className="text-indigo-100/70">
          Still due{" "}
          <span className="font-semibold text-white">{formatInr(monthSummary.dueThisMonth)}</span>
          {monthSummary.duePercentOfIncome ? (
            <span className="text-indigo-200/80"> · {monthSummary.duePercentOfIncome} of income</span>
          ) : income <= 0 ? (
            <span className="text-indigo-200/80"> · set income in Profile</span>
          ) : null}
        </p>
        <p className="text-indigo-100/70 text-right">
          Free cash{" "}
          <span className="font-semibold text-emerald-300">
            {monthSummary.freeCash != null ? formatInr(monthSummary.freeCash) : EM_DASH}
          </span>
        </p>
        {(experienceMode === "salaried" || experienceMode === "family") && (
          <>
            <p className="text-indigo-100/70">
              EMIs <span className="font-semibold text-white">{emis.length}</span>
            </p>
            <p className="text-indigo-100/70 text-right">
              Subs <span className="font-semibold text-white">{subs.length}</span>
            </p>
          </>
        )}
      </div>

      <p className="text-center text-[10px] text-indigo-200/80 pb-3">Tap for full analytics →</p>
    </button>
  );
}
