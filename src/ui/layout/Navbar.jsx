import { useNavigate, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect, useState, useCallback } from "react";
import { usePerovo } from "../../context/PerovoContext.jsx";
import { navItemsForMode } from "../../constants/userModes.js";
import { resolveUserMode } from "../../constants/modeExperience.js";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { cn } from "../utils/cn.js";
import { CtIcon } from "../icons/CtIcon.jsx";
import { Modal } from "../primitives/Modal.jsx";
import { FAB_CHANGE_EVENT } from "../../constants/fabEvents.js";

const BillScannerTool = lazy(() => import("../features/tools/BillScannerTool.jsx"));
const LoanSanctionScannerTool = lazy(() => import("../features/tools/LoanSanctionScannerTool.jsx"));
const InsurancePolicyScannerTool = lazy(() => import("../features/tools/InsurancePolicyScannerTool.jsx"));

/** @param {{ to: string, navGroup?: string }} item @param {{ pathname: string }} location */
function isNavItemActive(item, location) {
  const path = location.pathname;
  if (item.navGroup === "ledger") {
    return (
      path.startsWith("/ledger") ||
      path.startsWith("/ledger/bills") ||
      path === "/money/bills" ||
      path === "/commitments"
    );
  }
  if (item.navGroup === "insights") {
    return path === "/insights" || path.startsWith("/insights/") || path.startsWith("/insights?") || path === "/analytics";
  }
  if (item.navGroup === "agreements") {
    return path.startsWith("/agreements") || path.startsWith("/lending") || path.startsWith("/money/lending");
  }
  if (item.navGroup === "money") {
    return (
      path.startsWith("/money") ||
      path.startsWith("/commitments") ||
      path.startsWith("/lending") ||
      path === "/analytics"
    );
  }
  if (item.navGroup === "plan") {
    return path === "/plan" || path === "/tools";
  }
  if (item.to === "/") return path === "/";
  return path === item.to || path.startsWith(`${item.to}/`);
}

function FabRadialMenu({ open, onClose, navTo, onScanBill, onScanLoan, onScanInsurance, onRequestMoney }) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <>
      <div className="ed-backdrop" onClick={onClose} aria-hidden />
      <div className="ed-fab-menu" role="menu" aria-label={t("nav.fabAria")}>
        <button
          type="button"
          className="ed-row ed-row-press"
          role="menuitem"
          onClick={() => {
            navTo("/add");
            onClose();
          }}
        >
          <span className="ed-row-icon">
            <CtIcon name="clipboard-text" size={16} />
          </span>
          <span className="ed-row-title">{t("nav.fabAddCommitment")}</span>
        </button>
        <button
          type="button"
          className="ed-row ed-row-press"
          role="menuitem"
          onClick={() => {
            onScanBill();
            onClose();
          }}
        >
          <span className="ed-row-icon">
            <CtIcon name="receipt" size={16} />
          </span>
          <span className="ed-row-title">{t("tools.billScanner.title")}</span>
        </button>
        <button
          type="button"
          className="ed-row ed-row-press"
          role="menuitem"
          onClick={() => {
            onScanLoan();
            onClose();
          }}
        >
          <span className="ed-row-icon">
            <CtIcon name="file-text" size={16} />
          </span>
          <span className="ed-row-title">{t("tools.loanScanner.title")}</span>
        </button>
        <button
          type="button"
          className="ed-row ed-row-press"
          role="menuitem"
          onClick={() => {
            onScanInsurance();
            onClose();
          }}
        >
          <span className="ed-row-icon">
            <CtIcon name="umbrella" size={16} />
          </span>
          <span className="ed-row-title">{t("tools.insuranceScanner.title")}</span>
        </button>
        <button
          type="button"
          className="ed-row ed-row-press"
          role="menuitem"
          onClick={() => {
            onRequestMoney();
            onClose();
          }}
        >
          <span className="ed-row-icon">
            <CtIcon name="handshake" size={16} />
          </span>
          <span className="ed-row-title">{t("nav.fabRequestMoney")}</span>
        </button>
      </div>
    </>
  );
}

export function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = usePerovo();
  const { t } = useTranslation();
  const [scanBillOpen, setScanBillOpen] = useState(false);
  const [scanLoanOpen, setScanLoanOpen] = useState(false);
  const [scanInsuranceOpen, setScanInsuranceOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);

  const hideOnYouSubpage = location.pathname.startsWith("/you/");
  const hideOnInsightsSubpage = /^\/insights\/.+/.test(location.pathname);

  const navTo = useCallback((to) => {
    setFabOpen(false);
    setScanBillOpen(false);
    setScanLoanOpen(false);
    setScanInsuranceOpen(false);
    navigate(to);
  }, [navigate]);

  useEffect(() => {
    if (fabOpen) document.body.setAttribute("data-fab-open", "1");
    else document.body.removeAttribute("data-fab-open");
    window.dispatchEvent(new CustomEvent(FAB_CHANGE_EVENT, { detail: { open: fabOpen } }));
  }, [fabOpen]);

  const navItems = navItemsForMode(resolveUserMode(settings));
  const navLabel = (item) => (item.labelKey ? t(item.labelKey) : item.label);

  const openRequestMoney = useCallback(() => {
    navigate("/agreements", { state: { openRequest: true } });
  }, [navigate]);

  if (hideOnYouSubpage || hideOnInsightsSubpage) return null;

  const toggleFab = () => setFabOpen((v) => !v);
  const closeFab = () => setFabOpen(false);

  return (
    <>
      <FabRadialMenu
        open={fabOpen}
        onClose={closeFab}
        navTo={navTo}
        onScanBill={() => setScanBillOpen(true)}
        onScanLoan={() => setScanLoanOpen(true)}
        onScanInsurance={() => setScanInsuranceOpen(true)}
        onRequestMoney={openRequestMoney}
      />

      <nav className="ed-nav" aria-label={t("nav.mainAria")}>
        <div className="ed-nav-inner">
          {navItems.map((item) => {
            if (item.fab) {
              return (
                <div key={item.to} className="ed-nav-fab-slot">
                  <button
                    type="button"
                    className={cn("ed-nav-fab", fabOpen && "active")}
                    aria-label={t("nav.fabAria")}
                    onClick={toggleFab}
                  >
                    <span className="ed-nav-fab-plus">+</span>
                  </button>
                </div>
              );
            }
            const active = isNavItemActive(item, location);
            return (
              <button
                key={item.to}
                type="button"
                className={cn("ed-nav-item", active && "active")}
                onClick={() => navTo(item.to)}
              >
                <CtIcon name={item.icon} size={20} />
                <span className="ed-nav-label">{navLabel(item)}</span>
                <span className="ed-nav-dot" />
              </button>
            );
          })}
        </div>
      </nav>

      {scanBillOpen && (
        <Suspense fallback={null}>
          <Modal title={t("tools.billScanner.title")} onClose={() => setScanBillOpen(false)}>
            <BillScannerTool />
          </Modal>
        </Suspense>
      )}

      {scanLoanOpen && (
        <Suspense fallback={null}>
          <Modal title={t("tools.loanScanner.title")} onClose={() => setScanLoanOpen(false)}>
            <LoanSanctionScannerTool />
          </Modal>
        </Suspense>
      )}

      {scanInsuranceOpen && (
        <Suspense fallback={null}>
          <Modal title={t("tools.insuranceScanner.title")} onClose={() => setScanInsuranceOpen(false)}>
            <InsurancePolicyScannerTool />
          </Modal>
        </Suspense>
      )}
    </>
  );
}

export default Navbar;
