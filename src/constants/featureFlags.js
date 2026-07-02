/** Feature flags — set via VITE_* env at build time. */

/** Admin FAB + /admin route. Off in production unless explicitly enabled. */
export const ADMIN_UI_ENABLED =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_ADMIN === "true";
