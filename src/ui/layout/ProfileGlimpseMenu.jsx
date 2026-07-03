import { useCallback, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { usePerovo } from "../../context/PerovoContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNetWorth } from "../../context/NetWorthContext.jsx";
import { useNetWorthIntel } from "../../hooks/useNetWorthIntel.js";
import { usePrivacyAmount } from "../../hooks/usePrivacyAmount.js";
import { CtIcon } from "../icons/CtIcon.jsx";

/**
 * Editorial profile briefing — identity, net position, quick jumps.
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function ProfileGlimpseMenu({ open, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const { settings } = usePerovo();
  const { user, isLoggedIn, signOut } = useAuth();
  const { privacyMode } = useNetWorth();
  const intel = useNetWorthIntel();
  const { formatAmount } = usePrivacyAmount();

  const name = settings.displayName?.trim() || t("brand.defaultUser");
  const email = user?.email?.trim() || settings.email?.trim() || "";
  const netDisplay = privacyMode ? "••••••" : formatAmount(intel.core.netWorth);

  const go = useCallback(
    (path) => {
      onClose();
      navigate(path);
    },
    [navigate, onClose],
  );

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    const onPointer = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      if (e.target.closest?.(".ed-avatar")) return;
      onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open, onClose]);

  if (!open) return null;

  const menuItems = [
    { labelKey: "profileGlimpse.account", icon: "user-circle", path: "/you" },
    { labelKey: "ledger.headerBills", icon: "clipboard-text", path: "/ledger/bills" },
    { labelKey: "nav.insights", icon: "chart-bar", path: "/insights" },
  ];

  return (
    <>
      <div className="ed-backdrop" aria-hidden onClick={onClose} />
      <div ref={panelRef} className="ed-profile-sheet" role="dialog" aria-label={t("profileGlimpse.title")}>
        <div className="ed-sheet-header">
          <div>
            <div className="ed-value">{name}</div>
            {email ? <div className="ed-caption">{email}</div> : null}
          </div>
        </div>

        <div className="ed-sheet-body" style={{ padding: 0 }}>
          <button type="button" className="ed-row ed-row-press ed-profile-balance" onClick={() => go("/ledger")}>
            <div className="ed-row-left">
              <div className="ed-row-sub">{t("profileGlimpse.netSub")}</div>
              <div className="ed-display-sm ed-amount-gold">{netDisplay}</div>
            </div>
            <CtIcon name="caret-right" size={16} className="ed-icon-muted" />
          </button>

          <div className="ed-divider" />

          {menuItems.map((item) => (
            <button
              key={item.path}
              type="button"
              className="ed-row ed-row-press"
              style={{ padding: "12px 18px", width: "100%", textAlign: "left" }}
              onClick={() => go(item.path)}
            >
              <span className="ed-row-icon" style={{ width: 32, height: 32 }}>
                <CtIcon name={item.icon} size={16} />
              </span>
              <span className="ed-row-left">
                <span className="ed-row-title">{t(item.labelKey)}</span>
              </span>
              <CtIcon name="caret-right" size={14} className="ed-icon-muted" />
            </button>
          ))}
        </div>

        <div className="ed-sheet-footer">
          {isLoggedIn ? (
            <button
              type="button"
              className="ed-btn ed-btn-ghost ed-btn-block"
              onClick={async () => {
                onClose();
                await signOut();
              }}
            >
              {t("settings.row.signOut")}
            </button>
          ) : (
            <button type="button" className="ed-btn ed-btn-ghost ed-btn-block" onClick={() => go("/you")}>
              {t("profileGlimpse.openProfile")}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
