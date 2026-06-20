import { useEffect } from "react";
import { usePerovo } from "../context/PerovoContext.jsx";
import { applyColorScheme } from "../utils/theme.js";

/** Keeps document theme in sync with settings, OS (system), and tab restore. */
export default function ThemeSync() {
  const { settings } = usePerovo();
  const preference = settings.colorScheme || "dark";

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const sync = () => applyColorScheme(preference);

    sync();

    const onVisibility = () => {
      if (document.visibilityState === "visible") sync();
    };
    const onPageShow = () => sync();

    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pageshow", onPageShow);

    if (preference !== "system") {
      return () => {
        document.removeEventListener("visibilitychange", onVisibility);
        window.removeEventListener("pageshow", onPageShow);
      };
    }

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onMq = () => applyColorScheme("system");
    mq.addEventListener("change", onMq);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pageshow", onPageShow);
      mq.removeEventListener("change", onMq);
    };
  }, [preference]);

  return null;
}
