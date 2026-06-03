import { useEffect } from "react";
import { useCommitTrack } from "../context/CommitTrackContext.jsx";
import { applyColorScheme } from "../utils/theme.js";

/** Keeps `html.dark` in sync with settings + OS preference when scheme is system. */
export default function ThemeSync() {
  const { settings } = useCommitTrack();
  const preference = settings.colorScheme || "system";

  useEffect(() => {
    applyColorScheme(preference);
    if (preference !== "system" || typeof window === "undefined") return undefined;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyColorScheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [preference]);

  return null;
}
