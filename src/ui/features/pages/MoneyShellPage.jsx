import { useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/I18nProvider.js";
import { usePerovo } from "../../../context/PerovoContext.jsx";
import { getTier } from "../../../utils/tierAccess.js";
import { EditorialMastheadRight } from "../../patterns/EditorialMastheadRight.jsx";

/** Ledger bills shell — nested under /ledger/bills. */
export default function LedgerOpsShell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const fadeKey = useRef(location.pathname);
  const { settings, effectiveSubscriptionTier } = usePerovo();
  const tier = getTier(settings, effectiveSubscriptionTier);

  useEffect(() => {
    fadeKey.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    const segment = location.pathname.split("/")[2] || "bills";
    if (segment === "spends") {
      navigate("/ledger/bills", { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="ed-page-full">
      <header className="ed-masthead">
        <div className="ed-masthead-top">
          <div className="ed-masthead-brand">
            <h1 className="ed-title">{t("nav.ledger")}</h1>
            <p className="ed-masthead-sub">{t("money.bills.sectionSub")}</p>
          </div>
          <EditorialMastheadRight tier={tier} />
        </div>
      </header>

      <div key={location.key}>
        <Outlet />
      </div>
    </div>
  );
}
