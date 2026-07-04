import { useCallback, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { usePerovo } from "../../context/PerovoContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useNetWorth } from "../../context/NetWorthContext.jsx";
import { useNetWorthIntel } from "../../hooks/useNetWorthIntel.js";
import { usePrivacyAmount } from "../../hooks/usePrivacyAmount.js";
import { useResolvedTheme } from "../../hooks/useResolvedTheme.js";
import { resolveProfileAvatar } from "../../constants/profileAvatars.js";
import { applyColorScheme } from "../../utils/theme.js";
import { CtIcon } from "../icons/CtIcon.jsx";

/**
 * Groww-style profile card — drops from the masthead avatar (top-right), not a bottom sheet.
 * @param {{ open: boolean, onClose: () => void }} props
 */
export default function ProfileGlimpseMenu({ open, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const { settings, updateSettings } = usePerovo();
  const { user, isLoggedIn, signOut } = useAuth();
  const { privacyMode } = useNetWorth();
  const intel = useNetWorthIntel();
  const { formatAmount } = usePrivacyAmount();
  const theme = useResolvedTheme();

  const avatar = resolveProfileAvatar(settings);
  const name = settings.displayName?.trim() || t("brand.defaultUser");
  const email = user?.email?.trim() || settings.email?.trim() || "";
  const initial = avatar.initials.charAt(0) || "?";
  const netDisplay = privacyMode ? "••••••" : formatAmount(intel.core.netWorth);

  const go = useCallback(
    (path) => {
      onClose();
      navigate(path);
    },
    [navigate, onClose],
  );

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    updateSettings({ colorScheme: next });
    applyColorScheme(next);
  };

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

  const menuItems = useMemo(
    () => [
      { labelKey: "profileGlimpse.account", icon: "gear", path: "/you" },
      { labelKey: "ledger.headerBills", icon: "clipboard-text", path: "/ledger/bills" },
      { labelKey: "nav.insights", icon: "chart-bar", path: "/insights" },
    ],
    [],
  );

  if (!open) return null;

  return (
    <>
      <div className="ed-glimpse-backdrop" aria-hidden onClick={onClose} />
      <div ref={panelRef} className="ed-glimpse ed-glimpse--open" role="dialog" aria-label={t("profileGlimpse.title")}>
        <div className="ed-glimpse-head ed-glimpse-head--avatar">
          {avatar.imageUrl ? (
            <img src={avatar.imageUrl} alt="" className="ed-profile-avatar" />
          ) : (
            <div className="ed-profile-avatar-initial" aria-hidden>
              {initial}
            </div>
          )}
          <div className="ed-glimpse-head-text">
            <p className="ed-glimpse-name">{name}</p>
            {email ? <p className="ed-glimpse-email">{email}</p> : null}
          </div>
          <button
            type="button"
            className="ed-glimpse-gear"
            aria-label={t("settings.row.appearance")}
            onClick={() => go("/you/appearance")}
          >
            <CtIcon name="gear" size={18} />
          </button>
        </div>

        <button type="button" className="ed-glimpse-balance" onClick={() => go("/ledger")}>
          <span className="ed-glimpse-balance-icon">
            <CtIcon name="currency-inr" size={16} />
          </span>
          <span className="ed-glimpse-balance-text">
            <span className="ed-glimpse-balance-sub">{t("profileGlimpse.netSub")}</span>
            <span className="ed-glimpse-balance-amount">{netDisplay}</span>
          </span>
          <CtIcon name="caret-right" size={14} className="ed-icon-muted" />
        </button>

        {menuItems.map((item) => (
          <button key={item.path} type="button" className="ed-glimpse-row" onClick={() => go(item.path)}>
            <span className="ed-glimpse-row-icon">
              <CtIcon name={item.icon} size={16} />
            </span>
            <span className="ed-glimpse-row-text">{t(item.labelKey)}</span>
            <CtIcon name="caret-right" size={12} className="ed-icon-muted" />
          </button>
        ))}

        <div className="ed-glimpse-foot">
          <button type="button" className="ed-glimpse-theme" onClick={toggleTheme} aria-label={t("appearance.theme")}>
            <CtIcon name={theme === "dark" ? "moon" : "sun"} size={16} />
            <span>{theme === "dark" ? t("appearance.dark") : t("appearance.light")}</span>
          </button>
          {isLoggedIn ? (
            <button
              type="button"
              className="ed-glimpse-logout"
              onClick={async () => {
                onClose();
                await signOut();
              }}
            >
              {t("settings.row.signOut")}
            </button>
          ) : (
            <button type="button" className="ed-glimpse-logout" onClick={() => go("/you")}>
              {t("profileGlimpse.openProfile")}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
