import { useNavigate, useLocation } from "react-router-dom";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { isSalariedFamily } from "../../../constants/modeExperience.js";
import { InstallAppBanner, PlansButton, ToolsDiscoveryToast } from "../../";
import { isToolsNudgeDismissed } from "../../../utils/toolsDiscoveryStorage.js";
import { AppTourModal } from "../../guidance/AppTourModal.jsx";
import { GuidedEmptyState } from "../../guidance/GuidedEmptyState.jsx";
import { NotificationPanel } from "../NotificationPanel.jsx";
import { NotificationBell } from "../../patterns/NotificationBell.jsx";
import { buildPaycheckTimeline } from "../../../engines/paycheckTimeline.js";
import { combinedMonthlyIncome } from "../../../utils/combinedIncome.js";
import HomePressureHero from "../home/HomePressureHero.jsx";
import HomeQuickActions from "../home/HomeQuickActions.jsx";
import HomeNeedsAttention from "../home/HomeNeedsAttention.jsx";
import HomeGoodNewsLine from "../home/HomeGoodNewsLine.jsx";
import HomeGoalNudge from "../home/HomeGoalNudge.jsx";
import HomeToolsEntry from "../home/HomeToolsEntry.jsx";

/** Home = glance + action. Deep insights live on Money → Insights. */
const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { commitments, settings, getEffectiveStatus, todayStr, updateSettings } = usePerovo();
  const { notificationUnread } = useCommitIntel();
  const [showNotifications, setShowNotifications] = useState(false);
  const [tourActive, setTourActive] = useState(
    () => Boolean(location.state?.replayGuide || location.state?.startGuide),
  );
  const [tourDismissed, setTourDismissed] = useState(false);
  const tourOpen = tourActive && !tourDismissed;
  const isFamily = isSalariedFamily(settings);
  const hasBills = commitments.length > 0;
  const showToolsNudge = !isToolsNudgeDismissed() && commitments.length >= 3;

  const scrollToTools = useCallback(() => {
    navigate("/plan");
  }, [navigate]);

  useEffect(() => {
    if (location.hash === "#dashboard-tools" || location.state?.scrollTools) scrollToTools();
  }, [location.hash, location.state?.scrollTools, scrollToTools]);

  useEffect(() => {
    if (!location.state?.replayGuide && !location.state?.startGuide) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot latch before clearing location.state
    setTourActive(true);
    navigate(location.pathname + location.hash, { replace: true, state: {} });
  }, [location.state?.replayGuide, location.state?.startGuide, location.pathname, location.hash, navigate]);

  const completeTour = () => {
    updateSettings({ appGuideComplete: true });
    setTourDismissed(true);
    setTourActive(false);
  };

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

      <div className="ct-home-top">
        <div className="ct-home-greeting-row">
          <div>
            <p className="text-xs text-[var(--ct-text-muted)] uppercase tracking-wide">{t(greetingKey)}</p>
            <h1 className="text-lg font-semibold text-[var(--ct-text)] mt-0.5">{displayName}</h1>
          </div>
          <span className="ct-home-avatar" aria-hidden>
            {initials}
          </span>
        </div>
        <div className="ct-home-top-actions">
          <PlansButton />
          <NotificationBell unread={notificationUnread} onClick={() => setShowNotifications((v) => !v)} />
        </div>
      </div>

      {showNotifications ? <NotificationPanel onClose={() => setShowNotifications(false)} /> : null}

      <div className="ct-stack ct-home-sections ct-home-enter">
        {!hasBills ? (
          <div className="ct-home-enter-item" style={{ animationDelay: "0ms" }}>
            <GuidedEmptyState guidanceKey="home-score" settings={settings} />
          </div>
        ) : (
          <HomePressureHero
            paycheckBuffer={paycheckBuffer}
            salaryCreditDay={settings.salaryCreditDay}
            todayStr={todayStr}
            isFamily={isFamily}
          />
        )}

        <div className="ct-home-enter-item" style={{ animationDelay: "60ms" }}>
          <HomeQuickActions />
        </div>

        <div className="ct-home-enter-item" style={{ animationDelay: "120ms" }}>
          <HomeNeedsAttention />
        </div>

        <HomeGoodNewsLine />
        <HomeGoalNudge />

        {showToolsNudge ? (
          <div className="ct-home-enter-item" style={{ animationDelay: "240ms" }}>
            <ToolsDiscoveryToast variant="home" inline blocked={tourOpen} />
          </div>
        ) : null}

        <div className="ct-home-enter-item" style={{ animationDelay: "300ms" }}>
          <HomeToolsEntry />
        </div>
      </div>
    </div>
  );
};

export default Home;
