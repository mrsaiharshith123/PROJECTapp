import { useNavigate } from "react-router-dom";
import { PageHeader, Button } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { isSalariedFamily } from "../../../constants/modeExperience.js";
import WealthAnalyticsSection from "../analytics/WealthAnalyticsSection.jsx";

/** Profile wealth analytics — assets, liabilities, liquidity, allocation (not monthly cashflow). */
export default function ProfileWealthAnalyticsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { settings } = usePerovo();
  const isFamily = isSalariedFamily(settings);

  return (
    <div className="ct-page ct-stack pb-8">
      <PageHeader
        title={isFamily ? t("profile.analytics.titleHousehold") : t("profile.analytics.title")}
        eyebrow={isFamily ? t("netWorth.pageTitleHousehold") : t("netWorth.pageTitle")}
        subtitle={isFamily ? t("profile.analytics.subtitleHousehold") : t("profile.analytics.subtitle")}
      />

      <WealthAnalyticsSection />

      <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/profile")}>
        {t("profile.analytics.back")}
      </Button>
    </div>
  );
}
