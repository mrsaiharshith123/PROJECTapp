import { NavLink } from "react-router-dom";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { navItemsForMode } from "../constants/userModes.js";

const Navbar = () => {
  const { settings } = useCommitTrack();
  const navItems = navItemsForMode(settings.userMode || "salaried");

  return (
    <>
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700 shadow-sm px-6 py-4 items-center justify-between gap-4">
        <Brand />
        <div className="flex items-center gap-4 lg:gap-6 overflow-x-auto no-scrollbar flex-1 justify-end min-w-0">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `text-sm font-medium pb-1 border-b-2 transition-all duration-200 whitespace-nowrap shrink-0 ${
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400 border-indigo-500 dark:border-indigo-400"
                    : "text-gray-500 dark:text-slate-400 border-transparent hover:text-indigo-600 dark:hover:text-indigo-300 hover:border-indigo-300"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700 shadow-lg px-1 py-1.5">
        <div className="flex overflow-x-auto no-scrollbar items-stretch gap-0.5 pb-safe">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 min-w-[4.25rem] shrink-0 px-1 py-1 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/80 dark:bg-indigo-950/60"
                    : "text-gray-400 dark:text-slate-500"
                }`
              }
            >
              <span className="text-lg leading-none">{icon}</span>
              <span className="text-[10px] font-medium leading-tight text-center">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};

function Brand() {
  return (
    <div className="flex items-center gap-2 shrink-0">
      <span className="text-2xl">💰</span>
      <span className="text-xl font-bold text-gray-900 dark:text-slate-100" style={{ fontFamily: "'Sora', sans-serif" }}>
        CommitTrack
      </span>
    </div>
  );
}

export default Navbar;
