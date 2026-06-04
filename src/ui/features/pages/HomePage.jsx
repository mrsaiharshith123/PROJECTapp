import { useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { computeGoalProgress, goalTypeLabel } from "../../../engines/goalsProgress.js";
import {
  InstallAppBanner,
  PageHeaderWithNotifications,
  HomeOverviewCard,
  ModeIntelligenceSection,
  FinancialPulseCard,
  DashboardTools,
  ToolsDiscoveryToast,
} from "../../";
import { isSalariedFamily } from "../../../constants/modeExperience.js";
import {
  getHomeKpiTiles,
  getHomeKpiCaption,
} from "../dashboard/config/modeDashboardMetrics.js";
import { getDashboardFocus, interpretHomeMetric } from "../../../guidance/index.js";
import { getExperienceMode } from "../../../constants/modeExperience.js";
import { GuidanceBanner } from "../../guidance/GuidanceBanner.jsx";
import { GuidedEmptyState } from "../../guidance/GuidedEmptyState.jsx";
import { MicroTipCard } from "../../guidance/MicroTipCard.jsx";
import { AppTourModal } from "../../guidance/AppTourModal.jsx";
import { isActiveBill } from "../../../utils/billLifecycle.js";
import { monthlyBurdenForCommitment } from "../../../engines/burden.js";
import { computeCurrentMonthSummary } from "../../../utils/monthPaymentSummary.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import { formatInr, STATUS_ICONS, CHEVRON, EM_DASH } from "../../../constants/symbols.js";
import {
  ScreenSection,
  Card,
  Stack,
  Row,
  Grid,
  MetricTile,
  ListRow,
  InsightBanner,
  Heading,
  Body,
  Caption,
  Button,
  ProgressBar,
  QuickAction,
  QuickActionRow,
} from "../../index.js";

function formatDate(dateStr) {
  if (!dateStr) return EM_DASH;
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const Home = () => {
  const navigate = useNavigate();
  const { commitments, sortedCommitments, goals, settings, getEffectiveStatus, todayStr, updateSettings } =
    useCommitTrack();
  const location = useLocation();
  const navWantsTour = Boolean(location.state?.replayGuide || location.state?.startGuide);
  const [tourDismissed, setTourDismissed] = useState(false);
  const tourOpen = !tourDismissed && (navWantsTour || !settings.appGuideComplete);
  const stable = useStabilityIntel();
  const intel = useCommitIntel();
  const income = combinedMonthlyIncome(settings);
  const monthSummary = useMemo(
    () => computeCurrentMonthSummary(commitments, getEffectiveStatus, todayStr, income),
    [commitments, getEffectiveStatus, todayStr, income]
  );

  const scrollToTools = useCallback(() => {
    document.getElementById("dashboard-tools")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    if (location.hash === "#dashboard-tools") scrollToTools();
  }, [location.hash, scrollToTools]);

  useEffect(() => {
    if (navWantsTour) {
      navigate(location.pathname + location.hash, { replace: true, state: {} });
    }
  }, [navWantsTour, location.pathname, location.hash, navigate]);

  const completeTour = () => {
    updateSettings({ appGuideComplete: true });
    setTourDismissed(true);
  };

  const openRemaining = commitments.reduce(
    (s, c) => s + monthlyBurdenForCommitment(c, getEffectiveStatus),
    0
  );

  const upcoming = sortedCommitments
    .filter((c) => isActiveBill(c, getEffectiveStatus, todayStr) && getEffectiveStatus(c) === "pending")
    .slice(0, 3);

  const overdue = sortedCommitments.filter((c) => getEffectiveStatus(c) === "overdue");

  const displayName = settings.displayName?.trim() || "there";
  const greeting = `Hey, ${displayName} 👋`;

  const insightText = useMemo(() => {
    if (stable.healthNarrative?.headline) return stable.healthNarrative.headline;
    const free = intel.freeMoneyAfterBurden ?? monthSummary.freeCash;
    if (free != null && free >= 0) {
      return `Good job! You'll have ${formatInr(free)} left after paying all dues.`;
    }
    return null;
  }, [stable.healthNarrative, intel.freeMoneyAfterBurden, monthSummary.freeCash]);

  const stabilityScore = intel.stability?.score ?? 0;
  const stabilityLabel =
    stabilityScore >= 70 ? "Good" : stabilityScore >= 45 ? "Fair" : "Tight";

  const homeKpis = useMemo(
    () =>
      getHomeKpiTiles({
        settings,
        monthSummary,
        intel,
        stable,
        commitments,
        getEffectiveStatus,
        todayStr,
      }),
    [settings, monthSummary, intel, stable, commitments, getEffectiveStatus, todayStr],
  );
  const kpiCaption = getHomeKpiCaption(settings);
  const experienceMode = getExperienceMode(settings);
  const kpiInterpretation = useMemo(() => {
    const primary = homeKpis.find((k) => k.conceptId === "stability" || k.conceptId === "businessStability" || k.conceptId === "householdSafety") || homeKpis[1];
    if (!primary) return null;
    return interpretHomeMetric(primary.label, primary.value, { mode: experienceMode });
  }, [homeKpis, experienceMode]);
  const dashboardFocus = useMemo(
    () =>
      getDashboardFocus({
        settings,
        overdueCount: overdue.length,
        stabilityScore,
        stable,
      }),
    [settings, overdue.length, stabilityScore, stable],
  );

  const microTipSeed = commitments.length + goals.length;

  return (
    <div className="ct-page">
      <AppTourModal
        settings={settings}
        open={tourOpen}
        onComplete={completeTour}
        onDismiss={completeTour}
      />
      <PageHeaderWithNotifications greeting={greeting} />

      {isSalariedFamily(settings) && settings.activeProfileId && settings.activeProfileId !== "default" && (
        <Caption className="text-[var(--ct-accent)] font-semibold">
          Profile: {settings.activeProfileId}
        </Caption>
      )}

      <InstallAppBanner />
      <GuidanceBanner focus={dashboardFocus} />
      <HomeOverviewCard />

      <Grid cols={4}>
        {homeKpis.map((kpi) => (
          <MetricTile
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            valueClassName={kpi.valueClassName}
            caption={kpi.caption}
            conceptId={kpi.conceptId}
          />
        ))}
      </Grid>
      <Caption className="-mt-2 text-center block">
        {kpiCaption}
        {homeKpis.length === 4 && homeKpis.some((k) => k.label === "Stability")
          ? ` · ${stabilityLabel}`
          : ""}
      </Caption>
      {kpiInterpretation && (
        <Caption className="-mt-1 text-center block opacity-90">{kpiInterpretation}</Caption>
      )}

      <MicroTipCard seed={microTipSeed} />
      <ModeIntelligenceSection />
      <FinancialPulseCard />

      {insightText && (
        <InsightBanner variant="success">{insightText}</InsightBanner>
      )}

      {goals.length > 0 && (
        <Card>
          <Stack gap="sm">
            <Row between>
              <Heading level={2}>Goals</Heading>
              <Button type="button" variant="ghost" size="sm" onClick={scrollToTools} className="!w-auto">
                Manage {CHEVRON}
              </Button>
            </Row>
            {goals.slice(0, 3).map((g) => {
              const p = computeGoalProgress(g, {
                openRemainingSum: openRemaining,
                burdenRatio: intel.burdenRatio,
                savedAmountTowardGoal: g.type === "save_amount" ? Number(g.savedAmount) || 0 : 0,
              });
              const cap = stable.goalCapacity?.find((x) => x.id === g.id);
              return (
                <div key={g.id}>
                  <Body className="font-semibold text-[var(--ct-text)] truncate">{g.title}</Body>
                  <Caption>{goalTypeLabel(g.type)}</Caption>
                  {cap && cap.neededPerMonth > 0 && (
                    <Caption className={cap.feasible ? "text-[var(--ct-success)]" : "text-[var(--ct-warning)]"}>
                      ~{formatInr(cap.neededPerMonth)}/mo for ~{cap.monthsLeft} mo
                      {!cap.feasible ? " (tight vs free cash)" : ""}
                    </Caption>
                  )}
                  <div className="mt-2">
                    <ProgressBar value={Math.round(p * 100)} />
                  </div>
                </div>
              );
            })}
          </Stack>
        </Card>
      )}

      <ScreenSection
        title="Upcoming payments"
        action={
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate("/commitments")} className="!w-auto">
            View all {CHEVRON}
          </Button>
        }
      >
        {upcoming.length === 0 ? (
          <GuidedEmptyState guidanceKey="home-upcoming" settings={settings} />
        ) : (
          <Stack gap="sm">
            {upcoming.map((item) => (
              <ListRow
                key={item.id}
                icon={STATUS_ICONS.pending}
                title={item.name}
                subtitle={`Due: ${formatDate(item.dueDate)}`}
                amount={formatInr(Number(item.amount ?? 0))}
                status="Due Soon"
                statusTone="warning"
              />
            ))}
          </Stack>
        )}
      </ScreenSection>

      {overdue.length > 0 && (
        <ScreenSection title="Overdue">
          <Stack gap="sm">
            {overdue.map((item) => (
              <Card key={item.id} variant="flat" className="ct-card-danger !p-0 overflow-hidden">
                <ListRow
                  icon={STATUS_ICONS.overdue}
                  title={item.name}
                  subtitle={`Was due ${formatDate(item.dueDate)}`}
                  amount={formatInr(Number(item.amount ?? 0))}
                  status="Overdue"
                  statusTone="danger"
                />
              </Card>
            ))}
          </Stack>
        </ScreenSection>
      )}

      <ScreenSection title="Quick actions">
        <QuickActionRow>
          <QuickAction icon="+" label="Add Bill" onClick={() => navigate("/add")} />
          <QuickAction icon="💳" label="Add Debt" onClick={() => navigate("/lending")} />
          <QuickAction icon="💰" label="Add Income" onClick={() => navigate("/profile")} />
          <QuickAction icon="🧮" label="Calculator" onClick={scrollToTools} />
          <QuickAction icon="📊" label="Insights" onClick={() => navigate("/analytics")} />
        </QuickActionRow>
      </ScreenSection>

      <DashboardTools />
      <ToolsDiscoveryToast variant="home" />
    </div>
  );
};

export default Home;
