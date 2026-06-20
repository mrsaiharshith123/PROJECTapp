import { useEffect, useState } from "react";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { fetchSiteVersionInfo } from "../../utils/appReleases.js";
import { Caption } from "../primitives/Text.jsx";

function formatDeployTime(iso, locale) {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

/** Live deploy stamp from app-version.json (updates after each GitHub Pages ship). */
export default function LandingLastUpdated({ className = "" }) {
  const { t, locale } = useTranslation();
  const [info, setInfo] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchSiteVersionInfo().then((data) => {
      if (!cancelled) setInfo(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!info?.builtAt) return null;

  return (
    <Caption className={className}>
      {t("webLanding.lastUpdated", {
        date: formatDeployTime(info.builtAt, locale),
        version: info.version || "—",
      })}
    </Caption>
  );
}
