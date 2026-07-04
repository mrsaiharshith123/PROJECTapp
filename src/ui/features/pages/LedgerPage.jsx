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

function resolveTab(tabParam, stateTab) {
  if (tabParam && TABS.some((x) => x.id === tabParam)) return tabParam;
  if (stateTab && TABS.some((x) => x.id === stateTab)) return stateTab;
  return "assets";
}

/** @route /ledger — Assets, Liabilities, Instruments */
export default function LedgerPage() {
  const { t } = useTranslation();
  const { settings, effectiveSubscriptionTier } = usePerovo();
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
  const tier = getTier(settings, effectiveSubscriptionTier);

  return (
    <div className="ed-page-full">
      <header className="ed-masthead">
        <div className="ed-masthead-top">
          <div className="ed-masthead-brand">
            <h1 className="ed-title">{t("nav.ledger")}</h1>
            <p className="ed-masthead-sub">{t("ledger.ed.tagline")}</p>
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
          return (
            <button
              key={item.id}
              type="button"
              className={`ed-mast-tab ed-mast-tab--${token} ${active ? "active" : ""}`}
              onClick={() => switchTab(item.id)}
            >
              {t(item.labelKey)}
            </button>
          );
        })}
      </div>
      {tab === "assets" ? <LedgerAssetsView openAddOnMount={openAddOnMount} /> : null}
      {tab === "liabilities" ? <LedgerLiabilitiesView openAddOnMount={openAddOnMount} /> : null}
      {tab === "instruments" ? <LedgerInstrumentsView openAddOnMount={openAddOnMount} /> : null}
      <div className="ed-safe-bottom" />
    </div>
  );
}
