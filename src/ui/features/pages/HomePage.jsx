import { useState } from "react";
import { useOnceFromState } from "../../../hooks/useOnceFromState.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { getTier } from "../../../utils/tierAccess.js";
import { AppHeaderActions } from "../../patterns/AppHeaderActions.jsx";
import { ToolsDiscoveryToast } from "../../";
import PlansModal from "../profile/PlansModal.jsx";
import { AppTourModal } from "../../guidance/AppTourModal.jsx";
import HomeNetPositionHero from "../home/HomeNetPositionHero.jsx";
import HomeCategoryTiles from "../home/HomeCategoryTiles.jsx";
import HomeNeedsAttention from "../home/HomeNeedsAttention.jsx";
import HomeGoodNewsLine from "../home/HomeGoodNewsLine.jsx";
import HomeUpcomingSection from "../home/HomeUpcomingSection.jsx";
import HomeToolsPreview from "../home/HomeToolsPreview.jsx";

/** @route / — Home dashboard */
const Home = () => {
  const { settings, updateSettings } = usePerovo();
  const [plansOpen, setPlansOpen] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [tourDismissed, setTourDismissed] = useState(false);
  const tourOpen = tourActive && !tourDismissed;

  useOnceFromState("replayGuide", () => setTourActive(true));
  useOnceFromState("startGuide", () => setTourActive(true));

  const completeTour = () => {
    updateSettings({ appGuideComplete: true });
    setTourDismissed(true);
    setTourActive(false);
  };

  const displayName = settings.displayName?.trim() || "there";
  const greetingKey =
    new Date().getHours() < 12
      ? "home.greetingMorning"
      : new Date().getHours() < 17
        ? "home.greetingAfternoon"
        : "home.greetingEvening";
  const { t } = useTranslation();
  const tier = getTier(settings);
  const tierLabel =
    tier === "power" ? t("plans.tier.power") : tier === "pro" ? t("plans.tier.pro") : t("plans.tier.free");

  return (
    <div className="ct-page ct-home-page ct-stack pb-8">
      <ToolsDiscoveryToast variant="home" blocked={tourOpen} />

      <AppTourModal
        settings={settings}
        open={tourOpen}
        onComplete={completeTour}
        onDismiss={completeTour}
      />

      <div className="ct-home-header">
        <div className="ct-home-appbar">
          <span className="ct-home-brand">{t("brand.appName")}</span>
          <div className="ct-home-top-actions">
            <AppHeaderActions
              headerAux={
                tier !== "free" ? (
                  <button
                    type="button"
                    className={`ct-home-tier-chip ${tier}`}
                    onClick={() => setPlansOpen(true)}
                    aria-label={t("profileHub.heroTierAria", { tier: tierLabel })}
                  >
                    {tier === "power" ? "⚡" : "✦"} {tierLabel}
                  </button>
                ) : null
              }
            />
          </div>
        </div>
        <div className="ct-home-greeting-block">
          <p className="ct-home-greeting-time">{t(greetingKey)}</p>
          <h1 className="ct-home-greeting-name">{displayName}</h1>
        </div>
      </div>

      <PlansModal open={plansOpen} onClose={() => setPlansOpen(false)} />

      <div className="ct-stack ct-home-sections ct-home-enter">
        <div className="ct-home-enter-item" style={{ animationDelay: "0ms" }}>
          <HomeNetPositionHero />
        </div>

        <div className="ct-home-enter-item" style={{ animationDelay: "60ms" }}>
          <HomeCategoryTiles />
        </div>

        <div className="ct-home-enter-item" style={{ animationDelay: "120ms" }}>
          <HomeNeedsAttention />
        </div>

        <div className="ct-home-enter-item" style={{ animationDelay: "160ms" }}>
          <HomeUpcomingSection />
        </div>

        <HomeGoodNewsLine />

        <div className="ct-home-enter-item" style={{ animationDelay: "220ms" }}>
          <HomeToolsPreview />
        </div>
      </div>
    </div>
  );
};

export default Home;
