import { useNavigate, useLocation } from "react-router-dom";
import { lazy, Suspense, useEffect, useRef, useState, useCallback } from "react";
import { usePerovo } from "../../context/PerovoContext.jsx";
import { navItemsForMode } from "../../constants/userModes.js";
import { resolveUserMode } from "../../constants/modeExperience.js";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { cn } from "../utils/cn.js";
import { CtIcon } from "../icons/CtIcon.jsx";
import { Modal } from "../primitives/Modal.jsx";
import { FAB_CHANGE_EVENT } from "../../constants/fabEvents.js";

const BillScannerTool = lazy(() => import("../features/tools/BillScannerTool.jsx"));

const NAV_SCROLL_DELTA_PX = 4;
const NAV_SCROLL_IDLE_MS = 160;

/** @param {EventTarget | null} target */
function readScrollTop(target) {
  if (!target || target === document) {
    return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }
  if (target === document.documentElement || target === document.body) {
    return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
  }
  if (target instanceof Element) return target.scrollTop;
  return 0;
}

function collectScrollRoots() {
  /** @type {Element[]} */
  const roots = [];
  const add = (el) => {
    if (el instanceof Element && !roots.includes(el)) roots.push(el);
  };
  add(document.documentElement);
  add(document.body);
  document.querySelectorAll(".dev-phone-screen, .ed-page-full, .ed-paper").forEach(add);
  return roots;
}

/** Hide bottom nav while scrolling; show again shortly after scroll stops. */
function useNavScrollHide(enabled, routeKey = "") {
  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef(0);
  const idleTimerRef = useRef(/** @type {number | null} */ (null));
  const tickingRef = useRef(false);
  const touchYRef = useRef(/** @type {number | null} */ (null));

  useEffect(() => {
    if (!enabled) {
      setHidden(false);
      return undefined;
    }

    const scheduleShow = () => {
      if (idleTimerRef.current != null) window.clearTimeout(idleTimerRef.current);
      idleTimerRef.current = window.setTimeout(() => {
        setHidden(false);
      }, NAV_SCROLL_IDLE_MS);
    };

    const hideNav = () => {
      setHidden(true);
      scheduleShow();
    };

    const onScroll = (e) => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(() => {
        tickingRef.current = false;
        const y = readScrollTop(e.target);
        const delta = y - lastYRef.current;

        if (y <= 8) {
          setHidden(false);
        } else if (Math.abs(delta) >= NAV_SCROLL_DELTA_PX) {
          hideNav();
          return;
        }

        lastYRef.current = y;
        scheduleShow();
      });
    };

    const onWheel = (e) => {
      if (Math.abs(e.deltaY) < 2 && Math.abs(e.deltaX) < 2) return;
      const y = readScrollTop(e.target instanceof Element ? e.target : document.documentElement);
      if (y <= 8 && e.deltaY < 0) return;
      hideNav();
    };

    const onTouchStart = (e) => {
      touchYRef.current = e.touches[0]?.clientY ?? null;
    };

    const onTouchMove = (e) => {
      const currentY = e.touches[0]?.clientY;
      if (currentY == null || touchYRef.current == null) return;
      if (Math.abs(currentY - touchYRef.current) < 6) return;
      touchYRef.current = currentY;
      hideNav();
    };

    const onTouchEnd = () => {
      touchYRef.current = null;
    };

    const roots = collectScrollRoots();
    document.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("wheel", onWheel, { passive: true, capture: true });
    document.addEventListener("touchstart", onTouchStart, { passive: true, capture: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true, capture: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true, capture: true });
    document.addEventListener("touchcancel", onTouchEnd, { passive: true, capture: true });
    roots.forEach((root) => root.addEventListener("scroll", onScroll, { passive: true }));

    return () => {
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("wheel", onWheel, true);
      document.removeEventListener("touchstart", onTouchStart, true);
      document.removeEventListener("touchmove", onTouchMove, true);
      document.removeEventListener("touchend", onTouchEnd, true);
      document.removeEventListener("touchcancel", onTouchEnd, true);
      roots.forEach((root) => root.removeEventListener("scroll", onScroll));
      if (idleTimerRef.current != null) window.clearTimeout(idleTimerRef.current);
    };
  }, [enabled, routeKey]);

  useEffect(() => {
    lastYRef.current = 0;
    setHidden(false);
  }, [enabled, routeKey]);

  return hidden;
}

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

function FabRadialMenu({ open, onClose, navTo, onScanBill, onRequestMoney }) {
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
  const [fabOpen, setFabOpen] = useState(false);

  const hideOnYouSubpage = location.pathname.startsWith("/you/");
  const hideOnInsightsSubpage = /^\/insights\/.+/.test(location.pathname);
  const navMounted = !hideOnYouSubpage && !hideOnInsightsSubpage;
  const navScrollHidden = useNavScrollHide(navMounted, location.pathname);

  const navTo = useCallback((to) => {
    setFabOpen(false);
    setScanBillOpen(false);
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
        onRequestMoney={openRequestMoney}
      />

      <nav className={cn("ed-nav", navScrollHidden && "ed-nav--hidden")} aria-label={t("nav.mainAria")}>
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
    </>
  );
}

export default Navbar;
