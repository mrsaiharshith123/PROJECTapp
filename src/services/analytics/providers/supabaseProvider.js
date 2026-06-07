import { getSupabaseClient } from "../../supabase/auth.js";
import { getAnalyticsSessionId } from "../sessionId.js";
import { log } from "../../../utils/logger.js";

/**
 * Default provider — persists minimal events to Supabase app_events.
 * @param {string} userId
 */
export function createSupabaseAnalyticsProvider(userId) {
  return {
    name: "supabase",
    /**
     * @param {string} eventName
     * @param {{ module?: string, step?: string, properties?: Record<string, unknown> }} [opts]
     */
    async track(eventName, opts = {}) {
      const supabase = getSupabaseClient();
      if (!supabase || !userId || !eventName) return;

      const row = {
        user_id: userId,
        event_name: eventName,
        module: opts.module || null,
        step: opts.step || null,
        properties: opts.properties && typeof opts.properties === "object" ? opts.properties : {},
        session_id: getAnalyticsSessionId(),
      };

      try {
        const { error } = await supabase.from("app_events").insert(row);
        if (error) log.auth.debug("Analytics insert skipped", { code: error.code });

        if (eventName === "session.heartbeat" || eventName === "session.start" || eventName === "module.open") {
          await supabase.rpc("touch_profile_activity").then(({ error: touchErr }) => {
            if (touchErr) log.auth.debug("Activity touch skipped", { code: touchErr.code });
          });
        }
      } catch {
        /* Never block product UX for analytics */
      }
    },
  };
}
