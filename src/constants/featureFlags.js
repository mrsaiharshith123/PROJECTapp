/** Feature flags — set via VITE_* env at build time. */

/** Admin FAB + /admin route. Dev only — never enabled in production builds. */
export const ADMIN_UI_ENABLED =
  import.meta.env.DEV === true &&
  import.meta.env.VITE_ENABLE_ADMIN !== "false";
