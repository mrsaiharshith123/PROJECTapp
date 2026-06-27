import { useEffect, useMemo, useRef } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { PageShell } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import LedgerAssetsView from "../ledger/LedgerAssetsView.jsx";
import LedgerLiabilitiesView from "../ledger/LedgerLiabilitiesView.jsx";
import LedgerInstrumentsView from "../ledger/LedgerInstrumentsView.jsx";

const TABS = [
  { id: "assets", labelKey: "ledger.tab.assets", tone: "asset" },
  { id: "liabilities", labelKey: "ledger.tab.liabilities", tone: "liability" },
  { id: "instruments", labelKey: "ledger.tab.instruments", tone: "instrument" },
];

function resolveTab(tabParam, stateTab) {
  if (tabParam && TABS.some((x) => x.id === tabParam)) return tabParam;
  if (stateTab && TABS.some((x) => x.id === stateTab)) return stateTab;
  return "assets";
}

/** @route /ledger — Assets, Liabilities, Instruments */
export default function LedgerPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const stateTab = location.state?.tab;
  const tab = useMemo(() => resolveTab(tabParam, stateTab), [tabParam, stateTab]);
  const stateTabClearedRef = useRef(false);

  useEffect(() => {
    if (stateTabClearedRef.current) return;
    if (!stateTab) return;
    if (!TABS.some((x) => x.id === stateTab)) return;

    stateTabClearedRef.current = true;

    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("tab", stateTab);
        return next;
      },
      { replace: true },
    );

    window.history.replaceState({}, document.title, window.location.href);
  }, [stateTab, setSearchParams]);

  const openAddOnMount = Boolean(location.state?.openAdd);

  const switchTab = (id) => {
    setSearchParams({ tab: id }, { replace: true });
  };

  const headerAux = (
    <button
      type="button"
      className="ct-btn ct-btn-ghost ct-btn-sm ct-ledger-bills-chip"
      onClick={() => navigate("/ledger/bills")}
    >
      {t("ledger.headerBills")}
    </button>
  );

  const posToken = (tabId) => (tabId === "assets" ? "asset" : tabId === "liabilities" ? "liab" : "inst");

  return (
    <PageShell title={t("nav.ledger")} headerAux={headerAux} className="ct-ledger-page">
      <div
        style={{
          display: "flex",
          gap: 8,
          padding: "12px 16px 8px",
          overflowX: "auto",
          scrollbarWidth: "none",
        }}
      >
        {TABS.map((item) => {
          const token = posToken(item.id);
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className="ct-pressable"
              onClick={() => switchTab(item.id)}
              style={{
                padding: "7px 18px",
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 500,
                whiteSpace: "nowrap",
                cursor: "pointer",
                border: active
                  ? `1px solid var(--pos-${token}-border)`
                  : "0.5px solid rgba(255,255,255,0.08)",
                background: active ? `var(--pos-${token}-bg)` : "rgba(255,255,255,0.04)",
                color: active ? `var(--pos-${token})` : "var(--ct-text-muted)",
                transition: "all 0.15s",
              }}
            >
              {t(item.labelKey)}
            </button>
          );
        })}
      </div>

      {tab === "assets" ? <LedgerAssetsView openAddOnMount={openAddOnMount} /> : null}
      {tab === "liabilities" ? <LedgerLiabilitiesView openAddOnMount={openAddOnMount} /> : null}
      {tab === "instruments" ? <LedgerInstrumentsView openAddOnMount={openAddOnMount} /> : null}
    </PageShell>
  );
}
