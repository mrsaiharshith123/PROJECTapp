import { useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { useStabilityIntel } from "../../../hooks/useStabilityIntel.js";
import { computeGoalProgress, goalTypeLabel } from "../../../engines/goalsProgress.js";
import {
  InstallAppBanner,
  PageHeaderWithNotifications,
  PlansButton,
  ToolsDiscoveryToast,
} from "../../";
import { isSalariedFamily } from "../../../constants/modeExperience.js";
import { GuidedEmptyState } from "../../guidance/GuidedEmptyState.jsx";
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
import HomePerovoDashboard from "../home/HomePerovoDashboard.jsx";
import HomeQuickActions from "../home/HomeQuickActions.jsx";
import HomeNeedsAttention from "../home/HomeNeedsAttention.jsx";
import HomeInsightsSection from "../home/HomeInsightsSection.jsx";
import SafeToSpendCard from "../paycheck/SafeToSpendCard.jsx";
import { buildPaycheckTimeline } from "../../../engines/paycheckTimeline.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";

function formatDate(dateStr) {
  if (!dateStr) return EM_DASH;
  return new Date(dateStr + "T12:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/** Home = glance + action. Deep insights live on Analytics. */
const Home = () => {
  const navigate = useNavigate();
  const { commitments, sortedCommitments, goals, settings, getEffectiveStatus, todayStr, updateSettings } =
    usePerovo();
  const location = useLocation();
  const [tourActive, setTourActive] = useState(
    () => Boolean(location.state?.replayGuide || location.state?.startGuide),
  );
  const [tourDismissed, setTourDismissed] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const tourOpen = tourActive && !tourDismissed;
  const stable = useStabilityIntel();
  const intel = useCommitIntel();
  const isFamily = isSalariedFamily(settings);
  const scrollToTools = useCallback(() => {
    navigate("/plan");
  }, [navigate]);

  useEffect(() => {
    if (location.hash === "#dashboard-tools" || location.state?.scrollTools) scrollToTools();
  }, [location.hash, location.state?.scrollTools, scrollToTools]);

  useEffect(() => {
    if (!location.state?.replayGuide && !location.state?.startGuide) return;
    // Latch tour when arriving from onboarding / profile replay; then strip router state.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot latch before clearing location.state
    setTourActive(true);
    navigate(location.pathname + location.hash, { replace: true, state: {} });
  }, [location.state?.replayGuide, location.state?.startGuide, location.pathname, location.hash, navigate]);

  const completeTour = () => {
    updateSettings({ appGuideComplete: true });
    setTourDismissed(true);
    setTourActive(false);
  };

  const openRemaining = commitments.reduce(
    (s, c) => s + monthlyBurdenForCommitment(c, getEffectiveStatus),
    0
  );

  const upcoming = sortedCommitments
    .filter((c) => isActiveBill(c, getEffectiveStatus, todayStr) && getEffectiveStatus(c) === "pending")
    .slice(0, 3);

  const income = combinedMonthlyIncome(settings);
  const paycheckBuffer = useMemo(
    () =>
      settings.salaryCreditDay
        ? buildPaycheckTimeline({
            commitments,
            getEffectiveStatus,
            salaryCreditDay: settings.salaryCreditDay,
            income,
            todayStr,
          }).bufferAfterBills
        : 0,
    [commitments, getEffectiveStatus, settings.salaryCreditDay, income, todayStr],
  );

  const { t } = useTranslation();
  const displayName = settings.displayName?.trim() || "there";
  const greetingKey =
    new Date().getHours() < 12
      ? "home.greetingMorning"
      : new Date().getHours() < 17
        ? "home.greetingAfternoon"
        : "home.greetingEvening";
  const initials =
    displayName !== "there"
      ? displayName
          .split(/\s+/)
          .map((w) => w[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : "?";

  return (
    <div className="ct-page ct-home-page ct-stack pb-8">
      <InstallAppBanner />

      <AppTourModal
        settings={settings}
        open={tourOpen}
        onComplete={completeTour}
        onDismiss={completeTour}
      />

      <div className="ct-home-greeting-row">
        <div>
          <p className="text-xs text-[var(--ct-text-muted)] uppercase tracking-wide">{t(greetingKey)}</p>
          <h1 className="text-lg font-semibold text-[var(--ct-text)] mt-0.5">{displayName}</h1>
        </div>
        <span className="ct-home-avatar" aria-hidden>
          {initials}
        </span>
      </div>

      <PageHeaderWithNotifications headerActions={<PlansButton />} showBrand={false} />

      <div className="ct-stack ct-home-sections">
        <HomePerovoDashboard />

        <HomeQuickActions onOpenCalendar={() => setCalendarOpen(true)} scrollToTools={scrollToTools} />

        <HomeNeedsAttention />

        <HomeInsightsSection seed={commitments.length + goals.length} />

        {settings.salaryCreditDay && (
          <SafeToSpendCard
            compact
            bufferAfterBills={paycheckBuffer}
            salaryCreditDay={settings.salaryCreditDay}
            todayStr={todayStr}
            scope={isFamily ? "household" : "personal"}
          />
        )}

        <PaymentDeadlineCalendarModal
          key={calendarOpen ? `cal-${todayStr}` : "closed"}
          open={calendarOpen}
          onClose={() => setCalendarOpen(false)}
        />

        <ScreenSection
          title={t("home.upcomingPayments")}
          action={
            <Button type="button" variant="ghost" size="sm" onClick={() => navigate("/money/bills")} className="!w-auto">
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

        <Card className="ct-pressable cursor-pointer" onClick={() => navigate("/plan")}>
          <Row between>
            <div>
              <Heading level={2}>{t("nav.plan")}</Heading>
              <Caption className="block mt-1">{t("plan.subtitle")}</Caption>
            </div>
            <span className="text-[var(--ct-text-muted)]">{CHEVRON}</span>
          </Row>
        </Card>
      </div>
      <ToolsDiscoveryToast variant="home" blocked={tourOpen} />
    </div>
  );
};

export default Home;
