import { useState } from "react";
import { useOnceFromState } from "../../../hooks/useOnceFromState.js";
import { PageShell } from "../../index.js";
import HouseholdCommandPanel from "../analytics/HouseholdCommandPanel.jsx";
import HouseholdSpendPanel from "../analytics/HouseholdSpendPanel.jsx";
import FamilyMonthlyReportCard from "../household/FamilyMonthlyReportCard.jsx";
import InsightsHub from "../insights/InsightsHub.jsx";
import { useInsightsData } from "../insights/useInsightsData.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import { TabContent } from "../../patterns/TabContent.jsx";

function AnalyticsSectionHead({ title, subtitle, tone = "indigo" }) {
  return (
    <div className={`pos-tile ${tone} mb-1`}>
      <p className="ct-analytics-section-title">{title}</p>
      {subtitle ? <p className="ct-analytics-section-sub">{subtitle}</p> : null}
    </div>
  );
}

/** @route /insights — category sections with swipeable insight cards */
const Analytics = () => {
  const { t } = useTranslation();
  const [householdView, setHouseholdView] = useState("self");

  useOnceFromState("openHousehold", () => setHouseholdView("household"));
  const analyticsView = householdView === "household" ? "household" : "self";
  const { isFamily, ...carouselData } = useInsightsData(analyticsView);

  const householdTabs = [
    { id: "self", label: t("analytics.household.viewSelf") },
    { id: "household", label: t("analytics.household.viewHouse") },
  ];

  const showSelfView = !isFamily || analyticsView === "self";

  if (!isFamily) {
    return <InsightsHub data={carouselData} />;
  }

  return (
    <PageShell title={t("nav.insights")} className="ct-analytics-page">
      <div className="px-4 mb-2">
        <SegmentedControl
          options={householdTabs}
          value={analyticsView}
          onChange={(id) => setHouseholdView(id === "household" ? "household" : "self")}
        />
      </div>

      <TabContent tabId="self" activeTab={analyticsView}>
        {showSelfView ? <InsightsHub data={carouselData} nested /> : null}
      </TabContent>

      <TabContent tabId="household" activeTab={analyticsView}>
        {!showSelfView ? (
          <div className="ct-stack ct-list-animate px-4">
            <AnalyticsSectionHead
              title={t("analytics.section.household")}
              subtitle={t("analytics.section.householdHint")}
              tone="agreement"
            />
            <HouseholdCommandPanel />
            <HouseholdSpendPanel />
            <FamilyMonthlyReportCard />
          </div>
        ) : null}
      </TabContent>
    </PageShell>
  );
};

export default Analytics;
