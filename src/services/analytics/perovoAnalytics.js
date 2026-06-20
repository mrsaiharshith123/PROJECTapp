import posthog from "posthog-js";
import { trackProductEvent } from "./analyticsHub.js";

export const EVENTS = {
  COMMITMENT_ADDED: "commitment_added",
  BILL_SCANNED: "bill_scanned",
  LENDING_CREATED: "lending_created",
  AGREEMENT_DOWNLOADED: "agreement_downloaded",
  ESIGN_STARTED: "esign_started",
  GOAL_COMPLETED: "goal_completed",
  LOAN_CLEARED: "loan_cleared",
  PLAN_UPGRADED: "plan_upgraded",
  HOUSEHOLD_JOINED: "household_joined",
  FAMILY_REPORT_SHARED: "family_report_shared",
  TOOL_OPENED: "tool_opened",
};

function posthogReady() {
  try {
    return typeof posthog?.capture === "function" && posthog.__loaded;
  } catch {
    return false;
  }
}

export function identifyUser(userId, properties = {}) {
  if (posthogReady()) {
    posthog.identify(userId, properties);
  }
}

export function trackEvent(eventName, properties = {}) {
  trackProductEvent(eventName, { properties });
  if (posthogReady()) {
    posthog.capture(eventName, properties);
  }
}

export function trackScreen(screenName) {
  trackEvent("$pageview", { $current_url: screenName });
}
