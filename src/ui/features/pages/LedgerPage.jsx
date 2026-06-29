import { useEffect, useMemo, useRef } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { getTier } from "../../../utils/tierAccess.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import HomeEditorialAvatar from "../home/HomeEditorialAvatar.jsx";
import LedgerAssetsView from "../ledger/LedgerAssetsView.jsx";
import LedgerLiabilitiesView from "../ledger/LedgerLiabilitiesView.jsx";
import LedgerInstrumentsView from "../ledger/LedgerInstrumentsView.jsx";

const TABS = [
  { id: "assets", labelKey: "ledger.tab.assets", tone: "asset" },
  { id: "liabilities", labelKey: "ledger.tab.liabilities", tone: "liability" },
  { id: "instruments", labelKey: "ledger.tab.instruments", tone: "instrument" },
];

const POS_COLORS = {
  asset: { color: "var(--ed-green)", border: "var(--ed-green)", bg: "rgba(94,199,149,0.1)" },
  liab: { color: "var(--ed-red)", border: "var(--ed-red)", bg: "rgba(232,148,144,0.1)" },
  instrument: { color: "var(--ed-violet)", border: "var(--ed-violet)", bg: "rgba(179,160,232,0.1)" },
};

function resolveTab(tabParam, stateTab) {
  if (tabParam && TABS.some((x) => x.id === tabParam)) return tabParam;
  if (stateTab && TABS.some((x) => x.id === stateTab)) return stateTab;
  return "assets";
}

/** @route /ledger — Assets, Liabilities, Instruments */
export default function LedgerPage() {
  const { t } = useTranslation();
  const { settings } = usePerovo();
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

  const posToken = (tabId) => (tabId === "assets" ? "asset" : tabId === "liabilities" ? "liab" : "instrument");
  const tier = getTier(settings);

  return (
    <div className="ct-page ed-paper">
      <header className="ed-masthead">
        <div className="ed-masthead-top">
          <div className="ed-masthead-brand">
            <h1 className="ed-title">{t("nav.ledger")}</h1>
            <div className="ed-tagline">{t("ledger.ed.tagline")}</div>
          </div>
          <div className="ed-masthead-right">
            <HomeEditorialAvatar tier={tier} />
          </div>
        </div>
      </header>

      <div className="ed-mast-tabs">
        {TABS.map((item) => {
          const token = posToken(item.id);
          const active = tab === item.id;
          const tc = POS_COLORS[token];
          return (
            <button
              key={item.id}
              type="button"
              className="ct-pressable"
              onClick={() => switchTab(item.id)}
              style={{
                padding: "6px 18px",
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: "nowrap",
                cursor: "pointer",
                fontFamily: "'Inter', system-ui, sans-serif",
                border: active ? `1px solid ${tc.border}` : "0.5px solid var(--ed-rule)",
                background: active ? tc.bg : "transparent",
                color: active ? tc.color : "var(--ed-ink-faint)",
                transition: "all 0.15s",
                letterSpacing: ".02em",
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
    </div>
  );
}
