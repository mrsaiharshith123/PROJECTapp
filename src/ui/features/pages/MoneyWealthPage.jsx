import WealthAnalyticsSection from "../analytics/WealthAnalyticsSection.jsx";
import ProfileNetWorthSection from "../profile/ProfileNetWorthSection.jsx";

/** Money → Wealth — net worth intelligence + asset/liability ledger. */
export default function MoneyWealthPage() {
  return (
    <div className="ct-stack ct-money-wealth">
      <WealthAnalyticsSection showSimulation={false} showPressureAsLink />
      <ProfileNetWorthSection />
    </div>
  );
}
