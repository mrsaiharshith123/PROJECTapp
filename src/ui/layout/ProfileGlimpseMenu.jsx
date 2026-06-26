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
 * Groww-style profile briefing — identity, net position, quick jumps.
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
      if (e.target.closest?.(".ct-app-header-avatar")) return;
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

  const menuRow = (icon, label, onClick) => (
    <button type="button" className="ct-profile-glimpse-row" onClick={onClick}>
      <span className={`ct-profile-glimpse-row-icon ${icon.tone || "muted"}`}>
        <CtIcon name={icon.name} size={18} />
      </span>
      <span className="ct-profile-glimpse-row-text">{label}</span>
      <CtIcon name="caret-right" size={14} className="ct-profile-glimpse-row-chevron" />
    </button>
  );

  return (
    <>
      <div className="ct-profile-glimpse-backdrop" aria-hidden onClick={onClose} />
      <div ref={panelRef} className="ct-profile-glimpse" role="dialog" aria-label={t("profileGlimpse.title")}>
        <div className="ct-profile-glimpse-head">
          <div className="ct-profile-glimpse-identity">
            <p className="ct-profile-glimpse-name">{name}</p>
            {email ? <p className="ct-profile-glimpse-email">{email}</p> : null}
          </div>
        </div>

        <button type="button" className="ct-profile-glimpse-balance" onClick={() => go("/ledger")}>
          <span className="ct-profile-glimpse-balance-icon">
            <CtIcon name="wallet" size={20} />
          </span>
          <span className="ct-profile-glimpse-balance-text">
            <span className="ct-profile-glimpse-balance-amount">{netDisplay}</span>
            <span className="ct-profile-glimpse-balance-sub">{t("profileGlimpse.netSub")}</span>
          </span>
          <CtIcon name="caret-right" size={14} className="ct-profile-glimpse-row-chevron" />
        </button>

        <div className="ct-profile-glimpse-divider" />

        {menuRow({ name: "user-circle", tone: "indigo" }, t("profileGlimpse.account"), () => go("/you"))}
        {menuRow({ name: "clipboard-text", tone: "rose" }, t("ledger.headerBills"), () => go("/ledger/bills"))}
        {menuRow({ name: "chart-bar", tone: "teal" }, t("nav.insights"), () => go("/insights"))}

        <div className="ct-profile-glimpse-foot">
          {isLoggedIn ? (
            <button
              type="button"
              className="ct-profile-glimpse-logout"
              onClick={async () => {
                onClose();
                await signOut();
              }}
            >
              {t("settings.row.signOut")}
            </button>
          ) : (
            <button type="button" className="ct-profile-glimpse-logout" onClick={() => go("/you")}>
              {t("profileGlimpse.openProfile")}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
