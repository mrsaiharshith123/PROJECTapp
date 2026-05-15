import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { totalPaidOnPayments } from "../utils/commitmentPayments.js";
import { useCommitIntel } from "../hooks/useCommitIntel.js";
import { healthLevelBadgeClass } from "../engines/financialHealth.js";
import { computeGoalProgress, goalTypeLabel } from "../engines/goalsProgress.js";
import { getUserModeConfig } from "../constants/userModes.js";
import InstallAppBanner from "../components/InstallAppBanner.jsx";
import RoleDashboardPanel from "../components/dashboard/RoleDashboardPanel.jsx";

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const statusIcon = { paid: "✅", pending: "🕐", overdue: "⚠️" };

const Home = () => {
  const navigate = useNavigate();
  const { commitments, sortedCommitments, goals, settings, getEffectiveStatus } = useCommitTrack();
  const intel = useCommitIntel();
  const modeCfg = getUserModeConfig(settings.userMode || "salaried");

  /**
   * Dashboard summary (all-time payments vs open remaining):
   * - paidAllTime: sum of every recorded payment across commitments
   * - openRemaining: sum of remainingAmount where the item is not effectively paid
   * - progress: paidAllTime / (paidAllTime + openRemaining), capped at 100
   */
  const paidAllTime = commitments.reduce((s, c) => s + totalPaidOnPayments(c.payments), 0);
  const openRemaining = commitments.reduce((s, c) => {
    if (getEffectiveStatus(c) === "paid") return s;
    return s + Math.max(0, Number(c.remainingAmount ?? 0));
  }, 0);
  const denom = paidAllTime + openRemaining;
  const paidPct = denom > 0 ? Math.min(100, Math.round((paidAllTime / denom) * 100)) : 0;

  const upcoming = sortedCommitments
    .filter((c) => getEffectiveStatus(c) === "pending")
    .slice(0, 3);

  const overdue = sortedCommitments.filter((c) => getEffectiveStatus(c) === "overdue");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-400 font-medium uppercase tracking-widest">Overview</p>
        <h1 className="text-3xl font-bold text-gray-900 mt-1" style={{ fontFamily: "'Sora', sans-serif" }}>
          Dashboard
        </h1>
        {settings.activeProfileId && settings.activeProfileId !== "default" && (
          <p className="text-xs text-indigo-600 mt-1 font-medium">Profile: {settings.activeProfileId}</p>
        )}
      </div>

      <InstallAppBanner />
      <RoleDashboardPanel />

      <Card className="bg-gradient-to-br from-indigo-600 to-violet-600 text-white border-0 shadow-lg shadow-indigo-200">
        <p className="text-indigo-200 text-sm font-medium mb-4">Summary</p>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-indigo-200 text-xs mb-1">Open remaining</p>
            <p className="text-2xl font-bold" style={{ fontFamily: "'Sora', sans-serif" }}>
              ₹{openRemaining.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-indigo-200 text-xs mb-1">Paid (all-time)</p>
            <p className="text-2xl font-bold text-emerald-300" style={{ fontFamily: "'Sora', sans-serif" }}>
              ₹{paidAllTime.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-indigo-200 text-xs mb-1">Total obligation</p>
            <p className="text-2xl font-bold text-amber-300" style={{ fontFamily: "'Sora', sans-serif" }}>
              ₹{(paidAllTime + openRemaining).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex justify-between text-xs text-indigo-200 mb-2">
            <span>Progress</span>
            <span>{paidPct}% toward cleared balance</span>
          </div>
          <div className="h-2 bg-indigo-500/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-300 rounded-full transition-all duration-500"
              style={{ width: `${paidPct}%` }}
            />
          </div>
        </div>
      </Card>

      <Card className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-gray-800">Financial stability</h2>
          <span
            className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${intel.stability.badgeClass}`}
          >
            {intel.stability.label} · {intel.stability.score}/100
          </span>
        </div>
        <p className="text-xs text-gray-500">
          {intel.stability.committedPercent != null
            ? `${intel.stability.committedPercent}% of income to monthly dues`
            : "Set income in Profile for burden %"}
          . Free after dues: ₹{Math.round(intel.stability.freeMoney).toLocaleString()}.
          <br />
          Health:{" "}
          <span className={`font-medium ${healthLevelBadgeClass(intel.health.level).split(" ").slice(1).join(" ")}`}>
            {intel.health.label} ({intel.health.score})
          </span>
          . Yearly burden est. ₹{Math.round(intel.yearlyBurden).toLocaleString()}.
        </p>
        {modeCfg.id === "business" && (
          <p className="text-xs text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2">
            Business mode: track receivables under Lending and cashflow under Analytics.
          </p>
        )}
      </Card>

      {goals.length > 0 && (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Goals</h2>
            <button type="button" onClick={() => navigate("/tools")} className="text-xs text-indigo-600 font-semibold">
              Manage →
            </button>
          </div>
          {goals.slice(0, 3).map((g) => {
            const p = computeGoalProgress(g, {
              openRemainingSum: openRemaining,
              burdenRatio: intel.burdenRatio,
              savedAmountTowardGoal: g.type === "save_amount" ? Number(g.savedAmount) || 0 : 0,
            });
            return (
              <div key={g.id}>
                <p className="text-sm font-medium text-gray-800 truncate">{g.title}</p>
                <p className="text-xs text-gray-500">{goalTypeLabel(g.type)}</p>
                <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round(p * 100)}%` }} />
                </div>
              </div>
            );
          })}
        </Card>
      )}

      {intel.payoffRec && (
        <Card className="border-indigo-100 bg-indigo-50/50">
          <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Payoff priority</p>
          <p className="text-sm text-gray-800 mt-1">{intel.payoffRec.message}</p>
        </Card>
      )}

      {intel.insights.length > 0 && (
        <Card className="space-y-2">
          <h2 className="text-base font-semibold text-gray-800">Insights</h2>
          <ul className="space-y-2">
            {intel.insights.map((ins) => (
              <li
                key={ins.id}
                className={`text-sm rounded-lg px-3 py-2 border ${
                  ins.tone === "critical"
                    ? "bg-red-50 border-red-100 text-red-900"
                    : ins.tone === "warning"
                      ? "bg-amber-50 border-amber-100 text-amber-900"
                      : ins.tone === "positive"
                        ? "bg-emerald-50 border-emerald-100 text-emerald-900"
                        : "bg-gray-50 border-gray-100 text-gray-800"
                }`}
              >
                {ins.text}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {intel.forecast.length > 0 && (
        <Card className="space-y-2">
          <h2 className="text-base font-semibold text-gray-800">Forecast</h2>
          {intel.forecast.map((f) => (
            <p key={f.id} className="text-sm text-gray-700">
              {f.text}
            </p>
          ))}
        </Card>
      )}

      {intel.subscriptionLeak.insights.length > 0 && (
        <Card className="space-y-2">
          <h2 className="text-base font-semibold text-gray-800">Subscriptions</h2>
          {intel.subscriptionLeak.insights.map((t, i) => (
            <p key={i} className="text-sm text-gray-700">
              {t}
            </p>
          ))}
        </Card>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => navigate("/tools")}
          className="flex-1 py-2.5 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 rounded-xl hover:bg-indigo-50"
        >
          Optimization tools
        </button>
        <button
          type="button"
          onClick={() => navigate("/analytics")}
          className="flex-1 py-2.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
        >
          Analytics
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">Upcoming payments</h2>
          <button
            type="button"
            onClick={() => navigate("/commitments")}
            className="text-xs text-indigo-500 font-medium hover:underline"
          >
            View all →
          </button>
        </div>

        {upcoming.length === 0 ? (
          <Card className="text-center py-6">
            <p className="text-2xl mb-1">🎉</p>
            <p className="text-sm text-gray-500">Nothing pending right now</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcoming.map((item) => {
              const eff = getEffectiveStatus(item);
              return (
                <Card key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-lg shrink-0">
                      {statusIcon[eff] || statusIcon.pending}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">Due: {formatDate(item.dueDate)}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <p className="font-bold text-gray-800" style={{ fontFamily: "'Sora', sans-serif" }}>
                      ₹{Number(item.remainingAmount ?? item.amount).toLocaleString()}
                    </p>
                    <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                      Pending
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {overdue.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full inline-block animate-pulse" />
            Overdue
          </h2>
          <div className="space-y-3">
            {overdue.map((item) => (
              <Card key={item.id} className="flex items-center justify-between border-red-100 bg-red-50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-lg shrink-0">⚡</div>
                  <div className="min-w-0">
                    <p className="font-semibold text-red-700 truncate">{item.name}</p>
                    <p className="text-xs text-red-400">Was due {formatDate(item.dueDate)}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <p className="font-bold text-red-600" style={{ fontFamily: "'Sora', sans-serif" }}>
                    ₹{Number(item.remainingAmount ?? item.amount).toLocaleString()}
                  </p>
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium border border-red-200">
                    Overdue
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => navigate("/add")}
        className="w-full py-3.5 border-2 border-dashed border-indigo-200 text-indigo-500 font-semibold rounded-2xl hover:bg-indigo-50 transition-all text-sm"
      >
        + Add New Commitment
      </button>
    </div>
  );
};

export default Home;
