import { useEffect } from "react";
import { applyColorScheme } from "../utils/theme.js";
import { loadSettingsFromStorage } from "../utils/migrateStorage.js";

/** Keeps landing page in sync with saved light/dark preference (no PerovoProvider). */
export default function MarketingThemeSync() {
  useEffect(() => {
    const pref = loadSettingsFromStorage()?.colorScheme || "system";
    applyColorScheme(pref);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      const current = loadSettingsFromStorage()?.colorScheme || "system";
      if (current === "system") applyColorScheme("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return null;
}
