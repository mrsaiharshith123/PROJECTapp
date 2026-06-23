import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { useCommitIntel } from "../../../hooks/useCommitIntel.js";
import { InstallAppBanner, PlansButton } from "../../";
import { AppTourModal } from "../../guidance/AppTourModal.jsx";
import { NotificationPanel } from "../NotificationPanel.jsx";
import { NotificationBell } from "../../patterns/NotificationBell.jsx";
import HomeNetPositionHero from "../home/HomeNetPositionHero.jsx";
import HomeCategoryTiles from "../home/HomeCategoryTiles.jsx";
import HomeNeedsAttention from "../home/HomeNeedsAttention.jsx";
import HomeGoodNewsLine from "../home/HomeGoodNewsLine.jsx";
import HomeUpcomingSection from "../home/HomeUpcomingSection.jsx";
import HomeQuickActions from "../home/HomeQuickActions.jsx";
import HomeToolsPreview from "../home/HomeToolsPreview.jsx";

/** Home — financial position dashboard. */
const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings, updateSettings } = usePerovo();
  const { notificationUnread } = useCommitIntel();
  const [showNotifications, setShowNotifications] = useState(false);
  const [tourActive, setTourActive] = useState(
    () => Boolean(location.state?.replayGuide || location.state?.startGuide),
  );
  const [tourDismissed, setTourDismissed] = useState(false);
  const tourOpen = tourActive && !tourDismissed;

  useEffect(() => {
    if (!location.state?.replayGuide && !location.state?.startGuide) return;
    navigate(location.pathname + location.hash, { replace: true, state: {} });
  }, [location.state?.replayGuide, location.state?.startGuide, location.pathname, location.hash, navigate]);

  const completeTour = () => {
    updateSettings({ appGuideComplete: true });
    setTourDismissed(true);
    setTourActive(false);
  };

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
        </div>
        <div className="ct-home-top-actions">
          <span className="ct-home-avatar" aria-hidden>{initials}</span>
          <PlansButton />
          <NotificationBell unread={notificationUnread} onClick={() => setShowNotifications((v) => !v)} />
        </div>
      </div>

      {showNotifications ? <NotificationPanel onClose={() => setShowNotifications(false)} /> : null}

      <div className="ct-stack ct-home-sections ct-home-enter">
        <div className="ct-home-enter-item" style={{ animationDelay: "0ms" }}>
          <HomeNetPositionHero />
        </div>

        <div className="ct-home-enter-item" style={{ animationDelay: "60ms" }}>
          <HomeCategoryTiles />
        </div>

        <div className="ct-home-enter-item" style={{ animationDelay: "120ms" }}>
          <HomeQuickActions />
        </div>

        <div className="ct-home-enter-item" style={{ animationDelay: "160ms" }}>
          <HomeNeedsAttention />
        </div>

        <div className="ct-home-enter-item" style={{ animationDelay: "200ms" }}>
          <HomeUpcomingSection />
        </div>

        <HomeGoodNewsLine />

        <div className="ct-home-enter-item" style={{ animationDelay: "260ms" }}>
          <HomeToolsPreview />
        </div>
      </div>
    </div>
  );
};

export default Home;
