import WealthAnalyticsSection from "../analytics/WealthAnalyticsSection.jsx";
import ProfileNetWorthSection from "../profile/ProfileNetWorthSection.jsx";
import { SubPageHeader } from "../../patterns/SubPageHeader.jsx";
import { useTranslation } from "../../../i18n/I18nProvider.js";

/** Money → Wealth — net worth hero, charts, ledger, then supporting panels. */
export default function MoneyWealthPage() {
  const { t } = useTranslation();

  return (
    <div className="ct-page ct-money-wealth pb-8">
      <SubPageHeader title={t("money.tab.wealth")} />
      <div className="ct-stack ct-money-wealth-body">
        <div className="ct-hero-card wealth relative mx-4">
          <div className="ct-hero-glow teal" aria-hidden />
          <p className="ct-analytics-section-title relative">{t("money.tab.wealth")}</p>
          <p className="ct-analytics-section-sub mt-1 relative">{t("analytics.wealth.subtitle")}</p>
        </div>
        <WealthAnalyticsSection
          showSimulation={false}
          showPressureAsLink
          ledgerSlot={<ProfileNetWorthSection />}
        />
      </div>
    </div>
  );
}
