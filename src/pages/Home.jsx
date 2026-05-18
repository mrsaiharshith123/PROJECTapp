import { useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect } from "react";
import Card from "../components/Card";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { useCommitIntel } from "../hooks/useCommitIntel.js";
import { useStabilityIntel } from "../hooks/useStabilityIntel.js";
import { computeGoalProgress, goalTypeLabel } from "../engines/goalsProgress.js";
import InstallAppBanner from "../components/InstallAppBanner.jsx";
import PageHeaderWithNotifications from "../components/PageHeaderWithNotifications.jsx";
import HomeOverviewCard from "../components/dashboard/HomeOverviewCard.jsx";
import ModeIntelligenceSection from "../components/dashboard/ModeIntelligenceSection.jsx";
import FinancialPulseCard from "../components/dashboard/FinancialPulseCard.jsx";
import DashboardTools from "../components/dashboard/DashboardTools.jsx";
import ToolsDiscoveryToast from "../components/dashboard/ToolsDiscoveryPrompt.jsx";
import { isActiveBill } from "../utils/billLifecycle.js";
import { formatInr, STATUS_ICONS, CHEVRON } from "../constants/symbols.js";

function formatDate(dateStr) {
  if (!dateStr) return "?";
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const statusIcon = STATUS_ICONS;

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { commitments, sortedCommitments, goals, settings, getEffectiveStatus } = useCommitTrack();
  const stable = useStabilityIntel();

  const scrollToTools = useCallback(() => {
    document.getElementById("dashboard-tools")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    if (location.hash === "#dashboard-tools") scrollToTools();
  }, [location.hash, scrollToTools]);
  const intel = useCommitIntel();

  const openRemaining = commitments.reduce((s, c) => {
    if (getEffectiveStatus(c) === "paid") return s;
    return s + Math.max(0, Number(c.remainingAmount ?? 0));
  }, 0);

  const upcoming = sortedCommitments
    .filter((c) => isActiveBill(c) && getEffectiveStatus(c) === "pending")
    .slice(0, 3);

  const overdue = sortedCommitments.filter((c) => getEffectiveStatus(c) === "overdue");

  return (
    <div className="space-y-6">
      <PageHeaderWithNotifications
        eyebrow="Overview"
        title="Dashboard"
        subtitle={
          settings.activeProfileId && settings.activeProfileId !== "default" ? (
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
              Profile: {settings.activeProfileId}
            </p>
          ) : null
        }
      />

      <InstallAppBanner />
      <HomeOverviewCard />

      <ModeIntelligenceSection />
      <FinancialPulseCard />

      {goals.length > 0 && (
        <Card className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Goals</h2>
            <button
              type="button"
              onClick={scrollToTools}
              className="text-xs text-indigo-600 font-semibold"
            >
              Manage {CHEVRON}
            </button>
          </div>
          {goals.slice(0, 3).map((g) => {
            const p = computeGoalProgress(g, {
              openRemainingSum: openRemaining,
              burdenRatio: intel.burdenRatio,
              savedAmountTowardGoal: g.type === "save_amount" ? Number(g.savedAmount) || 0 : 0,
            });
            const cap = stable.goalCapacity?.find((x) => x.id === g.id);
            return (
              <div key={g.id}>
                <p className="text-sm font-medium text-gray-800 truncate">{g.title}</p>
                <p className="text-xs text-gray-500">{goalTypeLabel(g.type)}</p>
                {cap && cap.neededPerMonth > 0 && (
                  <p
                    className={`text-[11px] mt-0.5 ${cap.feasible ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800 dark:text-amber-200"}`}
                  >
                    ~{formatInr(cap.neededPerMonth)}/mo for ~{cap.monthsLeft} mo
                    {!cap.feasible ? " (tight vs free cash)" : ""}
                  </p>
                )}
                <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round(p * 100)}%` }} />
                </div>
              </div>
            );
          })}
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-700">Upcoming payments</h2>
          <button
            type="button"
            onClick={() => navigate("/commitments")}
            className="text-xs text-indigo-500 font-medium hover:underline"
          >
            View all {CHEVRON}
          </button>
        </div>

        {upcoming.length === 0 ? (
          <Card className="text-center py-6">
            <p className="text-2xl mb-1" aria-hidden>
              {"\u{1F4C5}"}
            </p>
            <p className="text-sm text-gray-500">Nothing due right now</p>
            <p className="text-xs text-gray-400 mt-1">Add bills or check History for paid items</p>
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
                      {formatInr(Number(item.remainingAmount ?? item.amount))}
                    </p>
                    <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-medium">
                      Due
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
                  <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center text-lg shrink-0">
                    {STATUS_ICONS.overdue}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-red-700 truncate">{item.name}</p>
                    <p className="text-xs text-red-400">Was due {formatDate(item.dueDate)}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <p className="font-bold text-red-600" style={{ fontFamily: "'Sora', sans-serif" }}>
                    {formatInr(Number(item.remainingAmount ?? item.amount))}
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

      <DashboardTools />
      <ToolsDiscoveryToast variant="home" />
    </div>
  );
};

export default Home;
