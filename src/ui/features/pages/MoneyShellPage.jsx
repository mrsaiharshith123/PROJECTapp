import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { SegmentedControl } from "../../patterns/SegmentedControl.jsx";
import { PageShell } from "../../index.js";

const MONEY_TABS = [
  { id: "bills", path: "/money/bills", labelKey: "money.tab.bills" },
  { id: "spends", path: "/money/spends", labelKey: "money.tab.spends" },
];

/** Money tab shell — Bills / Spends. */
export default function MoneyShellPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const fadeKey = useRef(location.pathname);

  const segment = location.pathname.split("/")[2] || "bills";
  const tabs = MONEY_TABS;
  const activeTab = tabs.some((tab) => tab.id === segment) ? segment : "bills";

  useEffect(() => {
    fadeKey.current = location.pathname;
  }, [location.pathname]);

  return (
    <PageShell title={t("nav.money")} className="ct-money-shell">
      <div
        className="ct-seg-scroll"
        style={{
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <SegmentedControl
          className="ct-money-segment"
          options={tabs.map((tab) => ({ id: tab.id, label: t(tab.labelKey) }))}
          value={activeTab}
          onChange={(id) => {
            const tab = tabs.find((x) => x.id === id);
            if (tab) navigate(tab.path);
          }}
        />
      </div>
      <div key={location.key} className="ct-money-tab-fade">
        <Outlet />
      </div>
    </PageShell>
  );
}
