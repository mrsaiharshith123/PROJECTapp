import { NavLink, useNavigate } from "react-router-dom";
import { useCommitTrack } from "../../context/CommitTrackContext.jsx";
import { navItemsForMode } from "../../constants/userModes.js";
import { resolveUserMode } from "../../constants/modeExperience.js";
import { cn } from "../utils/cn.js";

function Brand() {
  return (
    <div className="ct-brand">
      <span className="ct-brand-mark" aria-hidden>
        💰
      </span>
      <span className="ct-brand-name">CommitTrack</span>
    </div>
  );
}

export function Navbar() {
  const navigate = useNavigate();
  const { settings } = useCommitTrack();
  const navItems = navItemsForMode(resolveUserMode(settings));
  const tabItems = navItems.filter((item) => !item.fab);
  const fabItem = navItems.find((item) => item.fab);

  return (
    <>
      <header className="ct-top-nav">
        <div className="ct-top-nav-inner">
          <Brand />
          <div className="ct-top-nav-links">
            {tabItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) => cn("ct-top-link", isActive && "ct-top-link-active")}
              >
                {label}
              </NavLink>
            ))}
            {fabItem && (
              <button type="button" className="ct-top-link ct-top-link-fab" onClick={() => navigate(fabItem.to)}>
                {fabItem.label}
              </button>
            )}
          </div>
        </div>
      </header>

      <nav className="ct-bottom-nav" aria-label="Main" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className="ct-bottom-nav-inner">
          {navItems.map((item) => {
            if (item.fab) {
              return (
                <div key={item.to} className="ct-nav-fab-slot">
                  <button
                    type="button"
                    className="ct-nav-fab"
                    aria-label="Add bill or lending"
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
                <span className="ct-nav-label">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}

export default Navbar;
