import { useEffect, useRef } from "react";

/**
 * Traps Tab/Shift+Tab focus inside the returned ref's subtree while `active`
 * is true, and focuses the first focusable element on mount. Use on any
 * overlay/dialog-shaped UI (modal, drawer, popover menu) so keyboard users
 * can't tab out into background content — attach the returned ref to the
 * overlay's outermost focusable container.
 *
 * @param {boolean} active
 */
export function useFocusTrap(active) {
  const panelRef = useRef(null);

  useEffect(() => {
    if (!active || !panelRef.current) return undefined;

    const focusable = panelRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    first?.focus();

    function onKey(e) {
      if (e.key !== "Tab") return;
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [active]);

  return panelRef;
}
