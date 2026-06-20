import { useEffect, useState } from "react";

/** Theme from `document.documentElement` — works without PerovoProvider (landing page). */
export function useDocumentTheme() {
  const read = () => (document.documentElement.dataset.theme === "light" ? "light" : "dark");

  const [theme, setTheme] = useState(() => (typeof document !== "undefined" ? read() : "dark"));

  useEffect(() => {
    const sync = () => setTheme(read());
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme", "class"],
    });
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", sync);
    return () => {
      obs.disconnect();
      mq.removeEventListener("change", sync);
    };
  }, []);

  return theme;
}
