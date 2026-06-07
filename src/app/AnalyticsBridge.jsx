import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { setAnalyticsUser, clearAnalyticsUser } from "../services/analytics/analyticsHub.js";
import { trackEvent } from "../services/analytics/trackEvent.js";
import { ANALYTICS_EVENTS } from "../services/analytics/eventNames.js";
import { moduleFromPath } from "../services/analytics/modules.js";

const HEARTBEAT_MS = 5 * 60 * 1000;

/** Background product analytics — page views, sessions, module opens. */
export default function AnalyticsBridge() {
  const { isLoggedIn, user } = useAuth();
  const location = useLocation();
  const lastPath = useRef("");

  useEffect(() => {
    if (isLoggedIn && user?.id) {
      setAnalyticsUser(user.id);
      trackEvent(ANALYTICS_EVENTS.SESSION_START, { module: "session" });
    } else {
      clearAnalyticsUser();
    }
  }, [isLoggedIn, user?.id]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const path = location.pathname;
    if (path === lastPath.current) return;
    lastPath.current = path;
    const module = moduleFromPath(path);
    trackEvent(ANALYTICS_EVENTS.PAGE_VIEW, { module, properties: { path } });
    trackEvent(ANALYTICS_EVENTS.MODULE_OPEN, { module, properties: { path } });
  }, [isLoggedIn, location.pathname]);

  useEffect(() => {
    if (!isLoggedIn) return;
    const id = window.setInterval(() => {
      trackEvent(ANALYTICS_EVENTS.SESSION_HEARTBEAT, { module: "session" });
    }, HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, [isLoggedIn]);

  return null;
}
