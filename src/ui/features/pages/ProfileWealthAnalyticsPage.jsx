import { useNavigate } from "react-router-dom";
import { PageHeader, Button } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import WealthAnalyticsSection from "../analytics/WealthAnalyticsSection.jsx";

/** Profile wealth analytics — assets, liabilities, liquidity, allocation (not monthly cashflow). */
export default function ProfileWealthAnalyticsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="ct-page">
      <PageHeader
        title={t("profile.analytics.title")}
        eyebrow={t("netWorth.pageTitle")}
        subtitle={t("profile.analytics.subtitle")}
      />

      <WealthAnalyticsSection />

      <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/profile")}>
        {t("profile.analytics.back")}
      </Button>
    </div>
  );
}
