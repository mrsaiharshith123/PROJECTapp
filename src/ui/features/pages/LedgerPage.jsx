import { useEffect, useMemo, useRef } from "react";
import { useSearchParams, useLocation, useNavigate } from "react-router-dom";
import { PageShell } from "../../index.js";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { CtIcon } from "../../icons/CtIcon.jsx";
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

  const insightsAction = (
    <button
      type="button"
      className="ct-btn ct-btn-ghost ct-btn-sm"
      onClick={() => navigate("/money/wealth")}
    >
      <CtIcon name="chart-bar" size={15} />
      {t("ledger.insightsBtn")}
    </button>
  );

  return (
    <PageShell title={t("nav.ledger")} action={insightsAction} className="ct-ledger-page">
      <div className="pos-ledger-pill-switcher">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`pos-ledger-pill ${tab === item.id ? `active ${item.tone}` : ""}`}
            onClick={() => switchTab(item.id)}
          >
            {t(item.labelKey)}
          </button>
        ))}
      </div>

      {tab === "assets" ? <LedgerAssetsView openAddOnMount={openAddOnMount} /> : null}
      {tab === "liabilities" ? <LedgerLiabilitiesView openAddOnMount={openAddOnMount} /> : null}
      {tab === "instruments" ? <LedgerInstrumentsView openAddOnMount={openAddOnMount} /> : null}
    </PageShell>
  );
}
