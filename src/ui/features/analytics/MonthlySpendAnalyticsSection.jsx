import { Heading, Caption } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";

/** Monthly bills, paycheck, and spend charts — grouped for clarity on Analytics. */
export default function MonthlySpendAnalyticsSection({ children }) {
  const { t } = useTranslation();

  return (
    <section className="ct-analytics-section ct-stack" id="monthly-spend-analytics">
      <div className="ct-hero-card pressure relative">
        <div className="ct-hero-glow teal" aria-hidden />
        <div className="relative">
          <Heading level={2} className="!text-base !font-semibold">
            {t("analytics.monthly.title")}
          </Heading>
          <Caption className="block mt-1">{t("analytics.monthly.subtitle")}</Caption>
        </div>
      </div>
      <div className="ct-stack">{children}</div>
    </section>
  );
}
