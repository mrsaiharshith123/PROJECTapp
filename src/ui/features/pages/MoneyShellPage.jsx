import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { getUserModeConfig } from "../../../constants/userModes.js";

const MONEY_TABS = [
  { id: "bills", path: "/money/bills", labelKey: "money.tab.bills" },
  { id: "lending", path: "/money/lending", labelKey: "money.tab.lending" },
  { id: "insights", path: "/money/insights", labelKey: "money.tab.insights" },
];

/** Money tab shell — bills, lending, and insights under one IA bucket. */
export default function MoneyShellPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = usePerovo();
  const showLending = getUserModeConfig(settings.userMode || "salaried").showLending;

  const segment = location.pathname.split("/")[2] || "bills";
  const tabs = MONEY_TABS.filter((tab) => tab.id !== "lending" || showLending);

  const activeTab = tabs.some((tab) => tab.id === segment) ? segment : "bills";

  return (
    <div className="ct-stack">
      <SegmentedControl
        options={tabs.map((tab) => ({ id: tab.id, label: t(tab.labelKey) }))}
        value={activeTab}
        onChange={(id) => {
          const tab = tabs.find((x) => x.id === id);
          if (tab) navigate(tab.path);
        }}
      />
      <Outlet />
    </div>
  );
}
