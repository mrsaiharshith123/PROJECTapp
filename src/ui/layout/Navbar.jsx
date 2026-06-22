import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { usePerovo } from "../../context/PerovoContext.jsx";
import { navItemsForMode } from "../../constants/userModes.js";
import { resolveUserMode } from "../../constants/modeExperience.js";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { cn } from "../utils/cn.js";
import { CtIcon } from "../icons/CtIcon.jsx";
import { PerovoBrand } from "../brand/PerovoBrand.jsx";
import { Modal } from "../primitives/Modal.jsx";
import LogSpendModal from "../features/modals/LogSpendModal.jsx";
import { FAB_CHANGE_EVENT } from "../../constants/fabEvents.js";

const BillScannerTool = lazy(() => import("../features/tools/BillScannerTool.jsx"));

function Brand() {
  return (
    <div className="ct-brand">
      <PerovoBrand layout="row" iconSize="sm" wordmarkSize="xs" />
    </div>
  );
}

/** @param {{ to: string, navGroup?: string }} item @param {{ pathname: string }} location */
function isNavItemActive(item, location) {
  const path = location.pathname;
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

function FabRadialMenu({ open, onClose, navigate, onScanBill }) {
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
            navigate("/add");
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
            navigate("/money/spends");
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
            navigate("/money/lending");
            onClose();
          }}
        >
          <CtIcon name="handshake" size={16} />
          {t("nav.fabRecordLending")}
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

  useEffect(() => {
    if (fabOpen) document.body.setAttribute("data-fab-open", "1");
    else document.body.removeAttribute("data-fab-open");
    window.dispatchEvent(new CustomEvent(FAB_CHANGE_EVENT, { detail: { open: fabOpen } }));
  }, [fabOpen]);

  const hideOnYouSubpage = location.pathname.startsWith("/you/");
  const navItems = navItemsForMode(resolveUserMode(settings));
  const tabItems = navItems.filter((item) => !item.fab);
  const fabItem = navItems.find((item) => item.fab);
  const navLabel = (item) => (item.labelKey ? t(item.labelKey) : item.label);

  if (hideOnYouSubpage) return null;

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
        navigate={navigate}
        onScanBill={() => setScanBillOpen(true)}
      />

      <header className="ct-top-nav">
        <div className="ct-top-nav-inner">
          <Brand />
          <div className="ct-top-nav-links">
            {tabItems.map((item) => {
              const active = isNavItemActive(item, location);
              return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={cn("ct-top-link", active && "ct-top-link-active")}
              >
                {navLabel(item)}
              </NavLink>
            );
            })}
            {fabItem && (
              <button type="button" className="ct-top-link ct-top-link-fab" {...fabPointerHandlers}>
                {navLabel(fabItem)}
              </button>
            )}
          </div>
        </div>
      </header>

      <nav className="ct-bottom-nav" aria-label={t("nav.mainAria")} style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
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
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={cn("ct-nav-item", active && "ct-nav-item-active")}
              >
                <span className="ct-nav-icon">
                  <NavIcon item={item} active={active} />
                </span>
                <span className="ct-nav-label">{navLabel(item)}</span>
              </NavLink>
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
