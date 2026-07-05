import { useState } from "react";
import { useOnceFromState } from "../../../hooks/useOnceFromState.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { getTier } from "../../../utils/tierAccess.js";
import { AppTourModal } from "../../guidance/AppTourModal.jsx";
import HomeEditorialHeader from "../home/HomeEditorialHeader.jsx";
import { EngineGuard } from "../../primitives/EngineGuard.jsx";
import HomeNetPositionHero from "../home/HomeNetPositionHero.jsx";
import HomeCategoryTiles from "../home/HomeCategoryTiles.jsx";
import HomeQuickActions from "../home/HomeQuickActions.jsx";
import HomeNeedsAttention from "../home/HomeNeedsAttention.jsx";
import HomeUpcomingSection from "../home/HomeUpcomingSection.jsx";
import HomeSavingGoal from "../home/HomeSavingGoal.jsx";
import HomeToolsSection from "../home/HomeToolsSection.jsx";

/** @route / — Home dashboard (Direction H · Editorial Ledger) */
const Home = () => {
  const { settings, updateSettings, effectiveSubscriptionTier } = usePerovo();
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

  const tier = getTier(settings, effectiveSubscriptionTier);

  return (
    <div className="ed-paper">
      <AppTourModal
        settings={settings}
        open={tourOpen}
        onComplete={completeTour}
        onDismiss={completeTour}
      />

      <HomeEditorialHeader tier={tier} />

      <div className="ed-home-body">
        <HomeNetPositionHero />
        <HomeCategoryTiles />
        <HomeQuickActions />
        <EngineGuard>
          <HomeNeedsAttention />
        </EngineGuard>
        <EngineGuard>
          <HomeUpcomingSection />
        </EngineGuard>
        <HomeSavingGoal />
        <HomeToolsSection />
      </div>
      <div className="ed-safe-bottom" />
    </div>
  );
};

export default Home;
