/** Map routes to modular OS labels for analytics. */
const ROUTE_MODULES = {
  "/": "home",
  "/commitments": "commitments",
  "/add": "add_bill",
  "/lending": "lending",
  "/analytics": "stability_reports",
  "/net-worth": "net_worth",
  "/tools": "planning",
  "/profile": "profile",
  "/onboarding": "onboarding",
  "/admin": "admin",
  "/privacy": "privacy",
};

/**
 * @param {string} pathname
 * @returns {string}
 */
export function moduleFromPath(pathname) {
  const path = String(pathname || "/").split("?")[0].split("#")[0] || "/";
  if (ROUTE_MODULES[path]) return ROUTE_MODULES[path];
  if (path.startsWith("/lend")) return "lending";
  return "other";
}

export const ANALYTICS_MODULES = Object.freeze({ ...ROUTE_MODULES });
