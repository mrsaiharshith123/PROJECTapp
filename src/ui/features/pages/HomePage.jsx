import { useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect, useMemo } from "react";
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
  EmptyState,
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
  const location = useLocation();
  const { commitments, sortedCommitments, goals, settings, getEffectiveStatus, todayStr } = useCommitTrack();
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

  return (
    <div className="ct-page">
      <PageHeaderWithNotifications greeting={greeting} />

      {isSalariedFamily(settings) && settings.activeProfileId && settings.activeProfileId !== "default" && (
        <Caption className="text-[var(--ct-accent)] font-semibold">
          Profile: {settings.activeProfileId}
        </Caption>
      )}

      <InstallAppBanner />
      <HomeOverviewCard />

      <Grid cols={4}>
        <MetricTile label="Total Bills" value={commitments.length} />
        <MetricTile label="Amount Due" value={formatInr(monthSummary.dueThisMonth)} valueClassName="ct-hero-metric-warn" />
        <MetricTile
          label="Cash Left"
          value={
            monthSummary.freeCash != null
              ? formatInr(monthSummary.freeCash)
              : intel.freeMoneyAfterBurden != null
                ? formatInr(intel.freeMoneyAfterBurden)
                : EM_DASH
          }
          valueClassName="ct-hero-metric-success"
        />
        <MetricTile label="Stability" value={`${stabilityScore}%`} valueClassName="" />
      </Grid>
      <Caption className="-mt-2 text-center block">Stability · {stabilityLabel}</Caption>

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
          <EmptyState
            icon={"\u{1F4C5}"}
            title="Nothing due right now"
            hint="Add bills or check History for paid items"
          />
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
