import { NavLink, useNavigate } from "react-router-dom";
import { useCommitTrack } from "../../context/CommitTrackContext.jsx";
import { navItemsForMode } from "../../constants/userModes.js";
import { resolveUserMode } from "../../constants/modeExperience.js";
import { useTranslation } from "../../i18n/I18nProvider.jsx";
import { cn } from "../utils/cn.js";

function Brand() {
  const { t } = useTranslation();
  return (
    <div className="ct-brand">
      <span className="ct-brand-mark" aria-hidden>
        💰
      </span>
      <span className="ct-brand-text">
        <span className="ct-brand-name">{t("brand.appName")}</span>
        <span className="ct-brand-byline">{t("brand.byDaloyTech")}</span>
      </span>
    </div>
  );
}

export function Navbar() {
  const navigate = useNavigate();
  const { settings } = useCommitTrack();
  const { t } = useTranslation();
  const navItems = navItemsForMode(resolveUserMode(settings));
  const tabItems = navItems.filter((item) => !item.fab);
  const fabItem = navItems.find((item) => item.fab);
  const navLabel = (item) => (item.labelKey ? t(item.labelKey) : item.label);

  return (
    <>
      <header className="ct-top-nav">
        <div className="ct-top-nav-inner">
          <Brand />
          <div className="ct-top-nav-links">
            {tabItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => cn("ct-top-link", isActive && "ct-top-link-active")}
              >
                {navLabel(item)}
              </NavLink>
            ))}
            {fabItem && (
              <button type="button" className="ct-top-link ct-top-link-fab" onClick={() => navigate(fabItem.to)}>
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
                  <button
                    type="button"
                    className="ct-nav-fab"
                    aria-label={t("nav.fabAria")}
                    onClick={() => navigate(item.to)}
                  >
                    <span className="ct-nav-fab-icon">{item.icon}</span>
                  </button>
                </div>
              );
            }
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) => cn("ct-nav-item", isActive && "ct-nav-item-active")}
              >
                <span className="ct-nav-icon">{item.icon}</span>
                <span className="ct-nav-label">{navLabel(item)}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export default Navbar;
