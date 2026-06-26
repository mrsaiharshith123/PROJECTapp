import { useEffect, useRef } from "react";

/**
 * Reads a value from location.state exactly once on mount,
 * clears it from history so it won't re-trigger on re-renders,
 * and calls the callback with that value.
 *
 * Replaces the broken pattern:
 *   useEffect(() => {
 *     if (!location.state?.foo) return;
 *     navigate(location.pathname, { replace: true, state: {} });
 *   }, [location.state?.foo, location.pathname, navigate]);
 *
 * @param {string} stateKey
 * @param {(value: unknown) => void} callback
 */
export function useOnceFromState(stateKey, callback) {
  const handledRef = useRef(false);
  useEffect(() => {
    if (handledRef.current) return;
    const raw =
      window.history.state?.usr?.[stateKey] ?? window.history.state?.[stateKey];
    if (!raw) return;
    handledRef.current = true;
    const usr = { ...(window.history.state?.usr || {}) };
    delete usr[stateKey];
    window.history.replaceState(
      { ...window.history.state, usr },
      "",
      window.location.href,
    );
    callback(raw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
