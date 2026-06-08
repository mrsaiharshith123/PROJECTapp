import { useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { useCommitTrack } from "../../../context/CommitTrackContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { computeGoalProgress, goalTypeLabel } from "../../../engines/goalsProgress.js";
import {
  InstallAppBanner,
  PageHeaderWithNotifications,
  PlansButton,
  HomeOverviewCard,
  DashboardTools,
  ToolsDiscoveryToast,
} from "../../";
import { isSalariedFamily } from "../../../constants/modeExperience.js";
import { GuidedEmptyState } from "../../guidance/GuidedEmptyState.jsx";
import { MicroTipCard } from "../../guidance/MicroTipCard.jsx";
import { AppTourModal } from "../../guidance/AppTourModal.jsx";
import PaymentDeadlineCalendarModal from "../dashboard/PaymentDeadlineCalendarModal.jsx";
import { isActiveBill } from "../../../utils/billLifecycle.js";
import { monthlyBurdenForCommitment } from "../../../engines/burden.js";
import { formatInr, STATUS_ICONS, CHEVRON, EM_DASH } from "../../../constants/symbols.js";
import {
  ScreenSection,
  Card,
  Stack,
  Row,
  ListRow,
  Heading,
  Body,
  Caption,
  Button,
  ProgressBar,
} from "../../index.js";
import HomeQuickActions from "../home/HomeQuickActions.jsx";

function formatDate(dateStr) {
  if (!dateStr) return EM_DASH;
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Home = glance + action. Deep insights live on Analytics. */
const Home = () => {
  const navigate = useNavigate();
  const { commitments, sortedCommitments, goals, settings, getEffectiveStatus, todayStr, updateSettings } =
    useCommitTrack();
  const location = useLocation();
  const navWantsTour = Boolean(location.state?.replayGuide || location.state?.startGuide);
  const [tourDismissed, setTourDismissed] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
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

  const { t } = useTranslation();
  const displayName = settings.displayName?.trim() || "there";
  const greeting = t("home.welcome", { name: displayName });

  return (
    <div className="ct-page">
      <AppTourModal
        settings={settings}
        open={tourOpen}
        onComplete={completeTour}
        onDismiss={completeTour}
      />
      <PageHeaderWithNotifications greeting={greeting} headerActions={<PlansButton />} showBrand={false} />

      {isSalariedFamily(settings) && settings.activeProfileId && settings.activeProfileId !== "default" && (
        <Caption className="text-[var(--ct-accent)] font-semibold">
          Profile: {settings.activeProfileId}
        </Caption>
      )}

      <InstallAppBanner />
      <HomeOverviewCard />

      <HomeQuickActions onOpenCalendar={() => setCalendarOpen(true)} scrollToTools={scrollToTools} />

      <MicroTipCard seed={commitments.length + goals.length} />

      <PaymentDeadlineCalendarModal
        key={calendarOpen ? `cal-${todayStr}` : "closed"}
        open={calendarOpen}
        onClose={() => setCalendarOpen(false)}
      />

      <ScreenSection
        title={t("home.upcomingPayments")}
        action={
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate("/commitments")} className="!w-auto">
            {t("home.viewAll")} {CHEVRON}
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
                subtitle={t("home.dueDate", { date: formatDate(item.dueDate) })}
                amount={formatInr(Number(item.amount ?? 0))}
                status={t("bills.dueSoon")}
                statusTone="warning"
              />
            ))}
          </Stack>
        )}
      </ScreenSection>

      {overdue.length > 0 && (
        <ScreenSection title={t("home.overdue")}>
          <Stack gap="sm">
            {overdue.map((item) => (
              <Card key={item.id} variant="flat" className="ct-card-danger !p-0 overflow-hidden">
                <ListRow
                  icon={STATUS_ICONS.overdue}
                  title={item.name}
                  subtitle={t("home.wasDue", { date: formatDate(item.dueDate) })}
                  amount={formatInr(Number(item.amount ?? 0))}
                  status={t("bills.overdue")}
                  statusTone="danger"
                />
              </Card>
            ))}
          </Stack>
        </ScreenSection>
      )}

      {goals.length > 0 && (
        <Card>
          <Stack gap="sm">
            <Row between>
              <Heading level={2}>{t("home.goals")}</Heading>
              <Button type="button" variant="ghost" size="sm" onClick={scrollToTools} className="!w-auto">
                {t("home.manage")} {CHEVRON}
              </Button>
            </Row>
            {goals.slice(0, 2).map((g) => {
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
                      {t("home.goalPerMonth", {
                        amount: formatInr(cap.neededPerMonth),
                        months: cap.monthsLeft,
                      })}
                      {!cap.feasible ? ` ${t("home.exceedsFreeCash")}` : ""}
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

      <DashboardTools />
      <ToolsDiscoveryToast variant="home" />
    </div>
  );
};

export default Home;
