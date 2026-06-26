import WealthAnalyticsSection from "../analytics/WealthAnalyticsSection.jsx";
import ProfileNetWorthSection from "../profile/ProfileNetWorthSection.jsx";
import { SubPageHeader } from "../../patterns/SubPageHeader.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";

/** Money → Wealth — net worth hero, charts, ledger, then supporting panels. */
export default function MoneyWealthPage() {
  const { t } = useTranslation();

  return (
    <div className="ct-page ct-money-wealth pb-8">
      <SubPageHeader title={t("money.tab.wealth")} subtitle={t("analytics.wealth.subtitle")} />
      <div className="ct-stack ct-money-wealth-body">
        <WealthAnalyticsSection
          showSimulation={false}
          showPressureAsLink
          ledgerSlot={<ProfileNetWorthSection />}
        />
      </div>
    </div>
  );
}
