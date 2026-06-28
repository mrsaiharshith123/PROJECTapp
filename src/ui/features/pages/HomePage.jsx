import { useState } from "react";
import { useOnceFromState } from "../../../hooks/useOnceFromState.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { getTier } from "../../../utils/tierAccess.js";
import { AppTourModal } from "../../guidance/AppTourModal.jsx";
import HomeEditorialHeader from "../home/HomeEditorialHeader.jsx";
import HomeNetPositionHero from "../home/HomeNetPositionHero.jsx";
import HomeCategoryTiles from "../home/HomeCategoryTiles.jsx";
import HomeQuickActions from "../home/HomeQuickActions.jsx";
import HomeNeedsAttention from "../home/HomeNeedsAttention.jsx";
import HomeUpcomingSection from "../home/HomeUpcomingSection.jsx";
import HomeSavingGoal from "../home/HomeSavingGoal.jsx";
import HomeFinancialPulse from "../home/HomeFinancialPulse.jsx";
import HomeToolsSection from "../home/HomeToolsSection.jsx";

/** @route / — Home dashboard (Direction H · Editorial Ledger) */
const Home = () => {
  const { settings, updateSettings } = usePerovo();
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

  const tier = getTier(settings);

  return (
    <div className="ct-page ed-paper">
      <AppTourModal
        settings={settings}
        open={tourOpen}
        onComplete={completeTour}
        onDismiss={completeTour}
      />

      <HomeEditorialHeader tier={tier} />

      <div className="ct-home-enter">
        <div className="ct-home-enter-item" style={{ animationDelay: "0ms" }}>
          <HomeNetPositionHero />
        </div>
        <div className="ct-home-enter-item" style={{ animationDelay: "30ms" }}>
          <HomeCategoryTiles />
        </div>
        <div className="ct-home-enter-item" style={{ animationDelay: "50ms" }}>
          <HomeQuickActions />
        </div>
        <div className="ct-home-enter-item" style={{ animationDelay: "70ms" }}>
          <HomeNeedsAttention />
        </div>
        <div className="ct-home-enter-item" style={{ animationDelay: "90ms" }}>
          <HomeUpcomingSection />
        </div>
        <HomeSavingGoal />
        <HomeFinancialPulse />
        <div className="ct-home-enter-item" style={{ animationDelay: "130ms" }}>
          <HomeToolsSection />
        </div>
      </div>
    </div>
  );
};

export default Home;
