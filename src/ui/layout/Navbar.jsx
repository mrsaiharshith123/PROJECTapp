import { useNavigate, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect, useRef, useState, useCallback } from "react";
import { usePerovo } from "../../context/PerovoContext.jsx";
import { navItemsForMode } from "../../constants/userModes.js";
import { resolveUserMode } from "../../constants/modeExperience.js";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { cn } from "../utils/cn.js";
import { CtIcon } from "../icons/CtIcon.jsx";
import { Modal } from "../primitives/Modal.jsx";
import LogSpendModal from "../features/modals/LogSpendModal.jsx";
import { FAB_CHANGE_EVENT } from "../../constants/fabEvents.js";

const BillScannerTool = lazy(() => import("../features/tools/BillScannerTool.jsx"));

/** @param {{ to: string, navGroup?: string }} item @param {{ pathname: string }} location */
function isNavItemActive(item, location) {
  const path = location.pathname;
  if (item.navGroup === "ledger") {
    return (
      path.startsWith("/ledger") ||
      path.startsWith("/ledger/bills") ||
      path.startsWith("/ledger/spends") ||
      path === "/money/bills" ||
      path === "/money/spends" ||
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

function NavIcon({ item, active = false }) {
  if (item.icon === "+") {
    return <span className="ct-nav-fab-plus">+</span>;
  }
  return <CtIcon name={item.icon} size={22} context={active ? "nav" : "nav-off"} />;
}

function FabRadialMenu({ open, onClose, navTo, onScanBill, onRequestMoney }) {
  const { t } = useTranslation();
  if (!open) return null;

  return (
    <>
      <div className="ct-fab-overlay" onClick={onClose} aria-hidden />
      <div className="ct-fab-menu open" role="menu" aria-label={t("nav.fabAria")}>
        <button
          type="button"
          className="ct-fab-item"
          role="menuitem"
          onClick={() => {
            navTo("/add");
            onClose();
          }}
        >
          <CtIcon name="clipboard-text" size={16} />
          {t("nav.fabAddCommitment")}
        </button>
        <button
          type="button"
          className="ct-fab-item"
          role="menuitem"
          onClick={() => {
            onScanBill();
            onClose();
          }}
        >
          <CtIcon name="receipt" size={16} />
          {t("tools.billScanner.title")}
        </button>
        <button
          type="button"
          className="ct-fab-item"
          role="menuitem"
          onClick={() => {
            navTo("/ledger/spends");
            onClose();
          }}
        >
          <CtIcon name="fork-knife" size={16} />
          {t("nav.fabLogSpend")}
        </button>
        <button
          type="button"
          className="ct-fab-item"
          role="menuitem"
          onClick={() => {
            onRequestMoney();
            onClose();
          }}
        >
          <CtIcon name="handshake" size={16} />
          {t("nav.fabRequestMoney")}
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
  const [logSpendOpen, setLogSpendOpen] = useState(false);
  const [scanBillOpen, setScanBillOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const longPressTimerRef = useRef(/** @type {number | null} */ (null));
  const didLongPressRef = useRef(false);

  const navTo = useCallback((to) => {
    setFabOpen(false);
    setLogSpendOpen(false);
    setScanBillOpen(false);
    navigate(to);
  }, [navigate]);

  useEffect(() => {
    if (fabOpen) document.body.setAttribute("data-fab-open", "1");
    else document.body.removeAttribute("data-fab-open");
    window.dispatchEvent(new CustomEvent(FAB_CHANGE_EVENT, { detail: { open: fabOpen } }));
  }, [fabOpen]);

  const hideOnYouSubpage = location.pathname.startsWith("/you/");
  const hideOnInsightsSubpage = /^\/insights\/.+/.test(location.pathname);
  const navItems = navItemsForMode(resolveUserMode(settings));
  const navLabel = (item) => (item.labelKey ? t(item.labelKey) : item.label);

  const openRequestMoney = useCallback(() => {
    navigate("/agreements", { state: { openRequest: true } });
  }, [navigate]);

  if (hideOnYouSubpage || hideOnInsightsSubpage) return null;

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current != null) window.clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = null;
  };

  const openLogSpend = () => {
    didLongPressRef.current = true;
    setFabOpen(false);
    setLogSpendOpen(true);
  };

  const toggleFab = () => setFabOpen((v) => !v);
  const closeFab = () => setFabOpen(false);

  const fabPointerHandlers = {
    onPointerDown: () => {
      didLongPressRef.current = false;
      clearLongPressTimer();
      longPressTimerRef.current = window.setTimeout(() => {
        openLogSpend();
      }, 550);
    },
    onPointerUp: () => clearLongPressTimer(),
    onPointerCancel: () => clearLongPressTimer(),
    onPointerLeave: () => clearLongPressTimer(),
    onContextMenu: (e) => {
      e.preventDefault();
      clearLongPressTimer();
      openLogSpend();
    },
    onClick: () => {
      if (didLongPressRef.current) {
        didLongPressRef.current = false;
        return;
      }
      toggleFab();
    },
  };

  return (
    <>
      <FabRadialMenu
        open={fabOpen}
        onClose={closeFab}
        navTo={navTo}
        onScanBill={() => setScanBillOpen(true)}
        onRequestMoney={openRequestMoney}
      />

      <nav className="ct-bottom-nav ed-nav" aria-label={t("nav.mainAria")}>
        <div className="ct-bottom-nav-inner">
          {navItems.map((item) => {
            if (item.fab) {
              return (
                <div key={item.to} className="ct-nav-fab-slot">
                  <button type="button" className="ct-nav-fab" aria-label={t("nav.fabAria")} {...fabPointerHandlers}>
                    <span className="ct-nav-fab-icon">
                      <NavIcon item={item} active />
                    </span>
                  </button>
                </div>
              );
            }
            const active = isNavItemActive(item, location);
            return (
              <a
                key={item.to}
                href={item.to}
                onClick={(e) => { e.preventDefault(); navTo(item.to); }}
                className={cn("ct-nav-item", active && "ct-nav-item-active")}
              >
                <span className="ct-nav-icon">
                  <NavIcon item={item} active={active} />
                </span>
                <span className="ct-nav-label">{navLabel(item)}</span>
              </a>
            );
          })}
        </div>
      </nav>

      {logSpendOpen && (
        <LogSpendModal
          onClose={() => {
            setLogSpendOpen(false);
            didLongPressRef.current = false;
            clearLongPressTimer();
          }}
        />
      )}

      {scanBillOpen && (
        <Suspense fallback={null}>
          <Modal title={t("tools.billScanner.title")} onClose={() => setScanBillOpen(false)}>
            <BillScannerTool />
          </Modal>
        </Suspense>
      )}
    </>
  );
}

export default Navbar;
