import { useEffect, useRef } from "react";

/**
 * Briefly applies `ct-num-updated` when a numeric value changes.
 * @param {number | string} value
 * @param {import('react').RefObject<HTMLElement | null>} ref
 */
export function useNumericChange(value, ref) {
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current !== value && ref.current) {
      ref.current.classList.remove("ct-num-updated");
      void ref.current.offsetWidth;
      ref.current.classList.add("ct-num-updated");
      const t = window.setTimeout(() => {
        ref.current?.classList.remove("ct-num-updated");
      }, 650);
      prev.current = value;
      return () => window.clearTimeout(t);
    }
    prev.current = value;
    return undefined;
  }, [value, ref]);
}
