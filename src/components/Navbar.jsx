import { useState } from "react";
import { NavLink } from "react-router-dom";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { useCommitIntel } from "../hooks/useCommitIntel.js";
import { navItemsForMode } from "../constants/userModes.js";
import NotificationPanel from "./NotificationPanel.jsx";

const Navbar = () => {
  const { settings } = useCommitTrack();
  const { notificationUnread } = useCommitIntel();
  const [showNotifications, setShowNotifications] = useState(false);
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
                    ? "text-indigo-600 border-indigo-500"
                    : "text-gray-500 border-transparent hover:text-indigo-600 hover:border-indigo-300"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          <NotificationBell count={notificationUnread} onClick={() => setShowNotifications((v) => !v)} />
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
                  isActive ? "text-indigo-600 bg-indigo-50/80" : "text-gray-400"
                }`
              }
            >
              <span className="text-lg leading-none">{icon}</span>
              <span className="text-[10px] font-medium leading-tight text-center">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>

      <MobileBell count={notificationUnread} onClick={() => setShowNotifications((v) => !v)} />

      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
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

function NotificationBell({ count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative hidden md:flex items-center justify-center w-10 h-10 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 shrink-0"
      aria-label="Notifications"
    >
      🔔
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

function MobileBell({ count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="md:hidden fixed top-4 right-4 z-[60] w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-600 shadow-sm text-lg"
      aria-label="Notifications"
    >
      🔔
      {count > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}

export default Navbar;
