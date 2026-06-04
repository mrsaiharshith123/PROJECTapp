import { useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { computeGoalProgress, goalTypeLabel } from "../../../engines/goalsProgress.js";
import {
  InstallAppBanner,
  PageHeaderWithNotifications,
  PlansButton,
  HomeOverviewCard,
  ModeIntelligenceSection,
  FinancialPulseCard,
  DashboardTools,
  ToolsDiscoveryToast,
} from "../../";
import { isSalariedFamily } from "../../../constants/modeExperience.js";
import { getHomeKpiTiles } from "../dashboard/config/modeDashboardMetrics.js";
import { GuidedEmptyState } from "../../guidance/GuidedEmptyState.jsx";
import { MicroTipCard } from "../../guidance/MicroTipCard.jsx";
import { AppTourModal } from "../../guidance/AppTourModal.jsx";
import FinancialHealthTile from "../dashboard/FinancialHealthTile.jsx";
import FamilyCalendarWidget from "../dashboard/FamilyCalendarWidget.jsx";
import { isActiveBill } from "../../../utils/billLifecycle.js";
import { monthlyBurdenForCommitment } from "../../../engines/burden.js";
import { computePaymentMonthStreak, computeControlScore } from "../../../utils/profileStats.js";
import { formatInr, STATUS_ICONS, CHEVRON, EM_DASH } from "../../../constants/symbols.js";
import {
  ScreenSection,
  Card,
  Stack,
  Row,
  MetricTile,
  ListRow,
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
  const { commitments, lendings, sortedCommitments, goals, settings, getEffectiveStatus, todayStr, updateSettings } =
    useCommitTrack();
  const location = useLocation();
  const navWantsTour = Boolean(location.state?.replayGuide || location.state?.startGuide);
  const [tourDismissed, setTourDismissed] = useState(false);
  const tourOpen = !tourDismissed && (navWantsTour || !settings.appGuideComplete);
  const stable = useStabilityIntel();
  const intel = useCommitIntel();
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

  const payStreak = useMemo(
    () => computePaymentMonthStreak(commitments, lendings),
    [commitments, lendings],
  );
  const billControl = useMemo(
    () => computeControlScore(commitments, getEffectiveStatus),
    [commitments, getEffectiveStatus],
  );

  const homeKpis = useMemo(
    () =>
      getHomeKpiTiles({
        settings,
        commitments,
        streak: payStreak,
        control: billControl,
        overdueCount: overdue.length,
        stable,
      }),
    [settings, commitments, payStreak, billControl, overdue.length, stable],
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
      <PageHeaderWithNotifications greeting={greeting} headerActions={<PlansButton />} />

      {isSalariedFamily(settings) && settings.activeProfileId && settings.activeProfileId !== "default" && (
        <Caption className="text-[var(--ct-accent)] font-semibold">
          Profile: {settings.activeProfileId}
        </Caption>
      )}

      <InstallAppBanner />
      <HomeOverviewCard />

      <div className="ct-home-kpis">
        <div className="ct-grid-2">
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
        </div>
        <FinancialHealthTile />
      </div>

      <MicroTipCard seed={microTipSeed} />
      <ModeIntelligenceSection />
      <FinancialPulseCard />
      {isSalariedFamily(settings) && <FamilyCalendarWidget />}

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
          <QuickAction icon="🤝" label="Lending" onClick={() => navigate("/lending")} />
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
