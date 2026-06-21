import WealthAnalyticsSection from "../analytics/WealthAnalyticsSection.jsx";
import ProfileNetWorthSection from "../profile/ProfileNetWorthSection.jsx";

/** Money → Wealth — net worth hero, charts, ledger, then supporting panels. */
export default function MoneyWealthPage() {
  return (
    <div className="ct-stack ct-money-wealth">
      <WealthAnalyticsSection
        showSimulation={false}
        showPressureAsLink
        ledgerSlot={<ProfileNetWorthSection />}
      />
    </div>
  );
}
