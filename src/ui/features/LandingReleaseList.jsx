import { useEffect, useState } from "react";
import { useTranslation } from "../../i18n/I18nProvider.js";
import { fetchAppReleases, triggerApkDownload } from "../../utils/appReleases.js";
import { Body, Caption, Heading } from "../primitives/Text.jsx";
import { CtIcon } from "../icons/CtIcon.jsx";

function formatBuiltAt(iso, locale) {
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

/** Temporary landing list — pick a version to download while testing in-app updates. */
export default function LandingReleaseList() {
  const { t, locale } = useTranslation();
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = await fetchAppReleases();
      if (!cancelled) {
        setReleases(list);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="versions" className="ct-landing-section ct-landing-versions" aria-labelledby="landing-versions">
      <Heading level={2} id="landing-versions" className="ct-landing-section-title">
        {t("webLanding.versionsTitle")}
      </Heading>
      <Body className="ct-landing-versions-lede">{t("webLanding.versionsNote")}</Body>

      {loading ? (
        <Caption className="block mt-4">{t("webLanding.versionsLoading")}</Caption>
      ) : (
        <ul className="ct-landing-version-list">
          {releases.map((release) => {
            const title = release.label || release.version;
            const built = formatBuiltAt(release.builtAt, locale);
            return (
              <li key={release.version} className="ct-landing-version-card">
                <div className="ct-landing-version-head">
                  <span className="ct-landing-version-badge">{release.version}</span>
                  <div className="min-w-0">
                    <span className="ct-landing-version-title">{title}</span>
                    {built ? (
                      <Caption className="block mt-0.5">
                        {t("webLanding.versionBuilt", { date: built })}
                      </Caption>
                    ) : null}
                  </div>
                </div>
                <div className="ct-landing-version-actions">
                  {release.androidApkUrl ? (
                    <button
                      type="button"
                      className="ct-btn ct-btn-primary ct-btn-sm"
                      onClick={() => triggerApkDownload(release.androidApkUrl, release.version)}
                    >
                      <CtIcon name="device-mobile" size={16} weight="duotone" className="mr-1.5" />
                      {t("webLanding.versionDownloadApk")}
                    </button>
                  ) : null}
                  {release.webUrl ? (
                    <a
                      href={release.webUrl}
                      className="ct-btn ct-btn-outline ct-btn-sm"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <CtIcon name="cloud" size={16} weight="duotone" className="mr-1.5" />
                      {t("webLanding.versionOpenWeb")}
                    </a>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
