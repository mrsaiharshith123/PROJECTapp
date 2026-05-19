import { NavLink } from "react-router-dom";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { navItemsForMode } from "../constants/userModes.js";
import { resolveUserMode } from "../constants/modeExperience.js";
import { isEnhancedUi } from "../constants/uiTheme.js";

const NAV_COLS = {
  3: "grid-cols-3",
  4: "grid-cols-4",
};

const Navbar = () => {
  const { settings } = useCommitTrack();
  const navItems = navItemsForMode(resolveUserMode(settings));
  const colClass = NAV_COLS[navItems.length] || "grid-cols-4";
  const enhanced = isEnhancedUi();

  return (
    <>
      <nav
        className={`hidden md:flex fixed top-0 left-0 right-0 z-50 border-b shadow-sm px-4 ${
          enhanced
            ? "ui-nav-desktop border-indigo-100/80 dark:border-slate-700/80"
            : "bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-700"
        }`}
      >
        <div className="max-w-2xl mx-auto w-full flex items-center justify-between gap-6 py-3.5">
          <Brand enhanced={enhanced} />
          <div className="flex items-center justify-end gap-1 sm:gap-2 flex-1 min-w-0">
            {navItems.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/"}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap shrink-0 ${
                    isActive
                      ? "text-indigo-600 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60"
                      : "text-gray-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-gray-50 dark:hover:bg-slate-800/60"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <nav
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 border-t shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.12)] ${
          enhanced
            ? "ui-nav-mobile"
            : "bg-white dark:bg-slate-900 border-gray-100 dark:border-slate-700"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className={`mx-auto w-full max-w-lg grid ${colClass} h-[4rem] items-stretch px-2 pt-1`}>
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `relative flex flex-col items-center justify-center gap-0.5 min-w-0 h-full rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-gray-400 dark:text-slate-500"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                  )}
                  <span className={`text-xl leading-none ${isActive ? "scale-110" : ""} transition-transform`}>
                    {icon}
                  </span>
                  <span className="text-[10px] font-semibold leading-tight text-center truncate w-full px-0.5">
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};

function Brand({ enhanced }) {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <span
        className={`flex items-center justify-center w-9 h-9 rounded-xl text-lg ${
          enhanced
            ? "bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/25"
            : "bg-indigo-50 dark:bg-indigo-950"
        }`}
        aria-hidden
      >
        💰
      </span>
      <span
        className={`text-lg font-bold text-gray-900 dark:text-slate-100 ${enhanced ? "font-display" : ""}`}
        style={enhanced ? undefined : { fontFamily: "'Sora', sans-serif" }}
      >
        CommitTrack
      </span>
    </div>
  );
}

export default Navbar;
