import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { PageShell } from "../../index.js";

const LEDGER_OPS_TABS = [
  { id: "bills", path: "/ledger/bills", labelKey: "money.tab.bills", subtitleKey: "money.bills.sectionSub", tone: "liab" },
];

/** Ledger bills shell — nested under /ledger/bills. */
export default function LedgerOpsShell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const fadeKey = useRef(location.pathname);

  const segment = location.pathname.split("/")[2] || "bills";
  const tabs = LEDGER_OPS_TABS;
  const activeTab = tabs.some((tab) => tab.id === segment) ? segment : "bills";
  const activeMeta = tabs.find((tab) => tab.id === activeTab) || tabs[0];

  useEffect(() => {
    fadeKey.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    if (segment === "spends") {
      navigate("/ledger/bills", { replace: true });
    }
  }, [segment, navigate]);

  return (
    <PageShell
      title={t("nav.ledger")}
      subtitle={t(activeMeta.subtitleKey)}
      className="ct-ledger-ops-shell"
    >
      <div key={location.key} className="ct-money-tab-fade">
        <Outlet />
      </div>
    </PageShell>
  );
}
