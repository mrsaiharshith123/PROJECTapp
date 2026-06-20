import { useEffect, useMemo, useState } from "react";
import { usePerovo } from "../context/PerovoContext.jsx";

function resolveFromPreference(preference, systemPrefersDark) {
  if (preference === "light") return "light";
  if (preference === "dark") return "dark";
  return systemPrefersDark ? "dark" : "light";
}

/** @returns {"light" | "dark"} */
export function useResolvedTheme() {
  const { settings } = usePerovo();
  const preference = settings.colorScheme || "system";

  const [systemPrefersDark, setSystemPrefersDark] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches,
  );

  useEffect(() => {
    if (preference !== "system" || typeof window === "undefined") return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setSystemPrefersDark(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference]);

  return useMemo(
    () => resolveFromPreference(preference, systemPrefersDark),
    [preference, systemPrefersDark],
  );
}
