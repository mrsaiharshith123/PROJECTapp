import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import { PageShell } from "../../index.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { getUserModeConfig } from "../../../constants/userModes.js";

const MONEY_TABS = [
  { id: "bills", path: "/money/bills", labelKey: "money.tab.bills" },
  { id: "spends", path: "/money/spends", labelKey: "money.tab.spends" },
  { id: "lending", path: "/money/lending", labelKey: "money.tab.lending" },
];

/** Money tab shell — Bills / Spends / Lending with cross-fade content. */
export default function MoneyShellPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = usePerovo();
  const showLending = getUserModeConfig(settings.userMode || "salaried").showLending;
  const fadeKey = useRef(location.pathname);

  const segment = location.pathname.split("/")[2] || "bills";
  const tabs = MONEY_TABS.filter((tab) => tab.id !== "lending" || showLending);
  const activeTab = tabs.some((tab) => tab.id === segment) ? segment : "bills";

  useEffect(() => {
    fadeKey.current = location.pathname;
  }, [location.pathname]);

  return (
    <PageShell title={t("nav.money")} className="ct-money-shell">
      <SegmentedControl
        className="ct-money-segment"
        options={tabs.map((tab) => ({ id: tab.id, label: t(tab.labelKey) }))}
        value={activeTab}
        onChange={(id) => {
          const tab = tabs.find((x) => x.id === id);
          if (tab) navigate(tab.path);
        }}
      />
      <div key={location.pathname} className="ct-money-tab-fade">
        <Outlet />
      </div>
    </PageShell>
  );
}
