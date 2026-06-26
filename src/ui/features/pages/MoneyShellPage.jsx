import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { PageShell } from "../../index.js";

const LEDGER_OPS_TABS = [
  { id: "bills", path: "/ledger/bills", labelKey: "money.tab.bills", subtitleKey: "money.bills.sectionSub", tone: "liab" },
  { id: "spends", path: "/ledger/spends", labelKey: "money.tab.spends", subtitleKey: "money.spends.sectionSub", tone: "inst" },
];

/** Ledger bills / spends shell — nested under /ledger/bills and /ledger/spends. */
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

  return (
    <PageShell
      title={t("nav.ledger")}
      subtitle={t(activeMeta.subtitleKey)}
      className="ct-ledger-ops-shell"
    >
      <div className="ct-money-pill-tabs">
        {tabs.map((item) => {
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className="ct-pressable"
              onClick={() => navigate(item.path)}
              style={{
                padding: "7px 18px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 500,
                whiteSpace: "nowrap",
                cursor: "pointer",
                border: active
                  ? `1px solid var(--pos-${item.tone}-border)`
                  : "0.5px solid rgba(255,255,255,0.08)",
                background: active ? `var(--pos-${item.tone}-bg)` : "rgba(255,255,255,0.04)",
                color: active ? `var(--pos-${item.tone})` : "var(--ct-text-muted)",
              }}
            >
              {t(item.labelKey)}
            </button>
          );
        })}
      </div>
      <div key={location.key} className="ct-money-tab-fade">
        <Outlet />
      </div>
    </PageShell>
  );
}
