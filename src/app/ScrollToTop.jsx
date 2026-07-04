import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import { applyColorScheme } from "../utils/theme.js";

/**
 * Reset scroll on route changes + force a browser repaint.
 *
 * Without the repaint trigger, Chrome's GPU compositor (promoted by the
 * fixed bottom nav's backdrop-filter) holds a stale layer after React commits.
 * The page looks frozen until an unrelated event (e.g. alt-tab → visibilitychange
 * → applyColorScheme) forces a style recalc. We replicate exactly that here.
 */
export default function ScrollToTop() {
  const { pathname, key } = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.querySelector(".ed-main")?.scrollTo?.(0, 0);

    // Re-apply current theme — changes root.style.colorScheme which is a real
    // CSS property change that forces Chrome to repaint the entire frame.
    const theme = (document.documentElement.dataset.theme || "dark");
    applyColorScheme(theme === "light" ? "light" : "dark");
  }, [pathname, key]);

  return null;
}
