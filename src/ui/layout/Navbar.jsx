import { NavLink } from "react-router-dom";
import { useCommitTrack } from "../../context/CommitTrackContext.jsx";
import { navItemsForMode } from "../../constants/userModes.js";
import { resolveUserMode } from "../../constants/modeExperience.js";
import { cn } from "../utils/cn.js";

const NAV_COLS = { 3: "grid-cols-3", 4: "grid-cols-4" };

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
  const { settings } = useCommitTrack();
  const navItems = navItemsForMode(resolveUserMode(settings));
  const colClass = NAV_COLS[navItems.length] || "grid-cols-4";

  return (
    <>
      <header className="ct-top-nav">
        <div className="ct-top-nav-inner">
          <Brand />
          <div className="ct-top-nav-links">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) => cn("ct-top-link", isActive && "ct-top-link-active")}
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      <nav className="ct-bottom-nav" aria-label="Main" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        <div className={cn("ct-bottom-nav-inner", colClass)}>
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) => cn("ct-nav-item", isActive && "ct-nav-item-active")}
            >
              <span className="ct-nav-icon">{icon}</span>
              <span className="ct-nav-label">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}

export default Navbar;
