import { NavLink } from "react-router-dom";

const navItems = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/commitments", label: "Commitments", icon: "📋" },
  { to: "/add", label: "Add", icon: "➕" },
  { to: "/lending", label: "Lending", icon: "🤝" },
  { to: "/profile", label: "Profile", icon: "👤" },
];

const Navbar = () => {
  return (
    <>
      {/* Desktop Top Navbar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-100 shadow-sm px-8 py-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">💰</span>
          <span
            className="text-xl font-bold text-gray-900"
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            CommitTrack
          </span>
        </div>
        <div className="flex items-center gap-8">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `text-sm font-medium pb-1 border-b-2 transition-all duration-200 ${
                  isActive
                    ? "text-indigo-600 border-indigo-500"
                    : "text-gray-500 border-transparent hover:text-indigo-600 hover:border-indigo-300"
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Mobile Bottom Navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg px-2 py-2">
        <div className="flex items-center justify-around">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 ${
                  isActive ? "text-indigo-600" : "text-gray-400"
                }`
              }
            >
              <span className="text-xl">{icon}</span>
              <span className="text-xs font-medium">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
